import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Plus, Copy, Trash2, LogIn, LogOut, ArrowLeft, GraduationCap } from "lucide-react";
import { useNotification } from "@/lib/notifications/notification-provider";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { useLocale } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api/client";
import { SITE_URL } from "@/lib/site-url";

export const Route = createFileRoute("/classes")({
  component: ClassesPage,
  head: () => ({
    meta: [
      { title: "Turmas — Learning English with Coach" },
      {
        name: "description",
        content:
          "Crie uma turma e acompanhe o progresso de outros alunos, ou entre numa turma existente.",
      },
      { property: "og:url", content: `${SITE_URL}/classes` },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

type OwnedClass = {
  id: string;
  name: string;
  invite_code: string;
  member_count: number;
  created_at: string;
};
type JoinedClass = { id: string; name: string; owner_name: string; created_at: string };
type MyClasses = { owned: OwnedClass[]; joined: JoinedClass[] };
type RosterRow = {
  student_id: string;
  full_name: string | null;
  age: number | null;
  cefr_level: string | null;
  xp: number;
  streak_days: number;
  completed_lessons: number;
  joined_at: string;
};

function ClassesPage() {
  const { locale } = useLocale();
  const notify = useNotification();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [selectedClass, setSelectedClass] = useState<OwnedClass | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const { data, isLoading } = useQuery({
    queryKey: ["my_classes", user?.id],
    enabled: !!user,
    queryFn: () => apiFetch<MyClasses>("/v1/me/classes"),
  });

  const { data: roster = [], isLoading: rosterLoading } = useQuery({
    queryKey: ["class_roster", selectedClass?.id],
    enabled: !!selectedClass,
    queryFn: () => apiFetch<RosterRow[]>(`/v1/classes/${selectedClass!.id}/roster`),
  });

  const createClass = useMutation({
    mutationFn: () =>
      apiFetch<OwnedClass>("/v1/classes", { method: "POST", body: JSON.stringify({ name }) }),
    onSuccess: () => {
      setName("");
      qc.invalidateQueries({ queryKey: ["my_classes", user?.id] });
      notify.success(locale === "pt" ? "Turma criada!" : "Class created!");
    },
    onError: (e) => notify.fromError(e, { dedupeKey: "classes:create" }),
  });

  const joinClass = useMutation({
    mutationFn: () =>
      apiFetch("/v1/classes/join", { method: "POST", body: JSON.stringify({ inviteCode: code }) }),
    onSuccess: () => {
      setCode("");
      qc.invalidateQueries({ queryKey: ["my_classes", user?.id] });
      notify.success(locale === "pt" ? "Você entrou na turma!" : "You joined the class!");
    },
    onError: (e) => notify.fromError(e, { dedupeKey: "classes:join" }),
  });

  const deleteClass = useMutation({
    mutationFn: (id: string) => apiFetch(`/v1/classes/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      setSelectedClass(null);
      qc.invalidateQueries({ queryKey: ["my_classes", user?.id] });
      notify.success(locale === "pt" ? "Turma apagada" : "Class deleted");
    },
    onError: (e) => notify.fromError(e, { dedupeKey: "classes:delete" }),
  });

  const removeMember = useMutation({
    mutationFn: (studentId: string) =>
      apiFetch(`/v1/classes/${selectedClass!.id}/members/${studentId}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["class_roster", selectedClass?.id] });
      qc.invalidateQueries({ queryKey: ["my_classes", user?.id] });
    },
    onError: (e) => notify.fromError(e, { dedupeKey: "classes:remove-member" }),
  });

  const leaveClass = useMutation({
    mutationFn: (classId: string) => apiFetch(`/v1/classes/${classId}/leave`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my_classes", user?.id] });
      notify.success(locale === "pt" ? "Você saiu da turma" : "You left the class");
    },
    onError: (e) => notify.fromError(e, { dedupeKey: "classes:leave" }),
  });

  if (loading || !user) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="p-16 text-center text-muted-foreground">Loading…</div>
      </div>
    );
  }

  const owned = data?.owned ?? [];
  const joined = data?.joined ?? [];

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-6 py-10">
        {selectedClass ? (
          <div>
            <button
              onClick={() => setSelectedClass(null)}
              className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              {locale === "pt" ? "Voltar" : "Back"}
            </button>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="font-display text-3xl font-bold">{selectedClass.name}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {locale === "pt" ? "Código de convite:" : "Invite code:"}{" "}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedClass.invite_code);
                      notify.success(locale === "pt" ? "Código copiado" : "Code copied");
                    }}
                    className="inline-flex items-center gap-1 font-mono font-bold text-magenta"
                  >
                    {selectedClass.invite_code} <Copy className="h-3 w-3" />
                  </button>
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={deleteClass.isPending}
                    className="text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="mr-1.5 h-4 w-4" />
                    {locale === "pt" ? "Apagar turma" : "Delete class"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {locale === "pt" ? "Apagar esta turma?" : "Delete this class?"}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {locale === "pt"
                        ? "Esta ação não pode ser desfeita. Todos os alunos serão removidos da turma."
                        : "This action can't be undone. All students will be removed from the class."}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{locale === "pt" ? "Cancelar" : "Cancel"}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteClass.mutate(selectedClass.id)}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      {locale === "pt" ? "Apagar" : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <div className="mt-8 rounded-2xl border border-border bg-card shadow-card">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{locale === "pt" ? "Nome" : "Name"}</TableHead>
                      <TableHead>{locale === "pt" ? "Idade" : "Age"}</TableHead>
                      <TableHead>CEFR</TableHead>
                      <TableHead>XP</TableHead>
                      <TableHead>{locale === "pt" ? "Sequência" : "Streak"}</TableHead>
                      <TableHead>{locale === "pt" ? "Lições" : "Lessons"}</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rosterLoading && (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="py-10 text-center text-sm text-muted-foreground"
                        >
                          {locale === "pt" ? "A carregar…" : "Loading…"}
                        </TableCell>
                      </TableRow>
                    )}
                    {!rosterLoading && roster.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="py-10 text-center text-sm text-muted-foreground"
                        >
                          {locale === "pt"
                            ? "Sem alunos ainda. Partilhe o código de convite!"
                            : "No students yet. Share the invite code!"}
                        </TableCell>
                      </TableRow>
                    )}
                    {!rosterLoading && roster.map((r) => (
                      <TableRow key={r.student_id}>
                        <TableCell className="font-medium">{r.full_name || "—"}</TableCell>
                        <TableCell>{r.age ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{r.cefr_level || "—"}</Badge>
                        </TableCell>
                        <TableCell>{r.xp.toLocaleString()}</TableCell>
                        <TableCell>{r.streak_days}</TableCell>
                        <TableCell>{r.completed_lessons}</TableCell>
                        <TableCell>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button
                                disabled={removeMember.isPending}
                                className="text-xs font-semibold text-red-400 hover:text-red-600 disabled:opacity-50"
                              >
                                {locale === "pt" ? "Remover" : "Remove"}
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {locale === "pt"
                                    ? `Remover ${r.full_name || "aluno"} da turma?`
                                    : `Remove ${r.full_name || "student"} from class?`}
                                </AlertDialogTitle>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{locale === "pt" ? "Cancelar" : "Cancel"}</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => removeMember.mutate(r.student_id)}
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  {locale === "pt" ? "Remover" : "Remove"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-violet/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-violet">
                <Users className="h-3.5 w-3.5" />
                {locale === "pt" ? "Turmas" : "Classes"}
              </div>
              <h1 className="mt-3 font-display text-4xl font-bold">
                {locale === "pt"
                  ? "Acompanhe o progresso de quem estuda com você"
                  : "Track progress for the people you coach"}
              </h1>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                {locale === "pt"
                  ? "Crie uma turma e partilhe o código de convite com os seus alunos ou filhos — sem aprovação, sem papéis especiais."
                  : "Create a class and share the invite code with your students or kids — no approval, no special roles."}
              </p>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
                <h2 className="font-display text-lg font-bold">
                  {locale === "pt" ? "Minhas turmas" : "My classes"}
                </h2>
                <form
                  className="mt-4 flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (name.trim()) createClass.mutate();
                  }}
                >
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value.slice(0, 200))}
                    placeholder={
                      locale === "pt"
                        ? "Nome da turma (ex: Turma A1)"
                        : "Class name (e.g. A1 Class)"
                    }
                  />
                  <Button type="submit" disabled={!name.trim() || createClass.isPending}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </form>

                <div className="mt-5 space-y-3">
                  {isLoading && <p className="text-xs text-muted-foreground">Loading…</p>}
                  {!isLoading && owned.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      {locale === "pt"
                        ? "Você ainda não criou nenhuma turma."
                        : "You haven't created a class yet."}
                    </p>
                  )}
                  {owned.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedClass(c)}
                      className="flex w-full items-center justify-between rounded-xl border border-border bg-background p-4 text-left transition-colors hover:bg-muted/40"
                    >
                      <div>
                        <p className="font-semibold">{c.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.member_count} {locale === "pt" ? "aluno(s)" : "student(s)"} ·{" "}
                          {c.invite_code}
                        </p>
                      </div>
                      <GraduationCap className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
                  <h2 className="font-display text-lg font-bold">
                    {locale === "pt" ? "Entrar numa turma" : "Join a class"}
                  </h2>
                  <form
                    className="mt-4 flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (code.trim()) joinClass.mutate();
                    }}
                  >
                    <Input
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 20))}
                      placeholder={locale === "pt" ? "Código de convite" : "Invite code"}
                      className="font-mono uppercase"
                    />
                    <Button type="submit" disabled={!code.trim() || joinClass.isPending}>
                      <LogIn className="h-4 w-4" />
                    </Button>
                  </form>
                </div>

                <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
                  <h2 className="font-display text-lg font-bold">
                    {locale === "pt" ? "Turmas que participo" : "Classes I'm in"}
                  </h2>
                  <div className="mt-4 space-y-2">
                    {joined.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        {locale === "pt"
                          ? "Você ainda não entrou em nenhuma turma."
                          : "You haven't joined a class yet."}
                      </p>
                    )}
                    {joined.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between gap-2 rounded-xl border border-border bg-background p-3 text-sm"
                      >
                        <div className="min-w-0">
                          <div className="truncate font-medium">{c.name}</div>
                          <div className="truncate text-xs text-muted-foreground">{c.owner_name}</div>
                        </div>
                        <button
                          onClick={() => leaveClass.mutate(c.id)}
                          disabled={leaveClass.isPending}
                          title={locale === "pt" ? "Sair da turma" : "Leave class"}
                          className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                        >
                          <LogOut className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
