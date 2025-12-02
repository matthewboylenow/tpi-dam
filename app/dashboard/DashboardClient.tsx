"use client";

import { useState, useEffect, useCallback } from "react";
import { Shell } from "@/components/layout/Shell";
import { Button } from "@/components/ui/Button";
import { MediaGrid } from "@/components/media/MediaGrid";
import { MediaFilters } from "@/components/media/MediaFilters";
import { SortControls } from "@/components/media/SortControls";
import { BulkMediaUploadForm } from "@/components/media/BulkMediaUploadForm";
import { MediaDetailModal } from "@/components/media/MediaDetailModal";
import { StarredMediaSection } from "@/components/media/StarredMediaSection";
import { FolderList } from "@/components/folders/FolderList";
import { MediaAssetFull } from "@/types/media";
import { FolderWithCount } from "@/types/folder";
import { SessionUser } from "@/lib/auth/getCurrentUser";

type SortBy = "created_at" | "caption";
type SortOrder = "desc" | "asc";

type Props = {
  user: SessionUser;
};

export function DashboardClient({ user }: Props) {
  const [media, setMedia] = useState<MediaAssetFull[]>([]);
  const [folders, setFolders] = useState<FolderWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaAssetFull | null>(
    null
  );

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
        scope: "mine",
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

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  function handleUploadSuccess() {
    setShowUploadForm(false);
    fetchMedia();
    fetchFolders();
  }

  const starredMedia = media.filter((m) => m.is_starred);
  const regularMedia = media.filter((m) => !m.is_starred);

  return (
    <Shell user={user}>
      <div className="flex gap-6">
        {/* Sidebar with Folders */}
        <div className="w-64 flex-shrink-0">
          <FolderList
            folders={folders}
            selectedFolderId={selectedFolderId}
            onSelectFolder={setSelectedFolderId}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                My Media Library
              </h1>
              <p className="text-slate-600 mt-1">
                Manage your photos and videos
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => setShowUploadForm(!showUploadForm)}
            >
              {showUploadForm ? "Cancel Upload" : "Upload Media"}
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
              <StarredMediaSection
                starredMedia={starredMedia}
                onMediaClick={setSelectedMedia}
              />

              {/* Regular Media Grid */}
              <MediaGrid media={regularMedia} onMediaClick={setSelectedMedia} />
            </>
          )}
        </div>
      </div>

      {/* Media Detail Modal */}
      <MediaDetailModal
        media={selectedMedia}
        onClose={() => setSelectedMedia(null)}
        userRole={user.role}
        onStarToggle={fetchMedia}
      />
    </Shell>
  );
}
