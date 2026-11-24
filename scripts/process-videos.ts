/**
 * Process every video that still needs it: remux to streamable MP4, poster
 * frame, dimensions. Run with: npm run process-videos [--all] [--limit N]
 *
 * --all               also re-process videos already marked done (regenerates posters)
 * --limit N           stop after N videos
 * --delete-originals  remove the old .mov from Blob once the .mp4 is in place
 *                     (default keeps it, so nothing is lost if you want to compare)
 *
 * Needs DATABASE_URL (or POSTGRES_URL) and BLOB_READ_WRITE_TOKEN. Uses the
 * ffmpeg on PATH if FFMPEG_PATH is set, else the ffmpeg-static binary.
 */

import { readFileSync, existsSync } from "fs";

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
  if (!process.env.POSTGRES_URL && process.env.DATABASE_URL) {
    process.env.POSTGRES_URL = process.env.DATABASE_URL; // @vercel/postgres reads this one
  }
  if (!process.env.POSTGRES_URL || !process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("Set DATABASE_URL/POSTGRES_URL and BLOB_READ_WRITE_TOKEN first.");
    process.exit(1);
  }

  const { sql } = await import("@vercel/postgres");
  const { processVideo } = await import("../lib/video/process");

  const all = process.argv.includes("--all");
  const keepOriginal = !process.argv.includes("--delete-originals");
  const limitArg = process.argv.indexOf("--limit");
  const limit = limitArg >= 0 ? Number(process.argv[limitArg + 1]) : Infinity;

  const rows = all
    ? await sql`SELECT id, blob_url, file_size FROM media_assets WHERE mime_type LIKE 'video/%' OR blob_url ~* '\\.(mov|mp4|m4v)$' ORDER BY created_at DESC`
    : await sql`SELECT id, blob_url, file_size FROM media_assets WHERE (mime_type LIKE 'video/%' OR blob_url ~* '\\.(mov|mp4|m4v)$') AND (processing_status <> 'done' OR poster_url IS NULL) ORDER BY created_at DESC`;

  console.log(`${rows.rowCount} video(s) to process${Number.isFinite(limit) ? ` (limit ${limit})` : ""}`);
  let done = 0, failed = 0, n = 0;
  for (const row of rows.rows) {
    if (n++ >= limit) break;
    const name = row.blob_url.split("/").pop();
    const mb = row.file_size ? (row.file_size / 1048576).toFixed(1) : "?";
    process.stdout.write(`[${n}/${Math.min(rows.rowCount ?? 0, limit)}] ${name} (${mb}MB) … `);
    const result = await processVideo(row.id, { force: all, keepOriginal, budgetMs: 20 * 60_000 });
    if (result.ok) {
      done++;
      console.log(`${result.action} in ${result.seconds}s`);
    } else {
      failed++;
      console.log(`FAILED: ${result.error}`);
    }
  }
  console.log(`\ndone: ${done}, failed: ${failed}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
