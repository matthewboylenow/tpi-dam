/**
 * Download helpers. getDownloadUrl is safe anywhere; the others run in the browser only.
 *
 * Vercel Blob files live on another origin, so the browser ignores the
 * `download` attribute on a plain link and just opens the file. For a video
 * that means it plays in a new tab instead of downloading. Public Vercel Blob
 * URLs accept `?download=1`, which makes the server send
 * `Content-Disposition: attachment`, so the browser saves the file instead.
 */

const BLOB_HOST_SUFFIX = ".blob.vercel-storage.com";

/** URL that forces a download for Vercel Blob files; other URLs pass through. */
export function getDownloadUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.endsWith(BLOB_HOST_SUFFIX)) {
      parsed.searchParams.set("download", "1");
      return parsed.toString();
    }
  } catch {
    // Not an absolute URL; leave it alone.
  }
  return url;
}

/** Start a download of `url` without leaving the page. */
export function triggerDownload(url: string) {
  const a = document.createElement("a");
  a.href = getDownloadUrl(url);
  a.rel = "noopener";
  a.download = "";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

type Downloadable = {
  blob_url: string;
  caption?: string | null;
  mime_type?: string | null;
};

function fileNameFor(media: Downloadable, type: string) {
  const fromUrl = media.blob_url.split("?")[0].split("/").pop() || "file";
  const ext = fromUrl.includes(".") ? fromUrl.split(".").pop() : type.split("/").pop();
  const base = (media.caption || "").trim().replace(/[\\/:*?"<>|]+/g, "-");
  return base ? `${base}.${ext}` : fromUrl;
}

/**
 * Phones get the share sheet (so a video or photo can go straight to the
 * camera roll); everything else gets a real file download.
 */
export async function downloadOrShareMedia(media: Downloadable) {
  const isMobile = typeof navigator !== "undefined" && /mobile|iphone|ipad|android/i.test(navigator.userAgent);

  if (isMobile && typeof navigator.share === "function") {
    try {
      const response = await fetch(media.blob_url);
      const blob = await response.blob();
      const type = blob.type || media.mime_type || "application/octet-stream";
      const file = new File([blob], fileNameFor(media, type), { type });

      if (!navigator.canShare || navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: media.caption || "Media",
          text: `${media.caption || "Media"} from Taylor Products`,
        });
        return;
      }
    } catch (error) {
      // The person closed the share sheet; don't push a download on them.
      if (error instanceof DOMException && error.name === "AbortError") return;
      console.error("Share failed, falling back to download:", error);
    }
  }

  triggerDownload(media.blob_url);
}
