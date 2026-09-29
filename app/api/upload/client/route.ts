import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

/**
 * Handle client-side upload tokens for Vercel Blob
 * This endpoint generates tokens that allow direct browser-to-blob uploads,
 * bypassing the serverless function payload limit (4.5MB)
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: HandleUploadBody;
    try {
      body = (await req.json()) as HandleUploadBody;
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        // Validate file type from pathname
        const ext = pathname.split(".").pop()?.toLowerCase();
        const validImageExts = ["jpg", "jpeg", "png", "gif", "webp", "heic", "heif"];
        const validVideoExts = ["mp4", "mov", "m4v", "mpeg", "quicktime"];
        const validExts = [...validImageExts, ...validVideoExts];

        if (!ext || !validExts.includes(ext)) {
          throw new Error("Only images and videos are allowed");
        }

        return {
          allowedContentTypes: [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
            "image/webp",
            "image/heic",
            "image/heif",
            "video/mp4",
            "video/quicktime",
            "video/x-m4v",
            "video/mpeg",
            "video/x-quicktime",
          ],
          maximumSizeInBytes: 200 * 1024 * 1024, // 200MB
          tokenPayload: JSON.stringify({
            userId: user.id,
          }),
        };
      },
      onUploadCompleted: async () => {
        // The browser creates the media record itself after the upload
        // (see BulkMediaUploadForm), so nothing is needed here.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("Client upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}
