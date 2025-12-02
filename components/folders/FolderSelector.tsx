"use client";

import type { FolderWithCount } from "@/types/folder";

type Props = {
  folders: FolderWithCount[];
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
};

export function FolderSelector({
  folders,
  selectedFolderId,
  onSelectFolder,
}: Props) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        Folder (Optional)
      </label>
      <select
        value={selectedFolderId || ""}
        onChange={(e) => onSelectFolder(e.target.value || null)}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
      >
        <option value="">No Folder</option>
        {folders.map((folder) => (
          <option key={folder.id} value={folder.id}>
            {folder.name}
          </option>
        ))}
      </select>
    </div>
  );
}
