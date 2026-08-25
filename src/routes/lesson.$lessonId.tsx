import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Volume2,
  Mic,
  Check,
  X,
  Trophy,
  Loader2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { VideosSidebar, VideosMobileNav } from "@/components/videos/videos-sidebar";
import { AppHeader } from "@/components/app-header";
import {
  HeaderActionLinks,
  MobileAvatarMenu,
  DesktopAvatarLink,
} from "@/components/mobile-avatar-menu";
import { HeartsIndicator } from "@/components/hearts-indicator";
import { LessonResultBanner, type LessonAttemptResult } from "@/components/lesson-result-banner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/lib/i18n";
import { apiFetch } from "@/lib/api/client";
import { useNotification } from "@/lib/notifications/notification-provider";
import { useCurriculum, useLessonProgress } from "@/lib/learning";
import { useInvalidateHearts } from "@/lib/hearts";
import {
  speak,
  startRecording,
  transcribe,
  scorePronunciation,
  feedbackFor,
  describeTranscriptionRejection,
  type Recorder,
} from "@/lib/voice";
import { describeGetUserMediaError } from "@/lib/media-devices";
import {
  CEFR_LEVELS,
  cefrRank,
  canAccessLevel,
  useMaxUnlockedLevel,
  type CefrLevel,
} from "@/lib/level-access";

export const Route = createFileRoute("/lesson/$lessonId")({
  component: LessonPage,
  head: () => ({
    meta: [{ title: "Aula — Learning English with Coach" }, { name: "robots", content: "noindex" }],
  }),
});

// The exercises table's answer key (correct_answer) is never shipped to the
// client for quiz/final_test lessons anymore — see learningcoachbackEnd's
// getLessonDetail. Grading now happens exclusively server-side via
// POST /lessons/:id/submit; what comes back is `perQuestionFeedback` below.
type ExerciseRow = {
  id: string;
  type: string;
  prompt: string;
  data: {
    options?: string[];
    items?: string[];
    leftItems?: string[];
    rightItems?: string[];
  } | null;
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
  min_pass_score: number;
  hearts_enabled: boolean;
  exercises: ExerciseRow[];
};
type CompleteResult = {
  alreadyCompleted: boolean;
  gained?: number;
  level_up?: boolean;
  level?: number;
};

// Answer shapes per exercise type — mirrors learningcoachbackEnd's
// modules/grading/schemas.ts exerciseResponseSchema exactly.
type McqResponse = { index: number };
type FillBlankResponse = { text: string };
type OrderingResponse = { order: number[] };
type MatchingResponse = { pairs: { left: number; right: number }[] };
type ExerciseResponse = McqResponse | FillBlankResponse | OrderingResponse | MatchingResponse;

type PerQuestionFeedback = {
  exerciseId: string;
  isCorrect: boolean | null;
  score: number;
  feedback?: string;
};
type SubmitLessonAttemptResult = LessonAttemptResult & {
  level?: number;
  levelUp?: boolean;
  perQuestionFeedback: PerQuestionFeedback[];
};

