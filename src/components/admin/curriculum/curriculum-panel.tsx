import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";
import { useLocale } from "@/lib/i18n";
import { useNotification } from "@/lib/notifications/notification-provider";
import type { CourseRow, UnitRow, LessonRow } from "@/lib/learning";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { LessonEditor } from "./lesson-editor";

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

// Mirrors public.lesson_type in the backend (learning/schemas.ts LESSON_TYPES) —
// keep in sync if a lesson type is ever added there.
const LESSON_TYPES: { value: string; label: string }[] = [
  { value: "vocabulary", label: "Vocabulário" },
  { value: "grammar", label: "Gramática" },
  { value: "reading", label: "Leitura" },
  { value: "listening", label: "Compreensão oral" },
  { value: "writing", label: "Escrita" },
  { value: "speaking", label: "Fala" },
  { value: "pronunciation", label: "Pronúncia" },
  { value: "ipa", label: "IPA" },
  { value: "review", label: "Revisão" },
  { value: "project", label: "Projeto" },
  { value: "quiz", label: "Quiz" },
  { value: "final_test", label: "Teste final" },
];

type ReviewSummaryRow = { lesson_id: string; draft: number; in_review: number; published: number };
/** Draft + in_review — anything not yet published, i.e. still needs eyes on it. */
const pendingCount = (r: ReviewSummaryRow | undefined) => (r ? r.draft + r.in_review : 0);

type LessonPerformanceRow = {
  lesson_id: string;
  attempts: number;
  avg_score: number | null;
  pass_rate: number | null;
};

type DeleteTarget = { type: "unit" | "lesson"; id: string; label: string };
type ForceDeleteTarget = DeleteTarget & { message: string };

function ReviewCountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="ml-1.5 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-amber-100 px-1.5 py-0.5 text-2xs font-bold text-amber-700">
      {count}
    </span>
  );
}

function PerformanceBadge({ row }: { row: LessonPerformanceRow | undefined }) {
  if (!row || row.attempts <= 0) return null;
  return (
    <span
      className="ml-1.5 inline-flex items-center rounded-full bg-violet/10 px-1.5 py-0.5 text-2xs font-bold text-violet"
      title={`${row.avg_score ?? 0}% nota média · ${row.pass_rate ?? 0}% aprovação`}
    >
      {row.avg_score ?? 0}%·{row.attempts}
    </span>
  );
}

function ReorderButtons({
  disabledUp,
  disabledDown,
  onUp,
  onDown,
}: {
  disabledUp: boolean;
  disabledDown: boolean;
  onUp: () => void;
  onDown: () => void;
}) {
  return (
    <span className="flex flex-col">
      <button
        type="button"
        disabled={disabledUp}
        onClick={(e) => {
          e.stopPropagation();
          onUp();
        }}
        className="text-gray-300 hover:text-ink disabled:opacity-30"
        aria-label="Mover para cima"
      >
        <ChevronUp className="h-3 w-3" />
      </button>
      <button
        type="button"
        disabled={disabledDown}
        onClick={(e) => {
          e.stopPropagation();
          onDown();
        }}
        className="text-gray-300 hover:text-ink disabled:opacity-30"
        aria-label="Mover para baixo"
      >
        <ChevronDown className="h-3 w-3" />
      </button>
    </span>
  );
}

const createUnitSchema = z.object({
  title: z.string().trim().min(1, "Título obrigatório"),
  description: z.string().trim().optional(),
});
type CreateUnitValues = z.infer<typeof createUnitSchema>;

const createLessonSchema = z.object({
  title: z.string().trim().min(1, "Título obrigatório"),
  lessonType: z.string().min(1, "Escolha um tipo"),
});
type CreateLessonValues = z.infer<typeof createLessonSchema>;

