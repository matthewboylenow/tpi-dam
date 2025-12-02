"use client";

import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useSensor,
  useSensors,
  PointerSensor,
} from "@dnd-kit/core";
import { MediaAssetFull } from "@/types/media";
import { MediaCard } from "./MediaCard";

type Props = {
  media: MediaAssetFull[];
  onMediaClick: (media: MediaAssetFull) => void;
  onMediaMove?: (mediaId: string, folderId: string | null) => Promise<void>;
  isAdmin?: boolean;
  isSelectable?: boolean;
  selectedIds?: Set<string>;
  onSelect?: (mediaId: string, isSelected: boolean) => void;
  onContextMenu?: (e: React.MouseEvent, media: MediaAssetFull) => void;
};

export function DraggableMediaGrid({
  media,
  onMediaClick,
  onMediaMove,
  isAdmin = false,
  isSelectable = false,
  selectedIds = new Set(),
  onSelect,
  onContextMenu,
}: Props) {
  const [activeMedia, setActiveMedia] = useState<MediaAssetFull | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px of movement required before drag starts
      },
    })
  );

  function handleDragStart(event: DragStartEvent) {
    const draggedMedia = media.find((m) => m.id === event.active.id);
    if (draggedMedia) {
      setActiveMedia(draggedMedia);
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveMedia(null);

    if (!event.over || !onMediaMove || !isAdmin) {
      return;
    }

    const mediaId = event.active.id as string;
    const folderId = event.over.id === "no-folder" ? null : (event.over.id as string);

    try {
      await onMediaMove(mediaId, folderId);
    } catch (error) {
      console.error("Failed to move media:", error);
    }
  }

  function handleDragCancel() {
    setActiveMedia(null);
  }

  // If not admin or no move handler, or if in selection mode, just show regular grid
  if (!isAdmin || !onMediaMove || isSelectable) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {media.map((item) => (
          <MediaCard
            key={item.id}
            media={item}
            onClick={() => onMediaClick(item)}
            isSelectable={isSelectable}
            isSelected={selectedIds.has(item.id)}
            onSelect={onSelect}
            onContextMenu={onContextMenu}
          />
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {media.map((item) => (
          <DraggableMediaCard
            key={item.id}
            media={item}
            onClick={() => onMediaClick(item)}
            onContextMenu={onContextMenu}
          />
        ))}
      </div>

      <DragOverlay>
        {activeMedia ? (
          <div className="opacity-80 scale-105 rotate-3 shadow-2xl">
            <MediaCard media={activeMedia} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

// Draggable wrapper for MediaCard
import { useDraggable } from "@dnd-kit/core";

function DraggableMediaCard({
  media,
  onClick,
  onContextMenu,
}: {
  media: MediaAssetFull;
  onClick: () => void;
  onContextMenu?: (e: React.MouseEvent, media: MediaAssetFull) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: media.id,
  });

  function handleContextMenu(e: React.MouseEvent) {
    if (onContextMenu) {
      e.preventDefault();
      e.stopPropagation();
      onContextMenu(e, media);
    }
  }

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onContextMenu={handleContextMenu}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: isDragging ? "grabbing" : "grab",
      }}
    >
      <MediaCard media={media} onClick={onClick} />
    </div>
  );
}
