"use client";

import { useEffect, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DropzoneUpload } from "@/components/upload/DropzoneUpload";
import { IPhoneRecordingHelp } from "@/components/upload/iPhoneRecordingHelp";
import { useClientNames } from "@/lib/api/hooks";
import { createMediaRecord } from "@/lib/api/mutations";
import type { FolderWithCount } from "@/types/folder";
import { generateUniqueFilename } from "@/lib/utils/filename";

type Props = {
  onSuccess: () => void;
  onCancel: () => void;
  /** Reports whether uploads are in flight so the container can block closing. */
  onBusyChange?: (busy: boolean) => void;
  folders?: FolderWithCount[];
  defaultFolderId?: string | null;
};

type UploadItem = {
  id: string;
  file: File;
  previewUrl: string | null;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  error?: string;
};

const MAX_FILE_SIZE = 200 * 1024 * 1024;
const MULTIPART_THRESHOLD = 20 * 1024 * 1024;
const CONCURRENT_UPLOADS = 2;
const LAST_CLIENT_KEY = "tpi-dam:last-client";

const VALID_IMAGE_TYPES = [
  "image/jpeg", "image/jpg", "image/png", "image/gif",
  "image/webp", "image/heic", "image/heif",
];
const VALID_VIDEO_TYPES = [
  "video/mp4", "video/quicktime", "video/x-m4v",
  "video/mpeg", "video/x-quicktime",
];

function readLastClient(): string {
  try {
    return localStorage.getItem(LAST_CLIENT_KEY) ?? "";
  } catch {
    return "";
  }
}

function rememberClient(name: string) {
  try {
    if (name) localStorage.setItem(LAST_CLIENT_KEY, name);
  } catch {
    // storage unavailable (private mode); nothing to do
  }
}

function itemId(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

function validate(file: File): string | undefined {
  if (file.size > MAX_FILE_SIZE) return "Over the 200MB limit";
  // Some phones report an empty type for camera captures; let the server decide those.
  if (file.type && !VALID_IMAGE_TYPES.includes(file.type) && !VALID_VIDEO_TYPES.includes(file.type)) {
    return "Unsupported format";
  }
  return undefined;
}

function friendlyError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if (/network|fetch|Failed to fetch/i.test(message)) return "Network error. Check your connection and retry.";
  if (/size|too large/i.test(message)) return "File is too large";
  return message || "Upload failed";
}

