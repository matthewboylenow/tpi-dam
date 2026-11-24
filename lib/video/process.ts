/**
 * Server-side video processing. Runs after an upload (via waitUntil) and
 * from scripts/process-videos.ts for the backlog. Node runtime only.
 *
 * What it does to a video:
 * 1. Remuxes it into a streamable MP4 (moov atom first) with just the video
 *    and audio tracks. iPhones record .mov, which Firefox and much of
 *    Android refuse; the same H.264 bytes in an .mp4 play everywhere. No
 *    re-encode, so it takes seconds and loses nothing.
 * 2. If the codec is HEVC (iPhone "High Efficiency"), re-encodes to H.264
 *    at up to 1080p, but only for files small enough to finish inside a
 *    serverless function. Larger HEVC files keep the original and stay
 *    "pending" for a bigger worker.
 * 3. Grabs a poster frame one second in, so the library never has to
 *    download video just to draw a thumbnail.
 * 4. Uploads the results to Blob, updates the row, deletes the old file.
 */

import { spawn } from "child_process";
import { createWriteStream } from "fs";
import { mkdtemp, readFile, rm, stat } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import { put } from "@vercel/blob";
import { sql } from "@vercel/postgres";
import { deleteBlobs } from "@/lib/blob/delete";

/** HEVC files above this are left for a worker with more time. */
const MAX_TRANSCODE_BYTES = 80 * 1024 * 1024;

type VideoInfo = {
  codec: string | null;
  width: number | null;
  height: number | null;
  duration: number | null;
};

function ffmpegPath(): string {
  if (process.env.FFMPEG_PATH) return process.env.FFMPEG_PATH;
  try {
    const staticPath = require("ffmpeg-static") as string | null;
    if (staticPath) return staticPath;
  } catch {
    // not installed; fall through
  }
  return "ffmpeg";
}

function run(args: string[], timeoutMs: number): Promise<{ code: number; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath(), args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
      if (stderr.length > 200_000) stderr = stderr.slice(-100_000);
    });
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`ffmpeg timed out after ${Math.round(timeoutMs / 1000)}s`));
    }, timeoutMs);
    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code: code ?? 1, stderr });
    });
  });
}

/** Read codec, size and duration from ffmpeg's own banner (no ffprobe needed). */
async function inspect(file: string): Promise<VideoInfo> {
  const { stderr } = await run(["-hide_banner", "-i", file], 30_000);
  const video = stderr.match(/Stream #\d+:\d+(?:\[[^\]]*\])?(?:\([^)]*\))?: Video: (\w+)[^\n]*?(\d{2,5})x(\d{2,5})/);
  const duration = stderr.match(/Duration: (\d+):(\d+):(\d+(?:\.\d+)?)/);
  // iPhone portrait video is stored landscape with a rotation tag
  const rotated = /rotate\s*:\s*(?:90|270|-90)/.test(stderr) || /displaymatrix:.*rotation of (?:-?90|270)/.test(stderr);
  let width = video ? Number(video[2]) : null;
  let height = video ? Number(video[3]) : null;
  if (rotated && width && height) [width, height] = [height, width];
  return {
    codec: video ? video[1] : null,
    width,
    height,
    duration: duration ? Number(duration[1]) * 3600 + Number(duration[2]) * 60 + Number(duration[3]) : null,
  };
}

async function download(url: string, dest: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`download failed (${res.status})`);
  await pipeline(Readable.fromWeb(res.body as any), createWriteStream(dest));
}

async function setStatus(id: string, status: string, error: string | null = null) {
  await sql`
    UPDATE media_assets
    SET processing_status = ${status}, processing_error = ${error}, updated_at = NOW()
    WHERE id = ${id}
  `;
}

export type ProcessResult =
  | { ok: true; id: string; action: "remuxed" | "transcoded" | "poster-only"; seconds: number }
  | { ok: false; id: string; error: string; deferred?: boolean };

/**
 * Process one video row. Safe to call again: a row already "done" with a
 * poster is skipped unless `force` is set.
 */
