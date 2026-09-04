import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Search,
  Baby,
  Puzzle,
  Rocket,
  Backpack,
  GraduationCap,
  Briefcase,
  Pencil,
  Eye,
  Copy,
  Lightbulb,
  type LucideIcon,
} from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";
import { useLocale } from "@/lib/i18n";
import { useNotification } from "@/lib/notifications/notification-provider";
import type { CourseRow, UnitRow, LessonRow, AgeGroupRow } from "@/lib/learning";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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

// Nearest available Lucide icons to the reference mockup's emoji (teddy bear,
// dinosaur, rocket, backpack, cap, briefcase) — no 1:1 match exists, this is
// the closest thematic equivalent per age band.
const AGE_GROUP_STYLE: Record<string, { icon: LucideIcon; color: string }> = {
  early: { icon: Baby, color: "text-sunset bg-sunset/10" },
  children: { icon: Puzzle, color: "text-emerald-600 bg-emerald-100" },
  pre_teens: { icon: Rocket, color: "text-violet bg-violet/10" },
  teens: { icon: Backpack, color: "text-amber-600 bg-amber-100" },
  young_teens: { icon: GraduationCap, color: "text-magenta bg-magenta/10" },
  adult: { icon: Briefcase, color: "text-slate-600 bg-slate-100" },
};

type ReviewSummaryRow = { lesson_id: string; draft: number; in_review: number; published: number };
/** Draft + in_review — anything not yet published, i.e. still needs eyes on it. */
const pendingCount = (r: ReviewSummaryRow | undefined) => (r ? r.draft + r.in_review : 0);

type SkillRow = { id: string; code: string; label: string; order_index: number };

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

function LessonStatusBadge({ isPublished }: { isPublished: boolean }) {
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-2xs font-bold ${
        isPublished ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
      }`}
    >
      {isPublished ? "Publicado" : "Rascunho"}
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

function AgeGroupCard({
  ageGroup,
  selected,
  onClick,
}: {
  ageGroup: AgeGroupRow;
  selected: boolean;
  onClick: () => void;
}) {
  const style = AGE_GROUP_STYLE[ageGroup.code] ?? {
    icon: BookOpen,
    color: "text-sunset bg-sunset/10",
  };
  const Icon = style.icon;
  const pct =
    ageGroup.lesson_count > 0
      ? Math.round((ageGroup.published_lesson_count / ageGroup.lesson_count) * 100)
      : 0;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition-all ${
        selected
          ? "border-sunset ring-2 ring-sunset/30 bg-white"
          : "border-gray-100 bg-white hover:border-gray-200"
      }`}
    >
      <div className="flex items-start justify-between">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${style.color}`}>
          <Icon className="h-5 w-5" />
        </span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-2xs font-bold text-muted-foreground">
          {ageGroup.unit_count}
        </span>
      </div>
      <div className="mt-3 font-display text-lg font-bold text-ink">
        {ageGroup.code === "adult" ? "Adultos" : ageGroup.label}
      </div>
      <div className="text-2xs text-muted-foreground">{ageGroup.label}</div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-sunset transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1 text-2xs text-muted-foreground">{pct}% concluído</div>
    </button>
  );
}

function QuickAction({
  icon: Icon,
  label,
  onClick,
  destructive,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition-colors ${
        destructive
          ? "border-red-100 text-red-500 hover:bg-red-50"
          : "border-gray-100 text-ink hover:bg-muted"
      }`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {label}
    </button>
  );
}

function StatTile({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl bg-muted/60 py-2 text-center">
      <div className="font-display text-lg font-bold text-ink">{value}</div>
      <div className="text-2xs text-muted-foreground">{label}</div>
    </div>
  );
}

