import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import {
  Search,
  Bell,
  Play,
  Flame,
  MoreVertical,
  ListPlus,
  CheckCircle,
  Share2,
  ThumbsDown,
  User,
  Settings,
  LogOut,
} from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";
import { useAgeGroup } from "@/lib/use-age-group";
import { useLocale } from "@/lib/i18n";
import { AGE_TRACKS } from "@/lib/age-tracks";
import { extractYouTubeId, youtubeThumb } from "@/lib/youtube";
import { VideosSidebar, VideosMobileNav } from "@/components/videos/videos-sidebar";

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

const MOCK_VIDEOS = [
  {
    id: "1",
    title: "Business English: Conducting Meetings",
    level: "B2 INTERMEDIATE",
    duration: "14:20",
    thumb:
      "https://images.unsplash.com/photo-1766867264693-e34f484d3371?auto=format&w=600&q=80&fit=crop",
  },
  {
    id: "2",
    title: "IELTS Speaking Strategies: 8.0+ Band",
    level: "C1 ADVANCED",
    duration: "18:45",
    thumb:
      "https://images.unsplash.com/photo-1765020553552-6286dde23660?auto=format&w=600&q=80&fit=crop",
  },
  {
    id: "3",
    title: "Phrasal Verbs in Daily Conversations",
    level: "B1 INTERMEDIATE",
    duration: "09:30",
    thumb:
      "https://images.unsplash.com/photo-1765474604988-4fc3fa14f46b?auto=format&w=600&q=80&fit=crop",
  },
  {
    id: "4",
    title: "Grammar: The Ultimate Tense Guide",
    level: "A2-C2 ALL LEVELS",
    duration: "22:10",
    thumb:
      "https://images.unsplash.com/photo-1551836022-1c223a824392?auto=format&w=600&q=80&fit=crop",
  },
  {
    id: "5",
    title: "English for Tech Job Interviews",
    level: "C1 ADVANCED",
    duration: "12:05",
    thumb:
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&w=600&q=80&fit=crop",
  },
  {
    id: "6",
    title: "Culture & Etiquette in US Business",
    level: "B2 INTERMEDIATE",
    duration: "15:40",
    thumb:
      "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&w=600&q=80&fit=crop",
  },
  {
    id: "7",
    title: "High-Level Academic Writing",
    level: "C2 PROFICIENT",
    duration: "31:15",
    thumb:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&w=600&q=80&fit=crop",
  },
  {
    id: "8",
    title: "5 Tips for New Vocabulary",
    level: "B1 INTERMEDIATE",
    duration: "05:50",
    thumb:
      "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?auto=format&w=600&q=80&fit=crop",
  },
];

