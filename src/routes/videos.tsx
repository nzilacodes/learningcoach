import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useAgeGroup } from "@/lib/use-age-group";
import { AGE_TRACKS } from "@/lib/age-tracks";
import { extractYouTubeId, youtubeThumb } from "@/lib/youtube";
import { PlayCircle, History, Youtube, Sparkles } from "lucide-react";

export const Route = createFileRoute("/videos")({
  component: VideosPage,
  head: () => ({
    meta: [
      { title: "Biblioteca de vídeos — Learning English with Coach" },
      {
        name: "description",
        content:
          "Aulas em vídeo do YouTube com transcrição, resumo, quiz e atividades geradas por IA. Continue de onde parou.",
      },
      { property: "og:title", content: "Biblioteca de vídeos — Learning English with Coach" },
      {
        property: "og:description",
        content: "Vídeos com transcrição, quiz e atividades personalizadas por idade e nível.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
});

type Recent = {
  video_id: string;
  video_url: string;
  title: string | null;
  channel: string | null;
  position_seconds: number;
  duration_seconds: number | null;
  completed: boolean;
  last_watched_at: string;
};

function VideosPage() {
  const { user } = useAuth();
  const { group } = useAgeGroup();

  const { data: recent } = useQuery({
    queryKey: ["video_history_list", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("video_history")
        .select("video_id,video_url,title,channel,position_seconds,duration_seconds,completed,last_watched_at")
        .eq("user_id", user!.id)
        .order("last_watched_at", { ascending: false })
        .limit(8);
      return (data ?? []) as Recent[];
    },
  });

  const recs = AGE_TRACKS[group].videos;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-6xl">
        <div className="mb-8">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3">
            Vídeos & YouTube
          </span>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Biblioteca de vídeos</h1>
          <p className="text-muted-foreground max-w-2xl">
            Assista, ative as legendas, faça o quiz e pratique com atividades geradas
            automaticamente para cada vídeo. O seu progresso é guardado.
          </p>
        </div>

        {/* Continue watching */}
        {user && recent && recent.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold mb-4 inline-flex items-center gap-2">
              <History className="w-5 h-5 text-primary" /> Continuar assistindo
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recent.map((r) => {
                const pct = r.duration_seconds
                  ? Math.min(100, Math.round((r.position_seconds / r.duration_seconds) * 100))
                  : r.completed
                    ? 100
                    : Math.min(90, r.position_seconds / 30);
                return (
                  <Link
                    key={r.video_id}
                    to="/watch/$videoId"
                    params={{ videoId: r.video_id }}
                    search={{ title: r.title ?? "", channel: r.channel ?? "" }}
                    className="rounded-xl border bg-card overflow-hidden hover:shadow-md transition group"
                  >
                    <div className="relative aspect-video bg-muted">
                      <img src={youtubeThumb(r.video_id)} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 grid place-items-center bg-black/30 opacity-0 group-hover:opacity-100 transition">
                        <PlayCircle className="w-12 h-12 text-white" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
                        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="font-semibold text-sm line-clamp-2">{r.title || "YouTube video"}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {r.channel || ""}
                        {r.completed ? " · Concluído" : ` · ${formatTime(r.position_seconds)}`}
                      </div>
                      <Progress value={pct} className="h-1 mt-2" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Recommendations */}
        <section>
          <h2 className="text-xl font-bold mb-1 inline-flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> Recomendados para a sua idade
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Vídeos combinados automaticamente com o seu perfil e temas do currículo.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recs.map((v) => {
              const id = extractYouTubeId(v.url);
              if (!id) return null;
              return (
                <Link
                  key={id}
                  to="/watch/$videoId"
                  params={{ videoId: id }}
                  search={{ title: v.title.pt, channel: v.channel, level: v.level, topic: v.title.en }}
                  className="rounded-xl border bg-card overflow-hidden hover:shadow-md transition group"
                >
                  <div className="relative aspect-video bg-muted">
                    <img src={youtubeThumb(id)} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 grid place-items-center bg-black/30 opacity-0 group-hover:opacity-100 transition">
                      <PlayCircle className="w-12 h-12 text-white" />
                    </div>
                    <span className="absolute top-2 right-2 rounded-full bg-black/70 text-white text-[10px] font-bold px-2 py-0.5">
                      {v.level}
                    </span>
                  </div>
                  <div className="p-3">
                    <div className="font-semibold text-sm line-clamp-2">{v.title.pt}</div>
                    <div className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1">
                      <Youtube className="w-3 h-3" /> {v.channel}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {!user && (
          <div className="mt-10 rounded-2xl border p-6 bg-card text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Entre para guardar o histórico e continuar de onde parou.
            </p>
            <Button asChild><Link to="/auth">Entrar</Link></Button>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
