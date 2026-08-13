import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ApiError, API_BASE_URL } from "@/lib/api/client";

export type MediaType = "video" | "audio" | "image" | "document";
export type MediaStatus = "uploading" | "processing" | "ready" | "failed";
export type MediaVisibility = "private" | "class" | "public";

export type MediaAsset = {
  id: string;
  owner_id: string;
  media_type: MediaType;
  mime_type: string;
  original_filename: string;
  storage_key: string;
  thumbnail_storage_key: string | null;
  size_bytes: string;
  duration_seconds: string | null;
  width: number | null;
  height: number | null;
  status: MediaStatus;
  processing_error: string | null;
  title: string | null;
  tags: string[];
  visibility: MediaVisibility;
  class_id: string | null;
  course_id: string | null;
  unit_id: string | null;
  lesson_id: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type MediaListResponse = { items: MediaAsset[]; nextCursor: string | null };

export type StorageSummary = {
  byType: Array<{ media_type: MediaType; count: string; total_bytes: string }>;
  processing: number;
  trashed: number;
};

export function mediaStreamUrl(id: string): string {
  return `${API_BASE_URL}/v1/media/${id}/stream`;
}
export function mediaThumbnailUrl(id: string): string {
  return `${API_BASE_URL}/v1/media/${id}/thumbnail`;
}

export function formatBytes(bytes: number | string | null | undefined): string {
  const n = Number(bytes ?? 0);
  if (!Number.isFinite(n) || n <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(n) / Math.log(1024)));
  return `${(n / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function formatDuration(seconds: number | string | null | undefined): string {
  const n = Number(seconds ?? 0);
  if (!Number.isFinite(n) || n <= 0) return "--:--";
  const total = Math.round(n);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

/**
 * Uploads via raw XMLHttpRequest instead of apiFetchFormData — fetch() has no
 * reliable cross-browser upload-progress event, and a multi-hundred-MB video
 * upload without a progress bar reads as broken. Replicates apiFetch's
 * cookie/CSRF handling by hand since it can't reuse the fetch-based helper.
 */
export function uploadMedia(
  file: Blob,
  opts: { filename?: string; onProgress?: (pct: number) => void } = {},
): Promise<MediaAsset> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file, opts.filename ?? (file instanceof File ? file.name : "upload"));

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE_URL}/v1/media/uploads`);
    xhr.withCredentials = true;
    const csrf = readCookie("csrf_token");
    if (csrf) xhr.setRequestHeader("X-CSRF-Token", csrf);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) opts.onProgress?.(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      let body: unknown;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        body = undefined;
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(body as MediaAsset);
        return;
      }
      const err = (
        body as {
          error?: { message?: string; code?: string; retryable?: boolean; request_id?: string };
        }
      )?.error;
      reject(
        new ApiError(
          err?.message ?? "Upload failed",
          xhr.status,
          (err?.code as never) ?? "UNKNOWN_ERROR",
          Boolean(err?.retryable),
          err?.request_id,
        ),
      );
    };
    xhr.onerror = () => reject(new ApiError("Network request failed", 0, "NETWORK_ERROR", true));
    xhr.send(form);
  });
}

export type MediaListFilters = {
  type?: MediaType;
  search?: string;
  tag?: string;
  courseId?: string;
  unitId?: string;
  lessonId?: string;
  trashed?: boolean;
};

function buildListQuery(filters: MediaListFilters, cursor?: string): string {
  const params = new URLSearchParams();
  if (filters.type) params.set("type", filters.type);
  if (filters.search) params.set("search", filters.search);
  if (filters.tag) params.set("tag", filters.tag);
  if (filters.courseId) params.set("courseId", filters.courseId);
  if (filters.unitId) params.set("unitId", filters.unitId);
  if (filters.lessonId) params.set("lessonId", filters.lessonId);
  if (filters.trashed) params.set("trashed", "true");
  if (cursor) params.set("cursor", cursor);
  return params.toString();
}

export function useMediaList(filters: MediaListFilters = {}) {
  return useInfiniteQuery({
    queryKey: ["media", "list", filters],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      apiFetch<MediaListResponse>(`/v1/media?${buildListQuery(filters, pageParam)}`),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useMediaAsset(id: string | undefined) {
  return useQuery({
    queryKey: ["media", "asset", id],
    enabled: !!id,
    queryFn: () => apiFetch<MediaAsset>(`/v1/media/${id}`),
  });
}

export function useStorageSummary() {
  return useQuery({
    queryKey: ["media", "storage-summary"],
    queryFn: () => apiFetch<StorageSummary>("/v1/media/storage-summary"),
  });
}

export type MediaUpdateInput = {
  title?: string | null;
  tags?: string[];
  visibility?: MediaVisibility;
  classId?: string | null;
  courseId?: string | null;
  unitId?: string | null;
  lessonId?: string | null;
};

export function useUpdateMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: MediaUpdateInput }) =>
      apiFetch<MediaAsset>(`/v1/media/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    onSuccess: (asset) => {
      void qc.invalidateQueries({ queryKey: ["media", "list"] });
      void qc.invalidateQueries({ queryKey: ["media", "storage-summary"] });
      qc.setQueryData(["media", "asset", asset.id], asset);
    },
  });
}

export function useDeleteMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/v1/media/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["media"] });
    },
  });
}

export function useRestoreMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<MediaAsset>(`/v1/media/${id}/restore`, { method: "POST" }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["media"] });
    },
  });
}

export function usePurgeMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/v1/media/${id}/permanent`, { method: "DELETE" }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["media"] });
    },
  });
}
