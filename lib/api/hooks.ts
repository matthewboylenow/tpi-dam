"use client";

import { useCallback, useMemo } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import useSWRInfinite from "swr/infinite";
import type { MediaAssetFull } from "@/types/media";
import type { FolderWithCount } from "@/types/folder";
import type { InvitationWithInviter } from "@/types/invitation";
import type { SafeUser } from "@/types/user";

/**
 * Data hooks. Every screen reads through these so results are cached and
 * shared: switching tabs or returning to a page shows the last data
 * instantly and refreshes in the background.
 */

// ---------------------------------------------------------------------------
// Folders
// ---------------------------------------------------------------------------

export const FOLDERS_KEY = "/api/folders";

export function useFolders(enabled = true) {
  const { data, error, isLoading, mutate } = useSWR<{ success: boolean; folders: FolderWithCount[] }>(
    enabled ? FOLDERS_KEY : null
  );
  return {
    folders: data?.folders ?? [],
    error,
    isLoading,
    refresh: mutate,
  };
}

// ---------------------------------------------------------------------------
// Media (paged)
// ---------------------------------------------------------------------------

export type MediaQuery = {
  search?: string;
  clientName?: string;
  tag?: string;
  folderId?: string | null;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

/** Items per page; the API caps this at 100. */
export const MEDIA_PAGE_SIZE = 100;

export function buildMediaKey(query: MediaQuery, offset: number): string {
  const params = new URLSearchParams({
    scope: "all",
    ...(query.search && { search: query.search }),
    ...(query.clientName && { client_name: query.clientName }),
    ...(query.tag && { tag: query.tag }),
    ...(query.folderId && { folder_id: query.folderId }),
    sort_by: query.sortBy ?? "created_at",
    sort_order: query.sortOrder ?? "desc",
    limit: String(MEDIA_PAGE_SIZE),
    offset: String(offset),
  });
  return `/api/media?${params}`;
}

type MediaPage = { success: boolean; media: MediaAssetFull[] };

export function useMediaList(query: MediaQuery, enabled = true) {
  const getKey = useCallback(
    (pageIndex: number, previous: MediaPage | null) => {
      if (!enabled) return null;
      if (previous && previous.media.length < MEDIA_PAGE_SIZE) return null; // reached the end
      return buildMediaKey(query, pageIndex * MEDIA_PAGE_SIZE);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [enabled, query.search, query.clientName, query.tag, query.folderId, query.sortBy, query.sortOrder]
  );

  const { data, error, isLoading, isValidating, size, setSize, mutate } = useSWRInfinite<MediaPage>(getKey, {
    revalidateFirstPage: true,
    keepPreviousData: true,
  });

  const media = useMemo(() => (data ? data.flatMap((page) => page.media) : []), [data]);
  const lastPage = data?.[data.length - 1];
  const hasMore = !!lastPage && lastPage.media.length === MEDIA_PAGE_SIZE;
  const isLoadingMore = size > 0 && !!data && typeof data[size - 1] === "undefined";

  /** Apply a local patch to one item, without a request. */
  const updateItem = useCallback(
    (id: string, patch: Partial<MediaAssetFull>) =>
      mutate(
        (pages) =>
          pages?.map((page) => ({
            ...page,
            media: page.media.map((m) => (m.id === id ? { ...m, ...patch } : m)),
          })),
        { revalidate: false }
      ),
    [mutate]
  );

  /** Drop items locally, without a request. */
  const removeItems = useCallback(
    (ids: Iterable<string>) => {
      const gone = new Set(ids);
      return mutate(
        (pages) =>
          pages?.map((page) => ({ ...page, media: page.media.filter((m) => !gone.has(m.id)) })),
        { revalidate: false }
      );
    },
    [mutate]
  );

  return {
    media,
    error,
    /** True only while the first page of a query is loading with nothing cached. */
    isLoading,
    /** True while any refresh is in flight (the existing list stays visible). */
    isRefreshing: isValidating && !isLoading,
    isLoadingMore,
    hasMore,
    loadMore: () => setSize(size + 1),
    refresh: () => mutate(),
    updateItem,
    removeItems,
  };
}

/** Refresh every cached media list (after uploads, moves, deletes). */
export function revalidateAllMedia() {
  return globalMutate(
    (key) => typeof key === "string" && key.startsWith("/api/media?"),
    undefined,
    { revalidate: true }
  );
}

/** Refresh the folders list (media counts change with uploads and moves). */
export function revalidateFolders() {
  return globalMutate(FOLDERS_KEY);
}

// ---------------------------------------------------------------------------
// Client names (for the upload form's suggestions)
// ---------------------------------------------------------------------------

export const CLIENTS_KEY = "/api/clients";

export function useClientNames(enabled = true) {
  const { data } = useSWR<{ success: boolean; clients: string[] }>(enabled ? CLIENTS_KEY : null, {
    revalidateOnFocus: false,
  });
  return data?.clients ?? [];
}

// ---------------------------------------------------------------------------
// Admin: users and invitations
// ---------------------------------------------------------------------------

export const USERS_KEY = "/api/admin/users";
export const INVITATIONS_KEY = "/api/invitations";

export function useUsers(enabled = true) {
  const { data, error, isLoading, mutate } = useSWR<{ users: SafeUser[] }>(enabled ? USERS_KEY : null);
  return { users: data?.users ?? [], error, isLoading, refresh: mutate };
}

export function useInvitations(enabled = true) {
  const { data, error, isLoading, mutate } = useSWR<{ invitations: InvitationWithInviter[] }>(
    enabled ? INVITATIONS_KEY : null
  );
  return { invitations: data?.invitations ?? [], error, isLoading, refresh: mutate };
}
