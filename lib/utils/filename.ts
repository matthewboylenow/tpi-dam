/**
 * Generate a unique filename with timestamp
 * Safe to use on client or server
 */
export function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split(".").pop();
  const nameWithoutExt = originalName.replace(`.${extension}`, "");
  const sanitized = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();

  return `${sanitized}-${timestamp}-${randomStr}.${extension}`;
}
