"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Shell } from "@/components/layout/Shell";
import { Button } from "@/components/ui/Button";
import { MediaGrid, MediaGridSkeleton } from "@/components/media/MediaGrid";
import { MediaFilters } from "@/components/media/MediaFilters";
import { SortControls } from "@/components/media/SortControls";
import { BulkMediaUploadForm } from "@/components/media/BulkMediaUploadForm";
import { MediaDetailModal } from "@/components/media/MediaDetailModal";
import { StarredMediaSection } from "@/components/media/StarredMediaSection";
import { FolderList } from "@/components/folders/FolderList";
import { FolderCard } from "@/components/folders/FolderCard";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { RenameModal } from "@/components/ui/RenameModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { BulkActionToolbar } from "@/components/media/BulkActionToolbar";
import { useToast } from "@/components/providers/ToastProvider";
import { MediaAssetFull } from "@/types/media";
import { FolderWithCount } from "@/types/folder";
import { SessionUser } from "@/lib/auth/getCurrentUser";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";

type SortBy = "created_at" | "caption";
type SortOrder = "desc" | "asc";

type Props = {
  user: SessionUser;
};

/** Items fetched per request; the API caps this at 100. */
const PAGE_SIZE = 100;

export function DashboardClient({ user }: Props) {
  const toast = useToast();
  const [media, setMedia] = useState<MediaAssetFull[]>([]);
  const [folders, setFolders] = useState<FolderWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true); // first load only
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const activeRequest = useRef<AbortController | null>(null);
  const loadedCount = useRef(0); // read by "load more" for the next offset
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

  const fetchFolders = useCallback(async () => {
    try {
      const response = await fetch("/api/folders");
      const data = await response.json();
      if (data.success) setFolders(data.folders);
    } catch {
      // silently fail — folders are supplementary
    }
  }, []);

  /**
   * Load media for the current filters. Only the very first load shows the
   * skeleton; later loads keep the grid on screen. A newer request cancels
   * any older one so stale results never overwrite fresh ones.
   */
  const fetchMedia = useCallback(async (options: { append?: boolean } = {}) => {
    const { append = false } = options;
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;

    if (append) setIsLoadingMore(true);
    else setIsRefreshing(true);

    try {
      const params = new URLSearchParams({
        scope: "all",
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(debouncedClientName && { client_name: debouncedClientName }),
        ...(debouncedTag && { tag: debouncedTag }),
        ...(selectedFolderId && { folder_id: selectedFolderId }),
        sort_by: sortBy,
        sort_order: sortOrder,
        limit: String(PAGE_SIZE),
        offset: String(append ? loadedCount.current : 0),
      });
      const response = await fetch(`/api/media?${params}`, { signal: controller.signal });
      const data = await response.json();
      if (controller.signal.aborted) return;
      if (data.success) {
        const page: MediaAssetFull[] = data.media;
        setMedia((prev) => {
          const next = append ? [...prev, ...page] : page;
          loadedCount.current = next.length;
          return next;
        });
        setHasMore(page.length === PAGE_SIZE);
      } else {
        toast.error(data.error || "Failed to load media");
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      toast.error("Failed to load media");
    } finally {
      if (activeRequest.current === controller) {
        setIsLoading(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, debouncedClientName, debouncedTag, selectedFolderId, sortBy, sortOrder]);

  function handleSortChange(newSortBy: SortBy, newSortOrder: SortOrder) {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  }

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  useEffect(() => {
    fetchMedia();
    return () => activeRequest.current?.abort();
  }, [fetchMedia]);

  function handleUploadSuccess() {
    setShowUploadForm(false);
    fetchMedia();
    fetchFolders();
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
    try {
      const response = await fetch(`/api/media/${mediaItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption: newCaption }),
      });
      if (response.ok) {
        toast.success("Renamed successfully");
        fetchMedia();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to rename");
      }
    } catch {
      toast.error("Failed to rename media");
    }
  }

  async function handleToggleStar(mediaItem: MediaAssetFull) {
    const nextStarred = !mediaItem.is_starred;
    // Update immediately so the card moves without waiting on the network
    const applyStar = (value: boolean) =>
      setMedia((prev) => prev.map((m) => (m.id === mediaItem.id ? { ...m, is_starred: value } : m)));
    applyStar(nextStarred);
    try {
      const response = await fetch(`/api/media/${mediaItem.id}/star`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_starred: nextStarred }),
      });
      if (!response.ok) throw new Error("star failed");
    } catch {
      applyStar(!nextStarred);
      toast.error("Failed to update star");
    }
  }

  async function handleDeleteMedia(mediaId: string) {
    try {
      const response = await fetch(`/api/media/${mediaId}`, { method: "DELETE" });
      if (response.ok) {
        toast.success("Media deleted");
        fetchMedia();
        fetchFolders();
      } else {
        toast.error("Failed to delete media");
      }
    } catch {
      toast.error("Failed to delete media");
    }
  }

  /** Run one request per id and report how many actually succeeded. */
  async function runBulk(ids: string[], request: (id: string) => Promise<Response>) {
    const results = await Promise.allSettled(ids.map(request));
    const failed = results.filter((r) => r.status === "rejected" || !r.value.ok).length;
    return { succeeded: ids.length - failed, failed };
  }

  async function handleBulkDelete() {
    const ids = Array.from(selectedMediaIds);
    const { succeeded, failed } = await runBulk(ids, (id) => fetch(`/api/media/${id}`, { method: "DELETE" }));
    if (failed === 0) {
      toast.success(`Deleted ${succeeded} item${succeeded !== 1 ? "s" : ""}`);
    } else {
      toast.error(`Deleted ${succeeded}, but ${failed} item${failed !== 1 ? "s" : ""} failed`);
    }
    handleClearSelection();
    fetchMedia();
    fetchFolders();
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
                Media Library
              </h1>
              <p className="text-sm lg:text-base text-slate-600 dark:text-slate-400 mt-1 hidden sm:block">
                All photos and videos from your team
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => setShowUploadForm(!showUploadForm)}
              className="hidden sm:flex"
            >
              {showUploadForm ? "Cancel" : "Upload"}
            </Button>
          </div>

          {/* Upload Form */}
          {showUploadForm && (
            <BulkMediaUploadForm
              onSuccess={handleUploadSuccess}
              onCancel={() => setShowUploadForm(false)}
              folders={folders}
            />
          )}

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
            <div className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-xl px-4 py-3 shadow-sm border border-slate-200 dark:border-slate-700">
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
                  <div className="flex items-center gap-2 mb-4">
                    <div className="bg-blue-500 rounded-full p-2">
                      <svg
                        className="w-5 h-5 text-white"
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
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Folders</h2>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      ({folders.length})
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                  <div className="mt-6 border-t border-slate-200 dark:border-slate-700"></div>
                </div>
              )}

              {/* Files Section */}
              {displayMedia.length > 0 ? (
                <div>
                  {!selectedFolderId && (
                    <div className="flex items-center gap-2 mb-4">
                      <div className="bg-slate-500 rounded-full p-2">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">Files</h2>
                      <span className="text-sm text-slate-500 dark:text-slate-400">({displayMedia.length})</span>
                    </div>
                  )}
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
                  <Button
                    variant="secondary"
                    onClick={() => fetchMedia({ append: true })}
                    disabled={isLoadingMore}
                  >
                    {isLoadingMore ? "Loading..." : "Load more"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Upload FAB - Only visible on mobile when not in upload mode */}
      {!showUploadForm && (
        <button
          onClick={() => setShowUploadForm(true)}
          className="sm:hidden fixed bottom-6 right-6 z-50 w-14 h-14 bg-brand-primary hover:bg-brand-secondary text-white rounded-full shadow-2xl flex items-center justify-center transition-all active:scale-95"
          aria-label="Upload media"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}

      {/* Media Detail Modal */}
      <MediaDetailModal
        media={selectedMedia}
        onClose={() => setSelectedMedia(null)}
        userRole={user.role}
        onStarToggle={fetchMedia}
      />

      {/* Bulk Action Toolbar */}
      <BulkActionToolbar
        selectedCount={selectedMediaIds.size}
        onClearSelection={handleClearSelection}
        onMoveToFolder={async (folderId) => {
          const { succeeded, failed } = await runBulk(Array.from(selectedMediaIds), (id) =>
            fetch(`/api/media/${id}/move`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ folder_id: folderId }),
            })
          );
          if (failed === 0) {
            toast.success(`Moved ${succeeded} item${succeeded !== 1 ? "s" : ""}`);
          } else {
            toast.error(`Moved ${succeeded}, but ${failed} item${failed !== 1 ? "s" : ""} failed`);
          }
          handleClearSelection();
          fetchMedia();
          fetchFolders();
        }}
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
