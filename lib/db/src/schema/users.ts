import { pgTable, serial, text, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username").notNull(),
  passwordHash: text("password_hash"),
  phone: text("phone"),
  company: text("company"),
  googleMapsUrl: text("google_maps_url"),
  businessType: text("business_type"),
  industry: text("industry"),
  challenges: json("challenges").$type<string[]>(),
  profileComplete: boolean("profile_complete").notNull().default(false),
  firebaseUid: text("firebase_uid").unique(),
  googleId: text("google_id").unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
