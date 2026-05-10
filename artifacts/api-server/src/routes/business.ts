import { Router } from "express";
import {
  db,
  businessProfilesTable,
  businessServicesTable,
  reviewsTable,
  reviewInsightsTable,
  industryProfilesTable,
  usersTable,
  weeklyReportsTable,
} from "@workspace/db";
import { eq, desc, avg, count, and } from "drizzle-orm";
import {
  CreateBusinessProfileBody,
  UpdateBusinessProfileBody,
  CreateBusinessServiceBody,
  UpdateBusinessServiceBody,
  UpdateBusinessServiceParams,
  DeleteBusinessServiceParams,
} from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../lib/auth";
import { slugify } from "../lib/slugify";
import { buildActionSuggestions, type InsightRecord } from "../lib/industry-intelligence";
import { normalizeIndustry } from "../lib/feature-flags";

const router = Router();

// ── Dashboard ──────────────────────────────────────────────────────────────
router.get("/dashboard", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const reviews = await db.select().from(reviewsTable).where(eq(reviewsTable.userId, userId));

  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / totalReviews) * 10) / 10
    : 0;

  const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of reviews) dist[r.rating] = (dist[r.rating] ?? 0) + 1;
  const ratingDistribution = [1, 2, 3, 4, 5].map((rating) => ({ rating, count: dist[rating] ?? 0 }));

  const recentReviews = [...reviews]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const positiveReviews = reviews.filter((r) => r.rating >= 4).length;
  const negativeReviews = reviews.filter((r) => r.rating <= 2).length;

  // Request funnel from business profile
  const [profile] = await db
    .select()
    .from(businessProfilesTable)
    .where(eq(businessProfilesTable.userId, userId))
    .limit(1);

  let requestFunnel = { pending: 0, sent: 0, opened: 0, completed: 0 };
  let totalRequests = 0;
  if (profile) {
    const { reviewRequestsTable } = await import("@workspace/db");
    const requests = await db.select().from(reviewRequestsTable).where(eq(reviewRequestsTable.businessId, profile.id));
    totalRequests = requests.length;
    for (const r of requests) {
      requestFunnel[r.status as keyof typeof requestFunnel] =
        (requestFunnel[r.status as keyof typeof requestFunnel] ?? 0) + 1;
    }
  }

  const insights = profile
    ? await db.select().from(reviewInsightsTable).where(eq(reviewInsightsTable.businessId, profile.id))
    : [];
  const actionSuggestions = buildActionSuggestions(
    insights.slice(0, 20).map((i) => ({
      entityName: i.entityName,
      aspect: i.aspect,
      sentiment: i.sentiment as "positive" | "neutral" | "negative",
      reason: i.reason ?? "",
      confidence: Number(i.confidence),
      severity: i.severity as "low" | "medium" | "high",
    })),
    normalizeIndustry((await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1))[0]?.industry),
  );

  res.json({
    totalReviews,
    averageRating,
    ratingDistribution,
    recentReviews,
    requestFunnel,
    totalRequests,
    positiveReviews,
    negativeReviews,
    actionSuggestions,
  });
});

router.get("/industry-profile", requireAuth, async (req: AuthRequest, res) => {
  const [profile] = await db.select().from(businessProfilesTable).where(eq(businessProfilesTable.userId, req.userId!)).limit(1);
  if (!profile) {
    res.status(404).json({ error: "No business profile" });
    return;
  }
  const [industryProfile] = await db
    .select()
    .from(industryProfilesTable)
    .where(eq(industryProfilesTable.businessId, profile.id))
    .limit(1);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
  res.json(
    industryProfile ?? {
      businessId: profile.id,
      industry: normalizeIndustry(user?.industry),
      subIndustry: null,
      riskSensitiveMode: normalizeIndustry(user?.industry) === "healthcare",
      multiOutlet: false,
    },
  );
});

router.put("/industry-profile", requireAuth, async (req: AuthRequest, res) => {
  const body = req.body as {
    industry?: string;
    subIndustry?: string | null;
    riskSensitiveMode?: boolean;
    multiOutlet?: boolean;
  };
  const [profile] = await db.select().from(businessProfilesTable).where(eq(businessProfilesTable.userId, req.userId!)).limit(1);
  if (!profile) {
    res.status(404).json({ error: "No business profile" });
    return;
  }
  const payload = {
    industry: normalizeIndustry(body.industry),
    subIndustry: body.subIndustry ?? null,
    riskSensitiveMode: Boolean(body.riskSensitiveMode),
    multiOutlet: Boolean(body.multiOutlet),
    updatedAt: new Date(),
  };
  const [existing] = await db.select().from(industryProfilesTable).where(eq(industryProfilesTable.businessId, profile.id)).limit(1);
  if (existing) {
    await db.update(industryProfilesTable).set(payload).where(eq(industryProfilesTable.businessId, profile.id));
  } else {
    await db.insert(industryProfilesTable).values({ ...payload, businessId: profile.id, createdAt: new Date() });
  }
  const [updated] = await db.select().from(industryProfilesTable).where(eq(industryProfilesTable.businessId, profile.id)).limit(1);
  res.json(updated);
});

