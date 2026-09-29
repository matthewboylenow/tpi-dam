import { del } from "@vercel/blob";

const BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";

/** Only URLs on our own Blob store are ever deleted. */
function isOurBlob(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith(BLOB_HOST_SUFFIX);
  } catch {
    return false;
  }
}

/**
 * Remove files from Blob storage. Failures are logged, not thrown: the
 * database row is already gone and a stray file costs far less than a
 * failed delete would confuse the user.
 */
export async function deleteBlobs(urls: Array<string | null | undefined>): Promise<void> {
  const targets = urls.filter((u): u is string => !!u && isOurBlob(u));
  if (targets.length === 0) return;
  try {
    await del(targets);
  } catch (error) {
    console.error("Blob delete failed:", targets, error);
  }
}
