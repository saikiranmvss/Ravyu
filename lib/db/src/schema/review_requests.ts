import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { businessProfilesTable } from "./business_profiles";

export const reviewRequestStatusEnum = ["pending", "sent", "opened", "completed"] as const;

export const reviewRequestsTable = pgTable("review_requests", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull().references(() => businessProfilesTable.id, { onDelete: "cascade" }),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  uniqueToken: text("unique_token").notNull().unique(),
  status: text("status").$type<"pending" | "sent" | "opened" | "completed">().notNull().default("pending"),
  notes: text("notes"),
  sendMethod: text("send_method"),
  sentAt: timestamp("sent_at"),
  openedAt: timestamp("opened_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type ReviewRequest = typeof reviewRequestsTable.$inferSelect;
