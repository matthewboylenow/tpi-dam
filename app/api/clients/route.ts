import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getRecentClientNames } from "@/lib/db/queries";

/**
 * GET /api/clients
 * Distinct client names already used on uploads, most recent first.
 */
// Always served per request: it depends on the caller's session cookie.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clients = await getRecentClientNames();
    return NextResponse.json({ success: true, clients });
  } catch (error) {
    console.error("Get clients error:", error);
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 });
  }
}
