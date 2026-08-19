import { AlertCircle, AlertTriangle, Info, type LucideIcon } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import type { NormalizedError } from "@/lib/errors/normalize-api-error";
import type { ErrorSeverity } from "@/lib/errors/error-code-map";

type InlineStatusProps = {
  title: string;
  description?: string;
  severity?: ErrorSeverity;
  action?: { label: string; onClick: () => void };
  className?: string;
};

const SEVERITY_ICON: Record<ErrorSeverity, LucideIcon> = {
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

function renderAction(action?: { label: string; onClick: () => void }) {
  if (!action) return null;
  return (
    <button
      type="button"
      onClick={action.onClick}
      className="mt-2 block text-sm font-medium underline underline-offset-2 hover:no-underline"
    >
      {action.label}
    </button>
  );
}

/**
 * Component-scoped error/status feedback — for cases where a toast would
 * disappear and the user could lose track of what happened (e.g. a word
 * analysis field, the Placement Test evaluation status). Wraps the existing,
 * previously-unused Alert primitive rather than a bespoke destructive box.
 */
export function InlineStatus({
  title,
  description,
  severity = "error",
  action,
  className,
}: InlineStatusProps) {
  const Icon = SEVERITY_ICON[severity];
  return (
    <Alert variant={severity === "error" ? "destructive" : "default"} className={className}>
      <Icon className="size-4" />
      <AlertTitle>{title}</AlertTitle>
      {description && <AlertDescription>{description}</AlertDescription>}
      {renderAction(action)}
    </Alert>
  );
}

/** Convenience wrapper for the common case of rendering a normalizeApiError() result directly. */
export function InlineStatusFromError({
  error,
  action,
  className,
}: {
  error: NormalizedError;
  action?: { label: string; onClick: () => void };
  className?: string;
}) {
  return (
    <InlineStatus
      title={error.title}
      description={error.description}
      severity={error.severity}
      action={action}
      className={className}
    />
  );
}

/** Full-width, non-dismissible variant for area-wide degradation notices. */
export function Banner({
  title,
  description,
  severity = "warning",
  action,
  className,
}: InlineStatusProps) {
  const Icon = SEVERITY_ICON[severity];
  return (
    <Alert
      variant={severity === "error" ? "destructive" : "default"}
      className={cn("w-full rounded-none border-x-0", className)}
    >
      <Icon className="size-4" />
      <AlertTitle>{title}</AlertTitle>
      {description && <AlertDescription>{description}</AlertDescription>}
      {renderAction(action)}
    </Alert>
  );
}
