"use client";

import type { FolderWithCount } from "@/types/folder";

type Props = {
  folders: FolderWithCount[];
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
};

export function FolderList({ folders, selectedFolderId, onSelectFolder }: Props) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Folders</h2>

      <div className="space-y-1">
        {/* All Media Option */}
        <button
          onClick={() => onSelectFolder(null)}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
            selectedFolderId === null
              ? "bg-brand-primary text-white"
              : "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
          }`}
        >
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="font-medium">All Media</span>
          </div>
        </button>

        {/* Folders */}
        {folders.map((folder) => (
          <button
            key={folder.id}
            onClick={() => onSelectFolder(folder.id)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
              selectedFolderId === folder.id
                ? "bg-brand-primary text-white"
                : "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
            }`}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <svg
                className="w-5 h-5 flex-shrink-0"
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
              <span className="font-medium truncate">{folder.name}</span>
            </div>
            <span className="text-sm ml-2 flex-shrink-0">
              {folder.media_count}
            </span>
          </button>
        ))}
      </div>

      {folders.length === 0 && (
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
          No folders yet
        </p>
      )}
    </div>
  );
}
