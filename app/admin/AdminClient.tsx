"use client";

import { useState, useEffect, useCallback } from "react";
import { Shell } from "@/components/layout/Shell";
import { DraggableMediaGrid } from "@/components/media/DraggableMediaGrid";
import { MediaFilters } from "@/components/media/MediaFilters";
import { SortControls } from "@/components/media/SortControls";
import { MediaDetailModal } from "@/components/media/MediaDetailModal";
import { StarredMediaSection } from "@/components/media/StarredMediaSection";
import { DroppableFolderList } from "@/components/folders/DroppableFolderList";
import { FolderCreateModal } from "@/components/folders/FolderCreateModal";
import { DndContext } from "@dnd-kit/core";
import { InvitationForm } from "@/components/admin/InvitationForm";
import { InvitationList } from "@/components/admin/InvitationList";
import { BulkActionToolbar } from "@/components/media/BulkActionToolbar";
import { FolderCard } from "@/components/folders/FolderCard";
import { ContextMenu } from "@/components/ui/ContextMenu";
import { Button } from "@/components/ui/Button";
import { MediaAssetFull } from "@/types/media";
import { InvitationWithInviter } from "@/types/invitation";
import { FolderWithCount } from "@/types/folder";
import { SessionUser } from "@/lib/auth/getCurrentUser";

type SortBy = "created_at" | "caption";
type SortOrder = "desc" | "asc";

type Props = {
  user: SessionUser;
};

type Tab = "media" | "invitations" | "folders";

