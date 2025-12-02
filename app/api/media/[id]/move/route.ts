import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { sql } from "@vercel/postgres";

/**
 * PATCH /api/media/[id]/move
 * Move media to different folder
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

    const body = await req.json();
    const { folder_id } = body; // can be null to remove from folder

    // Update media asset
    await sql`
      UPDATE media_assets
      SET folder_id = ${folder_id}
      WHERE id = ${params.id}
    `;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error moving media:", error);
    return NextResponse.json(
      { error: "Failed to move media" },
      { status: 500 }
    );
  }
}
