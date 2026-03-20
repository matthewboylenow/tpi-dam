import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/getCurrentUser";
import { sql } from "@vercel/postgres";
import { deleteMediaAsset, getMediaAssets } from "@/lib/db/queries";

type Params = { params: { id: string } };

// PATCH /api/admin/users/[id] — update role
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { role } = await request.json();

    if (role !== "sales" && role !== "admin") {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    await sql`UPDATE users SET role = ${role} WHERE id = ${params.id}`;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message?.includes("Unauthorized") || error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error updating user role:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

// DELETE /api/admin/users/[id] — delete user
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin();

    // Prevent deleting yourself
    if (admin.id === params.id) {
      return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
    }

    await sql`DELETE FROM users WHERE id = ${params.id}`;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message?.includes("Unauthorized") || error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
