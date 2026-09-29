"use client";

import { useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { Button } from "@/components/ui/Button";
import { MediaGrid, MediaGridSkeleton } from "@/components/media/MediaGrid";
import { MediaFilters } from "@/components/media/MediaFilters";
import { SortControls } from "@/components/media/SortControls";
import { UploadSheet } from "@/components/upload/UploadSheet";
import { MediaDetailModal } from "@/components/media/MediaDetailModal";
import { StarredMediaSection } from "@/components/media/StarredMediaSection";
import { FolderList } from "@/components/folders/FolderList";
import { FolderCard } from "@/components/folders/FolderCard";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { RenameModal } from "@/components/ui/RenameModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionRule } from "@/components/ui/SectionRule";
import { BulkActionToolbar } from "@/components/media/BulkActionToolbar";
import { useToast } from "@/components/providers/ToastProvider";
import { MediaAssetFull } from "@/types/media";
import { SessionUser } from "@/lib/auth/getCurrentUser";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { useFolders, useMediaList, revalidateAllMedia, revalidateFolders } from "@/lib/api/hooks";
import {
  starMedia,
  renameMedia,
  deleteMedia,
  moveMedia,
  runBulk,
  describeBulk,
} from "@/lib/api/mutations";

type SortBy = "created_at" | "caption";
type SortOrder = "desc" | "asc";

type Props = {
  user: SessionUser;
};

export function DashboardClient({ user }: Props) {
  const toast = useToast();
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaAssetFull | null>(null);

  // Modals
  const [confirmModal, setConfirmModal] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);
  const [renameModal, setRenameModal] = useState<{ media: MediaAssetFull } | null>(null);

  // Multi-select
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMediaIds, setSelectedMediaIds] = useState<Set<string>>(new Set());

  // Filters and Sorting
  const [search, setSearch] = useState("");
  const [clientName, setClientName] = useState("");
  const [tag, setTag] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Text filters wait until typing pauses before hitting the API
  const debouncedSearch = useDebouncedValue(search);
  const debouncedClientName = useDebouncedValue(clientName);
  const debouncedTag = useDebouncedValue(tag);

  const { folders } = useFolders();
  const {
    media,
    isLoading,
    isRefreshing,
    isLoadingMore,
    hasMore,
    loadMore,
    refresh: refreshMedia,
    updateItem,
    removeItems,
  } = useMediaList({
    search: debouncedSearch,
    clientName: debouncedClientName,
    tag: debouncedTag,
    folderId: selectedFolderId,
    sortBy,
    sortOrder,
  });

  function handleSortChange(newSortBy: SortBy, newSortOrder: SortOrder) {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  }

  function handleUploadSuccess() {
    setShowUploadForm(false);
    revalidateAllMedia();
    revalidateFolders();
  }

  function handleSelect(mediaId: string, isSelected: boolean) {
    setSelectedMediaIds((prev) => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(mediaId);
      } else {
        newSet.delete(mediaId);
      }
      return newSet;
    });
  }

  function handleClearSelection() {
    setSelectedMediaIds(new Set());
    setIsSelectionMode(false);
  }

  async function doRenameMedia(mediaItem: MediaAssetFull, newCaption: string) {
    const previous = mediaItem.caption;
    updateItem(mediaItem.id, { caption: newCaption });
    try {
      await renameMedia(mediaItem.id, newCaption);
      toast.success("Renamed successfully");
    } catch (err) {
      updateItem(mediaItem.id, { caption: previous });
      toast.error((err as Error).message || "Failed to rename");
    }
  }

  async function handleToggleStar(mediaItem: MediaAssetFull) {
    const nextStarred = !mediaItem.is_starred;
    // Update immediately so the card moves without waiting on the network
    updateItem(mediaItem.id, { is_starred: nextStarred });
    try {
      await starMedia(mediaItem.id, nextStarred);
    } catch {
      updateItem(mediaItem.id, { is_starred: !nextStarred });
      toast.error("Failed to update star");
    }
  }

  async function handleDeleteMedia(mediaId: string) {
    try {
      await deleteMedia(mediaId);
      removeItems([mediaId]);
      toast.success("Media deleted");
      revalidateFolders();
    } catch {
      toast.error("Failed to delete media");
    }
  }

  async function handleBulkDelete() {
    const ids = Array.from(selectedMediaIds);
    const { succeeded, failed } = await runBulk(ids, deleteMedia);
    (failed === 0 ? toast.success : toast.error)(describeBulk("Deleted", succeeded, failed));
    handleClearSelection();
    refreshMedia();
    revalidateFolders();
  }

  async function handleBulkMove(folderId: string | null) {
    const ids = Array.from(selectedMediaIds);
    const { succeeded, failed } = await runBulk(ids, (id) => moveMedia(id, folderId));
    (failed === 0 ? toast.success : toast.error)(describeBulk("Moved", succeeded, failed));
    handleClearSelection();
    refreshMedia();
    revalidateFolders();
  }

  async function handleDownloadMedia(mediaItem: MediaAssetFull) {
    try {
      // Try to use native share API on mobile
      if (navigator.share && /mobile/i.test(navigator.userAgent)) {
        // Fetch the image as a blob
        const response = await fetch(mediaItem.blob_url);
        const blob = await response.blob();
        const file = new File([blob], mediaItem.caption || 'image', { type: blob.type });

        await navigator.share({
          files: [file],
          title: mediaItem.caption || 'Media',
          text: `${mediaItem.caption || 'Media'} from Taylor Products`,
        });
      } else {
        // Fallback to direct download
        window.open(mediaItem.blob_url, '_blank');
      }
    } catch (error) {
      console.error('Failed to share/download:', error);
      // Fallback to direct download if share fails
      window.open(mediaItem.blob_url, '_blank');
    }
  }

  function getMediaMenuItems(mediaItem: MediaAssetFull) {
    return [
      {
        label: "Download / Share",
        icon: (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        ),
        onClick: () => handleDownloadMedia(mediaItem),
      },
      {
        label: mediaItem.is_starred ? "Unstar" : "Star",
        icon: (
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ),
        onClick: () => handleToggleStar(mediaItem),
      },
      {
        label: "Rename",
        icon: (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        ),
        onClick: () => setRenameModal({ media: mediaItem }),
      },
      {
        divider: true,
        label: "",
        onClick: () => {},
      },
      {
        label: "Delete",
        danger: true,
        icon: (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        ),
        onClick: () => setConfirmModal({
          title: "Delete Media",
          message: `Delete "${mediaItem.caption || mediaItem.blob_url.split("/").pop()}"? This cannot be undone.`,
          onConfirm: () => handleDeleteMedia(mediaItem.id),
        }),
      },
    ];
  }

  const selectedFolder = selectedFolderId ? folders.find((f) => f.id === selectedFolderId) ?? null : null;
  const starredMedia = media.filter((m) => m.is_starred);
  const regularMedia = media.filter((m) => !m.is_starred);

  // When viewing "All Media", only show files without a folder (loose files)
  // When viewing a specific folder, show only files in that folder
  const displayMedia = !selectedFolderId
    ? regularMedia.filter((m) => !m.folder_id)
    : regularMedia.filter((m) => m.folder_id === selectedFolderId);

  return (
    <Shell user={user}>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar with Folders - Hidden on mobile, shown on desktop */}
        <div className="hidden lg:block lg:w-64 lg:flex-shrink-0">
          <FolderList
            folders={folders}
            selectedFolderId={selectedFolderId}
            onSelectFolder={setSelectedFolderId}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-4 lg:space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white truncate">
                Library
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 hidden sm:block">
                Everything the team has shot, newest first.
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => setShowUploadForm(true)}
              className="hidden sm:flex"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload
            </Button>
          </div>

          {/* Filters and Sort */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex-1">
              <MediaFilters
                search={search}
                onSearchChange={setSearch}
                clientName={clientName}
                onClientNameChange={setClientName}
                tag={tag}
                onTagChange={setTag}
              />
            </div>
            <div className="flex items-center gap-2 justify-end">
              <Button
                variant={isSelectionMode ? "primary" : "secondary"}
                onClick={() => {
                  setIsSelectionMode(!isSelectionMode);
                  if (isSelectionMode) {
                    setSelectedMediaIds(new Set());
                  }
                }}
                className="text-sm"
              >
                {isSelectionMode ? (
                  <>
                    <svg className="w-4 h-4 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="hidden sm:inline">Cancel</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="hidden sm:inline">Select</span>
                  </>
                )}
              </Button>
              <SortControls
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={handleSortChange}
              />
            </div>
          </div>

          {/* Current folder (the sidebar is hidden on phones, so this is the way back) */}
          {selectedFolderId && (
            <div className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-lg px-4 py-3 shadow-sm border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setSelectedFolderId(null)}
                className="flex items-center gap-1 text-sm font-medium text-brand-primary-light hover:text-brand-primary dark:text-brand-accent dark:hover:text-teal-300 transition-colors"
                aria-label="Back to all media"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                All Media
              </button>
              <span className="text-slate-300 dark:text-slate-600">/</span>
              <div className="flex items-center gap-2 min-w-0">
                <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white truncate">
                  {selectedFolder?.name ?? "Folder"}
                </h2>
                {selectedFolder && (
                  <span className="text-sm text-slate-500 dark:text-slate-400 flex-shrink-0">
                    ({selectedFolder.media_count})
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Media Content */}
          {isLoading ? (
            <MediaGridSkeleton count={10} />
          ) : (
            <div className={isRefreshing ? "opacity-60 transition-opacity" : "transition-opacity"} aria-busy={isRefreshing}>
              {/* Starred Media Section */}
              <StarredMediaSection
                starredMedia={starredMedia}
                onMediaClick={setSelectedMedia}
                isSelectable={isSelectionMode}
                selectedIds={selectedMediaIds}
                onSelect={handleSelect}
                getMenuItems={getMediaMenuItems}
                currentUserId={user.id}
              />

              {/* Folders Section (show when viewing "All Media") */}
              {!selectedFolderId && folders.length > 0 && (
                <div className="mb-8">
                  <SectionRule label="Folders" count={folders.length} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {folders.map((folder) => (
                      <FolderCard
                        key={folder.id}
                        folder={folder}
                        onClick={() => setSelectedFolderId(folder.id)}
                        menuItems={[
                          {
                            label: "Open Folder",
                            icon: (
                              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                              </svg>
                            ),
                            onClick: () => setSelectedFolderId(folder.id),
                          },
                        ]}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Files Section */}
              {displayMedia.length > 0 ? (
                <div>
                  <SectionRule label={selectedFolderId ? "In this folder" : "Files"} count={displayMedia.length} />
                  <MediaGrid
                    media={displayMedia}
                    onMediaClick={setSelectedMedia}
                    isSelectable={isSelectionMode}
                    selectedIds={selectedMediaIds}
                    onSelect={handleSelect}
                    getMenuItems={getMediaMenuItems}
                    currentUserId={user.id}
                  />
                </div>
              ) : !selectedFolderId && starredMedia.length === 0 && folders.length === 0 ? (
                <EmptyState
                  title="No media yet"
                  description="Upload your first photo or video to get started"
                  action={{ label: "Upload Media", onClick: () => setShowUploadForm(true) }}
                />
              ) : selectedFolderId && starredMedia.length === 0 ? (
                <EmptyState
                  title="This folder is empty"
                  description="Upload media into it or move files here from All Media"
                  action={{ label: "Upload Media", onClick: () => setShowUploadForm(true) }}
                />
              ) : null}

              {hasMore && (
                <div className="flex justify-center pt-6">
                  <Button variant="secondary" onClick={loadMore} disabled={isLoadingMore}>
                    {isLoadingMore ? "Loading..." : "Load more"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Upload FAB */}
      {!showUploadForm && (
        <button
          onClick={() => setShowUploadForm(true)}
          className="sm:hidden fixed bottom-6 right-6 z-40 w-14 h-14 bg-brand-primary hover:bg-brand-secondary text-white rounded-full shadow-2xl flex items-center justify-center transition-all active:scale-95"
          aria-label="Upload media"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}

      {/* Upload sheet */}
      <UploadSheet
        isOpen={showUploadForm}
        onClose={() => setShowUploadForm(false)}
        onSuccess={handleUploadSuccess}
        folders={folders}
        defaultFolderId={selectedFolderId}
      />

      {/* Media Detail Modal */}
      <MediaDetailModal
        key={selectedMedia?.id ?? "none"}
        media={selectedMedia}
        onClose={() => setSelectedMedia(null)}
        userRole={user.role}
        onChange={(patch) => selectedMedia && updateItem(selectedMedia.id, patch)}
      />

      {/* Bulk Action Toolbar */}
      <BulkActionToolbar
        selectedCount={selectedMediaIds.size}
        onClearSelection={handleClearSelection}
        onMoveToFolder={handleBulkMove}
        onDelete={() => setConfirmModal({
          title: "Delete Selected",
          message: `Delete ${selectedMediaIds.size} item${selectedMediaIds.size !== 1 ? "s" : ""}? This cannot be undone.`,
          onConfirm: handleBulkDelete,
        })}
        folders={folders}
      />

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={!!confirmModal}
        title={confirmModal?.title ?? ""}
        message={confirmModal?.message ?? ""}
        confirmLabel="Delete"
        danger
        onConfirm={() => { confirmModal?.onConfirm(); setConfirmModal(null); }}
        onCancel={() => setConfirmModal(null)}
      />

      {/* Rename Modal */}
      <RenameModal
        isOpen={!!renameModal}
        initialValue={renameModal?.media.caption ?? ""}
        title="Rename Media"
        label="Caption"
        onConfirm={(value) => { doRenameMedia(renameModal!.media, value); setRenameModal(null); }}
        onCancel={() => setRenameModal(null)}
      />
    </Shell>
  );
}
