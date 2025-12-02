"use client";

import { FolderWithCount } from "@/types/folder";
import { clsx } from "clsx";

type Props = {
  folder: FolderWithCount;
  onClick: () => void;
  isSelectable?: boolean;
  isSelected?: boolean;
  onSelect?: (folderId: string, isSelected: boolean) => void;
  onContextMenu?: (e: React.MouseEvent, folder: FolderWithCount) => void;
};

export function FolderCard({
  folder,
  onClick,
  isSelectable = false,
  isSelected = false,
  onSelect,
  onContextMenu,
}: Props) {
  function handleCheckboxClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (onSelect) {
      onSelect(folder.id, !isSelected);
    }
  }

  function handleCardClick() {
    if (isSelectable && onSelect) {
      onSelect(folder.id, !isSelected);
    } else {
      onClick();
    }
  }

  function handleContextMenu(e: React.MouseEvent) {
    if (onContextMenu) {
      e.preventDefault();
      onContextMenu(e, folder);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCardClick}
      onContextMenu={handleContextMenu}
      className={clsx(
        "group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm hover:shadow-md transition-all",
        "border text-left w-full",
        isSelected
          ? "border-brand-primary ring-2 ring-brand-primary/50"
          : "border-slate-200"
      )}
    >
      <div className="relative aspect-video w-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
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

        {/* Folder Icon */}
        <svg
          className="w-20 h-20 text-brand-primary group-hover:scale-110 transition-transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
          />
        </svg>

        {/* Media Count Badge */}
        <div className="absolute bottom-2 right-2 bg-white/90 rounded-full px-2 py-1 text-xs font-semibold text-slate-700">
          {folder.media_count} {folder.media_count === 1 ? "item" : "items"}
        </div>
      </div>

      <div className="flex flex-col gap-2 p-3">
        <p className="font-semibold text-sm text-slate-900 truncate">
          {folder.name}
        </p>
        {folder.description && (
          <p className="text-xs text-slate-500 line-clamp-2">
            {folder.description}
          </p>
        )}
      </div>
    </button>
  );
}
