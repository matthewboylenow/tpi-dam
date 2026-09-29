"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { MediaAssetFull } from "@/types/media";
import { clsx } from "clsx";
import { CardMenu } from "@/components/ui/CardMenu";
import { USAGE_LABELS, isUsageChannel } from "@/lib/usage";
import { isHeicUrl } from "@/lib/utils/heic";

/** Photo that shows a labelled placeholder if this browser can't decode it. */
function PhotoThumbnail({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-3 text-center">
        <span className="eyebrow">{isHeicUrl(src) ? "HEIC photo" : "Preview unavailable"}</span>
        <span className="text-[11px] leading-tight">Open to download the original</span>
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover"
      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
      onError={() => setFailed(true)}
    />
  );
}

function VideoThumbnail({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    function capture() {
      if (!video || !canvas) return;
      try {
        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 180;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
        const url = canvas.toDataURL("image/jpeg", 0.7);
        setThumbUrl(url);
      } catch {
        setFailed(true);
      }
    }

    function onLoaded() {
      video!.currentTime = 1;
    }
    function onSeeked() {
      capture();
    }
    function onError() {
      setFailed(true);
    }

    video.addEventListener("loadedmetadata", onLoaded);
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("error", onError);
    video.load();

    return () => {
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
    };
  }, [src]);

  return (
    <div className="relative w-full h-full">
      {/* Hidden video + canvas for thumbnail extraction */}
      <video ref={videoRef} src={src} preload="metadata" muted playsInline crossOrigin="anonymous" className="hidden" />
      <canvas ref={canvasRef} className="hidden" />

      {thumbUrl && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumbUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center bg-slate-800">
          <span className="eyebrow text-slate-400">Video</span>
        </div>
      )}
      {/* Play mark */}
      <div className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center">
        <svg className="w-3.5 h-3.5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    </div>
  );
}

type MenuItem = {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  divider?: boolean;
};

type Props = {
  media: MediaAssetFull;
  onClick?: () => void;
  isSelectable?: boolean;
  isSelected?: boolean;
  onSelect?: (mediaId: string, isSelected: boolean) => void;
  onContextMenu?: (e: React.MouseEvent, media: MediaAssetFull) => void;
  menuItems?: MenuItem[];
  currentUserId?: string;
  /** Marketing view: flag uploads that haven't been looked at yet. */
  showReviewState?: boolean;
};

export function MediaCard({
  media,
  onClick,
  isSelectable = false,
  isSelected = false,
  onSelect,
  onContextMenu,
  menuItems = [],
  currentUserId,
  showReviewState = false,
}: Props) {
  const isVideo = media.mime_type?.startsWith("video/");
  const isOwn = currentUserId && media.owner_user_id === currentUserId;
  const uploaderLabel = isOwn
    ? "You"
    : media.owner_name
      ? media.owner_name.split(" ")[0]
      : media.owner_email?.split("@")[0] ?? null;
  const isNew = showReviewState && !media.reviewed_at;
  const usedOn = (media.used_on ?? []).filter(isUsageChannel);

  function handleCheckboxClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (onSelect) {
      onSelect(media.id, !isSelected);
    }
  }

  function handleCardClick() {
    if (isSelectable && onSelect) {
      onSelect(media.id, !isSelected);
    } else if (onClick) {
      onClick();
    }
  }

  function handleContextMenu(e: React.MouseEvent) {
    if (onContextMenu) {
      e.preventDefault();
      onContextMenu(e, media);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCardClick}
      onContextMenu={handleContextMenu}
      className={clsx(
        "group relative flex flex-col rounded-lg bg-white dark:bg-slate-900 overflow-hidden text-left w-full transition-colors",
        "border",
        isSelected
          ? "border-brand-primary ring-2 ring-brand-primary/40"
          : isNew
            ? "border-signal/50 hover:border-signal"
            : "border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600"
      )}
    >
      <div className="relative aspect-[4/3] w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        {/* Three-dot Menu - Always visible on mobile, hover on desktop */}
        {menuItems.length > 0 && !isSelectable && (
          <div className="absolute top-2 left-2 z-10 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
            <CardMenu items={menuItems} />
          </div>
        )}

        {/* Selection Checkbox */}
        {isSelectable && (
          <div className="absolute top-2 left-2 z-20" onClick={handleCheckboxClick}>
            <div
              className={clsx(
                "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer",
                isSelected
                  ? "bg-brand-primary border-brand-primary"
                  : "bg-white/90 border-slate-300 hover:border-brand-primary"
              )}
            >
              {isSelected && (
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>
        )}

        {/* Pinned */}
        {media.is_starred && (
          <div className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-amber-400 text-white flex items-center justify-center" title="Pinned">
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        )}

        {/* Needs review */}
        {isNew && (
          <span className="absolute bottom-2 left-2 z-10 font-mono text-[10px] font-medium uppercase tracking-[0.14em] bg-signal text-white px-1.5 py-0.5 rounded">
            New
          </span>
        )}

        {isVideo ? (
          <VideoThumbnail src={media.blob_url} />
        ) : (
          media.blob_url && <PhotoThumbnail src={media.blob_url} alt={media.caption || "Media asset"} />
        )}
      </div>

      <div className="flex flex-col gap-1 px-2.5 pt-2 pb-2.5 min-w-0">
        <p className={clsx("eyebrow truncate", !media.client_name && "text-slate-400 dark:text-slate-600 normal-case tracking-normal")}>
          {media.client_name || "No client"}
        </p>
        <p className="text-sm text-slate-800 dark:text-slate-100 truncate leading-snug">
          {media.caption || "Untitled"}
        </p>
        <div className="mt-0.5 flex items-center justify-between gap-2 min-w-0">
          <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
            {new Date(media.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            {uploaderLabel && <> · {uploaderLabel}</>}
          </span>
          {usedOn.length > 0 && (
            <span className="flex items-center gap-1 min-w-0">
              {usedOn.map((channel) => (
                <span
                  key={channel}
                  className="font-mono text-[9px] font-medium uppercase tracking-wider px-1 py-0.5 rounded bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/30 dark:text-blue-200"
                  title={`Used on ${USAGE_LABELS[channel]}`}
                >
                  {USAGE_LABELS[channel]}
                </span>
              ))}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
