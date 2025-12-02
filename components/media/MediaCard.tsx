"use client";

import Image from "next/image";
import { MediaAssetFull } from "@/types/media";
import { clsx } from "clsx";
import { Badge } from "@/components/ui/Badge";
import { CardMenu } from "@/components/ui/CardMenu";

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
};

export function MediaCard({ media, onClick, isSelectable = false, isSelected = false, onSelect, onContextMenu, menuItems = [] }: Props) {
  const isVideo = media.mime_type?.startsWith("video/");

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
        "group relative flex flex-col rounded-2xl bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all",
        "border text-left w-full",
        isSelected ? "border-brand-primary ring-2 ring-brand-primary/50" : "border-slate-200 dark:border-slate-700"
      )}
    >
      <div className="relative aspect-video w-full bg-slate-100 dark:bg-slate-700 overflow-hidden rounded-t-2xl">
        {/* Three-dot Menu - Always visible on mobile, hover on desktop */}
        {menuItems.length > 0 && (
          <div className="absolute top-2 left-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
            <CardMenu items={menuItems} />
          </div>
        )}

        {/* Selection Checkbox */}
        {isSelectable && (
          <div
            className="absolute top-2 left-2 z-20"
            onClick={handleCheckboxClick}
          >
            <div
              className={clsx(
                "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer",
                isSelected
                  ? "bg-brand-primary border-brand-primary"
                  : "bg-white/90 border-slate-300 hover:border-brand-primary"
              )}
            >
              {isSelected && (
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
          </div>
        )}

        {/* Star Icon */}
        {media.is_starred && (
          <div className="absolute top-2 right-2 bg-yellow-400 rounded-full p-1.5 shadow-lg z-10">
            <svg
              className="w-4 h-4 text-white fill-current"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        )}

        {isVideo ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-slate-500 dark:text-slate-400">
              <svg
                className="w-12 h-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-xs">Video</span>
            </div>
          </div>
        ) : (
          media.blob_url && (
            <Image
              src={media.blob_url}
              alt={media.caption || "Media asset"}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-200"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          )
        )}
      </div>
      <div className="flex flex-col gap-2 p-3">
        {media.client_name && (
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-accent">
            {media.client_name}
          </p>
        )}
        <p className="line-clamp-2 text-sm text-slate-800 dark:text-slate-200">
          {media.caption || "No caption"}
        </p>
        {media.tags && media.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {media.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="default">
                {tag}
              </Badge>
            ))}
            {media.tags.length > 3 && (
              <Badge variant="default">+{media.tags.length - 3}</Badge>
            )}
          </div>
        )}
        <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
          {new Date(media.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>
    </button>
  );
}
