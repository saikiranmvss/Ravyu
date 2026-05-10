import { mysqlTable, int, varchar, boolean, timestamp } from "drizzle-orm/mysql-core";
import { businessProfilesTable } from "./business_profiles";

export const industryProfilesTable = mysqlTable("industry_profiles", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("business_id")
    .notNull()
    .unique()
    .references(() => businessProfilesTable.id, { onDelete: "cascade" }),
  industry: varchar("industry", { length: 64 }).notNull(),
  subIndustry: varchar("sub_industry", { length: 128 }),
  riskSensitiveMode: boolean("risk_sensitive_mode").notNull().default(false),
  multiOutlet: boolean("multi_outlet").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type IndustryProfile = typeof industryProfilesTable.$inferSelect;
