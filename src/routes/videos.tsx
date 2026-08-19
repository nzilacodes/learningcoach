import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, useRef } from "react";
import {
  Search,
  Play,
  Flame,
  MoreVertical,
  CheckCircle,
  Share2,
  User,
  Settings,
  LogOut,
} from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";
import { useAgeGroup } from "@/lib/use-age-group";
import { useLocale } from "@/lib/i18n";
import { AGE_TRACKS } from "@/lib/age-tracks";
import { extractYouTubeId, youtubeThumb, videoPoolForAge } from "@/lib/youtube";
import { useUserStats, useWeeklyStudy } from "@/lib/learning";
import { VideosSidebar, VideosMobileNav } from "@/components/videos/videos-sidebar";
import { useNotification } from "@/lib/notifications/notification-provider";
import { useClickOutside } from "@/hooks/use-click-outside";

export const Route = createFileRoute("/videos")({
  component: VideosPage,
  head: () => ({
    meta: [
      { title: "Vídeos — Learning English with Coach" },
      {
        name: "description",
        content:
          "Aulas em vídeo do YouTube com transcrição, resumo, quiz e atividades geradas por IA.",
      },
      { property: "og:title", content: "Vídeos — Learning English with Coach" },
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

const FILTERS = ["All Videos", "Grammar", "Business English", "Listening", "Pronunciation"];

// The video catalog (lib/age-tracks.ts) has no category/topic field to filter
// on, so category matching is approximated from the title/channel text —
// some categories may come up empty for a given age group whose content
// doesn't naturally fit these labels (e.g. kids' songs vs. "Business English").
const FILTER_KEYWORDS: Record<string, string[]> = {
  Grammar: [
    "grammar",
    "gramática",
    "tense",
    "verb",
    "conjugat",
    "sentence",
    "article",
    "preposition",
  ],
  "Business English": [
    "business",
    "interview",
    "meeting",
    "email",
    "negotiat",
    "career",
    "professional",
    "office",
    "work",
  ],
  Listening: ["listening", "podcast", "news", "song", "music", "story", "stories"],
  Pronunciation: ["pronunciation", "pronúncia", "accent", "phonics", "sound", "speak"],
};

function matchesFilter(video: { title: string; channel: string }, filter: string): boolean {
  if (filter === "All Videos") return true;
  const keywords = FILTER_KEYWORDS[filter] ?? [];
  const haystack = `${video.title} ${video.channel}`.toLowerCase();
  return keywords.some((k) => haystack.includes(k));
}

function VideosPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { group } = useAgeGroup();
  const { locale } = useLocale();
  const notify = useNotification();
  const [activeFilter, setActiveFilter] = useState("All Videos");
  const [searchQuery, setSearchQuery] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);
  useClickOutside(avatarRef, setAvatarMenuOpen);

  const { data: recent } = useQuery({
    queryKey: ["video_history_list", user?.id],
    enabled: !!user,
    queryFn: () => apiFetch<Recent[]>("/v1/me/video-history"),
  });
  const { data: userStats } = useUserStats();
  const { data: week } = useWeeklyStudy();

  const recs = AGE_TRACKS[group].videos;
  const featuredRec = recs[0];
  const featuredId = featuredRec ? extractYouTubeId(featuredRec.url) : null;
  const catalog = useMemo(() => videoPoolForAge(group, locale), [group, locale]);
  const filteredCatalog = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return catalog.filter((video) => {
      const matchesSearch =
        !q || video.title.toLowerCase().includes(q) || video.channel.toLowerCase().includes(q);
      return matchesSearch && matchesFilter(video, activeFilter);
    });
  }, [catalog, searchQuery, activeFilter]);
  const weekHours = ((week?.seconds ?? 0) / 3600).toFixed(1);
  const watchedCount = recent?.filter((r) => r.completed).length ?? 0;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <VideosSidebar />

      {/* Main content area */}
      <main className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Top Bar */}
        <header className="h-20 flex items-center justify-between px-12 border-b border-gray-50 shrink-0 sticky top-0 bg-white/80 backdrop-blur-xl z-10">
          {/* Search */}
          <div className="flex-1 max-w-2xl">
            <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-(--violet) transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  locale === "pt"
                    ? "Pesquisar aulas, tópicos ou gramática..."
                    : "Search lessons, topics or grammar..."
                }
                aria-label={
                  locale === "pt"
                    ? "Pesquisar aulas, tópicos ou gramática"
                    : "Search lessons, topics or grammar"
                }
                className="w-full pl-14 pr-6 py-3.5 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-(--violet)/10 transition-all outline-none"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <span className="px-2 py-1 bg-white border border-gray-100 rounded-md text-2xs text-gray-400 font-bold">
                  ⌘ K
                </span>
              </div>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-5">
            {/* Avatar with dropdown — mobile only */}
            <div className="relative md:hidden" ref={avatarRef}>
              {avatarMenuOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setAvatarMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-100 rounded-2xl shadow-2xl z-30 py-2 dropdown-enter premium-shadow">
                    <button
                      onClick={() => {
                        setAvatarMenuOpen(false);
                        navigate({ to: "/profile" });
                      }}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-xs font-bold text-gray-600 transition-colors w-full text-left"
                    >
                      <User className="w-4 h-4 text-[var(--violet)]" />
                      {locale === "pt" ? "Ver perfil" : "View profile"}
                    </button>
                    <button
                      onClick={() => {
                        setAvatarMenuOpen(false);
                        navigate({ to: "/settings" });
                      }}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-xs font-bold text-gray-600 transition-colors w-full text-left"
                    >
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
                className="h-10 w-10 rounded-full border-2 border-white shadow-sm overflow-hidden cursor-pointer hover:border-[var(--violet)] transition-all"
              >
                <div className="w-full h-full bg-gradient-to-br from-[var(--violet)] to-[var(--magenta)] flex items-center justify-center text-white text-sm font-bold">
                  {user?.email?.charAt(0).toUpperCase() || "U"}
                </div>
              </button>
            </div>
            {/* Avatar — desktop only (sidebar's own menu covers desktop; this just links straight to the profile page) */}
            <Link
              to="/profile"
              className="hidden md:block h-10 w-10 rounded-full border-2 border-white shadow-sm overflow-hidden hover:border-[var(--violet)] transition-all"
            >
              <div className="w-full h-full bg-gradient-to-br from-[var(--violet)] to-[var(--magenta)] flex items-center justify-center text-white text-sm font-bold">
                {user?.email?.charAt(0).toUpperCase() || "U"}
              </div>
            </Link>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-12 py-10 space-y-12 scroll-smooth scrollbar-hide pb-20 md:pb-10">
          {/* Mobile Stats */}
          <div className="md:hidden grid grid-cols-3 gap-3">
            <div className="glass-card rounded-2xl p-4 text-center premium-shadow">
              <div className="text-2xs font-bold uppercase tracking-wider text-gray-400">
                Study Hours
              </div>
              <div className="text-xl font-bold text-(--ink)">{weekHours}</div>
            </div>
            <div className="glass-card rounded-2xl p-4 text-center premium-shadow">
              <div className="text-2xs font-bold uppercase tracking-wider text-gray-400">
                Streak
              </div>
              <div className="text-xl font-bold text-(--ink)">
                {userStats?.streak_days ?? 0} Days
              </div>
            </div>
            <div className="glass-card rounded-2xl p-4 text-center premium-shadow">
              <div className="text-2xs font-bold uppercase tracking-wider text-gray-400">
                Watched
              </div>
              <div className="text-xl font-bold text-(--ink)">{watchedCount}</div>
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-6 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all ${
                  activeFilter === f
                    ? "bg-black text-white shadow-lg shadow-black/10"
                    : "bg-white border border-gray-100 text-gray-500 hover:text-black hover:border-gray-200"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Featured Video */}
          <div className="space-y-6">
            <h2 className="text-2xl font-display font-bold flex items-center gap-2">
              <Flame className="w-6 h-6 text-(--sunset)" />
              {locale === "pt" ? "Recomendado para Si" : "Recommended for You"}
            </h2>
            <Link
              to={featuredId ? "/watch/$videoId" : "/videos"}
              params={featuredId ? { videoId: featuredId } : undefined}
              search={
                featuredId
                  ? {
                      title: featuredRec.title.pt,
                      channel: featuredRec.channel,
                      level: featuredRec.level,
                    }
                  : undefined
              }
              className="group relative block aspect-21/9 rounded-[3rem] overflow-hidden premium-shadow cursor-pointer"
            >
              <img
                src={
                  featuredId
                    ? youtubeThumb(featuredId)
                    : "https://images.unsplash.com/photo-1643056205382-779bfbe21a8b?auto=format&w=1400&q=80&fit=crop"
                }
                alt=""
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent" />

              {/* Play button */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
                <div className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/30 scale-90 group-hover:scale-100 transition-transform">
                  <Play className="w-10 h-10 text-white ml-1" fill="white" />
                </div>
              </div>

              {/* Content */}
              <div className="absolute bottom-12 left-12 right-12">
                <div className="space-y-4 max-w-2xl">
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-(--violet) text-white text-2xs font-bold rounded-lg uppercase tracking-widest">
                      New
                    </span>
                    <span className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 text-white text-2xs font-bold rounded-lg uppercase tracking-widest">
                      Premium
                    </span>
                  </div>
                  <h3 className="text-4xl font-display font-bold text-white leading-tight">
                    {locale === "pt"
                      ? (featuredRec?.title.pt ?? "Deep Dive: Negotiation Vocabulary in London")
                      : "Deep Dive: Negotiation Vocabulary in London"}
                  </h3>
                  <p className="text-white/70 text-base">
                    {locale === "pt"
                      ? "Domine os idiomas usados na City de Londres."
                      : "Master the idioms used in the City of London."}
                  </p>
                </div>
              </div>
            </Link>
          </div>

          {/* Continue watching */}
          {recent && recent.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-display font-bold">
                {locale === "pt" ? "Continuar assistindo" : "Continue watching"}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
                {recent.map((r) => {
                  const pct =
                    r.duration_seconds && r.duration_seconds > 0
                      ? Math.min(100, Math.round((r.position_seconds / r.duration_seconds) * 100))
                      : 0;
                  return (
                    <Link
                      key={r.video_id}
                      to="/watch/$videoId"
                      params={{ videoId: r.video_id }}
                      search={{ title: r.title ?? undefined, channel: r.channel ?? undefined }}
                      className="group block space-y-3"
                    >
                      <div className="relative aspect-video rounded-3xl overflow-hidden premium-shadow">
                        <img
                          src={youtubeThumb(r.video_id)}
                          alt={r.title ?? ""}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="play-overlay absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-all duration-300">
                          <div className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/30">
                            <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
                          </div>
                        </div>
                        {pct > 0 && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30">
                            <div className="h-full bg-(--violet)" style={{ width: `${pct}%` }} />
                          </div>
                        )}
                      </div>
                      <div className="px-1 space-y-1">
                        <h4 className="font-display font-bold text-sm leading-tight group-hover:text-(--violet) transition-colors line-clamp-2">
                          {r.title ?? r.video_id}
                        </h4>
                        <span className="text-2xs text-gray-400 font-bold">{r.channel}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Video Grid */}
          {filteredCatalog.length === 0 && (
            <p className="text-sm text-gray-400 font-medium">
              {locale === "pt"
                ? "Nenhum vídeo encontrado para esta pesquisa/categoria."
                : "No videos found for this search/category."}
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
            {filteredCatalog.map((video) => {
              const search = { title: video.title, channel: video.channel, level: video.level };
              return (
                <div key={video.videoId} className="group space-y-3 video-card relative">
                  {/* Thumbnail */}
                  <Link
                    to="/watch/$videoId"
                    params={{ videoId: video.videoId }}
                    search={search}
                    className="block"
                  >
                    <div className="relative aspect-video rounded-3xl overflow-hidden premium-shadow">
                      <img
                        src={youtubeThumb(video.videoId)}
                        alt={video.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      {/* Play overlay on hover */}
                      <div className="play-overlay absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-all duration-300">
                        <div className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/30">
                          <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
                        </div>
                      </div>
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="flex justify-between items-start px-1 relative">
                    <Link
                      to="/watch/$videoId"
                      params={{ videoId: video.videoId }}
                      search={search}
                      className="flex-1 min-w-0 space-y-1"
                    >
                      <h4 className="font-display font-bold text-sm leading-tight group-hover:text-(--violet) transition-colors line-clamp-2">
                        {video.title}
                      </h4>
                      <span className="text-2xs text-gray-400 font-bold">{video.level}</span>
                    </Link>

                    {/* 3-dot menu */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === video.videoId ? null : video.videoId);
                      }}
                      className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>

                    {/* Dropdown */}
                    {openMenuId === video.videoId && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setOpenMenuId(null)} />
                        <div className="absolute right-0 top-10 w-52 bg-white border border-gray-100 rounded-2xl shadow-2xl z-30 py-2 dropdown-enter premium-shadow">
                          <button
                            onClick={async () => {
                              setOpenMenuId(null);
                              try {
                                await apiFetch(`/v1/me/video-history/${video.videoId}`, {
                                  method: "PUT",
                                  body: JSON.stringify({
                                    videoUrl: video.url,
                                    title: video.title,
                                    channel: video.channel,
                                    positionSeconds: 0,
                                    completed: true,
                                  }),
                                });
                                notify.success(
                                  locale === "pt"
                                    ? "Marcado como concluído"
                                    : "Marked as completed",
                                );
                                qc.invalidateQueries({
                                  queryKey: ["video_history_list", user?.id],
                                });
                              } catch (e) {
                                notify.fromError(e, { dedupeKey: "videos:mark-complete" });
                              }
                            }}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-xs font-bold text-gray-600 transition-colors w-full text-left"
                          >
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            {locale === "pt" ? "Marcar como concluído" : "Mark as completed"}
                          </button>
                          <button
                            onClick={async () => {
                              setOpenMenuId(null);
                              const shareUrl = `${window.location.origin}/watch/${video.videoId}`;
                              if (navigator.share) {
                                try {
                                  await navigator.share({ title: video.title, url: shareUrl });
                                } catch {
                                  /* user cancelled the share sheet — not an error */
                                }
                              } else {
                                await navigator.clipboard.writeText(shareUrl);
                                notify.success(locale === "pt" ? "Link copiado" : "Link copied");
                              }
                            }}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-xs font-bold text-gray-600 transition-colors w-full text-left"
                          >
                            <Share2 className="w-4 h-4 text-blue-500" />
                            {locale === "pt" ? "Compartilhar" : "Share"}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <footer className="pt-10 pb-20 border-t border-gray-50 flex flex-col md:flex-row items-center justify-between gap-6">
            <span className="text-sm font-bold text-gray-400">
              © {new Date().getFullYear()} Learning Coach Platform
            </span>
            <div className="flex gap-8 text-sm font-bold text-gray-400">
              <span>Privacy</span>
              <span>Terms</span>
              <span>Support</span>
            </div>
          </footer>
        </div>
      </main>

      {/* Mobile bottom nav */}
      <VideosMobileNav />
    </div>
  );
}
