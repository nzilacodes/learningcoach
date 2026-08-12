import { Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useClickOutside } from "@/hooks/use-click-outside";
import {
  Flame,
  Trophy,
  Star,
  Clock,
  BookOpen,
  Mic,
  Gamepad2,
  Lock,
  Check,
  Target,
  MessageCircle,
  HelpCircle,
  Gift,
  User,
  Settings,
  LogOut,
  Zap,
  Play,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { VideosSidebar, VideosMobileNav } from "@/components/videos/videos-sidebar";
import { useLocale } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useNotification } from "@/lib/notifications/notification-provider";
import type { DashboardData, SubscriptionRow } from "@/lib/learning";
import {
  ProfileHeader,
  LeaderboardCard,
  CertificatesCard,
  AchievementsCard,
  ActivityCalendar,
  GoalsCard,
  ClassesCard,
  ReminderCard,
} from "@/components/dashboard/extras";

const QUICK_PRACTICE = (locale: "pt" | "en") => [
  { icon: Mic, label: locale === "pt" ? "Falar" : "Speak", to: "/pronunciation" as const, accent: "hover:bg-[var(--violet)]/5" },
  { icon: BookOpen, label: locale === "pt" ? "Ler" : "Read", to: "/reading" as const, accent: "hover:bg-[var(--magenta)]/5" },
  { icon: Gamepad2, label: locale === "pt" ? "Jogar" : "Play", to: "/games" as const, accent: "hover:bg-amber-50" },
  { icon: Target, label: locale === "pt" ? "Quiz" : "Quiz", to: "/curriculum" as const, accent: "hover:bg-emerald-50" },
];

/** Adult layout: dense bento grid, full subscription management, configurable
 * study reminder — the original dashboard layout, unchanged in substance. */