function VideosPage() {
  const { user, signOut } = useAuth();
  const { group } = useAgeGroup();
  const { locale } = useLocale();
  const [activeFilter, setActiveFilter] = useState("All Videos");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const { data: recent } = useQuery({
    queryKey: ["video_history_list", user?.id],
    enabled: !!user,
    queryFn: () => apiFetch<Recent[]>("/v1/me/video-history"),
  });

  const recs = AGE_TRACKS[group].videos;
  const featuredRec = recs[0];
  const featuredId = featuredRec ? extractYouTubeId(featuredRec.url) : null;

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
                placeholder={
                  locale === "pt"
                    ? "Pesquisar aulas, tópicos ou gramática..."
                    : "Search lessons, topics or grammar..."
                }
                className="w-full pl-14 pr-6 py-3.5 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-(--violet)/10 transition-all outline-none"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <span className="px-2 py-1 bg-white border border-gray-100 rounded-md text-[10px] text-gray-400 font-bold">
                  ⌘ K
                </span>
              </div>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-5">
            <button className="w-11 h-11 flex items-center justify-center text-gray-500 hover:bg-gray-50 rounded-2xl transition-all relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-[var(--magenta)] rounded-full border-2 border-white" />
            </button>
            {/* Avatar with dropdown — mobile only */}
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
                className="h-10 w-10 rounded-full border-2 border-white shadow-sm overflow-hidden cursor-pointer hover:border-[var(--violet)] transition-all"
              >
                <div className="w-full h-full bg-gradient-to-br from-[var(--violet)] to-[var(--magenta)] flex items-center justify-center text-white text-sm font-bold">
                  {user?.email?.charAt(0).toUpperCase() || "U"}
                </div>
              </button>
            </div>
            {/* Avatar — desktop only (no dropdown, sidebar handles it) */}
            <div className="hidden md:block h-10 w-10 rounded-full border-2 border-white shadow-sm overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-[var(--violet)] to-[var(--magenta)] flex items-center justify-center text-white text-sm font-bold">
                {user?.email?.charAt(0).toUpperCase() || "U"}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-12 py-10 space-y-12 scroll-smooth scrollbar-hide pb-20 md:pb-10">
          {/* Mobile Stats */}
          <div className="md:hidden grid grid-cols-3 gap-3">
            <div className="glass-card rounded-2xl p-4 text-center premium-shadow">
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Study Hours
              </div>
              <div className="text-xl font-bold text-(--ink)">12.5</div>
            </div>
            <div className="glass-card rounded-2xl p-4 text-center premium-shadow">
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Streak
              </div>
              <div className="text-xl font-bold text-(--ink)">15 Days</div>
            </div>
            <div className="glass-card rounded-2xl p-4 text-center premium-shadow">
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Watched
              </div>
              <div className="text-xl font-bold text-(--ink)">342</div>
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
                    <span className="px-3 py-1 bg-(--violet) text-white text-[10px] font-bold rounded-lg uppercase tracking-widest">
                      New
                    </span>
                    <span className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold rounded-lg uppercase tracking-widest">
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

          {/* Video Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
            {MOCK_VIDEOS.map((video) => (
              <div key={video.id} className="group cursor-pointer space-y-3 video-card relative">
                {/* Thumbnail */}
                <div className="relative aspect-video rounded-3xl overflow-hidden premium-shadow">
                  <img
                    src={video.thumb}
                    alt={video.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  {/* Play overlay on hover */}
                  <div className="play-overlay absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-all duration-300">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/30">
                      <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
                    </div>
                  </div>
                  {/* Duration badge */}
                  <div className="absolute bottom-3 right-3 px-1.5 py-0.5 bg-black/80 backdrop-blur-md text-white text-[10px] font-bold rounded-md">
                    {video.duration}
                  </div>
                </div>

                {/* Info */}
                <div className="flex justify-between items-start px-1 relative">
                  <div className="flex-1 space-y-1">
                    <h4 className="font-display font-bold text-sm leading-tight group-hover:text-(--violet) transition-colors line-clamp-2">
                      {video.title}
                    </h4>
                    <span className="text-[10px] text-gray-400 font-bold">{video.level}</span>
                  </div>

                  {/* 3-dot menu */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === video.id ? null : video.id);
                    }}
                    className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <MoreVertical className="w-4 h-4 text-gray-400" />
                  </button>

                  {/* Dropdown */}
                  {openMenuId === video.id && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setOpenMenuId(null)} />
                      <div className="absolute right-0 top-10 w-52 bg-white border border-gray-100 rounded-2xl shadow-2xl z-30 py-2 dropdown-enter premium-shadow">
                        <button className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-xs font-bold text-gray-600 transition-colors w-full text-left">
                          <ListPlus className="w-4 h-4 text-(--violet)" />
                          {locale === "pt" ? "Salvar na playlist" : "Save to playlist"}
                        </button>
                        <button className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-xs font-bold text-gray-600 transition-colors w-full text-left">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          {locale === "pt" ? "Marcar como concluído" : "Mark as completed"}
                        </button>
                        <button className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-xs font-bold text-gray-600 transition-colors w-full text-left border-b border-gray-50">
                          <Share2 className="w-4 h-4 text-blue-500" />
                          {locale === "pt" ? "Compartilhar" : "Share"}
                        </button>
                        <button className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-xs font-bold text-red-400 transition-colors w-full text-left">
                          <ThumbsDown className="w-4 h-4" />
                          {locale === "pt" ? "Não tenho interesse" : "Not interested"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <footer className="pt-10 pb-20 border-t border-gray-50 flex flex-col md:flex-row items-center justify-between gap-6">
            <span className="text-sm font-bold text-gray-400">
              © {new Date().getFullYear()} Learning Coach Platform
            </span>
            <div className="flex gap-8 text-sm font-bold text-gray-400">
              <a href="#" className="hover:text-black transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-black transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-black transition-colors">
                Support
              </a>
            </div>
          </footer>
        </div>
      </main>

      {/* Mobile bottom nav */}
      <VideosMobileNav />
    </div>
  );
}
