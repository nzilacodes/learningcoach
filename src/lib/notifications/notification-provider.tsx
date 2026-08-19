import { createContext, useCallback, useContext, useRef, type ReactNode } from "react";
import { toast as sonnerToast } from "sonner";
import { useLocale } from "@/lib/i18n";
import {
  normalizeApiError,
  getErrorAction,
  type NormalizedError,
} from "@/lib/errors/normalize-api-error";

export type NotifyType = "success" | "error" | "warning" | "info" | "loading" | "neutral";

export type NotifyAction = { label: string; onClick: () => void };

export type NotifyInput = {
  title: string;
  description?: string;
  /** Milliseconds, or "persistent" to require manual dismissal. Defaults by priority. */
  duration?: number | "persistent";
  action?: NotifyAction;
  /** Same dedupeKey → same toast updated in place instead of stacking a duplicate
   * (sonner replaces same-id toasts). Repeats bump a visible "(N×)" counter. */
  dedupeKey?: string;
  priority?: "low" | "normal" | "high";
  /** No toast is shown — for fire-and-forget background operations (XP awards, etc). */
  silent?: boolean;
};

type LoadingHandle = {
  update: (next: {
    type: Exclude<NotifyType, "loading" | "neutral">;
    title: string;
    description?: string;
  }) => void;
  dismiss: () => void;
};

type FromErrorOptions = {
  dedupeKey?: string;
  onRetry?: () => void;
  onUpgrade?: () => void;
  onReauth?: () => void;
  silent?: boolean;
};

type NotificationCtx = {
  notify: (type: NotifyType, input: NotifyInput) => string;
  success: (title: string, opts?: Omit<NotifyInput, "title">) => string;
  error: (title: string, opts?: Omit<NotifyInput, "title">) => string;
  warning: (title: string, opts?: Omit<NotifyInput, "title">) => string;
  info: (title: string, opts?: Omit<NotifyInput, "title">) => string;
  loading: (title: string, opts?: Omit<NotifyInput, "title">) => LoadingHandle;
  /** Normalizes a caught error, fires the toast in one call, and returns the
   * normalized result so callers can also render inline feedback with it. */
  fromError: (error: unknown, opts?: FromErrorOptions) => NormalizedError;
};

const Ctx = createContext<NotificationCtx | null>(null);

const PRIORITY_DURATION: Record<NonNullable<NotifyInput["priority"]>, number> = {
  low: 3000,
  normal: 4500,
  high: 7000,
};

function fireToast(
  type: NotifyType,
  id: string,
  opts: { title: string; description?: string; duration: number; action?: NotifyAction },
) {
  const options = {
    id,
    description: opts.description,
    duration: opts.duration,
    action: opts.action,
  };
  switch (type) {
    case "success":
      sonnerToast.success(opts.title, options);
      break;
    case "error":
      sonnerToast.error(opts.title, options);
      break;
    case "warning":
      sonnerToast.warning(opts.title, options);
      break;
    case "info":
      sonnerToast.info(opts.title, options);
      break;
    case "loading":
      sonnerToast.loading(opts.title, options);
      break;
    default:
      sonnerToast(opts.title, options);
  }
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { locale } = useLocale();
  // Counts repeats within the current session so an identical error firing
  // 5-10 times in a row (e.g. rapid "Tentar novamente" clicks) shows one
  // updated toast with a counter instead of stacking duplicates.
  const repeatCounts = useRef(new Map<string, number>());

  const notify = useCallback((type: NotifyType, input: NotifyInput): string => {
    const id = input.dedupeKey ?? `${type}:${input.title}`;
    if (input.silent) return id;

    const count = (repeatCounts.current.get(id) ?? 0) + 1;
    repeatCounts.current.set(id, count);
    const description =
      count > 1 && input.description ? `${input.description} (${count}×)` : input.description;
    const duration =
      input.duration === "persistent"
        ? Infinity
        : (input.duration ?? PRIORITY_DURATION[input.priority ?? "normal"]);

    fireToast(type, id, { title: input.title, description, duration, action: input.action });
    return id;
  }, []);

  const success = useCallback(
    (title: string, opts: Omit<NotifyInput, "title"> = {}) => notify("success", { title, ...opts }),
    [notify],
  );
  const error = useCallback(
    (title: string, opts: Omit<NotifyInput, "title"> = {}) => notify("error", { title, ...opts }),
    [notify],
  );
  const warning = useCallback(
    (title: string, opts: Omit<NotifyInput, "title"> = {}) => notify("warning", { title, ...opts }),
    [notify],
  );
  const info = useCallback(
    (title: string, opts: Omit<NotifyInput, "title"> = {}) => notify("info", { title, ...opts }),
    [notify],
  );

  const loading = useCallback(
    (title: string, opts: Omit<NotifyInput, "title"> = {}): LoadingHandle => {
      const id = opts.dedupeKey ?? `loading:${title}`;
      fireToast("loading", id, { title, description: opts.description, duration: Infinity });
      return {
        update: (next) =>
          fireToast(next.type, id, {
            title: next.title,
            description: next.description,
            duration: PRIORITY_DURATION.normal,
          }),
        dismiss: () => sonnerToast.dismiss(id),
      };
    },
    [],
  );

  const fromError = useCallback(
    (err: unknown, opts: FromErrorOptions = {}): NormalizedError => {
      const normalized = normalizeApiError(err, locale);
      const action = getErrorAction(normalized, opts);
      notify(normalized.severity, {
        title: normalized.title,
        description: normalized.description,
        dedupeKey: opts.dedupeKey,
        action,
        silent: opts.silent,
      });
      return normalized;
    },
    [notify, locale],
  );

  return (
    <Ctx.Provider value={{ notify, success, error, warning, info, loading, fromError }}>
      {children}
    </Ctx.Provider>
  );
}

export function useNotification(): NotificationCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useNotification must be used within a NotificationProvider");
  return ctx;
}
