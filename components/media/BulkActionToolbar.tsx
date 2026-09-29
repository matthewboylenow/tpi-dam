"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FolderWithCount } from "@/types/folder";

type Props = {
  selectedCount: number;
  onClearSelection: () => void;
  onMoveToFolder: (folderId: string | null) => Promise<void>;
  onDelete?: () => void;
  /** Marketing: mark every selected item as looked at. */
  onMarkReviewed?: () => void;
  folders?: FolderWithCount[];
  isAdmin?: boolean;
};

export function BulkActionToolbar({
  selectedCount,
  onClearSelection,
  onMoveToFolder,
  onDelete,
  onMarkReviewed,
  folders = [],
  isAdmin = false,
}: Props) {
  const [showFolderMenu, setShowFolderMenu] = useState(false);
  const [isMoving, setIsMoving] = useState(false);

  async function handleMoveToFolder(folderId: string | null) {
    setIsMoving(true);
    try {
      await onMoveToFolder(folderId);
      setShowFolderMenu(false);
    } catch {
      // Error handling delegated to parent via toast
    } finally {
      setIsMoving(false);
    }
  }

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-4 sm:bottom-6 left-3 right-3 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-40 animate-slide-up">
      <div className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg shadow-2xl px-3 py-2.5 flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
        <span className="font-mono text-xs px-2 whitespace-nowrap">
          <span className="font-semibold">{selectedCount}</span> selected
        </span>

        <div className="hidden sm:block h-5 w-px bg-white/20 dark:bg-slate-900/20" />

        <div className="flex items-center gap-1.5 flex-1 flex-wrap">
          {isAdmin && onMarkReviewed && (
            <Button size="sm" variant="ghost" onClick={onMarkReviewed} className="text-white hover:bg-white/10 dark:text-slate-900 dark:hover:bg-slate-900/10">
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Mark reviewed
            </Button>
          )}

          {isAdmin && (
            <div className="relative">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowFolderMenu(!showFolderMenu)}
                disabled={isMoving}
                className="text-white hover:bg-white/10 dark:text-slate-900 dark:hover:bg-slate-900/10"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                {isMoving ? "Moving…" : "Move to folder"}
              </Button>

              {showFolderMenu && (
                <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-1 min-w-[220px] max-h-[300px] overflow-y-auto">
                  <button
                    onClick={() => handleMoveToFolder(null)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300"
                  >
                    No folder
                  </button>
                  {folders.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => handleMoveToFolder(folder.id)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
                    >
                      <span className="truncate">{folder.name}</span>
                      <span className="font-mono text-[10px] text-slate-400 ml-auto">{folder.media_count}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {onDelete && (
            <Button size="sm" variant="ghost" onClick={onDelete} className="text-red-300 hover:bg-red-500/20 dark:text-red-700 dark:hover:bg-red-500/10">
              Delete
            </Button>
          )}
        </div>

        <button
          onClick={onClearSelection}
          className="ml-auto p-1.5 rounded-md hover:bg-white/10 dark:hover:bg-slate-900/10 transition-colors"
          aria-label="Clear selection"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
