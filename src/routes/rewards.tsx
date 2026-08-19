import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Trophy,
  Flame,
  Coins,
  Sparkles,
  Target,
  Users,
  Globe,
  MapPin,
  Calendar as CalendarIcon,
  ShoppingBag,
  UserPlus,
  Check,
  Loader2,
  Star,
} from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import { useNotification } from "@/lib/notifications/notification-provider";
import { celebrate, levelProgress, xpForLevel } from "@/lib/gamification";
import { useLocale } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { VideosSidebar, VideosMobileNav } from "@/components/videos/videos-sidebar";
import {
  HeaderActionLinks,
  MobileAvatarMenu,
  DesktopAvatarLink,
} from "@/components/mobile-avatar-menu";

export const Route = createFileRoute("/rewards")({
  component: RewardsPage,
  head: () => ({
    meta: [
      { title: "Recompensas — Learning English with Coach" },
      {
        name: "description",
        content: "XP, moedas, missões, loja, rankings e streak — o teu progresso gamificado.",
      },
      { property: "og:title", content: "Recompensas — Coach" },
      { property: "og:description", content: "Ganha XP, moedas e sobe no ranking mundial." },
    ],
  }),
});

type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  xp: number;
  level: number;
  coins: number;
  streak: number;
  country: string | null;
  avatar_config: Record<string, unknown>;
};
type Mission = {
  id: string;
  code: string;
  scope: string;
  title: string;
  description: string;
  action_type: string;
  target: number;
  xp_reward: number;
  coin_reward: number;
  icon: string;
  progress: number;
  completed_at: string | null;
  claimed_at: string | null;
};
type ShopItem = {
  id: string;
  code: string;
  category: string;
  name: string;
  description: string;
  cost_coins: number;
  icon: string;
};
type XpEvent = { created_at: string; amount: number; source: string };
/** Normalized row for both the privacy-filtered world/national leaderboard
 * (display_name + streak/cefr_level) and the full-profile friends list
 * (full_name + level/country) — same visual shape, different underlying fields. */
type RankRow = {
  id: string;
  name: string;
  avatar_url: string | null;
  xp: number;
  sublabel: string;
};

type TabId = "missions" | "calendar" | "rankings" | "shop" | "avatar" | "friends";
type RankScope = "world" | "national" | "friends";

