"use client";

import { MediaAssetFull } from "@/types/media";
import { MediaCard } from "./MediaCard";

type Props = {
  starredMedia: MediaAssetFull[];
  onMediaClick: (media: MediaAssetFull) => void;
};

export function StarredMediaSection({ starredMedia, onMediaClick }: Props) {
  if (starredMedia.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-yellow-400 rounded-full p-2">
          <svg
            className="w-5 h-5 text-white fill-current"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-900">Pinned Assets</h2>
        <span className="text-sm text-slate-500">
          ({starredMedia.length})
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {starredMedia.map((media) => (
          <MediaCard
            key={media.id}
            media={media}
            onClick={() => onMediaClick(media)}
          />
        ))}
      </div>

      <div className="mt-6 border-t border-slate-200"></div>
    </div>
  );
}
