import { pgTable, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const userSettingsTable = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique().references(() => usersTable.id, { onDelete: "cascade" }),
  emailNotifications: boolean("email_notifications").notNull().default(true),
  smsNotifications: boolean("sms_notifications").notNull().default(false),
  pushNotifications: boolean("push_notifications").notNull().default(true),
  marketingEmails: boolean("marketing_emails").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type UserSettings = typeof userSettingsTable.$inferSelect;
