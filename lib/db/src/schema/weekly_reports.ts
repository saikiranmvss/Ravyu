import { mysqlTable, int, varchar, text, timestamp, json } from "drizzle-orm/mysql-core";
import { businessProfilesTable } from "./business_profiles";

export const weeklyReportsTable = mysqlTable("weekly_reports", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("business_id")
    .notNull()
    .references(() => businessProfilesTable.id, { onDelete: "cascade" }),
  industry: varchar("industry", { length: 64 }).notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  summary: text("summary").notNull(),
  topWins: json("top_wins").$type<string[]>().notNull(),
  attentionAreas: json("attention_areas").$type<string[]>().notNull(),
  recommendedAction: text("recommended_action").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type WeeklyReport = typeof weeklyReportsTable.$inferSelect;
