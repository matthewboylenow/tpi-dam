"use client";

import { useState } from "react";
import { upload } from "@vercel/blob/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { FolderSelector } from "@/components/folders/FolderSelector";
import { DropzoneUpload } from "@/components/upload/DropzoneUpload";
import { IPhoneRecordingHelp } from "@/components/upload/iPhoneRecordingHelp";
import type { FolderWithCount } from "@/types/folder";
import { generateUniqueFilename } from "@/lib/utils/filename";

type Props = {
  onSuccess: () => void;
  onCancel: () => void;
  folders?: FolderWithCount[];
};

type FileUploadStatus = {
  file: File;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  error?: string;
};

const MAX_FILE_SIZE = 200 * 1024 * 1024;
const VALID_IMAGE_TYPES = [
  "image/jpeg", "image/jpg", "image/png", "image/gif",
  "image/webp", "image/heic", "image/heif",
];
const VALID_VIDEO_TYPES = [
  "video/mp4", "video/quicktime", "video/x-m4v",
  "video/mpeg", "video/x-quicktime",
];

const ERROR_MESSAGES: Record<string, string> = {
  FILE_TOO_LARGE: "Exceeds 200MB limit",
  INVALID_TYPE: "Unsupported format",
  UPLOAD_FAILED: "Upload failed — try again",
  NETWORK_ERROR: "Network error — check your connection",
  SERVER_ERROR: "Server error — try again later",
};

function getErrorMessage(error: string): string {
  return ERROR_MESSAGES[error] ?? error;
}

