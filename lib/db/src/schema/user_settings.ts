import { mysqlTable, int, boolean, timestamp } from "drizzle-orm/mysql-core";
import { usersTable } from "./users";

export const userSettingsTable = mysqlTable("user_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().unique().references(() => usersTable.id, { onDelete: "cascade" }),
  emailNotifications: boolean("email_notifications").notNull().default(true),
  smsNotifications: boolean("sms_notifications").notNull().default(false),
  pushNotifications: boolean("push_notifications").notNull().default(true),
  marketingEmails: boolean("marketing_emails").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type UserSettings = typeof userSettingsTable.$inferSelect;
