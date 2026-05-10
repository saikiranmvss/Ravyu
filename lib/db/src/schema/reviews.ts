import { mysqlTable, int, text, timestamp } from "drizzle-orm/mysql-core";
import { usersTable } from "./users";

export const reviewsTable = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  author: text("author").notNull(),
  rating: int("rating").notNull(),
  text: text("text").notNull().default(""),
  date: text("date").notNull().default(""),
  sourceUrl: text("source_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Review = typeof reviewsTable.$inferSelect;
