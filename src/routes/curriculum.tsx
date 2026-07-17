import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  CEFR_LEVELS,
  cefrRank,
  useMaxUnlockedLevel,
  useMinExamScore,
  type CefrLevel,
} from "@/lib/level-access";

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
} from "lucide-react";


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

type CourseRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  level: CefrLevel;
  order_index: number;
};
type UnitRow = {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  theme: string | null;
  order_index: number;
};
type LessonRow = {
  id: string;
  unit_id: string;
  slug: string;
  title: string;
  summary: string | null;
  duration_min: number | null;
  xp_reward: number | null;
  order_index: number;
  lesson_type: string;
};

function useCurriculum() {
  return useQuery({
    queryKey: ["curriculum"],
    queryFn: async () => {
      const [{ data: courses }, { data: units }, { data: lessons }] = await Promise.all([
        supabase
          .from("courses")
          .select("id,slug,title,description,level,order_index")
          .eq("is_published", true)
          .order("order_index"),
        supabase
          .from("units")
          .select("id,course_id,title,description,theme,order_index")
          .order("order_index"),
        supabase
          .from("lessons")
          .select("id,unit_id,slug,title,summary,duration_min,xp_reward,order_index,lesson_type")
          .eq("is_published", true)
          .order("order_index"),
      ]);
      return {
        courses: (courses ?? []) as CourseRow[],
        units: (units ?? []) as UnitRow[],
        lessons: (lessons ?? []) as LessonRow[],
      };
    },
    staleTime: 60_000,
  });
}