// ── Business Profile ───────────────────────────────────────────────────────
router.get("/profile", requireAuth, async (req: AuthRequest, res) => {
  const [profile] = await db
    .select()
    .from(businessProfilesTable)
    .where(eq(businessProfilesTable.userId, req.userId!))
    .limit(1);
  if (!profile) { res.status(404).json({ error: "No business profile" }); return; }
  res.json(profile);
});

router.post("/profile", requireAuth, async (req: AuthRequest, res) => {
  const parse = CreateBusinessProfileBody.safeParse(req.body);
  if (!parse.success) { res.status(400).json({ error: "Validation error", details: parse.error.issues }); return; }

  const existing = await db.select().from(businessProfilesTable).where(eq(businessProfilesTable.userId, req.userId!)).limit(1);
  if (existing.length > 0) { res.status(400).json({ error: "Profile already exists" }); return; }

  let slug = slugify(parse.data.businessName);
  const slugConflict = await db.select().from(businessProfilesTable).where(eq(businessProfilesTable.slug, slug)).limit(1);
  if (slugConflict.length > 0) slug = `${slug}-${Date.now()}`;

  const inserted = await db
    .insert(businessProfilesTable)
    .values({ ...parse.data, userId: req.userId!, slug })
    .$returningId();
  const [profile] = await db
    .select()
    .from(businessProfilesTable)
    .where(eq(businessProfilesTable.id, inserted[0]!.id))
    .limit(1);
  res.status(201).json(profile);
});

router.put("/profile", requireAuth, async (req: AuthRequest, res) => {
  const parse = UpdateBusinessProfileBody.safeParse(req.body);
  if (!parse.success) { res.status(400).json({ error: "Validation error" }); return; }
  await db
    .update(businessProfilesTable)
    .set({ ...parse.data, updatedAt: new Date() })
    .where(eq(businessProfilesTable.userId, req.userId!));
  const [profile] = await db
    .select()
    .from(businessProfilesTable)
    .where(eq(businessProfilesTable.userId, req.userId!))
    .limit(1);
  if (!profile) { res.status(404).json({ error: "No business profile" }); return; }
  res.json(profile);
});

// ── Business Services ──────────────────────────────────────────────────────
router.get("/services", requireAuth, async (req: AuthRequest, res) => {
  const [profile] = await db.select().from(businessProfilesTable).where(eq(businessProfilesTable.userId, req.userId!)).limit(1);
  if (!profile) { res.json([]); return; }
  const services = await db.select().from(businessServicesTable).where(eq(businessServicesTable.businessId, profile.id));
  res.json(services);
});

router.post("/services", requireAuth, async (req: AuthRequest, res) => {
  const parse = CreateBusinessServiceBody.safeParse(req.body);
  if (!parse.success) { res.status(400).json({ error: "Validation error" }); return; }
  const [profile] = await db.select().from(businessProfilesTable).where(eq(businessProfilesTable.userId, req.userId!)).limit(1);
  if (!profile) { res.status(400).json({ error: "Create a business profile first" }); return; }
  const inserted = await db
    .insert(businessServicesTable)
    .values({ ...parse.data, businessId: profile.id })
    .$returningId();
  const [service] = await db
    .select()
    .from(businessServicesTable)
    .where(eq(businessServicesTable.id, inserted[0]!.id))
    .limit(1);
  res.status(201).json(service);
});

router.put("/services/:id", requireAuth, async (req: AuthRequest, res) => {
  const paramsCheck = UpdateBusinessServiceParams.safeParse({ id: Number(req.params.id) });
  const parse = UpdateBusinessServiceBody.safeParse(req.body);
  if (!paramsCheck.success || !parse.success) { res.status(400).json({ error: "Validation error" }); return; }
  const [profile] = await db.select().from(businessProfilesTable).where(eq(businessProfilesTable.userId, req.userId!)).limit(1);
  if (!profile) { res.status(404).json({ error: "No business profile" }); return; }
  await db
    .update(businessServicesTable)
    .set(parse.data)
    .where(and(eq(businessServicesTable.id, paramsCheck.data.id), eq(businessServicesTable.businessId, profile.id)));
  const [service] = await db
    .select()
    .from(businessServicesTable)
    .where(and(eq(businessServicesTable.id, paramsCheck.data.id), eq(businessServicesTable.businessId, profile.id)))
    .limit(1);
  if (!service) { res.status(404).json({ error: "Service not found" }); return; }
  res.json(service);
});

