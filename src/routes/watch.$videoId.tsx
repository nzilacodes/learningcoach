import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { apiFetch } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";
import { useAgeGroup } from "@/lib/use-age-group";
import { buildEmbedUrl, youtubeThumb } from "@/lib/youtube";
import { formatDuration } from "@/lib/media";
import {
  Loader2,
  PlayCircle,
  BookOpen,
  FileText,
  ListChecks,
  Ear,
  Mic,
  BookMarked,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { useNotification } from "@/lib/notifications/notification-provider";

const searchSchema = z.object({
  lesson: z.string().optional(),
  title: z.string().optional(),
  channel: z.string().optional(),
  level: z.string().optional(),
  topic: z.string().optional(),
});

export const Route = createFileRoute("/watch/$videoId")({
  component: WatchPage,
  validateSearch: (raw) => searchSchema.parse(raw),
  head: ({ params }) => ({
    meta: [
      { title: `Aula em vídeo · ${params.videoId} — Learning English with Coach` },
      {
        name: "description",
        content:
          "Aula em vídeo com transcrição, legendas, resumo, quiz e atividades de listening, vocabulary e speaking.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
});

type HistoryRow = {
  video_id: string;
  position_seconds: number;
  duration_seconds: number | null;
  completed: boolean;
};

type StudyPack = {
  transcript_excerpt: string;
  summary: string;
  key_vocabulary: { word: string; pt: string; example: string }[];
  quiz: { q: string; opts: string[]; a: number }[];
  listening_activities: string[];
  speaking_activities: string[];
  vocabulary_activities: string[];
};

function WatchPage() {
  const { videoId } = Route.useParams();
  const search = useSearch({ from: "/watch/$videoId" });
  const { user } = useAuth();
  const { group } = useAgeGroup();
  const qc = useQueryClient();
  const notify = useNotification();

  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const title = search.title ?? "YouTube lesson";
  const channel = search.channel ?? "";
  const level = search.level ?? "A2";
  const topic = search.topic ?? title;

  // History fetch
  const { data: history, isError: historyError } = useQuery({
    queryKey: ["video_history", user?.id, videoId],
    enabled: !!user,
    queryFn: () =>
      apiFetch<HistoryRow | null>(`/v1/me/video-history/${encodeURIComponent(videoId)}`),
  });

  const resumeAt = history?.position_seconds ?? 0;
  const [startAt, setStartAt] = useState<number | null>(null);

  useEffect(() => {
    // Decide start once history has loaded — but `history` also stays
    // `undefined` forever after a failed fetch (indistinguishable from
    // "still loading"), which used to leave the player frozen on its
    // spinner permanently. On error, just start from 0 instead of resuming.
    if (history === undefined && !historyError) return;
    setStartAt(resumeAt > 5 ? resumeAt : 0);
  }, [history, historyError, resumeAt]);

  // Study pack (AI-generated + cached)
  const {
    data: pack,
    isLoading: packLoading,
    error: packError,
    refetch: refetchPack,
  } = useQuery({
    queryKey: ["video_study_pack", videoId],
    enabled: !!user,
    staleTime: 60 * 60 * 1000,
    queryFn: () => {
      const params = new URLSearchParams({
        videoUrl,
        title,
        channel,
        level,
        topic,
        ageGroup: group,
      });
      return apiFetch<StudyPack>(`/v1/videos/${encodeURIComponent(videoId)}/study-pack?${params}`);
    },
  });

  // Progress ticker (fake progress, since YT iframe API adds ~40KB. We save every 15s a bumped position.)
  const positionRef = useRef<number>(resumeAt || 0);
  useEffect(() => {
    positionRef.current = resumeAt || 0;
  }, [resumeAt]);

  const upsertHistory = useMutation({
    mutationFn: async (payload: { position: number; completed?: boolean }) => {
      if (!user) return;
      await apiFetch(`/v1/me/video-history/${encodeURIComponent(videoId)}`, {
        method: "PUT",
        body: JSON.stringify({
          videoUrl,
          title,
          channel,
          lessonId: search.lesson ?? undefined,
          positionSeconds: Math.floor(payload.position),
          completed: !!payload.completed,
        }),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["video_history"] }),
  });

  // The periodic saves are intentionally best-effort/silent (no toast every
  // 15s if the connection is flaky), but a persistent failure was previously
  // completely invisible — this surfaces it once per page visit instead.
  const saveErrorShownRef = useRef(false);
  const saveProgress = (position: number) => {
    upsertHistory.mutateAsync({ position }).catch(() => {
      if (!saveErrorShownRef.current) {
        saveErrorShownRef.current = true;
        notify.error("Não foi possível guardar o seu progresso neste vídeo.");
      }
    });
  };

  useEffect(() => {
    if (!user || startAt == null) return;
    // Save initial position immediately so it appears in Continue watching.
    saveProgress(positionRef.current);
    const interval = setInterval(() => {
      positionRef.current += 15;
      saveProgress(positionRef.current);
    }, 15_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, startAt]);

  const markCompleted = async () => {
    try {
      await upsertHistory.mutateAsync({ position: positionRef.current, completed: true });
      notify.success("Aula em vídeo concluída!");
    } catch (e) {
      notify.fromError(e, { dedupeKey: "watch:mark-complete" });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1 container mx-auto px-4 py-16 max-w-lg text-center">
          <img src={youtubeThumb(videoId)} alt="" className="w-full rounded-xl mb-6" />
          <h1 className="text-2xl font-bold mb-2">Entre para assistir</h1>
          <p className="text-muted-foreground mb-4">
            Guardamos o seu progresso e geramos automaticamente transcrição, quiz e atividades para
            cada vídeo.
          </p>
          <Button asChild>
            <Link to="/auth">Entrar</Link>
          </Button>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        <Link
          to="/videos"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Biblioteca de vídeos
        </Link>

        <h1 className="text-2xl md:text-3xl font-bold mb-1">{title}</h1>
        <div className="text-sm text-muted-foreground mb-4">
          {channel} · {level} · {topic}
        </div>

        {/* Player */}
        <div className="aspect-video w-full rounded-2xl overflow-hidden border bg-black mb-4">
          {startAt == null ? (
            <div className="w-full h-full grid place-items-center text-white/70">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <iframe
              key={`${videoId}-${startAt}`}
              className="w-full h-full"
              src={buildEmbedUrl(videoId, startAt)}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          {resumeAt > 5 && (
            <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary inline-flex items-center gap-1">
              <PlayCircle className="w-3.5 h-3.5" />
              Retomado em {formatDuration(resumeAt, { padMinutes: false })}
            </span>
          )}
          <Button size="sm" variant="outline" onClick={markCompleted}>
            <CheckCircle2 className="w-4 h-4 mr-1" /> Marcar como concluído
          </Button>
          {packError && (
            <Button size="sm" variant="ghost" onClick={() => refetchPack()}>
              Tentar regenerar materiais
            </Button>
          )}
          <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Materiais gerados por IA
          </span>
        </div>

        {/* Study pack tabs */}
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="flex flex-wrap h-auto">
            <TabsTrigger value="summary">
              <FileText className="w-4 h-4 mr-1" /> Resumo
            </TabsTrigger>
            <TabsTrigger value="transcript">
              <BookOpen className="w-4 h-4 mr-1" /> Transcrição
            </TabsTrigger>
            <TabsTrigger value="quiz">
              <ListChecks className="w-4 h-4 mr-1" /> Quiz
            </TabsTrigger>
            <TabsTrigger value="listening">
              <Ear className="w-4 h-4 mr-1" /> Listening
            </TabsTrigger>
            <TabsTrigger value="vocab">
              <BookMarked className="w-4 h-4 mr-1" /> Vocabulary
            </TabsTrigger>
            <TabsTrigger value="speaking">
              <Mic className="w-4 h-4 mr-1" /> Speaking
            </TabsTrigger>
          </TabsList>

          <div className="mt-4">
            {packLoading && (
              <div className="flex items-center gap-2 text-muted-foreground p-6">
                <Loader2 className="w-4 h-4 animate-spin" /> Gerando materiais da aula…
              </div>
            )}

            {pack && (
              <>
                <TabsContent value="summary">
                  <Card>
                    <p className="text-sm text-muted-foreground mb-3">
                      Resumo gerado por IA com base no título e tema — pode conter imprecisões.
                    </p>
                    <p className="whitespace-pre-line leading-relaxed">{pack.summary}</p>
                  </Card>
                </TabsContent>

                <TabsContent value="transcript">
                  <Card>
                    <p className="text-sm text-muted-foreground mb-3">
                      Excerto simulado com base no título e tema. As legendas nativas do YouTube
                      estão ativadas no player (botão CC).
                    </p>
                    <p className="whitespace-pre-line leading-relaxed">{pack.transcript_excerpt}</p>
                  </Card>
                </TabsContent>

                <TabsContent value="quiz">
                  <QuizBlock quiz={pack.quiz} />
                </TabsContent>

                <TabsContent value="listening">
                  <ChecklistCard title="Atividades de escuta" items={pack.listening_activities} />
                </TabsContent>

                <TabsContent value="vocab">
                  <Card>
                    {pack.key_vocabulary.length === 0 ? (
                      <p className="text-muted-foreground">Sem vocabulário gerado.</p>
                    ) : (
                      <ul className="divide-y">
                        {pack.key_vocabulary.map((v) => (
                          <li key={v.word} className="py-3">
                            <div className="font-semibold">
                              {v.word}{" "}
                              <span className="text-muted-foreground text-sm">— {v.pt}</span>
                            </div>
                            <div className="text-sm text-muted-foreground italic">
                              "{v.example}"
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-4">
                      <ChecklistCard
                        title="Praticar vocabulário"
                        items={pack.vocabulary_activities}
                        embedded
                      />
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="speaking">
                  <ChecklistCard title="Prática de fala" items={pack.speaking_activities} />
                </TabsContent>
              </>
            )}
          </div>
        </Tabs>
      </main>
      <SiteFooter />
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border bg-card p-5">{children}</div>;
}

function ChecklistCard({
  title,
  items,
  embedded = false,
}: {
  title: string;
  items: string[];
  embedded?: boolean;
}) {
  const [done, setDone] = useState<Record<number, boolean>>({});
  const body = (
    <>
      <h3 className={embedded ? "font-semibold mb-3" : "font-semibold mb-3 text-lg"}>{title}</h3>
      <ul className="space-y-2">
        {items.map((t, i) => (
          <li key={i}>
            <button
              onClick={() => setDone((d) => ({ ...d, [i]: !d[i] }))}
              className={`w-full text-left px-4 py-3 rounded-lg border transition flex items-start gap-3 ${
                done[i] ? "bg-emerald-500/10 border-emerald-500/30" : "hover:bg-accent"
              }`}
            >
              <CheckCircle2
                className={`w-4 h-4 mt-0.5 shrink-0 ${done[i] ? "text-emerald-500" : "text-muted-foreground"}`}
              />
              <span className="text-sm">{t}</span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
  return embedded ? <div>{body}</div> : <Card>{body}</Card>;
}

function QuizBlock({ quiz }: { quiz: StudyPack["quiz"] }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [checked, setChecked] = useState(false);
  if (!quiz || quiz.length === 0) {
    return (
      <Card>
        <p className="text-muted-foreground">Sem quiz gerado ainda.</p>
      </Card>
    );
  }
  const correct = quiz.reduce((n, q, i) => n + (answers[i] === q.a ? 1 : 0), 0);
  return (
    <Card>
      <div className="space-y-5">
        {quiz.map((q, i) => (
          <div key={i}>
            <div className="font-medium mb-2">
              {i + 1}. {q.q}
            </div>
            <div className="grid gap-2">
              {q.opts.map((opt, j) => {
                const picked = answers[i] === j;
                const isCorrect = checked && j === q.a;
                const isWrong = checked && picked && j !== q.a;
                return (
                  <button
                    key={j}
                    onClick={() => setAnswers((a) => ({ ...a, [i]: j }))}
                    className={`text-left px-3 py-2 rounded-lg border text-sm transition ${
                      isCorrect
                        ? "bg-emerald-500/10 border-emerald-500/40"
                        : isWrong
                          ? "bg-destructive/10 border-destructive/40"
                          : picked
                            ? "bg-primary/10 border-primary/40"
                            : "hover:bg-accent"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Button onClick={() => setChecked(true)}>Verificar</Button>
        {checked && (
          <div className="text-sm">
            Nota: <strong>{Math.round((correct / quiz.length) * 100)}%</strong> ({correct}/
            {quiz.length})
          </div>
        )}
      </div>
    </Card>
  );
}
