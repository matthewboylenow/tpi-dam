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
import { StorageStats } from "@/components/admin/StorageStats";
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
                <SortControls
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSortChange={handleSortChange}
                />
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

                  {/* Storage Stats */}
                  <StorageStats
                    totalFiles={media.length}
                    totalSizeBytes={media.reduce((acc, m) => acc + (m.file_size || 0), 0)}
                  />
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
                      />
                      <div className="mt-6 border-t border-slate-200"></div>
                    </div>
                  )}

                  {/* Regular Media Grid */}
                  <DraggableMediaGrid
                    media={regularMedia}
                    onMediaClick={setSelectedMedia}
                    onMediaMove={handleMediaMove}
                    isAdmin={true}
                  />
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
      </DndContext>
    </Shell>
  );
}