export function AdultsDashboard(data: DashboardData) {
  const { locale } = useLocale();
  const notify = useNotification();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);
  useClickOutside(avatarRef, setAvatarMenuOpen);

  const { sub, daysLeft, pct: subPct, billingCycle } = data.subscription;
  const planLabel = billingCycle
    ? (
        {
          monthly: locale === "pt" ? "Mensal" : "Monthly",
          quarterly: locale === "pt" ? "Trimestral" : "Quarterly",
          semiannual: locale === "pt" ? "Semestral" : "Semiannual",
        } as Record<string, string>
      )[billingCycle]
    : null;

  const { units, currentUnit, currentPct, completedLessonCount, nextLessonId, week, reminder } =
    data;
  const goalDays = week.goalDays;
  const daysToGo = Math.max(0, goalDays - week.days);

  const stats = [
    {
      icon: Flame,
      label: locale === "pt" ? "Sequência" : "Streak",
      value: String(data.userStats?.streak_days ?? 0),
      unit: locale === "pt" ? "dias" : "days",
      color: "text-orange-500 bg-orange-100",
    },
    {
      icon: Star,
      label: "XP",
      value: (data.userStats?.xp ?? 0).toLocaleString(),
      unit: "",
      color: "text-amber-500 bg-amber-100",
    },
    {
      icon: Trophy,
      label: locale === "pt" ? "Concluídas" : "Completed",
      value: String(completedLessonCount),
      unit: locale === "pt" ? "lições" : "lessons",
      color: "text-[var(--magenta)] bg-[var(--magenta)]/10",
    },
    {
      icon: Clock,
      label: locale === "pt" ? "Estudou" : "Studied",
      value: week.label,
      unit: locale === "pt" ? "semana" : "this week",
      color: "text-[var(--violet)] bg-[var(--violet)]/10",
    },
  ];

  const displayName = data.firstName ?? (locale === "pt" ? "Aluno" : "Learner");

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      <VideosSidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-[#f7f9fb]">
        {/* ====== TopBar ====== */}
        <header className="h-16 flex items-center justify-between px-4 md:px-6 bg-white/80 backdrop-blur-xl border-b border-gray-100 shrink-0 z-10">
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="font-display text-xl font-bold text-[var(--ink)] truncate">
              {locale === "pt" ? "Dashboard" : "Dashboard"}
            </h1>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <Link
              to="/pricing"
              className="bg-[var(--ink)] text-white px-3 md:px-4 py-1.5 rounded-lg flex items-center gap-2 text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <Zap className="w-4 h-4 text-yellow-400" fill="currentColor" />
              <span className="hidden sm:inline">Upgrade</span>
            </Link>
            <Link
              to="/contact"
              title={locale === "pt" ? "Ajuda" : "Help"}
              className="p-2 text-gray-500 hover:bg-gray-50 rounded-full transition-colors hidden sm:inline-flex"
            >
              <HelpCircle className="w-5 h-5" />
            </Link>
            <Link
              to="/rewards"
              title={locale === "pt" ? "Recompensas" : "Rewards"}
              className="p-2 text-gray-500 hover:bg-gray-50 rounded-full transition-colors hidden sm:inline-flex"
            >
              <Gift className="w-5 h-5" />
            </Link>
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
                className="relative inline-flex"
              >
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 block w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
              </button>
            </div>
            <Link to="/profile" className="hidden md:block" title={locale === "pt" ? "Ver perfil" : "View profile"}>
              <div className="relative inline-flex">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
              </div>
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-20 md:pb-6 scrollbar-hide">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
            {/* ====== DESKTOP LAYOUT ====== */}
            <div className="hidden lg:block">
              <div className="lg:mr-[380px]">
                {/* --- Main Column (Desktop) --- */}
                <div className="space-y-8">
                  {/* Profile Header */}
                  <ProfileHeader />

                  {/* Welcome */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        {locale === "pt" ? "Bons estudos," : "Good studies,"}
                      </p>
                      <h1 className="font-display text-2xl md:text-3xl font-bold text-[var(--ink)]">
                        {locale === "pt"
                          ? `Bom dia, ${displayName}!`
                          : `Good morning, ${displayName}!`}{" "}
                        👋
                      </h1>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="bg-[var(--violet)]/10 text-[var(--violet)] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        {user?.cefrLevel ?? "A1"}
                      </span>
                      <Link
                        to="/ai-coach"
                        className="flex items-center gap-2 px-5 py-2 bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-semibold hover:bg-gray-50 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        {locale === "pt" ? "Falar com Professor" : "Talk to Teacher"}
                      </Link>
                    </div>
                  </div>

                  {/* Stats — glass cards */}
                  <div className="grid grid-cols-4 gap-4">
                    {stats.map((s) => (
                      <div
                        key={s.label}
                        className="bg-white/70 backdrop-blur-md border border-gray-100/80 p-4 rounded-2xl shadow-sm flex flex-col"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className={`w-8 h-8 rounded-lg ${s.color} flex items-center justify-center`}
                          >
                            <s.icon className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                            {s.label}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="font-display text-3xl font-bold text-[var(--ink)]">
                            {s.value}
                          </span>
                          {s.unit && <span className="text-xs text-gray-400">{s.unit}</span>}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Hero: Continue Card */}
                  <div className="bg-gradient-to-br from-[var(--violet)] via-[var(--magenta)] to-[var(--violet)] rounded-3xl p-6 md:p-8 text-white flex items-center gap-8 shadow-xl relative overflow-hidden">
                    {/* Blobs */}
                    <div className="absolute -top-10 -right-10 w-64 h-64 bg-white/10 blur-3xl rounded-full" />
                    <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-black/10 blur-2xl rounded-full" />
                    <div className="relative z-10 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70 mb-2">
                        {locale === "pt" ? "Continuar aprendendo" : "Continue learning"}
                      </p>
                      <h3 className="font-display text-3xl md:text-4xl font-bold mb-4">
                        {locale === "pt"
                          ? `Unidade ${currentUnit.index}: ${currentUnit.title}`
                          : `Unit ${currentUnit.index}: ${currentUnit.title}`}
                      </h3>
                      <p className="text-white/80 text-sm mb-6 max-w-md">
                        {locale === "pt"
                          ? `Você parou na lição atual. Complete agora para ganhar XP bônus!`
                          : `You stopped at the current lesson. Complete now to earn bonus XP!`}
                      </p>
                      <div className="w-full bg-white/20 h-3 rounded-full mb-8 overflow-hidden">
                        <div
                          className="bg-white h-full rounded-full"
                          style={{ width: `${Math.max(5, currentPct)}%` }}
                        />
                      </div>
                      <Link
                        to={nextLessonId ? "/lesson/$lessonId" : "/curriculum"}
                        params={nextLessonId ? { lessonId: nextLessonId } : undefined}
                        className="inline-flex items-center gap-2 bg-white text-[var(--violet)] px-8 py-4 rounded-2xl font-bold shadow-lg hover:scale-105 active:scale-95 transition-transform"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        {locale === "pt" ? "Retomar Lição" : "Resume Lesson"}
                      </Link>
                    </div>
                    <div className="w-48 h-48 shrink-0 relative z-10 hidden md:block">
                      <img
                        src={currentUnit.image}
                        alt={currentUnit.title}
                        className="w-full h-full object-cover rounded-2xl rotate-3 shadow-2xl"
                        loading="lazy"
                      />
                    </div>
                  </div>

                  {/* Quick Practice */}
                  <div>
                    <h3 className="font-display text-lg font-bold text-[var(--ink)] mb-4">
                      {locale === "pt" ? "Prática Rápida" : "Quick Practice"}
                    </h3>
                    <div className="grid grid-cols-4 gap-4">
                      {QUICK_PRACTICE(locale).map((a) => (
                        <Link
                          key={a.label}
                          to={a.to}
                          className={`flex flex-col items-center gap-3 bg-white/70 backdrop-blur-md border border-gray-100/80 rounded-2xl p-5 shadow-sm transition-all ${a.accent} hover:shadow-md active:scale-95`}
                        >
                          <a.icon className="w-7 h-7 text-[var(--violet)]" />
                          <span className="text-xs font-bold text-gray-700">{a.label}</span>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Learning Track — Bento Grid */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-display text-lg font-bold text-[var(--ink)]">
                        {locale === "pt" ? "Trilha de Aprendizado" : "Learning Track"}
                      </h3>
                      <Link
                        to="/curriculum"
                        className="text-sm font-bold text-[var(--violet)] hover:opacity-80"
                      >
                        {locale === "pt" ? "Ver tudo" : "View all"}
                      </Link>
                    </div>
                    <div
                      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6"
                      style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}
                    >
                      {units.map((u) => (
                        <Link key={u.id} to="/curriculum" className="relative group block">
                          <div
                            className={`aspect-square rounded-2xl overflow-hidden mb-2 border ${
                              u.current
                                ? "ring-2 ring-[var(--violet)] ring-offset-2 border-[var(--violet)]/20"
                                : u.locked
                                  ? "border-gray-100 grayscale opacity-50 bg-gray-50"
                                  : u.done
                                    ? "border-gray-100 grayscale opacity-60"
                                    : "border-gray-100"
                            }`}
                          >
                            {u.locked ? (
                              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                <Lock className="w-8 h-8 text-gray-300" />
                              </div>
                            ) : (
                              <>
                                <img
                                  src={u.image}
                                  alt={u.title}
                                  loading="lazy"
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                                {u.done && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                    <Check className="w-8 h-8 text-white" />
                                  </div>
                                )}
                              </>
                            )}
                            {u.current && !u.locked && (
                              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                                <div className="h-1 bg-white/30 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-white rounded-full"
                                    style={{ width: `${u.progress}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                          <p
                            className={`text-[10px] font-bold uppercase tracking-wider ${
                              u.current
                                ? "text-[var(--violet)]"
                                : u.locked
                                  ? "text-gray-300"
                                  : "text-gray-500"
                            }`}
                          >
                            {u.current
                              ? `${locale === "pt" ? "ATUAL" : "CURRENT"} • ${locale === "pt" ? "UNIDADE" : "UNIT"} ${u.index}`
                              : `${locale === "pt" ? "UNIDADE" : "UNIT"} ${u.index}`}
                          </p>
                          <p
                            className={`text-xs font-bold truncate ${u.locked ? "text-gray-300" : "text-[var(--ink)]"}`}
                          >
                            {u.title}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Extras — Activity Calendar + Leaderboard */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ActivityCalendar />
                    <LeaderboardCard />
                  </div>

                  {/* More extras */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <GoalsCard />
                    <CertificatesCard />
                    <AchievementsCard />
                  </div>
                </div>
              </div>
            </div>
            {/* --- Right Sidebar (Desktop, fixed) --- */}
            <aside className="hidden lg:flex flex-col fixed right-0 top-16 bottom-0 w-[380px] border-l border-gray-100 bg-[#f7f9fb] p-6 gap-6 overflow-y-auto">
              {/* Weekly Goal */}
              <div className="bg-white/70 backdrop-blur-md border border-gray-100/80 rounded-3xl p-6 shadow-sm flex flex-col items-center">
                <h4 className="text-sm font-bold text-[var(--ink)] self-start mb-4">
                  {locale === "pt" ? "Meta Semanal" : "Weekly Goal"}
                </h4>
                <div className="relative w-32 h-32 mb-4">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="transparent"
                      strokeWidth="10"
                      className="stroke-gray-100"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="transparent"
                      strokeWidth="10"
                      strokeLinecap="round"
                      className="stroke-[var(--violet)] transition-all duration-1000"
                      strokeDasharray={`${(week.pct * 2 * Math.PI * 42).toFixed(1)} 999`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-display text-2xl font-bold text-[var(--ink)]">
                      {week.days}/{goalDays}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-gray-400">
                      {locale === "pt" ? "Dias" : "Days"}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-center text-gray-500">
                  {daysToGo === 0
                    ? locale === "pt"
                      ? "Meta da semana atingida! 🎉"
                      : "Weekly goal reached! 🎉"
                    : locale === "pt"
                      ? `Falta${daysToGo === 1 ? " 1 dia" : `m ${daysToGo} dias`} para bater sua meta!`
                      : `${daysToGo} day${daysToGo === 1 ? "" : "s"} to go!`}
                </p>
                <div className="flex gap-1 mt-3">
                  {Array.from({ length: goalDays }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-6 h-1.5 rounded-full ${i < week.days ? "bg-[var(--violet)]" : "bg-gray-200"}`}
                    />
                  ))}
                </div>
              </div>

              {/* Study Reminder */}
              <ReminderCard reminder={reminder} locale={locale} />

              {/* Turmas */}
              <ClassesCard />

              {/* Subscription */}
              <SubscriptionCard
                sub={sub}
                daysLeft={daysLeft}
                planLabel={planLabel}
                pct={subPct}
                locale={locale}
              />
            </aside>

            {/* ====== MOBILE LAYOUT ====== */}
            <div className="lg:hidden space-y-6">
              {/* Profile Header */}
              <ProfileHeader />

              {/* Welcome */}
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">
                    {locale === "pt" ? "Bons estudos," : "Good studies,"}
                  </p>
                  <h1 className="font-display text-xl font-bold text-[var(--ink)]">
                    {locale === "pt" ? `Bom dia, ${displayName}!` : `Good morning, ${displayName}!`}{" "}
                    👋
                  </h1>
                </div>
                <span className="bg-[var(--violet)]/10 text-[var(--violet)] px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {user?.cefrLevel ?? "A1"}
                </span>
              </div>

              {/* Stats — 2 col horizontal */}
              <div className="grid grid-cols-2 gap-3">
                {stats.map((s) => (
                  <div
                    key={s.label}
                    className="bg-white border border-gray-100 rounded-2xl p-3.5 shadow-sm flex items-center gap-3"
                  >
                    <div
                      className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center shrink-0`}
                    >
                      <s.icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        {s.label}
                      </p>
                      <p className="font-display text-base font-bold text-[var(--ink)]">
                        {s.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Continue Card — image bg overlay */}
              <div className="relative h-48 rounded-[2rem] overflow-hidden shadow-md active:scale-[0.98] transition-transform">
                <img
                  src={currentUnit.image}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--violet)]/90 via-[var(--violet)]/40 to-transparent" />
                <div className="absolute bottom-0 w-full p-5 space-y-2">
                  <div className="flex items-end justify-between">
                    <div>
                      <span className="text-white/70 text-[10px] font-bold uppercase tracking-widest">
                        {locale === "pt" ? "UNIDADE" : "UNIT"} {currentUnit.index}
                      </span>
                      <h2 className="text-white font-display text-lg font-bold">
                        {currentUnit.title}
                      </h2>
                    </div>
                    <Link
                      to={nextLessonId ? "/lesson/$lessonId" : "/curriculum"}
                      params={nextLessonId ? { lessonId: nextLessonId } : undefined}
                      className="bg-white text-[var(--violet)] px-4 py-2 rounded-full text-xs font-bold shadow-lg active:scale-90 transition-transform shrink-0"
                    >
                      {locale === "pt" ? "Retomar" : "Resume"}
                    </Link>
                  </div>
                  <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-white h-full rounded-full"
                      style={{ width: `${Math.max(5, currentPct)}%` }}
                    />
                  </div>
                  <p className="text-white/70 text-[10px] text-right">{currentPct}% concluído</p>
                </div>
              </div>

              {/* Quick Actions — horizontal scroll */}
              <div>
                <h3 className="font-display text-base font-bold text-[var(--ink)] mb-3">
                  {locale === "pt" ? "Prática Rápida" : "Quick Practice"}
                </h3>
                <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                  {QUICK_PRACTICE(locale).map((a) => (
                    <Link
                      key={a.label}
                      to={a.to}
                      className="flex-shrink-0 w-20 flex flex-col items-center gap-2 active:scale-90 transition-transform"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-[var(--violet)]/10 flex items-center justify-center text-[var(--violet)] shadow-sm">
                        <a.icon className="w-6 h-6" />
                      </div>
                      <span className="text-[11px] font-semibold text-gray-600">{a.label}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Weekly Goal — horizontal layout */}
              <div className="bg-white border border-gray-100 rounded-[2rem] p-5 flex items-center gap-5 shadow-sm">
                <div className="relative w-20 h-20 shrink-0">
                  <svg viewBox="0 0 36 36" className="w-full h-full">
                    <path
                      className="text-gray-100 stroke-current"
                      fill="none"
                      strokeWidth="3"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-[var(--violet)] stroke-current"
                      fill="none"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={`${week.pct * 100}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-display text-sm font-bold text-[var(--violet)]">
                      {week.days}/{goalDays}
                    </span>
                    <span className="text-[9px] font-bold text-gray-400 uppercase">
                      {locale === "pt" ? "Dias" : "Days"}
                    </span>
                  </div>
                </div>
                <div className="flex-1 space-y-1">
                  <h4 className="font-display text-base font-bold text-[var(--ink)]">
                    {locale === "pt" ? "Meta Semanal" : "Weekly Goal"}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {daysToGo === 0
                      ? locale === "pt"
                        ? "Meta da semana atingida! 🎉"
                        : "Weekly goal reached! 🎉"
                      : locale === "pt"
                        ? `Falta${daysToGo === 1 ? " 1 dia" : `m ${daysToGo} dias`} para completar!`
                        : `${daysToGo} day${daysToGo === 1 ? "" : "s"} to go!`}
                  </p>
                  <div className="flex gap-1 pt-1">
                    {Array.from({ length: goalDays }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-6 h-1.5 rounded-full ${i < week.days ? "bg-[var(--violet)]" : "bg-gray-200"}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Learning Track — Vertical Timeline */}
              <div>
                <h3 className="font-display text-base font-bold text-[var(--ink)] mb-4">
                  {locale === "pt" ? "Trilha de Aprendizado" : "Learning Track"}
                </h3>
                <div className="relative space-y-4">
                  <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-gray-200 -z-10" />
                  {units.map((u) => (
                    <div key={u.id} className="flex gap-4 items-start">
                      <div
                        className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center relative z-10 ${
                          u.done
                            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-100"
                            : u.current
                              ? "bg-[var(--violet)]/10 text-[var(--violet)] ring-2 ring-[var(--violet)]/30 shadow-lg"
                              : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {u.done ? (
                          <Check className="w-5 h-5" />
                        ) : u.locked ? (
                          <Lock className="w-4 h-4" />
                        ) : (
                          <Play className="w-5 h-5 fill-current" />
                        )}
                      </div>
                      <div
                        className={`flex-1 pb-4 border-b border-gray-100 ${u.locked ? "opacity-40" : ""}`}
                      >
                        <p
                          className={`text-[10px] font-bold uppercase tracking-wider ${
                            u.current ? "text-[var(--violet)]" : "text-gray-400"
                          }`}
                        >
                          {u.current
                            ? `${locale === "pt" ? "ATUAL" : "CURRENT"} • ${locale === "pt" ? "UNIDADE" : "UNIT"} ${u.index}`
                            : `${locale === "pt" ? "UNIDADE" : "UNIT"} ${u.index}`}
                        </p>
                        <h4 className="font-display text-sm font-bold text-[var(--ink)]">
                          {u.title}
                        </h4>
                        {u.current && !u.done && (
                          <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden w-24">
                            <div
                              className="h-full bg-[var(--violet)] rounded-full"
                              style={{ width: `${u.progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                      {u.current && !u.locked && !u.done && (
                        <Link
                          to={nextLessonId ? "/lesson/$lessonId" : "/curriculum"}
                          params={nextLessonId ? { lessonId: nextLessonId } : undefined}
                          className="shrink-0 text-[var(--violet)] text-xs font-bold flex items-center gap-1 mt-1"
                        >
                          {locale === "pt" ? "Continuar" : "Continue"}{" "}
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Extras stacked */}
              <div className="space-y-4">
                <ActivityCalendar />
                <LeaderboardCard />
                <ReminderCard reminder={reminder} locale={locale} />
                <ClassesCard />
                <GoalsCard />
                <CertificatesCard />
                <AchievementsCard />
              </div>

              {/* Mobile subscription */}
              <SubscriptionCard
                sub={sub}
                daysLeft={daysLeft}
                planLabel={planLabel}
                pct={subPct}
                locale={locale}
              />
            </div>
          </div>
        </main>
      </div>
      <VideosMobileNav />
    </div>
  );
}

/* ====== Subscription Card Component ====== */
function SubscriptionCard({
  sub,
  daysLeft,
  planLabel,
  pct,
  locale,
}: {
  sub: SubscriptionRow | null | undefined;
  daysLeft: number | null;
  planLabel: string | null;
  pct: number;
  locale: "pt" | "en";
}) {
  const notify = useNotification();
  if (sub?.status === "active") {
    const activationCode = sub.activation_code;
    return (
      <div className="bg-gradient-to-r from-[var(--violet)] to-[var(--magenta)] premium-shadow rounded-3xl p-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold">
              {locale === "pt" ? "Plano" : "Plan"} • {planLabel}
            </p>
            <p className="text-[10px] text-white/70">
              {daysLeft != null
                ? `${daysLeft} ${locale === "pt" ? "dias restantes" : "days left"}`
                : locale === "pt" ? "Sem data de expiração" : "No expiration date"}
            </p>
          </div>
        </div>
        {activationCode && (
          <button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(activationCode);
                notify.success(locale === "pt" ? "Código copiado" : "Code copied");
              } catch {
                notify.error(locale === "pt" ? "Falha ao copiar o código" : "Failed to copy code");
              }
            }}
            className="text-[10px] font-mono bg-white/10 rounded-full px-2 py-0.5 mb-3 block"
          >
            {activationCode}
          </button>
        )}
        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden mb-4">
          <div className="h-full bg-white rounded-full" style={{ width: `${pct}%` }} />
        </div>
        <Link
          to="/pricing"
          className="block w-full text-center py-2.5 bg-white text-[var(--violet)] rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
        >
          {locale === "pt" ? "Renovar Plano" : "Renew Plan"}
        </Link>
      </div>
    );
  }

  if (sub?.status === "pending") {
    return (
      <div className="rounded-3xl border border-amber/40 bg-amber/10 p-6">
        <div className="text-[10px] font-bold uppercase tracking-widest text-amber mb-1">
          {locale === "pt" ? "Aguardando ativação" : "Awaiting activation"}
        </div>
        <p className="font-display text-base font-bold text-[var(--ink)]">
          {locale === "pt" ? "Pagamento em verificação" : "Payment under review"}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          {locale === "pt"
            ? "O administrador irá ativar a sua assinatura após confirmar o pagamento."
            : "The admin will activate your subscription after confirming the payment."}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white/70 backdrop-blur-md border border-gray-100/80 rounded-3xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
          <Zap className="w-5 h-5 text-gray-400" />
        </div>
        <div>
          <p className="text-xs font-bold text-[var(--ink)]">
            {locale === "pt" ? "Sem assinatura" : "No subscription"}
          </p>
          <p className="text-[10px] text-gray-400">
            {locale === "pt" ? "Escolha um plano" : "Choose a plan"}
          </p>
        </div>
      </div>
      <Link
        to="/pricing"
        className="block w-full text-center py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors"
      >
        {locale === "pt" ? "Ver Planos" : "See Plans"}
      </Link>
    </div>
  );
}
