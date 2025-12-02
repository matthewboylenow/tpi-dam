import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { toggleMediaStarred } from "@/lib/db/queries";

/**
 * PATCH /api/media/[id]/star
 * Toggle starred status (admin only)
 */
export async function PATCH(
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

    const body = await req.json();
    const { is_starred } = body;

    if (typeof is_starred !== "boolean") {
      return NextResponse.json(
        { error: "is_starred must be a boolean" },
        { status: 400 }
      );
    }

    await toggleMediaStarred(params.id, is_starred);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error toggling starred status:", error);
    return NextResponse.json(
      { error: "Failed to update starred status" },
      { status: 500 }
    );
  }
}
