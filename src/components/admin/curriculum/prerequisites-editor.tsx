import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GitBranch, X } from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import { useNotification } from "@/lib/notifications/notification-provider";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import type { CourseRow, UnitRow, LessonRow } from "@/lib/learning";

type PrerequisiteRow = { requires_lesson_id: string; title: string; slug: string };

/**
 * Section 9 of the architecture doc — a lesson can require any number of
 * other lessons be completed first, so advanced content never surfaces as a
 * top recommendation before the fundamentals are in place (see
 * admin/service.ts's getStudentRecommendation, which currently reads
 * mastery/difficulty but not this table yet — prerequisite-aware ordering
 * is a natural next step once there's real prerequisite data to act on).
 */
export function PrerequisitesEditor({ lessonId }: { lessonId: string }) {
  const qc = useQueryClient();
  const notify = useNotification();
  const [selected, setSelected] = useState("");

  const { data: prerequisites = [] } = useQuery({
    queryKey: ["admin_lesson_prerequisites", lessonId],
    queryFn: () => apiFetch<PrerequisiteRow[]>(`/v1/admin/lessons/${lessonId}/prerequisites`),
  });

  // Shares the QueryClient cache with curriculum-panel.tsx's own fetch (same
  // key) — no extra network request when that panel is already mounted,
  // which it always is here (LessonEditor only renders inside it).
  const { data: curriculum } = useQuery({
    queryKey: ["curriculum_admin"],
    queryFn: () =>
      apiFetch<{ courses: CourseRow[]; units: UnitRow[]; lessons: LessonRow[] }>(
        "/v1/admin/curriculum",
      ),
    staleTime: 60_000,
  });

  const candidateLessons = (curriculum?.lessons ?? [])
    .filter((l) => l.id !== lessonId && !prerequisites.some((p) => p.requires_lesson_id === l.id))
    .sort((a, b) => a.title.localeCompare(b.title));

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["admin_lesson_prerequisites", lessonId] });

  const add = useMutation({
    mutationFn: (requiresLessonId: string) =>
      apiFetch(`/v1/admin/lessons/${lessonId}/prerequisites`, {
        method: "POST",
        body: JSON.stringify({ requiresLessonId }),
      }),
    onSuccess: () => {
      invalidate();
      setSelected("");
    },
    onError: (e) => notify.fromError(e, { dedupeKey: "admin:add-prerequisite" }),
  });

  const remove = useMutation({
    mutationFn: (requiresLessonId: string) =>
      apiFetch(`/v1/admin/lessons/${lessonId}/prerequisites/${requiresLessonId}`, {
        method: "DELETE",
      }),
    onSuccess: invalidate,
    onError: (e) => notify.fromError(e, { dedupeKey: "admin:remove-prerequisite" }),
  });

  return (
    <div className="space-y-3">
      <h4 className="flex items-center gap-2 text-sm font-bold">
        <GitBranch className="h-4 w-4 text-violet" /> Pré-requisitos
      </h4>
      <p className="text-xs text-muted-foreground">
        Lições que um aluno deve completar antes desta ser recomendada.
      </p>
      <div className="flex flex-wrap gap-2">
        {prerequisites.map((p) => (
          <span
            key={p.requires_lesson_id}
            className="flex items-center gap-1.5 rounded-full bg-violet/10 py-1 pl-3 pr-1.5 text-xs font-semibold text-violet"
          >
            {p.title}
            <button
              type="button"
              onClick={() => remove.mutate(p.requires_lesson_id)}
              className="rounded-full p-0.5 hover:bg-violet/20"
              aria-label="Remover pré-requisito"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {prerequisites.length === 0 && (
          <span className="text-xs text-muted-foreground">Nenhum ainda.</span>
        )}
      </div>
      <div className="flex gap-2">
        <Select value={selected} onValueChange={setSelected}>
          <SelectTrigger className="text-xs">
            <SelectValue placeholder="Adicionar lição como pré-requisito…" />
          </SelectTrigger>
          <SelectContent>
            {candidateLessons.map((l) => (
              <SelectItem key={l.id} value={l.id}>
                {l.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          size="sm"
          disabled={!selected || add.isPending}
          onClick={() => selected && add.mutate(selected)}
        >
          Adicionar
        </Button>
      </div>
    </div>
  );
}
