import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getMediaAssetById, deleteMediaAsset, updateMediaAsset } from "@/lib/db/queries";

/**
 * GET /api/media/[id]
 * Get a single media asset by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const media = await getMediaAssetById(params.id);

    if (!media) {
      return NextResponse.json(
        { error: "Media not found" },
        { status: 404 }
      );
    }

    // Check permissions: user can view their own or admin can view all
    if (media.owner_user_id !== user.id && user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      media,
    });
  } catch (error) {
    console.error("Get media by ID error:", error);
    return NextResponse.json(
      { error: "Failed to fetch media" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/media/[id]
 * Delete a media asset (owner or admin only)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const media = await getMediaAssetById(params.id);

    if (!media) {
      return NextResponse.json(
        { error: "Media not found" },
        { status: 404 }
      );
    }

    // Check permissions: user can delete their own or admin can delete any
    if (media.owner_user_id !== user.id && user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    await deleteMediaAsset(params.id);

    return NextResponse.json({
      success: true,
      message: "Media deleted successfully",
    });
  } catch (error) {
    console.error("Delete media error:", error);
    return NextResponse.json(
      { error: "Failed to delete media" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/media/[id]
 * Update a media asset (admin only)
 * Supports updating blob_url/file_size (for image editing) or caption (for renaming)
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
    const { blob_url, file_size, caption } = body;

    // Validate that at least one field is provided
    if (!blob_url && !file_size && caption === undefined) {
      return NextResponse.json(
        { error: "At least one field (blob_url, file_size, or caption) is required" },
        { status: 400 }
      );
    }

    // If updating blob_url or file_size, both must be provided
    if ((blob_url && !file_size) || (!blob_url && file_size)) {
      return NextResponse.json(
        { error: "Both blob_url and file_size are required when updating media files" },
        { status: 400 }
      );
    }

    await updateMediaAsset(params.id, { blob_url, file_size, caption });

    return NextResponse.json({
      success: true,
      message: "Media updated successfully",
    });
  } catch (error) {
    console.error("Update media error:", error);
    return NextResponse.json(
      { error: "Failed to update media" },
      { status: 500 }
    );
  }
}
