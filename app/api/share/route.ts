import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireAuth } from "@/lib/auth/getCurrentUser";
import { sql } from "@vercel/postgres";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { media_id, expires_in_days = 7 } = await request.json();

    if (!media_id) {
      return NextResponse.json({ error: "media_id is required" }, { status: 400 });
    }

    // Verify the media belongs to the user (or user is admin)
    const media = await sql`
      SELECT id, owner_user_id FROM media_assets WHERE id = ${media_id} LIMIT 1
    `;

    if (!media.rows[0]) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    if (media.rows[0].owner_user_id !== user.id && user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + expires_in_days * 24 * 60 * 60 * 1000);

    await sql`
      INSERT INTO share_links (token, media_id, created_by, expires_at)
      VALUES (${token}, ${media_id}, ${user.id}, ${expiresAt.toISOString()})
    `;

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const shareUrl = `${baseUrl}/share/${token}`;

    return NextResponse.json({ success: true, shareUrl, expiresAt });
  } catch (error: any) {
    if (error.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Share link error:", error);
    return NextResponse.json({ error: "Failed to create share link" }, { status: 500 });
  }
}
