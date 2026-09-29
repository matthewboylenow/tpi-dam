"use client";

import { useEffect, useState } from "react";
import { BulkMediaUploadForm } from "@/components/media/BulkMediaUploadForm";
import type { FolderWithCount } from "@/types/folder";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  folders: FolderWithCount[];
  /** Folder the user is currently looking at; new uploads default to it. */
  defaultFolderId?: string | null;
};

/**
 * Upload panel. On phones it slides up as a full-height sheet so the rep
 * never has to scroll to find it; on larger screens it's a centered dialog.
 */
export function UploadSheet({ isOpen, onClose, onSuccess, folders, defaultFolderId = null }: Props) {
  const [isBusy, setIsBusy] = useState(false);

  // Lock page scroll while open
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  // Escape closes, unless an upload is running
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !isBusy) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, isBusy, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label="Upload media">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={() => { if (!isBusy) onClose(); }}
      />
      <div className="relative w-full sm:max-w-2xl h-[92dvh] sm:h-auto sm:max-h-[90vh] flex flex-col animate-slide-up">
        <BulkMediaUploadForm
          key={defaultFolderId ?? "none"}
          onSuccess={onSuccess}
          onCancel={onClose}
          onBusyChange={setIsBusy}
          folders={folders}
          defaultFolderId={defaultFolderId}
        />
      </div>
    </div>
  );
}
