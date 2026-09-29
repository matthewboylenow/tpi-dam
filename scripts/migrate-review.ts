/**
 * Apply the marketing review + usage migration.
 * Run with: npm run migrate:review
 *
 * Adds reviewed_at, reviewed_by, used_on and updated_at to media_assets,
 * plus indexes, and backfills existing uploads as reviewed. Every
 * statement is IF NOT EXISTS, so it is safe to run more than once.
 *
 * Reads DATABASE_URL or POSTGRES_URL from the environment or .env.local.
 */

import { readFileSync, existsSync } from "fs";
import { createPool } from "@vercel/postgres";

function loadEnvFile() {
  if (!existsSync(".env.local")) return;
  for (const raw of readFileSync(".env.local", "utf-8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match && !process.env[match[1].trim()]) {
      process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, "");
    }
  }
}

async function main() {
  loadEnvFile();
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) {
    console.error("Set DATABASE_URL or POSTGRES_URL (or add it to .env.local).");
    process.exit(1);
  }

  const pool = createPool({ connectionString });
  const file = readFileSync("scripts/migrations/add_review_and_usage.sql", "utf8");
  const statements = file
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);

  for (const statement of statements) {
    const result = await pool.query(statement);
    if (statement.toUpperCase().startsWith("SELECT")) {
      console.table(result.rows);
    } else {
      console.log(`ok (${result.rowCount ?? 0} rows): ${statement.replace(/\s+/g, " ").slice(0, 80)}`);
    }
  }

  const stats = await pool.sql`
    SELECT COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE reviewed_at IS NULL)::int AS unreviewed,
           COUNT(*) FILTER (WHERE cardinality(used_on) > 0)::int AS used
    FROM media_assets`;
  console.log("media:", stats.rows[0]);
  await pool.end();
}

main().catch((error) => {
  console.error("Migration failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
