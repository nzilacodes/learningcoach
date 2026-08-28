export type ContentStatus = "draft" | "in_review" | "published";

export type AdminExercise = {
  id: string;
  type: string;
  prompt: string;
  data: {
    options?: string[];
    items?: string[];
    leftItems?: string[];
    rightItems?: string[];
  } | null;
  correct_answer: {
    index?: number;
    answers?: string[];
    order?: number[];
    pairs?: { left: number; right: number }[];
  } | null;
  xp_reward: number;
  content_status: ContentStatus;
  generated_by: string | null;
};

export const STATUS_LABEL: Record<ContentStatus, string> = {
  draft: "Rascunho",
  in_review: "Em revisão",
  published: "Publicado",
};

export function ExerciseStatusBadge({
  exercise,
  onStatusChange,
}: {
  exercise: AdminExercise;
  onStatusChange: (status: ContentStatus) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      {exercise.generated_by && (
        <span className="rounded-full bg-violet/10 px-2 py-0.5 text-2xs font-semibold text-violet">
          IA
        </span>
      )}
      <select
        value={exercise.content_status}
        onChange={(e) => onStatusChange(e.target.value as ContentStatus)}
        className={`rounded-full border px-2 py-0.5 text-2xs font-semibold ${
          exercise.content_status === "published"
            ? "border-emerald-300 bg-emerald-50 text-emerald-700"
            : exercise.content_status === "in_review"
              ? "border-amber-300 bg-amber-50 text-amber-700"
              : "border-border bg-muted text-muted-foreground"
        }`}
      >
        <option value="draft">{STATUS_LABEL.draft}</option>
        <option value="in_review">{STATUS_LABEL.in_review}</option>
        <option value="published">{STATUS_LABEL.published}</option>
      </select>
    </div>
  );
}
