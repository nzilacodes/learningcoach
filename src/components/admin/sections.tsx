import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Download, BarChart3, CreditCard, BookOpen, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

function csvDownload(name: string, rows: Record<string, any>[]) {
  if (!rows.length) return;
  const cols = Object.keys(rows[0]);
  const esc = (v: any) => {
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
  const { data = [], refetch } = useQuery({
    queryKey: ["admin_subscriptions"],
    queryFn: async () => {
      const res = await apiFetch<{ items: AdminSubscription[] }>("/v1/admin/subscriptions?limit=200");
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
      toast.error(e instanceof Error ? e.message : "Falha ao cancelar a assinatura.");
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
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={cancelingId === s.id}
                      onClick={() => cancelSub(s.id)}
                    >
                      {cancelingId === s.id ? "A cancelar…" : "Cancelar"}
                    </Button>
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
  const [pending, setPending] = useState<"users" | "payments" | "diagnostics" | null>(null);

  const runExport = async (
    kind: "users" | "payments" | "diagnostics",
    path: string,
  ) => {
    setPending(kind);
    try {
      csvDownload(kind, await apiFetch<Record<string, any>[]>(path));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao exportar o relatório.");
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

type AdminExercise = {
  id: string;
  prompt: string;
  data: { options?: string[] } | null;
  correct_answer: { index?: number } | null;
  xp_reward: number;
};
type AdminLessonDetail = {
  id: string;
  title: string;
  summary: string | null;
  content: unknown;
  xp_reward: number;
  is_published: boolean;
  lesson_type: string;
  exercises: AdminExercise[];
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
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
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

function LessonEditor({ lessonId }: { lessonId: string }) {
  const qc = useQueryClient();
  const { data: lesson, isLoading } = useQuery({
    queryKey: ["admin_lesson", lessonId],
    queryFn: () => apiFetch<AdminLessonDetail>(`/v1/lessons/${lessonId}`),
  });

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [xpReward, setXpReward] = useState(10);
  const [published, setPublished] = useState(true);
  const [contentText, setContentText] = useState("{}");

  useEffect(() => {
    if (!lesson) return;
    setTitle(lesson.title);
    setSummary(lesson.summary ?? "");
    setXpReward(lesson.xp_reward);
    setPublished(lesson.is_published);
    setContentText(JSON.stringify(lesson.content ?? {}, null, 2));
  }, [lesson]);

  const invalidateLesson = () => {
    qc.invalidateQueries({ queryKey: ["admin_lesson", lessonId] });
    qc.invalidateQueries({ queryKey: ["curriculum"] });
    qc.invalidateQueries({ queryKey: ["lesson", lessonId] });
  };

  const save = useMutation({
    mutationFn: async () => {
      let content: unknown;
      try {
        content = JSON.parse(contentText);
      } catch {
        throw new Error("JSON de conteúdo inválido");
      }
      return apiFetch(`/v1/admin/lessons/${lessonId}`, {
        method: "PATCH",
        body: JSON.stringify({ title, summary, xpReward, isPublished: published, content }),
      });
    },
    onSuccess: () => {
      toast.success("Lição atualizada");
      invalidateLesson();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !lesson)
    return <div className="p-4 text-sm text-muted-foreground">Carregando…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="uppercase">
          {lesson.lesson_type}
        </Badge>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
          />
          Publicada
        </label>
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground">Título</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground">Resumo</label>
        <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={2} />
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground">XP</label>
        <Input
          type="number"
          min={0}
          value={xpReward}
          onChange={(e) => setXpReward(Number(e.target.value))}
          className="w-28"
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground">
          Conteúdo (JSON — campos variam por tipo de lição: objective, wordlist, rule, text, prompt,
          etc.)
        </label>
        <Textarea
          value={contentText}
          onChange={(e) => setContentText(e.target.value)}
          rows={12}
          className="font-mono text-xs"
        />
      </div>
      <Button onClick={() => save.mutate()} disabled={save.isPending} className="w-full">
        {save.isPending ? "Salvando..." : "Salvar lição"}
      </Button>

      <div className="mt-6 border-t border-border pt-4">
        <ExerciseEditor
          lessonId={lessonId}
          exercises={lesson.exercises}
          onChanged={invalidateLesson}
        />
      </div>
    </div>
  );
}

function ExerciseEditor({
  lessonId,
  exercises,
  onChanged,
}: {
  lessonId: string;
  exercises: AdminExercise[];
  onChanged: () => void;
}) {
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
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteExercise = useMutation({
    mutationFn: (id: string) => apiFetch(`/v1/admin/exercises/${id}`, { method: "DELETE" }),
    onSuccess: onChanged,
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold">Exercícios (quiz) — {exercises.length}</h4>
        <Button
          size="sm"
          variant="outline"
          onClick={() => addExercise.mutate()}
          disabled={addExercise.isPending}
        >
          <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar
        </Button>
      </div>
      {exercises.map((ex) => (
        <ExerciseRow
          key={ex.id}
          exercise={ex}
          onDeleted={() => deleteExercise.mutate(ex.id)}
          onSaved={onChanged}
        />
      ))}
      {exercises.length === 0 && (
        <p className="text-xs text-muted-foreground">Sem exercícios nesta lição.</p>
      )}
    </div>
  );
}

function ExerciseRow({
  exercise,
  onDeleted,
  onSaved,
}: {
  exercise: AdminExercise;
  onDeleted: () => void;
  onSaved: () => void;
}) {
  const [prompt, setPrompt] = useState(exercise.prompt);
  const [options, setOptions] = useState((exercise.data?.options ?? []).join(" | "));
  const [correctIndex, setCorrectIndex] = useState(exercise.correct_answer?.index ?? 0);
  const [xpReward, setXpReward] = useState(exercise.xp_reward);

  // Resync local fields if the server row changes under us (e.g. another
  // admin edits it, or a refetch returns updated data) — useState's initial
  // value only applies on mount, so without this the form would keep
  // showing stale values after the first render.
  useEffect(() => {
    setPrompt(exercise.prompt);
    setOptions((exercise.data?.options ?? []).join(" | "));
    setCorrectIndex(exercise.correct_answer?.index ?? 0);
    setXpReward(exercise.xp_reward);
  }, [exercise]);

  const save = useMutation({
    mutationFn: () => {
      const parsedOptions = options
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean);
      if (correctIndex < 0 || correctIndex >= parsedOptions.length) {
        throw new Error(
          `Índice da resposta correta (${correctIndex}) precisa estar entre 0 e ${parsedOptions.length - 1}.`,
        );
      }
      return apiFetch(`/v1/admin/exercises/${exercise.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          prompt,
          data: { options: parsedOptions },
          correctAnswer: { index: correctIndex },
          xpReward,
        }),
      });
    },
    onSuccess: () => {
      toast.success("Exercício salvo");
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-2 rounded-xl border border-border p-3">
      <Input
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Pergunta"
        className="text-sm"
      />
      <Input
        value={options}
        onChange={(e) => setOptions(e.target.value)}
        placeholder="Opções separadas por |"
        className="text-xs"
      />
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-xs text-muted-foreground">Correta (índice)</label>
        <Input
          type="number"
          min={0}
          value={correctIndex}
          onChange={(e) => setCorrectIndex(Number(e.target.value))}
          className="w-16 text-xs"
        />
        <label className="text-xs text-muted-foreground">XP</label>
        <Input
          type="number"
          min={0}
          value={xpReward}
          onChange={(e) => setXpReward(Number(e.target.value))}
          className="w-16 text-xs"
        />
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending}>
          Salvar
        </Button>
        <Button size="sm" variant="outline" onClick={onDeleted}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
