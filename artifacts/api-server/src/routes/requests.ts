import { Router } from "express";
import { db, businessProfilesTable, reviewRequestsTable } from "@workspace/db";
import { eq, and, ilike, or } from "drizzle-orm";
import {
  CreateReviewRequestBody,
  BulkImportRequestsBody,
  UpdateReviewRequestBody,
  UpdateReviewRequestParams,
  DeleteReviewRequestParams,
  SendReviewRequestEmailParams,
  GetReviewRequestsQueryParams,
} from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../lib/auth";
import { generateToken } from "../lib/slugify";
import nodemailer from "nodemailer";

const router = Router();

async function getBusinessForUser(userId: number) {
  const [profile] = await db
    .select()
    .from(businessProfilesTable)
    .where(eq(businessProfilesTable.userId, userId))
    .limit(1);
  return profile;
}

function formatRequest(r: typeof reviewRequestsTable.$inferSelect) {
  return {
    id: r.id,
    customerName: r.customerName,
    customerEmail: r.customerEmail,
    customerPhone: r.customerPhone,
    uniqueToken: r.uniqueToken,
    status: r.status,
    notes: r.notes,
    sendMethod: r.sendMethod,
    sentAt: r.sentAt ? r.sentAt.toISOString() : null,
    openedAt: r.openedAt ? r.openedAt.toISOString() : null,
    completedAt: r.completedAt ? r.completedAt.toISOString() : null,
    createdAt: r.createdAt,
  };
}

router.get("/requests", requireAuth, async (req: AuthRequest, res) => {
  const profile = await getBusinessForUser(req.userId!);
  if (!profile) { res.json([]); return; }

  const params = GetReviewRequestsQueryParams.safeParse(req.query);
  const { status, search } = params.success ? params.data : {};

  const conditions: ReturnType<typeof eq>[] = [eq(reviewRequestsTable.businessId, profile.id)];
  if (status) conditions.push(eq(reviewRequestsTable.status, status as "pending" | "sent" | "opened" | "completed"));

  let rows = await db.select().from(reviewRequestsTable).where(and(...conditions));
  if (search) {
    const s = search.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.customerName.toLowerCase().includes(s) ||
        (r.customerEmail ?? "").toLowerCase().includes(s),
    );
  }
  res.json(rows.map(formatRequest));
});

router.post("/requests", requireAuth, async (req: AuthRequest, res) => {
  const parse = CreateReviewRequestBody.safeParse(req.body);
  if (!parse.success) { res.status(400).json({ error: "Validation error" }); return; }
  const profile = await getBusinessForUser(req.userId!);
  if (!profile) { res.status(400).json({ error: "Create a business profile first" }); return; }
  const uniqueToken = generateToken();
  const [request] = await db
    .insert(reviewRequestsTable)
    .values({ ...parse.data, businessId: profile.id, uniqueToken })
    .returning();
  res.status(201).json(formatRequest(request));
});

router.post("/requests/bulk", requireAuth, async (req: AuthRequest, res) => {
  const parse = BulkImportRequestsBody.safeParse(req.body);
  if (!parse.success) { res.status(400).json({ error: "Validation error" }); return; }
  const profile = await getBusinessForUser(req.userId!);
  if (!profile) { res.status(400).json({ error: "Create a business profile first" }); return; }
  const toInsert = parse.data.rows.map((row) => ({
    businessId: profile.id,
    customerName: row.customerName,
    customerEmail: row.customerEmail ?? null,
    customerPhone: row.customerPhone ?? null,
    uniqueToken: generateToken(),
  }));
  await db.insert(reviewRequestsTable).values(toInsert);
  res.json({ imported: toInsert.length, skipped: 0 });
});

router.put("/requests/:id", requireAuth, async (req: AuthRequest, res) => {
  const paramsCheck = UpdateReviewRequestParams.safeParse({ id: Number(req.params.id) });
  const parse = UpdateReviewRequestBody.safeParse(req.body);
  if (!paramsCheck.success || !parse.success) { res.status(400).json({ error: "Validation error" }); return; }
  const profile = await getBusinessForUser(req.userId!);
  if (!profile) { res.status(404).json({ error: "No business profile" }); return; }
  const [request] = await db
    .update(reviewRequestsTable)
    .set(parse.data)
    .where(and(eq(reviewRequestsTable.id, paramsCheck.data.id), eq(reviewRequestsTable.businessId, profile.id)))
    .returning();
  if (!request) { res.status(404).json({ error: "Request not found" }); return; }
  res.json(formatRequest(request));
});

