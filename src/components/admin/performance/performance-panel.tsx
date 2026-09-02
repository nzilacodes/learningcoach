import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Gauge, History } from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";
import { useLocale } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { AdminDataTable, type AdminDataTableColumn } from "@/components/admin/admin-data-table";

type StudentPerformance = {
  id: string;
  email: string;
  full_name: string | null;
  cefr_level: string | null;
  xp: number;
  streak: number;
  attempts: number;
  avg_score: number | null;
  pass_rate: number | null;
  last_attempt_at: string | null;
};

type StudentAttempt = {
  id: string;
  lesson_id: string;
  lesson_title: string;
  score: number;
  passed: boolean;
  correct_count: number;
  total_count: number;
  xp_awarded: number;
  created_at: string;
};

function AttemptsSheet({ studentId, onClose }: { studentId: string | null; onClose: () => void }) {
  const { locale } = useLocale();
  const { data: attempts = [], isLoading } = useQuery({
    queryKey: ["admin_student_attempts", studentId],
    queryFn: () =>
      apiFetch<StudentAttempt[]>(`/v1/admin/performance/students/${studentId}/attempts`),
    enabled: !!studentId,
  });

  return (
    <Sheet open={!!studentId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{locale === "pt" ? "Histórico de tentativas" : "Attempt history"}</SheetTitle>
          <SheetDescription>
            {locale === "pt"
              ? "Últimas lições tentadas por este aluno, mais recentes primeiro."
              : "This learner's most recent lesson attempts, newest first."}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4 space-y-2">
          {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
          {!isLoading && attempts.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {locale === "pt" ? "Sem tentativas registadas." : "No attempts recorded."}
            </p>
          )}
          {attempts.map((a) => (
            <div key={a.id} className="rounded-xl border border-gray-100 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-ink">{a.lesson_title}</span>
                <Badge
                  variant={a.passed ? "default" : "outline"}
                  className={a.passed ? "bg-emerald-500" : ""}
                >
                  {a.score}%
                </Badge>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {a.correct_count}/{a.total_count} {locale === "pt" ? "corretas" : "correct"} · +
                  {a.xp_awarded} XP
                </span>
                <span>
                  {new Date(a.created_at).toLocaleDateString(locale === "pt" ? "pt-AO" : "en-US")}
                </span>
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function PerformancePanel() {
  const { locale } = useLocale();
  const { user, isAdmin } = useAuth();
  const [openStudentId, setOpenStudentId] = useState<string | null>(null);

  const { data: students = [] } = useQuery({
    queryKey: ["admin_performance_students"],
    enabled: !!user && isAdmin,
    queryFn: async () =>
      (await apiFetch<{ items: StudentPerformance[] }>("/v1/admin/performance/students?limit=200"))
        .items,
  });

  const columns: AdminDataTableColumn<StudentPerformance>[] = [
    {
      key: "student",
      header: locale === "pt" ? "Aluno" : "Learner",
      sortable: true,
      sortValue: (s) => s.full_name ?? "",
      render: (s) => (
        <div>
          <div className="font-medium">{s.full_name || "—"}</div>
          <div className="text-xs text-muted-foreground">{s.email}</div>
        </div>
      ),
    },
    {
      key: "cefr",
      header: "CEFR",
      render: (s) => <Badge variant="outline">{s.cefr_level || "—"}</Badge>,
    },
    {
      key: "attempts",
      header: locale === "pt" ? "Lições tentadas" : "Attempts",
      sortable: true,
      sortValue: (s) => s.attempts,
      render: (s) => s.attempts,
    },
    {
      key: "avg_score",
      header: locale === "pt" ? "Nota média" : "Avg score",
      sortable: true,
      sortValue: (s) => s.avg_score ?? -1,
      render: (s) => (s.avg_score != null ? `${s.avg_score}%` : "—"),
    },
    {
      key: "pass_rate",
      header: locale === "pt" ? "Taxa de aprovação" : "Pass rate",
      sortable: true,
      sortValue: (s) => s.pass_rate ?? -1,
      render: (s) => (s.pass_rate != null ? `${s.pass_rate}%` : "—"),
    },
    {
      key: "xp",
      header: "XP",
      sortable: true,
      sortValue: (s) => s.xp,
      render: (s) => s.xp,
    },
    {
      key: "streak",
      header: locale === "pt" ? "Streak" : "Streak",
      sortable: true,
      sortValue: (s) => s.streak,
      render: (s) => `${s.streak}d`,
    },
    {
      key: "last_attempt",
      header: locale === "pt" ? "Última atividade" : "Last activity",
      sortable: true,
      sortValue: (s) => s.last_attempt_at ?? "",
      render: (s) => (
        <span className="text-xs text-muted-foreground">
          {s.last_attempt_at
            ? new Date(s.last_attempt_at).toLocaleDateString(locale === "pt" ? "pt-AO" : "en-US")
            : "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (s) => (
        <Button size="sm" variant="outline" onClick={() => setOpenStudentId(s.id)}>
          <History className="mr-1 h-3.5 w-3.5" /> {locale === "pt" ? "Ver histórico" : "History"}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h2 className="flex items-center gap-2 font-display text-2xl font-bold text-ink">
        <Gauge className="h-5 w-5 text-violet" />{" "}
        {locale === "pt" ? "Desempenho de alunos" : "Student performance"}
      </h2>
      <AdminDataTable
        columns={columns}
        data={students}
        getRowId={(s) => s.id}
        getSearchText={(s) => `${s.full_name ?? ""} ${s.email}`}
        searchPlaceholder={locale === "pt" ? "Pesquisar por aluno…" : "Search by learner…"}
        emptyLabel={locale === "pt" ? "Sem dados de desempenho" : "No performance data"}
      />
      <AttemptsSheet studentId={openStudentId} onClose={() => setOpenStudentId(null)} />
    </div>
  );
}
