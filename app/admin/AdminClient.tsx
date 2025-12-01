"use client";

import { useState, useEffect, useCallback } from "react";
import { Shell } from "@/components/layout/Shell";
import { MediaGrid } from "@/components/media/MediaGrid";
import { MediaFilters } from "@/components/media/MediaFilters";
import { MediaDetailModal } from "@/components/media/MediaDetailModal";
import { MediaAssetFull } from "@/types/media";
import { SessionUser } from "@/lib/auth/getCurrentUser";

type Props = {
  user: SessionUser;
};

export function AdminClient({ user }: Props) {
  const [media, setMedia] = useState<MediaAssetFull[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<MediaAssetFull | null>(
    null
  );

  // Filters
  const [search, setSearch] = useState("");
  const [clientName, setClientName] = useState("");
  const [tag, setTag] = useState("");

  const fetchMedia = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        scope: "all",
        ...(search && { search }),
        ...(clientName && { client_name: clientName }),
        ...(tag && { tag }),
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
  }, [search, clientName, tag]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  return (
    <Shell user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Admin – All Media
          </h1>
          <p className="text-slate-600 mt-1">
            View and manage all media assets from all salespeople
          </p>
        </div>

        {/* Filters */}
        <MediaFilters
          search={search}
          onSearchChange={setSearch}
          clientName={clientName}
          onClientNameChange={setClientName}
          tag={tag}
          onTagChange={setTag}
        />

        {/* Stats */}
        {!isLoading && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <p className="text-sm text-slate-600">
              Showing <span className="font-semibold">{media.length}</span>{" "}
              media assets
            </p>
          </div>
        )}

        {/* Media Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto"></div>
              <p className="mt-4 text-slate-600">Loading media...</p>
            </div>
          </div>
        ) : (
          <MediaGrid media={media} onMediaClick={setSelectedMedia} />
        )}
      </div>

      {/* Media Detail Modal */}
      <MediaDetailModal
        media={selectedMedia}
        onClose={() => setSelectedMedia(null)}
      />
    </Shell>
  );
}
