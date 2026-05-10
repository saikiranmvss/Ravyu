import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateUserProfileBody, CompleteOnboardingBody, ChangePasswordBody } from "@workspace/api-zod";
import { requireAuth, hashPassword, comparePassword, type AuthRequest } from "../lib/auth";

const router = Router();

function formatUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    phone: user.phone,
    company: user.company,
    googleMapsUrl: user.googleMapsUrl,
    businessType: user.businessType,
    industry: user.industry,
    challenges: user.challenges ?? [],
    profileComplete: user.profileComplete,
    createdAt: user.createdAt,
  };
}

router.get("/profile", requireAuth, async (req: AuthRequest, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json(formatUser(user));
});

router.put("/profile", requireAuth, async (req: AuthRequest, res) => {
  const parse = UpdateUserProfileBody.safeParse(req.body);
  if (!parse.success) { res.status(400).json({ error: "Validation error" }); return; }
  const [user] = await db
    .update(usersTable)
    .set({ ...parse.data, updatedAt: new Date() })
    .where(eq(usersTable.id, req.userId!))
    .returning();
  res.json(formatUser(user));
});

router.put("/onboarding", requireAuth, async (req: AuthRequest, res) => {
  const parse = CompleteOnboardingBody.safeParse(req.body);
  if (!parse.success) { res.status(400).json({ error: "Validation error", details: parse.error.issues }); return; }
  const { phone, company, businessType, industry, challenges } = parse.data;
  const [user] = await db
    .update(usersTable)
    .set({ phone, company, businessType, industry, challenges, profileComplete: true, updatedAt: new Date() })
    .where(eq(usersTable.id, req.userId!))
    .returning();
  res.json(formatUser(user));
});

router.put("/change-password", requireAuth, async (req: AuthRequest, res) => {
  const parse = ChangePasswordBody.safeParse(req.body);
  if (!parse.success) { res.status(400).json({ error: "Validation error" }); return; }
  const { currentPassword, newPassword } = parse.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  if (!user.passwordHash) { res.status(400).json({ error: "Account uses Google sign-in" }); return; }
  const valid = await comparePassword(currentPassword, user.passwordHash);
  if (!valid) { res.status(400).json({ error: "Current password is incorrect" }); return; }
  const passwordHash = await hashPassword(newPassword);
  await db.update(usersTable).set({ passwordHash, updatedAt: new Date() }).where(eq(usersTable.id, req.userId!));
  res.status(204).end();
});

router.delete("/delete", requireAuth, async (req: AuthRequest, res) => {
  await db.delete(usersTable).where(eq(usersTable.id, req.userId!));
  res.status(204).end();
});

export default router;