function UnitDetailPanel({
  unit,
  lessons,
  summaryByLesson,
  onSelectFirstLesson,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  unit: UnitRow;
  lessons: LessonRow[];
  summaryByLesson: Map<string, ReviewSummaryRow>;
  onSelectFirstLesson: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const total = lessons.length;
  const published = lessons.filter((l) => l.is_published).length;
  const drafts = total - published;
  const pending = lessons.reduce((sum, l) => sum + pendingCount(summaryByLesson.get(l.id)), 0);
  const pct = total > 0 ? Math.round((published / total) * 100) : 0;

  return (
    <div className="space-y-5">
      <div>
        <div className="text-2xs font-bold uppercase tracking-widest text-muted-foreground">
          Unit {String(unit.order_index + 1).padStart(2, "0")}
        </div>
        <h3 className="font-display text-xl font-bold text-ink">{unit.title}</h3>
        {unit.description && (
          <p className="mt-1 text-sm text-muted-foreground">{unit.description}</p>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2">
        <StatTile value={total} label="Lições" />
        <StatTile value={published} label="Publicadas" />
        <StatTile value={drafts} label="Rascunhos" />
        <StatTile value={pending} label="Por rever" />
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between text-2xs text-muted-foreground">
          <span>Progresso da unidade</span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-sunset transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div>
        <div className="mb-2 text-2xs font-bold uppercase tracking-widest text-muted-foreground">
          Ações rápidas
        </div>
        <div className="grid grid-cols-2 gap-2">
          <QuickAction icon={Pencil} label="Editar unidade" onClick={onEdit} />
          <QuickAction icon={Eye} label="Ver unidade" onClick={onSelectFirstLesson} />
          <QuickAction icon={Copy} label="Duplicar unidade" onClick={onDuplicate} />
          <QuickAction icon={Trash2} label="Excluir unidade" onClick={onDelete} destructive />
        </div>
      </div>

      <div className="flex gap-2 rounded-xl bg-violet/5 p-3 text-2xs text-muted-foreground">
        <Lightbulb className="h-4 w-4 shrink-0 text-violet" />
        <span>
          <b className="text-ink">Dica:</b> use as setas ao lado de cada unidade/lição para
          reordenar rapidamente.
        </span>
      </div>
    </div>
  );
}

const createUnitSchema = z.object({
  title: z.string().trim().min(1, "Título obrigatório"),
  description: z.string().trim().optional(),
});
type CreateUnitValues = z.infer<typeof createUnitSchema>;

const editUnitSchema = z.object({
  title: z.string().trim().min(1, "Título obrigatório"),
  description: z.string().trim().optional(),
  ageGroupIds: z.array(z.string()),
});
type EditUnitValues = z.infer<typeof editUnitSchema>;

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

  const [view, setView] = useState<"age" | "unit" | "skill">("age");
  const [ageGroupCode, setAgeGroupCode] = useState<string | null>(null);
  const [skillCode, setSkillCode] = useState<string | null>(null);
  const [level, setLevel] = useState("A1");
  const [unitId, setUnitId] = useState<string | null>(null);
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [createUnitOpen, setCreateUnitOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<UnitRow | null>(null);
  const [createLessonOpen, setCreateLessonOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [forceDeleteTarget, setForceDeleteTarget] = useState<ForceDeleteTarget | null>(null);

  const { data: curriculum } = useQuery({
    queryKey: ["curriculum_admin"],
    queryFn: () =>
      apiFetch<{ courses: CourseRow[]; units: UnitRow[]; lessons: LessonRow[] }>(
        "/v1/admin/curriculum",
      ),
    staleTime: 60_000,
    enabled: !!user && isAdmin,
  });

  const { data: ageGroups = [] } = useQuery({
    queryKey: ["admin_age_groups"],
    queryFn: () => apiFetch<AgeGroupRow[]>("/v1/admin/age-groups"),
    enabled: !!user && isAdmin,
    staleTime: 30_000,
  });

  const { data: skills = [] } = useQuery({
    queryKey: ["admin_skills"],
    queryFn: () => apiFetch<SkillRow[]>("/v1/admin/skills"),
    enabled: !!user && isAdmin,
    staleTime: 5 * 60_000,
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

  const courseById = useMemo(
    () => new Map((curriculum?.courses ?? []).map((c) => [c.id, c])),
    [curriculum],
  );

  // Which CEFR levels actually have a unit tagged with the selected age
  // group — usually 1 today (everything bootstrapped 1:1), but genuinely
  // independent once an admin tags a unit into a second band.
  const levelsForAgeGroup = useMemo(() => {
    if (!ageGroupCode) return [];
    const set = new Set<string>();
    for (const u of curriculum?.units ?? []) {
      if (!u.age_group_codes.includes(ageGroupCode)) continue;
      const lvl = courseById.get(u.course_id)?.level;
      if (lvl) set.add(lvl);
    }
    return CEFR_LEVELS.filter((l) => set.has(l));
  }, [curriculum, courseById, ageGroupCode]);

  // Keep `level` valid whenever the active age group (or the set of levels
  // it actually has content in) changes — both views share the same `level`
  // + 3-column browser below, only the unit filter differs.
  useEffect(() => {
    if (view !== "age" || !ageGroupCode) return;
    if (!levelsForAgeGroup.includes(level)) {
      setLevel(levelsForAgeGroup[0] ?? "");
      setUnitId(null);
      setLessonId(null);
    }
  }, [view, ageGroupCode, levelsForAgeGroup]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (view === "age" && !ageGroupCode && ageGroups.length > 0) {
      setAgeGroupCode(ageGroups[0]!.code);
    }
  }, [view, ageGroupCode, ageGroups]);

  const course = curriculum?.courses.find((c) => c.level === level);
  let units = (curriculum?.units ?? [])
    .filter((u) => u.course_id === course?.id)
    .sort((a, b) => a.order_index - b.order_index);
  if (view === "age" && ageGroupCode) {
    units = units.filter((u) => u.age_group_codes.includes(ageGroupCode));
  }
  const searchLower = search.trim().toLowerCase();
  const visibleUnits = units.filter(
    (u) => !searchLower || u.title.toLowerCase().includes(searchLower),
  );

  const lessons = (curriculum?.lessons ?? [])
    .filter((l) => l.unit_id === unitId)
    .sort((a, b) => a.order_index - b.order_index);
  const visibleLessons = lessons.filter(
    (l) => !searchLower || l.title.toLowerCase().includes(searchLower),
  );

  const selectedUnit = units.find((u) => u.id === unitId) ?? null;

  // "Por competência" cuts across units/levels entirely (a skill's lessons
  // can live in any unit at any CEFR level), so this view flattens straight
  // to lessons instead of reusing the unit-scoped columns above.
  const selectedSkill = skills.find((s) => s.code === skillCode) ?? null;
  const unitById = new Map((curriculum?.units ?? []).map((u) => [u.id, u]));
  const lessonsForSkill = (curriculum?.lessons ?? [])
    .filter((l) => selectedSkill && l.skill_id === selectedSkill.id)
    .filter((l) => !searchLower || l.title.toLowerCase().includes(searchLower))
    .map((l) => ({
      lesson: l,
      unit: unitById.get(l.unit_id),
      level: courseById.get(unitById.get(l.unit_id)?.course_id ?? "")?.level,
    }))
    .sort((a, b) => a.lesson.title.localeCompare(b.lesson.title));

  const invalidateCurriculum = () => {
    qc.invalidateQueries({ queryKey: ["curriculum_admin"] });
    qc.invalidateQueries({ queryKey: ["admin_review_summary"] });
    qc.invalidateQueries({ queryKey: ["admin_lesson_performance"] });
    qc.invalidateQueries({ queryKey: ["admin_age_groups"] });
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
          ageGroupIds:
            view === "age" && ageGroupCode
              ? [ageGroups.find((a) => a.code === ageGroupCode)?.id].filter(Boolean)
              : undefined,
        }),
      });
      notify.success(locale === "pt" ? "Unidade criada" : "Unit created");
      invalidateCurriculum();
      setCreateUnitOpen(false);
      createUnitForm.reset();
      setUnitId(unit.id);
      setLessonId(null);
    } catch (e) {
      notify.fromError(e, { dedupeKey: "admin:create-unit" });
    }
  });

  const editUnitForm = useForm<EditUnitValues>({
    resolver: zodResolver(editUnitSchema),
    defaultValues: { title: "", description: "", ageGroupIds: [] },
  });
  useEffect(() => {
    if (!editingUnit) return;
    const ids = ageGroups
      .filter((a) => editingUnit.age_group_codes.includes(a.code))
      .map((a) => a.id);
    editUnitForm.reset({
      title: editingUnit.title,
      description: editingUnit.description ?? "",
      ageGroupIds: ids,
    });
  }, [editingUnit, ageGroups]); // eslint-disable-line react-hooks/exhaustive-deps
  const submitEditUnit = editUnitForm.handleSubmit(async (values) => {
    if (!editingUnit) return;
    try {
      await apiFetch(`/v1/admin/units/${editingUnit.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: values.title,
          description: values.description || undefined,
          ageGroupIds: values.ageGroupIds,
        }),
      });
      notify.success(locale === "pt" ? "Unidade atualizada" : "Unit updated");
      invalidateCurriculum();
      setEditingUnit(null);
    } catch (e) {
      notify.fromError(e, { dedupeKey: "admin:edit-unit" });
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

  async function duplicateUnit(unit: UnitRow) {
    try {
      const newUnit = await apiFetch<UnitRow>(`/v1/admin/units/${unit.id}/duplicate`, {
        method: "POST",
      });
      notify.success(locale === "pt" ? "Unidade duplicada" : "Unit duplicated");
      invalidateCurriculum();
      setUnitId(newUnit.id);
      setLessonId(null);
    } catch (e) {
      notify.fromError(e, { dedupeKey: "admin:duplicate-unit" });
    }
  }

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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-2xl font-bold text-ink">
          <BookOpen className="h-5 w-5 text-sunset" /> Currículo
          {reviewSummary.length > 0 && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-2xs font-bold text-amber-700">
              {reviewSummary.reduce((sum, r) => sum + pendingCount(r), 0)} por rever
            </span>
          )}
        </h2>
        <div className="flex items-center gap-2">
          <div className="flex rounded-full bg-muted p-1">
            <button
              type="button"
              onClick={() => setView("age")}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                view === "age" ? "bg-white text-sunset shadow-sm" : "text-muted-foreground"
              }`}
            >
              Por idade
            </button>
            <button
              type="button"
              onClick={() => setView("unit")}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                view === "unit" ? "bg-white text-sunset shadow-sm" : "text-muted-foreground"
              }`}
            >
              Por unidade
            </button>
            <button
              type="button"
              onClick={() => setView("skill")}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                view === "skill" ? "bg-white text-sunset shadow-sm" : "text-muted-foreground"
              }`}
            >
              Por competência
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar unidades ou lições…"
              className="w-64 pl-9"
            />
          </div>
        </div>
      </div>

      {view === "age" && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {ageGroups.map((ag) => (
            <AgeGroupCard
              key={ag.id}
              ageGroup={ag}
              selected={ageGroupCode === ag.code}
              onClick={() => {
                setAgeGroupCode(ag.code);
                setUnitId(null);
                setLessonId(null);
              }}
            />
          ))}
        </div>
      )}

      {view !== "skill" && (
        <div className="rounded-2xl border border-gray-100 bg-white">
          {view === "unit" ? (
            <div className="flex flex-wrap items-center justify-end gap-1 border-b border-gray-100 px-6 py-4">
              {CEFR_LEVELS.map((l) => (
                <button
                  key={l}
                  onClick={() => {
                    setLevel(l);
                    setUnitId(null);
                    setLessonId(null);
                  }}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
                    level === l
                      ? "bg-sunset text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/70"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          ) : (
            levelsForAgeGroup.length > 0 && (
              <div className="flex flex-wrap items-center justify-end gap-1 border-b border-gray-100 px-6 py-4">
                {levelsForAgeGroup.map((l) => (
                  <button
                    key={l}
                    onClick={() => {
                      setLevel(l);
                      setUnitId(null);
                      setLessonId(null);
                    }}
                    className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
                      level === l
                        ? "bg-sunset text-white"
                        : "bg-muted text-muted-foreground hover:bg-muted/70"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            )
          )}

          {view === "age" && levelsForAgeGroup.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              Sem unidades nesta faixa etária ainda.
            </p>
          ) : (
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
                  {visibleUnits.map((u, i) => (
                    <div
                      key={u.id}
                      className={`group flex w-full items-center gap-1 rounded-lg px-2 py-2 text-left text-sm ${
                        unitId === u.id
                          ? "bg-sunset/10 font-semibold text-sunset"
                          : "hover:bg-muted"
                      }`}
                    >
                      <ReorderButtons
                        // Swapping needs true adjacency (order_index-wise) — with a
                        // search filter active, "adjacent in visibleUnits" isn't
                        // necessarily adjacent in the real order, so reordering is
                        // disabled rather than silently scrambling hidden items.
                        disabledUp={!!searchLower || i === 0}
                        disabledDown={!!searchLower || i === visibleUnits.length - 1}
                        onUp={() => swapOrder("unit", u, visibleUnits[i - 1]!)}
                        onDown={() => swapOrder("unit", u, visibleUnits[i + 1]!)}
                      />
                      <button
                        onClick={() => {
                          setUnitId(u.id);
                          setLessonId(null);
                        }}
                        className="flex flex-1 items-center justify-between gap-2 truncate text-left"
                      >
                        <span className="truncate">
                          {String(i + 1).padStart(2, "0")}. {u.title}
                        </span>
                        <ReviewCountBadge count={pendingByUnit.get(u.id) ?? 0} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget({ type: "unit", id: u.id, label: u.title })}
                        className="text-gray-300 opacity-0 hover:text-red-500 group-hover:opacity-100"
                        aria-label="Apagar unidade"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  {visibleUnits.length === 0 && (
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
                  {visibleLessons.map((l, i) => (
                    <div
                      key={l.id}
                      className={`group flex w-full items-center gap-1 rounded-lg px-2 py-2 text-left text-sm ${
                        lessonId === l.id
                          ? "bg-sunset/10 font-semibold text-sunset"
                          : "hover:bg-muted"
                      }`}
                    >
                      <ReorderButtons
                        disabledUp={!!searchLower || i === 0}
                        disabledDown={!!searchLower || i === visibleLessons.length - 1}
                        onUp={() => swapOrder("lesson", l, visibleLessons[i - 1]!)}
                        onDown={() => swapOrder("lesson", l, visibleLessons[i + 1]!)}
                      />
                      <button
                        onClick={() => setLessonId(l.id)}
                        className="flex-1 truncate text-left"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate">
                            1.{i + 1} {l.title}
                          </span>
                          <span className="flex shrink-0 items-center">
                            <ReviewCountBadge count={pendingCount(summaryByLesson.get(l.id))} />
                            <PerformanceBadge row={performanceByLesson.get(l.id)} />
                          </span>
                        </div>
                        <div className="mt-0.5 flex items-center justify-between">
                          <span className="text-2xs uppercase tracking-wide text-muted-foreground">
                            {l.lesson_type}
                          </span>
                          <LessonStatusBadge isPublished={l.is_published} />
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteTarget({ type: "lesson", id: l.id, label: l.title })
                        }
                        className="text-gray-300 opacity-0 hover:text-red-500 group-hover:opacity-100"
                        aria-label="Apagar lição"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  {unitId && visibleLessons.length === 0 && (
                    <p className="p-2 text-xs text-muted-foreground">Sem lições.</p>
                  )}
                  {!unitId && (
                    <p className="p-2 text-xs text-muted-foreground">Selecione uma unidade.</p>
                  )}
                </div>
              </div>

              <div className="p-4">
                {lessonId ? (
                  <div>
                    <button
                      type="button"
                      onClick={() => setLessonId(null)}
                      className="mb-3 text-2xs font-bold uppercase tracking-wide text-muted-foreground hover:text-ink"
                    >
                      ← Voltar à unidade
                    </button>
                    <LessonEditor key={lessonId} lessonId={lessonId} />
                  </div>
                ) : selectedUnit ? (
                  <UnitDetailPanel
                    unit={selectedUnit}
                    lessons={lessons}
                    summaryByLesson={summaryByLesson}
                    onSelectFirstLesson={() => lessons[0] && setLessonId(lessons[0].id)}
                    onEdit={() => setEditingUnit(selectedUnit)}
                    onDuplicate={() => duplicateUnit(selectedUnit)}
                    onDelete={() =>
                      setDeleteTarget({
                        type: "unit",
                        id: selectedUnit.id,
                        label: selectedUnit.title,
                      })
                    }
                  />
                ) : (
                  <p className="p-4 text-sm text-muted-foreground">Selecione uma unidade.</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {view === "skill" && (
        <div className="rounded-2xl border border-gray-100 bg-white">
          <div className="flex flex-wrap items-center justify-end gap-1 border-b border-gray-100 px-6 py-4">
            {skills.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setSkillCode(s.code);
                  setLessonId(null);
                }}
                className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
                  skillCode === s.code
                    ? "bg-sunset text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/70"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          {!selectedSkill ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              Selecione uma competência acima.
            </p>
          ) : (
            <div className="grid divide-border md:grid-cols-[320px_1fr] md:divide-x">
              <div className="max-h-[560px] overflow-y-auto p-3">
                {lessonsForSkill.map(({ lesson, unit, level: lvl }) => (
                  <button
                    key={lesson.id}
                    onClick={() => setLessonId(lesson.id)}
                    className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${
                      lessonId === lesson.id
                        ? "bg-sunset/10 font-semibold text-sunset"
                        : "hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate">{lesson.title}</span>
                      <LessonStatusBadge isPublished={lesson.is_published} />
                    </div>
                    <div className="text-2xs text-muted-foreground">
                      {lvl ?? "—"} · {unit?.title ?? "—"}
                    </div>
                  </button>
                ))}
                {lessonsForSkill.length === 0 && (
                  <p className="p-2 text-xs text-muted-foreground">Sem lições nesta competência.</p>
                )}
              </div>
              <div className="p-4">
                {lessonId ? (
                  <LessonEditor key={lessonId} lessonId={lessonId} />
                ) : (
                  <p className="p-4 text-sm text-muted-foreground">Selecione uma lição.</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

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

      <Dialog open={!!editingUnit} onOpenChange={(open) => !open && setEditingUnit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar unidade</DialogTitle>
          </DialogHeader>
          <Form {...editUnitForm}>
            <form onSubmit={submitEditUnit} className="space-y-4">
              <FormField
                control={editUnitForm.control}
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
                control={editUnitForm.control}
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
              <FormField
                control={editUnitForm.control}
                name="ageGroupIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Faixas etárias</FormLabel>
                    <div className="grid grid-cols-2 gap-2">
                      {ageGroups.map((ag) => (
                        <label
                          key={ag.id}
                          className="flex items-center gap-2 text-xs text-muted-foreground"
                        >
                          <Checkbox
                            checked={field.value.includes(ag.id)}
                            onCheckedChange={(checked) => {
                              field.onChange(
                                checked
                                  ? [...field.value, ag.id]
                                  : field.value.filter((id: string) => id !== ag.id),
                              );
                            }}
                          />
                          {ag.label}
                        </label>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={editUnitForm.formState.isSubmitting}>
                  Guardar
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
