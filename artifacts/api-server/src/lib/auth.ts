import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { db, refreshTokensTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import type { Request, Response, NextFunction } from "express";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? "ravyu-access-secret-dev";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? "ravyu-refresh-secret-dev";
const ACCESS_EXPIRES = "15m";
const REFRESH_EXPIRES_DAYS = 30;

export function signAccessToken(userId: number): string {
  return jwt.sign({ userId }, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });
}

export function signRefreshToken(userId: number): string {
  return jwt.sign({ userId }, REFRESH_SECRET, { expiresIn: `${REFRESH_EXPIRES_DAYS}d` });
}

export function verifyAccessToken(token: string): { userId: number } {
  return jwt.verify(token, ACCESS_SECRET) as { userId: number };
}

export function verifyRefreshTokenJwt(token: string): { userId: number } {
  return jwt.verify(token, REFRESH_SECRET) as { userId: number };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function storeRefreshToken(userId: number, token: string): Promise<void> {
  const expiresAt = new Date(Date.now() + REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(refreshTokensTable).values({ userId, token, expiresAt });
}

export async function revokeRefreshToken(token: string): Promise<void> {
  await db.delete(refreshTokensTable).where(eq(refreshTokensTable.token, token));
}

export async function validateRefreshToken(token: string): Promise<number | null> {
  const rows = await db
    .select()
    .from(refreshTokensTable)
    .where(
      and(
        eq(refreshTokensTable.token, token),
        gt(refreshTokensTable.expiresAt, new Date()),
      ),
    )
    .limit(1);
  return rows[0]?.userId ?? null;
}

export interface AuthRequest extends Request {
  userId?: number;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = authHeader.slice(7);
  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
