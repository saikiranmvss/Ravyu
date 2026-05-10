import { Router } from "express";
import { db, reviewsTable, businessProfilesTable, reviewInsightsTable, usersTable } from "@workspace/db";
import { eq, and, desc, ilike, or } from "drizzle-orm";
import { ScrapeReviewsBody, GetReviewsQueryParams, DeleteReviewParams } from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../lib/auth";
import { normalizeIndustry } from "../lib/feature-flags";
import { extractInsightsFromReview } from "../lib/industry-intelligence";

const router = Router();

async function upsertReviewInsightsForUser(userId: number) {
  const [profile] = await db.select().from(businessProfilesTable).where(eq(businessProfilesTable.userId, userId)).limit(1);
  if (!profile) return;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  const industry = normalizeIndustry(user?.industry);
  const reviews = await db.select().from(reviewsTable).where(eq(reviewsTable.userId, userId));
  await db.delete(reviewInsightsTable).where(eq(reviewInsightsTable.userId, userId));
  const insightRows = reviews.flatMap((review) =>
    extractInsightsFromReview(review.text, industry).map((insight) => ({
      reviewId: review.id,
      businessId: profile.id,
      userId,
      industry,
      entityName: insight.entityName,
      aspect: insight.aspect,
      sentiment: insight.sentiment,
      reason: insight.reason,
      confidence: insight.confidence,
      severity: insight.severity,
    })),
  );
  if (insightRows.length > 0) {
    await db.insert(reviewInsightsTable).values(insightRows);
  }
}

router.get("/", requireAuth, async (req: AuthRequest, res) => {
  const params = GetReviewsQueryParams.safeParse(req.query);
  const { rating, search, limit = 50, offset = 0 } = params.success ? params.data : {};

  let query = db.select().from(reviewsTable).where(eq(reviewsTable.userId, req.userId!));

  const conditions = [eq(reviewsTable.userId, req.userId!)];
  if (rating) conditions.push(eq(reviewsTable.rating, Number(rating)));
  if (search) {
    const rows = await db
      .select()
      .from(reviewsTable)
      .where(
        and(
          eq(reviewsTable.userId, req.userId!),
          or(
            ilike(reviewsTable.author, `%${search}%`),
            ilike(reviewsTable.text, `%${search}%`),
          ),
        ),
      )
      .orderBy(desc(reviewsTable.createdAt))
      .limit(limit ?? 50)
      .offset(offset ?? 0);
    res.json({ reviews: rows, total: rows.length });
    return;
  }

  const rows = await db
    .select()
    .from(reviewsTable)
    .where(and(...conditions))
    .orderBy(desc(reviewsTable.createdAt))
    .limit(limit ?? 50)
    .offset(offset ?? 0);

  const total = rows.length;
  res.json({ reviews: rows, total });
});

router.post("/scrape", requireAuth, async (req: AuthRequest, res) => {
  const parse = ScrapeReviewsBody.safeParse(req.body);
  if (!parse.success) { res.status(400).json({ error: "Invalid request body" }); return; }
  const { mapsUrl, maxReviews = 100 } = parse.data;

  const validDomains = ["google.com/maps", "maps.google.com", "goo.gl", "maps.app.goo.gl"];
  const isValid = validDomains.some((d) => mapsUrl.includes(d));
  if (!isValid) { res.status(400).json({ error: "Invalid Google Maps URL" }); return; }

  const APIFY_TOKEN = process.env.APIFY_TOKEN;
  if (!APIFY_TOKEN) {
    // Demo mode: generate sample reviews
    const sampleAuthors = ["Sarah M.", "James T.", "Emily R.", "Michael B.", "Jennifer K.", "David L.", "Amanda S.", "Robert H."];
    const sampleTexts = [
      "Absolutely love this place! The service is top-notch and the quality is unmatched.",
      "Great experience overall. Will definitely come back again soon.",
      "Very professional team. They went above and beyond to help us.",
      "Outstanding service! Highly recommend to anyone looking for quality.",
      "Decent experience but there is room for improvement in response time.",
      "The staff is incredibly helpful and knowledgeable. Five stars!",
      "Good value for the price. We have been coming here for years.",
      "Impressive attention to detail. The team truly cares about customers.",
    ];
    const cap = Math.min(Number(maxReviews), 500, sampleAuthors.length);
    const toInsert = sampleAuthors.slice(0, cap).map((author, i) => ({
      userId: req.userId!,
      author,
      rating: [5, 5, 5, 4, 3, 5, 4, 5][i] ?? 5,
      text: sampleTexts[i] ?? "Great experience!",
      date: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      sourceUrl: mapsUrl,
    }));
    await db.insert(reviewsTable).values(toInsert);
    await upsertReviewInsightsForUser(req.userId!);
    res.json({ imported: toInsert.length, total: toInsert.length, message: "Demo mode: sample reviews imported" });
    return;
  }

  try {
    const runRes = await fetch(`https://api.apify.com/v2/acts/compass~crawler-google-places/runs?token=${APIFY_TOKEN}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startUrls: [{ url: mapsUrl }],
        maxReviews: Math.min(Number(maxReviews), 500),
        reviewsSort: "newest",
        language: "en",
      }),
    });
    if (!runRes.ok) throw new Error("Apify run failed");
    const runData = await runRes.json() as { data: { id: string } };
    const runId = runData.data.id;

    // Poll until finished (max 60s)
    let attempts = 0;
    let dataset: unknown[] = [];
    while (attempts < 12) {
      await new Promise((r) => setTimeout(r, 5000));
      const statusRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`);
      const statusData = await statusRes.json() as { data: { status: string; defaultDatasetId: string } };
      if (statusData.data.status === "SUCCEEDED") {
        const dataRes = await fetch(`https://api.apify.com/v2/datasets/${statusData.data.defaultDatasetId}/items?token=${APIFY_TOKEN}`);
        const raw = await dataRes.json() as Array<{ reviews?: Array<{ name: string; stars: number; text: string; publishAt: string; reviewUrl: string }> }>;
        dataset = raw[0]?.reviews ?? [];
        break;
      }
      attempts++;
    }

    const toInsert = (dataset as Array<{ name: string; stars: number; text: string; publishAt: string; reviewUrl: string }>)
      .slice(0, Math.min(Number(maxReviews), 500))
      .map((r) => ({
        userId: req.userId!,
        author: r.name ?? "Anonymous",
        rating: Math.min(5, Math.max(1, r.stars ?? 5)),
        text: r.text ?? "",
        date: r.publishAt ?? new Date().toLocaleDateString(),
        sourceUrl: r.reviewUrl ?? mapsUrl,
      }));

    if (toInsert.length > 0) {
      await db.insert(reviewsTable).values(toInsert);
      await upsertReviewInsightsForUser(req.userId!);
    }
    res.json({ imported: toInsert.length, total: toInsert.length, message: "Reviews imported successfully" });
  } catch (err) {
    req.log.error({ err }, "Scrape failed");
    res.status(500).json({ error: "Scrape failed" });
  }
});

router.delete("/:id", requireAuth, async (req: AuthRequest, res) => {
  const parse = DeleteReviewParams.safeParse({ id: Number(req.params.id) });
  if (!parse.success) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(reviewsTable).where(
    and(eq(reviewsTable.id, parse.data.id), eq(reviewsTable.userId, req.userId!)),
  );
  await upsertReviewInsightsForUser(req.userId!);
  res.status(204).end();
});

router.post("/recompute-insights", requireAuth, async (req: AuthRequest, res) => {
  await upsertReviewInsightsForUser(req.userId!);
  res.json({ ok: true });
});

export default router;
