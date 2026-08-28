import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen } from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import type { CourseRow, UnitRow, LessonRow } from "@/lib/learning";
import { LessonEditor } from "./lesson-editor";

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

type ReviewSummaryRow = { lesson_id: string; draft: number; in_review: number; published: number };
/** Draft + in_review — anything not yet published, i.e. still needs eyes on it. */
const pendingCount = (r: ReviewSummaryRow | undefined) => (r ? r.draft + r.in_review : 0);

function ReviewCountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="ml-1.5 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-amber-100 px-1.5 py-0.5 text-2xs font-bold text-amber-700">
      {count}
    </span>
  );
}

export function CurriculumPanel() {
  const { user, isAdmin } = useAuth();
  const [level, setLevel] = useState("A1");
  const [unitId, setUnitId] = useState<string | null>(null);
  const [lessonId, setLessonId] = useState<string | null>(null);

  const { data: curriculum } = useQuery({
    queryKey: ["curriculum"],
    queryFn: () =>
      apiFetch<{ courses: CourseRow[]; units: UnitRow[]; lessons: LessonRow[] }>("/v1/courses"),
    staleTime: 60_000,
    enabled: !!user && isAdmin,
  });

  // Powers the pending-review badges below — one row per lesson with any
  // exercises, so an admin can navigate straight to what needs attention
  // instead of clicking through all ~260 quiz/final_test lessons blind.
  const { data: reviewSummary = [] } = useQuery({
    queryKey: ["admin_review_summary"],
    queryFn: () => apiFetch<ReviewSummaryRow[]>("/v1/admin/exercises/review-summary"),
    enabled: !!user && isAdmin,
    staleTime: 30_000,
  });
  const summaryByLesson = useMemo(
    () => new Map(reviewSummary.map((r) => [r.lesson_id, r])),
    [reviewSummary],
  );
  const pendingByUnit = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of curriculum?.lessons ?? []) {
      const n = pendingCount(summaryByLesson.get(l.id));
      if (n > 0) m.set(l.unit_id, (m.get(l.unit_id) ?? 0) + n);
    }
    return m;
  }, [curriculum, summaryByLesson]);
  const pendingByLevel = useMemo(() => {
    const m = new Map<string, number>();
    const courseById = new Map((curriculum?.courses ?? []).map((c) => [c.id, c]));
    for (const u of curriculum?.units ?? []) {
      const n = pendingByUnit.get(u.id) ?? 0;
      if (n === 0) continue;
      const lvl = courseById.get(u.course_id)?.level;
      if (lvl) m.set(lvl, (m.get(lvl) ?? 0) + n);
    }
    return m;
  }, [curriculum, pendingByUnit]);

  const course = curriculum?.courses.find((c) => c.level === level);
  const units = (curriculum?.units ?? [])
    .filter((u) => u.course_id === course?.id)
    .sort((a, b) => a.order_index - b.order_index);
  const lessons = (curriculum?.lessons ?? [])
    .filter((l) => l.unit_id === unitId)
    .sort((a, b) => a.order_index - b.order_index);

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold text-ink flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-sunset" /> Currículo — lições e exercícios
        {reviewSummary.length > 0 && (
          <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-2xs font-bold text-amber-700">
            {reviewSummary.reduce((sum, r) => sum + pendingCount(r), 0)} por rever
          </span>
        )}
      </h2>
      <Card className="rounded-2xl border-gray-100 bg-white shadow-none">
        <div className="flex flex-wrap items-center justify-end gap-1 border-b border-gray-100 px-6 py-4">
          {CEFR_LEVELS.map((l) => (
            <button
              key={l}
              onClick={() => {
                setLevel(l);
                setUnitId(null);
                setLessonId(null);
              }}
              className={`flex items-center rounded-full px-3 py-1 text-xs font-bold transition-colors ${
                level === l
                  ? "bg-sunset text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              {l}
              <ReviewCountBadge count={pendingByLevel.get(l) ?? 0} />
            </button>
          ))}
        </div>
        <div className="grid divide-border md:grid-cols-[220px_240px_1fr] md:divide-x">
          <div className="max-h-[560px] overflow-y-auto p-3">
            {units.map((u) => (
              <button
                key={u.id}
                onClick={() => {
                  setUnitId(u.id);
                  setLessonId(null);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${
                  unitId === u.id ? "bg-sunset/10 font-semibold text-sunset" : "hover:bg-muted"
                }`}
              >
                <span className="truncate">{u.title}</span>
                <ReviewCountBadge count={pendingByUnit.get(u.id) ?? 0} />
              </button>
            ))}
            {units.length === 0 && (
              <p className="p-2 text-xs text-muted-foreground">Sem unidades.</p>
            )}
          </div>
          <div className="max-h-[560px] overflow-y-auto p-3">
            {lessons.map((l) => (
              <button
                key={l.id}
                onClick={() => setLessonId(l.id)}
                className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${
                  lessonId === l.id ? "bg-sunset/10 font-semibold text-sunset" : "hover:bg-muted"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate">{l.title}</span>
                  <ReviewCountBadge count={pendingCount(summaryByLesson.get(l.id))} />
                </div>
                <div className="text-2xs uppercase tracking-wide text-muted-foreground">
                  {l.lesson_type}
                </div>
              </button>
            ))}
            {unitId && lessons.length === 0 && (
              <p className="p-2 text-xs text-muted-foreground">Sem lições.</p>
            )}
            {!unitId && <p className="p-2 text-xs text-muted-foreground">Selecione uma unidade.</p>}
          </div>
          <div className="p-4">
            {lessonId ? (
              <LessonEditor key={lessonId} lessonId={lessonId} />
            ) : (
              <p className="p-4 text-sm text-muted-foreground">Selecione uma lição para editar.</p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
