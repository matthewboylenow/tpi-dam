import { apiFetch } from "./client";
import type { MediaAsset } from "@/types/media";

/**
 * Write operations. Each one returns when the server has confirmed it, or
 * throws an ApiError with the server's message.
 */

export function starMedia(id: string, isStarred: boolean) {
  return apiFetch(`/api/media/${id}/star`, {
    method: "PATCH",
    body: JSON.stringify({ is_starred: isStarred }),
  });
}

export function renameMedia(id: string, caption: string) {
  return apiFetch(`/api/media/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ caption }),
  });
}

export function deleteMedia(id: string) {
  return apiFetch(`/api/media/${id}`, { method: "DELETE" });
}

export function moveMedia(id: string, folderId: string | null) {
  return apiFetch(`/api/media/${id}/move`, {
    method: "PATCH",
    body: JSON.stringify({ folder_id: folderId }),
  });
}

export type CreateMediaRecordInput = {
  blob_url: string;
  caption?: string;
  client_name?: string;
  mime_type?: string;
  file_size?: number;
  tags?: string[];
  folder_id?: string | null;
};

export function createMediaRecord(input: CreateMediaRecordInput) {
  return apiFetch<{ success: boolean; media: MediaAsset }>("/api/media", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function toggleFolderStar(id: string) {
  return apiFetch(`/api/folders/${id}/star`, { method: "PATCH" });
}

export function deleteFolder(id: string) {
  return apiFetch(`/api/folders/${id}`, { method: "DELETE" });
}

export function setUserRole(id: string, role: "sales" | "admin") {
  return apiFetch(`/api/admin/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export function deleteUser(id: string) {
  return apiFetch(`/api/admin/users/${id}`, { method: "DELETE" });
}

/**
 * Run one request per id and report how many actually succeeded.
 * Use for bulk actions so a partial failure is reported, not hidden.
 */
export async function runBulk(ids: string[], request: (id: string) => Promise<unknown>) {
  const results = await Promise.allSettled(ids.map(request));
  const failed = results.filter((r) => r.status === "rejected").length;
  return { succeeded: ids.length - failed, failed };
}

export function describeBulk(verb: string, succeeded: number, failed: number) {
  const noun = (n: number) => `${n} item${n !== 1 ? "s" : ""}`;
  return failed === 0
    ? `${verb} ${noun(succeeded)}`
    : `${verb} ${succeeded}, but ${noun(failed)} failed`;
}
