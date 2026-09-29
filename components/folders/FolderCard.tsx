"use client";

import { FolderWithCount } from "@/types/folder";
import { clsx } from "clsx";
import { CardMenu } from "@/components/ui/CardMenu";

type MenuItem = {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  divider?: boolean;
};

type Props = {
  folder: FolderWithCount;
  onClick: () => void;
  isSelectable?: boolean;
  isSelected?: boolean;
  onSelect?: (folderId: string, isSelected: boolean) => void;
  onContextMenu?: (e: React.MouseEvent, folder: FolderWithCount) => void;
  menuItems?: MenuItem[];
};

export function FolderCard({
  folder,
  onClick,
  isSelectable = false,
  isSelected = false,
  onSelect,
  onContextMenu,
  menuItems = [],
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
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCardClick();
        }
      }}
      onContextMenu={handleContextMenu}
      className={clsx(
        "group relative flex items-center gap-3 rounded-lg bg-white dark:bg-slate-900 border px-3 py-2.5 text-left w-full cursor-pointer transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-light",
        isSelected
          ? "border-brand-primary ring-2 ring-brand-primary/40"
          : "border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600"
      )}
    >
      {isSelectable ? (
        <div onClick={handleCheckboxClick} className="flex-shrink-0">
          <div
            className={clsx(
              "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
              isSelected ? "bg-brand-primary border-brand-primary" : "bg-white border-slate-300"
            )}
          >
            {isSelected && (
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </div>
      ) : (
        <svg
          className="w-6 h-6 text-brand-primary dark:text-blue-300 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M3 6a2 2 0 012-2h4.586a1 1 0 01.707.293L12 6h7a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V6z" />
        </svg>
      )}

      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-slate-900 dark:text-white truncate flex items-center gap-1.5">
          <span className="truncate">{folder.name}</span>
          {folder.is_starred && (
            <svg className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-label="Pinned">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          )}
        </p>
        <p className="font-mono text-[10px] text-slate-500 dark:text-slate-400 truncate">
          {folder.media_count} {folder.media_count === 1 ? "item" : "items"}
          {folder.description && <> · {folder.description}</>}
        </p>
      </div>

      {menuItems.length > 0 && !isSelectable && (
        <div className="flex-shrink-0 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
          <CardMenu items={menuItems} />
        </div>
      )}
    </div>
  );
}
