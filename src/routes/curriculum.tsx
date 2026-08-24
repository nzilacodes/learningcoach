import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";
import { useLocale } from "@/lib/i18n";
import {
  CEFR_LEVELS,
  cefrRank,
  useMaxUnlockedLevel,
  useMinExamScore,
  type CefrLevel,
} from "@/lib/level-access";
import { useCurriculum, type LessonRow } from "@/lib/learning";
import { VideosSidebar, VideosMobileNav } from "@/components/videos/videos-sidebar";
import { AppHeader } from "@/components/app-header";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Lock,
  PlayCircle,
  Sparkles,
  Trophy,
  Loader2,
} from "lucide-react";
import {
  HeaderActionLinks,
  MobileAvatarMenu,
  DesktopAvatarLink,
} from "@/components/mobile-avatar-menu";

export const Route = createFileRoute("/curriculum")({
  component: CurriculumPage,
  head: () => ({
    meta: [
      { title: "Currículo A1–C2 — Learning English with Coach" },
      {
        name: "description",
        content:
          "Navegue pelos níveis CEFR A1–C2, veja unidades bloqueadas e desbloqueadas e continue exatamente na próxima lição disponível.",
      },
      { property: "og:title", content: "Currículo A1–C2 — Learning English with Coach" },
      {
        property: "og:description",
        content:
          "Percorra o currículo completo de inglês por nível CEFR e continue a próxima lição disponível.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
});

function useProgress() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["lesson_progress_all", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const data =
        await apiFetch<{ lesson_id: string; progress_pct: number; completed_at: string | null }[]>(
          "/v1/me/progress",
        );
      const map = new Map<string, { pct: number; done: boolean }>();
      data.forEach((p) => {
        map.set(p.lesson_id, {
          pct: p.progress_pct ?? 0,
          done: !!p.completed_at || (p.progress_pct ?? 0) >= 100,
        });
      });
      return map;
    },
  });
}

const LESSON_TYPE_LABEL: Record<string, string> = {
  vocabulary: "Vocabulary",
  grammar: "Grammar",
  reading: "Reading",
  listening: "Listening",
  writing: "Writing",
  speaking: "Speaking",
  pronunciation: "Pronunciation",
  ipa: "IPA",
  review: "Review",
  quiz: "Quiz",
  final_test: "Final Test",
  project: "Project",
};

const LEVEL_META: Record<
  CefrLevel,
  { label: { pt: string; en: string }; tone: string; bar: string }
> = {
  A1: {
    label: { pt: "Iniciante", en: "Beginner" },
    tone: "from-emerald-500/15 to-emerald-500/5",
    bar: "bg-emerald-500",
  },
  A2: {
    label: { pt: "Elementar", en: "Elementary" },
    tone: "from-teal-500/15 to-teal-500/5",
    bar: "bg-teal-500",
  },
  B1: {
    label: { pt: "Intermédio", en: "Intermediate" },
    tone: "from-sky-500/15 to-sky-500/5",
    bar: "bg-sky-500",
  },
  B2: {
    label: { pt: "Intermédio-alto", en: "Upper-Int." },
    tone: "from-blue-500/15 to-blue-500/5",
    bar: "bg-blue-500",
  },
  C1: {
    label: { pt: "Avançado", en: "Advanced" },
    tone: "from-violet-500/15 to-violet-500/5",
    bar: "bg-violet-500",
  },
  C2: {
    label: { pt: "Proficiente", en: "Proficient" },
    tone: "from-indigo-500/15 to-indigo-500/5",
    bar: "bg-indigo-500",
  },
};

function CurriculumPage() {
  const { locale } = useLocale();
  const { user } = useAuth();
  const { data: unlocked } = useMaxUnlockedLevel();
  const { data: minScore = 70 } = useMinExamScore();
  const { data, isLoading, isError, refetch } = useCurriculum();
  const { data: progressMap } = useProgress();

  const initialLevel: CefrLevel = (unlocked as CefrLevel) ?? "A1";
  const [activeLevel, setActiveLevel] = useState<CefrLevel>(initialLevel);
  const [openUnitId, setOpenUnitId] = useState<string | null>(null);

  // Before the placement diagnostic, `unlocked` is null — default to A1 so
  // the easiest level isn't locked too (same fallback as cefr-levels.tsx).
  const unlockedRank = cefrRank(unlocked ?? "A1");
  const activeCourse = data?.courses.find((c) => c.level === activeLevel);
  const activeUnits = useMemo(
    () => (activeCourse ? data!.units.filter((u) => u.course_id === activeCourse.id) : []),
    [activeCourse, data],
  );
  const lessonsByUnit = useMemo(() => {
    const m = new Map<string, LessonRow[]>();
    (data?.lessons ?? []).forEach((l) => {
      const arr = m.get(l.unit_id) ?? [];
      arr.push(l);
      m.set(l.unit_id, arr);
    });
    return m;
  }, [data]);

  const activeLevelLocked = user ? cefrRank(activeLevel) > unlockedRank : false;

  const nextLesson = useMemo(() => {
    if (activeLevelLocked) return null;
    for (const u of activeUnits) {
      const list = lessonsByUnit.get(u.id) ?? [];
      for (const l of list) {
        const p = progressMap?.get(l.id);
        if (!p?.done) return { unit: u, lesson: l };
      }
    }
    return null;
  }, [activeUnits, lessonsByUnit, progressMap, activeLevelLocked]);

  const totalLessonsInLevel = activeUnits.reduce(
    (n, u) => n + (lessonsByUnit.get(u.id)?.length ?? 0),
    0,
  );
  const doneLessonsInLevel = activeUnits.reduce(
    (n, u) =>
      n + (lessonsByUnit.get(u.id) ?? []).filter((l) => progressMap?.get(l.id)?.done).length,
    0,
  );
  const levelPct = totalLessonsInLevel
    ? Math.round((doneLessonsInLevel / totalLessonsInLevel) * 100)
    : 0;
  const isCurrentLevel = !!user && cefrRank(activeLevel) === unlockedRank;
  const isNotLastLevel = cefrRank(activeLevel) < CEFR_LEVELS.length;
  const levelCompleted =
    isCurrentLevel && totalLessonsInLevel > 0 && doneLessonsInLevel === totalLessonsInLevel;
  const showExamCta = levelCompleted && isNotLastLevel;

  const levelMeta = LEVEL_META[activeLevel];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <VideosSidebar />

      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <AppHeader
          title={locale === "pt" ? "Currículo" : "Curriculum"}
          actions={
            <>
              <HeaderActionLinks />
              <MobileAvatarMenu />
              <DesktopAvatarLink />
            </>
          }
        />

        <main className="flex-1 overflow-y-auto pb-20 md:pb-6 scrollbar-hide">
          {/* Path hero */}
          <div className="bg-ink text-white">
            <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                  <span className="text-2xs md:text-xs font-bold uppercase tracking-widest text-white/60">
                    {locale === "pt" ? "Percurso CEFR" : "CEFR path"} · A1–C2
                  </span>
                  <h2 className="mt-2 font-display text-2xl md:text-3xl font-bold">
                    {locale === "pt" ? "Navegue por A1–C2" : "Browse A1–C2"}
                  </h2>
                  <p className="mt-2 text-sm text-white/70 max-w-xl">
                    {locale === "pt"
                      ? "Explore unidades por nível. Continue exatamente onde parou — a próxima lição aparece em destaque."
                      : "Explore units by level. Continue exactly where you left off — the next lesson is highlighted."}
                  </p>
                </div>
                {user && (
                  <div className="rounded-2xl bg-white/10 border border-white/10 px-4 py-3 min-w-[180px]">
                    <div className="text-2xs uppercase tracking-wider text-white/60 font-bold">
                      {locale === "pt" ? "Nível atual" : "Current level"}
                    </div>
                    <div className="mt-1 font-display text-2xl font-bold">{unlocked ?? "A1"}</div>
                    <div className="text-xs text-white/60">
                      {locale === "pt" ? "Desbloqueado" : "Unlocked"}
                    </div>
                  </div>
                )}
              </div>

              {/* CEFR roadmap */}
              <div className="mt-6 flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-hide pb-1">
                {CEFR_LEVELS.map((lvl, i) => {
                  const rank = cefrRank(lvl);
                  const locked = user ? rank > unlockedRank : false;
                  const active = lvl === activeLevel;
                  const completed = user ? rank < unlockedRank : false;
                  return (
                    <div key={lvl} className="flex items-center shrink-0">
                      <button
                        onClick={() => setActiveLevel(lvl)}
                        className={`relative flex flex-col items-center gap-1 px-3 sm:px-4 py-2.5 rounded-2xl transition-all min-w-[64px] sm:min-w-[76px] ${
                          active
                            ? "bg-white text-ink shadow-lg"
                            : locked
                              ? "bg-white/5 text-white/40"
                              : "bg-white/10 text-white hover:bg-white/15"
                        }`}
                      >
                        <span className="font-display text-base sm:text-lg font-bold">{lvl}</span>
                        <span className="text-2xs sm:text-2xs font-semibold uppercase tracking-wide opacity-70">
                          {locale === "pt" ? LEVEL_META[lvl].label.pt : LEVEL_META[lvl].label.en}
                        </span>
                        {locked && (
                          <Lock className="absolute -top-1 -right-1 w-3.5 h-3.5 text-white/50" />
                        )}
                        {completed && !active && (
                          <CheckCircle2 className="absolute -top-1 -right-1 w-3.5 h-3.5 text-emerald-400" />
                        )}
                      </button>
                      {i < CEFR_LEVELS.length - 1 && (
                        <div
                          className={`w-3 sm:w-6 h-0.5 mx-0.5 rounded-full ${
                            user && cefrRank(lvl) < unlockedRank
                              ? "bg-emerald-400/80"
                              : "bg-white/15"
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-10 space-y-5">
            {/* Active level summary */}
            <div
              className={`rounded-2xl border border-gray-100 bg-gradient-to-br ${levelMeta.tone} p-5 md:p-6`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-gray-100 font-display font-bold text-ink shadow-sm">
                      {activeLevel}
                    </span>
                    <div>
                      <div className="font-display text-lg font-bold text-ink">
                        {activeCourse?.title ??
                          `${locale === "pt" ? "Nível" : "Level"} ${activeLevel}`}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {locale === "pt" ? levelMeta.label.pt : levelMeta.label.en}
                        {activeUnits.length > 0 &&
                          ` · ${activeUnits.length} ${locale === "pt" ? "unidades" : "units"}`}
                        {totalLessonsInLevel > 0 &&
                          ` · ${doneLessonsInLevel}/${totalLessonsInLevel} ${locale === "pt" ? "lições" : "lessons"}`}
                      </div>
                    </div>
                  </div>
                  {activeCourse?.description && (
                    <p className="mt-3 text-sm text-muted-foreground max-w-2xl">
                      {activeCourse.description}
                    </p>
                  )}
                </div>
                {user && !activeLevelLocked && totalLessonsInLevel > 0 && (
                  <div className="sm:w-48 shrink-0">
                    <div className="flex justify-between text-2xs font-semibold text-muted-foreground mb-1.5">
                      <span>{locale === "pt" ? "Progresso" : "Progress"}</span>
                      <span>{levelPct}%</span>
                    </div>
                    <div className="h-2 bg-white/80 rounded-full overflow-hidden border border-gray-100">
                      <div
                        className={`h-full rounded-full transition-all ${levelMeta.bar}`}
                        style={{ width: `${levelPct}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Exam CTA */}
            {showExamCta && (
              <div className="rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50 to-white p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-4 md:justify-between">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-amber-100 p-3 shrink-0">
                    <Trophy className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <div className="text-2xs uppercase tracking-widest font-bold text-amber-700/70">
                      {locale === "pt" ? "Exame final" : "Final exam"} · {activeLevel}
                    </div>
                    <div className="font-display font-bold text-ink mt-0.5">
                      {locale === "pt"
                        ? `Parabéns! Concluiu todas as lições de ${activeLevel}.`
                        : `Congrats! You finished all ${activeLevel} lessons.`}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {locale === "pt"
                        ? `Faça o exame final para desbloquear o próximo nível. Nota mínima: ${minScore}%.`
                        : `Take the final exam to unlock the next level. Minimum score: ${minScore}%.`}
                    </div>
                  </div>
                </div>
                <Link
                  to="/level-exam/$level"
                  params={{ level: activeLevel }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 text-sm font-semibold transition-colors shrink-0"
                >
                  {locale === "pt" ? "Fazer exame final" : "Take final exam"}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}

            {/* Continue banner */}
            {user && !activeLevelLocked && nextLesson && !showExamCta && (
              <div className="rounded-2xl border border-violet/20 bg-gradient-to-br from-violet/8 to-white p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-4 md:justify-between">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-violet/15 p-3 shrink-0">
                    <Sparkles className="w-5 h-5 text-violet" />
                  </div>
                  <div>
                    <div className="text-2xs uppercase tracking-widest font-bold text-violet/70">
                      {locale === "pt" ? "Próxima lição" : "Next lesson"} · {activeLevel}
                    </div>
                    <div className="font-display font-bold text-ink mt-0.5">
                      {nextLesson.lesson.title}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {nextLesson.unit.title} ·{" "}
                      {LESSON_TYPE_LABEL[nextLesson.lesson.lesson_type] ??
                        nextLesson.lesson.lesson_type}
                      {nextLesson.lesson.duration_min
                        ? ` · ${nextLesson.lesson.duration_min} min`
                        : ""}
                    </div>
                  </div>
                </div>
                <Link
                  to="/lesson/$lessonId"
                  params={{ lessonId: nextLesson.lesson.id }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-white px-5 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity shrink-0"
                >
                  {locale === "pt" ? "Continuar" : "Continue"}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}

            {/* Locked level */}
            {user && activeLevelLocked && (
              <div className="rounded-2xl border border-gray-100 bg-white p-5 md:p-6 flex items-start gap-3">
                <div className="rounded-xl bg-gray-50 p-3 shrink-0">
                  <Lock className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <div className="font-display font-bold text-ink">
                    {locale === "pt"
                      ? `Nível ${activeLevel} bloqueado`
                      : `Level ${activeLevel} locked`}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 mb-3">
                    {locale === "pt"
                      ? `Para desbloquear ${activeLevel}, conclua o nível atual${unlocked ? ` (${unlocked})` : ""} e passe no exame final.`
                      : `To unlock ${activeLevel}, finish your current level${unlocked ? ` (${unlocked})` : ""} and pass the final exam.`}
                  </p>
                  <Link
                    to="/cefr-levels"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-gray-50 transition-colors"
                  >
                    {locale === "pt" ? "Ver progresso de níveis" : "View level progress"}
                  </Link>
                </div>
              </div>
            )}

            {/* Guest CTA */}
            {!user && (
              <div className="rounded-2xl border border-gray-100 bg-white p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-4 md:justify-between">
                <div>
                  <div className="font-display font-bold text-ink">
                    {locale === "pt"
                      ? "Entre para desbloquear o seu currículo"
                      : "Sign in to unlock your curriculum"}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {locale === "pt"
                      ? "Faça o teste de nivelamento e comece pela lição certa."
                      : "Take the placement test and start at the right lesson."}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    to="/auth"
                    className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-gray-50 transition-colors"
                  >
                    {locale === "pt" ? "Entrar" : "Sign in"}
                  </Link>
                  <Link
                    to="/placement"
                    className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                  >
                    {locale === "pt" ? "Fazer nivelamento" : "Take placement"}
                  </Link>
                </div>
              </div>
            )}

            {/* Units list */}
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">
                  {locale === "pt" ? "Carregando currículo…" : "Loading curriculum…"}
                </span>
              </div>
            ) : isError ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 py-16 text-center">
                <p className="text-sm text-muted-foreground">
                  {locale === "pt"
                    ? "Não foi possível carregar o currículo."
                    : "Couldn't load the curriculum."}
                </p>
                <button
                  onClick={() => refetch()}
                  className="mt-4 inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                >
                  {locale === "pt" ? "Tentar novamente" : "Try again"}
                </button>
              </div>
            ) : activeUnits.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 py-16 text-center">
                <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  {locale === "pt"
                    ? "Sem unidades publicadas neste nível ainda."
                    : "No units published for this level yet."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">
                  {locale === "pt" ? "Unidades" : "Units"}
                </h3>
                {activeUnits.map((u, idx) => {
                  const lessons = lessonsByUnit.get(u.id) ?? [];
                  const total = lessons.length;
                  const done = lessons.filter((l) => progressMap?.get(l.id)?.done).length;
                  const pct = total ? Math.round((done / total) * 100) : 0;
                  const locked = activeLevelLocked;
                  const open = openUnitId === u.id;
                  return (
                    <div
                      key={u.id}
                      className={`rounded-2xl border bg-white overflow-hidden transition-all ${
                        locked
                          ? "border-gray-100 opacity-70"
                          : open
                            ? "border-violet/25 shadow-md"
                            : "border-gray-100 hover:shadow-sm"
                      }`}
                    >
                      <button
                        className="w-full text-left px-4 md:px-5 py-4 flex items-center gap-3 hover:bg-gray-50/60 transition-colors"
                        onClick={() => setOpenUnitId(open ? null : u.id)}
                      >
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center font-display font-bold shrink-0 ${
                            pct === 100
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-violet/10 text-violet"
                          }`}
                        >
                          {pct === 100 ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-ink truncate">{u.title}</span>
                            {locked && (
                              <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            )}
                          </div>
                          {u.theme && (
                            <div className="text-xs text-muted-foreground truncate mt-0.5">
                              {u.theme}
                            </div>
                          )}
                          <div className="mt-2 flex items-center gap-3">
                            <div className="h-1.5 flex-1 max-w-[200px] bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  pct === 100 ? "bg-emerald-500" : "bg-primary"
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground font-medium shrink-0">
                              {done}/{total} {locale === "pt" ? "lições" : "lessons"}
                            </span>
                          </div>
                        </div>
                        {open ? (
                          <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                        )}
                      </button>

                      {open && (
                        <div className="border-t border-gray-50 bg-gray-50/40">
                          {lessons.length === 0 ? (
                            <div className="px-5 py-4 text-sm text-muted-foreground">
                              {locale === "pt"
                                ? "Nenhuma lição publicada."
                                : "No lessons published."}
                            </div>
                          ) : (
                            <ul className="divide-y divide-gray-100">
                              {lessons.map((l) => {
                                const p = progressMap?.get(l.id);
                                const isDone = !!p?.done;
                                const isNext = nextLesson?.lesson.id === l.id && !locked;
                                return (
                                  <li
                                    key={l.id}
                                    className={`px-4 md:px-5 py-3.5 flex items-center gap-3 ${
                                      isNext ? "bg-violet/5" : ""
                                    }`}
                                  >
                                    <div
                                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                        locked
                                          ? "bg-gray-100"
                                          : isDone
                                            ? "bg-emerald-50"
                                            : isNext
                                              ? "bg-violet/10"
                                              : "bg-white border border-gray-100"
                                      }`}
                                    >
                                      {locked ? (
                                        <Lock className="w-4 h-4 text-muted-foreground" />
                                      ) : isDone ? (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                      ) : (
                                        <BookOpen
                                          className={`w-4 h-4 ${isNext ? "text-violet" : "text-muted-foreground"}`}
                                        />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm font-semibold text-ink truncate">
                                        {l.title}
                                        {isNext && (
                                          <span className="ml-2 inline-flex rounded-full bg-violet/10 text-violet px-1.5 py-0.5 text-2xs font-bold">
                                            {locale === "pt" ? "Seguinte" : "Next"}
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-xs text-muted-foreground mt-0.5">
                                        {LESSON_TYPE_LABEL[l.lesson_type] ?? l.lesson_type}
                                        {l.duration_min ? ` · ${l.duration_min} min` : ""}
                                        {l.xp_reward ? ` · +${l.xp_reward} XP` : ""}
                                      </div>
                                    </div>
                                    {locked ? (
                                      <span className="text-xs text-muted-foreground font-medium shrink-0">
                                        {locale === "pt" ? "Bloqueado" : "Locked"}
                                      </span>
                                    ) : (
                                      <Link
                                        to="/lesson/$lessonId"
                                        params={{ lessonId: l.id }}
                                        className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold shrink-0 transition-all ${
                                          isNext
                                            ? "bg-primary text-white hover:opacity-90"
                                            : isDone
                                              ? "border border-gray-200 text-muted-foreground hover:bg-white"
                                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                        }`}
                                      >
                                        {isDone
                                          ? locale === "pt"
                                            ? "Rever"
                                            : "Review"
                                          : isNext
                                            ? locale === "pt"
                                              ? "Iniciar"
                                              : "Start"
                                            : locale === "pt"
                                              ? "Abrir"
                                              : "Open"}
                                        <PlayCircle className="w-3.5 h-3.5" />
                                      </Link>
                                    )}
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      <VideosMobileNav />
    </div>
  );
}