export function AdminClient({ user }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("media");
  const [media, setMedia] = useState<MediaAssetFull[]>([]);
  const [folders, setFolders] = useState<FolderWithCount[]>([]);
  const [invitations, setInvitations] = useState<InvitationWithInviter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<MediaAssetFull | null>(
    null
  );
  const [showFolderModal, setShowFolderModal] = useState(false);

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

  const fetchFolders = useCallback(async () => {
    try {
      const response = await fetch("/api/folders");
      const data = await response.json();

      if (data.success) {
        setFolders(data.folders);
      }
    } catch (error) {
      console.error("Failed to fetch folders:", error);
    }
  }, []);

  const fetchMedia = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        scope: "all",
        ...(search && { search }),
        ...(clientName && { client_name: clientName }),
        ...(tag && { tag }),
        ...(selectedFolderId && { folder_id: selectedFolderId }),
        sort_by: sortBy,
        sort_order: sortOrder,
      });

      const response = await fetch(`/api/media?${params}`);
      const data = await response.json();

      if (data.success) {
        setMedia(data.media);
      }
    } catch (error) {
      console.error("Failed to fetch media:", error);
    } finally {
      setIsLoading(false);
    }
  }, [search, clientName, tag, selectedFolderId, sortBy, sortOrder]);

  function handleSortChange(newSortBy: SortBy, newSortOrder: SortOrder) {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  }

  const fetchInvitations = useCallback(async () => {
    try {
      const response = await fetch("/api/invitations");
      const data = await response.json();

      if (data.invitations) {
        setInvitations(data.invitations);
      }
    } catch (error) {
      console.error("Failed to fetch invitations:", error);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "media") {
      fetchMedia();
      fetchFolders();
    } else if (activeTab === "invitations") {
      fetchInvitations();
    } else if (activeTab === "folders") {
      fetchFolders();
    }
  }, [activeTab, fetchMedia, fetchInvitations, fetchFolders]);

  const starredMedia = media.filter((m) => m.is_starred);
  const regularMedia = media.filter((m) => !m.is_starred);

  // When viewing "All Media", only show files without a folder
  const displayMedia = !selectedFolderId
    ? regularMedia.filter((m) => !m.folder_id)
    : regularMedia;

  async function handleMediaMove(mediaId: string, folderId: string | null) {
    try {
      const response = await fetch(`/api/media/${mediaId}/move`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder_id: folderId }),
      });

      if (response.ok) {
        // Refresh media and folders
        await fetchMedia();
        await fetchFolders();
      } else {
        console.error("Failed to move media");
      }
    } catch (error) {
      console.error("Error moving media:", error);
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
    const mediaIds = Array.from(selectedMediaIds);

    // Move all selected media
    await Promise.all(
      mediaIds.map((mediaId) => handleMediaMove(mediaId, folderId))
    );

    // Clear selection and exit selection mode
    handleClearSelection();
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

  async function handleDeleteMedia(mediaId: string) {
    if (!confirm("Are you sure you want to delete this media? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/media/${mediaId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchMedia();
        await fetchFolders();
      } else {
        alert("Failed to delete media");
      }
    } catch (error) {
      console.error("Error deleting media:", error);
      alert("Failed to delete media");
    }
  }

  async function handleDeleteFolder(folderId: string) {
    if (!confirm("Are you sure you want to delete this folder? Media in this folder will not be deleted, just moved to 'All Media'.")) {
      return;
    }

    try {
      const response = await fetch(`/api/folders/${folderId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchFolders();
        await fetchMedia();
        if (selectedFolderId === folderId) {
          setSelectedFolderId(null);
        }
      } else {
        alert("Failed to delete folder");
      }
    } catch (error) {
      console.error("Error deleting folder:", error);
      alert("Failed to delete folder");
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
          onClick: async () => {
            const response = await fetch(`/api/media/${media.id}/star`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ is_starred: !media.is_starred }),
            });
            if (response.ok) {
              await fetchMedia();
            }
          },
        },
        {
          label: "Move to Folder",
          icon: (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          ),
          onClick: () => {
            // This will be handled by showing a submenu in a future enhancement
            alert("Use drag-and-drop or bulk select to move files to folders");
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
          onClick: () => handleDeleteMedia(media.id),
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
          onClick: async () => {
            const response = await fetch(`/api/folders/${folder.id}/star`, {
              method: "PATCH",
            });
            if (response.ok) {
              await fetchFolders();
            }
          },
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
          onClick: () => handleDeleteFolder(folder.id),
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
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-600 mt-1">
            Manage media, users, folders, and invitations
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("media")}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "media"
                  ? "border-brand-primary text-brand-primary"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              All Media
            </button>
            <button
              onClick={() => setActiveTab("folders")}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "folders"
                  ? "border-brand-primary text-brand-primary"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              Folders
            </button>
            <button
              onClick={() => setActiveTab("invitations")}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "invitations"
                  ? "border-brand-primary text-brand-primary"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              Invite Users
            </button>
          </nav>
        </div>

        {/* Media Tab */}
        {activeTab === "media" && (
          <div className="flex gap-6">
            {/* Sidebar with Folders */}
            <div className="w-64 flex-shrink-0">
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

              {/* Stats */}
              {!isLoading && (
                <>
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                    <p className="text-sm text-slate-600">
                      Showing <span className="font-semibold">{media.length}</span>{" "}
                      media assets
                    </p>
                  </div>

                </>
              )}

              {/* Media Content */}
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto"></div>
                    <p className="mt-4 text-slate-600">Loading media...</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Starred Media Section */}
                  {starredMedia.length > 0 && (
                    <div className="mb-8">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="bg-yellow-400 rounded-full p-2">
                          <svg
                            className="w-5 h-5 text-white fill-current"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">Pinned Assets</h2>
                        <span className="text-sm text-slate-500">
                          ({starredMedia.length})
                        </span>
                      </div>
                      <DraggableMediaGrid
                        media={starredMedia}
                        onMediaClick={setSelectedMedia}
                        onMediaMove={handleMediaMove}
                        isAdmin={true}
                        isSelectable={isSelectionMode}
                        selectedIds={selectedMediaIds}
                        onSelect={handleSelect}
                        onContextMenu={handleMediaContextMenu}
                      />
                      <div className="mt-6 border-t border-slate-200"></div>
                    </div>
                  )}

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
                        <h2 className="text-xl font-bold text-slate-900">Folders</h2>
                        <span className="text-sm text-slate-500">
                          ({folders.length})
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {folders.map((folder) => (
                          <FolderCard
                            key={folder.id}
                            folder={folder}
                            onClick={() => setSelectedFolderId(folder.id)}
                            onContextMenu={handleFolderContextMenu}
                          />
                        ))}
                      </div>
                      <div className="mt-6 border-t border-slate-200"></div>
                    </div>
                  )}

                  {/* Files Section */}
                  {displayMedia.length > 0 && (
                    <div>
                      {!selectedFolderId && (
                        <div className="flex items-center gap-2 mb-4">
                          <div className="bg-slate-500 rounded-full p-2">
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
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                          <h2 className="text-xl font-bold text-slate-900">Files</h2>
                          <span className="text-sm text-slate-500">
                            ({displayMedia.length} not in folders)
                          </span>
                        </div>
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
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Folders Tab */}
        {activeTab === "folders" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Manage Folders
                </h2>
                <p className="text-sm text-slate-600 mt-1">
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

            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              {folders.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-600">No folders yet</p>
                  <p className="text-sm text-slate-500 mt-2">
                    Create your first folder to organize media assets
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {folders.map((folder) => (
                    <div
                      key={folder.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
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
                          <h3 className="font-medium text-slate-900">
                            {folder.name}
                          </h3>
                          {folder.description && (
                            <p className="text-sm text-slate-500">
                              {folder.description}
                            </p>
                          )}
                          <p className="text-xs text-slate-400 mt-1">
                            {folder.media_count} media assets
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-slate-500">
                        Created by {folder.creator_name || folder.creator_email}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Invitations Tab */}
        {activeTab === "invitations" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                Send New Invitation
              </h2>
              <InvitationForm onSuccess={fetchInvitations} />
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
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
        media={selectedMedia}
        onClose={() => setSelectedMedia(null)}
        userRole={user.role}
        onStarToggle={fetchMedia}
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
        folders={folders}
        isAdmin={true}
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
