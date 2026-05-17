import { config } from "dotenv";
import { createConnection } from "mysql2/promise";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "../.env"), override: true });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required in .env");
}

const drizzleDir = path.resolve(__dirname, "../lib/db/drizzle");
const MIGRATIONS_TABLE = "__ravyu_migrations";

const files = (await readdir(drizzleDir))
  .filter((f) => f.endsWith(".sql"))
  .sort();

const connection = await createConnection(process.env.DATABASE_URL);

await connection.query(`
  CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL UNIQUE,
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

async function getAppliedFilenames() {
  const [rows] = await connection.query(
    `SELECT filename FROM ${MIGRATIONS_TABLE}`,
  );
  return new Set(rows.map((r) => r.filename));
}

async function markApplied(filename) {
  await connection.query(
    `INSERT INTO ${MIGRATIONS_TABLE} (filename) VALUES (?)`,
    [filename],
  );
}

const applied = await getAppliedFilenames();
const pending = files.filter((f) => !applied.has(f));

if (pending.length === 0) {
  console.log("No pending migrations.");
  await connection.end();
  process.exit(0);
}

for (const file of pending) {
  const sql = await readFile(path.join(drizzleDir, file), "utf8");
  const statements = sql
    .split(/--> statement-breakpoint\n?/)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await connection.query(statement);
  }
  await markApplied(file);
  console.log(`Applied ${file}`);
}

await connection.end();
console.log("Migrations applied.");