function StatusIcon({ status }: { status: FileUploadStatus["status"] }) {
  if (status === "success") return (
    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
      <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
    </div>
  );
  if (status === "error") return (
    <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
      <svg className="w-3.5 h-3.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </div>
  );
  if (status === "uploading") return (
    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
      <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  return (
    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
      <div className="w-2 h-2 rounded-full bg-slate-400" />
    </div>
  );
}

export function BulkMediaUploadForm({ onSuccess, onCancel, folders = [] }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [fileStatuses, setFileStatuses] = useState<Map<string, FileUploadStatus>>(new Map());
  const [caption, setCaption] = useState("");
  const [clientName, setClientName] = useState("");
  const [tags, setTags] = useState("");
  const [folderId, setFolderId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  function fileKey(file: File) {
    return `${file.name}-${file.size}`;
  }

  function handleFilesSelect(selectedFiles: File[]) {
    const newStatuses = new Map<string, FileUploadStatus>(fileStatuses);

    for (const file of selectedFiles) {
      const key = fileKey(file);
      if (newStatuses.has(key)) continue; // skip duplicates

      if (file.size > MAX_FILE_SIZE) {
        newStatuses.set(key, { file, status: "error", progress: 0, error: getErrorMessage("FILE_TOO_LARGE") });
        continue;
      }

      const valid = VALID_IMAGE_TYPES.includes(file.type) || VALID_VIDEO_TYPES.includes(file.type);
      if (!valid) {
        newStatuses.set(key, { file, status: "error", progress: 0, error: getErrorMessage("INVALID_TYPE") });
        continue;
      }

      newStatuses.set(key, { file, status: "pending", progress: 0 });
    }

    const allFiles = Array.from(newStatuses.values()).map(s => s.file);
    setFiles(allFiles);
    setFileStatuses(newStatuses);
  }

  function handleFileRemove(index: number) {
    const newFiles = files.filter((_, i) => i !== index);
    const newStatuses = new Map<string, FileUploadStatus>();
    for (const f of newFiles) {
      const key = fileKey(f);
      const existing = fileStatuses.get(key);
      if (existing) newStatuses.set(key, existing);
    }
    setFiles(newFiles);
    setFileStatuses(newStatuses);
  }

  async function uploadFile(file: File): Promise<void> {
    const key = fileKey(file);

    setFileStatuses(prev => {
      const next = new Map(prev);
      const s = next.get(key);
      if (s) next.set(key, { ...s, status: "uploading", progress: 15 });
      return next;
    });

    try {
      const filename = generateUniqueFilename(file.name);

      // Simulate smooth upload progress while the blob upload is in flight
      let simulatedProgress = 5;
      const progressInterval = setInterval(() => {
        simulatedProgress = Math.min(simulatedProgress + Math.random() * 6, 82);
        setFileStatuses(prev => {
          const next = new Map(prev);
          const s = next.get(key);
          if (s && s.status === "uploading") {
            next.set(key, { ...s, progress: Math.round(simulatedProgress) });
          }
          return next;
        });
      }, 400);

      let blob: Awaited<ReturnType<typeof upload>>;
      try {
        blob = await upload(`media/${filename}`, file, {
          access: "public",
          handleUploadUrl: "/api/upload/client",
        });
      } finally {
        clearInterval(progressInterval);
      }

      const tagArray = tags.split(",").map(t => t.trim()).filter(Boolean);

      const res = await fetch("/api/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blob_url: blob.url,
          caption: caption || file.name,
          client_name: clientName || undefined,
          mime_type: file.type,
          file_size: file.size,
          tags: tagArray.length > 0 ? tagArray : undefined,
          folder_id: folderId || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "SERVER_ERROR");
      }

      setFileStatuses(prev => {
        const next = new Map(prev);
        const s = next.get(key);
        if (s) next.set(key, { ...s, status: "success", progress: 100 });
        return next;
      });
    } catch (err: any) {
      setFileStatuses(prev => {
        const next = new Map(prev);
        const s = next.get(key);
        if (s) next.set(key, { ...s, status: "error", progress: 0, error: getErrorMessage(err.message) });
        return next;
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const pending = Array.from(fileStatuses.values()).filter(s => s.status === "pending").map(s => s.file);
    if (pending.length === 0) return;

    setIsUploading(true);
    for (const file of pending) {
      await uploadFile(file);
    }
    setIsUploading(false);

    const allDone = Array.from(fileStatuses.values()).every(s => s.status === "success");
    if (allDone) onSuccess();
  }

  const statuses = Array.from(fileStatuses.values());
  const totalCount = statuses.length;
  const successCount = statuses.filter(s => s.status === "success").length;
  const errorCount = statuses.filter(s => s.status === "error").length;
  const pendingCount = statuses.filter(s => s.status === "pending").length;
  const uploadingCount = statuses.filter(s => s.status === "uploading").length;
  const isActive = isUploading || uploadingCount > 0;
  const allSucceeded = totalCount > 0 && successCount === totalCount;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-primary/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Upload Media</h2>
            <p className="text-xs text-slate-400">Images and videos up to 200MB each</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCancel}
          disabled={isActive}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-40"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="p-6 space-y-6">
          {/* Success state */}
          {allSucceeded ? (
            <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900">
                  {successCount} file{successCount !== 1 ? "s" : ""} uploaded!
                </p>
                <p className="text-sm text-slate-500 mt-1">Your media is ready in the library</p>
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="primary" onClick={onSuccess}>View Library</Button>
                <Button type="button" variant="secondary" onClick={() => {
                  setFiles([]);
                  setFileStatuses(new Map());
                  setCaption("");
                  setClientName("");
                  setTags("");
                  setFolderId(null);
                }}>Upload More</Button>
              </div>
            </div>
          ) : (
            <>
              {/* Dropzone */}
              <DropzoneUpload
                onFilesSelect={handleFilesSelect}
                onFileRemove={handleFileRemove}
                disabled={isActive}
                selectedFiles={files}
              />

              {/* iPhone tip */}
              <IPhoneRecordingHelp />

              {/* Upload progress (shown during upload) */}
              {isActive && totalCount > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500 uppercase tracking-wide">
                    <span>Upload Progress</span>
                    <span className={successCount === totalCount ? "text-green-600" : "text-brand-primary"}>
                      {successCount}/{totalCount} done
                      {errorCount > 0 && ` · ${errorCount} failed`}
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {Array.from(fileStatuses.entries()).map(([key, s]) => (
                      <div key={key} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-50 border border-slate-100">
                        <StatusIcon status={s.status} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-700 truncate">{s.file.name}</p>
                          {s.status === "uploading" && (
                            <div className="mt-1 w-full bg-slate-200 rounded-full h-1">
                              <div
                                className="bg-brand-primary h-1 rounded-full transition-all duration-500"
                                style={{ width: `${s.progress}%` }}
                              />
                            </div>
                          )}
                          {s.error && <p className="text-xs text-red-500 mt-0.5">{s.error}</p>}
                        </div>
                        <span className="text-xs text-slate-400 flex-shrink-0">
                          {(s.file.size / 1024 / 1024).toFixed(1)} MB
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata — only show once files are selected */}
              {totalCount > 0 && !isActive && (
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">File Details (applied to all files)</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Caption"
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder="Describe these files..."
                      fullWidth
                    />
                    <Input
                      label="Client Name"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="e.g., Acme Corp"
                      fullWidth
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Tags"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="machine, demo (comma separated)"
                      fullWidth
                    />
                    {folders.length > 0 && (
                      <FolderSelector
                        folders={folders}
                        selectedFolderId={folderId}
                        onSelectFolder={setFolderId}
                      />
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer actions */}
        {!allSucceeded && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
            <div className="text-sm text-slate-500">
              {totalCount > 0 && !isActive ? (
                <span>
                  <span className="font-semibold text-slate-700">{pendingCount}</span> file{pendingCount !== 1 ? "s" : ""} ready to upload
                  {errorCount > 0 && <span className="text-red-500 ml-2">· {errorCount} invalid</span>}
                </span>
              ) : isActive ? (
                <span className="text-brand-primary font-medium">Uploading {successCount + uploadingCount}/{totalCount}…</span>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={onCancel}
                disabled={isActive}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={pendingCount === 0 || isActive}
              >
                {isActive ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Uploading…
                  </span>
                ) : (
                  `Upload ${pendingCount > 0 ? pendingCount : ""} File${pendingCount !== 1 ? "s" : ""}`
                )}
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
