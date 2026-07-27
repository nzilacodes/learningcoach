import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  Mic,
  Square,
  Loader2,
  BookOpen,
  Headphones,
  PenTool,
  MessageSquare,
  Volume2,
  GraduationCap,
  Target,
  Trophy,
  AlertCircle,
  HelpCircle,
  Gift,
  User,
  Settings,
  LogOut,
  Zap,
} from "lucide-react";
import { VideosSidebar, VideosMobileNav } from "@/components/videos/videos-sidebar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLocale } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useAwardXp } from "@/lib/learning";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  GRAMMAR,
  VOCABULARY,
  READING,
  LISTENING,
  WRITING,
  SPEAKING,
  PRONUNCIATION,
  CEFR_WEIGHT,
  type Cefr,
} from "@/lib/diagnostic-bank";

export const Route = createFileRoute("/placement")({
  component: DiagnosticPage,
  head: () => ({
    meta: [
      { title: "Diagnóstico completo — Learning English with Coach" },
      {
        name: "description",
        content:
          "Teste diagnóstico completo com 7 skills (Grammar, Vocabulary, Reading, Listening, Writing, Speaking, Pronunciation) e plano personalizado.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

/* ---------------- Types ---------------- */

type Section = "intro" | "grammar" | "vocab" | "reading" | "listening" | "writing" | "speaking" | "pron" | "loading" | "report";

interface Report {
  scores: {
    grammar: number;
    vocabulary: number;
    reading: number;
    listening: number;
    writing: number;
    speaking: number;
    pronunciation: number;
    overall: number;
  };
  cefr_level: Cefr;
  strengths: string[];
  weaknesses: string[];
  feedback: string;
  learning_plan: Array<{
    week: number;
    title: string;
    focus_skill: string;
    goals: string[];
    estimated_minutes: number;
  }>;
}

/* ---------------- Weighted MCQ scorer ---------------- */

function scoreMcq(items: { level: Cefr; correct: number }[], answers: (number | null)[]): number {
  const totalWeight = items.reduce((s, it) => s + CEFR_WEIGHT[it.level], 0);
  const earned = items.reduce(
    (s, it, i) => (answers[i] === it.correct ? s + CEFR_WEIGHT[it.level] : s),
    0,
  );
  return totalWeight ? Math.round((earned / totalWeight) * 100) : 0;
}

/* ---------------- Root component ---------------- */

function DiagnosticPage() {
  const { locale } = useLocale();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const awardXp = useAwardXp();

  const [section, setSection] = useState<Section>("intro");
  const [grammarAns, setGrammarAns] = useState<(number | null)[]>(GRAMMAR.map(() => null));
  const [vocabAns, setVocabAns] = useState<(number | null)[]>(VOCABULARY.map(() => null));
  const readingQs = useMemo(
    () => READING.flatMap((p) => p.questions.map((q) => ({ ...q, level: p.level }))),
    [],
  );
  const [readingAns, setReadingAns] = useState<(number | null)[]>(readingQs.map(() => null));
  const [listeningAns, setListeningAns] = useState<(number | null)[]>(LISTENING.map(() => null));
  const [writingAns, setWritingAns] = useState<string[]>(WRITING.map(() => ""));
  const [speakingAns, setSpeakingAns] = useState<string[]>(SPEAKING.map(() => ""));
  const [pronAns, setPronAns] = useState<string[]>(PRONUNCIATION.map(() => ""));
  const [report, setReport] = useState<Report | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  // Load latest saved report if it exists.
  useEffect(() => {
    if (!user) return;
    void (async () => {
      const { data } = await supabase
        .from("diagnostic_results")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        setReport({
          scores: {
            grammar: Number(data.grammar_score),
            vocabulary: Number(data.vocabulary_score),
            reading: Number(data.reading_score),
            listening: Number(data.listening_score),
            writing: Number(data.writing_score),
            speaking: Number(data.speaking_score),
            pronunciation: Number(data.pronunciation_score),
            overall: Number(data.overall_score),
          },
          cefr_level: data.cefr_level as Cefr,
          strengths: (data.strengths as string[]) ?? [],
          weaknesses: (data.weaknesses as string[]) ?? [],
          feedback: data.feedback ?? "",
          learning_plan: (data.learning_plan as Report["learning_plan"]) ?? [],
        });
      }
    })();
  }, [user]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const submit = async () => {
    if (!user) {
      toast.error(locale === "pt" ? "Sessão expirada. Entre novamente para submeter." : "Session expired. Sign in to submit.");
      navigate({ to: "/auth" });
      return;
    }
    setSection("loading");
    setSaveError(null);
    console.log("[placement] submitting evaluation…");


    const scores = {
      grammar: scoreMcq(GRAMMAR, grammarAns),
      vocabulary: scoreMcq(VOCABULARY, vocabAns),
      reading: scoreMcq(readingQs, readingAns),
      listening: scoreMcq(LISTENING, listeningAns),
    };

    // Get profile context for personalization.
    const { data: profile } = await supabase
      .from("profiles")
      .select("age,native_language,learning_goal,interests")
      .eq("id", user.id)
      .maybeSingle();

    try {
      const res = await fetch("/api/diagnostic-evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scores,
          writing: WRITING.map((w, i) => ({ id: w.id, prompt: w.prompt, text: writingAns[i] })),
          speaking: SPEAKING.map((s, i) => ({ id: s.id, prompt: s.prompt, transcript: speakingAns[i] })),
          pronunciation: PRONUNCIATION.map((p, i) => ({
            id: p.id,
            expected: p.sentence,
            transcribed: pronAns[i],
          })),
          profile: profile ?? {},
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as Report;

      // Persist to diagnostic_results.
      const { error: insErr } = await supabase.from("diagnostic_results").insert({
        user_id: user.id,
        cefr_level: data.cefr_level,
        overall_score: data.scores.overall,
        grammar_score: data.scores.grammar,
        vocabulary_score: data.scores.vocabulary,
        reading_score: data.scores.reading,
        listening_score: data.scores.listening,
        writing_score: data.scores.writing,
        speaking_score: data.scores.speaking,
        pronunciation_score: data.scores.pronunciation,
        strengths: data.strengths,
        weaknesses: data.weaknesses,
        feedback: data.feedback,
        learning_plan: data.learning_plan,
        raw_answers: {
          grammar: grammarAns,
          vocabulary: vocabAns,
          reading: readingAns,
          listening: listeningAns,
          writing: writingAns,
          speaking: speakingAns,
          pronunciation: pronAns,
        },
      });
      if (insErr) throw insErr;

      // Update profile: CEFR level + advance onboarding if still in placement.
      const { data: current } = await supabase
        .from("profiles")
        .select("onboarding_status")
        .eq("id", user.id)
        .maybeSingle();
      const patch: { cefr_level: string; onboarding_status?: string } = { cefr_level: data.cefr_level };
      if (current?.onboarding_status === "placement") patch.onboarding_status = "plan";
      await supabase.from("profiles").update(patch).eq("id", user.id);

      awardXp.mutate(150);
      setReport(data);
      setSection("report");
      toast.success(locale === "pt" ? `Nível ${data.cefr_level} identificado!` : `Level ${data.cefr_level} identified!`);
    } catch (e) {
      console.error("[placement] submit failed", e);
      setSaveError((e as Error).message);
      setSection("report");
      toast.error(locale === "pt" ? "Falha ao avaliar. Tente novamente." : "Evaluation failed. Try again.");
    }
  };


  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      <VideosSidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <header className="h-16 flex items-center justify-between px-4 md:px-6 bg-white border-b border-gray-100 shrink-0 z-10">
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="font-display text-xl font-bold text-[var(--ink)] truncate">
              {locale === "pt" ? "Diagnóstico" : "Placement Test"}
            </h1>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <button className="bg-[var(--ink)] text-white px-3 md:px-4 py-1.5 rounded-lg flex items-center gap-2 text-sm font-semibold hover:opacity-90 transition-opacity">
              <Zap className="w-4 h-4 text-yellow-400" fill="currentColor" />
              <span className="hidden sm:inline">Upgrade</span>
            </button>
            <button className="p-2 text-gray-500 hover:bg-gray-50 rounded-full transition-colors hidden sm:inline-flex">
              <HelpCircle className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-500 hover:bg-gray-50 rounded-full transition-colors hidden sm:inline-flex">
              <Gift className="w-5 h-5" />
            </button>
            <div className="relative md:hidden" ref={avatarRef}>
              {avatarMenuOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setAvatarMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-100 rounded-2xl shadow-2xl z-30 py-2 dropdown-enter premium-shadow">
                    <button className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-xs font-bold text-gray-600 transition-colors w-full text-left">
                      <User className="w-4 h-4 text-[var(--violet)]" />
                      {locale === "pt" ? "Ver perfil" : "View profile"}
                    </button>
                    <button className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-xs font-bold text-gray-600 transition-colors w-full text-left">
                      <Settings className="w-4 h-4 text-gray-400" />
                      {locale === "pt" ? "Definições" : "Settings"}
                    </button>
                    <div className="mx-3 my-1 h-px bg-gray-50" />
                    <button
                      onClick={() => signOut()}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-xs font-bold text-red-400 transition-colors w-full text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      {locale === "pt" ? "Sair da conta" : "Sign out"}
                    </button>
                  </div>
                </>
              )}
              <button
                onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
                className="relative inline-flex"
              >
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 block w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
              </button>
            </div>
            <div className="hidden md:block">
              <div className="relative inline-flex">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto pb-20 md:pb-6 scrollbar-hide">
          <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-10">
            {section === "intro" && (
              <Intro
                hasPrevious={!!report}
                onStart={() => setSection("grammar")}
                onSeeReport={() => setSection("report")}
              />
            )}

            {section === "grammar" && (
              <McqSection
                title={locale === "pt" ? "Gramática" : "Grammar"}
                icon={GraduationCap}
                items={GRAMMAR}
                answers={grammarAns}
                setAnswers={setGrammarAns}
                onNext={() => setSection("vocab")}
                onBack={() => setSection("intro")}
              />
            )}

            {section === "vocab" && (
              <McqSection
                title={locale === "pt" ? "Vocabulário" : "Vocabulary"}
                icon={BookOpen}
                items={VOCABULARY}
                answers={vocabAns}
                setAnswers={setVocabAns}
                onNext={() => setSection("reading")}
                onBack={() => setSection("grammar")}
              />
            )}

            {section === "reading" && (
              <ReadingSection
                answers={readingAns}
                setAnswers={setReadingAns}
                onNext={() => setSection("listening")}
                onBack={() => setSection("vocab")}
              />
            )}

            {section === "listening" && (
              <ListeningSection
                answers={listeningAns}
                setAnswers={setListeningAns}
                onNext={() => setSection("writing")}
                onBack={() => setSection("reading")}
              />
            )}

            {section === "writing" && (
              <WritingSection
                answers={writingAns}
                setAnswers={setWritingAns}
                onNext={() => setSection("speaking")}
                onBack={() => setSection("listening")}
              />
            )}

            {section === "speaking" && (
              <RecordSection
                kind="speaking"
                answers={speakingAns}
                setAnswers={setSpeakingAns}
                onNext={() => setSection("pron")}
                onBack={() => setSection("writing")}
              />
            )}

            {section === "pron" && (
              <RecordSection
                kind="pronunciation"
                answers={pronAns}
                setAnswers={setPronAns}
                onNext={submit}
                onBack={() => setSection("speaking")}
                nextLabel={locale === "pt" ? "Enviar & avaliar" : "Submit & evaluate"}
              />
            )}

            {section === "loading" && <Loading />}

            {section === "report" && report && (
              <ReportView
                report={report}
                error={saveError}
                onRetake={() => {
                  setGrammarAns(GRAMMAR.map(() => null));
                  setVocabAns(VOCABULARY.map(() => null));
                  setReadingAns(readingQs.map(() => null));
                  setListeningAns(LISTENING.map(() => null));
                  setWritingAns(WRITING.map(() => ""));
                  setSpeakingAns(SPEAKING.map(() => ""));
                  setPronAns(PRONUNCIATION.map(() => ""));
                  setSection("grammar");
                }}
                onContinue={() => navigate({ to: "/dashboard" })}
              />
            )}
          </div>
        </main>
      </div>
      <VideosMobileNav />
    </div>
  );
}

/* ---------------- Intro ---------------- */

function Intro({ hasPrevious, onStart, onSeeReport }: { hasPrevious: boolean; onStart: () => void; onSeeReport: () => void }) {
  const { locale } = useLocale();
  const items = [
    { icon: GraduationCap, label: locale === "pt" ? "Gramática" : "Grammar" },
    { icon: BookOpen, label: locale === "pt" ? "Vocabulário" : "Vocabulary" },
    { icon: BookOpen, label: locale === "pt" ? "Leitura" : "Reading" },
    { icon: Headphones, label: locale === "pt" ? "Compreensão" : "Listening" },
    { icon: PenTool, label: locale === "pt" ? "Escrita" : "Writing" },
    { icon: MessageSquare, label: locale === "pt" ? "Fala" : "Speaking" },
    { icon: Volume2, label: locale === "pt" ? "Pronúncia" : "Pronunciation" },
  ];
  return (
    <>
      {/* ========= MOBILE layout ========= */}
      <div className="md:hidden">
        {/* Hero */}
        <section className="flex flex-col items-center text-center pt-8 pb-6 px-1">
          <div className="w-20 h-20 mb-6 relative">
            <div className="absolute inset-0 bg-[var(--violet)]/10 rounded-full blur-2xl" />
            <div className="relative bg-white rounded-3xl p-5 shadow-sm flex items-center justify-center border border-gray-100">
              <Sparkles className="h-9 w-9 text-[var(--violet)]" />
            </div>
          </div>
          <h1 className="font-display text-[32px] font-semibold text-[var(--ink)] mb-2 tracking-tight leading-tight">
            {locale === "pt" ? "Diagnóstico completo" : "Full diagnostic"}
          </h1>
          <p className="text-sm text-gray-500 max-w-[280px]">
            {locale === "pt"
              ? "Avaliação em 7 skills com plano personalizado."
              : "7-skill assessment with personalized plan."}
          </p>
        </section>

        {/* Skills Bento Grid */}
        <section className="pb-36">
          <div className="grid grid-cols-2 gap-3">
            {items.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col gap-3 hover:border-[var(--violet)]/50 transition-all shadow-sm">
                  <Icon className="h-6 w-6 text-[var(--violet)]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
          {hasPrevious && (
            <button
              onClick={onSeeReport}
              className="mt-4 w-full text-center text-xs font-semibold text-[var(--violet)] hover:opacity-80 transition-opacity py-2"
            >
              {locale === "pt" ? "Ver último relatório" : "View last report"}
            </button>
          )}
        </section>

        {/* Fixed CTA */}
        <div className="fixed bottom-20 left-0 right-0 px-4 py-4 z-40 bg-gradient-to-t from-[var(--background)] via-[var(--background)] to-transparent">
          <button
            onClick={onStart}
            className="w-full bg-gradient-to-r from-[var(--violet)] to-[var(--magenta)] text-white py-4 rounded-2xl font-semibold shadow-lg shadow-[var(--violet)]/20 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm"
          >
            {locale === "pt" ? "Começar" : "Start"}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ========= DESKTOP layout ========= */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-100 p-8 md:p-12 text-center premium-shadow">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-[var(--violet)] to-[var(--magenta)] shadow-md">
          <Sparkles className="h-8 w-8 text-white" />
        </div>
        <h1 className="mt-6 font-display text-4xl font-bold text-[var(--ink)]">
          {locale === "pt" ? "Diagnóstico completo" : "Full diagnostic"}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-gray-500">
          {locale === "pt"
            ? "Avaliação em 7 skills. Duração: ~15 minutos. Vai usar o microfone para as secções de fala e pronúncia."
            : "7-skill assessment. ~15 minutes. Uses your microphone for speaking and pronunciation."}
        </p>
        <div className="mx-auto mt-8 grid max-w-2xl grid-cols-2 gap-2 text-left sm:grid-cols-3">
          {items.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50/80 p-3 text-sm text-gray-600">
                <Icon className="h-4 w-4 text-[var(--violet)]" />
                {s.label}
              </div>
            );
          })}
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" onClick={onStart} className="bg-gradient-to-r from-[var(--violet)] to-[var(--magenta)] text-white shadow-md hover:opacity-90">
            {locale === "pt" ? "Começar" : "Start"} <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
          {hasPrevious && (
            <Button variant="outline" size="lg" onClick={onSeeReport}>
              {locale === "pt" ? "Ver último relatório" : "View last report"}
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

/* ---------------- MCQ Section (Grammar/Vocab) ---------------- */

function McqSection({
  title,
  icon: Icon,
  items,
  answers,
  setAnswers,
  onNext,
  onBack,
}: {
  title: string;
  icon: typeof BookOpen;
  items: { id: string; prompt: string; options: string[] }[];
  answers: (number | null)[];
  setAnswers: (a: (number | null)[]) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const { locale } = useLocale();
  const complete = answers.every((a) => a !== null);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-8 premium-shadow">
      <SectionHeader icon={Icon} title={title} />
      <div className="mt-6 space-y-6">
        {items.map((it, i) => (
          <div key={it.id}>
            <div className="text-sm font-semibold text-gray-500">
              {i + 1}. {it.prompt}
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {it.options.map((opt, oi) => {
                const active = answers[i] === oi;
                return (
                  <button
                    key={oi}
                    onClick={() => {
                      const next = [...answers];
                      next[i] = oi;
                      setAnswers(next);
                    }}
                    className={`flex items-center justify-between rounded-xl border-2 p-3 text-left text-sm transition ${
                      active ? "border-[var(--violet)] bg-[var(--violet)]/10" : "border-gray-200 bg-gray-50/80 hover:border-[var(--violet)]/50"
                    }`}
                  >
                    <span>{opt}</span>
                    {active && <Check className="h-4 w-4 text-[var(--violet)]" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <NavBar onBack={onBack} onNext={onNext} disabled={!complete} disabledMsg={locale === "pt" ? "Responda a todas" : "Answer all"} />
    </div>
  );
}

/* ---------------- Reading Section ---------------- */

function ReadingSection({
  answers,
  setAnswers,
  onNext,
  onBack,
}: {
  answers: (number | null)[];
  setAnswers: (a: (number | null)[]) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const { locale } = useLocale();
  const complete = answers.every((a) => a !== null);
  let qIndex = 0;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-8 premium-shadow">
      <SectionHeader icon={BookOpen} title={locale === "pt" ? "Leitura" : "Reading"} />
      <div className="mt-6 space-y-8">
        {READING.map((p) => (
          <div key={p.id} className="rounded-2xl border border-gray-100 bg-gray-50/80 p-5">
            <div className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--violet)]">{p.level}</div>
            <p className="text-sm leading-relaxed text-gray-700">{p.passage}</p>
            <div className="mt-4 space-y-4">
              {p.questions.map((q) => {
                const currentIdx = qIndex++;
                return (
                  <div key={currentIdx}>
                    <div className="text-sm font-semibold text-gray-700">{q.prompt}</div>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {q.options.map((opt, oi) => {
                        const active = answers[currentIdx] === oi;
                        return (
                          <button
                            key={oi}
                            onClick={() => {
                              const next = [...answers];
                              next[currentIdx] = oi;
                              setAnswers(next);
                            }}
                            className={`flex items-center justify-between rounded-xl border-2 p-2.5 text-left text-sm transition ${
                              active ? "border-[var(--violet)] bg-[var(--violet)]/10" : "border-gray-200 bg-gray-50/80 hover:border-[var(--violet)]/50"
                            }`}
                          >
                            <span>{opt}</span>
                            {active && <Check className="h-4 w-4 text-[var(--violet)]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <NavBar onBack={onBack} onNext={onNext} disabled={!complete} disabledMsg={locale === "pt" ? "Responda a todas" : "Answer all"} />
    </div>
  );
}

/* ---------------- Listening Section ---------------- */

function ListeningSection({
  answers,
  setAnswers,
  onNext,
  onBack,
}: {
  answers: (number | null)[];
  setAnswers: (a: (number | null)[]) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const { locale } = useLocale();
  const complete = answers.every((a) => a !== null);
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = async (idx: number) => {
    setPlayingIdx(idx);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: LISTENING[idx].audio }),
      });
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (audioRef.current) audioRef.current.pause();
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        setPlayingIdx(null);
        URL.revokeObjectURL(url);
      };
      await audio.play();
    } catch (e) {
      toast.error((e as Error).message || "TTS failed");
      setPlayingIdx(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-8 premium-shadow">
      <SectionHeader icon={Headphones} title={locale === "pt" ? "Compreensão auditiva" : "Listening"} />
      <div className="mt-6 space-y-6">
        {LISTENING.map((it, i) => (
          <div key={it.id} className="rounded-2xl border border-gray-100 bg-gray-50/80 p-5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--violet)]">{it.level}</div>
              <Button size="sm" variant="outline" onClick={() => play(i)} disabled={playingIdx !== null}>
                {playingIdx === i ? <Loader2 className="h-4 w-4 animate-spin" /> : <Volume2 className="h-4 w-4" />}
                <span className="ml-1.5">{locale === "pt" ? "Ouvir" : "Play"}</span>
              </Button>
            </div>
            <div className="mt-3 text-sm font-semibold text-gray-700">{it.prompt}</div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {it.options.map((opt, oi) => {
                const active = answers[i] === oi;
                return (
                  <button
                    key={oi}
                    onClick={() => {
                      const next = [...answers];
                      next[i] = oi;
                      setAnswers(next);
                    }}
                    className={`flex items-center justify-between rounded-xl border-2 p-2.5 text-left text-sm transition ${
                      active ? "border-[var(--violet)] bg-[var(--violet)]/10" : "border-gray-200 bg-gray-50/80 hover:border-[var(--violet)]/50"
                    }`}
                  >
                    <span>{opt}</span>
                    {active && <Check className="h-4 w-4 text-[var(--violet)]" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <NavBar onBack={onBack} onNext={onNext} disabled={!complete} disabledMsg={locale === "pt" ? "Responda a todas" : "Answer all"} />
    </div>
  );
}

/* ---------------- Writing Section ---------------- */

function WritingSection({
  answers,
  setAnswers,
  onNext,
  onBack,
}: {
  answers: string[];
  setAnswers: (a: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const { locale } = useLocale();
  const complete = WRITING.every((w, i) => (answers[i] ?? "").trim().split(/\s+/).filter(Boolean).length >= w.minWords);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-8 premium-shadow">
      <SectionHeader icon={PenTool} title={locale === "pt" ? "Escrita" : "Writing"} />
      <div className="mt-6 space-y-6">
        {WRITING.map((w, i) => {
          const words = (answers[i] ?? "").trim().split(/\s+/).filter(Boolean).length;
          return (
            <div key={w.id} className="rounded-2xl border border-gray-100 bg-gray-50/80 p-5">
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--violet)]">{w.level}</div>
              <div className="mt-2 text-sm font-semibold text-gray-700">{w.prompt}</div>
              <Textarea
                className="mt-3 min-h-32"
                value={answers[i] ?? ""}
                onChange={(e) => {
                  const next = [...answers];
                  next[i] = e.target.value;
                  setAnswers(next);
                }}
                placeholder={locale === "pt" ? "Escreva aqui em inglês…" : "Write here in English…"}
              />
              <div className="mt-2 text-xs text-gray-400">
                {words} / {w.minWords} {locale === "pt" ? "palavras (mínimo)" : "words (minimum)"}
              </div>
            </div>
          );
        })}
      </div>
      <NavBar onBack={onBack} onNext={onNext} disabled={!complete} disabledMsg={locale === "pt" ? "Complete os mínimos de palavras" : "Meet minimum word counts"} />
    </div>
  );
}

/* ---------------- Recorder (Speaking + Pronunciation) ---------------- */

function RecordSection({
  kind,
  answers,
  setAnswers,
  onNext,
  onBack,
  nextLabel,
}: {
  kind: "speaking" | "pronunciation";
  answers: string[];
  setAnswers: (a: string[]) => void;
  onNext: () => void;
  onBack: () => void;
  nextLabel?: string;
}) {
  const { locale } = useLocale();
  const items =
    kind === "speaking"
      ? SPEAKING.map((s) => ({ id: s.id, level: s.level, prompt: s.prompt, hint: `≥${s.minWords} ${locale === "pt" ? "palavras" : "words"}` }))
      : PRONUNCIATION.map((p) => ({
          id: p.id,
          level: p.level,
          prompt: locale === "pt" ? "Leia em voz alta:" : "Read aloud:",
          hint: p.sentence,
        }));

  const complete = answers.every((a) => (a ?? "").trim().length > 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-8 premium-shadow">
      <SectionHeader
        icon={kind === "speaking" ? MessageSquare : Volume2}
        title={kind === "speaking" ? (locale === "pt" ? "Fala" : "Speaking") : locale === "pt" ? "Pronúncia" : "Pronunciation"}
      />
      <div className="mt-6 space-y-6">
        {items.map((it, i) => (
          <div key={it.id} className="rounded-2xl border border-gray-100 bg-gray-50/80 p-5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--violet)]">{it.level}</div>
              <div className="text-xs text-gray-400">{it.hint}</div>
            </div>
            <div className="mt-2 text-sm font-semibold text-gray-700">{it.prompt}</div>
            {kind === "pronunciation" && (
              <div className="mt-3 rounded-xl bg-white border border-gray-100 p-3 text-lg font-semibold text-[var(--ink)]">
                {PRONUNCIATION[i].sentence}
              </div>
            )}
            <MicRecorder
              onTranscript={(text) => {
                const next = [...answers];
                next[i] = text;
                setAnswers(next);
              }}
            />
            {answers[i] && (
              <div className="mt-3 rounded-xl bg-white border border-gray-100 p-3 text-sm">
                <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {locale === "pt" ? "Transcrição" : "Transcript"}
                </div>
                <div className="mt-1 text-gray-700">{answers[i]}</div>
              </div>
            )}
          </div>
        ))}
      </div>
      <NavBar onBack={onBack} onNext={onNext} disabled={!complete} nextLabel={nextLabel} disabledMsg={locale === "pt" ? "Grave todas as respostas" : "Record all responses"} />
    </div>
  );
}

function MicRecorder({ onTranscript }: { onTranscript: (t: string) => void }) {
  const { locale } = useLocale();
  const [state, setState] = useState<"idle" | "recording" | "processing">("idle");
  const [elapsed, setElapsed] = useState(0);
  const recorderRef = useRef<import("@/lib/wav-recorder").WavRecorder | null>(null);
  const timerRef = useRef<number | null>(null);

  const start = async () => {
    try {
      const { startWavRecording } = await import("@/lib/wav-recorder");
      const rec = await startWavRecording();
      recorderRef.current = rec;
      setElapsed(0);
      const startedAt = Date.now();
      timerRef.current = window.setInterval(() => {
        setElapsed(Math.floor((Date.now() - startedAt) / 1000));
      }, 250);
      setState("recording");
    } catch (e) {
      toast.error((e as Error).message || (locale === "pt" ? "Microfone indisponível — verifique as permissões." : "Microphone unavailable — check permissions."));
    }
  };

  const stop = async () => {
    if (!recorderRef.current) return;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setState("processing");
    try {
      const blob = await recorderRef.current.stop();
      recorderRef.current = null;
      if (blob.size < 4096) {
        toast.error(locale === "pt" ? "Áudio muito curto ou silencioso. Fale mais alto e tente novamente." : "Audio too short or silent. Please try again.");
        setState("idle");
        return;
      }
      const fd = new FormData();
      fd.append("file", blob, "recording.wav");
      const res = await fetch("/api/stt", { method: "POST", body: fd });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { text: string };
      const text = (data.text ?? "").trim();
      if (!text) {
        toast.error(locale === "pt" ? "Não conseguimos ouvir a sua voz. Tente novamente mais perto do microfone." : "We couldn't hear your voice. Try again closer to the mic.");
      } else {
        onTranscript(text);
      }
    } catch (e) {
      toast.error((e as Error).message || "STT failed");
    } finally {
      setState("idle");
    }
  };

  return (
    <div className="mt-3 flex items-center gap-3">
      {state === "idle" && (
        <Button type="button" size="sm" variant="outline" onClick={start}>
          <Mic className="h-4 w-4" /> <span className="ml-1.5">{locale === "pt" ? "Gravar" : "Record"}</span>
        </Button>
      )}
      {state === "recording" && (
        <>
          <Button type="button" size="sm" variant="destructive" onClick={stop}>
            <Square className="h-4 w-4" /> <span className="ml-1.5">{locale === "pt" ? "Parar" : "Stop"}</span>
          </Button>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            {elapsed}s
          </span>
        </>
      )}
      {state === "processing" && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> {locale === "pt" ? "A transcrever…" : "Transcribing…"}
        </div>
      )}
    </div>
  );
}

/* ---------------- Nav / Section helpers ---------------- */

function NavBar({
  onBack,
  onNext,
  disabled,
  nextLabel,
  disabledMsg,
}: {
  onBack: () => void;
  onNext: () => void;
  disabled: boolean;
  nextLabel?: string;
  disabledMsg?: string;
}) {
  const { locale } = useLocale();
  return (
    <div className="mt-8 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <Button variant="ghost" onClick={onBack} className="self-start md:self-auto">
        <ArrowLeft className="mr-1.5 h-4 w-4" /> {locale === "pt" ? "Voltar" : "Back"}
      </Button>
      <div className="flex flex-col items-stretch md:items-end gap-1 w-full md:w-auto">
        {disabled && disabledMsg && (
          <span className="text-xs text-amber-600 dark:text-amber-400">
            {locale === "pt"
              ? "Pode pular perguntas — não respondidas contam como erro."
              : "You may skip questions — unanswered count as wrong."}
          </span>
        )}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {disabled && (
            <Button variant="outline" onClick={onNext}>
              {locale === "pt" ? "Pular e continuar" : "Skip & continue"}
            </Button>
          )}
          <Button
            className="bg-gradient-to-r from-[var(--violet)] to-[var(--magenta)] text-white shadow-md hover:opacity-90"
            onClick={onNext}
          >
            {nextLabel ?? (locale === "pt" ? "Continuar" : "Continue")} <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title }: { icon: typeof BookOpen; title: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-gray-100 bg-gray-50/80 px-3 py-1 text-xs font-semibold text-gray-600">
      <Icon className="h-3.5 w-3.5 text-[var(--violet)]" />
      {title}
    </div>
  );
}

/* ---------------- Loading ---------------- */

function Loading() {
  const { locale } = useLocale();
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center premium-shadow">
      <Loader2 className="mx-auto h-10 w-10 animate-spin text-[var(--violet)]" />
      <h2 className="mt-6 font-display text-2xl font-bold text-[var(--ink)]">
        {locale === "pt" ? "Coach a avaliar o seu inglês…" : "Coach is evaluating your English…"}
      </h2>
      <p className="mt-2 text-sm text-gray-500">
        {locale === "pt"
          ? "A gerar o seu nível CEFR, pontos fortes/fracos e plano personalizado. Pode levar até 30 segundos."
          : "Generating your CEFR level, strengths/weaknesses and personalized plan. May take up to 30 seconds."}
      </p>
    </div>
  );
}

/* ---------------- Report ---------------- */

const SKILL_LABEL: Record<string, { pt: string; en: string; icon: typeof BookOpen }> = {
  grammar: { pt: "Gramática", en: "Grammar", icon: GraduationCap },
  vocabulary: { pt: "Vocabulário", en: "Vocabulary", icon: BookOpen },
  reading: { pt: "Leitura", en: "Reading", icon: BookOpen },
  listening: { pt: "Compreensão", en: "Listening", icon: Headphones },
  writing: { pt: "Escrita", en: "Writing", icon: PenTool },
  speaking: { pt: "Fala", en: "Speaking", icon: MessageSquare },
  pronunciation: { pt: "Pronúncia", en: "Pronunciation", icon: Volume2 },
};

function ReportView({
  report,
  error,
  onRetake,
  onContinue,
}: {
  report: Report;
  error: string | null;
  onRetake: () => void;
  onContinue: () => void;
}) {
  const { locale } = useLocale();
  const skills: (keyof typeof SKILL_LABEL)[] = [
    "grammar", "vocabulary", "reading", "listening", "writing", "speaking", "pronunciation",
  ];
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center premium-shadow">
        <div className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          {locale === "pt" ? "O seu nível CEFR" : "Your CEFR level"}
        </div>
        <div className="mt-2 font-display text-7xl font-bold bg-gradient-to-r from-[var(--violet)] to-[var(--magenta)] bg-clip-text text-transparent">{report.cefr_level}</div>
        <div className="mt-2 text-lg font-semibold text-[var(--ink)]">
          {locale === "pt" ? "Pontuação global" : "Overall score"}: {report.scores.overall}%
        </div>
        {report.feedback && <p className="mx-auto mt-4 max-w-2xl text-sm text-gray-500">{report.feedback}</p>}
        {error && (
          <div className="mx-auto mt-4 flex max-w-xl items-start gap-2 rounded-xl bg-destructive/10 p-3 text-left text-xs text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4" /> {error}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 premium-shadow">
        <h3 className="font-display text-xl font-bold text-[var(--ink)]">{locale === "pt" ? "Pontuação por skill" : "Score by skill"}</h3>
        <div className="mt-4 space-y-3">
          {skills.map((k) => {
            const meta = SKILL_LABEL[k];
            const Icon = meta.icon;
            const v = report.scores[k as keyof Report["scores"]];
            return (
              <div key={k}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-semibold text-gray-700">
                    <Icon className="h-4 w-4 text-[var(--violet)]" /> {meta[locale]}
                  </span>
                  <span className="font-mono text-gray-500">{v}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full bg-gradient-to-r from-[var(--violet)] to-[var(--magenta)] transition-all" style={{ width: `${v}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 premium-shadow">
          <h3 className="flex items-center gap-2 font-display text-lg font-bold text-[var(--ink)]">
            <Trophy className="h-5 w-5 text-emerald-500" /> {locale === "pt" ? "Pontos fortes" : "Strengths"}
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            {report.strengths.length === 0 && (
              <li className="text-gray-400">{locale === "pt" ? "Sem dados." : "No data."}</li>
            )}
            {report.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-gray-600">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 premium-shadow">
          <h3 className="flex items-center gap-2 font-display text-lg font-bold text-[var(--ink)]">
            <Target className="h-5 w-5 text-amber" /> {locale === "pt" ? "Pontos a melhorar" : "Areas to improve"}
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            {report.weaknesses.length === 0 && (
              <li className="text-gray-400">{locale === "pt" ? "Sem dados." : "No data."}</li>
            )}
            {report.weaknesses.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-gray-600">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber" /> {s}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 premium-shadow">
        <h3 className="font-display text-xl font-bold text-[var(--ink)]">
          {locale === "pt" ? "Plano de aprendizagem personalizado" : "Personalized learning plan"}
        </h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {report.learning_plan.map((w) => {
            const meta = SKILL_LABEL[w.focus_skill] ?? SKILL_LABEL.grammar;
            const Icon = meta.icon;
            return (
              <div key={w.week} className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider text-[var(--violet)]">
                    {locale === "pt" ? `Semana ${w.week}` : `Week ${w.week}`}
                  </div>
                  <span className="text-xs text-gray-400">{w.estimated_minutes} min</span>
                </div>
                <div className="mt-1 flex items-center gap-2 font-display text-lg font-bold text-[var(--ink)]">
                  <Icon className="h-4 w-4 text-[var(--violet)]" /> {w.title}
                </div>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {w.goals.map((g, gi) => (
                    <li key={gi} className="flex items-start gap-2 text-gray-600">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--violet)]" /> {g}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button size="lg" onClick={onContinue} className="bg-gradient-to-r from-[var(--violet)] to-[var(--magenta)] text-white shadow-md hover:opacity-90">
          {locale === "pt" ? "Ir para o painel" : "Go to dashboard"} <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
        <Button variant="outline" size="lg" onClick={onRetake}>
          {locale === "pt" ? "Refazer o teste" : "Retake test"}
        </Button>
        <Button asChild variant="ghost" size="lg">
          <Link to="/">{locale === "pt" ? "Início" : "Home"}</Link>
        </Button>
      </div>
    </div>
  );
}
