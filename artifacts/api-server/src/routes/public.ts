import { Router } from "express";
import { db, businessProfilesTable, businessServicesTable, reviewsTable, reviewRequestsTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import {
  GetPublicBusinessParams,
  TrackPageViewParams,
  TrackReviewClickParams,
  GetReviewCollectionPageParams,
  GetTrackedReviewLinkParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/business/:slug", async (req, res) => {
  const parse = GetPublicBusinessParams.safeParse({ slug: req.params.slug });
  if (!parse.success) { res.status(400).json({ error: "Invalid slug" }); return; }
  const [profile] = await db
    .select()
    .from(businessProfilesTable)
    .where(eq(businessProfilesTable.slug, parse.data.slug))
    .limit(1);
  if (!profile || !profile.isActive) { res.status(404).json({ error: "Business not found" }); return; }

  const services = await db
    .select()
    .from(businessServicesTable)
    .where(and(eq(businessServicesTable.businessId, profile.id), eq(businessServicesTable.isActive, true)));

  const recentReviews = await db
    .select()
    .from(reviewsTable)
    .where(eq(reviewsTable.userId, profile.userId))
    .orderBy(desc(reviewsTable.createdAt))
    .limit(6);

  const allReviews = await db.select().from(reviewsTable).where(eq(reviewsTable.userId, profile.userId));
  const totalReviews = allReviews.length;
  const averageRating = totalReviews > 0
    ? Math.round((allReviews.reduce((s, r) => s + r.rating, 0) / totalReviews) * 10) / 10
    : 0;

  res.json({
    businessName: profile.businessName,
    slug: profile.slug,
    description: profile.description,
    logoUrl: profile.logoUrl,
    coverImageUrl: profile.coverImageUrl,
    address: profile.address,
    city: profile.city,
    state: profile.state,
    phone: profile.phone,
    email: profile.email,
    website: profile.website,
    primaryColor: profile.primaryColor,
    secondaryColor: profile.secondaryColor,
    facebookUrl: profile.facebookUrl,
    instagramUrl: profile.instagramUrl,
    twitterUrl: profile.twitterUrl,
    linkedinUrl: profile.linkedinUrl,
    googleMapsUrl: profile.googleMapsUrl,
    services,
    recentReviews,
    totalReviews,
    averageRating,
  });
});

router.post("/business/:slug/track-view", async (req, res) => {
  const parse = TrackPageViewParams.safeParse({ slug: req.params.slug });
  if (!parse.success) { res.status(400).json({ error: "Invalid slug" }); return; }
  const [profile] = await db
    .select()
    .from(businessProfilesTable)
    .where(eq(businessProfilesTable.slug, parse.data.slug))
    .limit(1);
  if (profile) {
    await db
      .update(businessProfilesTable)
      .set({ pageViews: profile.pageViews + 1 })
      .where(eq(businessProfilesTable.id, profile.id));
  }
  res.status(204).end();
});

router.post("/business/:slug/track-review-click", async (req, res) => {
  const parse = TrackReviewClickParams.safeParse({ slug: req.params.slug });
  if (!parse.success) { res.status(400).json({ error: "Invalid slug" }); return; }
  const [profile] = await db
    .select()
    .from(businessProfilesTable)
    .where(eq(businessProfilesTable.slug, parse.data.slug))
    .limit(1);
  if (profile) {
    await db
      .update(businessProfilesTable)
      .set({ reviewClicks: profile.reviewClicks + 1 })
      .where(eq(businessProfilesTable.id, profile.id));
  }
  res.status(204).end();
});

router.get("/review/:slug", async (req, res) => {
  const parse = GetReviewCollectionPageParams.safeParse({ slug: req.params.slug });
  if (!parse.success) { res.status(400).json({ error: "Invalid slug" }); return; }
  const [profile] = await db
    .select()
    .from(businessProfilesTable)
    .where(eq(businessProfilesTable.slug, parse.data.slug))
    .limit(1);
  if (!profile) { res.status(404).json({ error: "Business not found" }); return; }
  const googleReviewUrl = profile.googleMapsUrl
    ? `${profile.googleMapsUrl}?ref=ravyu_review`
    : `https://search.google.com/local/writereview?placeid=${profile.googlePlaceId ?? ""}`;
  res.json({
    businessName: profile.businessName,
    logoUrl: profile.logoUrl,
    primaryColor: profile.primaryColor,
    googleReviewUrl,
    customerName: null,
    personalized: false,
  });
});

router.get("/review/:slug/:token", async (req, res) => {
  const parse = GetTrackedReviewLinkParams.safeParse({ slug: req.params.slug, token: req.params.token });
  if (!parse.success) { res.status(400).json({ error: "Invalid params" }); return; }
  const [profile] = await db
    .select()
    .from(businessProfilesTable)
    .where(eq(businessProfilesTable.slug, parse.data.slug))
    .limit(1);
  if (!profile) { res.status(404).json({ error: "Business not found" }); return; }

  const [request] = await db
    .select()
    .from(reviewRequestsTable)
    .where(and(eq(reviewRequestsTable.uniqueToken, parse.data.token), eq(reviewRequestsTable.businessId, profile.id)))
    .limit(1);

  if (request && request.status !== "opened" && request.status !== "completed") {
    await db
      .update(reviewRequestsTable)
      .set({ status: "opened", openedAt: new Date() })
      .where(eq(reviewRequestsTable.id, request.id));
  }

  const googleReviewUrl = profile.googleMapsUrl
    ? `${profile.googleMapsUrl}?ref=ravyu_review`
    : `https://search.google.com/local/writereview?placeid=${profile.googlePlaceId ?? ""}`;

  res.json({
    businessName: profile.businessName,
    logoUrl: profile.logoUrl,
    primaryColor: profile.primaryColor,
    googleReviewUrl,
    customerName: request?.customerName ?? null,
    personalized: !!request,
  });
});

export default router;
