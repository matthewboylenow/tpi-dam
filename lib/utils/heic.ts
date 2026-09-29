/**
 * iPhone photos arrive as HEIC unless the camera is set to "Most Compatible".
 * Safari can show HEIC; Chrome, Edge, Firefox and Android can't. So the
 * browser converts HEIC to JPEG before upload, and the library only ever
 * stores something every browser can display. Browser-only module.
 */

export function isHeicFile(file: File): boolean {
  const type = (file.type || "").toLowerCase();
  if (type === "image/heic" || type === "image/heif" || type === "image/heic-sequence" || type === "image/heif-sequence") {
    return true;
  }
  // Windows and some Android builds report no MIME type for .heic
  return /\.(heic|heif)$/i.test(file.name);
}

export function isHeicUrl(url: string): boolean {
  try {
    return /\.(heic|heif)$/i.test(new URL(url).pathname);
  } catch {
    return /\.(heic|heif)$/i.test(url);
  }
}

/**
 * Convert a HEIC/HEIF file to a JPEG File. The converter (libheif compiled
 * to WebAssembly) is loaded on first use so it never weighs down page load.
 * Throws if the file can't be decoded; callers decide whether to upload the
 * original anyway.
 */
export async function convertHeicToJpeg(file: File, quality = 0.9): Promise<File> {
  const { default: heic2any } = await import("heic2any");
  const result = await heic2any({ blob: file, toType: "image/jpeg", quality });
  const blob = Array.isArray(result) ? result[0] : result;
  const name = file.name.replace(/\.(heic|heif)$/i, "") + ".jpg";
  return new File([blob], name, { type: "image/jpeg", lastModified: file.lastModified });
}
