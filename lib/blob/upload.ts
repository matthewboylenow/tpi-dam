import { put } from "@vercel/blob";
import { generateUniqueFilename } from "@/lib/utils/filename";

// Re-export for backwards compatibility
export { generateUniqueFilename };

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
