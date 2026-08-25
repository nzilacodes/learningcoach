import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiFetch } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";
import type { CourseRow, UnitRow, LessonRow } from "@/lib/learning";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
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
import { Download, BarChart3, CreditCard, BookOpen, Plus, Trash2 } from "lucide-react";
import { useNotification } from "@/lib/notifications/notification-provider";

function csvDownload(name: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const cols = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    if (v == null) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* -------- Subscriptions manager -------- */
type AdminSubscription = {
  id: string;
  status: string;
  starts_at: string | null;
  expires_at: string | null;
  activation_code: string | null;
  profiles?: { full_name: string | null; email: string | null } | null;
  subscription_plans?: { tier: string; billing_cycle: string } | null;
};

export function SubscriptionsSection() {
  const { user, isAdmin } = useAuth();
  const notify = useNotification();
  const { data = [], refetch } = useQuery({
    queryKey: ["admin_subscriptions"],
    queryFn: async () => {
      const res = await apiFetch<{ items: AdminSubscription[] }>(
        "/v1/admin/subscriptions?limit=200",
      );
      return res.items;
    },
    enabled: !!user && isAdmin,
  });
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  const cancelSub = async (id: string) => {
    setCancelingId(id);
    try {
      await apiFetch(`/v1/admin/subscriptions/${id}/cancel`, { method: "POST" });
      refetch();
    } catch (e) {
      notify.fromError(e, { dedupeKey: "admin:cancel-subscription" });
    } finally {
      setCancelingId(null);
    }
  };

  return (
    <div className="mt-10 rounded-2xl border border-border bg-card shadow-card">
      <div className="border-b border-border px-6 py-4 flex items-center justify-between">
        <h2 className="font-display text-xl font-bold flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-magenta" /> Assinaturas
        </h2>
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            csvDownload(
              "subscriptions",
              data.map((s: AdminSubscription) => ({
                learner: s.profiles?.full_name,
                email: s.profiles?.email,
                tier: s.subscription_plans?.tier,
                cycle: s.subscription_plans?.billing_cycle,
                status: s.status,
                starts_at: s.starts_at,
                expires_at: s.expires_at,
                code: s.activation_code,
              })),
            )
          }
        >
          <Download className="h-3.5 w-3.5 mr-1" /> CSV
        </Button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aluno</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Início</TableHead>
              <TableHead>Expira</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  Sem assinaturas
                </TableCell>
              </TableRow>
            )}
            {data.map((s: AdminSubscription) => (
              <TableRow key={s.id}>
                <TableCell>
                  <div className="font-medium">{s.profiles?.full_name ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">{s.profiles?.email}</div>
                </TableCell>
                <TableCell className="capitalize">
                  {s.subscription_plans?.tier} · {s.subscription_plans?.billing_cycle}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={s.status === "active" ? "default" : "outline"}
                    className="capitalize"
                  >
                    {s.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs">
                  {s.starts_at ? new Date(s.starts_at).toLocaleDateString() : "—"}
                </TableCell>
                <TableCell className="text-xs">
                  {s.expires_at ? new Date(s.expires_at).toLocaleDateString() : "—"}
                </TableCell>
                <TableCell>
                  <code className="text-xs">{s.activation_code ?? "—"}</code>
                </TableCell>
                <TableCell>
                  {s.status === "active" && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline" disabled={cancelingId === s.id}>
                          {cancelingId === s.id ? "A cancelar…" : "Cancelar"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancelar esta assinatura?</AlertDialogTitle>
                          <AlertDialogDescription>
                            {s.profiles?.full_name ?? "Este aluno"} perde o acesso ao plano pago
                            imediatamente. Esta ação não pode ser desfeita a partir daqui.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Voltar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => cancelSub(s.id)}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            Cancelar assinatura
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

/* -------- Analytics (last 30 days: signups + revenue) -------- */
export function AnalyticsSection() {
  const { user, isAdmin } = useAuth();
  const { data } = useQuery({
    queryKey: ["admin_analytics_30d"],
    enabled: !!user && isAdmin,
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 86400000);
      const [profs, pays] = await Promise.all([
        apiFetch<{ created_at: string }[]>("/v1/admin/reports/users"),
        apiFetch<{ paid_at: string | null; amount_kz: number; status: string }[]>(
          "/v1/admin/reports/payments",
        ),
      ]);
      const days: Record<string, { signups: number; revenue: number }> = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
        days[d] = { signups: 0, revenue: 0 };
      }
      for (const p of profs) {
        if (new Date(p.created_at) < since) continue;
        const k = new Date(p.created_at).toISOString().slice(0, 10);
        if (days[k]) days[k].signups++;
      }
      for (const p of pays) {
        if (p.status !== "paid" || !p.paid_at || new Date(p.paid_at) < since) continue;
        const k = new Date(p.paid_at).toISOString().slice(0, 10);
        if (days[k]) days[k].revenue += p.amount_kz ?? 0;
      }
      return Object.entries(days).map(([day, v]) => ({ day, ...v }));
    },
  });

  const totalSignups = data?.reduce((a, b) => a + b.signups, 0) ?? 0;
  const totalRevenue = data?.reduce((a, b) => a + b.revenue, 0) ?? 0;
  const maxSignups = Math.max(1, ...(data ?? []).map((d) => d.signups));
  const maxRevenue = Math.max(1, ...(data ?? []).map((d) => d.revenue));

  return (
    <div className="mt-10 rounded-2xl border border-border bg-card shadow-card">
      <div className="border-b border-border px-6 py-4 flex items-center justify-between">
        <h2 className="font-display text-xl font-bold flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-violet" /> Analytics — últimos 30 dias
        </h2>
        <div className="flex gap-4 text-xs">
          <span>
            <b>{totalSignups}</b> novos alunos
          </span>
          <span>
            <b>{totalRevenue.toLocaleString("pt-AO")}</b> Kz
          </span>
        </div>
      </div>
      <div className="p-6">
        <div className="mb-4">
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            Novos registos por dia
          </div>
          <div className="flex items-end gap-1 h-24">
            {(data ?? []).map((d) => (
              <div key={d.day} className="flex-1 group relative">
                <div
                  className="bg-magenta/70 rounded-t hover:bg-magenta transition-colors"
                  style={{
                    height: `${(d.signups / maxSignups) * 100}%`,
                    minHeight: d.signups ? "2px" : "0",
                  }}
                  title={`${d.day}: ${d.signups} registos`}
                />
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            Receita diária (Kz)
          </div>
          <div className="flex items-end gap-1 h-24">
            {(data ?? []).map((d) => (
              <div key={d.day} className="flex-1">
                <div
                  className="bg-gradient-to-t from-sunset to-amber rounded-t"
                  style={{
                    height: `${(d.revenue / maxRevenue) * 100}%`,
                    minHeight: d.revenue ? "2px" : "0",
                  }}
                  title={`${d.day}: ${d.revenue.toLocaleString()} Kz`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------- Reports (CSV exports) -------- */
export function ReportsSection() {
  const notify = useNotification();
  const [pending, setPending] = useState<"users" | "payments" | "diagnostics" | null>(null);

  const runExport = async (kind: "users" | "payments" | "diagnostics", path: string) => {
    setPending(kind);
    try {
      csvDownload(kind, await apiFetch<Record<string, unknown>[]>(path));
    } catch (e) {
      notify.fromError(e, { dedupeKey: "admin:export-report" });
    } finally {
      setPending(null);
    }
  };
  const exportUsers = () => runExport("users", "/v1/admin/reports/users");
  const exportPayments = () => runExport("payments", "/v1/admin/reports/payments");
  const exportDiagnostics = () => runExport("diagnostics", "/v1/admin/reports/diagnostics");

  return (
    <div className="mt-10 rounded-2xl border border-border bg-card shadow-card p-6">
      <h2 className="font-display text-xl font-bold flex items-center gap-2 mb-4">
        <Download className="h-5 w-5 text-emerald-500" /> Relatórios
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        Exportar dados em CSV para análise externa.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" disabled={pending === "users"} onClick={exportUsers}>
          <Download className="h-3.5 w-3.5 mr-1" />{" "}
          {pending === "users" ? "A exportar…" : "Utilizadores"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={pending === "payments"}
          onClick={exportPayments}
        >
          <Download className="h-3.5 w-3.5 mr-1" />{" "}
          {pending === "payments" ? "A exportar…" : "Pagamentos"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={pending === "diagnostics"}
          onClick={exportDiagnostics}
        >
          <Download className="h-3.5 w-3.5 mr-1" />{" "}
          {pending === "diagnostics" ? "A exportar…" : "Diagnósticos"}
        </Button>
      </div>
    </div>
  );
}

/* -------- Curriculum content editor (lessons + exercises) -------- */
const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

type ContentStatus = "draft" | "in_review" | "published";
type AdminExercise = {
  id: string;
  type: string;
  prompt: string;
  data: { options?: string[] } | null;
  correct_answer: { index?: number } | null;
  xp_reward: number;
  content_status: ContentStatus;
  generated_by: string | null;
};
type AdminLessonDetail = {
  id: string;
  title: string;
  summary: string | null;
  content: unknown;
  xp_reward: number;
  is_published: boolean;
  lesson_type: string;
};

export function CurriculumSection() {
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

  const course = curriculum?.courses.find((c) => c.level === level);
  const units = (curriculum?.units ?? [])
    .filter((u) => u.course_id === course?.id)
    .sort((a, b) => a.order_index - b.order_index);
  const lessons = (curriculum?.lessons ?? [])
    .filter((l) => l.unit_id === unitId)
    .sort((a, b) => a.order_index - b.order_index);

  return (
    <div className="mt-10 rounded-2xl border border-border bg-card shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
        <h2 className="font-display text-xl font-bold flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-sunset" /> Currículo — lições e exercícios
        </h2>
        <div className="flex gap-1">
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
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${
                unitId === u.id ? "bg-sunset/10 font-semibold text-sunset" : "hover:bg-muted"
              }`}
            >
              {u.title}
            </button>
          ))}
          {units.length === 0 && <p className="p-2 text-xs text-muted-foreground">Sem unidades.</p>}
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
              <div className="truncate">{l.title}</div>
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
    </div>
  );
}

const lessonEditorSchema = z.object({
  title: z.string().min(1, "Título obrigatório"),
  summary: z.string(),
  xpReward: z.coerce.number().min(0, "XP não pode ser negativo"),
  published: z.boolean(),
  contentText: z.string().refine((v) => {
    try {
      JSON.parse(v);
      return true;
    } catch {
      return false;
    }
  }, "JSON de conteúdo inválido"),
});
type LessonEditorValues = z.infer<typeof lessonEditorSchema>;

function LessonEditor({ lessonId }: { lessonId: string }) {
  const qc = useQueryClient();
  const notify = useNotification();
  const { data: lesson, isLoading } = useQuery({
    queryKey: ["admin_lesson", lessonId],
    queryFn: () => apiFetch<AdminLessonDetail>(`/v1/lessons/${lessonId}`),
  });
  // Exercises come from the admin-only endpoint, not the embedded ones on the
  // public /v1/lessons/:id payload above — that payload now withholds
  // correct_answer for every caller on quiz/final_test lessons (grading is
  // server-side now), which would otherwise blind this editor to the very
  // data it needs to author/review.
  const [statusFilter, setStatusFilter] = useState<ContentStatus | "">("");
  const { data: exercises = [] } = useQuery({
    queryKey: ["admin_exercises", lessonId, statusFilter],
    queryFn: () =>
      apiFetch<AdminExercise[]>(
        `/v1/admin/lessons/${lessonId}/exercises${statusFilter ? `?status=${statusFilter}` : ""}`,
      ),
  });

  const form = useForm<LessonEditorValues>({
    resolver: zodResolver(lessonEditorSchema),
    defaultValues: { title: "", summary: "", xpReward: 10, published: true, contentText: "{}" },
  });

  useEffect(() => {
    if (!lesson) return;
    form.reset({
      title: lesson.title,
      summary: lesson.summary ?? "",
      xpReward: lesson.xp_reward,
      published: lesson.is_published,
      contentText: JSON.stringify(lesson.content ?? {}, null, 2),
    });
  }, [lesson, form]);

  const invalidateLesson = () => {
    qc.invalidateQueries({ queryKey: ["admin_lesson", lessonId] });
    qc.invalidateQueries({ queryKey: ["admin_exercises", lessonId] });
    qc.invalidateQueries({ queryKey: ["curriculum"] });
    qc.invalidateQueries({ queryKey: ["lesson", lessonId] });
  };

  const save = useMutation({
    mutationFn: (values: LessonEditorValues) =>
      apiFetch(`/v1/admin/lessons/${lessonId}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: values.title,
          summary: values.summary,
          xpReward: values.xpReward,
          isPublished: values.published,
          content: JSON.parse(values.contentText),
        }),
      }),
    onSuccess: () => {
      notify.success("Lição atualizada");
      invalidateLesson();
    },
    onError: (e) => {
      const normalized = notify.fromError(e, { dedupeKey: "admin:save-lesson" });
      const toFormField: Record<string, keyof LessonEditorValues> = {
        title: "title",
        summary: "summary",
        content: "contentText",
        xpReward: "xpReward",
        isPublished: "published",
      };
      normalized.fieldPaths?.forEach((path) => {
        const field = toFormField[path];
        if (field) form.setError(field, { type: "server", message: normalized.description });
      });
    },
  });

  const submit = form.handleSubmit((values) => save.mutate(values));

  if (isLoading || !lesson)
    return <div className="p-4 text-sm text-muted-foreground">Carregando…</div>;

  return (
    <Form {...form}>
      <form onSubmit={submit} className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="uppercase">
            {lesson.lesson_type}
          </Badge>
          <FormField
            control={form.control}
            name="published"
            render={({ field }) => (
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                Publicada
              </label>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold text-muted-foreground">Título</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="summary"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold text-muted-foreground">Resumo</FormLabel>
              <FormControl>
                <Textarea rows={2} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="xpReward"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold text-muted-foreground">XP</FormLabel>
              <FormControl>
                <Input type="number" min={0} className="w-28" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contentText"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold text-muted-foreground">
                Conteúdo (JSON — campos variam por tipo de lição: objective, wordlist, rule, text,
                prompt, etc.)
              </FormLabel>
              <FormControl>
                <Textarea rows={12} className="font-mono text-xs" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={save.isPending} className="w-full">
          {save.isPending ? "Salvando..." : "Salvar lição"}
        </Button>

        <div className="mt-6 border-t border-border pt-4">
          <ExerciseEditor
            lessonId={lessonId}
            exercises={exercises}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            onChanged={invalidateLesson}
          />
        </div>
      </form>
    </Form>
  );
}

const STATUS_LABEL: Record<ContentStatus, string> = {
  draft: "Rascunho",
  in_review: "Em revisão",
  published: "Publicado",
};

function ExerciseEditor({
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
    mutationFn: () => apiFetch(`/v1/admin/lessons/${lessonId}/generate-exercises`, { method: "POST" }),
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

  const updateStatus = useMutation({
    mutationFn: ({ id, contentStatus }: { id: string; contentStatus: ContentStatus }) =>
      apiFetch(`/v1/admin/exercises/${id}`, { method: "PATCH", body: JSON.stringify({ contentStatus }) }),
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
      {exercises.map((ex) => (
        <ExerciseRow
          key={ex.id}
          exercise={ex}
          onDeleted={() => {
            if (
              !window.confirm(
                "Apagar este exercício definitivamente? Esta ação não pode ser revertida.",
              )
            )
              return;
            deleteExercise.mutate(ex.id);
          }}
          onStatusChange={(contentStatus) => updateStatus.mutate({ id: ex.id, contentStatus })}
          onSaved={onChanged}
        />
      ))}
      {exercises.length === 0 && (
        <p className="text-xs text-muted-foreground">Sem exercícios nesta lição.</p>
      )}
    </div>
  );
}

function exerciseRowSchema() {
  return z
    .object({
      prompt: z.string().min(1, "Pergunta obrigatória"),
      options: z.string(),
      correctIndex: z.coerce.number().int(),
      xpReward: z.coerce.number().min(0, "XP não pode ser negativo"),
    })
    .refine(
      (v) => {
        const parsed = v.options
          .split("|")
          .map((s) => s.trim())
          .filter(Boolean);
        return v.correctIndex >= 0 && v.correctIndex < parsed.length;
      },
      (v) => {
        const parsed = v.options
          .split("|")
          .map((s) => s.trim())
          .filter(Boolean);
        return {
          message: `Índice da resposta correta (${v.correctIndex}) precisa estar entre 0 e ${parsed.length - 1}.`,
          path: ["correctIndex"],
        };
      },
    );
}
type ExerciseRowValues = z.infer<ReturnType<typeof exerciseRowSchema>>;

function ExerciseStatusBadge({
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

// Exercises the AI content-generation pipeline produces (fill_blank/ordering/
// matching) don't fit this file's mcq-only edit form — its "Salvar" always
// writes back {data:{options},correctAnswer:{index}}, which would silently
// corrupt any other shape. Those types get a read-only preview here instead;
// full structured editing for them is a natural follow-up, not done in this pass.
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

function ExerciseRow({
  exercise,
  onDeleted,
  onStatusChange,
  onSaved,
}: {
  exercise: AdminExercise;
  onDeleted: () => void;
  onStatusChange: (status: ContentStatus) => void;
  onSaved: () => void;
}) {
  const notify = useNotification();

  if (exercise.type !== "mcq") {
    return <NonMcqExercisePreview exercise={exercise} onDeleted={onDeleted} onStatusChange={onStatusChange} />;
  }
  const form = useForm<ExerciseRowValues>({
    resolver: zodResolver(exerciseRowSchema()),
    defaultValues: {
      prompt: exercise.prompt,
      options: (exercise.data?.options ?? []).join(" | "),
      correctIndex: exercise.correct_answer?.index ?? 0,
      xpReward: exercise.xp_reward,
    },
  });

  // Resync local fields if the server row changes under us (e.g. another
  // admin edits it, or a refetch returns updated data) — useState's initial
  // value only applies on mount, so without this the form would keep
  // showing stale values after the first render.
  useEffect(() => {
    form.reset({
      prompt: exercise.prompt,
      options: (exercise.data?.options ?? []).join(" | "),
      correctIndex: exercise.correct_answer?.index ?? 0,
      xpReward: exercise.xp_reward,
    });
  }, [exercise, form]);

  const save = useMutation({
    mutationFn: (values: ExerciseRowValues) => {
      const parsedOptions = values.options
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean);
      return apiFetch(`/v1/admin/exercises/${exercise.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          prompt: values.prompt,
          data: { options: parsedOptions },
          correctAnswer: { index: values.correctIndex },
          xpReward: values.xpReward,
        }),
      });
    },
    onSuccess: () => {
      notify.success("Exercício salvo");
      onSaved();
    },
    onError: (e) => {
      const normalized = notify.fromError(e, { dedupeKey: "admin:save-exercise" });
      const toFormField: Record<string, keyof ExerciseRowValues> = {
        prompt: "prompt",
        data: "options",
        correctAnswer: "correctIndex",
        xpReward: "xpReward",
      };
      normalized.fieldPaths?.forEach((path) => {
        const field = toFormField[path];
        if (field) form.setError(field, { type: "server", message: normalized.description });
      });
    },
  });

  const submit = form.handleSubmit((values) => save.mutate(values));

  return (
    <Form {...form}>
      <form onSubmit={submit} className="space-y-2 rounded-xl border border-border p-3">
        <div className="flex justify-end">
          <ExerciseStatusBadge exercise={exercise} onStatusChange={onStatusChange} />
        </div>
        <FormField
          control={form.control}
          name="prompt"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder="Pergunta" className="text-sm" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="options"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder="Opções separadas por |" className="text-xs" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex flex-wrap items-center gap-2">
          <FormField
            control={form.control}
            name="correctIndex"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-2">
                  <FormLabel className="text-xs text-muted-foreground">Correta (índice)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} className="w-16 text-xs" {...field} />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="xpReward"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-2">
                  <FormLabel className="text-xs text-muted-foreground">XP</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} className="w-16 text-xs" {...field} />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={save.isPending}>
            Salvar
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={onDeleted}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </form>
    </Form>
  );
}