router.delete("/services/:id", requireAuth, async (req: AuthRequest, res) => {
  const paramsCheck = DeleteBusinessServiceParams.safeParse({ id: Number(req.params.id) });
  if (!paramsCheck.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const [profile] = await db.select().from(businessProfilesTable).where(eq(businessProfilesTable.userId, req.userId!)).limit(1);
  if (!profile) { res.status(404).json({ error: "No business profile" }); return; }
  await db.delete(businessServicesTable).where(
    and(eq(businessServicesTable.id, paramsCheck.data.id), eq(businessServicesTable.businessId, profile.id)),
  );
  res.status(204).end();
});

// ── Analytics ──────────────────────────────────────────────────────────────
router.get("/analytics", requireAuth, async (req: AuthRequest, res) => {
  const [profile] = await db.select().from(businessProfilesTable).where(eq(businessProfilesTable.userId, req.userId!)).limit(1);
  if (!profile) {
    res.json({ pageViews: 0, reviewClicks: 0, conversionRate: 0, slug: null, publicUrl: null });
    return;
  }
  const conversionRate = profile.pageViews > 0
    ? Math.round((profile.reviewClicks / profile.pageViews) * 100 * 10) / 10
    : 0;
  res.json({
    pageViews: profile.pageViews,
    reviewClicks: profile.reviewClicks,
    conversionRate,
    slug: profile.slug,
    publicUrl: `/b/${profile.slug}`,
  });
});

// ── Reports ────────────────────────────────────────────────────────────────
router.get("/reports", requireAuth, async (req: AuthRequest, res) => {
  const reviews = await db.select().from(reviewsTable).where(eq(reviewsTable.userId, req.userId!));
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / totalReviews) * 10) / 10
    : 0;
  const positiveCount = reviews.filter((r) => r.rating >= 4).length;
  const neutralCount = reviews.filter((r) => r.rating === 3).length;
  const negativeCount = reviews.filter((r) => r.rating <= 2).length;
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const last7DaysCount = reviews.filter((r) => new Date(r.createdAt) >= sevenDaysAgo).length;
  const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of reviews) dist[r.rating] = (dist[r.rating] ?? 0) + 1;
  const ratingDistribution = [1, 2, 3, 4, 5].map((rating) => ({ rating, count: dist[rating] ?? 0 }));
  const authorCounts: Record<string, number> = {};
  for (const r of reviews) authorCounts[r.author] = (authorCounts[r.author] ?? 0) + 1;
  const topAuthors = Object.entries(authorCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([author, count]) => ({ author, count }));
  res.json({ totalReviews, averageRating, positiveCount, neutralCount, negativeCount, last7DaysCount, ratingDistribution, topAuthors });
});

