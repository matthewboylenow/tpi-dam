"use client";

import { useState } from "react";
import { upload } from "@vercel/blob/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Card } from "@/components/ui/Card";
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

const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB
const LARGE_FILE_WARNING = 150 * 1024 * 1024; // 150MB - show warning
const VALID_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "image/heif", // iPhone formats
];
const VALID_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime", // MOV - iPhone default
  "video/x-m4v",
  "video/mpeg",
  "video/x-quicktime",
];

function getErrorMessage(error: string): string {
  const errorMap: Record<string, string> = {
    "FILE_TOO_LARGE": "File size exceeds 200MB limit",
    "INVALID_TYPE": "Invalid file format. Supported: Images (JPEG, PNG, GIF, WebP, HEIC) and Videos (MP4, MOV, M4V)",
    "UPLOAD_FAILED": "Upload failed. Please try again",
    "NETWORK_ERROR": "Network error. Please check your connection and try again",
    "SERVER_ERROR": "Server error. Please try again later",
  };

  return errorMap[error] || error;
}

export function BulkMediaUploadForm({ onSuccess, onCancel, folders = [] }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [fileStatuses, setFileStatuses] = useState<Map<string, FileUploadStatus>>(new Map());
  const [caption, setCaption] = useState("");
  const [clientName, setClientName] = useState("");
  const [tags, setTags] = useState("");
  const [folderId, setFolderId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  function handleFilesSelect(selectedFiles: File[]) {
    // Validate files
    const validFiles: File[] = [];
    const newStatuses = new Map<string, FileUploadStatus>();

    for (const file of selectedFiles) {
      const fileKey = `${file.name}-${file.size}`;

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        newStatuses.set(fileKey, {
          file,
          status: "error",
          progress: 0,
          error: getErrorMessage("FILE_TOO_LARGE"),
        });
        continue;
      }

      // Check file type
      const isValidImage = VALID_IMAGE_TYPES.includes(file.type);
      const isValidVideo = VALID_VIDEO_TYPES.includes(file.type);

      if (!isValidImage && !isValidVideo) {
        newStatuses.set(fileKey, {
          file,
          status: "error",
          progress: 0,
          error: getErrorMessage("INVALID_TYPE"),
        });
        continue;
      }

      validFiles.push(file);
      newStatuses.set(fileKey, {
        file,
        status: "pending",
        progress: 0,
      });
    }

    setFiles(selectedFiles);
    setFileStatuses(newStatuses);
  }

  async function uploadFile(file: File): Promise<void> {
    const fileKey = `${file.name}-${file.size}`;

    try {
      // Update status to uploading
      setFileStatuses(prev => {
        const updated = new Map(prev);
        const status = updated.get(fileKey);
        if (status) {
          updated.set(fileKey, { ...status, status: "uploading", progress: 10 });
        }
        return updated;
      });

      // Step 1: Upload file directly to Blob (bypasses serverless function payload limit)
      const filename = generateUniqueFilename(file.name);
      const pathname = `media/${filename}`;

      const blob = await upload(pathname, file, {
        access: "public",
        handleUploadUrl: "/api/upload/client",
      });

      setFileStatuses(prev => {
        const updated = new Map(prev);
        const status = updated.get(fileKey);
        if (status) {
          updated.set(fileKey, { ...status, progress: 50 });
        }
        return updated;
      });

      const uploadData = {
        blob_url: blob.url,
        mime_type: file.type,
        file_size: file.size,
      };

      // Step 2: Create media asset record
      const tagArray = tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const mediaResponse = await fetch("/api/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blob_url: uploadData.blob_url,
          caption: caption || file.name,
          client_name: clientName || undefined,
          mime_type: uploadData.mime_type,
          file_size: uploadData.file_size,
          tags: tagArray.length > 0 ? tagArray : undefined,
          folder_id: folderId || undefined,
        }),
      });

      if (!mediaResponse.ok) {
        const data = await mediaResponse.json();
        throw new Error(data.error || "SERVER_ERROR");
      }

      // Success!
      setFileStatuses(prev => {
        const updated = new Map(prev);
        const status = updated.get(fileKey);
        if (status) {
          updated.set(fileKey, { ...status, status: "success", progress: 100 });
        }
        return updated;
      });
    } catch (err: any) {
      console.error("Upload error for", file.name, ":", err);
      setFileStatuses(prev => {
        const updated = new Map(prev);
        const status = updated.get(fileKey);
        if (status) {
          updated.set(fileKey, {
            ...status,
            status: "error",
            progress: 0,
            error: getErrorMessage(err.message),
          });
        }
        return updated;
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validFiles = Array.from(fileStatuses.values())
      .filter(s => s.status === "pending")
      .map(s => s.file);

    if (validFiles.length === 0) return;

    setIsUploading(true);

    // Upload files sequentially to avoid overwhelming the server
    for (const file of validFiles) {
      await uploadFile(file);
    }

    setIsUploading(false);

    // Check if all uploads succeeded
    const allSucceeded = Array.from(fileStatuses.values()).every(
      s => s.status === "success"
    );

    if (allSucceeded) {
      onSuccess();
    }
  }

  const totalFiles = fileStatuses.size;
  const successCount = Array.from(fileStatuses.values()).filter(s => s.status === "success").length;
  const errorCount = Array.from(fileStatuses.values()).filter(s => s.status === "error").length;
  const pendingCount = Array.from(fileStatuses.values()).filter(s => s.status === "pending").length;
  const uploadingCount = Array.from(fileStatuses.values()).filter(s => s.status === "uploading").length;

  return (
    <Card className="p-6" variant="elevated">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Upload Media</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <DropzoneUpload
          onFilesSelect={handleFilesSelect}
          disabled={isUploading}
          selectedFiles={files}
        />

        {/* iPhone Recording Help */}
        <IPhoneRecordingHelp />

        {/* File Upload Statuses */}
        {totalFiles > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">Upload Status</span>
              <span className="text-slate-600">
                {successCount}/{totalFiles} completed
                {errorCount > 0 && ` (${errorCount} failed)`}
              </span>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {Array.from(fileStatuses.entries()).map(([key, status]) => (
                <div
                  key={key}
                  className="p-3 rounded-lg border bg-white"
                  style={{
                    borderColor:
                      status.status === "success"
                        ? "#10b981"
                        : status.status === "error"
                        ? "#ef4444"
                        : status.status === "uploading"
                        ? "#3b82f6"
                        : "#e2e8f0",
                  }}
                >
                  <div className="flex items-start gap-3">
                    {/* Status Icon */}
                    {status.status === "success" && (
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {status.status === "error" && (
                      <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {status.status === "uploading" && (
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0 mt-0.5"></div>
                    )}
                    {status.status === "pending" && (
                      <svg className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {status.file.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {(status.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>

                      {status.error && (
                        <p className="text-xs text-red-600 mt-1">{status.error}</p>
                      )}

                      {status.status === "uploading" && (
                        <div className="mt-2">
                          <div className="w-full bg-slate-200 rounded-full h-1.5">
                            <div
                              className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${status.progress}%` }}
                            />
                          </div>
                          <p className="text-xs text-slate-600 mt-1">{status.progress}%</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Textarea
          label="Caption (Optional)"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Describe these media files..."
          rows={3}
          fullWidth
          disabled={isUploading}
        />

        <Input
          label="Client Name (Optional)"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder="e.g., Acme Corp"
          fullWidth
          disabled={isUploading}
        />

        <Input
          label="Tags (Optional)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="machine, installation, demo (comma separated)"
          fullWidth
          disabled={isUploading}
        />

        {folders.length > 0 && (
          <FolderSelector
            folders={folders}
            selectedFolderId={folderId}
            onSelectFolder={setFolderId}
          />
        )}

        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            variant="primary"
            disabled={pendingCount === 0 || isUploading}
            fullWidth
          >
            {isUploading
              ? `Uploading... (${successCount}/${totalFiles})`
              : `Upload ${pendingCount} File${pendingCount !== 1 ? "s" : ""}`}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isUploading}
          >
            {successCount > 0 && !isUploading ? "Done" : "Cancel"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