export async function processVideo(
  id: string,
  options: { force?: boolean; budgetMs?: number; keepOriginal?: boolean } = {}
): Promise<ProcessResult> {
  const budgetMs = options.budgetMs ?? 240_000;
  const started = Date.now();

  const rows = await sql`
    SELECT id, blob_url, mime_type, file_size, poster_url, processing_status
    FROM media_assets WHERE id = ${id} LIMIT 1
  `;
  const row = rows.rows[0];
  if (!row) return { ok: false, id, error: "not found" };
  if (!(row.mime_type || "").startsWith("video/") && !/\.(mov|mp4|m4v)$/i.test(row.blob_url)) {
    return { ok: false, id, error: "not a video" };
  }
  if (row.processing_status === "done" && row.poster_url && !options.force) {
    return { ok: true, id, action: "poster-only", seconds: 0 };
  }

  await setStatus(id, "processing");
  const dir = await mkdtemp(path.join(tmpdir(), "tpi-video-"));
  const input = path.join(dir, "input");
  const output = path.join(dir, "output.mp4");
  const poster = path.join(dir, "poster.jpg");

  try {
    await download(row.blob_url, input);
    const info = await inspect(input);
    const isHevc = info.codec === "hevc";
    const inputSize = (await stat(input)).size;

    let action: "remuxed" | "transcoded" = "remuxed";
    if (isHevc) {
      if (inputSize > MAX_TRANSCODE_BYTES) {
        await setStatus(id, "pending", "HEVC file too large for inline conversion; waiting for worker");
        return { ok: false, id, error: "deferred: large HEVC", deferred: true };
      }
      action = "transcoded";
      const scale = "scale='if(gt(iw,ih),min(1920,iw),-2)':'if(gt(iw,ih),-2,min(1920,ih))'";
      const r = await run(
        ["-y", "-hide_banner", "-loglevel", "error", "-i", input, "-map", "0:v:0", "-map", "0:a:0?",
         "-vf", scale, "-c:v", "libx264", "-preset", "veryfast", "-crf", "22", "-pix_fmt", "yuv420p",
         "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", output],
        Math.max(30_000, budgetMs - (Date.now() - started) - 20_000)
      );
      if (r.code !== 0) throw new Error(`transcode failed: ${r.stderr.trim().split("\n").pop()}`);
    } else {
      const r = await run(
        ["-y", "-hide_banner", "-loglevel", "error", "-i", input, "-map", "0:v:0", "-map", "0:a:0?",
         "-c", "copy", "-movflags", "+faststart", output],
        Math.max(30_000, budgetMs - (Date.now() - started) - 20_000)
      );
      if (r.code !== 0) throw new Error(`remux failed: ${r.stderr.trim().split("\n").pop()}`);
    }

    // Poster one second in (or the first frame for very short clips), max 960px wide
    const seek = info.duration && info.duration > 1.5 ? "1" : "0";
    const p = await run(
      ["-y", "-hide_banner", "-loglevel", "error", "-ss", seek, "-i", output, "-frames:v", "1",
       "-vf", "scale='min(960,iw)':-2", "-q:v", "4", poster],
      60_000
    );
    if (p.code !== 0) throw new Error(`poster failed: ${p.stderr.trim().split("\n").pop()}`);

    const outInfo = await inspect(output);
    const base = path.basename(new URL(row.blob_url).pathname).replace(/\.[^.]+$/, "");
    const [videoBlob, posterBlob] = await Promise.all([
      put(`media/${base}.mp4`, await readFile(output), { access: "public", contentType: "video/mp4", addRandomSuffix: false }),
      put(`media/posters/${base}.jpg`, await readFile(poster), { access: "public", contentType: "image/jpeg", addRandomSuffix: false }),
    ]);
    const outSize = (await stat(output)).size;

    await sql`
      UPDATE media_assets
      SET blob_url = ${videoBlob.url},
          mime_type = 'video/mp4',
          file_size = ${outSize},
          poster_url = ${posterBlob.url},
          width = ${outInfo.width ?? info.width},
          height = ${outInfo.height ?? info.height},
          duration_seconds = ${outInfo.duration ?? info.duration},
          processing_status = 'done',
          processing_error = NULL,
          updated_at = NOW()
      WHERE id = ${id}
    `;

    // The old file is removed unless the caller wants to keep it (backfill dry runs)
    if (videoBlob.url !== row.blob_url && !options.keepOriginal) {
      await deleteBlobs([row.blob_url]);
    }

    return { ok: true, id, action, seconds: Math.round((Date.now() - started) / 1000) };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await setStatus(id, "failed", message.slice(0, 500));
    return { ok: false, id, error: message };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
