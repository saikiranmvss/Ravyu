import { mysqlTable, int, text, boolean, timestamp } from "drizzle-orm/mysql-core";
import { businessProfilesTable } from "./business_profiles";

export const businessServicesTable = mysqlTable("business_services", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("business_id").notNull().references(() => businessProfilesTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  price: text("price"),
  duration: text("duration"),
  isActive: boolean("is_active").notNull().default(true),
  displayOrder: int("display_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type BusinessService = typeof businessServicesTable.$inferSelect;
