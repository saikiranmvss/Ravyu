import { mysqlTable, int, text, timestamp, varchar } from "drizzle-orm/mysql-core";
import { businessProfilesTable } from "./business_profiles";

export const reviewRequestStatusEnum = ["pending", "sent", "opened", "completed"] as const;

export const reviewRequestsTable = mysqlTable("review_requests", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("business_id").notNull().references(() => businessProfilesTable.id, { onDelete: "cascade" }),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  uniqueToken: varchar("unique_token", { length: 255 }).notNull().unique(),
  status: text("status").$type<"pending" | "sent" | "opened" | "completed">().notNull().default("pending"),
  notes: text("notes"),
  sendMethod: text("send_method"),
  sentAt: timestamp("sent_at"),
  openedAt: timestamp("opened_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type ReviewRequest = typeof reviewRequestsTable.$inferSelect;
