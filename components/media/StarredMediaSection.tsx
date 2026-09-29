"use client";

import { MediaAssetFull } from "@/types/media";
import { MediaCard } from "./MediaCard";
import { SectionRule } from "@/components/ui/SectionRule";

type MenuItem = {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  divider?: boolean;
};

type Props = {
  starredMedia: MediaAssetFull[];
  onMediaClick: (media: MediaAssetFull) => void;
  isSelectable?: boolean;
  selectedIds?: Set<string>;
  onSelect?: (mediaId: string, isSelected: boolean) => void;
  getMenuItems?: (media: MediaAssetFull) => MenuItem[];
  currentUserId?: string;
  showReviewState?: boolean;
};

export function StarredMediaSection({
  starredMedia,
  onMediaClick,
  isSelectable = false,
  selectedIds = new Set(),
  onSelect,
  getMenuItems,
  currentUserId,
  showReviewState = false,
}: Props) {
  if (starredMedia.length === 0) return null;

  return (
    <div className="mb-8">
      <SectionRule label="Pinned" count={starredMedia.length} />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {starredMedia.map((media) => (
          <MediaCard
            key={media.id}
            media={media}
            onClick={() => onMediaClick(media)}
            isSelectable={isSelectable}
            isSelected={selectedIds.has(media.id)}
            onSelect={onSelect}
            menuItems={getMenuItems ? getMenuItems(media) : []}
            currentUserId={currentUserId}
            showReviewState={showReviewState}
          />
        ))}
      </div>
    </div>
  );
}
