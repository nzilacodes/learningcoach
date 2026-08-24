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
} from "lucide-react";
import { VideosSidebar, VideosMobileNav } from "@/components/videos/videos-sidebar";
import { AppHeader } from "@/components/app-header";
import {
  HeaderActionLinks,
  MobileAvatarMenu,
  DesktopAvatarLink,
} from "@/components/mobile-avatar-menu";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLocale } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { apiFetch, apiFetchFormData } from "@/lib/api/client";
import { useNotification } from "@/lib/notifications/notification-provider";
import { normalizeApiError, type NormalizedError } from "@/lib/errors/normalize-api-error";
import { InlineStatusFromError } from "@/components/feedback/inline-status";
import { StagedLoader } from "@/components/feedback/staged-loader";
import { describeGetUserMediaError } from "@/lib/media-devices";
import { describeTranscriptionRejection } from "@/lib/voice";
import {
  GRAMMAR,
  VOCABULARY,
  READING,
  LISTENING,
  WRITING,
  SPEAKING,
  PRONUNCIATION,
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

type Section =
  | "intro"
  | "grammar"
  | "vocab"
  | "reading"
  | "listening"
  | "writing"
  | "speaking"
  | "pron"
  | "loading"
  | "report";

// The 8 content-bearing steps a candidate actually walks through — "loading"
// and "report" are terminal states, not steps to count progress against.
const SECTION_ORDER: Section[] = [
  "intro",
  "grammar",
  "vocab",
  "reading",
  "listening",
  "writing",
  "speaking",
  "pron",
];

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

/* ---------------- Root component ---------------- */

function DiagnosticPage() {
  const { locale } = useLocale();
  const { user, refresh } = useAuth();
  const navigate = useNavigate();

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
  const [saveError, setSaveError] = useState<NormalizedError | null>(null);
  const notify = useNotification();

  // Load latest saved report if it exists.
  useEffect(() => {
    if (!user) return;
    void (async () => {
      try {
        const data = await apiFetch<Report | null>("/v1/me/diagnostic-result");
        if (data) setReport(data);
      } catch {
        // Best-effort: just means the "Ver último relatório" button won't
        // appear. Not worth surfacing a toast for a background prefetch.
      }
    })();
  }, [user]);

  const submit = async () => {
    if (!user) {
      notify.warning(locale === "pt" ? "A sua sessão expirou" : "Your session expired", {
        description:
          locale === "pt" ? "Entre novamente para submeter." : "Sign in again to submit.",
      });
      navigate({ to: "/auth" });
      return;
    }
    setSection("loading");
    setSaveError(null);

    // Profile context for personalization (grading itself happens server-side) —
    // already available from the session, no extra fetch needed.
    const profile = {
      age: user.age ?? undefined,
      native_language: user.nativeLanguage ?? undefined,
      learning_goal: user.learningGoal ?? undefined,
      interests: user.interests ?? undefined,
    };

    try {
      // Server recomputes grammar/vocab/reading/listening from raw answers
      // against its own answer key, and grades writing/speaking/pronunciation
      // itself — it also persists diagnostic_results + profiles.cefr_level,
      // so nothing here is trusted from the client anymore.
      const data = await apiFetch<Report>("/v1/assessments/diagnostic", {
        method: "POST",
        body: JSON.stringify({
          grammarAnswers: grammarAns,
          vocabAnswers: vocabAns,
          readingAnswers: readingAns,
          listeningAnswers: listeningAns,
          writing: writingAns,
          speaking: speakingAns,
          pronunciation: pronAns,
          profile: profile ?? {},
        }),
      });

      // XP is now awarded server-side, inside POST /v1/assessments/diagnostic
      // itself, right after grading — see backend modules/diagnostic/service.ts.
      // Self-reporting "diagnostic_complete" from here has been removed since
      // the backend no longer accepts it via POST /v1/xp/events (a client
      // could otherwise farm the reward without ever taking the test).
      setReport(data);
      setSection("report");
      notify.success(
        locale === "pt"
          ? `Nível ${data.cefr_level} identificado!`
          : `Level ${data.cefr_level} identified!`,
      );
    } catch (e) {
      // Clear any report left over from a previous attempt/session — otherwise
      // this failed retake would render the old ReportView dressed with the
      // new error instead of the dedicated SubmitFailedView.
      setReport(null);
      setSaveError(normalizeApiError(e, locale));
      setSection("report");
      notify.fromError(e, { dedupeKey: "placement:evaluate", onRetry: submit });
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <VideosSidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <AppHeader
          title={locale === "pt" ? "Diagnóstico" : "Placement Test"}
          actions={
            <>
              <HeaderActionLinks />
              <MobileAvatarMenu />
              <DesktopAvatarLink />
            </>
          }
        />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-6 scrollbar-hide">
          <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-10">
            {SECTION_ORDER.includes(section) && (
              <div className="mb-6">
                <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-muted-foreground">
                  <span>
                    {locale === "pt" ? "Passo" : "Step"} {SECTION_ORDER.indexOf(section) + 1}{" "}
                    {locale === "pt" ? "de" : "of"} {SECTION_ORDER.length}
                  </span>
                  <span>
                    {Math.round(
                      ((SECTION_ORDER.indexOf(section) + 1) / SECTION_ORDER.length) * 100,
                    )}
                    %
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-sunset transition-all"
                    style={{
                      width: `${((SECTION_ORDER.indexOf(section) + 1) / SECTION_ORDER.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}
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
                onContinue={async () => {
                  // The diagnostic result endpoint already advanced
                  // onboarding_status server-side (see submit() above) — but
                  // the in-memory `user` from useAuth() is still the copy
                  // fetched when this page loaded, still showing the old
                  // status. Without this refresh, OnboardingGate reads that
                  // stale status on the next route, decides onboarding isn't
                  // complete, and bounces straight back to /onboarding,
                  // which re-shows this same placement step — an apparent
                  // loop that never gets past a diagnostic already taken.
                  await refresh();
                  navigate({ to: "/dashboard" });
                }}
              />
            )}

            {section === "report" && !report && (
              <SubmitFailedView
                error={saveError}
                onRetry={submit}
                onBack={() => setSection("pron")}
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

function Intro({
  hasPrevious,
  onStart,
  onSeeReport,
}: {
  hasPrevious: boolean;
  onStart: () => void;
  onSeeReport: () => void;
}) {
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
            <div className="absolute inset-0 bg-violet/10 rounded-full blur-2xl" />
            <div className="relative bg-white rounded-3xl p-5 shadow-sm flex items-center justify-center border border-gray-100">
              <Sparkles className="h-9 w-9 text-violet" />
            </div>
          </div>
          <h1 className="font-display text-[32px] font-semibold text-ink mb-2 tracking-tight leading-tight">
            {locale === "pt" ? "Diagnóstico completo" : "Full diagnostic"}
          </h1>
          <p className="text-sm text-muted-foreground max-w-[280px]">
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
                <div
                  key={s.label}
                  className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col gap-3 hover:border-violet/50 transition-all shadow-sm"
                >
                  <Icon className="h-6 w-6 text-violet" />
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
              className="mt-4 w-full text-center text-xs font-semibold text-violet hover:opacity-80 transition-opacity py-2"
            >
              {locale === "pt" ? "Ver último relatório" : "View last report"}
            </button>
          )}
        </section>

        {/* Fixed CTA */}
        <div className="fixed bottom-20 left-0 right-0 px-4 py-4 z-40 bg-gradient-to-t from-background via-background to-transparent">
          <button
            onClick={onStart}
            className="w-full bg-gradient-to-r from-violet to-magenta text-white py-4 rounded-2xl font-semibold shadow-lg shadow-violet/20 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm"
          >
            {locale === "pt" ? "Começar" : "Start"}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ========= DESKTOP layout ========= */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-100 p-8 md:p-12 text-center premium-shadow">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-violet to-magenta shadow-md">
          <Sparkles className="h-8 w-8 text-white" />
        </div>
        <h1 className="mt-6 font-display text-4xl font-bold text-ink">
          {locale === "pt" ? "Diagnóstico completo" : "Full diagnostic"}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          {locale === "pt"
            ? "Avaliação em 7 skills. Duração: ~15 minutos. Vai usar o microfone para as secções de fala e pronúncia."
            : "7-skill assessment. ~15 minutes. Uses your microphone for speaking and pronunciation."}
        </p>
        <div className="mx-auto mt-8 grid max-w-2xl grid-cols-2 gap-2 text-left sm:grid-cols-3">
          {items.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50/80 p-3 text-sm text-muted-foreground"
              >
                <Icon className="h-4 w-4 text-violet" />
                {s.label}
              </div>
            );
          })}
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button
            size="lg"
            onClick={onStart}
            className="bg-gradient-to-r from-violet to-magenta text-white shadow-md hover:opacity-90"
          >
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
            <div className="text-sm font-semibold text-muted-foreground">
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
                      active
                        ? "border-violet bg-violet/10"
                        : "border-gray-200 bg-gray-50/80 hover:border-violet/50"
                    }`}
                  >
                    <span>{opt}</span>
                    {active && <Check className="h-4 w-4 text-violet" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <NavBar
        onBack={onBack}
        onNext={onNext}
        disabled={!complete}
        disabledMsg={locale === "pt" ? "Responda a todas" : "Answer all"}
      />
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
            <div className="mb-3 text-xs font-bold uppercase tracking-wider text-violet">
              {p.level}
            </div>
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
                              active
                                ? "border-violet bg-violet/10"
                                : "border-gray-200 bg-gray-50/80 hover:border-violet/50"
                            }`}
                          >
                            <span>{opt}</span>
                            {active && <Check className="h-4 w-4 text-violet" />}
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
      <NavBar
        onBack={onBack}
        onNext={onNext}
        disabled={!complete}
        disabledMsg={locale === "pt" ? "Responda a todas" : "Answer all"}
      />
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
  const notify = useNotification();
  const complete = answers.every((a) => a !== null);
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = async (idx: number) => {
    setPlayingIdx(idx);
    try {
      const blob = await apiFetch<Blob>("/v1/audio/speech", {
        method: "POST",
        body: JSON.stringify({ text: LISTENING[idx].audio }),
      });
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
      notify.fromError(e, { dedupeKey: "placement:listen" });
      setPlayingIdx(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-8 premium-shadow">
      <SectionHeader
        icon={Headphones}
        title={locale === "pt" ? "Compreensão auditiva" : "Listening"}
      />
      <div className="mt-6 space-y-6">
        {LISTENING.map((it, i) => (
          <div key={it.id} className="rounded-2xl border border-gray-100 bg-gray-50/80 p-5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-wider text-violet">
                {it.level}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => play(i)}
                disabled={playingIdx !== null}
              >
                {playingIdx === i ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
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
                      active
                        ? "border-violet bg-violet/10"
                        : "border-gray-200 bg-gray-50/80 hover:border-violet/50"
                    }`}
                  >
                    <span>{opt}</span>
                    {active && <Check className="h-4 w-4 text-violet" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <NavBar
        onBack={onBack}
        onNext={onNext}
        disabled={!complete}
        disabledMsg={locale === "pt" ? "Responda a todas" : "Answer all"}
      />
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
  const complete = WRITING.every(
    (w, i) => (answers[i] ?? "").trim().split(/\s+/).filter(Boolean).length >= w.minWords,
  );
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-8 premium-shadow">
      <SectionHeader icon={PenTool} title={locale === "pt" ? "Escrita" : "Writing"} />
      <div className="mt-6 space-y-6">
        {WRITING.map((w, i) => {
          const words = (answers[i] ?? "").trim().split(/\s+/).filter(Boolean).length;
          return (
            <div key={w.id} className="rounded-2xl border border-gray-100 bg-gray-50/80 p-5">
              <div className="text-xs font-bold uppercase tracking-wider text-violet">
                {w.level}
              </div>
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
              <div className="mt-2 text-xs text-muted-foreground">
                {words} / {w.minWords} {locale === "pt" ? "palavras (mínimo)" : "words (minimum)"}
              </div>
            </div>
          );
        })}
      </div>
      <NavBar
        onBack={onBack}
        onNext={onNext}
        disabled={!complete}
        disabledMsg={
          locale === "pt" ? "Complete os mínimos de palavras" : "Meet minimum word counts"
        }
      />
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
      ? SPEAKING.map((s) => ({
          id: s.id,
          level: s.level,
          prompt: s.prompt,
          hint: `≥${s.minWords} ${locale === "pt" ? "palavras" : "words"}`,
        }))
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
        title={
          kind === "speaking"
            ? locale === "pt"
              ? "Fala"
              : "Speaking"
            : locale === "pt"
              ? "Pronúncia"
              : "Pronunciation"
        }
      />
      <div className="mt-6 space-y-6">
        {items.map((it, i) => (
          <div key={it.id} className="rounded-2xl border border-gray-100 bg-gray-50/80 p-5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-wider text-violet">
                {it.level}
              </div>
              <div className="text-xs text-muted-foreground">{it.hint}</div>
            </div>
            <div className="mt-2 text-sm font-semibold text-gray-700">{it.prompt}</div>
            {kind === "pronunciation" && (
              <div className="mt-3 rounded-xl bg-white border border-gray-100 p-3 text-lg font-semibold text-ink">
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
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {locale === "pt" ? "Transcrição" : "Transcript"}
                </div>
                <div className="mt-1 text-gray-700">{answers[i]}</div>
              </div>
            )}
          </div>
        ))}
      </div>
      <NavBar
        onBack={onBack}
        onNext={onNext}
        disabled={!complete}
        nextLabel={nextLabel}
        disabledMsg={locale === "pt" ? "Grave todas as respostas" : "Record all responses"}
      />
    </div>
  );
}

function MicRecorder({ onTranscript }: { onTranscript: (t: string) => void }) {
  const { locale } = useLocale();
  const notify = useNotification();
  const [state, setState] = useState<"idle" | "recording" | "processing">("idle");
  const [elapsed, setElapsed] = useState(0);
  const recorderRef = useRef<import("@/lib/wav-recorder").WavRecorder | null>(null);
  const timerRef = useRef<number | null>(null);

  // Without this, advancing the wizard (Back/Next) mid-recording leaves the
  // getUserMedia stream open AND the 250ms elapsed-time interval running
  // forever, ticking setState on an unmounted component indefinitely.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      recorderRef.current?.stop().catch(() => {});
    };
  }, []);

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
      // A getUserMedia/permission failure, not a backend error — describe the
      // actual DOMException reason instead of one generic message.
      const { title, description } = describeGetUserMediaError(e, locale);
      notify.error(title, { description, dedupeKey: "placement:mic-permission" });
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
      const fd = new FormData();
      // "language" must come before "file": @fastify/multipart parses parts
      // in stream order, so a field appended after the file isn't guaranteed
      // to be readable by the backend when it reads the file part.
      fd.append("language", "en");
      fd.append("file", blob, "recording.wav");
      const data = await apiFetchFormData<{ text: string }>("/v1/audio/transcriptions", fd);
      const text = (data.text ?? "").trim();
      if (!text) {
        notify.warning(
          locale === "pt" ? "Não conseguimos ouvir a sua voz" : "We couldn't hear your voice",
          {
            description:
              locale === "pt"
                ? "Tente novamente mais perto do microfone."
                : "Try again closer to the mic.",
          },
        );
      } else {
        onTranscript(text);
      }
    } catch (e) {
      const rejection = describeTranscriptionRejection(e, locale);
      if (rejection) {
        notify.warning(rejection.title, {
          description: rejection.description,
          dedupeKey: "placement:no-speech",
        });
      } else {
        notify.fromError(e, { dedupeKey: "placement:transcribe" });
      }
    } finally {
      setState("idle");
    }
  };

  return (
    <div className="mt-3 flex items-center gap-3">
      {state === "idle" && (
        <Button type="button" size="sm" variant="outline" onClick={start}>
          <Mic className="h-4 w-4" />{" "}
          <span className="ml-1.5">{locale === "pt" ? "Gravar" : "Record"}</span>
        </Button>
      )}
      {state === "recording" && (
        <>
          <Button type="button" size="sm" variant="destructive" onClick={stop}>
            <Square className="h-4 w-4" />{" "}
            <span className="ml-1.5">{locale === "pt" ? "Parar" : "Stop"}</span>
          </Button>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            {elapsed}s
          </span>
        </>
      )}
      {state === "processing" && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />{" "}
          {locale === "pt" ? "A transcrever…" : "Transcribing…"}
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
            className="bg-gradient-to-r from-violet to-magenta text-white shadow-md hover:opacity-90"
            onClick={onNext}
          >
            {nextLabel ?? (locale === "pt" ? "Continuar" : "Continue")}{" "}
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title }: { icon: typeof BookOpen; title: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-gray-100 bg-gray-50/80 px-3 py-1 text-xs font-semibold text-muted-foreground">
      <Icon className="h-3.5 w-3.5 text-violet" />
      {title}
    </div>
  );
}

/* ---------------- Loading ---------------- */

function Loading() {
  const { locale } = useLocale();
  const stages =
    locale === "pt"
      ? ["A preparar a análise…", "A analisar as suas respostas…", "A finalizar a avaliação…"]
      : ["Preparing analysis…", "Analyzing your answers…", "Finalizing the evaluation…"];
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center premium-shadow">
      <h2 className="font-display text-2xl font-bold text-ink">
        {locale === "pt" ? "Coach a avaliar o seu inglês…" : "Coach is evaluating your English…"}
      </h2>
      <div className="mt-6">
        <StagedLoader stages={stages} status="running" autoAdvanceMs={[2500, 12000]} />
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        {locale === "pt" ? "Pode levar até 30 segundos." : "May take up to 30 seconds."}
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

/* ---------------- Submission failed (no report to show) ---------------- */

function SubmitFailedView({
  error,
  onRetry,
  onBack,
}: {
  error: NormalizedError | null;
  onRetry: () => void;
  onBack: () => void;
}) {
  const { locale } = useLocale();
  return (
    <div className="mx-auto max-w-xl">
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center premium-shadow">
        <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
        <h2 className="mt-4 font-display text-xl font-bold text-ink">
          {locale === "pt"
            ? "Não foi possível avaliar o seu diagnóstico"
            : "We couldn't evaluate your diagnostic"}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {locale === "pt"
            ? "As suas respostas continuam guardadas nesta sessão. Pode tentar enviar novamente."
            : "Your answers are still saved in this session. You can try submitting again."}
        </p>
        {error && (
          <div className="mx-auto mt-4 max-w-md text-left">
            <InlineStatusFromError error={error} />
          </div>
        )}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />{" "}
            {locale === "pt" ? "Rever respostas" : "Review answers"}
          </Button>
          <Button onClick={onRetry} className="bg-gradient-sunset text-white hover:opacity-90">
            {locale === "pt" ? "Tentar novamente" : "Try again"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ReportView({
  report,
  error,
  onRetake,
  onContinue,
}: {
  report: Report;
  error: NormalizedError | null;
  onRetake: () => void;
  onContinue: () => void;
}) {
  const { locale } = useLocale();
  const skills: (keyof typeof SKILL_LABEL)[] = [
    "grammar",
    "vocabulary",
    "reading",
    "listening",
    "writing",
    "speaking",
    "pronunciation",
  ];
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center premium-shadow">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {locale === "pt" ? "O seu nível CEFR" : "Your CEFR level"}
        </div>
        <div className="mt-2 font-display text-7xl font-bold bg-gradient-to-r from-violet to-magenta bg-clip-text text-transparent">
          {report.cefr_level}
        </div>
        <div className="mt-2 text-lg font-semibold text-ink">
          {locale === "pt" ? "Pontuação global" : "Overall score"}: {report.scores.overall}%
        </div>
        {report.feedback && (
          <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground">{report.feedback}</p>
        )}
        {error && (
          <div className="mx-auto mt-4 max-w-xl text-left">
            <InlineStatusFromError error={error} />
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 premium-shadow">
        <h3 className="font-display text-xl font-bold text-ink">
          {locale === "pt" ? "Pontuação por skill" : "Score by skill"}
        </h3>
        <div className="mt-4 space-y-3">
          {skills.map((k) => {
            const meta = SKILL_LABEL[k];
            const Icon = meta.icon;
            const v = report.scores[k as keyof Report["scores"]];
            return (
              <div key={k}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-semibold text-gray-700">
                    <Icon className="h-4 w-4 text-violet" /> {meta[locale]}
                  </span>
                  <span className="font-mono text-muted-foreground">{v}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full bg-gradient-to-r from-violet to-magenta transition-all"
                    style={{ width: `${v}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 premium-shadow">
          <h3 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
            <Trophy className="h-5 w-5 text-emerald-500" />{" "}
            {locale === "pt" ? "Pontos fortes" : "Strengths"}
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            {report.strengths.length === 0 && (
              <li className="text-muted-foreground">
                {locale === "pt" ? "Sem dados." : "No data."}
              </li>
            )}
            {report.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-muted-foreground">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 premium-shadow">
          <h3 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
            <Target className="h-5 w-5 text-amber" />{" "}
            {locale === "pt" ? "Pontos a melhorar" : "Areas to improve"}
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            {report.weaknesses.length === 0 && (
              <li className="text-muted-foreground">
                {locale === "pt" ? "Sem dados." : "No data."}
              </li>
            )}
            {report.weaknesses.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-muted-foreground">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber" /> {s}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 premium-shadow">
        <h3 className="font-display text-xl font-bold text-ink">
          {locale === "pt" ? "Plano de aprendizagem personalizado" : "Personalized learning plan"}
        </h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {report.learning_plan.map((w) => {
            const meta = SKILL_LABEL[w.focus_skill] ?? SKILL_LABEL.grammar;
            const Icon = meta.icon;
            return (
              <div key={w.week} className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider text-violet">
                    {locale === "pt" ? `Semana ${w.week}` : `Week ${w.week}`}
                  </div>
                  <span className="text-xs text-muted-foreground">{w.estimated_minutes} min</span>
                </div>
                <div className="mt-1 flex items-center gap-2 font-display text-lg font-bold text-ink">
                  <Icon className="h-4 w-4 text-violet" /> {w.title}
                </div>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {w.goals.map((g, gi) => (
                    <li key={gi} className="flex items-start gap-2 text-muted-foreground">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet" /> {g}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button
          size="lg"
          onClick={onContinue}
          className="bg-gradient-to-r from-violet to-magenta text-white shadow-md hover:opacity-90"
        >
          {locale === "pt" ? "Ir para o painel" : "Go to dashboard"}{" "}
          <ArrowRight className="ml-1.5 h-4 w-4" />
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