function RewardsPage() {
  const { locale } = useLocale();
  const notify = useNotification();
  const { user } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [shop, setShop] = useState<ShopItem[]>([]);
  const [inventory, setInventory] = useState<{ item_id: string; equipped: boolean }[]>([]);
  const [events, setEvents] = useState<XpEvent[]>([]);
  const [ranks, setRanks] = useState<{ world: RankRow[]; national: RankRow[]; friends: RankRow[] }>(
    {
      world: [],
      national: [],
      friends: [],
    },
  );
  const [friendEmail, setFriendEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [buying, setBuying] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("missions");
  const [rankScope, setRankScope] = useState<RankScope>("world");

  const refresh = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const [stats, ms, si, inv, ev, world] = await Promise.all([
        apiFetch<{
          xp: number;
          level: number;
          coins: number;
          streak: number;
          avatar_url: string | null;
          avatar_config: Record<string, unknown>;
        }>("/v1/me/gamification-stats"),
        apiFetch<Mission[]>("/v1/me/missions"),
        apiFetch<ShopItem[]>("/v1/shop-items"),
        apiFetch<{ item_id: string; equipped: boolean }[]>("/v1/me/inventory"),
        apiFetch<XpEvent[]>("/v1/me/xp-events?days=90"),
        apiFetch<
          {
            user_id: string;
            display_name: string;
            xp: number;
            streak: number;
            cefr_level: string | null;
          }[]
        >("/v1/leaderboard?limit=50"),
      ]);

      setProfile({
        id: user.id,
        full_name: user.fullName,
        country: user.country,
        avatar_url: stats.avatar_url,
        avatar_config: stats.avatar_config,
        xp: stats.xp,
        level: stats.level,
        coins: stats.coins,
        streak: stats.streak,
      });
      setMissions(ms);
      setShop(si);
      setInventory(inv);
      setEvents(ev);

      const worldRows: RankRow[] = world.map((r) => ({
        id: r.user_id,
        name: r.display_name,
        avatar_url: null,
        xp: r.xp,
        sublabel: `${r.cefr_level ?? "—"} · 🔥${r.streak}`,
      }));
      const national = user.country
        ? await apiFetch<typeof world>(
            `/v1/leaderboard?limit=50&country=${encodeURIComponent(user.country)}`,
          )
        : [];
      const nationalRows: RankRow[] = national.map((r) => ({
        id: r.user_id,
        name: r.display_name,
        avatar_url: null,
        xp: r.xp,
        sublabel: `${r.cefr_level ?? "—"} · 🔥${r.streak}`,
      }));
      const friendsList = await apiFetch<
        {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          xp: number;
          level: number;
          country: string | null;
        }[]
      >("/v1/me/friends");
      const friendsRows: RankRow[] = [
        ...friendsList,
        {
          id: user.id,
          full_name: user.fullName,
          avatar_url: stats.avatar_url,
          xp: stats.xp,
          level: stats.level,
          country: user.country,
        },
      ]
        .sort((a, b) => b.xp - a.xp)
        .map((f) => ({
          id: f.id,
          name: f.full_name ?? "—",
          avatar_url: f.avatar_url,
          xp: f.xp,
          sublabel: `${locale === "pt" ? "Nível" : "Level"} ${f.level} · ${f.country ?? "🌍"}`,
        }));

      setRanks({ world: worldRows, national: nationalRows, friends: friendsRows });
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : locale === "pt"
            ? "Erro ao carregar recompensas"
            : "Failed to load rewards",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [user?.id]);

  const ownedIds = useMemo(() => new Set(inventory.map((i) => i.item_id)), [inventory]);

  const claim = async (missionId: string) => {
    setClaiming(missionId);
    try {
      const r = await apiFetch<{ xp: number; coins: number }>(
        `/v1/me/missions/${missionId}/claim`,
        { method: "POST" },
      );
      notify.success(`Recompensa: +${r.xp} XP · +${r.coins} 🪙`);
      celebrate();
      await refresh();
    } catch (e) {
      notify.fromError(e, { dedupeKey: "rewards:claim" });
    } finally {
      setClaiming(null);
    }
  };

  const buy = async (itemId: string) => {
    setBuying(itemId);
    try {
      await apiFetch(`/v1/shop-items/${itemId}/purchase`, { method: "POST" });
      notify.success("Item comprado!");
      celebrate();
      await refresh();
    } catch (e) {
      notify.fromError(e, { dedupeKey: "rewards:buy" });
    } finally {
      setBuying(null);
    }
  };

  const equip = async (itemId: string) => {
    try {
      await apiFetch(`/v1/me/inventory/${itemId}/equip`, {
        method: "PUT",
        body: JSON.stringify({ equipped: true }),
      });
      notify.success("Equipado!");
      await refresh();
    } catch (e) {
      notify.fromError(e, { dedupeKey: "rewards:equip" });
    }
  };

  const addFriend = async () => {
    if (!friendEmail.trim()) return;
    try {
      await apiFetch("/v1/me/friends", {
        method: "POST",
        body: JSON.stringify({ email: friendEmail.trim() }),
      });
      notify.success("Amigo adicionado!");
      setFriendEmail("");
      await refresh();
    } catch (e) {
      notify.fromError(e, { dedupeKey: "rewards:add-friend" });
    }
  };

  const tabs: { id: TabId; label: string; Icon: typeof Target }[] = [
    { id: "missions", label: locale === "pt" ? "Missões" : "Missions", Icon: Target },
    { id: "calendar", label: locale === "pt" ? "Calendário" : "Calendar", Icon: CalendarIcon },
    { id: "rankings", label: "Rankings", Icon: Trophy },
    { id: "shop", label: locale === "pt" ? "Loja" : "Shop", Icon: ShoppingBag },
    { id: "avatar", label: "Avatar", Icon: Star },
    { id: "friends", label: locale === "pt" ? "Amigos" : "Friends", Icon: Users },
  ];

  const shell = (content: ReactNode) => (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      <VideosSidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <header className="h-16 flex items-center justify-between px-4 md:px-6 bg-white border-b border-gray-100 shrink-0 z-10">
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="font-display text-xl font-bold text-[var(--ink)] truncate">
              {locale === "pt" ? "Recompensas" : "Rewards"}
            </h1>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <HeaderActionLinks />
            <MobileAvatarMenu />
            <DesktopAvatarLink />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto pb-20 md:pb-6 scrollbar-hide">{content}</main>
      </div>
      <VideosMobileNav />
    </div>
  );

  if (loading) {
    return shell(
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--violet)]" />
      </div>,
    );
  }

  if (error) {
    return shell(
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <h2 className="font-display text-xl font-bold text-[var(--ink)]">
          {locale === "pt" ? "Não foi possível carregar as recompensas" : "Couldn't load rewards"}
        </h2>
        <p className="mt-2 text-sm text-gray-500">{error}</p>
        <button
          onClick={() => refresh()}
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-[var(--primary)] px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
        >
          {locale === "pt" ? "Tentar novamente" : "Try again"}
        </button>
      </div>,
    );
  }

  if (!profile) {
    return shell(
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--violet)]/10">
          <Trophy className="h-8 w-8 text-[var(--violet)]" />
        </div>
        <h2 className="font-display text-xl font-bold text-[var(--ink)]">
          {locale === "pt"
            ? "Inicia sessão para ver as recompensas"
            : "Sign in to see your rewards"}
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          {locale === "pt"
            ? "XP, missões, loja e rankings ficam disponíveis com a tua conta."
            : "XP, missions, shop and rankings unlock with your account."}
        </p>
        <Link
          to="/auth"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-[var(--primary)] px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
        >
          {locale === "pt" ? "Entrar" : "Sign in"}
        </Link>
      </div>,
    );
  }

  const lp = levelProgress(profile.xp, profile.level);
  const displayName =
    profile.full_name?.trim() ||
    user?.email?.split("@")[0] ||
    (locale === "pt" ? "Aluno" : "Learner");

  return shell(
    <>
      {/* Hero status strip — same pattern as /games */}
      <div className="bg-[var(--ink)] text-white">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="flex items-center gap-4 md:flex-1 md:pr-8 md:border-r md:border-white/10">
            <div className="relative shrink-0">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-[var(--violet)] to-[var(--magenta)] flex items-center justify-center text-2xl font-bold text-white border-2 border-white/20 shadow-lg">
                {displayName.slice(0, 1).toUpperCase()}
              </div>
              <span className="absolute -bottom-1 -right-1 bg-amber-400 text-[var(--ink)] text-2xs font-extrabold px-2 py-0.5 rounded-full border-2 border-[var(--ink)]">
                LVL {profile.level}
              </span>
            </div>
            <div className="min-w-0">
              <span className="text-2xs md:text-xs font-bold uppercase tracking-widest text-white/60">
                {locale === "pt" ? "Hub de recompensas" : "Rewards hub"}
              </span>
              <h2 className="mt-1 font-display text-xl md:text-2xl font-bold truncate">
                {displayName}
              </h2>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-full text-2xs font-semibold">
                  <Flame className="w-3 h-3 text-orange-400" />
                  {profile.streak} {locale === "pt" ? "dias de streak" : "day streak"}
                </span>
                <span className="inline-flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-full text-2xs font-semibold">
                  <Coins className="w-3 h-3 text-yellow-400" />
                  {profile.coins} {locale === "pt" ? "moedas" : "coins"}
                </span>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-80 shrink-0">
            <div className="flex justify-between text-2xs font-medium text-white/60 mb-2">
              <span>
                {locale === "pt" ? "Nível" : "Level"} {profile.level}
              </span>
              <span>
                {locale === "pt" ? "Nível" : "Level"} {profile.level + 1}
              </span>
            </div>
            <div className="h-2.5 bg-white/15 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-300 via-yellow-400 to-orange-400 transition-all duration-700"
                style={{ width: `${Math.min(100, Math.max(0, lp.pct))}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-sm font-semibold">
              <span>{profile.xp.toLocaleString()} XP</span>
              <span className="text-amber-200/90">
                {xpForLevel(profile.level + 1) - profile.xp} XP{" "}
                {locale === "pt" ? "para subir" : "to go"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-10">
        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          <StatCard
            label={locale === "pt" ? "Nível" : "Level"}
            value={String(profile.level)}
            icon={<Trophy className="w-5 h-5 text-amber-500" />}
            accent="bg-amber-50"
          />
          <StatCard
            label="XP total"
            value={profile.xp.toLocaleString()}
            icon={<Sparkles className="w-5 h-5 text-[var(--violet)]" />}
            accent="bg-[var(--violet)]/10"
          />
          <StatCard
            label={locale === "pt" ? "Moedas" : "Coins"}
            value={String(profile.coins)}
            icon={<Coins className="w-5 h-5 text-yellow-500" />}
            accent="bg-yellow-50"
          />
          <StatCard
            label="Streak"
            value={`${profile.streak}d`}
            icon={<Flame className="w-5 h-5 text-orange-500" />}
            accent="bg-orange-50"
          />
        </div>

        {/* Pill tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide -mx-1 px-1">
          {tabs.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all ${
                activeTab === id
                  ? "bg-[var(--primary)] text-white shadow-md"
                  : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab panels */}
        {activeTab === "missions" && (
          <div className="space-y-8">
            {(["daily", "weekly", "monthly"] as const).map((scope) => {
              const label =
                scope === "daily"
                  ? locale === "pt"
                    ? "Diárias"
                    : "Daily"
                  : scope === "weekly"
                    ? locale === "pt"
                      ? "Semanais"
                      : "Weekly"
                    : locale === "pt"
                      ? "Mensais"
                      : "Monthly";
              const list = missions.filter((m) => m.scope === scope);
              if (list.length === 0) return null;
              return (
                <section key={scope}>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-display text-lg font-bold text-[var(--ink)]">
                      {locale === "pt" ? "Missões" : "Missions"} {label}
                    </h2>
                    <span className="text-xs font-semibold text-gray-400">
                      {list.filter((m) => m.claimed_at).length}/{list.length}
                    </span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {list.map((m) => {
                      const progress = m.progress ?? 0;
                      const done = !!m.completed_at;
                      const claimed = !!m.claimed_at;
                      const pct = m.target > 0 ? Math.min(100, (progress / m.target) * 100) : 0;
                      return (
                        <div
                          key={m.id}
                          className={`bg-white rounded-2xl border p-5 transition-all ${
                            done && !claimed
                              ? "border-[var(--violet)]/40 shadow-md ring-1 ring-[var(--violet)]/10"
                              : "border-gray-100 hover:shadow-lg"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="text-3xl leading-none">{m.icon}</div>
                            <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-0.5 text-2xs font-bold">
                              +{m.xp_reward} XP · +{m.coin_reward}🪙
                            </span>
                          </div>
                          <div className="mt-3 font-display text-base font-bold text-[var(--ink)]">
                            {m.title}
                          </div>
                          <div className="mt-1 text-xs text-gray-500 leading-relaxed">
                            {m.description}
                          </div>
                          <div className="mt-4 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                done ? "bg-emerald-500" : "bg-[var(--primary)]"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div className="mt-1.5 text-2xs text-gray-400 font-medium">
                            {Math.min(progress, m.target)} / {m.target}
                          </div>
                          <button
                            className={`mt-3 w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-opacity ${
                              claimed
                                ? "bg-gray-50 text-gray-400 border border-gray-100"
                                : done
                                  ? "bg-[var(--primary)] text-white hover:opacity-90"
                                  : "bg-gray-50 text-gray-500 border border-gray-100 cursor-default"
                            }`}
                            disabled={!done || claimed || claiming === m.id}
                            onClick={() => claim(m.id)}
                          >
                            {claiming === m.id ? (
                              <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                            ) : claimed ? (
                              <span className="inline-flex items-center justify-center gap-1">
                                <Check className="h-4 w-4" />
                                {locale === "pt" ? "Reclamado" : "Claimed"}
                              </span>
                            ) : done ? (
                              locale === "pt" ? (
                                "Reclamar recompensa"
                              ) : (
                                "Claim reward"
                              )
                            ) : locale === "pt" ? (
                              "Em progresso"
                            ) : (
                              "In progress"
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
            {missions.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-12">
                {locale === "pt" ? "Ainda sem missões ativas." : "No active missions yet."}
              </p>
            )}
          </div>
        )}

        {activeTab === "calendar" && <CalendarHeatmap events={events} locale={locale} />}

        {activeTab === "rankings" && (
          <div>
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
              {(
                [
                  {
                    id: "world" as const,
                    label: locale === "pt" ? "Mundial" : "World",
                    Icon: Globe,
                  },
                  {
                    id: "national" as const,
                    label: locale === "pt" ? "Nacional" : "National",
                    Icon: MapPin,
                  },
                  {
                    id: "friends" as const,
                    label: locale === "pt" ? "Amigos" : "Friends",
                    Icon: Users,
                  },
                ] as const
              ).map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setRankScope(id)}
                  className={`shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    rankScope === id
                      ? "bg-[var(--ink)] text-white"
                      : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
            {rankScope === "national" && !profile.country ? (
              <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-sm text-gray-500">
                {locale === "pt"
                  ? "Define o teu país no perfil para veres o ranking nacional."
                  : "Set your country in your profile to see the national ranking."}
              </div>
            ) : (
              <RankList
                rows={
                  rankScope === "world"
                    ? ranks.world
                    : rankScope === "national"
                      ? ranks.national
                      : ranks.friends
                }
                me={profile.id}
                locale={locale}
              />
            )}
          </div>
        )}

        {activeTab === "shop" && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shop.map((it) => {
              const owned = ownedIds.has(it.id);
              const canAfford = profile.coins >= it.cost_coins;
              return (
                <div
                  key={it.id}
                  className="group bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:border-[var(--violet)]/20 transition-all"
                >
                  <div className="h-24 rounded-xl bg-gradient-to-br from-gray-50 to-[var(--violet)]/5 flex items-center justify-center text-5xl group-hover:scale-105 transition-transform">
                    {it.icon}
                  </div>
                  <span className="mt-3 inline-block rounded-full bg-gray-50 border border-gray-100 px-2.5 py-0.5 text-2xs font-bold uppercase tracking-wider text-gray-400">
                    {it.category}
                  </span>
                  <div className="mt-2 font-display text-lg font-bold text-[var(--ink)]">
                    {it.name}
                  </div>
                  <div className="text-xs text-gray-500 leading-relaxed">{it.description}</div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 font-bold text-yellow-600">
                      <Coins className="h-4 w-4" />
                      {it.cost_coins}
                    </div>
                    {owned ? (
                      <button
                        onClick={() => equip(it.id)}
                        className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        {locale === "pt" ? "Equipar" : "Equip"}
                      </button>
                    ) : (
                      <button
                        disabled={!canAfford || buying === it.id}
                        onClick={() => buy(it.id)}
                        className="rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {buying === it.id
                          ? locale === "pt"
                            ? "A comprar…"
                            : "Buying…"
                          : locale === "pt"
                            ? "Comprar"
                            : "Buy"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {shop.length === 0 && (
              <p className="col-span-full text-sm text-gray-500 text-center py-12">
                {locale === "pt" ? "Loja vazia por agora." : "Shop is empty for now."}
              </p>
            )}
          </div>
        )}

        {activeTab === "avatar" && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-10 text-center max-w-xl mx-auto">
            <div className="mx-auto flex h-36 w-36 md:h-40 md:w-40 items-center justify-center rounded-full bg-gradient-to-br from-[var(--violet)] to-[var(--magenta)] text-5xl md:text-6xl font-bold text-white shadow-lg">
              {(profile.full_name ?? "?").slice(0, 1).toUpperCase()}
            </div>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {inventory
                .filter((i) => i.equipped)
                .map((i) => {
                  const it = shop.find((s) => s.id === i.item_id);
                  return it ? (
                    <span
                      key={i.item_id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-gray-100 bg-gray-50 px-3 py-1.5 text-sm font-semibold text-[var(--ink)]"
                    >
                      <span className="text-lg">{it.icon}</span> {it.name}
                    </span>
                  ) : null;
                })}
            </div>
            <p className="mt-5 text-sm text-gray-500 max-w-sm mx-auto">
              {locale === "pt"
                ? "Compra acessórios na loja e equipa-os para personalizar o teu avatar."
                : "Buy accessories in the shop and equip them to customize your avatar."}
            </p>
            <button
              onClick={() => setActiveTab("shop")}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            >
              <ShoppingBag className="w-4 h-4" />
              {locale === "pt" ? "Ir à loja" : "Go to shop"}
            </button>
          </div>
        )}

        {activeTab === "friends" && (
          <div className="space-y-4 max-w-2xl">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 md:p-6">
              <div className="flex items-center gap-2 font-display text-lg font-bold text-[var(--ink)]">
                <UserPlus className="h-5 w-5 text-[var(--violet)]" />
                {locale === "pt" ? "Adicionar amigo" : "Add friend"}
              </div>
              <div className="mt-3 flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  placeholder="email@exemplo.com"
                  aria-label={locale === "pt" ? "E-mail do amigo" : "Friend's email"}
                  value={friendEmail}
                  onChange={(e) => setFriendEmail(e.target.value)}
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]"
                />
                <button
                  onClick={addFriend}
                  className="rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity shrink-0"
                >
                  {locale === "pt" ? "Adicionar" : "Add"}
                </button>
              </div>
            </div>
            <RankList rows={ranks.friends} me={profile.id} locale={locale} />
          </div>
        )}
      </div>
    </>,
  );
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  accent: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 md:p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-2xs md:text-xs font-bold uppercase tracking-wider text-gray-400">
            {label}
          </p>
          <p className="mt-1 font-display text-2xl md:text-3xl font-bold text-[var(--ink)] truncate">
            {value}
          </p>
        </div>
        <div className={`w-10 h-10 rounded-xl ${accent} flex items-center justify-center shrink-0`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function RankList({ rows, me, locale }: { rows: RankRow[]; me: string; locale: string }) {
  return (
    <div className="space-y-2">
      {rows.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-10">
          {locale === "pt" ? "Sem dados ainda." : "No data yet."}
        </p>
      )}
      {rows.map((r, i) => (
        <div
          key={r.id}
          className={`flex items-center gap-3 md:gap-4 rounded-2xl border p-3 md:p-3.5 transition-all ${
            r.id === me
              ? "border-[var(--violet)]/30 bg-[var(--violet)]/5"
              : "border-gray-100 bg-white hover:shadow-sm"
          }`}
        >
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full font-bold text-sm shrink-0 ${
              i === 0
                ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white"
                : i === 1
                  ? "bg-gradient-to-br from-slate-300 to-slate-400 text-white"
                  : i === 2
                    ? "bg-gradient-to-br from-amber-600 to-amber-800 text-white"
                    : "bg-gray-100 text-gray-500"
            }`}
          >
            {i + 1}
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--violet)] to-[var(--magenta)] flex items-center justify-center text-white text-xs font-bold shrink-0">
            {(r.name ?? "?").slice(0, 1).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-[var(--ink)] truncate">
              {r.name ?? "—"}
              {r.id === me && (
                <span className="ml-1.5 inline-flex rounded-full bg-[var(--violet)]/10 text-[var(--violet)] px-1.5 py-0.5 text-2xs font-bold">
                  {locale === "pt" ? "Tu" : "You"}
                </span>
              )}
            </div>
            <div className="text-xs text-gray-400">{r.sublabel}</div>
          </div>
          <div className="text-right shrink-0">
            <div className="font-display text-base md:text-lg font-bold text-[var(--ink)]">
              {r.xp.toLocaleString()}
            </div>
            <div className="text-2xs uppercase tracking-wider text-gray-400">XP</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CalendarHeatmap({ events, locale }: { events: XpEvent[]; locale: string }) {
  const map = new Map<string, number>();
  for (const e of events) {
    const k = e.created_at.slice(0, 10);
    map.set(k, (map.get(k) ?? 0) + e.amount);
  }
  const days: { date: string; xp: number }[] = [];
  const now = new Date();
  for (let i = 89; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const k = d.toISOString().slice(0, 10);
    days.push({ date: k, xp: map.get(k) ?? 0 });
  }
  const max = Math.max(1, ...days.map((d) => d.xp));
  const color = (xp: number) => {
    if (xp === 0) return "bg-gray-100";
    const t = xp / max;
    if (t < 0.25) return "bg-[var(--violet)]/20";
    if (t < 0.5) return "bg-[var(--violet)]/40";
    if (t < 0.75) return "bg-[var(--violet)]/70";
    return "bg-[var(--violet)]";
  };
  const totalXp = days.reduce((s, d) => s + d.xp, 0);
  const activeDays = days.filter((d) => d.xp > 0).length;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 md:p-6">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="font-display text-lg font-bold text-[var(--ink)]">
          {locale === "pt" ? "Últimos 90 dias" : "Last 90 days"}
        </div>
        <div className="text-sm text-gray-500">
          {activeDays} {locale === "pt" ? "dias ativos" : "active days"} · {totalXp} XP
        </div>
      </div>
      <div className="grid grid-cols-[repeat(15,minmax(0,1fr))] gap-1 sm:grid-cols-[repeat(30,minmax(0,1fr))]">
        {days.map((d) => (
          <div
            key={d.date}
            title={`${d.date}: ${d.xp} XP`}
            className={`aspect-square rounded-sm ${color(d.xp)}`}
          />
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2 text-2xs text-gray-400">
        <span>{locale === "pt" ? "Menos" : "Less"}</span>
        <span className="w-3 h-3 rounded-sm bg-gray-100" />
        <span className="w-3 h-3 rounded-sm bg-[var(--violet)]/20" />
        <span className="w-3 h-3 rounded-sm bg-[var(--violet)]/40" />
        <span className="w-3 h-3 rounded-sm bg-[var(--violet)]/70" />
        <span className="w-3 h-3 rounded-sm bg-[var(--violet)]" />
        <span>{locale === "pt" ? "Mais" : "More"}</span>
      </div>
    </div>
  );
}