router.get("/reports/industry", requireAuth, async (req: AuthRequest, res) => {
  const window = Number(req.query.window ?? 30);
  const [profile] = await db.select().from(businessProfilesTable).where(eq(businessProfilesTable.userId, req.userId!)).limit(1);
  if (!profile) {
    res.json({
      industry: "other",
      topPraisedItems: [],
      topComplainedItems: [],
      mixedItems: [],
      aspectBreakdown: [],
      trend: { positive: 0, neutral: 0, negative: 0 },
      actionSuggestions: [],
      riskAlerts: [],
      weeklyReport: null,
    });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
  const industry = normalizeIndustry(user?.industry);
  const from = new Date(Date.now() - window * 24 * 60 * 60 * 1000);
  const insights = await db.select().from(reviewInsightsTable).where(eq(reviewInsightsTable.businessId, profile.id));
  const filtered = insights.filter((i) => new Date(i.createdAt) >= from);
  const trend = {
    positive: filtered.filter((i) => i.sentiment === "positive").length,
    neutral: filtered.filter((i) => i.sentiment === "neutral").length,
    negative: filtered.filter((i) => i.sentiment === "negative").length,
  };
  const byEntity = new Map<string, { pos: number; neg: number }>();
  for (const i of filtered) {
    const key = i.entityName ?? i.aspect;
    const bucket = byEntity.get(key) ?? { pos: 0, neg: 0 };
    if (i.sentiment === "positive") bucket.pos += 1;
    if (i.sentiment === "negative") bucket.neg += 1;
    byEntity.set(key, bucket);
  }
  const ranked = [...byEntity.entries()].map(([name, val]) => ({ name, ...val }));
  const topPraisedItems = ranked.sort((a, b) => b.pos - a.pos).slice(0, 5);
  const topComplainedItems = ranked.sort((a, b) => b.neg - a.neg).slice(0, 5);
  const mixedItems = ranked.filter((r) => r.pos > 0 && r.neg > 0).slice(0, 5);
  const aspectMap = new Map<string, { positive: number; neutral: number; negative: number }>();
  for (const i of filtered) {
    const bucket = aspectMap.get(i.aspect) ?? { positive: 0, neutral: 0, negative: 0 };
    if (i.sentiment === "positive") bucket.positive += 1;
    if (i.sentiment === "neutral") bucket.neutral += 1;
    if (i.sentiment === "negative") bucket.negative += 1;
    aspectMap.set(i.aspect, bucket);
  }
  const aspectBreakdown = [...aspectMap.entries()].map(([aspect, counts]) => ({ aspect, ...counts }));
  const suggestionInput: InsightRecord[] = filtered.map((i) => ({
    entityName: i.entityName,
    aspect: i.aspect,
    sentiment: i.sentiment as "positive" | "neutral" | "negative",
    reason: i.reason ?? "",
    confidence: Number(i.confidence),
    severity: i.severity as "low" | "medium" | "high",
  }));
  const actionSuggestions = buildActionSuggestions(suggestionInput, industry);
  const riskAlerts = filtered
    .filter((i) => i.severity === "high" || /legal|safety|unsafe|billing|fraud|infection/i.test(i.reason ?? ""))
    .slice(0, 5)
    .map((i) => ({ aspect: i.aspect, reason: i.reason, severity: i.severity }));
  const [weeklyReport] = await db
    .select()
    .from(weeklyReportsTable)
    .where(eq(weeklyReportsTable.businessId, profile.id))
    .orderBy(desc(weeklyReportsTable.createdAt))
    .limit(1);
  res.json({
    industry,
    topPraisedItems,
    topComplainedItems,
    mixedItems,
    aspectBreakdown,
    trend,
    actionSuggestions,
    riskAlerts,
    weeklyReport: weeklyReport ?? null,
  });
});

router.post("/reports/weekly/generate", requireAuth, async (req: AuthRequest, res) => {
  const [profile] = await db.select().from(businessProfilesTable).where(eq(businessProfilesTable.userId, req.userId!)).limit(1);
  if (!profile) {
    res.status(404).json({ error: "No business profile" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
  const industry = normalizeIndustry(user?.industry);
  const periodEnd = new Date();
  const periodStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const insights = await db.select().from(reviewInsightsTable).where(eq(reviewInsightsTable.businessId, profile.id));
  const recent = insights.filter((i) => new Date(i.createdAt) >= periodStart);
  const positives = recent.filter((i) => i.sentiment === "positive").length;
  const negatives = recent.filter((i) => i.sentiment === "negative").length;
  const topWins = recent.filter((i) => i.sentiment === "positive").slice(0, 3).map((i) => `${i.aspect}${i.entityName ? ` (${i.entityName})` : ""}`);
  const attentionAreas = recent.filter((i) => i.sentiment === "negative").slice(0, 3).map((i) => `${i.aspect}${i.entityName ? ` (${i.entityName})` : ""}`);
  const suggestions = buildActionSuggestions(
    recent.map((i) => ({
      entityName: i.entityName,
      aspect: i.aspect,
      sentiment: i.sentiment as "positive" | "neutral" | "negative",
      reason: i.reason ?? "",
      confidence: Number(i.confidence),
      severity: i.severity as "low" | "medium" | "high",
    })),
    industry,
  );
  const summary = `This week you received ${positives} positive and ${negatives} negative industry-specific feedback signals.`;
  const recommendedAction = suggestions[0] ?? "Monitor trends and keep response quality high.";
  await db.insert(weeklyReportsTable).values({
    businessId: profile.id,
    industry,
    periodStart,
    periodEnd,
    summary,
    topWins,
    attentionAreas,
    recommendedAction,
  });
  const [report] = await db
    .select()
    .from(weeklyReportsTable)
    .where(eq(weeklyReportsTable.businessId, profile.id))
    .orderBy(desc(weeklyReportsTable.createdAt))
    .limit(1);
  res.status(201).json(report);
});

router.get("/reports/export", requireAuth, async (req: AuthRequest, res) => {
  const reviews = await db.select().from(reviewsTable).where(eq(reviewsTable.userId, req.userId!));
  const header = "Author,Rating,Date,Text\n";
  const rows = reviews.map((r) => `"${r.author}",${r.rating},"${r.date}","${r.text.replace(/"/g, '""')}"`).join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=reviews-report.csv");
  res.send(header + rows);
});

export default router;
