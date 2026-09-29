"use client";

import { useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { DraggableMediaGrid } from "@/components/media/DraggableMediaGrid";
import { MediaFilters } from "@/components/media/MediaFilters";
import { SortControls } from "@/components/media/SortControls";
import { MediaDetailModal } from "@/components/media/MediaDetailModal";
import { DroppableFolderList } from "@/components/folders/DroppableFolderList";
import { FolderCreateModal } from "@/components/folders/FolderCreateModal";
import { DndContext } from "@dnd-kit/core";
import { InvitationForm } from "@/components/admin/InvitationForm";
import { InvitationList } from "@/components/admin/InvitationList";
import { BulkActionToolbar } from "@/components/media/BulkActionToolbar";
import { FolderCard } from "@/components/folders/FolderCard";
import { ContextMenu } from "@/components/ui/ContextMenu";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { RenameModal } from "@/components/ui/RenameModal";
import { MediaGridSkeleton } from "@/components/media/MediaCardSkeleton";
import { useToast } from "@/components/providers/ToastProvider";
import { Button } from "@/components/ui/Button";
import { SectionRule } from "@/components/ui/SectionRule";
import { USAGE_CHANNELS, USAGE_LABELS } from "@/lib/usage";
import { MediaAssetFull } from "@/types/media";
import { FolderWithCount } from "@/types/folder";
import { SessionUser } from "@/lib/auth/getCurrentUser";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import {
  useFolders,
  useMediaList,
  useUsers,
  useInvitations,
  useMediaStats,
  revalidateFolders,
  revalidateMediaStats,
} from "@/lib/api/hooks";
import {
  starMedia,
  renameMedia,
  deleteMedia,
  moveMedia,
  toggleFolderStar,
  deleteFolder,
  setUserRole,
  deleteUser,
  setMediaMarketing,
  runBulk,
  describeBulk,
} from "@/lib/api/mutations";

type SortBy = "created_at" | "caption";
type SortOrder = "desc" | "asc";

type Props = {
  user: SessionUser;
};

type Tab = "media" | "invitations" | "folders" | "users";

function formatNYC(date: Date | string | null): string {
  if (!date) return "Never";
  return new Date(date).toLocaleString("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }) + " ET";
}

export function AdminClient({ user }: Props) {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("media");
  const [selectedMedia, setSelectedMedia] = useState<MediaAssetFull | null>(null);
  const [showFolderModal, setShowFolderModal] = useState(false);

  // Modals
  const [confirmModal, setConfirmModal] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);
  const [renameModal, setRenameModal] = useState<{ media: MediaAssetFull } | null>(null);

  // Multi-select
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMediaIds, setSelectedMediaIds] = useState<Set<string>>(new Set());

  // Context menu
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    media?: MediaAssetFull;
    folder?: FolderWithCount;
  } | null>(null);

  // Filters and Sorting
  const [search, setSearch] = useState("");
  const [clientName, setClientName] = useState("");
  const [tag, setTag] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  // Marketing queue filters
  const [reviewFilter, setReviewFilter] = useState<"" | "new" | "reviewed">("");
  const [usedFilter, setUsedFilter] = useState<string>("");

  // Text filters wait until typing pauses before hitting the API
  const debouncedSearch = useDebouncedValue(search);
  const debouncedClientName = useDebouncedValue(clientName);
  const debouncedTag = useDebouncedValue(tag);

  // Data. Each list is cached, so switching tabs shows the last result
  // instantly and refreshes in the background.
  const { folders, refresh: fetchFolders } = useFolders(activeTab === "media" || activeTab === "folders");
  const {
    media,
    isLoading,
    isRefreshing,
    isLoadingMore,
    hasMore,
    loadMore,
    refresh: fetchMedia,
    updateItem,
    removeItems,
  } = useMediaList(
    {
      search: debouncedSearch,
      clientName: debouncedClientName,
      tag: debouncedTag,
      folderId: selectedFolderId,
      review: reviewFilter,
      used: usedFilter,
      sortBy,
      sortOrder,
    },
    activeTab === "media"
  );
  const { stats } = useMediaStats(activeTab === "media");
  const { invitations, refresh: fetchInvitations } = useInvitations(activeTab === "invitations");
  const { users, refresh: fetchUsers } = useUsers(activeTab === "users");

  function handleSortChange(newSortBy: SortBy, newSortOrder: SortOrder) {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  }

  const starredMedia = media.filter((m) => m.is_starred);
  const regularMedia = media.filter((m) => !m.is_starred);

  // When viewing "All Media", only show files without a folder
  const displayMedia = !selectedFolderId
    ? regularMedia.filter((m) => !m.folder_id)
    : regularMedia;

  async function handleMediaMove(mediaId: string, folderId: string | null) {
    const previous = media.find((m) => m.id === mediaId)?.folder_id ?? null;
    updateItem(mediaId, { folder_id: folderId });
    try {
      await moveMedia(mediaId, folderId);
      revalidateFolders();
    } catch (err) {
      updateItem(mediaId, { folder_id: previous });
      toast.error((err as Error).message || "Failed to move media");
    }
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

  async function handleBulkMoveToFolder(folderId: string | null) {
    const ids = Array.from(selectedMediaIds);
    const { succeeded, failed } = await runBulk(ids, (id) => moveMedia(id, folderId));
    (failed === 0 ? toast.success : toast.error)(describeBulk("Moved", succeeded, failed));
    handleClearSelection();
    fetchMedia();
    revalidateFolders();
  }

  function handleMediaContextMenu(e: React.MouseEvent, media: MediaAssetFull) {
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      media,
    });
  }

  function handleFolderContextMenu(e: React.MouseEvent, folder: FolderWithCount) {
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      folder,
    });
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
    updateItem(mediaItem.id, { is_starred: nextStarred });
    try {
      await starMedia(mediaItem.id, nextStarred);
    } catch {
      updateItem(mediaItem.id, { is_starred: !nextStarred });
      toast.error("Failed to update star");
    }
  }

  async function handleToggleFolderStar(folderId: string) {
    try {
      await toggleFolderStar(folderId);
      fetchFolders();
    } catch {
      toast.error("Failed to update folder star");
    }
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
    ];
  }

  async function handleDeleteMedia(mediaId: string) {
    try {
      await deleteMedia(mediaId);
      removeItems([mediaId]);
      toast.success("Media deleted");
      revalidateFolders();
      revalidateMediaStats();
    } catch (err) {
      toast.error((err as Error).message || "Failed to delete media");
    }
  }

  async function handleDeleteFolder(folderId: string) {
    try {
      await deleteFolder(folderId);
      toast.success("Folder deleted");
      fetchFolders();
      fetchMedia();
      if (selectedFolderId === folderId) setSelectedFolderId(null);
    } catch (err) {
      toast.error((err as Error).message || "Failed to delete folder");
    }
  }

  async function handleBulkMarkReviewed() {
    const ids = Array.from(selectedMediaIds);
    const { succeeded, failed } = await runBulk(ids, (id) => setMediaMarketing(id, { reviewed: true }));
    (failed === 0 ? toast.success : toast.error)(describeBulk("Reviewed", succeeded, failed));
    handleClearSelection();
    fetchMedia();
    revalidateMediaStats();
  }

  async function handleBulkDelete() {
    const ids = Array.from(selectedMediaIds);
    const { succeeded, failed } = await runBulk(ids, deleteMedia);
    (failed === 0 ? toast.success : toast.error)(describeBulk("Deleted", succeeded, failed));
    handleClearSelection();
    fetchMedia();
    revalidateFolders();
  }

  async function handleChangeUserRole(userId: string, newRole: "sales" | "admin") {
    try {
      await setUserRole(userId, newRole);
      toast.success("Role updated");
      fetchUsers();
    } catch (err) {
      toast.error((err as Error).message || "Failed to update role");
    }
  }

  async function handleDeleteUser(userId: string) {
    try {
      await deleteUser(userId);
      toast.success("User deleted");
      fetchUsers();
    } catch (err) {
      toast.error((err as Error).message || "Failed to delete user");
    }
  }

  function getContextMenuItems() {
    if (!contextMenu) return [];

    if (contextMenu.media) {
      const media = contextMenu.media;
      return [
        {
          label: "View Details",
          icon: (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          ),
          onClick: () => setSelectedMedia(media),
        },
        {
          label: "Download",
          icon: (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          ),
          onClick: () => {
            window.open(media.blob_url, "_blank");
          },
        },
        {
          label: media.is_starred ? "Unstar" : "Star",
          icon: (
            <svg fill={media.is_starred ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          ),
          onClick: () => handleToggleStar(media),
        },
        {
          label: "Move to Folder",
          icon: (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          ),
          onClick: () => {
            // Select just this item so the toolbar's folder picker appears
            setIsSelectionMode(true);
            setSelectedMediaIds(new Set([media.id]));
            toast.info("Pick a folder from the toolbar below");
          },
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
            message: `Delete "${media.caption || "this item"}"? This cannot be undone.`,
            onConfirm: () => handleDeleteMedia(media.id),
          }),
        },
      ];
    } else if (contextMenu.folder) {
      const folder = contextMenu.folder;
      return [
        {
          label: "Open Folder",
          icon: (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          ),
          onClick: () => setSelectedFolderId(folder.id),
        },
        {
          label: folder.is_starred ? "Unstar Folder" : "Star Folder",
          icon: (
            <svg fill={folder.is_starred ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          ),
          onClick: () => handleToggleFolderStar(folder.id),
        },
        {
          divider: true,
          label: "",
          onClick: () => {},
        },
        {
          label: "Delete Folder",
          danger: true,
          icon: (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          ),
          onClick: () => setConfirmModal({
            title: "Delete Folder",
            message: "Delete this folder? Media inside will be moved to All Media.",
            onConfirm: () => handleDeleteFolder(folder.id),
          }),
        },
      ];
    }

    return [];
  }

  return (
    <Shell user={user}>
      <DndContext>
        <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">Marketing</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Review new uploads, mark what has been used, and manage users and folders.
            </p>
          </div>
          {stats && (
            <dl className="grid grid-cols-4 sm:flex gap-2 sm:gap-1 text-right">
              {[
                { label: "New", value: stats.unreviewed, onClick: () => { setActiveTab("media"); setReviewFilter("new"); setUsedFilter(""); }, hot: stats.unreviewed > 0 },
                { label: "This week", value: stats.recent },
                { label: "Used", value: stats.used, onClick: () => { setActiveTab("media"); setReviewFilter(""); setUsedFilter("any"); } },
                { label: "Total", value: stats.total },
              ].map((stat) => (
                <button
                  key={stat.label}
                  type="button"
                  onClick={stat.onClick}
                  disabled={!stat.onClick}
                  className={`px-3 py-2 rounded-md text-left sm:min-w-[84px] transition-colors ${
                    stat.hot
                      ? "bg-signal-soft dark:bg-signal/15 hover:bg-signal/20"
                      : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 disabled:hover:border-slate-200 dark:disabled:hover:border-slate-800"
                  }`}
                >
                  <dt className={`eyebrow ${stat.hot ? "text-signal-ink dark:text-orange-300" : ""}`}>{stat.label}</dt>
                  <dd className={`font-display text-xl font-bold leading-tight ${stat.hot ? "text-signal-ink dark:text-orange-200" : "text-slate-900 dark:text-white"}`}>
                    {stat.value}
                  </dd>
                </button>
              ))}
            </dl>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 dark:border-slate-800 -mx-3 px-3 sm:mx-0 sm:px-0 overflow-x-auto">
          <nav className="-mb-px flex gap-6 min-w-max">
            {([
              { id: "media", label: "Media" },
              { id: "folders", label: "Folders" },
              { id: "invitations", label: "Invitations" },
              { id: "users", label: "Users" },
            ] as { id: Tab; label: string }[]).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2.5 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-brand-primary text-slate-900 dark:border-blue-300 dark:text-white"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Media Tab */}
        {activeTab === "media" && (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar with Folders */}
            <div className="hidden lg:block w-64 flex-shrink-0">
              <DroppableFolderList
                folders={folders}
                selectedFolderId={selectedFolderId}
                onSelectFolder={setSelectedFolderId}
              />
            </div>

            {/* Main Content */}
            <div className="flex-1 space-y-6">
              {/* Filters and Sort */}
              <div className="flex items-center justify-between gap-4">
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
                <div className="flex items-center gap-2">
                  <Button
                    variant={isSelectionMode ? "primary" : "secondary"}
                    onClick={() => {
                      setIsSelectionMode(!isSelectionMode);
                      if (isSelectionMode) {
                        setSelectedMediaIds(new Set());
                      }
                    }}
                  >
                    {isSelectionMode ? (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Cancel
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Select
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

              {/* Marketing queue filters */}
              <div className="flex flex-wrap items-center gap-1.5">
                {([
                  { label: "Everything", review: "", used: "" },
                  { label: `New${stats ? ` · ${stats.unreviewed}` : ""}`, review: "new", used: "" },
                  { label: "Reviewed", review: "reviewed", used: "" },
                  { label: "Not used yet", review: "", used: "none" },
                  ...USAGE_CHANNELS.map((c) => ({ label: `On ${USAGE_LABELS[c].toLowerCase()}`, review: "", used: c })),
                ] as { label: string; review: "" | "new" | "reviewed"; used: string }[]).map((chip) => {
                  const active = reviewFilter === chip.review && usedFilter === chip.used;
                  return (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => { setReviewFilter(chip.review); setUsedFilter(chip.used); }}
                      aria-pressed={active}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                        active
                          ? "bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-900"
                          : chip.review === "new" && stats && stats.unreviewed > 0
                            ? "bg-signal-soft border-signal/40 text-signal-ink hover:border-signal dark:bg-signal/15 dark:text-orange-200"
                            : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-500"
                      }`}
                    >
                      {chip.label}
                    </button>
                  );
                })}
                {!isLoading && (
                  <span className="ml-auto font-mono text-[11px] text-slate-500 dark:text-slate-400">
                    {media.length}{hasMore ? "+" : ""} shown
                  </span>
                )}
              </div>

              {/* Media Content */}
              {isLoading ? (
                <MediaGridSkeleton count={10} />
              ) : (
                <div className={isRefreshing ? "opacity-60 transition-opacity" : "transition-opacity"} aria-busy={isRefreshing}>
                  {/* Starred Media Section */}
                  {starredMedia.length > 0 && (
                    <div className="mb-8">
                      <SectionRule label="Pinned" count={starredMedia.length} />
                      <DraggableMediaGrid
                        media={starredMedia}
                        onMediaClick={setSelectedMedia}
                        onMediaMove={handleMediaMove}
                        isAdmin={true}
                        isSelectable={isSelectionMode}
                        selectedIds={selectedMediaIds}
                        onSelect={handleSelect}
                        onContextMenu={handleMediaContextMenu}
                        getMenuItems={getMediaMenuItems}
                      />
                      
                    </div>
                  )}

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
                            onContextMenu={handleFolderContextMenu}
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
                              {
                                label: folder.is_starred ? "Unstar Folder" : "Star Folder",
                                icon: (
                                  <svg fill={folder.is_starred ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                  </svg>
                                ),
                                onClick: () => handleToggleFolderStar(folder.id),
                              },
                              {
                                divider: true,
                                label: "",
                                onClick: () => {},
                              },
                              {
                                label: "Delete Folder",
                                danger: true,
                                icon: (
                                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                ),
                                onClick: () => setConfirmModal({
            title: "Delete Folder",
            message: "Delete this folder? Media inside will be moved to All Media.",
            onConfirm: () => handleDeleteFolder(folder.id),
          }),
                              },
                            ]}
                          />
                        ))}
                      </div>
                      
                    </div>
                  )}

                  {/* Files Section */}
                  {displayMedia.length > 0 && (
                    <div>
                      {!selectedFolderId && (
                        <SectionRule label="Files" count={displayMedia.length} />
                      )}
                      <DraggableMediaGrid
                        media={displayMedia}
                        onMediaClick={setSelectedMedia}
                        onMediaMove={handleMediaMove}
                        isAdmin={true}
                        isSelectable={isSelectionMode}
                        selectedIds={selectedMediaIds}
                        onSelect={handleSelect}
                        onContextMenu={handleMediaContextMenu}
                        getMenuItems={getMediaMenuItems}
                      />
                    </div>
                  )}

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
        )}

        {/* Folders Tab */}
        {activeTab === "folders" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Manage Folders
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Create and organize folders for media assets
                </p>
              </div>
              <Button
                variant="primary"
                onClick={() => setShowFolderModal(true)}
              >
                Create Folder
              </Button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-lg p-6 shadow-sm border border-slate-200 dark:border-slate-800">
              {folders.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-600 dark:text-slate-400">No folders yet</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                    Create your first folder to organize media assets
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {folders.map((folder) => (
                    <div
                      key={folder.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <svg
                          className="w-6 h-6 text-brand-primary"
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
                        <div>
                          <h3 className="font-medium text-slate-900 dark:text-white">
                            {folder.name}
                          </h3>
                          {folder.description && (
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              {folder.description}
                            </p>
                          )}
                          <p className="text-xs text-slate-400 mt-1">
                            {folder.media_count} media assets
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Created by {folder.creator_name || folder.creator_email}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Registered Users</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                All users who have signed up. Last login times shown in Eastern Time (NYC).
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
              {users.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-500 dark:text-slate-400">No users found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                        <th className="text-left px-6 py-3 font-semibold text-slate-700 dark:text-slate-200">Name</th>
                        <th className="text-left px-6 py-3 font-semibold text-slate-700 dark:text-slate-200">Email</th>
                        <th className="text-left px-6 py-3 font-semibold text-slate-700 dark:text-slate-200">Role</th>
                        <th className="text-left px-6 py-3 font-semibold text-slate-700 dark:text-slate-200">Joined</th>
                        <th className="text-left px-6 py-3 font-semibold text-slate-700 dark:text-slate-200">Last Login (ET)</th>
                        <th className="text-left px-6 py-3 font-semibold text-slate-700 dark:text-slate-200">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                          <td className="px-6 py-4 text-slate-900 dark:text-white font-medium">
                            {u.name || <span className="text-slate-400 italic">No name</span>}
                          </td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{u.email}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              u.role === "admin"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-blue-100 text-blue-800"
                            }`}>
                              {u.role === "admin" ? "Admin" : "Sales"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                            {formatNYC(u.created_at)}
                          </td>
                          <td className="px-6 py-4">
                            {u.last_login_at ? (
                              <span className="text-slate-600 dark:text-slate-400">{formatNYC(u.last_login_at)}</span>
                            ) : (
                              <span className="text-slate-400 italic">Never logged in</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <select
                                value={u.role}
                                onChange={(e) => handleChangeUserRole(u.id, e.target.value as "sales" | "admin")}
                                className="text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                                disabled={u.id === user.id}
                              >
                                <option value="sales">Sales</option>
                                <option value="admin">Admin</option>
                              </select>
                              {u.id !== user.id && (
                                <button
                                  onClick={() => setConfirmModal({
                                    title: "Delete User",
                                    message: `Delete ${u.name || u.email}? This removes all their data.`,
                                    onConfirm: () => handleDeleteUser(u.id),
                                  })}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                  title="Delete user"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Invitations Tab */}
        {activeTab === "invitations" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-lg p-6 shadow-sm border border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                Send New Invitation
              </h2>
              <InvitationForm onSuccess={fetchInvitations} />
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-lg p-6 shadow-sm border border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                Active Invitations
              </h2>
              <InvitationList
                invitations={invitations}
                onUpdate={fetchInvitations}
              />
            </div>
          </div>
        )}
      </div>

      {/* Media Detail Modal */}
      <MediaDetailModal
        key={selectedMedia?.id ?? "none"}
        media={selectedMedia}
        onClose={() => setSelectedMedia(null)}
        userRole={user.role}
        onChange={(patch) => {
          if (selectedMedia) updateItem(selectedMedia.id, patch);
          if ("reviewed_at" in patch || "used_on" in patch) revalidateMediaStats();
        }}
      />

      {/* Folder Create Modal */}
      <FolderCreateModal
        isOpen={showFolderModal}
        onClose={() => setShowFolderModal(false)}
        onSuccess={() => {
          setShowFolderModal(false);
          fetchFolders();
        }}
      />

      {/* Bulk Action Toolbar */}
      <BulkActionToolbar
        selectedCount={selectedMediaIds.size}
        onClearSelection={handleClearSelection}
        onMoveToFolder={handleBulkMoveToFolder}
        onDelete={() => setConfirmModal({
          title: "Delete Selected",
          message: `Delete ${selectedMediaIds.size} item${selectedMediaIds.size !== 1 ? "s" : ""}? This cannot be undone.`,
          onConfirm: handleBulkDelete,
        })}
        folders={folders}
        isAdmin={true}
        onMarkReviewed={handleBulkMarkReviewed}
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

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={getContextMenuItems()}
          onClose={() => setContextMenu(null)}
        />
      )}
      </DndContext>
    </Shell>
  );
}