export function CurriculumPanel() {
  const { user, isAdmin } = useAuth();
  const { locale } = useLocale();
  const notify = useNotification();
  const qc = useQueryClient();
  const [level, setLevel] = useState("A1");
  const [unitId, setUnitId] = useState<string | null>(null);
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [createUnitOpen, setCreateUnitOpen] = useState(false);
  const [createLessonOpen, setCreateLessonOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [forceDeleteTarget, setForceDeleteTarget] = useState<ForceDeleteTarget | null>(null);

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

  const { data: lessonPerformance = [] } = useQuery({
    queryKey: ["admin_lesson_performance"],
    queryFn: () => apiFetch<LessonPerformanceRow[]>("/v1/admin/performance/lessons"),
    enabled: !!user && isAdmin,
    staleTime: 30_000,
  });
  const performanceByLesson = useMemo(
    () => new Map(lessonPerformance.map((r) => [r.lesson_id, r])),
    [lessonPerformance],
  );

  const course = curriculum?.courses.find((c) => c.level === level);
  const units = (curriculum?.units ?? [])
    .filter((u) => u.course_id === course?.id)
    .sort((a, b) => a.order_index - b.order_index);
  const lessons = (curriculum?.lessons ?? [])
    .filter((l) => l.unit_id === unitId)
    .sort((a, b) => a.order_index - b.order_index);

  const invalidateCurriculum = () => {
    qc.invalidateQueries({ queryKey: ["curriculum"] });
    qc.invalidateQueries({ queryKey: ["admin_review_summary"] });
    qc.invalidateQueries({ queryKey: ["admin_lesson_performance"] });
  };

  const createUnitForm = useForm<CreateUnitValues>({
    resolver: zodResolver(createUnitSchema),
    defaultValues: { title: "", description: "" },
  });
  const submitCreateUnit = createUnitForm.handleSubmit(async (values) => {
    if (!course) return;
    try {
      const unit = await apiFetch<UnitRow>("/v1/admin/units", {
        method: "POST",
        body: JSON.stringify({
          courseId: course.id,
          title: values.title,
          description: values.description || undefined,
          orderIndex: units.length,
        }),
      });
      notify.success(locale === "pt" ? "Unidade criada" : "Unit created");
      invalidateCurriculum();
      setCreateUnitOpen(false);
      createUnitForm.reset();
      setUnitId(unit.id);
    } catch (e) {
      notify.fromError(e, { dedupeKey: "admin:create-unit" });
    }
  });

  const createLessonForm = useForm<CreateLessonValues>({
    resolver: zodResolver(createLessonSchema),
    defaultValues: { title: "", lessonType: "vocabulary" },
  });
  const submitCreateLesson = createLessonForm.handleSubmit(async (values) => {
    if (!unitId) return;
    try {
      const lesson = await apiFetch<LessonRow>("/v1/admin/lessons", {
        method: "POST",
        body: JSON.stringify({
          unitId,
          title: values.title,
          lessonType: values.lessonType,
          orderIndex: lessons.length,
        }),
      });
      notify.success(locale === "pt" ? "Lição criada" : "Lesson created");
      invalidateCurriculum();
      setCreateLessonOpen(false);
      createLessonForm.reset();
      setLessonId(lesson.id);
    } catch (e) {
      notify.fromError(e, { dedupeKey: "admin:create-lesson" });
    }
  });

  async function runDelete(target: DeleteTarget, force: boolean) {
    const path =
      target.type === "unit" ? `/v1/admin/units/${target.id}` : `/v1/admin/lessons/${target.id}`;
    try {
      await apiFetch(`${path}${force ? "?force=true" : ""}`, { method: "DELETE" });
      notify.success(locale === "pt" ? "Eliminado" : "Deleted");
      if (target.type === "unit" && unitId === target.id) {
        setUnitId(null);
        setLessonId(null);
      }
      if (target.type === "lesson" && lessonId === target.id) setLessonId(null);
      invalidateCurriculum();
      setDeleteTarget(null);
      setForceDeleteTarget(null);
    } catch (e) {
      const err = e as { status?: number; message?: string };
      if (!force && err.status === 409) {
        setDeleteTarget(null);
        setForceDeleteTarget({ ...target, message: err.message ?? "" });
      } else {
        notify.fromError(e, { dedupeKey: "admin:delete-curriculum-item" });
        setDeleteTarget(null);
        setForceDeleteTarget(null);
      }
    }
  }

  async function swapOrder(
    kind: "unit" | "lesson",
    a: { id: string; order_index: number },
    b: { id: string; order_index: number },
  ) {
    const path = kind === "unit" ? "/v1/admin/units" : "/v1/admin/lessons";
    try {
      await Promise.all([
        apiFetch(`${path}/${a.id}`, {
          method: "PATCH",
          body: JSON.stringify({ orderIndex: b.order_index }),
        }),
        apiFetch(`${path}/${b.id}`, {
          method: "PATCH",
          body: JSON.stringify({ orderIndex: a.order_index }),
        }),
      ]);
      invalidateCurriculum();
    } catch (e) {
      notify.fromError(e, { dedupeKey: "admin:reorder-curriculum" });
    }
  }

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
      <div className="rounded-2xl border border-gray-100 bg-white">
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
        <div className="grid divide-border md:grid-cols-[240px_260px_1fr] md:divide-x">
          <div className="flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
              <span className="text-2xs font-bold uppercase tracking-wide text-muted-foreground">
                Unidades
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2"
                disabled={!course}
                onClick={() => setCreateUnitOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="max-h-[520px] overflow-y-auto p-3">
              {units.map((u, i) => (
                <div
                  key={u.id}
                  className={`group flex w-full items-center gap-1 rounded-lg px-2 py-2 text-left text-sm ${
                    unitId === u.id ? "bg-sunset/10 font-semibold text-sunset" : "hover:bg-muted"
                  }`}
                >
                  <ReorderButtons
                    disabledUp={i === 0}
                    disabledDown={i === units.length - 1}
                    onUp={() => swapOrder("unit", u, units[i - 1]!)}
                    onDown={() => swapOrder("unit", u, units[i + 1]!)}
                  />
                  <button
                    onClick={() => {
                      setUnitId(u.id);
                      setLessonId(null);
                    }}
                    className="flex flex-1 items-center justify-between gap-2 truncate text-left"
                  >
                    <span className="truncate">{u.title}</span>
                    <ReviewCountBadge count={pendingByUnit.get(u.id) ?? 0} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget({ type: "unit", id: u.id, label: u.title })}
                    className="opacity-0 text-gray-300 hover:text-red-500 group-hover:opacity-100"
                    aria-label="Apagar unidade"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {units.length === 0 && (
                <p className="p-2 text-xs text-muted-foreground">Sem unidades.</p>
              )}
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
              <span className="text-2xs font-bold uppercase tracking-wide text-muted-foreground">
                Lições
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2"
                disabled={!unitId}
                onClick={() => setCreateLessonOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="max-h-[520px] overflow-y-auto p-3">
              {lessons.map((l, i) => (
                <div
                  key={l.id}
                  className={`group flex w-full items-center gap-1 rounded-lg px-2 py-2 text-left text-sm ${
                    lessonId === l.id ? "bg-sunset/10 font-semibold text-sunset" : "hover:bg-muted"
                  }`}
                >
                  <ReorderButtons
                    disabledUp={i === 0}
                    disabledDown={i === lessons.length - 1}
                    onUp={() => swapOrder("lesson", l, lessons[i - 1]!)}
                    onDown={() => swapOrder("lesson", l, lessons[i + 1]!)}
                  />
                  <button onClick={() => setLessonId(l.id)} className="flex-1 truncate text-left">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate">{l.title}</span>
                      <span className="flex items-center">
                        <ReviewCountBadge count={pendingCount(summaryByLesson.get(l.id))} />
                        <PerformanceBadge row={performanceByLesson.get(l.id)} />
                      </span>
                    </div>
                    <div className="text-2xs uppercase tracking-wide text-muted-foreground">
                      {l.lesson_type}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget({ type: "lesson", id: l.id, label: l.title })}
                    className="opacity-0 text-gray-300 hover:text-red-500 group-hover:opacity-100"
                    aria-label="Apagar lição"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {unitId && lessons.length === 0 && (
                <p className="p-2 text-xs text-muted-foreground">Sem lições.</p>
              )}
              {!unitId && (
                <p className="p-2 text-xs text-muted-foreground">Selecione uma unidade.</p>
              )}
            </div>
          </div>
          <div className="p-4">
            {lessonId ? (
              <LessonEditor key={lessonId} lessonId={lessonId} />
            ) : (
              <p className="p-4 text-sm text-muted-foreground">Selecione uma lição para editar.</p>
            )}
          </div>
        </div>
      </div>

      <Dialog open={createUnitOpen} onOpenChange={setCreateUnitOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova unidade — {level}</DialogTitle>
          </DialogHeader>
          <Form {...createUnitForm}>
            <form onSubmit={submitCreateUnit} className="space-y-4">
              <FormField
                control={createUnitForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createUnitForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição (opcional)</FormLabel>
                    <FormControl>
                      <Textarea rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={createUnitForm.formState.isSubmitting}>
                  Criar unidade
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={createLessonOpen} onOpenChange={setCreateLessonOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova lição</DialogTitle>
          </DialogHeader>
          <Form {...createLessonForm}>
            <form onSubmit={submitCreateLesson} className="space-y-4">
              <FormField
                control={createLessonForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createLessonForm.control}
                name="lessonType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de lição</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LESSON_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={createLessonForm.formState.isSubmitting}>
                  Criar lição
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar "{deleteTarget?.label}"?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === "unit"
                ? "Esta ação não pode ser revertida. Se a unidade tiver lições, vai ser pedida confirmação extra."
                : "Esta ação não pode ser revertida. Se a lição tiver tentativas de alunos registadas, vai ser pedida confirmação extra."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && runDelete(deleteTarget, false)}
              className="bg-red-500 hover:bg-red-600"
            >
              Apagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!forceDeleteTarget}
        onOpenChange={(open) => !open && setForceDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>"{forceDeleteTarget?.label}" tem conteúdo associado</AlertDialogTitle>
            <AlertDialogDescription>{forceDeleteTarget?.message}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => forceDeleteTarget && runDelete(forceDeleteTarget, true)}
              className="bg-red-500 hover:bg-red-600"
            >
              Apagar na mesma
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
