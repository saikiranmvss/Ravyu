import { mysqlTable, int, text, timestamp, varchar } from "drizzle-orm/mysql-core";
import { usersTable } from "./users";

export const refreshTokensTable = mysqlTable("refresh_tokens", {
  id: int("id").autoincrement().primaryKey(),
  token: varchar("token", { length: 512 }).notNull().unique(),
  userId: int("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type RefreshToken = typeof refreshTokensTable.$inferSelect;
