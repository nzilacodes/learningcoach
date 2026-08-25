import { Trophy, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export type LessonAttemptResult = {
  score: number;
  passed: boolean;
  correctCount: number;
  totalCount: number;
  heartsRemaining: number | null;
  xpAwarded: number;
  alreadyCompleted: boolean;
};

/** Shown after POST /lessons/:id/submit resolves — replaces the old cosmetic
 * per-option highlight with the server's actual graded verdict. */
export function LessonResultBanner({
  result,
  minPassScore,
  onRetry,
  retrying,
  locale,
}: {
  result: LessonAttemptResult;
  minPassScore: number;
  onRetry: () => void;
  retrying: boolean;
  locale: "pt" | "en";
}) {
  if (result.passed) {
    return (
      <div className="rounded-2xl bg-gradient-aurora p-5 text-white flex items-center gap-3">
        <Trophy className="h-6 w-6 shrink-0" />
        <div>
          <div className="font-bold">
            {locale === "pt"
              ? `Lição aprovada — ${result.score}%`
              : `Lesson passed — ${result.score}%`}
          </div>
          <div className="text-sm text-white/80">
            {result.alreadyCompleted
              ? locale === "pt"
                ? `${result.correctCount}/${result.totalCount} corretas`
                : `${result.correctCount}/${result.totalCount} correct`
              : `+${result.xpAwarded} XP · ${result.correctCount}/${result.totalCount} ${locale === "pt" ? "corretas" : "correct"}`}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-destructive/30 bg-destructive/5 p-5">
      <div className="font-bold text-destructive">
        {locale === "pt"
          ? `Ainda não chegaste à nota mínima (${result.score}% de ${minPassScore}%)`
          : `You haven't reached the pass score yet (${result.score}% of ${minPassScore}%)`}
      </div>
      <div className="mt-1 text-sm text-muted-foreground">
        {result.correctCount}/{result.totalCount} {locale === "pt" ? "corretas" : "correct"}
        {result.heartsRemaining !== null
          ? ` · ${result.heartsRemaining} ${locale === "pt" ? "corações restantes" : "hearts left"}`
          : ""}
      </div>
      <Button
        onClick={onRetry}
        disabled={retrying || result.heartsRemaining === 0}
        variant="outline"
        className="mt-3"
      >
        <RotateCcw className="mr-1.5 h-4 w-4" />
        {result.heartsRemaining === 0
          ? locale === "pt"
            ? "Sem corações"
            : "Out of hearts"
          : locale === "pt"
            ? "Tentar novamente"
            : "Try again"}
      </Button>
    </div>
  );
}
