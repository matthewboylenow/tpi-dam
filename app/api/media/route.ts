import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import {
  createMediaAsset,
  getMediaAssets,
  addTagsToMedia,
  getFolderById,
} from "@/lib/db/queries";
import {
  createMediaSchema,
  mediaFilterSchema,
} from "@/lib/validation/mediaSchemas";

/**
 * POST /api/media
 * Create a new media asset record after file is uploaded
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Validate input
    const validation = createMediaSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { blob_url, caption, client_name, mime_type, file_size, tags, folder_id } =
      validation.data;

    if (folder_id) {
      const folder = await getFolderById(folder_id);
      if (!folder) {
        return NextResponse.json({ error: "Folder not found" }, { status: 404 });
      }
    }

    // Create media asset record
    const mediaAsset = await createMediaAsset({
      owner_user_id: user.id,
      blob_url,
      caption,
      client_name,
      mime_type,
      file_size,
      folder_id: folder_id ?? null,
    });

    // Add tags if provided
    if (tags && tags.length > 0) {
      await addTagsToMedia(mediaAsset.id, tags);
    }

    return NextResponse.json(
      {
        success: true,
        media: mediaAsset,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create media error:", error);
    return NextResponse.json(
      { error: "Failed to create media record" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/media
 * List and filter media assets
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const scope = searchParams.get("scope") || "mine";
    const client_name = searchParams.get("client_name") || undefined;
    const tag = searchParams.get("tag") || undefined;
    const search = searchParams.get("search") || undefined;
    const from = searchParams.get("from") || undefined;
    const to = searchParams.get("to") || undefined;
    const folder_id = searchParams.get("folder_id") || undefined;
    const sort_by = (searchParams.get("sort_by") || "created_at") as "created_at" | "file_size" | "client_name";
    const sort_order = (searchParams.get("sort_order") || "desc") as "asc" | "desc";
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const review = searchParams.get("review") || undefined;
    const used = searchParams.get("used") || undefined;

    // Validate filter params
    const filterValidation = mediaFilterSchema.safeParse({
      scope,
      client_name,
      tag,
      search,
      from,
      to,
      limit,
      offset,
      review,
      used,
    });

    if (!filterValidation.success) {
      return NextResponse.json(
        { error: "Invalid filter parameters" },
        { status: 400 }
      );
    }

    // Build filter params
    const filterParams = {
      owner_user_id: scope === "mine" ? user.id : undefined,
      client_name,
      tag,
      search,
      from,
      to,
      folder_id,
      review: filterValidation.data.review,
      used: filterValidation.data.used,
      sort_by,
      sort_order,
      limit,
      offset,
    };

    // Fetch media assets
    const media = await getMediaAssets(filterParams);

    return NextResponse.json({
      success: true,
      media,
      count: media.length,
    });
  } catch (error) {
    console.error("Get media error:", error);
    return NextResponse.json(
      { error: "Failed to fetch media" },
      { status: 500 }
    );
  }
}