function useProgress() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["lesson_progress_all", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("lesson_progress")
        .select("lesson_id,progress_pct,completed_at")
        .eq("user_id", user!.id);
      const map = new Map<string, { pct: number; done: boolean }>();
      (data ?? []).forEach((p) => {
        map.set(p.lesson_id as string, {
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

function CurriculumPage() {
  const { user } = useAuth();
  const { data: unlocked } = useMaxUnlockedLevel();
  const { data: minScore = 70 } = useMinExamScore();
  const { data, isLoading } = useCurriculum();
  const { data: progressMap } = useProgress();


  const initialLevel: CefrLevel = (unlocked as CefrLevel) ?? "A1";
  const [activeLevel, setActiveLevel] = useState<CefrLevel>(initialLevel);
  const [openUnitId, setOpenUnitId] = useState<string | null>(null);

  const unlockedRank = cefrRank(unlocked ?? null);
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

  // next available lesson within active level (first not-done in unit order)
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



  // Level completion state for exam CTA
  const totalLessonsInLevel = activeUnits.reduce(
    (n, u) => n + (lessonsByUnit.get(u.id)?.length ?? 0),
    0,
  );
  const doneLessonsInLevel = activeUnits.reduce(
    (n, u) => n + (lessonsByUnit.get(u.id) ?? []).filter((l) => progressMap?.get(l.id)?.done).length,
    0,
  );
  const isCurrentLevel = !!user && cefrRank(activeLevel) === unlockedRank;
  const isNotLastLevel = cefrRank(activeLevel) < CEFR_LEVELS.length;
  const levelCompleted =
    isCurrentLevel && totalLessonsInLevel > 0 && doneLessonsInLevel === totalLessonsInLevel;
  const showExamCta = levelCompleted && isNotLastLevel;


  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <section className="container mx-auto px-4 py-10 max-w-5xl">
          <div className="mb-8">
            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3">
              Currículo completo
            </span>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Navegue por A1–C2</h1>
            <p className="text-muted-foreground max-w-2xl">
              Explore todas as unidades por nível CEFR. Continue exatamente onde parou — a próxima lição
              disponível aparece em destaque.
            </p>
          </div>

          {/* Level tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {CEFR_LEVELS.map((lvl) => {
              const rank = cefrRank(lvl);
              const locked = user ? rank > unlockedRank : false;
              const active = lvl === activeLevel;
              return (
                <button
                  key={lvl}
                  onClick={() => setActiveLevel(lvl)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition inline-flex items-center gap-2 ${
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card hover:bg-accent"
                  } ${locked && !active ? "opacity-60" : ""}`}
                >
                  {lvl}
                  {locked && <Lock className="w-3 h-3" />}
                </button>
              );
            })}
          </div>

          {/* Exam CTA — shown when all lessons of current level are done */}
          {showExamCta && (
            <div className="rounded-2xl border p-5 md:p-6 mb-8 bg-gradient-to-br from-amber-500/15 to-primary/5 flex flex-col md:flex-row md:items-center gap-4 md:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-amber-500/20 p-3">
                  <Trophy className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    Exame final · {activeLevel}
                  </div>
                  <div className="font-semibold">Parabéns! Você concluiu todas as lições de {activeLevel}.</div>
                  <div className="text-sm text-muted-foreground">
                    Faça o exame final para desbloquear o próximo nível. Nota mínima:{" "}
                    <strong>{minScore}%</strong> (padrão internacional Cambridge Merit / IELTS ≈ 7.0).
                  </div>
                </div>
              </div>
              <Button asChild size="lg" className="bg-amber-600 hover:bg-amber-700 text-white">
                <Link to="/level-exam/$level" params={{ level: activeLevel }}>
                  Fazer exame final <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          )}

          {/* Continue banner */}
          {user && !activeLevelLocked && nextLesson && !showExamCta && (
            <div className="rounded-2xl border p-5 md:p-6 mb-8 bg-gradient-to-br from-primary/10 to-primary/5 flex flex-col md:flex-row md:items-center gap-4 md:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-primary/15 p-3">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    Próxima lição · {activeLevel}
                  </div>
                  <div className="font-semibold">{nextLesson.lesson.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {nextLesson.unit.title} ·{" "}
                    {LESSON_TYPE_LABEL[nextLesson.lesson.lesson_type] ?? nextLesson.lesson.lesson_type}
                    {nextLesson.lesson.duration_min ? ` · ${nextLesson.lesson.duration_min} min` : ""}
                  </div>
                </div>
              </div>
              <Button asChild size="lg">
                <Link to="/lesson">
                  Continuar <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          )}


          {user && activeLevelLocked && (
            <div className="rounded-2xl border p-6 mb-8 bg-card flex items-start gap-3">
              <Lock className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <div className="font-semibold mb-1">Nível {activeLevel} bloqueado</div>
                <p className="text-sm text-muted-foreground mb-3">
                  Para desbloquear {activeLevel}, conclua o nível atual{unlocked ? ` (${unlocked})` : ""} e
                  passe no exame final.
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link to="/cefr-levels">Ver progresso de níveis</Link>
                </Button>
              </div>
            </div>
          )}

          {!user && (
            <div className="rounded-2xl border p-6 mb-8 bg-card flex flex-col md:flex-row md:items-center gap-4 md:justify-between">
              <div>
                <div className="font-semibold">Entre para desbloquear o seu currículo</div>
                <p className="text-sm text-muted-foreground">
                  Faça o teste de nivelamento e comece pela lição certa.
                </p>
              </div>
              <div className="flex gap-2">
                <Button asChild variant="outline">
                  <Link to="/auth">Entrar</Link>
                </Button>
                <Button asChild>
                  <Link to="/placement">Fazer nivelamento</Link>
                </Button>
              </div>
            </div>
          )}

          {/* Units list */}
          {isLoading ? (
            <div className="text-muted-foreground">Carregando currículo…</div>
          ) : activeUnits.length === 0 ? (
            <div className="text-muted-foreground">Sem unidades publicadas neste nível ainda.</div>
          ) : (
            <div className="space-y-3">
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
                    className={`rounded-xl border bg-card overflow-hidden ${locked ? "opacity-70" : ""}`}
                  >
                    <button
                      className="w-full text-left px-4 md:px-5 py-4 flex items-center gap-3 hover:bg-accent/40 transition"
                      onClick={() => setOpenUnitId(open ? null : u.id)}
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold truncate">{u.title}</span>
                          {locked && <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
                        </div>
                        {u.theme && (
                          <div className="text-xs text-muted-foreground truncate">{u.theme}</div>
                        )}
                        <div className="mt-2 flex items-center gap-3">
                          <Progress value={pct} className="h-1.5 max-w-[200px]" />
                          <span className="text-xs text-muted-foreground">
                            {done}/{total} lições
                          </span>
                        </div>
                      </div>
                      {open ? (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      )}
                    </button>

                    {open && (
                      <div className="border-t bg-background/50">
                        {lessons.length === 0 ? (
                          <div className="px-5 py-4 text-sm text-muted-foreground">
                            Nenhuma lição publicada.
                          </div>
                        ) : (
                          <ul className="divide-y">
                            {lessons.map((l) => {
                              const p = progressMap?.get(l.id);
                              const isDone = !!p?.done;
                              const isNext =
                                nextLesson?.lesson.id === l.id && !locked;
                              return (
                                <li
                                  key={l.id}
                                  className={`px-4 md:px-5 py-3 flex items-center gap-3 ${
                                    isNext ? "bg-primary/5" : ""
                                  }`}
                                >
                                  <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                                    {locked ? (
                                      <Lock className="w-4 h-4 text-muted-foreground" />
                                    ) : isDone ? (
                                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    ) : (
                                      <BookOpen className="w-4 h-4 text-muted-foreground" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium truncate">{l.title}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {LESSON_TYPE_LABEL[l.lesson_type] ?? l.lesson_type}
                                      {l.duration_min ? ` · ${l.duration_min} min` : ""}
                                      {l.xp_reward ? ` · +${l.xp_reward} XP` : ""}
                                    </div>
                                  </div>
                                  {locked ? (
                                    <span className="text-xs text-muted-foreground">Bloqueado</span>
                                  ) : (
                                    <Button
                                      asChild
                                      size="sm"
                                      variant={isNext ? "default" : isDone ? "outline" : "secondary"}
                                    >
                                      <Link to="/lesson">
                                        {isDone ? "Rever" : isNext ? "Iniciar" : "Abrir"}
                                        <PlayCircle className="w-4 h-4 ml-1.5" />
                                      </Link>
                                    </Button>
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
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
