import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const result = await sql`
      SELECT
        sl.expires_at,
        m.id, m.blob_url, m.caption, m.client_name, m.mime_type, m.file_size, m.created_at,
        COALESCE(
          ARRAY_AGG(t.name) FILTER (WHERE t.name IS NOT NULL),
          ARRAY[]::TEXT[]
        ) as tags
      FROM share_links sl
      JOIN media_assets m ON sl.media_id = m.id
      LEFT JOIN media_tags mt ON m.id = mt.media_id
      LEFT JOIN tags t ON mt.tag_id = t.id
      WHERE sl.token = ${params.token}
      GROUP BY sl.expires_at, m.id
    `;

    const row = result.rows[0];
    if (!row) {
      return NextResponse.json({ error: "Share link not found" }, { status: 404 });
    }

    if (new Date(row.expires_at) < new Date()) {
      return NextResponse.json({ error: "Share link has expired" }, { status: 410 });
    }

    return NextResponse.json({ media: row, expiresAt: row.expires_at });
  } catch (error) {
    console.error("Share fetch error:", error);
    return NextResponse.json({ error: "Failed to load shared content" }, { status: 500 });
  }
}
