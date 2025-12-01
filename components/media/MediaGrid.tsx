"use client";

import { MediaAssetFull } from "@/types/media";
import { MediaCard } from "./MediaCard";

type Props = {
  media: MediaAssetFull[];
  onMediaClick: (media: MediaAssetFull) => void;
};

export function MediaGrid({ media, onMediaClick }: Props) {
  if (media.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <svg
          className="w-16 h-16 text-slate-300 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <h3 className="text-lg font-semibold text-slate-700 mb-2">
          No media assets yet
        </h3>
        <p className="text-sm text-slate-500">
          Upload your first photo or video to get started
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {media.map((item) => (
        <MediaCard
          key={item.id}
          media={item}
          onClick={() => onMediaClick(item)}
        />
      ))}
    </div>
  );
}
