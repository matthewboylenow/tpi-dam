"use client";

import { MediaAssetFull } from "@/types/media";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

type Props = {
  media: MediaAssetFull | null;
  onClose: () => void;
};

export function MediaDetailModal({ media, onClose }: Props) {
  if (!media) return null;

  const isVideo = media.mime_type?.startsWith("video/");

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
            <img
              src={media.blob_url}
              alt={media.caption || "Media asset"}
              className="w-full max-h-[60vh] object-contain"
            />
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
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <p className="text-xs text-slate-500">
                {new Date(media.created_at).toLocaleTimeString()}
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
    </div>
  );
}
