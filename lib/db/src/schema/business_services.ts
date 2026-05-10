import { pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { businessProfilesTable } from "./business_profiles";

export const businessServicesTable = pgTable("business_services", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull().references(() => businessProfilesTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  price: text("price"),
  duration: text("duration"),
  isActive: boolean("is_active").notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type BusinessService = typeof businessServicesTable.$inferSelect;
