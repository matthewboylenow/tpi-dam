"use client";

import { useDroppable } from "@dnd-kit/core";
import type { FolderWithCount } from "@/types/folder";

type Props = {
  folders: FolderWithCount[];
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
};

export function DroppableFolderList({
  folders,
  selectedFolderId,
  onSelectFolder,
}: Props) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Folders</h2>

      <div className="space-y-1">
        {/* All Media Option */}
        <DroppableFolder
          id="no-folder"
          isSelected={selectedFolderId === null}
          onSelect={() => onSelectFolder(null)}
          icon="image"
          name="All Media"
        />

        {/* Folders */}
        {folders.map((folder) => (
          <DroppableFolder
            key={folder.id}
            id={folder.id}
            isSelected={selectedFolderId === folder.id}
            onSelect={() => onSelectFolder(folder.id)}
            icon="folder"
            name={folder.name}
            count={folder.media_count}
          />
        ))}
      </div>

      {folders.length === 0 && (
        <p className="text-sm text-slate-500 text-center py-4">
          No folders yet
        </p>
      )}
    </div>
  );
}

function DroppableFolder({
  id,
  isSelected,
  onSelect,
  icon,
  name,
  count,
}: {
  id: string;
  isSelected: boolean;
  onSelect: () => void;
  icon: "folder" | "image";
  name: string;
  count?: number;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id,
  });

  return (
    <button
      ref={setNodeRef}
      onClick={onSelect}
      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all ${
        isSelected
          ? "bg-brand-primary text-white"
          : isOver
          ? "bg-brand-primary/20 border-2 border-brand-primary border-dashed"
          : "hover:bg-slate-100 text-slate-700"
      }`}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {icon === "folder" ? (
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
        ) : (
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
        )}
        <span className="font-medium truncate">{name}</span>
      </div>
      {count !== undefined && (
        <span className="text-sm ml-2 flex-shrink-0">{count}</span>
      )}
    </button>
  );
}
