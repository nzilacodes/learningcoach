import { useMutation } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import { useNotification } from "@/lib/notifications/notification-provider";
import { Button } from "@/components/ui/button";
import { ExerciseStatusBadge, type AdminExercise, type ContentStatus } from "./exercise-shared";
import { ExerciseRow } from "./exercise-rows/mcq-row";
import { FillBlankExerciseRow } from "./exercise-rows/fill-blank-row";
import { OrderingExerciseRow } from "./exercise-rows/ordering-row";
import { MatchingExerciseRow } from "./exercise-rows/matching-row";

// Fallback for exercise types with no structured editor here yet (writing/
// speaking — the AI pipeline doesn't generate these as standalone exercises
// today, only mcq/fill_blank/ordering/matching, which all have dedicated
// forms below). Read-only preview + status/delete, so nothing ships blind.
function NonMcqExercisePreview({
  exercise,
  onDeleted,
  onStatusChange,
}: {
  exercise: AdminExercise;
  onDeleted: () => void;
  onStatusChange: (status: ContentStatus) => void;
}) {
  return (
    <div className="space-y-2 rounded-xl border border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full bg-muted px-2 py-0.5 text-2xs font-semibold uppercase text-muted-foreground">
          {exercise.type}
        </span>
        <ExerciseStatusBadge exercise={exercise} onStatusChange={onStatusChange} />
      </div>
      <p className="text-sm font-medium">{exercise.prompt}</p>
      <pre className="max-h-40 overflow-auto rounded-lg bg-muted p-2 text-2xs">
        {JSON.stringify({ data: exercise.data, correct_answer: exercise.correct_answer }, null, 2)}
      </pre>
      <Button type="button" size="sm" variant="outline" onClick={onDeleted}>
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export function ExerciseEditor({
  lessonId,
  exercises,
  statusFilter,
  onStatusFilterChange,
  onChanged,
}: {
  lessonId: string;
  exercises: AdminExercise[];
  statusFilter: ContentStatus | "";
  onStatusFilterChange: (v: ContentStatus | "") => void;
  onChanged: () => void;
}) {
  const notify = useNotification();
  const addExercise = useMutation({
    mutationFn: () =>
      apiFetch(`/v1/admin/lessons/${lessonId}/exercises`, {
        method: "POST",
        body: JSON.stringify({
          type: "mcq",
          prompt: "Nova pergunta",
          data: { options: ["Opção A", "Opção B", "Opção C", "Opção D"] },
          correctAnswer: { index: 0 },
          xpReward: 5,
          orderIndex: exercises.length,
        }),
      }),
    onSuccess: onChanged,
    onError: (e) => notify.fromError(e, { dedupeKey: "admin:add-exercise" }),
  });

  // Only meaningful when the lesson has zero exercises of any status yet —
  // the pipeline never generates a second batch on top of an existing one
  // (see generate-lesson-content.ts's idempotency check).
  const generateExercises = useMutation({
    mutationFn: () =>
      apiFetch(`/v1/admin/lessons/${lessonId}/generate-exercises`, { method: "POST" }),
    onSuccess: (result: unknown) => {
      const r = result as { status: string; count?: number; reason?: string };
      if (r.status === "generated") {
        notify.success(`${r.count ?? 0} exercícios gerados como rascunho — revê e publica abaixo.`);
      } else if (r.status === "skipped") {
        notify.info("Esta lição já tem exercícios — geração ignorada.");
      } else {
        notify.error(`Geração falhou: ${r.reason ?? "erro desconhecido"}`);
      }
      onChanged();
    },
    onError: (e) => notify.fromError(e, { dedupeKey: "admin:generate-exercises" }),
  });

  const deleteExercise = useMutation({
    mutationFn: (id: string) => apiFetch(`/v1/admin/exercises/${id}`, { method: "DELETE" }),
    onSuccess: onChanged,
    onError: (e) => notify.fromError(e, { dedupeKey: "admin:delete-exercise" }),
  });

  const publishAll = useMutation({
    mutationFn: () =>
      apiFetch<{ published: number }>(`/v1/admin/lessons/${lessonId}/exercises/publish-all`, {
        method: "POST",
      }),
    onSuccess: (r) => {
      notify.success(
        r.published > 0 ? `${r.published} exercícios publicados.` : "Nada por publicar.",
      );
      onChanged();
    },
    onError: (e) => notify.fromError(e, { dedupeKey: "admin:publish-all" }),
  });
  const pendingInLesson = exercises.filter((e) => e.content_status !== "published").length;

  const updateStatus = useMutation({
    mutationFn: ({ id, contentStatus }: { id: string; contentStatus: ContentStatus }) =>
      apiFetch(`/v1/admin/exercises/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ contentStatus }),
      }),
    onSuccess: onChanged,
    onError: (e) => notify.fromError(e, { dedupeKey: "admin:update-exercise-status" }),
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-bold">Exercícios — {exercises.length}</h4>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as ContentStatus | "")}
            className="rounded-lg border border-border bg-background px-2 py-1 text-xs"
          >
            <option value="">Todos os estados</option>
            <option value="draft">Rascunho</option>
            <option value="in_review">Em revisão</option>
            <option value="published">Publicado</option>
          </select>
          <Button
            size="sm"
            variant="outline"
            onClick={() => generateExercises.mutate()}
            disabled={generateExercises.isPending}
            title="Gera exercícios com IA (rascunho — precisa de revisão antes de publicar)"
          >
            {generateExercises.isPending ? "A gerar..." : "Gerar com IA"}
          </Button>
          {pendingInLesson > 0 && (
            <Button
              size="sm"
              onClick={() => {
                if (
                  !window.confirm(
                    `Publicar ${pendingInLesson} exercício(s) desta lição? Ficam visíveis aos alunos imediatamente.`,
                  )
                )
                  return;
                publishAll.mutate();
              }}
              disabled={publishAll.isPending}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {publishAll.isPending ? "A publicar..." : `Publicar todos (${pendingInLesson})`}
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => addExercise.mutate()}
            disabled={addExercise.isPending}
          >
            <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar
          </Button>
        </div>
      </div>
      {exercises.map((ex) => {
        const onDeleted = () => {
          if (
            !window.confirm(
              "Apagar este exercício definitivamente? Esta ação não pode ser revertida.",
            )
          )
            return;
          deleteExercise.mutate(ex.id);
        };
        const onStatusChange = (contentStatus: ContentStatus) =>
          updateStatus.mutate({ id: ex.id, contentStatus });

        // Genuinely different components per type (never a conditional
        // return inside one shared component) — each row's form hooks
        // (useForm/useEffect/useMutation) must never be reachable behind a
        // branch, or React's hooks rules break the moment two exercises of
        // different types render side by side.
        const rowProps = {
          key: ex.id,
          exercise: ex,
          onDeleted,
          onStatusChange,
          onSaved: onChanged,
        };
        switch (ex.type) {
          case "mcq":
            return <ExerciseRow {...rowProps} />;
          case "fill_blank":
            return <FillBlankExerciseRow {...rowProps} />;
          case "ordering":
            return <OrderingExerciseRow {...rowProps} />;
          case "matching":
            return <MatchingExerciseRow {...rowProps} />;
          default:
            return (
              <NonMcqExercisePreview
                key={ex.id}
                exercise={ex}
                onDeleted={onDeleted}
                onStatusChange={onStatusChange}
              />
            );
        }
      })}
      {exercises.length === 0 && (
        <p className="text-xs text-muted-foreground">Sem exercícios nesta lição.</p>
      )}
    </div>
  );
}
