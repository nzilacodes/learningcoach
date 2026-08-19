import { ApiError, type ErrorCode } from "@/lib/api/client";
import type { Locale } from "@/lib/i18n";
import { ErrorCodeMap, type ErrorAction, type ErrorSeverity } from "./error-code-map";

export type NormalizedError = {
  code: ErrorCode;
  title: string;
  description: string;
  retryable: boolean;
  action: ErrorAction;
  severity: ErrorSeverity;
  requestId?: string;
  /** Field paths (e.g. "email") the backend rejected, for forms that want to
   * highlight the specific input — never the backend's raw per-field message,
   * which stays out of the UI per this file's one-function rule below. */
  fieldPaths?: string[];
};

/**
 * The one and only function allowed to turn a caught error into user-facing
 * text anywhere in the app. Never render `error.message`/`e.message` directly
 * — it may be (or may become, if the backend ever regresses) a raw upstream
 * string. See src/lib/errors/error-code-map.ts for the copy this reads.
 */
export function normalizeApiError(error: unknown, locale: Locale = "pt"): NormalizedError {
  // eslint-disable-next-line no-console -- internal-only diagnostic, never rendered
  console.error(error);

  const code: ErrorCode = error instanceof ApiError ? error.code : "UNKNOWN_ERROR";
  const entry = ErrorCodeMap[code] ?? ErrorCodeMap.UNKNOWN_ERROR;
  const fieldPaths =
    error instanceof ApiError && error.fields?.length
      ? [...new Set(error.fields.map((f) => f.path))]
      : undefined;

  // Field paths are safe identifiers (e.g. "email"), not free text, so
  // naming them here doesn't reintroduce raw backend copy into the UI —
  // only entry.description (pre-approved, localized) is ever shown otherwise.
  const description = fieldPaths?.length
    ? `${entry.description[locale]} (${fieldPaths.join(", ")})`
    : entry.description[locale];

  return {
    code,
    title: entry.title[locale],
    description,
    retryable: error instanceof ApiError ? error.retryable : entry.retryable,
    action: entry.action,
    severity: entry.severity,
    requestId: error instanceof ApiError ? error.requestId : undefined,
    fieldPaths,
  };
}

/** Shared "upgrade" CTA for PAYMENT_REQUIRED-shaped errors — consolidates the
 * 402-handling that used to be independently duplicated in word-card.tsx,
 * certificates.tsx and lesson.$lessonId.tsx. */
export function getErrorAction(
  normalized: NormalizedError,
  handlers: { onRetry?: () => void; onUpgrade?: () => void; onReauth?: () => void },
): { label: string; onClick: () => void } | undefined {
  if (normalized.action === "upgrade" && handlers.onUpgrade) {
    return { label: "Ver planos", onClick: handlers.onUpgrade };
  }
  if (normalized.action === "reauth" && handlers.onReauth) {
    return { label: "Entrar", onClick: handlers.onReauth };
  }
  if (normalized.action === "retry" && handlers.onRetry) {
    return { label: "Tentar novamente", onClick: handlers.onRetry };
  }
  return undefined;
}
