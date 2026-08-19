import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type StagedLoaderProps = {
  stages: string[];
  status: "running" | "done" | "failed";
  /** Controlled stage index (0-based). Omit to auto-advance on a timer. */
  currentStage?: number;
  /** Per-step delays in ms before advancing to the next stage — uncontrolled mode only. */
  autoAdvanceMs?: number[];
  failedLabel?: string;
  className?: string;
};

const DEFAULT_AUTO_ADVANCE_MS = [1500, 6000];

/**
 * Multi-stage progress indicator for long AI operations (diagnostic grading,
 * chat send, pronunciation scoring) — replaces a single generic spinner with
 * captions like "Preparando análise..." → "Analisando respostas...".
 *
 * Two modes:
 *  - controlled: pass `currentStage` when there are real sequential steps
 *    (e.g. transcribe → assess) — the indicator reflects actual state.
 *  - uncontrolled: omit `currentStage` for single-shot calls with no real
 *    progress channel (no SSE/WebSocket exists) — stages advance on a
 *    client-side timer tuned to observed latency, then hold on the last
 *    stage until `status` resolves. Explicitly cosmetic pacing, not real
 *    progress.
 */
export function StagedLoader({
  stages,
  status,
  currentStage,
  autoAdvanceMs,
  failedLabel,
  className,
}: StagedLoaderProps) {
  const isControlled = currentStage !== undefined;
  const [autoStage, setAutoStage] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (isControlled) return;
    setAutoStage(0);
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (status !== "running") return;

    const delays = autoAdvanceMs ?? DEFAULT_AUTO_ADVANCE_MS;
    let elapsed = 0;
    for (let i = 0; i < delays.length; i++) {
      elapsed += delays[i]!;
      const stageIndex = Math.min(i + 1, stages.length - 1);
      timers.current.push(setTimeout(() => setAutoStage(stageIndex), elapsed));
    }

    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
    // Re-arms whenever a fresh "running" pass starts; stages/autoAdvanceMs are
    // treated as static per call site, not reactive inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, isControlled]);

  const activeIndex = Math.min(isControlled ? currentStage! : autoStage, stages.length - 1);
  const label =
    status === "failed" ? (failedLabel ?? "Não foi possível concluir") : stages[activeIndex];

  return (
    <div className={cn("flex flex-col items-center gap-3 text-center", className)}>
      <div className="flex items-center gap-2">
        {status === "failed" ? (
          <XCircle className="size-5 text-destructive" />
        ) : status === "done" ? (
          <CheckCircle2 className="size-5 text-primary" />
        ) : (
          <Loader2 className="size-5 animate-spin text-primary" />
        )}
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
      {status === "running" && stages.length > 1 && (
        <div className="flex gap-1.5">
          {stages.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 w-6 rounded-full transition-colors",
                i <= activeIndex ? "bg-primary" : "bg-muted",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
