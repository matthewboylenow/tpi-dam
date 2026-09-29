"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { clsx } from "clsx";
import { MediaAssetFull } from "@/types/media";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/providers/ToastProvider";
import { starMedia, setMediaMarketing } from "@/lib/api/mutations";
import { USAGE_CHANNELS, USAGE_LABELS, isUsageChannel, type UsageChannel } from "@/lib/usage";
import { ImageEditor } from "./ImageEditor";
import { isHeicUrl } from "@/lib/utils/heic";

type Props = {
  media: MediaAssetFull | null;
  onClose: () => void;
  userRole?: string;
  /** Called with the fields that changed so the list can update without a refetch. */
  onChange?: (patch: Partial<MediaAssetFull>) => void;
  /** Kept for callers that refresh the whole list after an edit. */
  onStarToggle?: () => void;
};

function formatBytes(bytes: number) {
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function MediaDetailModal({ media, onClose, userRole, onChange, onStarToggle }: Props) {
  const toast = useToast();
  const [isStarred, setIsStarred] = useState(media?.is_starred ?? false);
  const [reviewedAt, setReviewedAt] = useState<Date | string | null>(media?.reviewed_at ?? null);
  const [reviewedByName, setReviewedByName] = useState<string | null>(media?.reviewed_by_name ?? null);
  const [usedOn, setUsedOn] = useState<UsageChannel[]>((media?.used_on ?? []).filter(isUsageChannel));
  const [isSaving, setIsSaving] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  // Escape closes
  useEffect(() => {
    if (!media) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !showEditor) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [media, showEditor, onClose]);

  if (!media) return null;

  const isVideo = media.mime_type?.startsWith("video/");
  const isImage = media.mime_type?.startsWith("image/");
  const isAdmin = userRole === "admin";
  const isNew = !reviewedAt;

  function notify(patch: Partial<MediaAssetFull>) {
    onChange?.(patch);
    onStarToggle?.();
  }

  async function handleStarToggle() {
    if (!media || !isAdmin) return;
    const next = !isStarred;
    setIsStarred(next);
    try {
      await starMedia(media.id, next);
      notify({ is_starred: next });
    } catch {
      setIsStarred(!next);
      toast.error("Couldn't update pin");
    }
  }

  async function saveMarketing(patch: { reviewed?: boolean; used_on?: UsageChannel[] }) {
    if (!media) return;
    setIsSaving(true);
    try {
      const { media: updated } = await setMediaMarketing(media.id, patch);
      setReviewedAt(updated.reviewed_at);
      setReviewedByName((updated as MediaAssetFull).reviewed_by_name ?? null);
      setUsedOn((updated.used_on ?? []).filter(isUsageChannel));
      notify({
        reviewed_at: updated.reviewed_at,
        reviewed_by: updated.reviewed_by,
        reviewed_by_name: (updated as MediaAssetFull).reviewed_by_name ?? null,
        used_on: updated.used_on,
      });
    } catch (err) {
      toast.error((err as Error).message || "Couldn't save");
    } finally {
      setIsSaving(false);
    }
  }

  function toggleUsage(channel: UsageChannel) {
    const next = usedOn.includes(channel) ? usedOn.filter((c) => c !== channel) : [...usedOn, channel];
    saveMarketing({ used_on: next });
  }

  async function handleSaveEditedImage(editedBlob: Blob, filename: string) {
    if (!media) return;

    try {
      const formData = new FormData();
      formData.append("file", editedBlob, filename);

      const uploadResponse = await fetch("/api/upload", { method: "POST", body: formData });
      if (!uploadResponse.ok) throw new Error("Failed to upload edited image");
      const uploadData = await uploadResponse.json();

      const updateResponse = await fetch(`/api/media/${media.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blob_url: uploadData.blob_url, file_size: uploadData.file_size }),
      });
      if (!updateResponse.ok) throw new Error("Failed to update media record");

      setShowEditor(false);
      notify({ blob_url: uploadData.blob_url, file_size: uploadData.file_size });
      toast.success("Image updated");
      onClose();
    } catch (error) {
      console.error("Error saving edited image:", error);
      toast.error("Couldn't save the edited image. Please try again.");
    }
  }

  const reviewedLabel = reviewedAt
    ? `Reviewed${reviewedByName ? ` by ${reviewedByName.split(" ")[0]}` : ""} · ${new Date(reviewedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
    : "Not reviewed yet";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-950/80 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white dark:bg-slate-900 sm:rounded-lg w-full sm:max-w-5xl h-[94dvh] sm:h-auto sm:max-h-[90vh] overflow-hidden shadow-2xl flex flex-col lg:flex-row rounded-t-lg animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Media */}
        <div className="relative bg-slate-950 flex items-center justify-center lg:flex-1 min-h-[40vh] lg:min-h-[60vh] flex-shrink-0">
          {isVideo ? (
            <video src={media.blob_url} controls playsInline className="w-full h-full max-h-[50vh] lg:max-h-[90vh] object-contain">
              Your browser does not support the video tag.
            </video>
          ) : imageFailed ? (
            <div className="flex flex-col items-center justify-center gap-2 p-8 text-center text-slate-300">
              <span className="eyebrow text-slate-400">{isHeicUrl(media.blob_url) ? "HEIC photo" : "Preview unavailable"}</span>
              <p className="text-sm max-w-xs">
                This browser can&apos;t display this file. Download the original below, or open it in Safari.
              </p>
            </div>
          ) : (
            <Image
              src={media.blob_url}
              alt={media.caption || "Media asset"}
              width={1600}
              height={1200}
              className="w-full h-auto max-h-[50vh] lg:max-h-[90vh] object-contain"
              unoptimized
              onError={() => setImageFailed(true)}
            />
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 lg:hidden w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Details */}
        <div className="lg:w-[380px] lg:flex-shrink-0 flex flex-col min-h-0 lg:border-l border-slate-200 dark:border-slate-800">
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className={clsx("eyebrow mb-1", !media.client_name && "normal-case tracking-normal text-slate-400")}>
                  {media.client_name || "No client"}
                </p>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight break-words">
                  {media.caption || "Untitled"}
                </h2>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {isAdmin && (
                  <button
                    onClick={handleStarToggle}
                    className={clsx(
                      "p-2 rounded-md transition-colors",
                      isStarred
                        ? "text-amber-500 bg-amber-50 dark:bg-amber-500/10"
                        : "text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                    aria-label={isStarred ? "Unpin" : "Pin"}
                    title={isStarred ? "Unpin" : "Pin to the top"}
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="hidden lg:flex p-2 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Marketing status */}
            <div
              className={clsx(
                "rounded-lg border p-3.5 space-y-3",
                isNew
                  ? "border-signal/40 bg-signal-soft/60 dark:bg-signal/10"
                  : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40"
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="eyebrow">Marketing</p>
                  <p className={clsx("text-sm mt-0.5", isNew ? "text-signal-ink dark:text-orange-300 font-medium" : "text-slate-700 dark:text-slate-300")}>
                    {reviewedLabel}
                  </p>
                </div>
                {isAdmin && (
                  <Button
                    size="sm"
                    variant={isNew ? "primary" : "secondary"}
                    disabled={isSaving}
                    onClick={() => saveMarketing({ reviewed: isNew })}
                  >
                    {isNew ? "Mark reviewed" : "Mark as new"}
                  </Button>
                )}
              </div>

              <div>
                <p className="eyebrow mb-1.5">Used on</p>
                {isAdmin ? (
                  <div className="flex flex-wrap gap-1.5">
                    {USAGE_CHANNELS.map((channel) => {
                      const on = usedOn.includes(channel);
                      return (
                        <button
                          key={channel}
                          type="button"
                          disabled={isSaving}
                          onClick={() => toggleUsage(channel)}
                          aria-pressed={on}
                          className={clsx(
                            "px-2.5 py-1 rounded-md text-xs font-medium border transition-colors",
                            on
                              ? "bg-brand-primary border-brand-primary text-white"
                              : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-brand-primary"
                          )}
                        >
                          {on && <span className="mr-1">✓</span>}
                          {USAGE_LABELS[channel]}
                        </button>
                      );
                    })}
                  </div>
                ) : usedOn.length > 0 ? (
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {usedOn.map((c) => USAGE_LABELS[c]).join(", ")}
                  </p>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">Not used yet</p>
                )}
              </div>
            </div>

            {/* Tags */}
            {media.tags && media.tags.length > 0 && (
              <div>
                <p className="eyebrow mb-1.5">Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {media.tags.map((tag) => (
                    <Badge key={tag} variant="default">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div>
                <dt className="eyebrow mb-0.5">Uploaded by</dt>
                <dd className="text-sm text-slate-900 dark:text-white">{media.owner_name || media.owner_email}</dd>
              </div>
              <div>
                <dt className="eyebrow mb-0.5">Date</dt>
                <dd className="text-sm text-slate-900 dark:text-white">
                  {new Date(media.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  <span className="block font-mono text-[11px] text-slate-500 dark:text-slate-400">
                    {new Date(media.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  </span>
                </dd>
              </div>
              {media.file_size && (
                <div>
                  <dt className="eyebrow mb-0.5">Size</dt>
                  <dd className="text-sm font-mono text-slate-900 dark:text-white">{formatBytes(media.file_size)}</dd>
                </div>
              )}
              {media.mime_type && (
                <div>
                  <dt className="eyebrow mb-0.5">Type</dt>
                  <dd className="text-sm font-mono text-slate-900 dark:text-white">{media.mime_type.split("/")[1]?.toUpperCase() ?? media.mime_type}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex gap-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <a
              href={media.blob_url}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-4 py-2 bg-brand-primary hover:bg-brand-secondary text-white rounded-md text-sm font-medium transition-colors inline-flex items-center justify-center"
            >
              Download original
            </a>
            {isAdmin && isImage && (
              <Button variant="secondary" onClick={() => setShowEditor(true)}>
                Crop / edit
              </Button>
            )}
          </div>
        </div>
      </div>

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
