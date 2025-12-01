import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { generateUniqueFilename } from "@/lib/blob/upload";

/**
 * Handle file upload to Vercel Blob
 * Client sends multipart/form-data with file
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get file from form data
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type (images and videos only)
    const validTypes = ["image/", "video/"];
    if (!validTypes.some((type) => file.type.startsWith(type))) {
      return NextResponse.json(
        { error: "Only images and videos are allowed" },
        { status: 400 }
      );
    }

    // Generate unique filename and upload to Blob
    const filename = generateUniqueFilename(file.name);
    const pathname = `media/${user.id}/${filename}`;

    const blob = await put(pathname, file, {
      access: "public",
    });

    return NextResponse.json({
      success: true,
      blob_url: blob.url,
      pathname: blob.pathname,
      mime_type: file.type,
      file_size: file.size,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
