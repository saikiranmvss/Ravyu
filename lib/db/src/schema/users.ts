import { mysqlTable, int, text, boolean, timestamp, json, varchar } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  username: text("username").notNull(),
  passwordHash: text("password_hash"),
  phone: text("phone"),
  company: text("company"),
  googleMapsUrl: text("google_maps_url"),
  businessType: text("business_type"),
  industry: text("industry"),
  challenges: json("challenges").$type<string[]>(),
  profileComplete: boolean("profile_complete").notNull().default(false),
  firebaseUid: varchar("firebase_uid", { length: 255 }).unique(),
  googleId: varchar("google_id", { length: 255 }).unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
