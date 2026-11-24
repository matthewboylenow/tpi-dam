import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { processVideo } from "@/lib/video/process";

export const maxDuration = 300;

/**
 * POST /api/media/[id]/process  (admin only)
 * Re-run video processing for one item (after a failure, or to regenerate
 * the poster). Waits for the result so the UI can show it.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await processVideo(params.id, { force: true, budgetMs: 280_000 });
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error, deferred: result.deferred ?? false }, { status: 422 });
  }
  return NextResponse.json({ success: true, result });
}
