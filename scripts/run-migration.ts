/**
 * Apply one SQL migration file, statement by statement.
 * Run with: npx tsx scripts/run-migration.ts scripts/migrations/<file>.sql
 * (npm run migrate:review and migrate:video are shortcuts.)
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

  const path = process.argv[2];
  if (!path || !existsSync(path)) {
    console.error("Usage: npx tsx scripts/run-migration.ts scripts/migrations/<file>.sql");
    process.exit(1);
  }

  const pool = createPool({ connectionString });
  console.log(`Applying ${path}`);
  const file = readFileSync(path, "utf8");
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
