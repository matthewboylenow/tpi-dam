import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { deleteInvitation } from "@/lib/db/queries";

/**
 * DELETE /api/invitations/[id]
 * Revoke/delete an invitation (admin only)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    await deleteInvitation(params.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting invitation:", error);
    return NextResponse.json(
      { error: "Failed to delete invitation" },
      { status: 500 }
    );
  }
}
