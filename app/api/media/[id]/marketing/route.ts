import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getMediaAssetById, setMediaReview, setMediaUsage } from "@/lib/db/queries";
import { marketingUpdateSchema } from "@/lib/validation/mediaSchemas";

/**
 * PATCH /api/media/[id]/marketing  (admin only)
 * Body: { reviewed?: boolean, used_on?: ("web"|"social"|"print"|"email")[] }
 * Marks an upload as looked at by marketing and/or records where it was used.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const validation = marketingUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const media = await getMediaAssetById(params.id);
    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    const { reviewed, used_on } = validation.data;
    if (reviewed !== undefined) {
      await setMediaReview(params.id, reviewed, user.id);
    }
    if (used_on !== undefined) {
      await setMediaUsage(params.id, used_on);
      // Using something implies it was looked at
      if (used_on.length > 0 && !media.reviewed_at && reviewed === undefined) {
        await setMediaReview(params.id, true, user.id);
      }
    }

    const updated = await getMediaAssetById(params.id);
    return NextResponse.json({ success: true, media: updated });
  } catch (error) {
    console.error("Marketing update error:", error);
    return NextResponse.json({ error: "Failed to update media" }, { status: 500 });
  }
}
