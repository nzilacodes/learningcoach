import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { VideosSidebar, VideosMobileNav } from "@/components/videos/videos-sidebar";
import {
  HeaderActionLinks,
  MobileAvatarMenu,
  DesktopAvatarLink,
} from "@/components/mobile-avatar-menu";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import {
  CEFR_LEVELS,
  type CefrLevel,
  cefrRank,
  levelAccessQueryKey,
  useLevelExam,
  useMaxUnlockedLevel,
  useMinExamScore,
} from "@/lib/level-access";
import { apiFetch } from "@/lib/api/client";
import { useNotification } from "@/lib/notifications/notification-provider";
import { CheckCircle2, Lock, Trophy, XCircle, ArrowLeft } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/level-exam/$level")({
  component: LevelExamPage,
  head: ({ params }) => ({
    meta: [
      { title: `Exame final ${params.level} — Learning English with Coach` },
      {
        name: "description",
        content: `Exame final do nível ${params.level}. Passe para desbloquear o próximo nível CEFR.`,
      },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});

type Question = { q: string; opts: string[] };

function LevelExamPage() {
  const { level: raw } = Route.useParams();
  const level = raw.toUpperCase() as CefrLevel;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const notify = useNotification();
  const { user, loading } = useAuth();
  const { data: unlocked, isLoading: uLoading } = useMaxUnlockedLevel();
  const { data: exam, isLoading: eLoading } = useLevelExam(level);
  const { data: minScore = 70 } = useMinExamScore();

  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const questions: Question[] = useMemo(
    () => (Array.isArray(exam?.questions) ? (exam!.questions as unknown as Question[]) : []),
    [exam],
  );

  const isValidLevel = (CEFR_LEVELS as readonly string[]).includes(level);
  // Before the placement diagnostic, `unlocked` is null — default to A1 so
  // the A1 exam is reachable pre-diagnostic too (same fallback used across
  // curriculum.tsx/cefr-levels.tsx). Exam of CURRENT level only.
  const canTake = cefrRank(level) === cefrRank(unlocked ?? "A1");

  if (loading || uLoading || eLoading) {
    return <FullBleed>Carregando…</FullBleed>;
  }
  if (!user) {
    return (
      <FullBleed>
        <p className="mb-4">Precisa de sessão iniciada para fazer o exame.</p>
        <Button asChild>
          <Link to="/auth">Entrar</Link>
        </Button>
      </FullBleed>
    );
  }
  if (!isValidLevel) {
    return <FullBleed>Nível inválido.</FullBleed>;
  }
  if (!canTake) {
    return (
      <FullBleed>
        <Lock className="w-10 h-10 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Exame bloqueado</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Só pode fazer o exame do seu nível atual{unlocked ? ` (${unlocked})` : ""}. Termine o
          nível atual antes de tentar {level}.
        </p>
        <Button asChild variant="outline">
          <Link to="/cefr-levels">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar aos níveis
          </Link>
        </Button>
      </FullBleed>
    );
  }
  if (questions.length === 0) {
    return (
      <FullBleed>
        <XCircle className="w-10 h-10 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Não foi possível carregar o exame</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Não há perguntas disponíveis para este exame agora. Tente recarregar a página ou volte
          mais tarde.
        </p>
        <Button asChild variant="outline">
          <Link to="/cefr-levels">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar aos níveis
          </Link>
        </Button>
      </FullBleed>
    );
  }

  const submit = async () => {
    if (questions.length === 0) {
      notify.warning("Não foi possível carregar as perguntas do exame. Tente recarregar a página.");
      return;
    }
    if (Object.keys(answers).length !== questions.length) {
      notify.warning("Responda a todas as perguntas.");
      return;
    }
    setSubmitting(true);
    let outcome: { score: number; passed: boolean };
    try {
      outcome = await apiFetch<{ score: number; passed: boolean }>(
        `/v1/assessments/level-exam/${level}`,
        { method: "POST", body: JSON.stringify({ answers }) },
      );
    } catch (e) {
      setSubmitting(false);
      notify.fromError(e, { dedupeKey: "level-exam:submit", onRetry: submit });
      return;
    }
    setSubmitting(false);
    const { score, passed } = outcome;
    setResult({ score, passed });
    // Was invalidating "max_unlocked_level", a key nothing ever registered
    // under (a silent no-op) — the real query key lives in level-access.ts,
    // exported precisely so this can't drift out of sync again.
    qc.invalidateQueries({ queryKey: levelAccessQueryKey(user?.id) });
    if (passed) notify.success(`Aprovado com ${score}%! Próximo nível desbloqueado.`);
    else notify.warning(`Nota ${score}% — mínimo ${minScore}%. Pode tentar novamente.`);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      <VideosSidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <header className="h-16 flex items-center justify-between px-4 md:px-6 bg-white border-b border-gray-100 shrink-0 z-10">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="font-display text-xl font-bold text-[var(--ink)] truncate">
              Exame final
            </h2>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <HeaderActionLinks />
            <MobileAvatarMenu />
            <DesktopAvatarLink />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto pb-20 md:pb-6 scrollbar-hide container mx-auto px-4 py-10 max-w-2xl">
          <div className="mb-6">
            <Link
              to="/cefr-levels"
              className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> Níveis
            </Link>
          </div>

          <h1 className="text-3xl font-bold mb-2">Exame final {level}</h1>
          <p className="text-muted-foreground mb-8">
            Nota mínima: <strong>{minScore}%</strong>. Passar desbloqueia o próximo nível CEFR.
          </p>

          {result ? (
            <div className="rounded-2xl border p-8 text-center bg-card">
              {result.passed ? (
                <Trophy className="w-14 h-14 mx-auto text-primary mb-4" />
              ) : (
                <XCircle className="w-14 h-14 mx-auto text-destructive mb-4" />
              )}
              <div className="text-4xl font-bold mb-2">{result.score}%</div>
              <p className="text-lg mb-6">
                {result.passed
                  ? `Aprovado! Nível seguinte desbloqueado.`
                  : `Não atingiu a nota mínima (${minScore}%).`}
              </p>
              <div className="flex gap-3 justify-center">
                <Button asChild>
                  <Link to="/cefr-levels">Ver níveis</Link>
                </Button>
                {!result.passed && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setResult(null);
                      setAnswers({});
                    }}
                  >
                    Tentar novamente
                  </Button>
                )}
                {result.passed && (
                  <Button variant="outline" onClick={() => navigate({ to: "/dashboard" })}>
                    Ir para o Dashboard
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {questions.map((q, i) => (
                <div key={i} className="rounded-xl border p-5 bg-card">
                  <div className="font-medium mb-3">
                    {i + 1}. {q.q}
                  </div>
                  <div className="grid gap-2">
                    {q.opts.map((opt, j) => {
                      const active = answers[i] === j;
                      return (
                        <button
                          key={j}
                          type="button"
                          onClick={() => setAnswers((a) => ({ ...a, [i]: j }))}
                          className={`text-left px-4 py-2 rounded-lg border transition ${active ? "border-primary bg-primary/10" : "hover:bg-accent"}`}
                        >
                          <span className="inline-flex items-center gap-2">
                            {active && <CheckCircle2 className="w-4 h-4 text-primary" />}
                            {opt}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              <Button size="lg" className="w-full" onClick={submit} disabled={submitting}>
                {submitting ? "A submeter…" : "Submeter exame"}
              </Button>
            </div>
          )}
        </main>
      </div>
      <VideosMobileNav />
    </div>
  );
}

// Same app-shell wrapper placement.tsx (the other test flow) already uses.
function FullBleed({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      <VideosSidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <header className="h-16 flex items-center justify-between px-4 md:px-6 bg-white border-b border-gray-100 shrink-0 z-10">
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="font-display text-xl font-bold text-[var(--ink)] truncate">
              Exame final
            </h1>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <HeaderActionLinks />
            <MobileAvatarMenu />
            <DesktopAvatarLink />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto pb-20 md:pb-6 scrollbar-hide container mx-auto px-4 py-16 max-w-xl flex flex-col items-center justify-center text-center">
          {children}
        </main>
      </div>
      <VideosMobileNav />
    </div>
  );
}
