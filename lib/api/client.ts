/**
 * Thin fetch wrapper used by every hook and mutation.
 * Throws an ApiError carrying the server's message so callers can show it.
 */
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body && typeof init.body === "string" ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  let data: any = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const message =
      (data && typeof data.error === "string" && data.error) ||
      `Request failed (${response.status})`;
    throw new ApiError(message, response.status);
  }

  return data as T;
}

/** Default SWR fetcher: GET a JSON endpoint. */
export const jsonFetcher = <T,>(url: string) => apiFetch<T>(url);