function formatSize(bytes: number) {
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function BulkMediaUploadForm({
  onSuccess,
  onCancel,
  onBusyChange,
  folders = [],
  defaultFolderId = null,
}: Props) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [caption, setCaption] = useState("");
  const [clientName, setClientName] = useState("");
  const [tags, setTags] = useState("");
  const [folderId, setFolderId] = useState<string | null>(defaultFolderId);
  const [showMore, setShowMore] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const clientSuggestions = useClientNames();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const libraryInputRef = useRef<HTMLInputElement>(null);

  // Pre-fill the client the rep used last time; on the road it's usually the same one.
  useEffect(() => {
    setClientName(readLastClient());
  }, []);

  useEffect(() => {
    onBusyChange?.(isUploading);
  }, [isUploading, onBusyChange]);

  // Release image previews when they're no longer shown
  useEffect(() => {
    return () => {
      items.forEach((i) => i.previewUrl && URL.revokeObjectURL(i.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addFiles(files: File[]) {
    setItems((prev) => {
      const known = new Set(prev.map((i) => i.id));
      const additions: UploadItem[] = [];
      for (const file of files) {
        const id = itemId(file);
        if (known.has(id)) continue;
        known.add(id);
        const error = validate(file);
        additions.push({
          id,
          file,
          previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
          status: error ? "error" : "pending",
          progress: 0,
          error,
        });
      }
      return [...prev, ...additions];
    });
  }

  function removeItem(id: string) {
    setItems((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  }

  function patchItem(id: string, patch: Partial<UploadItem>) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length) addFiles(files);
    e.target.value = ""; // allow picking the same file again later
  }

  async function uploadOne(item: UploadItem) {
    patchItem(item.id, { status: "uploading", progress: 0, error: undefined });
    try {
      const filename = generateUniqueFilename(item.file.name || "capture.jpg");
      const blob = await upload(`media/${filename}`, item.file, {
        access: "public",
        handleUploadUrl: "/api/upload/client",
        multipart: item.file.size > MULTIPART_THRESHOLD,
        onUploadProgress: ({ percentage }) => {
          // Hold at 95% until the database record is written
          patchItem(item.id, { progress: Math.min(95, Math.round(percentage)) });
        },
      });

      const tagArray = tags.split(",").map((t) => t.trim()).filter(Boolean);
      const trimmedClient = clientName.trim();
      const dateLabel = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const defaultCaption = trimmedClient ? `${trimmedClient} – ${dateLabel}` : item.file.name;

      await createMediaRecord({
        blob_url: blob.url,
        caption: caption.trim() || defaultCaption,
        client_name: trimmedClient || undefined,
        mime_type: item.file.type || undefined,
        file_size: item.file.size,
        tags: tagArray.length > 0 ? tagArray : undefined,
        folder_id: folderId || null,
      });

      patchItem(item.id, { status: "success", progress: 100 });
    } catch (err) {
      patchItem(item.id, { status: "error", progress: 0, error: friendlyError(err) });
    }
  }

  async function runQueue(queue: UploadItem[]) {
    if (queue.length === 0) return;
    setIsUploading(true);
    rememberClient(clientName.trim());
    const pending = [...queue];
    // A few workers pull from the shared queue so big videos overlap
    await Promise.all(
      Array.from({ length: Math.min(CONCURRENT_UPLOADS, pending.length) }, async () => {
        while (pending.length > 0) {
          const next = pending.shift();
          if (next) await uploadOne(next);
        }
      })
    );
    setIsUploading(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    runQueue(items.filter((i) => i.status === "pending"));
  }

  function handleRetryFailed() {
    runQueue(items.filter((i) => i.status === "error" && !validate(i.file)));
  }

  function resetForAnother() {
    items.forEach((i) => i.previewUrl && URL.revokeObjectURL(i.previewUrl));
    setItems([]);
    setCaption("");
    setTags("");
  }

  const total = items.length;
  const successCount = items.filter((i) => i.status === "success").length;
  const errorCount = items.filter((i) => i.status === "error").length;
  const retryableCount = items.filter((i) => i.status === "error" && !validate(i.file)).length;
  const pendingCount = items.filter((i) => i.status === "pending").length;
  const uploadingCount = items.filter((i) => i.status === "uploading").length;
  const overallProgress = total
    ? Math.round(items.reduce((sum, i) => sum + (i.status === "success" ? 100 : i.progress), 0) / total)
    : 0;
  const finished = total > 0 && !isUploading && pendingCount === 0 && uploadingCount === 0;
  const allSucceeded = finished && successCount === total;

  return (
    <div className="bg-white dark:bg-slate-800 sm:rounded-lg rounded-t-lg border border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col h-full sm:h-auto sm:max-h-[90vh] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-primary/10 dark:bg-brand-accent/15 flex items-center justify-center">
            <svg className="w-5 h-5 text-brand-primary dark:text-brand-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Upload Media</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500">Photos and videos up to 200MB each</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCancel}
          disabled={isUploading}
          className="p-2 -mr-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors disabled:opacity-40"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-5">
          {allSucceeded ? (
            <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  {successCount} file{successCount !== 1 ? "s" : ""} uploaded
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {clientName.trim() ? `Filed under ${clientName.trim()}. ` : ""}Marketing can see it now.
                </p>
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="primary" onClick={onSuccess}>Done</Button>
                <Button type="button" variant="secondary" onClick={resetForAnother}>Upload more</Button>
              </div>
            </div>
          ) : (
            <>
              {/* Hidden inputs behind the phone buttons */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*,video/*"
                capture="environment"
                className="hidden"
                onChange={handleInputChange}
              />
              <input
                ref={libraryInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={handleInputChange}
              />

              {/* Phone: two big taps. */}
              {!isUploading && (
                <div className="grid grid-cols-2 gap-3 sm:hidden">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-2 py-6 rounded-lg border-2 border-brand-primary/30 dark:border-brand-accent/40 bg-brand-primary/5 dark:bg-brand-accent/10 text-brand-primary dark:text-brand-accent active:scale-[0.98] transition-transform"
                  >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm font-semibold">Take photo or video</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => libraryInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-2 py-6 rounded-lg border-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/40 text-slate-700 dark:text-slate-200 active:scale-[0.98] transition-transform"
                  >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-semibold">Choose from library</span>
                  </button>
                </div>
              )}

              {/* Desktop: drag and drop. */}
              {!isUploading && (
                <div className="hidden sm:block">
                  <DropzoneUpload onFilesSelect={addFiles} disabled={isUploading} selectedFiles={[]} />
                </div>
              )}

              {/* Selected files */}
              {total > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    <span>
                      {isUploading
                        ? `Uploading ${successCount + uploadingCount}/${total}`
                        : `${total} file${total !== 1 ? "s" : ""} selected`}
                    </span>
                    {isUploading && <span className="text-brand-primary dark:text-brand-accent">{overallProgress}%</span>}
                    {!isUploading && errorCount > 0 && <span className="text-red-500">{errorCount} failed</span>}
                  </div>

                  {isUploading && (
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                      <div
                        className="bg-brand-primary dark:bg-brand-accent h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${overallProgress}%` }}
                      />
                    </div>
                  )}

                  <ul className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {items.map((item) => (
                      <li
                        key={item.id}
                        className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
                      >
                        {item.previewUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.previewUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-slate-400 dark:text-slate-500">
                            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                            <span className="text-[10px] uppercase font-semibold">Video</span>
                          </div>
                        )}

                        {/* Status overlay */}
                        {item.status === "uploading" && (
                          <div className="absolute inset-0 bg-slate-900/50 flex flex-col items-center justify-center gap-1 text-white">
                            <span className="text-sm font-semibold">{item.progress}%</span>
                            <div className="w-3/4 bg-white/30 rounded-full h-1">
                              <div className="bg-white h-1 rounded-full transition-all" style={{ width: `${item.progress}%` }} />
                            </div>
                          </div>
                        )}
                        {item.status === "success" && (
                          <div className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shadow">
                            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                        {item.status === "error" && (
                          <div className="absolute inset-0 bg-red-600/70 flex items-center justify-center p-1.5 text-center">
                            <span className="text-[11px] leading-tight font-medium text-white">{item.error}</span>
                          </div>
                        )}

                        {/* Size */}
                        <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-slate-900/60 text-[10px] text-white">
                          {formatSize(item.file.size)}
                        </span>

                        {/* Remove (always visible: no hover on phones) */}
                        {!isUploading && item.status !== "success" && (
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="absolute top-1 right-1 w-7 h-7 rounded-full bg-slate-900/70 hover:bg-red-600 text-white flex items-center justify-center transition-colors"
                            aria-label={`Remove ${item.file.name}`}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Details */}
              {total > 0 && !isUploading && (
                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Input
                        label="Client"
                        list="client-suggestions"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="Who is this for?"
                        autoComplete="off"
                        fullWidth
                      />
                      <datalist id="client-suggestions">
                        {clientSuggestions.map((name) => (
                          <option key={name} value={name} />
                        ))}
                      </datalist>
                    </div>

                    {folders.length > 0 && (
                      <div className="flex flex-col gap-1">
                        <label htmlFor="upload-folder" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Folder
                        </label>
                        <select
                          id="upload-folder"
                          value={folderId ?? ""}
                          onChange={(e) => setFolderId(e.target.value || null)}
                          className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary-light focus:border-transparent"
                        >
                          <option value="">No folder</option>
                          {folders.map((folder) => (
                            <option key={folder.id} value={folder.id}>
                              {folder.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <Input
                    label="What is this?"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder={clientName.trim() ? `e.g. New install at ${clientName.trim()}` : "e.g. Finished install, front entrance"}
                    fullWidth
                  />

                  <button
                    type="button"
                    onClick={() => setShowMore((v) => !v)}
                    className="text-sm text-brand-primary-light dark:text-brand-accent font-medium flex items-center gap-1"
                  >
                    <svg className={`w-4 h-4 transition-transform ${showMore ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    {showMore ? "Fewer options" : "More options"}
                  </button>

                  {showMore && (
                    <div className="space-y-4">
                      <Input
                        label="Tags"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="machine, demo, before-after (comma separated)"
                        fullWidth
                      />
                      <IPhoneRecordingHelp />
                    </div>
                  )}
                </div>
              )}

              {total === 0 && (
                <div className="sm:hidden">
                  <IPhoneRecordingHelp />
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!allSucceeded && (
          <div className="px-4 sm:px-6 py-3 sm:py-4 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-3 flex-shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="text-sm text-slate-500 dark:text-slate-400 min-w-0 truncate">
              {isUploading ? (
                <span className="text-brand-primary dark:text-brand-accent font-medium">Keep this open until it finishes</span>
              ) : finished && errorCount > 0 ? (
                <span>{successCount} uploaded, {errorCount} failed</span>
              ) : total > 0 ? (
                <span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{pendingCount}</span> ready
                  {errorCount > 0 && <span className="text-red-500 ml-2">· {errorCount} can&apos;t upload</span>}
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {finished && errorCount > 0 ? (
                <>
                  <Button type="button" variant="secondary" onClick={onSuccess}>Done</Button>
                  {retryableCount > 0 && (
                    <Button type="button" variant="primary" onClick={handleRetryFailed}>
                      Retry failed
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button type="button" variant="secondary" onClick={onCancel} disabled={isUploading}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" disabled={pendingCount === 0 || isUploading}>
                    {isUploading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Uploading…
                      </span>
                    ) : (
                      `Upload${pendingCount > 0 ? ` ${pendingCount}` : ""}`
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
