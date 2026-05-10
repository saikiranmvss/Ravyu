import { defineConfig } from "drizzle-kit";
import path from "path";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set (MySQL connection string)");
}

export default defineConfig({
  schema: "./src/schema/*.ts",
  out: path.join(__dirname, "./drizzle"),
  dialect: "mysql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
