// import.meta.env for the browser bundle; process.env fallback for SSR (loaders run in Node).
const API_BASE_URL = import.meta.env.VITE_API_URL || process.env.VITE_API_URL || "http://localhost:8787";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

function csrfHeaders(method: string | undefined): HeadersInit {
  if (!method || !MUTATING_METHODS.has(method.toUpperCase())) return {};
  const token = readCookie("csrf_token");
  return token ? { "X-CSRF-Token": token } : {};
}

async function parseErrorBody(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body.detail || body.title || res.statusText;
  } catch {
    return res.statusText;
  }
}

let refreshInFlight: Promise<boolean> | null = null;

/** Calls the refresh endpoint at most once concurrently; returns whether it succeeded. */
function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = fetch(`${API_BASE_URL}/v1/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: csrfHeaders("POST"),
    })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

/** JSON request/response helper for the learningcoachbackEnd API. Session lives in
 * HttpOnly cookies (set by the backend), so there's no token to attach here —
 * just credentials + a CSRF header on mutating requests. */
export async function apiFetch<T>(path: string, init: RequestInit = {}, _retried = false): Promise<T> {
  const headers = { "Content-Type": "application/json", ...csrfHeaders(init.method), ...(init.headers ?? {}) };
  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, credentials: "include", headers });

  if (res.status === 401 && !_retried && !path.startsWith("/v1/auth/")) {
    const refreshed = await refreshSession();
    if (refreshed) return apiFetch<T>(path, init, true);
  }

  if (!res.ok) throw new ApiError(await parseErrorBody(res), res.status);
  if (res.status === 204) return undefined as T;
  const contentType = res.headers.get("content-type") ?? "";
  return contentType.includes("application/json") ? ((await res.json()) as T) : ((await res.blob()) as unknown as T);
}

/** multipart/form-data helper (audio uploads) — do not set Content-Type, fetch sets the boundary. */
export async function apiFetchFormData<T>(path: string, formData: FormData, _retried = false): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers: csrfHeaders("POST"),
    body: formData,
  });

  if (res.status === 401 && !_retried) {
    const refreshed = await refreshSession();
    if (refreshed) return apiFetchFormData<T>(path, formData, true);
  }

  if (!res.ok) throw new ApiError(await parseErrorBody(res), res.status);
  return res.json() as Promise<T>;
}
