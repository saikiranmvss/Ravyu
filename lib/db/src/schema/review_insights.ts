import { mysqlTable, int, varchar, text, double, timestamp } from "drizzle-orm/mysql-core";
import { reviewsTable } from "./reviews";
import { businessProfilesTable } from "./business_profiles";
import { usersTable } from "./users";

export const reviewInsightsTable = mysqlTable("review_insights", {
  id: int("id").autoincrement().primaryKey(),
  reviewId: int("review_id")
    .notNull()
    .references(() => reviewsTable.id, { onDelete: "cascade" }),
  businessId: int("business_id")
    .notNull()
    .references(() => businessProfilesTable.id, { onDelete: "cascade" }),
  userId: int("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  industry: varchar("industry", { length: 64 }).notNull(),
  entityName: varchar("entity_name", { length: 255 }),
  aspect: varchar("aspect", { length: 64 }).notNull(),
  sentiment: varchar("sentiment", { length: 32 }).notNull(),
  reason: text("reason"),
  confidence: double("confidence").notNull().default(0.75),
  severity: varchar("severity", { length: 32 }).notNull().default("low"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type ReviewInsight = typeof reviewInsightsTable.$inferSelect;
