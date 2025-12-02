"use client";

import { useState } from "react";
import Image from "next/image";
import { MediaAssetFull } from "@/types/media";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ImageEditor } from "./ImageEditor";

type Props = {
  media: MediaAssetFull | null;
  onClose: () => void;
  userRole?: string;
  onStarToggle?: () => void;
};

export function MediaDetailModal({ media, onClose, userRole, onStarToggle }: Props) {
  const [isStarred, setIsStarred] = useState(media?.is_starred || false);
  const [isStarring, setIsStarring] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

  if (!media) return null;

  const isVideo = media.mime_type?.startsWith("video/");
  const isImage = media.mime_type?.startsWith("image/");
  const isAdmin = userRole === "admin";

  async function handleStarToggle() {
    if (!media || !isAdmin) return;

    setIsStarring(true);
    try {
      const response = await fetch(`/api/media/${media.id}/star`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_starred: !isStarred }),
      });

      if (response.ok) {
        setIsStarred(!isStarred);
        if (onStarToggle) onStarToggle();
      }
    } catch (error) {
      console.error("Failed to toggle star:", error);
    } finally {
      setIsStarring(false);
    }
  }

  async function handleSaveEditedImage(editedBlob: Blob, filename: string) {
    if (!media) return;

    try {
      // Upload edited image to blob storage
      const formData = new FormData();
      formData.append("file", editedBlob, filename);

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload edited image");
      }

      const uploadData = await uploadResponse.json();

      // Update media record with new blob URL
      const updateResponse = await fetch(`/api/media/${media.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blob_url: uploadData.blob_url,
          file_size: uploadData.file_size,
        }),
      });

      if (!updateResponse.ok) {
        throw new Error("Failed to update media record");
      }

      // Close editor and refresh
      setShowEditor(false);
      if (onStarToggle) onStarToggle(); // Reuse this callback to refresh the page
      onClose();
    } catch (error) {
      console.error("Error saving edited image:", error);
      alert("Failed to save edited image. Please try again.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Media Preview */}
        <div className="relative w-full bg-slate-900">
          {isVideo ? (
            <video
              src={media.blob_url}
              controls
              className="w-full max-h-[60vh] object-contain"
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="relative w-full" style={{ maxHeight: "60vh" }}>
              <Image
                src={media.blob_url}
                alt={media.caption || "Media asset"}
                width={1200}
                height={800}
                className="w-full h-auto max-h-[60vh] object-contain"
                unoptimized
              />
            </div>
          )}
        </div>

        {/* Media Info */}
        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {media.client_name && (
                <p className="text-sm font-semibold uppercase tracking-wide text-brand-accent mb-2">
                  {media.client_name}
                </p>
              )}
              <h2 className="text-2xl font-bold text-slate-900">
                {media.caption || "Untitled"}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <button
                  onClick={handleStarToggle}
                  disabled={isStarring}
                  className={`p-2 rounded-full transition-all ${
                    isStarred
                      ? "bg-yellow-400 hover:bg-yellow-500 text-white"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-400"
                  } ${isStarring ? "opacity-50 cursor-not-allowed" : ""}`}
                  aria-label={isStarred ? "Unstar" : "Star"}
                  title={isStarred ? "Unstar this media" : "Star this media"}
                >
                  <svg
                    className="w-5 h-5 fill-current"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              )}
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Close"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Tags */}
          {media.tags && media.tags.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-2">TAGS</p>
              <div className="flex flex-wrap gap-2">
                {media.tags.map((tag) => (
                  <Badge key={tag} variant="default">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">
                UPLOADED BY
              </p>
              <p className="text-sm text-slate-900">{media.owner_name}</p>
              <p className="text-xs text-slate-500">{media.owner_email}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">DATE</p>
              <p className="text-sm text-slate-900">
                {new Date(media.created_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
              <p className="text-xs text-slate-500">
                {new Date(media.created_at).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}
              </p>
            </div>
            {media.file_size && (
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">SIZE</p>
                <p className="text-sm text-slate-900">
                  {(media.file_size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            )}
            {media.mime_type && (
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">TYPE</p>
                <p className="text-sm text-slate-900">{media.mime_type}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {isAdmin && isImage && (
              <Button
                variant="primary"
                onClick={() => setShowEditor(true)}
                fullWidth
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Image
              </Button>
            )}
            <a
              href={media.blob_url}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-4 py-2 bg-brand-primary-light hover:bg-brand-primary text-white rounded-lg font-semibold transition-colors inline-flex items-center justify-center"
            >
              Download
            </a>
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>

      {/* Image Editor */}
      {showEditor && isImage && (
        <ImageEditor
          imageUrl={media.blob_url}
          imageName={media.caption || "image"}
          onSave={handleSaveEditedImage}
          onClose={() => setShowEditor(false)}
        />
      )}
    </div>
  );
}
