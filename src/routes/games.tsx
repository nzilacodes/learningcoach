import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Star, Play, Search, Lock } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api/client";
import { useAgeGroup } from "@/lib/use-age-group";
import { AGE_TRACKS, AGE_GROUP_LABEL, type AgeTrack } from "@/lib/age-tracks";
import { AgeThemeSwitcher } from "@/components/age-theme-switcher";
import { VideosSidebar, VideosMobileNav } from "@/components/videos/videos-sidebar";
import { GamePlayModal } from "@/components/games/game-play-modal";
import { HeaderActionLinks, MobileAvatarMenu, DesktopAvatarLink } from "@/components/mobile-avatar-menu";
import { SITE_URL } from "@/lib/site-url";

export const Route = createFileRoute("/games")({
  component: GamesPage,
  head: () => ({
    meta: [
      { title: "Games — Learning English with Coach" },
      {
        name: "description",
        content:
          "Aprenda inglês jogando: vocabulário, gramática e conversação em jogos adaptados à sua idade.",
      },
      { property: "og:title", content: "Jogos de inglês — Learning English with Coach" },
      {
        property: "og:description",
        content: "Vocabulário, pronúncia e gramática em jogos rápidos.",
      },
      { property: "og:url", content: `${SITE_URL}/games` },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/games` }],
  }),
});

type GameEntry = AgeTrack["games"][number];

const CAT_LABELS: Record<GameEntry["cat"], { pt: string; en: string }> = {
  vocabulary: { pt: "Vocabulário", en: "Vocabulary" },
  grammar: { pt: "Gramática", en: "Grammar" },
  speaking: { pt: "Conversação", en: "Speaking" },
  listening: { pt: "Escuta", en: "Listening" },
  writing: { pt: "Escrita", en: "Writing" },
  mixed: { pt: "Misto", en: "Mixed" },
};

function formatPlays(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1).replace(".0", "")}k` : String(n);
}

function GamesPage() {
  const { locale } = useLocale();
  const { user } = useAuth();
  const { group } = useAgeGroup();
  const track = AGE_TRACKS[group];
  const ageLabel = AGE_GROUP_LABEL[group];
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<"all" | GameEntry["cat"]>("all");
  const [activeGame, setActiveGame] = useState<GameEntry | null>(null);

  useEffect(() => {
    setActiveCat("all");
    setSearch("");
  }, [group]);

  const { data: profileStats } = useQuery({
    queryKey: ["games-profile-stats", user?.id],
    enabled: !!user,
    queryFn: () =>
      apiFetch<{ xp: number; coins: number; level: number; streak: number }>(
        "/v1/me/gamification-stats",
      ),
    staleTime: 30_000,
  });

  const { data: playCounts = {} } = useQuery({
    queryKey: ["games_plays"],
    queryFn: () => apiFetch<Record<string, number>>("/v1/games/plays"),
    staleTime: 30_000,
  });

  const onGameCompleted = () => {
    qc.invalidateQueries({ queryKey: ["games-profile-stats", user?.id] });
    qc.invalidateQueries({ queryKey: ["games_plays"] });
    // XP earned here is also shown on Dashboard/Videos via useUserStats().
    qc.invalidateQueries({ queryKey: ["user_stats", user?.id] });
  };

  const stats = [
    {
      label: locale === "pt" ? "XP total" : "Total XP",
      value: (profileStats?.xp ?? 0).toLocaleString(),
    },
    { label: locale === "pt" ? "Moedas" : "Coins", value: String(profileStats?.coins ?? 0) },
    { label: locale === "pt" ? "Nível" : "Level", value: String(profileStats?.level ?? 1) },
    {
      label: locale === "pt" ? "Dias seguidos" : "Day streak",
      value: String(profileStats?.streak ?? 0),
    },
  ];

  const categories = Array.from(new Set(track.games.map((g) => g.cat)));

  const filteredGames = track.games.filter((g) => {
    if (activeCat !== "all" && g.cat !== activeCat) return false;
    if (search.trim()) {
      const title = (locale === "pt" ? g.pt : g.en).toLowerCase();
      if (!title.includes(search.trim().toLowerCase())) return false;
    }
    return true;
  });

  const mostPlayed = [...track.games]
    .filter((g) => !g.locked)
    .sort((a, b) => (playCounts[b.id] ?? 0) - (playCounts[a.id] ?? 0))
    .slice(0, 5);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      {/* Left Sidebar */}
      <VideosSidebar />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Top Header Bar */}
        <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-gray-100 shrink-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="font-display text-xl font-bold text-[var(--ink)] shrink-0">
              {locale === "pt" ? "Jogos" : "Games"}
            </h1>
            <div className="hidden md:block">
              <AgeThemeSwitcher />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <HeaderActionLinks />
            <MobileAvatarMenu />
            <DesktopAvatarLink />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-6 scrollbar-hide">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-10">
            {/* Hero: title/tagline + stats */}
            <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-6 md:gap-0 border border-gray-100 rounded-2xl overflow-hidden mb-8 md:mb-12">
              <div className="p-6 md:p-10 md:border-r border-gray-100 flex flex-col justify-center gap-3">
                <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-orange-600">
                  {locale === "pt" ? "Para você" : "For you"} · {ageLabel.pt} ({ageLabel.range})
                </span>
                <h2 className="font-display text-2xl md:text-4xl font-bold text-(--ink)">
                  {locale === "pt" ? "Jogos Educativos" : "Educational Games"}
                </h2>
                <p className="text-gray-500 text-sm md:text-base max-w-md">
                  {locale === "pt" ? track.tagline.pt : track.tagline.en}
                </p>
                <div className="md:hidden mt-1">
                  <AgeThemeSwitcher />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-px bg-gray-100">
                {stats.map((s) => (
                  <div
                    key={s.label}
                    className="bg-white p-5 md:p-6 flex flex-col justify-center gap-1"
                  >
                    <span className="font-display text-2xl md:text-3xl font-bold text-(--ink)">
                      {s.value}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-gray-400">
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Toolbar: search + category chips */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-4 md:mb-6">
              <div>
                <h3 className="font-display text-xl md:text-2xl font-bold text-(--ink) mb-1">
                  {locale === "pt" ? "Todos os jogos" : "All games"}
                </h3>
                <span className="text-sm text-gray-400">
                  {filteredGames.length} {locale === "pt" ? "jogos" : "games"}
                </span>
              </div>
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={locale === "pt" ? "Buscar jogos" : "Search games"}
                  className="w-full rounded-xl border border-gray-200 pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--primary)/30 focus:border-primary"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-8 md:mb-12">
              <button
                onClick={() => setActiveCat("all")}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                  activeCat === "all"
                    ? "bg-orange-600 text-white"
                    : "bg-white border border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                {locale === "pt" ? "Todos" : "All"} ({track.games.length})
              </button>
              {categories.map((c) => {
                const count = track.games.filter((g) => g.cat === c).length;
                return (
                  <button
                    key={c}
                    onClick={() => setActiveCat(c)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                      activeCat === c
                        ? "bg-orange-600 text-white"
                        : "bg-white border border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    {locale === "pt" ? CAT_LABELS[c].pt : CAT_LABELS[c].en} ({count})
                  </button>
                );
              })}
            </div>

            {/* Catalog */}
            {filteredGames.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                {filteredGames.map((game) => (
                  <GameCard
                    key={game.id}
                    game={game}
                    locale={locale}
                    onPlay={() => setActiveGame(game)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 border-2 border-dashed border-gray-100 rounded-2xl">
                <p className="text-gray-400 text-sm">
                  {locale === "pt" ? "Nenhum jogo encontrado." : "No games found."}
                </p>
              </div>
            )}

            {/* Most played */}
            <div className="mt-10 md:mt-14">
              <h3 className="font-display text-xl md:text-2xl font-bold text-(--ink) mb-4 md:mb-6">
                {locale === "pt" ? "Mais jogados esta semana" : "Most played this week"}
              </h3>
              <div className="divide-y divide-gray-100">
                {mostPlayed.map((g, i) => (
                  <div key={g.id} className="flex items-center gap-4 md:gap-5 py-3 md:py-4">
                    <span className="font-display text-xl md:text-2xl font-bold text-orange-600 w-8 shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1 min-w-0 font-display font-bold text-sm md:text-base truncate text-(--ink)">
                      {locale === "pt" ? g.pt : g.en}
                    </span>
                    <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50 px-2 py-1 rounded-full shrink-0">
                      {locale === "pt" ? CAT_LABELS[g.cat].pt : CAT_LABELS[g.cat].en}
                    </span>
                    <span className="text-xs md:text-sm text-gray-400 font-semibold w-16 md:w-20 text-right shrink-0">
                      {formatPlays(playCounts[g.id] ?? 0)} {locale === "pt" ? "jogadas" : "plays"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA banner */}
            <div className="mt-10 md:mt-16 rounded-2xl overflow-hidden bg-orange-600 text-white p-6 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
              <h2 className="font-display text-2xl md:text-4xl font-bold text-center md:text-left max-w-md">
                {locale === "pt" ? "Aprenda inglês jogando." : "Learn English by playing."}
              </h2>
              <button
                onClick={() => {
                  const unlocked = track.games.filter((g) => !g.locked);
                  if (unlocked.length)
                    setActiveGame(unlocked[Math.floor(Math.random() * unlocked.length)]);
                }}
                className="px-6 py-3 rounded-xl bg-white text-primary text-sm md:text-base font-semibold hover:opacity-90 transition-opacity shrink-0"
              >
                {locale === "pt" ? "Começar um jogo →" : "Start a game →"}
              </button>
            </div>
          </div>
        </main>
      </div>

      <GamePlayModal
        game={activeGame}
        track={track}
        locale={locale}
        onOpenChange={(open) => !open && setActiveGame(null)}
        onCompleted={onGameCompleted}
      />

      {/* Mobile bottom nav */}
      <VideosMobileNav />
    </div>
  );
}

function GameCard({
  game,
  locale,
  onPlay,
}: {
  game: GameEntry;
  locale: string;
  onPlay: () => void;
}) {
  const title = locale === "pt" ? game.pt : game.en;
  const catLabel = CAT_LABELS[game.cat];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all group flex flex-col">
      <div className="relative h-40 md:h-44 bg-gray-50 flex items-center justify-center">
        <span
          className="text-5xl md:text-6xl group-hover:scale-105 transition-transform duration-500"
          aria-hidden
        >
          {game.emoji}
        </span>
        <span className="absolute top-3 right-3 bg-orange-600 text-white text-xs font-bold px-2 py-1 rounded-full">
          +{game.xp} XP
        </span>
        <span className="absolute top-3 left-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full">
          <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
          <span className="text-xs font-bold text-(--ink)">{game.rating}</span>
        </span>
      </div>
      <div className="p-5 flex flex-col flex-1 gap-2">
        <span className="self-start text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
          {locale === "pt" ? catLabel.pt : catLabel.en}
        </span>
        <h3 className="font-display text-lg font-bold text-[var(--ink)]">{title}</h3>
        <div className="text-xs text-gray-400 font-semibold flex items-center gap-3">
          <span>{game.dur}</span>
          <span>{game.level}</span>
        </div>
        <div className="mt-auto pt-2">
          {game.locked ? (
            <div className="w-full py-2.5 rounded-xl bg-gray-50 text-gray-400 text-sm font-semibold flex items-center justify-center gap-2">
              <Lock className="w-4 h-4" />
              {locale === "pt" ? game.unlockPt : game.unlockEn}
            </div>
          ) : (
            <button
              onClick={onPlay}
              className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              {locale === "pt" ? "Jogar" : "Play"}
              <Play className="w-4 h-4" fill="currentColor" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
