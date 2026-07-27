import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import {
  CEFR_LEVELS,
  type CefrLevel,
  cefrRank,
  useLevelExam,
  useMaxUnlockedLevel,
  useMinExamScore,
} from "@/lib/level-access";
import { apiFetch } from "@/lib/api/client";
import { toast } from "sonner";
import { CheckCircle2, Lock, Trophy, XCircle, ArrowLeft } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/level-exam/$level")({
  component: LevelExamPage,
  head: ({ params }) => ({
    meta: [
      { title: `Exame final ${params.level} — Learning English with Coach` },
      { name: "description", content: `Exame final do nível ${params.level}. Passe para desbloquear o próximo nível CEFR.` },
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
  const canTake = !!unlocked && cefrRank(level) === cefrRank(unlocked); // exam of CURRENT level only

  if (loading || uLoading || eLoading) {
    return <FullBleed>Carregando…</FullBleed>;
  }
  if (!user) {
    return (
      <FullBleed>
        <p className="mb-4">Precisa de sessão iniciada para fazer o exame.</p>
        <Button asChild><Link to="/auth">Entrar</Link></Button>
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
          Só pode fazer o exame do seu nível atual{unlocked ? ` (${unlocked})` : ""}. Termine o nível atual
          antes de tentar {level}.
        </p>
        <Button asChild variant="outline"><Link to="/cefr-levels"><ArrowLeft className="w-4 h-4 mr-2" />Voltar aos níveis</Link></Button>
      </FullBleed>
    );
  }

  const submit = async () => {
    if (Object.keys(answers).length !== questions.length) {
      toast.error("Responda a todas as perguntas.");
      return;
    }
    setSubmitting(true);
    let outcome: { score: number; passed: boolean };
    try {
      outcome = await apiFetch<{ score: number; passed: boolean }>(
        `/v1/assessments/level-exam/${level}`,
        { method: "POST", body: JSON.stringify({ answers }) },
      );
    } catch {
      setSubmitting(false);
      toast.error("Falha ao guardar tentativa.");
      return;
    }
    setSubmitting(false);
    const { score, passed } = outcome;
    setResult({ score, passed });
    qc.invalidateQueries({ queryKey: ["max_unlocked_level"] });
    qc.invalidateQueries({ queryKey: ["level_attempts"] });
    if (passed) toast.success(`Aprovado com ${score}%! Próximo nível desbloqueado.`);
    else toast.error(`Nota ${score}% — mínimo ${minScore}%. Pode tentar novamente.`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-2xl">
        <div className="mb-6">
          <Link to="/cefr-levels" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
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
              {result.passed ? `Aprovado! Nível seguinte desbloqueado.` : `Não atingiu a nota mínima (${minScore}%).`}
            </p>
            <div className="flex gap-3 justify-center">
              <Button asChild><Link to="/cefr-levels">Ver níveis</Link></Button>
              {!result.passed && (
                <Button variant="outline" onClick={() => { setResult(null); setAnswers({}); }}>
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
                <div className="font-medium mb-3">{i + 1}. {q.q}</div>
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
      <SiteFooter />
    </div>
  );
}

function FullBleed({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-16 max-w-xl flex flex-col items-center justify-center text-center">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
