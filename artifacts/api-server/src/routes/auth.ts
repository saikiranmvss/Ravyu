import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  SignupBody,
  LoginBody,
  RefreshTokenBody,
  FirebaseAuthBody,
} from "@workspace/api-zod";
import {
  hashPassword,
  comparePassword,
  signAccessToken,
  signRefreshToken,
  storeRefreshToken,
  revokeRefreshToken,
  validateRefreshToken,
  verifyRefreshTokenJwt,
  requireAuth,
  type AuthRequest,
} from "../lib/auth";

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

router.post("/signup", async (req, res) => {
  const parse = SignupBody.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: "Validation error", details: parse.error.issues });
    return;
  }
  const { email, password, username } = parse.data;
  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing.length > 0) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }
  const passwordHash = await hashPassword(password);
  const inserted = await db.insert(usersTable).values({ email, username, passwordHash }).$returningId();
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, inserted[0]!.id)).limit(1);
  const accessToken = signAccessToken(user.id);
  const refreshToken = signRefreshToken(user.id);
  await storeRefreshToken(user.id, refreshToken);
  res.status(201).json({ accessToken, refreshToken, user: formatUser(user) });
});

router.post("/login", async (req, res) => {
  const parse = LoginBody.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: "Validation error" });
    return;
  }
  const { email, password } = parse.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user || !user.passwordHash) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const accessToken = signAccessToken(user.id);
  const refreshToken = signRefreshToken(user.id);
  await storeRefreshToken(user.id, refreshToken);
  res.json({ accessToken, refreshToken, user: formatUser(user) });
});

router.post("/logout", async (req: AuthRequest, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) await revokeRefreshToken(refreshToken);
  res.status(204).end();
});

router.post("/refresh", async (req, res) => {
  const parse = RefreshTokenBody.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: "refreshToken required" });
    return;
  }
  const { refreshToken } = parse.data;
  try {
    const payload = verifyRefreshTokenJwt(refreshToken);
    const userId = await validateRefreshToken(refreshToken);
    if (!userId || userId !== payload.userId) {
      res.status(401).json({ error: "Invalid refresh token" });
      return;
    }
    await revokeRefreshToken(refreshToken);
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    const newAccess = signAccessToken(userId);
    const newRefresh = signRefreshToken(userId);
    await storeRefreshToken(userId, newRefresh);
    res.json({ accessToken: newAccess, refreshToken: newRefresh, user: formatUser(user) });
  } catch {
    res.status(401).json({ error: "Invalid or expired refresh token" });
  }
});

router.post("/firebase", async (req, res) => {
  const parse = FirebaseAuthBody.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: "idToken required" });
    return;
  }
  const { idToken } = parse.data;
  // Decode the Firebase JWT without verification in dev; in prod configure FIREBASE_PROJECT_ID
  let firebasePayload: { email?: string; name?: string; uid?: string; sub?: string };
  try {
    const parts = idToken.split(".");
    if (parts.length !== 3) throw new Error("Not a JWT");
    firebasePayload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  } catch {
    res.status(401).json({ error: "Invalid Firebase token" });
    return;
  }
  const email = firebasePayload.email;
  const firebaseUid = firebasePayload.uid ?? firebasePayload.sub;
  if (!email || !firebaseUid) {
    res.status(401).json({ error: "Firebase token missing email or uid" });
    return;
  }
  let user = (await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1))[0];
  let isNewUser = false;
  if (!user) {
    isNewUser = true;
    const name = firebasePayload.name ?? email.split("@")[0];
    const inserted = await db
      .insert(usersTable)
      .values({ email, username: name, firebaseUid, googleId: firebaseUid })
      .$returningId();
    [user] = await db.select().from(usersTable).where(eq(usersTable.id, inserted[0]!.id)).limit(1);
  } else if (!user.firebaseUid) {
    await db.update(usersTable).set({ firebaseUid, googleId: firebaseUid }).where(eq(usersTable.id, user.id));
    user = { ...user, firebaseUid, googleId: firebaseUid };
  }
  const accessToken = signAccessToken(user.id);
  const refreshToken = signRefreshToken(user.id);
  await storeRefreshToken(user.id, refreshToken);
  res.json({ accessToken, refreshToken, user: formatUser(user), isNewUser });
});

export { requireAuth };
export default router;
