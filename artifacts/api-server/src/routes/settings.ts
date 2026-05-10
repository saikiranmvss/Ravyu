import { Router } from "express";
import { db, userSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateSettingsBody } from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../lib/auth";

const router = Router();

async function ensureSettings(userId: number) {
  const [existing] = await db.select().from(userSettingsTable).where(eq(userSettingsTable.userId, userId)).limit(1);
  if (existing) return existing;
  const [created] = await db.insert(userSettingsTable).values({ userId }).returning();
  return created;
}

router.get("/", requireAuth, async (req: AuthRequest, res) => {
  const settings = await ensureSettings(req.userId!);
  res.json({
    emailNotifications: settings.emailNotifications,
    smsNotifications: settings.smsNotifications,
    pushNotifications: settings.pushNotifications,
    marketingEmails: settings.marketingEmails,
  });
});

router.put("/", requireAuth, async (req: AuthRequest, res) => {
  const parse = UpdateSettingsBody.safeParse(req.body);
  if (!parse.success) { res.status(400).json({ error: "Validation error" }); return; }
  await ensureSettings(req.userId!);
  const [updated] = await db
    .update(userSettingsTable)
    .set({ ...parse.data, updatedAt: new Date() })
    .where(eq(userSettingsTable.userId, req.userId!))
    .returning();
  res.json({
    emailNotifications: updated.emailNotifications,
    smsNotifications: updated.smsNotifications,
    pushNotifications: updated.pushNotifications,
    marketingEmails: updated.marketingEmails,
  });
});

export default router;
