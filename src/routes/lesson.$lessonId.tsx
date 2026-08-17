import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Volume2, Mic, Check, X, Trophy, Loader2, CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLocale } from "@/lib/i18n";
import { apiFetch } from "@/lib/api/client";
import { useNotification } from "@/lib/notifications/notification-provider";
import { useCurriculum, useLessonProgress } from "@/lib/learning";
import {
  speak,
  startRecording,
  transcribe,
  scorePronunciation,
  feedbackFor,
  type Recorder,
} from "@/lib/voice";

export const Route = createFileRoute("/lesson/$lessonId")({
  component: LessonPage,
  head: () => ({
    meta: [{ title: "Aula — Learning English with Coach" }, { name: "robots", content: "noindex" }],
  }),
});

type ExerciseRow = {
  id: string;
  type: string;
  prompt: string;
  data: { options?: string[] } | null;
  correct_answer: { index?: number } | null;
  xp_reward: number;
  order_index: number;
};
type LessonDetail = {
  id: string;
  unit_id: string;
  slug: string;
  title: string;
  summary: string | null;
  content: Record<string, unknown> | null;
  duration_min: number | null;
  xp_reward: number;
  lesson_type: string;
  exercises: ExerciseRow[];
};
type CompleteResult = {
  alreadyCompleted: boolean;
  gained?: number;
  level_up?: boolean;
  level?: number;
};

function useLesson(lessonId: string) {
  return useQuery({
    queryKey: ["lesson", lessonId],
    queryFn: () => apiFetch<LessonDetail>(`/v1/lessons/${lessonId}`),
  });
}

const str = (v: unknown): string => (typeof v === "string" ? v : "");
const strArr = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

function ContentSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-3xl p-6 md:p-8 shadow-card space-y-4">
      <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </div>
      {children}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <ul className="space-y-2">
      {items.map((it, i) => (
        <li key={i} className="flex gap-2 text-sm">
          <span className="text-magenta">•</span>
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

function SpeakButton({ text, locale }: { text: string; locale: "pt" | "en" }) {
  const notify = useNotification();
  const [playing, setPlaying] = useState(false);
  if (!text) return null;
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={playing}
      onClick={async () => {
        setPlaying(true);
        try {
          await speak(text);
        } catch (e) {
          notify.fromError(e, { dedupeKey: "lesson:speak" });
        } finally {
          setPlaying(false);
        }
      }}
    >
      {playing ? (
        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
      ) : (
        <Volume2 className="mr-1.5 h-4 w-4" />
      )}
      {locale === "pt" ? "Ouvir" : "Listen"}
    </Button>
  );
}

function WritingPractice({
  content,
  locale,
}: {
  content: Record<string, unknown>;
  locale: "pt" | "en";
}) {
  const [text, setText] = useState("");
  return (
    <ContentSection title={locale === "pt" ? "Escrita" : "Writing"}>
      {content.prompt ? <p className="text-sm font-medium">{str(content.prompt)}</p> : null}
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        placeholder={locale === "pt" ? "Escreva aqui..." : "Write here..."}
      />
      <BulletList items={strArr(content.rubric)} />
    </ContentSection>
  );
}

function SpeakingPractice({
  content,
  locale,
}: {
  content: Record<string, unknown>;
  locale: "pt" | "en";
}) {
  const notify = useNotification();
  const target =
    str(content.prompt) ||
    (locale === "pt" ? "Fale sobre o tema desta lição." : "Talk about this lesson's topic.");
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [score, setScore] = useState<number | null>(null);
  const recorderRef = useRef<Recorder | null>(null);

  // Without this, leaving the lesson mid-recording leaves the getUserMedia
  // stream open and the mic indicator lit — same leak already fixed once in
  // components/games/game-play-modal.tsx.
  useEffect(() => {
    return () => {
      recorderRef.current?.stop().catch(() => {});
    };
  }, []);

  const handleMic = async () => {
    if (processing) return;
    if (!recording) {
      try {
        recorderRef.current = await startRecording();
        setRecording(true);
        setTranscript("");
        setScore(null);
      } catch {
        notify.error(locale === "pt" ? "Microfone indisponível" : "Microphone unavailable", {
          description: locale === "pt" ? "Permita o acesso ao microfone." : "Please allow microphone access.",
          dedupeKey: "lesson:mic-permission",
        });
      }
      return;
    }
    setRecording(false);
    setProcessing(true);
    try {
      const blob = await recorderRef.current!.stop();
      recorderRef.current = null;
      const text = await transcribe(blob);
      setTranscript(text);
      setScore(scorePronunciation(target, text));
    } catch (e) {
      notify.fromError(e, { dedupeKey: "lesson:transcribe" });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ContentSection title={locale === "pt" ? "Fala" : "Speaking"}>
      <p className="text-sm font-medium">{target}</p>
      <BulletList items={strArr(content.functions)} />
      <div className="flex flex-col items-center gap-3 py-4">
        <button
          onClick={handleMic}
          disabled={processing}
          className={`flex h-20 w-20 items-center justify-center rounded-full bg-gradient-sunset text-white shadow-glow transition-transform disabled:opacity-70 ${
            recording ? "scale-110 animate-pulse" : ""
          }`}
        >
          {processing ? <Loader2 className="h-8 w-8 animate-spin" /> : <Mic className="h-8 w-8" />}
        </button>
        <div className="text-xs text-muted-foreground">
          {processing
            ? locale === "pt"
              ? "Analisando..."
              : "Analyzing..."
            : recording
              ? locale === "pt"
                ? "Gravando... toque para parar"
                : "Recording... tap to stop"
              : locale === "pt"
                ? "Toque para gravar"
                : "Tap to record"}
        </div>
      </div>
      {score !== null && (
        <div className="rounded-xl border border-border bg-background/60 p-4">
          <div className="text-sm">
            <span className="font-semibold">{locale === "pt" ? "Você disse: " : "You said: "}</span>
            <span className="text-muted-foreground">"{transcript}"</span>
          </div>
          <div className="mt-2 text-sm text-muted-foreground">{feedbackFor(score, locale)}</div>
        </div>
      )}
      <BulletList items={strArr(content.rubric)} />
    </ContentSection>
  );
}

function QuizSection({ exercises, locale }: { exercises: ExerciseRow[]; locale: "pt" | "en" }) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const choose = (exerciseId: string, index: number) => {
    if (answers[exerciseId] !== undefined) return;
    setAnswers((a) => ({ ...a, [exerciseId]: index }));
  };
  const answeredCount = Object.keys(answers).length;
  // correct_answer is only sent to signed-in callers (see backend getLessonDetail) —
  // an anonymous visitor can still pick an answer, but sees a neutral state
  // instead of every choice being marked "wrong" for lack of an answer key.
  const hasAnswerKey = exercises.some((ex) => ex.correct_answer != null);
  const correctCount = exercises.filter((ex) => answers[ex.id] === ex.correct_answer?.index).length;

  return (
    <ContentSection title={locale === "pt" ? "Quiz" : "Quiz"}>
      <div className="space-y-6">
        {exercises.map((ex, qi) => {
          const options = ex.data?.options ?? [];
          const picked = answers[ex.id];
          const show = picked !== undefined;
          const exerciseHasKey = ex.correct_answer != null;
          return (
            <div key={ex.id}>
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {locale === "pt" ? `Pergunta ${qi + 1}` : `Question ${qi + 1}`}
              </div>
              <h4 className="mt-1 font-display text-lg font-bold">{ex.prompt}</h4>
              <div className="mt-3 space-y-2">
                {options.map((opt, i) => {
                  const isCorrect = exerciseHasKey && i === ex.correct_answer?.index;
                  const chosen = picked === i;
                  return (
                    <button
                      key={i}
                      onClick={() => choose(ex.id, i)}
                      disabled={show}
                      className={`flex w-full items-center justify-between rounded-xl border-2 p-3 text-left text-sm transition-all ${
                        show && isCorrect
                          ? "border-emerald-500 bg-emerald-500/10"
                          : show && chosen && exerciseHasKey
                            ? "border-destructive bg-destructive/10"
                            : show && chosen
                              ? "border-[var(--violet)] bg-[var(--violet)]/10"
                              : "border-border bg-background/60 hover:border-magenta/50"
                      }`}
                    >
                      <span>{opt}</span>
                      {show && isCorrect && <Check className="h-4 w-4 text-emerald-600" />}
                      {show && chosen && exerciseHasKey && !isCorrect && (
                        <X className="h-4 w-4 text-destructive" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      {answeredCount > 0 && hasAnswerKey && (
        <div className="text-sm text-muted-foreground">
          {locale === "pt" ? "Acertos" : "Correct"}: {correctCount}/{answeredCount}
        </div>
      )}
      {answeredCount > 0 && !hasAnswerKey && (
        <div className="text-sm text-muted-foreground">
          {locale === "pt"
            ? "Inicia sessão para veres a correção."
            : "Sign in to see which answers were correct."}
        </div>
      )}
    </ContentSection>
  );
}

function LessonBody({ lesson, locale }: { lesson: LessonDetail; locale: "pt" | "en" }) {
  const c = lesson.content ?? {};
  const objective = str(c.objective);
  const type = lesson.lesson_type;

  return (
    <div className="space-y-6">
      {objective && (
        <div className="rounded-2xl border border-violet/20 bg-violet/5 p-5 text-sm">
          <span className="font-semibold">{locale === "pt" ? "Objetivo: " : "Objective: "}</span>
          {objective}
        </div>
      )}

      {type === "vocabulary" && Array.isArray(c.wordlist) && (
        <ContentSection title={locale === "pt" ? "Vocabulário" : "Vocabulary"}>
          <div className="grid gap-4 sm:grid-cols-2">
            {(c.wordlist as Record<string, unknown>[]).map((w, i) => (
              <div key={i} className="rounded-2xl border border-border bg-background/60 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-display text-lg font-bold">{str(w.word)}</div>
                  <SpeakButton text={str(w.word)} locale={locale} />
                </div>
                {w.pos ? (
                  <div className="text-xs text-muted-foreground italic">{str(w.pos)}</div>
                ) : null}
                {w.definition ? <p className="mt-1.5 text-sm">{str(w.definition)}</p> : null}
                {w.example ? (
                  <p className="mt-1 text-sm text-muted-foreground">"{str(w.example)}"</p>
                ) : null}
              </div>
            ))}
          </div>
          <BulletList items={strArr(c.activities)} />
        </ContentSection>
      )}

      {type === "grammar" && (
        <ContentSection title={locale === "pt" ? "Gramática" : "Grammar"}>
          {c.focus ? <p className="text-sm text-muted-foreground">{str(c.focus)}</p> : null}
          {c.rule ? <p className="text-sm">{str(c.rule)}</p> : null}
          <BulletList items={strArr(c.examples)} />
          <BulletList items={strArr(c.practice)} />
        </ContentSection>
      )}

      {type === "reading" && (
        <ContentSection title={str(c.text_title) || (locale === "pt" ? "Leitura" : "Reading")}>
          <p className="whitespace-pre-line font-display text-sm leading-relaxed">{str(c.text)}</p>
          <SpeakButton text={str(c.text)} locale={locale} />
          <BulletList items={strArr(c.tasks)} />
        </ContentSection>
      )}

      {type === "listening" && (
        <ContentSection title={locale === "pt" ? "Escuta" : "Listening"}>
          <SpeakButton text={str(c.audio_script)} locale={locale} />
          <p className="text-xs text-muted-foreground">
            {locale === "pt"
              ? "Roteiro (confira depois de ouvir):"
              : "Script (check after listening):"}
          </p>
          <p className="whitespace-pre-line text-sm">{str(c.audio_script)}</p>
          <BulletList items={strArr(c.tasks)} />
        </ContentSection>
      )}

      {type === "writing" && <WritingPractice content={c} locale={locale} />}
      {type === "speaking" && <SpeakingPractice content={c} locale={locale} />}

      {type === "pronunciation" && (
        <ContentSection title={locale === "pt" ? "Pronúncia" : "Pronunciation"}>
          {c.focus ? <p className="text-sm">{str(c.focus)}</p> : null}
          <BulletList items={strArr(c.drills)} />
        </ContentSection>
      )}

      {type === "ipa" && (
        <ContentSection title="IPA">
          <div className="flex flex-wrap gap-2">
            {strArr(c.symbols).map((s, i) => (
              <span key={i} className="rounded-lg bg-muted px-2.5 py-1 font-mono text-sm">
                {s}
              </span>
            ))}
          </div>
          <BulletList items={strArr(c.tasks)} />
        </ContentSection>
      )}

      {type === "review" && (
        <ContentSection title={locale === "pt" ? "Revisão" : "Review"}>
          <BulletList items={strArr(c.recap)} />
          <BulletList items={strArr(c.activities)} />
        </ContentSection>
      )}

      {type === "project" && (
        <ContentSection title={locale === "pt" ? "Projeto" : "Project"}>
          {c.task ? <p className="text-sm">{str(c.task)}</p> : null}
          <BulletList items={strArr(c.deliverables)} />
        </ContentSection>
      )}

      {(type === "quiz" || type === "final_test") && lesson.exercises.length === 0 && (
        <ContentSection title={locale === "pt" ? "Quiz" : "Quiz"}>
          <p className="text-sm text-muted-foreground">
            {locale === "pt"
              ? "Ainda não há perguntas publicadas para esta lição."
              : "No questions published for this lesson yet."}
          </p>
        </ContentSection>
      )}
      {lesson.exercises.length > 0 && <QuizSection exercises={lesson.exercises} locale={locale} />}
    </div>
  );
}

function LessonPage() {
  const { lessonId } = Route.useParams();
  // Forces a fresh mount (and fresh local state — completing/justCompleted,
  // quiz answers, recorded audio, etc.) whenever the route param changes,
  // instead of TanStack Router reusing this component instance across two
  // different lessons and leaking the previous lesson's "completed" state.
  return <LessonPageInner key={lessonId} lessonId={lessonId} />;
}

function LessonPageInner({ lessonId }: { lessonId: string }) {
  const { locale } = useLocale();
  const navigate = useNavigate();
  const notify = useNotification();
  const qc = useQueryClient();

  const { data: lesson, isLoading } = useLesson(lessonId);
  const { data: curriculum } = useCurriculum();
  const { data: progress = [] } = useLessonProgress();

  const unit = curriculum?.units.find((u) => u.id === lesson?.unit_id);
  const course = curriculum?.courses.find((c) => c.id === unit?.course_id);
  const alreadyDone = progress.some(
    (p) => p.lesson_id === lessonId && (!!p.completed_at || p.progress_pct >= 100),
  );

  const [completing, setCompleting] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);

  const completeLesson = async () => {
    setCompleting(true);
    try {
      const result = await apiFetch<CompleteResult>(`/v1/lessons/${lessonId}/complete`, {
        method: "POST",
      });
      setJustCompleted(true);
      if (!result.alreadyCompleted) {
        notify.success(
          locale === "pt"
            ? `+${result.gained ?? 0} XP! ${result.level_up ? `Subiu para o nível ${result.level}! 🎉` : ""}`
            : `+${result.gained ?? 0} XP! ${result.level_up ? `Leveled up to ${result.level}! 🎉` : ""}`,
        );
      }
      qc.invalidateQueries({ queryKey: ["lesson_progress"] });
      qc.invalidateQueries({ queryKey: ["lesson_progress_all"] });
      qc.invalidateQueries({ queryKey: ["user_stats"] });
      qc.invalidateQueries({ queryKey: ["curriculum"] });
    } catch (e) {
      // Consolidates the 402/"Ver planos" branch that used to be hand-checked here.
      notify.fromError(e, { dedupeKey: "lesson:complete", onUpgrade: () => navigate({ to: "/pricing" }) });
    } finally {
      setCompleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="flex items-center justify-center gap-2 py-32 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">
            {locale === "pt" ? "Carregando lição…" : "Loading lesson…"}
          </span>
        </div>
        <SiteFooter />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="mx-auto max-w-2xl px-6 py-20 text-center">
          <p className="text-destructive">
            {locale === "pt" ? "Lição não encontrada." : "Lesson not found."}
          </p>
          <Button asChild className="mt-4">
            <Link to="/curriculum">
              {locale === "pt" ? "Voltar ao currículo" : "Back to curriculum"}
            </Link>
          </Button>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const done = alreadyDone || justCompleted;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Link to="/dashboard" className="hover:text-foreground">
            {locale === "pt" ? "Painel" : "Dashboard"}
          </Link>
          {course && (
            <>
              <span>/</span>
              <span>{course.level}</span>
            </>
          )}
          {unit && (
            <>
              <span>/</span>
              <span>{unit.title}</span>
            </>
          )}
          <span>/</span>
          <span className="font-semibold text-foreground">{lesson.title}</span>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold md:text-4xl">{lesson.title}</h1>
            {lesson.summary && (
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{lesson.summary}</p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {lesson.duration_min ? (
              <div className="glass rounded-full px-3 py-1.5 text-xs font-bold">
                {lesson.duration_min} min
              </div>
            ) : null}
            <div className="rounded-full bg-sunset/10 px-3 py-1.5 text-xs font-bold text-sunset">
              +{lesson.xp_reward} XP
            </div>
          </div>
        </div>

        <div className="mt-8">
          <LessonBody lesson={lesson} locale={locale} />
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row">
          {done ? (
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />{" "}
              {locale === "pt" ? "Lição concluída" : "Lesson completed"}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {locale === "pt"
                ? "Termine a lição para ganhar XP."
                : "Finish the lesson to earn XP."}
            </p>
          )}
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/curriculum">{locale === "pt" ? "Ver currículo" : "View curriculum"}</Link>
            </Button>
            {!done && (
              <Button
                onClick={completeLesson}
                disabled={completing}
                className="bg-gradient-sunset text-white"
              >
                {completing ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Trophy className="mr-1.5 h-4 w-4" />
                )}
                {locale === "pt" ? "Concluir lição" : "Finish lesson"}
              </Button>
            )}
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
