import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getMediaStats } from "@/lib/db/queries";

// Always served per request: it depends on the caller's session cookie.
export const dynamic = "force-dynamic";

/**
 * GET /api/media/stats  (admin only)
 * Counts for the review queue: total, unreviewed, used, recent.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const stats = await getMediaStats();
    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error("Media stats error:", error);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
