import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getMediaAssetById, getFolderById } from "@/lib/db/queries";
import { sql } from "@vercel/postgres";

/**
 * PATCH /api/media/[id]/move
 * Move media to a different folder (owner or admin only).
 * Body: { folder_id: string | null } — null removes it from its folder.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    let body: { folder_id?: unknown };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const folderId = body.folder_id ?? null;
    if (folderId !== null && typeof folderId !== "string") {
      return NextResponse.json({ error: "folder_id must be a string or null" }, { status: 400 });
    }

    const media = await getMediaAssetById(params.id);
    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    if (media.owner_user_id !== user.id && user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (folderId !== null) {
      const folder = await getFolderById(folderId);
      if (!folder) {
        return NextResponse.json({ error: "Folder not found" }, { status: 404 });
      }
    }

    await sql`
      UPDATE media_assets
      SET folder_id = ${folderId}
      WHERE id = ${params.id}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error moving media:", error);
    return NextResponse.json(
      { error: "Failed to move media" },
      { status: 500 }
    );
  }
}
