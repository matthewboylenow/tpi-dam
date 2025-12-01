"use client";

import Image from "next/image";
import { MediaAssetFull } from "@/types/media";
import { clsx } from "clsx";
import { Badge } from "@/components/ui/Badge";

type Props = {
  media: MediaAssetFull;
  onClick?: () => void;
};

export function MediaCard({ media, onClick }: Props) {
  const isVideo = media.mime_type?.startsWith("video/");

  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow",
        "border border-slate-200 text-left w-full"
      )}
    >
      <div className="relative aspect-video w-full bg-slate-100">
        {isVideo ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-slate-500">
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
        <p className="line-clamp-2 text-sm text-slate-800">
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
        <p className="mt-1 text-[11px] text-slate-400">
          {new Date(media.created_at).toLocaleDateString()}
        </p>
      </div>
    </button>
  );
}
