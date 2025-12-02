"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FolderWithCount } from "@/types/folder";

type Props = {
  selectedCount: number;
  onClearSelection: () => void;
  onMoveToFolder: (folderId: string | null) => Promise<void>;
  folders?: FolderWithCount[];
  isAdmin?: boolean;
};

export function BulkActionToolbar({
  selectedCount,
  onClearSelection,
  onMoveToFolder,
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
    } catch (error) {
      console.error("Failed to move media:", error);
      alert("Failed to move media. Please try again.");
    } finally {
      setIsMoving(false);
    }
  }

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 animate-slide-up">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 flex items-center gap-4 min-w-[400px]">
        {/* Selection Count */}
        <div className="flex items-center gap-2">
          <div className="bg-brand-primary rounded-full w-8 h-8 flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {selectedCount}
            </span>
          </div>
          <span className="text-sm font-medium text-slate-900">
            {selectedCount} selected
          </span>
        </div>

        <div className="h-6 w-px bg-slate-200"></div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-1">
          {isAdmin && (
            <div className="relative">
              <Button
                variant="secondary"
                onClick={() => setShowFolderMenu(!showFolderMenu)}
                disabled={isMoving}
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
                {isMoving ? "Moving..." : "Move to Folder"}
              </Button>

              {/* Folder Dropdown */}
              {showFolderMenu && (
                <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-xl border border-slate-200 py-2 min-w-[200px] max-h-[300px] overflow-y-auto">
                  <button
                    onClick={() => handleMoveToFolder(null)}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                        />
                      </svg>
                      <span className="text-slate-600 font-medium">
                        All Media (No Folder)
                      </span>
                    </div>
                  </button>

                  {folders.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => handleMoveToFolder(folder.id)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4 text-brand-primary"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                          />
                        </svg>
                        <span className="text-slate-900">{folder.name}</span>
                        <span className="text-xs text-slate-400 ml-auto">
                          ({folder.media_count})
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <Button variant="secondary" onClick={onClearSelection}>
            Clear Selection
          </Button>
        </div>
      </div>
    </div>
  );
}
