"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Card } from "@/components/ui/Card";

type Props = {
  onSuccess: () => void;
  onCancel: () => void;
};

export function MediaUploadForm({ onSuccess, onCancel }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [clientName, setClientName] = useState("");
  const [tags, setTags] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setError("");
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Step 1: Upload file to Blob
      const formData = new FormData();
      formData.append("file", file);

      setUploadProgress(25);
      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const data = await uploadResponse.json();
        throw new Error(data.error || "Upload failed");
      }

      const uploadData = await uploadResponse.json();
      setUploadProgress(50);

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
          caption: caption || undefined,
          client_name: clientName || undefined,
          mime_type: uploadData.mime_type,
          file_size: uploadData.file_size,
          tags: tagArray.length > 0 ? tagArray : undefined,
        }),
      });

      if (!mediaResponse.ok) {
        const data = await mediaResponse.json();
        throw new Error(data.error || "Failed to save media");
      }

      setUploadProgress(100);
      onSuccess();
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Upload failed");
      setIsUploading(false);
      setUploadProgress(0);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = ["image/", "video/"];
      if (!validTypes.some((type) => selectedFile.type.startsWith(type))) {
        setError("Only images and videos are allowed");
        return;
      }

      // Validate file size (100MB max)
      const maxSize = 100 * 1024 * 1024;
      if (selectedFile.size > maxSize) {
        setError("File size must be less than 100MB");
        return;
      }

      setFile(selectedFile);
      setError("");
    }
  }

  return (
    <Card className="p-6" variant="elevated">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Upload Media</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Select File
          </label>
          <input
            type="file"
            accept="image/*,video/*"
            onChange={handleFileChange}
            disabled={isUploading}
            className="block w-full text-sm text-slate-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-semibold
              file:bg-brand-primary-light file:text-white
              hover:file:bg-brand-primary
              file:cursor-pointer cursor-pointer
              disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {file && (
            <p className="mt-2 text-sm text-slate-600">
              Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        <Textarea
          label="Caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Describe this photo or video..."
          rows={3}
          fullWidth
          disabled={isUploading}
        />

        <Input
          label="Client Name"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder="e.g., Acme Corp"
          fullWidth
          disabled={isUploading}
        />

        <Input
          label="Tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="machine, installation, demo (comma separated)"
          fullWidth
          disabled={isUploading}
        />

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {isUploading && (
          <div className="space-y-2">
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-brand-primary-light h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-slate-600 text-center">
              Uploading... {uploadProgress}%
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            variant="primary"
            disabled={!file || isUploading}
            fullWidth
          >
            {isUploading ? "Uploading..." : "Upload"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isUploading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
