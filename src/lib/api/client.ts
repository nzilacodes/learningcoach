// import.meta.env for the browser bundle; process.env fallback for SSR (loaders run in Node).
// Exported for callers that need to build a raw resource URL outside apiFetch
// (e.g. a <video src>/<img src> the browser fetches on its own — see lib/media.ts).
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || process.env.VITE_API_URL || "http://localhost:8787";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// Mirrors learningcoachbackEnd's src/lib/errors.ts ErrorCode (minus NETWORK_ERROR,
// which only the frontend ever produces — a fetch-level failure, not a backend response).
export type ErrorCode =
  | "VALIDATION_ERROR"
  | "AUTH_SESSION_EXPIRED"
  | "PERMISSION_DENIED"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "PAYMENT_REQUIRED"
  | "AI_SERVICE_UNAVAILABLE"
  | "AI_SERVICE_TIMEOUT"
  | "AI_SERVICE_LIMIT_REACHED"
  | "AI_EVALUATION_FAILED"
  | "AUDIO_NO_SPEECH_DETECTED"
  | "HEARTS_DEPLETED"
  | "NETWORK_ERROR"
  | "SERVER_ERROR"
  | "UNKNOWN_ERROR";

export class ApiError extends Error {
  status: number;
  code: ErrorCode;
  retryable: boolean;
  requestId?: string;
  fields?: Array<{ path: string; message: string }>;

  constructor(
    message: string,
    status: number,
    code: ErrorCode = "UNKNOWN_ERROR",
    retryable = false,
    requestId?: string,
    fields?: Array<{ path: string; message: string }>,
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.retryable = retryable;
    this.requestId = requestId;
    this.fields = fields;
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

/** Reads the backend's { success: false, error: {...} } envelope (see
 * learningcoachbackEnd's plugins/error-handler.ts). Falls back to UNKNOWN_ERROR
 * for any unexpected shape (e.g. a proxy's raw 502 HTML page) — that fallback
 * text is only ever used for logging, never as primary UI copy; see
 * lib/errors/normalize-api-error.ts, the one place allowed to turn this into
 * something the user sees. */
async function parseErrorEnvelope(res: Response): Promise<ApiError> {
  try {
    const body = await res.json();
    const err = body?.error;
    if (err && typeof err.code === "string" && typeof err.message === "string") {
      return new ApiError(
        err.message,
        res.status,
        err.code,
        Boolean(err.retryable),
        err.request_id,
        err.fields,
      );
    }
    return new ApiError(res.statusText || "Request failed", res.status, "UNKNOWN_ERROR");
  } catch {
    return new ApiError(res.statusText || "Request failed", res.status, "UNKNOWN_ERROR");
  }
}

// AuthProvider registers itself here so a 401 discovered by *any* apiFetch
// caller (a background admin-dashboard query, not just the central /v1/me
// refresh) can flip the shared `user` state to null — otherwise each query
// independently fails its own refresh attempt forever without OnboardingGate
// ever finding out the session is actually dead, leaving the page showing
// stale cached data while requests keep failing in the background.
let sessionExpiredListener: (() => void) | null = null;
export function onSessionExpired(listener: (() => void) | null) {
  sessionExpiredListener = listener;
}

let refreshInFlight: Promise<boolean> | null = null;

function doRefreshRequest(): Promise<boolean> {
  return fetch(`${API_BASE_URL}/v1/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: csrfHeaders("POST"),
  })
    .then((res) => res.ok)
    .catch(() => false);
}

/** Calls the refresh endpoint at most once concurrently *within this tab*
 * (refreshInFlight) — but refresh_token is single-use and rotated on every
 * call (see learningcoachbackEnd's auth/service.ts refresh()), so two
 * *tabs* racing to refresh the same still-shared cookie isn't handled by
 * that alone: the loser sends a token the winner already revoked and gets
 * a hard 401, even though the session itself is perfectly valid. Web Locks
 * serializes across tabs of the same origin — a waiting tab's own refresh
 * call only runs after the lock holder's has updated the shared cookie, so
 * it rotates the now-current token instead of a stale one. Falls back to
 * the plain request on browsers without navigator.locks. */
function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    const attempt: Promise<boolean> =
      typeof navigator !== "undefined" && navigator.locks
        ? Promise.resolve(
            navigator.locks.request<Promise<boolean>>("learningcoach-session-refresh", () =>
              doRefreshRequest(),
            ),
          )
        : doRefreshRequest();
    refreshInFlight = attempt
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null;
      });
  }

  return refreshInFlight;
}

/** Wraps fetch() itself failing (offline, DNS, CORS) as a NETWORK_ERROR ApiError
 * instead of letting a raw, browser-specific TypeError propagate uncontrolled. */
async function fetchOrNetworkError(input: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch {
    throw new ApiError("Network request failed", 0, "NETWORK_ERROR", true);
  }
}

/** JSON request/response helper for the learningcoachbackEnd API. Session lives in
 * HttpOnly cookies (set by the backend), so there's no token to attach here —
 * just credentials + a CSRF header on mutating requests. */
export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  _retried = false,
): Promise<T> {
  // Only claim a JSON content-type when there's actually a body to parse —
  // Fastify's JSON body parser throws FST_ERR_CTP_EMPTY_JSON_BODY on a
  // request with Content-Type: application/json and a zero-byte body (e.g.
  // every bodyless POST like /lessons/:id/complete or /auth/logout), which
  // isn't an AppError and so surfaced to users as a generic 500.
  const headers = {
    ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
    ...csrfHeaders(init.method),
    ...(init.headers ?? {}),
  };
  const res = await fetchOrNetworkError(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers,
  });

  if (res.status === 401 && !_retried && !path.startsWith("/v1/auth/")) {
    const refreshed = await refreshSession();
    if (refreshed) return apiFetch<T>(path, init, true);
  }

  if (!res.ok) {
    if (res.status === 401 && !path.startsWith("/v1/auth/")) sessionExpiredListener?.();
    throw await parseErrorEnvelope(res);
  }
  if (res.status === 204) return undefined as T;
  const contentType = res.headers.get("content-type") ?? "";
  return contentType.includes("application/json")
    ? ((await res.json()) as T)
    : ((await res.blob()) as unknown as T);
}

/** multipart/form-data helper (audio uploads) — do not set Content-Type, fetch sets the boundary. */
export async function apiFetchFormData<T>(
  path: string,
  formData: FormData,
  _retried = false,
): Promise<T> {
  const res = await fetchOrNetworkError(`${API_BASE_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers: csrfHeaders("POST"),
    body: formData,
  });

  if (res.status === 401 && !_retried) {
    const refreshed = await refreshSession();
    if (refreshed) return apiFetchFormData<T>(path, formData, true);
  }

  if (!res.ok) {
    if (res.status === 401) sessionExpiredListener?.();
    throw await parseErrorEnvelope(res);
  }
  return res.json() as Promise<T>;
}
