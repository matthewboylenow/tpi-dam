"use client";

import { MediaAssetFull } from "@/types/media";
import { MediaCard } from "./MediaCard";
export { MediaGridSkeleton } from "./MediaCardSkeleton";

type MenuItem = {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  divider?: boolean;
};

type Props = {
  media: MediaAssetFull[];
  onMediaClick: (media: MediaAssetFull) => void;
  isSelectable?: boolean;
  selectedIds?: Set<string>;
  onSelect?: (mediaId: string, isSelected: boolean) => void;
  getMenuItems?: (media: MediaAssetFull) => MenuItem[];
  currentUserId?: string;
  showReviewState?: boolean;
};

export function MediaGrid({
  media,
  onMediaClick,
  isSelectable = false,
  selectedIds = new Set(),
  onSelect,
  getMenuItems,
  currentUserId,
  showReviewState = false,
}: Props) {
  if (media.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
        <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">Nothing here yet</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Upload a photo or video to get started</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {media.map((item) => (
        <MediaCard
          key={item.id}
          media={item}
          onClick={() => onMediaClick(item)}
          isSelectable={isSelectable}
          isSelected={selectedIds.has(item.id)}
          onSelect={onSelect}
          menuItems={getMenuItems ? getMenuItems(item) : []}
          currentUserId={currentUserId}
          showReviewState={showReviewState}
        />
      ))}
    </div>
  );
}
