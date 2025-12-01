import { put } from "@vercel/blob";

/**
 * Generate a unique filename with timestamp
 */
export function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split(".").pop();
  const nameWithoutExt = originalName.replace(`.${extension}`, "");
  const sanitized = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();

  return `${sanitized}-${timestamp}-${randomStr}.${extension}`;
}

/**
 * Upload a file directly to Vercel Blob
 * Use this for server-side uploads
 */
export async function uploadToBlob(
  file: File,
  userId: string
): Promise<{ url: string; pathname: string }> {
  const filename = generateUniqueFilename(file.name);
  const pathname = `media/${userId}/${filename}`;

  const blob = await put(pathname, file, {
    access: "public",
  });

  return {
    url: blob.url,
    pathname: blob.pathname,
  };
}

/**
 * Get upload URL for client-side upload
 * Returns a temporary upload URL that the client can PUT to
 */
export async function getUploadUrl(
  filename: string,
  userId: string,
  contentType?: string
): Promise<{ uploadUrl: string; blobUrl: string; pathname: string }> {
  const uniqueFilename = generateUniqueFilename(filename);
  const pathname = `media/${userId}/${uniqueFilename}`;

  // For Vercel Blob, we'll use the handleUpload pattern
  // This returns metadata that the client needs
  return {
    uploadUrl: `/api/upload`, // Client will POST file to this endpoint
    blobUrl: "", // Will be set after upload
    pathname,
  };
}