// What comes after the current lesson — see `nextStep` in LessonPageInner.
type NextStep = { type: "lesson"; lessonId: string } | { type: "exam"; level: CefrLevel };

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
      } catch (e) {
        const { title, description } = describeGetUserMediaError(e, locale);
        notify.error(title, { description, dedupeKey: "lesson:mic-permission" });
      }
      return;
    }
    setRecording(false);
    setProcessing(true);
    try {
      const blob = await recorderRef.current!.stop();
      recorderRef.current = null;
      const text = await transcribe(blob, { language: "en" });
      setTranscript(text);
      setScore(scorePronunciation(target, text));
    } catch (e) {
      const rejection = describeTranscriptionRejection(e, locale);
      if (rejection) {
        notify.warning(rejection.title, {
          description: rejection.description,
          dedupeKey: "lesson:no-speech",
        });
      } else {
        notify.fromError(e, { dedupeKey: "lesson:transcribe" });
      }
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

// ---------- Graded exercises (exercises table — quiz/final_test lessons) ----------

function McqInput({
  exercise,
  value,
  feedback,
  locked,
  onChange,
}: {
  exercise: ExerciseRow;
  value: McqResponse | undefined;
  feedback: PerQuestionFeedback | undefined;
  locked: boolean;
  onChange: (r: McqResponse) => void;
}) {
  const options = exercise.data?.options ?? [];
  const picked = value?.index;
  return (
    <div className="mt-3 space-y-2">
      {options.map((opt, i) => {
        const chosen = picked === i;
        const revealed = !!feedback;
        const wrongPick = revealed && chosen && feedback?.isCorrect === false;
        const rightPick = revealed && chosen && feedback?.isCorrect === true;
        return (
          <button
            key={i}
            onClick={() => !locked && onChange({ index: i })}
            disabled={locked}
            className={`flex w-full items-center justify-between rounded-xl border-2 p-3 text-left text-sm transition-all ${
              rightPick
                ? "border-emerald-500 bg-emerald-500/10"
                : wrongPick
                  ? "border-destructive bg-destructive/10"
                  : chosen
                    ? "border-violet bg-violet/10"
                    : "border-border bg-background/60 hover:border-magenta/50"
            }`}
          >
            <span>{opt}</span>
            {rightPick && <Check className="h-4 w-4 text-emerald-600" />}
            {wrongPick && <X className="h-4 w-4 text-destructive" />}
          </button>
        );
      })}
    </div>
  );
}

function FillBlankInput({
  value,
  feedback,
  locked,
  onChange,
  locale,
}: {
  value: FillBlankResponse | undefined;
  feedback: PerQuestionFeedback | undefined;
  locked: boolean;
  onChange: (r: FillBlankResponse) => void;
  locale: "pt" | "en";
}) {
  return (
    <div className="mt-3 space-y-2">
      <Input
        value={value?.text ?? ""}
        onChange={(e) => onChange({ text: e.target.value })}
        disabled={locked}
        placeholder={locale === "pt" ? "A tua resposta..." : "Your answer..."}
        className={
          feedback ? (feedback.isCorrect ? "border-emerald-500" : "border-destructive") : undefined
        }
      />
      {feedback && (
        <div
          className={`flex items-center gap-1.5 text-xs ${feedback.isCorrect ? "text-emerald-600" : "text-destructive"}`}
        >
          {feedback.isCorrect ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
          {feedback.isCorrect
            ? locale === "pt"
              ? "Correto"
              : "Correct"
            : locale === "pt"
              ? "Incorreto"
              : "Incorrect"}
        </div>
      )}
    </div>
  );
}

function OrderingInput({
  exercise,
  value,
  feedback,
  locked,
  onChange,
}: {
  exercise: ExerciseRow;
  value: OrderingResponse | undefined;
  feedback: PerQuestionFeedback | undefined;
  locked: boolean;
  onChange: (r: OrderingResponse) => void;
}) {
  const items = exercise.data?.items ?? [];
  const order = value?.order ?? items.map((_, i) => i);

  const move = (pos: number, dir: -1 | 1) => {
    const target = pos + dir;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[pos], next[target]] = [next[target]!, next[pos]!];
    onChange({ order: next });
  };

  return (
    <div className="mt-3 space-y-2">
      {order.map((itemIndex, pos) => (
        <div
          key={itemIndex}
          className="flex items-center justify-between gap-2 rounded-xl border-2 border-border bg-background/60 p-3 text-sm"
        >
          <span className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground">{pos + 1}.</span>
            {items[itemIndex]}
          </span>
          {!locked && (
            <span className="flex gap-1">
              <button
                type="button"
                onClick={() => move(pos, -1)}
                disabled={pos === 0}
                className="rounded p-1 hover:bg-muted disabled:opacity-30"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => move(pos, 1)}
                disabled={pos === order.length - 1}
                className="rounded p-1 hover:bg-muted disabled:opacity-30"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </span>
          )}
        </div>
      ))}
      {feedback && (
        <div
          className={`flex items-center gap-1.5 text-xs ${feedback.isCorrect ? "text-emerald-600" : "text-destructive"}`}
        >
          {feedback.isCorrect ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
        </div>
      )}
    </div>
  );
}

function MatchingInput({
  exercise,
  value,
  feedback,
  locked,
  onChange,
  locale,
}: {
  exercise: ExerciseRow;
  value: MatchingResponse | undefined;
  feedback: PerQuestionFeedback | undefined;
  locked: boolean;
  onChange: (r: MatchingResponse) => void;
  locale: "pt" | "en";
}) {
  const leftItems = exercise.data?.leftItems ?? [];
  const rightItems = exercise.data?.rightItems ?? [];
  const pairs = value?.pairs ?? [];
  const rightFor = (left: number) => pairs.find((p) => p.left === left)?.right;

  const setRight = (left: number, right: number) => {
    const next = pairs.filter((p) => p.left !== left);
    next.push({ left, right });
    onChange({ pairs: next });
  };

  return (
    <div className="mt-3 space-y-2">
      {leftItems.map((left, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-xl border-2 border-border bg-background/60 p-3 text-sm"
        >
          <span className="flex-1">{left}</span>
          <select
            value={rightFor(i) ?? ""}
            disabled={locked}
            onChange={(e) => setRight(i, Number(e.target.value))}
            className="rounded-lg border border-border bg-background px-2 py-1 text-sm"
          >
            <option value="" disabled>
              {locale === "pt" ? "Escolher..." : "Choose..."}
            </option>
            {rightItems.map((right, j) => (
              <option key={j} value={j}>
                {right}
              </option>
            ))}
          </select>
        </div>
      ))}
      {feedback && (
        <div
          className={`flex items-center gap-1.5 text-xs ${feedback.isCorrect ? "text-emerald-600" : "text-destructive"}`}
        >
          {feedback.isCorrect ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
        </div>
      )}
    </div>
  );
}

function QuizSection({
  exercises,
  answers,
  feedbackByExercise,
  locked,
  onAnswer,
  locale,
}: {
  exercises: ExerciseRow[];
  answers: Record<string, ExerciseResponse>;
  feedbackByExercise: Map<string, PerQuestionFeedback> | null;
  locked: boolean;
  onAnswer: (exerciseId: string, response: ExerciseResponse) => void;
  locale: "pt" | "en";
}) {
  const answeredCount = Object.keys(answers).length;

  return (
    <ContentSection title={locale === "pt" ? "Quiz" : "Quiz"}>
      <div className="space-y-6">
        {exercises.map((ex, qi) => {
          const feedback = feedbackByExercise?.get(ex.id);
          return (
            <div key={ex.id}>
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {locale === "pt" ? `Pergunta ${qi + 1}` : `Question ${qi + 1}`}
              </div>
              <h4 className="mt-1 font-display text-lg font-bold">{ex.prompt}</h4>
              {ex.type === "mcq" && (
                <McqInput
                  exercise={ex}
                  value={answers[ex.id] as McqResponse | undefined}
                  feedback={feedback}
                  locked={locked}
                  onChange={(r) => onAnswer(ex.id, r)}
                />
              )}
              {ex.type === "fill_blank" && (
                <FillBlankInput
                  value={answers[ex.id] as FillBlankResponse | undefined}
                  feedback={feedback}
                  locked={locked}
                  onChange={(r) => onAnswer(ex.id, r)}
                  locale={locale}
                />
              )}
              {ex.type === "ordering" && (
                <OrderingInput
                  exercise={ex}
                  value={answers[ex.id] as OrderingResponse | undefined}
                  feedback={feedback}
                  locked={locked}
                  onChange={(r) => onAnswer(ex.id, r)}
                />
              )}
              {ex.type === "matching" && (
                <MatchingInput
                  exercise={ex}
                  value={answers[ex.id] as MatchingResponse | undefined}
                  feedback={feedback}
                  locked={locked}
                  onChange={(r) => onAnswer(ex.id, r)}
                  locale={locale}
                />
              )}
            </div>
          );
        })}
      </div>
      {!feedbackByExercise && (
        <div className="text-sm text-muted-foreground">
          {locale === "pt"
            ? `Respondidas: ${answeredCount}/${exercises.length}`
            : `Answered: ${answeredCount}/${exercises.length}`}
        </div>
      )}
    </ContentSection>
  );
}

function LessonBody({
  lesson,
  locale,
  answers,
  feedbackByExercise,
  locked,
  onAnswer,
}: {
  lesson: LessonDetail;
  locale: "pt" | "en";
  answers: Record<string, ExerciseResponse>;
  feedbackByExercise: Map<string, PerQuestionFeedback> | null;
  locked: boolean;
  onAnswer: (exerciseId: string, response: ExerciseResponse) => void;
}) {
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
      {lesson.exercises.length > 0 && (
        <QuizSection
          exercises={lesson.exercises}
          answers={answers}
          feedbackByExercise={feedbackByExercise}
          locked={locked}
          onAnswer={onAnswer}
          locale={locale}
        />
      )}
    </div>
  );
}

// Same app-shell wrapper curriculum.tsx uses — a lesson is reached from
// there, so it should keep the same sidebar/header instead of dropping to
// the marketing SiteHeader (NAV-2).
function LessonShell({
  title,
  showHearts,
  locale,
  children,
}: {
  title: string;
  showHearts: boolean;
  locale: "pt" | "en";
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <VideosSidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <AppHeader
          title={title}
          titleLevel="h2"
          actions={
            <>
              {showHearts && <HeartsIndicator locale={locale} />}
              <HeaderActionLinks />
              <MobileAvatarMenu />
              <DesktopAvatarLink />
            </>
          }
        />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-6 scrollbar-hide">{children}</main>
      </div>
      <VideosMobileNav />
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
  const invalidateHearts = useInvalidateHearts();

  const { data: lesson, isLoading, isError, refetch } = useLesson(lessonId);
  const { data: curriculum } = useCurriculum();
  const { data: progress = [] } = useLessonProgress();

  const unit = curriculum?.units.find((u) => u.id === lesson?.unit_id);
  const course = curriculum?.courses.find((c) => c.id === unit?.course_id);
  const alreadyDone = progress.some(
    (p) => p.lesson_id === lessonId && (!!p.completed_at || p.progress_pct >= 100),
  );
  const { data: unlockedLevel } = useMaxUnlockedLevel();

  // What comes after this lesson — the next lesson in this unit, the next
  // unit's first lesson, the next level's first lesson (if already
  // unlocked), or the current level's exam CTA (if not). Same walk
  // curriculum.tsx already does for its "Continuar"/exam banners, just
  // starting from this lesson instead of "first not-done lesson".
  const nextStep = useMemo<NextStep | null>(() => {
    if (!lesson || !unit || !course || !curriculum) return null;

    const unitLessons = curriculum.lessons
      .filter((l) => l.unit_id === unit.id)
      .sort((a, b) => a.order_index - b.order_index);
    const idx = unitLessons.findIndex((l) => l.id === lesson.id);
    const withinUnit = idx >= 0 ? unitLessons[idx + 1] : undefined;
    if (withinUnit) return { type: "lesson", lessonId: withinUnit.id };

    const courseUnits = curriculum.units
      .filter((u) => u.course_id === course.id)
      .sort((a, b) => a.order_index - b.order_index);
    const uIdx = courseUnits.findIndex((u) => u.id === unit.id);
    const nextUnit = uIdx >= 0 ? courseUnits[uIdx + 1] : undefined;
    if (nextUnit) {
      const firstLesson = curriculum.lessons
        .filter((l) => l.unit_id === nextUnit.id)
        .sort((a, b) => a.order_index - b.order_index)[0];
      if (firstLesson) return { type: "lesson", lessonId: firstLesson.id };
    }

    // End of this level's units — next stop is either the next CEFR level
    // (if already unlocked) or that exam CTA (if not).
    const currentLevel = course.level as CefrLevel;
    const nextLevel = CEFR_LEVELS[cefrRank(currentLevel)];
    if (!nextLevel) return null; // already the last level (C2) — nothing further
    if (canAccessLevel(nextLevel, unlockedLevel)) {
      const nextCourse = curriculum.courses.find((c) => c.level === nextLevel);
      const firstUnit = nextCourse
        ? curriculum.units
            .filter((u) => u.course_id === nextCourse.id)
            .sort((a, b) => a.order_index - b.order_index)[0]
        : undefined;
      const firstLesson = firstUnit
        ? curriculum.lessons
            .filter((l) => l.unit_id === firstUnit.id)
            .sort((a, b) => a.order_index - b.order_index)[0]
        : undefined;
      return firstLesson ? { type: "lesson", lessonId: firstLesson.id } : null;
    }
    return { type: "exam", level: currentLevel };
  }, [lesson, unit, course, curriculum, unlockedLevel]);

  // Mirror of the forward walk above, minus the exam-gating branch — going
  // back never requires unlocking anything, so it's just "previous lesson in
  // this unit, else last lesson of the previous unit".
  const prevLessonId = useMemo<string | null>(() => {
    if (!lesson || !unit || !course || !curriculum) return null;

    const unitLessons = curriculum.lessons
      .filter((l) => l.unit_id === unit.id)
      .sort((a, b) => a.order_index - b.order_index);
    const idx = unitLessons.findIndex((l) => l.id === lesson.id);
    const withinUnit = idx > 0 ? unitLessons[idx - 1] : undefined;
    if (withinUnit) return withinUnit.id;

    const courseUnits = curriculum.units
      .filter((u) => u.course_id === course.id)
      .sort((a, b) => a.order_index - b.order_index);
    const uIdx = courseUnits.findIndex((u) => u.id === unit.id);
    const prevUnit = uIdx > 0 ? courseUnits[uIdx - 1] : undefined;
    if (prevUnit) {
      const lastLesson = curriculum.lessons
        .filter((l) => l.unit_id === prevUnit.id)
        .sort((a, b) => b.order_index - a.order_index)[0];
      if (lastLesson) return lastLesson.id;
    }
    return null;
  }, [lesson, unit, course, curriculum]);

  const [completing, setCompleting] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, ExerciseResponse>>({});
  const [attemptResult, setAttemptResult] = useState<SubmitLessonAttemptResult | null>(null);

  const hasGradedExercises = (lesson?.exercises.length ?? 0) > 0;
  const feedbackByExercise = useMemo(
    () =>
      attemptResult
        ? new Map(attemptResult.perQuestionFeedback.map((f) => [f.exerciseId, f]))
        : null,
    [attemptResult],
  );
  const allAnswered =
    hasGradedExercises && Object.keys(answers).length >= (lesson?.exercises.length ?? 0);

  // Auto-advance only off a completion from *this* session (justCompleted),
  // never off revisiting an already-completed lesson (alreadyDone) — someone
  // rereading an old lesson shouldn't get yanked away. The component remounts
  // on every lessonId change (see `key={lessonId}` in LessonPage below), so
  // navigating away manually before the timer fires unmounts this effect and
  // clearTimeout cancels the pending auto-advance on its own.
  useEffect(() => {
    if (!justCompleted || nextStep?.type !== "lesson") return;
    const t = setTimeout(() => {
      navigate({ to: "/lesson/$lessonId", params: { lessonId: nextStep.lessonId } });
    }, 3000);
    return () => clearTimeout(t);
  }, [justCompleted, nextStep, navigate]);

  const handleAnswer = (exerciseId: string, response: ExerciseResponse) => {
    setAnswers((a) => ({ ...a, [exerciseId]: response }));
  };

  const retry = () => {
    setAttemptResult(null);
    setAnswers({});
  };

  const finishLesson = async () => {
    setCompleting(true);
    try {
      if (hasGradedExercises) {
        const payload = {
          answers: Object.entries(answers).map(([exerciseId, response]) => ({
            exerciseId,
            response,
          })),
        };
        const result = await apiFetch<SubmitLessonAttemptResult>(`/v1/lessons/${lessonId}/submit`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setAttemptResult(result);
        invalidateHearts();
        if (result.passed) {
          setJustCompleted(true);
          if (!result.alreadyCompleted) {
            notify.success(
              locale === "pt"
                ? `+${result.xpAwarded} XP! ${result.levelUp ? `Subiu para o nível ${result.level}! 🎉` : ""}`
                : `+${result.xpAwarded} XP! ${result.levelUp ? `Leveled up to ${result.level}! 🎉` : ""}`,
            );
          }
          qc.invalidateQueries({ queryKey: ["lesson_progress"] });
          qc.invalidateQueries({ queryKey: ["lesson_progress_all"] });
          qc.invalidateQueries({ queryKey: ["user_stats"] });
          qc.invalidateQueries({ queryKey: ["curriculum"] });
        }
      } else {
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
      }
    } catch (e) {
      // Consolidates the 402/"Ver planos" branch that used to be hand-checked here,
      // plus HEARTS_DEPLETED (also an "upgrade" action per ErrorCodeMap).
      notify.fromError(e, {
        dedupeKey: "lesson:complete",
        onUpgrade: () => navigate({ to: "/pricing" }),
      });
    } finally {
      setCompleting(false);
    }
  };

  if (isLoading) {
    return (
      <LessonShell title={locale === "pt" ? "Aula" : "Lesson"} showHearts={false} locale={locale}>
        <div className="flex items-center justify-center gap-2 py-32 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">
            {locale === "pt" ? "Carregando lição…" : "Loading lesson…"}
          </span>
        </div>
      </LessonShell>
    );
  }

  if (isError) {
    return (
      <LessonShell title={locale === "pt" ? "Aula" : "Lesson"} showHearts={false} locale={locale}>
        <div className="mx-auto max-w-2xl px-6 py-20 text-center">
          <p className="text-destructive">
            {locale === "pt" ? "Não foi possível carregar a lição." : "Couldn't load the lesson."}
          </p>
          <Button onClick={() => refetch()} className="mt-4">
            {locale === "pt" ? "Tentar novamente" : "Try again"}
          </Button>
        </div>
      </LessonShell>
    );
  }

  if (!lesson) {
    return (
      <LessonShell title={locale === "pt" ? "Aula" : "Lesson"} showHearts={false} locale={locale}>
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
      </LessonShell>
    );
  }

  const done = alreadyDone || justCompleted;
  const canSubmit = hasGradedExercises ? allAnswered && !attemptResult : true;

  return (
    <LessonShell title={lesson.title} showHearts={hasGradedExercises} locale={locale}>
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
          <LessonBody
            lesson={lesson}
            locale={locale}
            answers={answers}
            feedbackByExercise={feedbackByExercise}
            locked={!!attemptResult}
            onAnswer={handleAnswer}
          />
        </div>

        {attemptResult && (
          <div className="mt-6">
            <LessonResultBanner
              result={attemptResult}
              minPassScore={lesson.min_pass_score}
              onRetry={retry}
              retrying={completing}
              locale={locale}
            />
          </div>
        )}

        <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row">
          {done ? (
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
              {justCompleted && nextStep?.type === "lesson" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-5 w-5" />
              )}{" "}
              {locale === "pt" ? "Lição concluída" : "Lesson completed"}
              {justCompleted && nextStep?.type === "lesson" && (
                <span className="font-normal text-muted-foreground">
                  {" "}
                  ·{" "}
                  {locale === "pt"
                    ? "a avançar para a próxima lição…"
                    : "advancing to the next lesson…"}
                </span>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {hasGradedExercises
                ? locale === "pt"
                  ? `Responde a todas as perguntas para submeter (nota mínima: ${lesson.min_pass_score}%).`
                  : `Answer every question to submit (pass score: ${lesson.min_pass_score}%).`
                : locale === "pt"
                  ? "Termine a lição para ganhar XP."
                  : "Finish the lesson to earn XP."}
            </p>
          )}
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/curriculum">{locale === "pt" ? "Ver currículo" : "View curriculum"}</Link>
            </Button>
            {done && nextStep?.type === "exam" && (
              <Button asChild className="bg-amber-600 text-white hover:bg-amber-700">
                <Link to="/level-exam/$level" params={{ level: nextStep.level }}>
                  {locale === "pt"
                    ? `Fazer exame de ${nextStep.level}`
                    : `Take the ${nextStep.level} exam`}
                </Link>
              </Button>
            )}
            {!done && !attemptResult && (
              <Button
                onClick={finishLesson}
                disabled={completing || !canSubmit}
                className="bg-gradient-sunset text-white"
              >
                {completing ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Trophy className="mr-1.5 h-4 w-4" />
                )}
                {hasGradedExercises
                  ? locale === "pt"
                    ? "Submeter respostas"
                    : "Submit answers"
                  : locale === "pt"
                    ? "Concluir lição"
                    : "Finish lesson"}
              </Button>
            )}
          </div>
        </div>

        {(prevLessonId || nextStep?.type === "lesson") && (
          <div className="mt-4 flex items-center justify-between gap-4">
            {prevLessonId ? (
              <Button asChild variant="ghost" size="sm">
                <Link to="/lesson/$lessonId" params={{ lessonId: prevLessonId }}>
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  {locale === "pt" ? "Lição anterior" : "Previous lesson"}
                </Link>
              </Button>
            ) : (
              <span />
            )}
            {nextStep?.type === "lesson" && (
              <Button asChild variant="ghost" size="sm">
                <Link to="/lesson/$lessonId" params={{ lessonId: nextStep.lessonId }}>
                  {locale === "pt" ? "Próxima lição" : "Next lesson"}
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </LessonShell>
  );
}
