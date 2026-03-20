import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/getCurrentUser";
import { getAllUsers } from "@/lib/db/queries";

export async function GET() {
  try {
    await requireAdmin();
    const users = await getAllUsers();
    return NextResponse.json({ users });
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Forbidden") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
