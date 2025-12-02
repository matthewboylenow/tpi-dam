import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { requireAdmin } from "@/lib/auth/getCurrentUser";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Only admins can star folders
    await requireAdmin();

    const folderId = params.id;

    // Toggle starred status
    const result = await sql`
      UPDATE folders
      SET is_starred = NOT is_starred, updated_at = NOW()
      WHERE id = ${folderId}
      RETURNING id, is_starred
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Folder not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      folder: result.rows[0],
    });
  } catch (error) {
    console.error("Failed to toggle folder star:", error);
    return NextResponse.json(
      { success: false, message: "Failed to toggle folder star" },
      { status: 500 }
    );
  }
}