router.delete("/requests/:id", requireAuth, async (req: AuthRequest, res) => {
  const paramsCheck = DeleteReviewRequestParams.safeParse({ id: Number(req.params.id) });
  if (!paramsCheck.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const profile = await getBusinessForUser(req.userId!);
  if (!profile) { res.status(404).json({ error: "No business profile" }); return; }
  await db.delete(reviewRequestsTable).where(
    and(eq(reviewRequestsTable.id, paramsCheck.data.id), eq(reviewRequestsTable.businessId, profile.id)),
  );
  res.status(204).end();
});

router.post("/requests/:id/send-email", requireAuth, async (req: AuthRequest, res) => {
  const paramsCheck = SendReviewRequestEmailParams.safeParse({ id: Number(req.params.id) });
  if (!paramsCheck.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const profile = await getBusinessForUser(req.userId!);
  if (!profile) { res.status(404).json({ error: "No business profile" }); return; }
  const [request] = await db
    .select()
    .from(reviewRequestsTable)
    .where(and(eq(reviewRequestsTable.id, paramsCheck.data.id), eq(reviewRequestsTable.businessId, profile.id)))
    .limit(1);
  if (!request) { res.status(404).json({ error: "Request not found" }); return; }
  if (!request.customerEmail) { res.status(400).json({ error: "No email address for this customer" }); return; }
  if (request.status === "sent") { res.json({ sent: true, message: "Email already sent" }); return; }

  const origin = req.headers.origin ?? `https://${req.headers.host}`;
  const reviewLink = `${origin}/review/${profile.slug}/${request.uniqueToken}`;
  const primaryColor = profile.primaryColor ?? "#4F46E5";

  const htmlBody = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    ${profile.logoUrl ? `<div style="background: ${primaryColor}; padding: 24px; text-align: center;"><img src="${profile.logoUrl}" alt="${profile.businessName}" style="height: 48px;" /></div>` : `<div style="background: ${primaryColor}; padding: 24px; text-align: center; color: white; font-size: 22px; font-weight: bold;">${profile.businessName}</div>`}
    <div style="padding: 32px;">
      <h2 style="color: #111; margin-top: 0;">Hi ${request.customerName},</h2>
      <p style="color: #555; line-height: 1.6;">Thank you for being a valued customer of <strong>${profile.businessName}</strong>. We'd love to hear about your experience!</p>
      <p style="color: #555; line-height: 1.6;">Your feedback helps us improve and helps other customers make informed decisions. It only takes 1 minute.</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${reviewLink}" style="background: ${primaryColor}; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: bold; display: inline-block;">Leave a Review ⭐</a>
      </div>
      <p style="color: #999; font-size: 13px;">If the button doesn't work, copy this link: ${reviewLink}</p>
    </div>
    <div style="background: #f4f4f4; padding: 16px; text-align: center; color: #999; font-size: 12px;">${profile.businessName} · Powered by Ravyu</div>
  </div>
</body>
</html>`;

  const SMTP_HOST = process.env.SMTP_HOST;
  if (!SMTP_HOST) {
    // Demo: mark as sent without actually sending
    await db.update(reviewRequestsTable)
      .set({ status: "sent", sentAt: new Date(), sendMethod: "email" })
      .where(eq(reviewRequestsTable.id, request.id));
    res.json({ sent: true, message: "Email queued (SMTP not configured — demo mode)" });
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    });
    await transporter.sendMail({
      from: `"${profile.businessName}" <${process.env.SMTP_USER}>`,
      to: request.customerEmail,
      subject: `${request.customerName}, we'd love your feedback!`,
      html: htmlBody,
    });
    await db.update(reviewRequestsTable)
      .set({ status: "sent", sentAt: new Date(), sendMethod: "email" })
      .where(eq(reviewRequestsTable.id, request.id));
    res.json({ sent: true, message: "Email sent successfully" });
  } catch (err) {
    req.log.error({ err }, "Email send failed");
    res.status(500).json({ error: "Failed to send email" });
  }
});

export default router;
