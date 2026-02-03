import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

/**
 * Handle client-side upload tokens for Vercel Blob
 * This endpoint generates tokens that allow direct browser-to-blob uploads,
 * bypassing the serverless function payload limit (4.5MB)
 */
export async function POST(req: NextRequest) {
  const body = (await req.json()) as HandleUploadBody;

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // This is called after the upload completes
        // We could create the media record here, but we'll let the client do it
        // to maintain consistency with the existing flow
        console.log("Upload completed:", blob.url);
        const payload = tokenPayload ? JSON.parse(tokenPayload) : null;
        console.log("User ID:", payload?.userId);
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
