import { Link } from "@tanstack/react-router";
import {
  Flame,
  Star,
  Gamepad2,
  Lock,
  Check,
  Play,
  Users,
  MessagesSquare,
  ChevronRight,
} from "lucide-react";
import { VideosSidebar, VideosMobileNav } from "@/components/videos/videos-sidebar";
import { AppHeader } from "@/components/app-header";
import { MobileAvatarMenu, DesktopAvatarLink } from "@/components/mobile-avatar-menu";
import { useLocale } from "@/lib/i18n";
import { AGE_TRACKS } from "@/lib/age-tracks";
import type { DashboardData } from "@/lib/learning";
import { DAILY_XP_GOAL } from "@/lib/learning";
import {
  ProfileHeader,
  LeaderboardCard,
  AchievementsCard,
  ClassesCard,
  ReminderCard,
} from "@/components/dashboard/extras";

/** Teen layout: leaderboard/friends and games up front, casual tone, a
 * horizontal track instead of the adult bento grid, and a subscription
 * status that's read-only (teens usually don't manage their own billing). */
export function TeensDashboard(data: DashboardData) {
  const { locale } = useLocale();
  const track = AGE_TRACKS.teens;

  const {
    units,
    currentUnit,
    currentPct,
    completedLessonCount,
    nextLessonId,
    week,
    reminder,
    subscription,
  } = data;
  const displayName = data.firstName ?? (locale === "pt" ? "Aluno" : "Learner");
  const teenGames = track.games.slice(0, 4);
  const todayXp = data.userStats?.today_xp ?? 0;
  const todayXpPct = Math.min(1, todayXp / DAILY_XP_GOAL);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <VideosSidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-panel-bg">
        {/* ====== TopBar ====== */}
        <AppHeader
          title={locale === "pt" ? "Seu progresso 🎮" : "Your progress 🎮"}
          blur
          actions={
            <>
              <div className="flex items-center gap-1.5 bg-orange-100 text-orange-600 px-3 py-1.5 rounded-full text-sm font-bold">
                <Flame className="w-4 h-4" />
                {data.userStats?.streak_days ?? 0}
              </div>
              <div className="flex items-center gap-1.5 bg-amber-100 text-amber-600 px-3 py-1.5 rounded-full text-sm font-bold">
                <Star className="w-4 h-4" />
                {(data.userStats?.xp ?? 0).toLocaleString()}
              </div>
              <MobileAvatarMenu />
              <DesktopAvatarLink />
            </>
          }
        />

        <main className="flex-1 overflow-y-auto pb-20 md:pb-6 scrollbar-hide">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 grid gap-6 lg:grid-cols-[1fr_340px]">
            {/* --- Main column --- */}
            <div className="space-y-6 min-w-0">
              <ProfileHeader />

              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {locale === "pt" ? "E aí," : "Hey,"}
                </p>
                <h2 className="font-display text-2xl font-bold text-ink">
                  {displayName}! {locale === "pt" ? "Bora treinar?" : "Ready to level up?"}
                </h2>
              </div>

              {/* Hero: Continue Card — track-colored gradient */}
              <div
                className={`bg-gradient-to-br ${track.color} rounded-3xl p-6 text-white flex items-center gap-6 shadow-xl relative overflow-hidden`}
              >
                <div className="absolute -top-8 -right-8 w-48 h-48 bg-white/10 blur-3xl rounded-full" />
                <div className="relative z-10 flex-1">
                  <p className="text-2xs font-bold uppercase tracking-[0.2em] text-white/70 mb-2">
                    {locale === "pt" ? "Continuar" : "Continue"}
                  </p>
                  <h3 className="font-display text-2xl md:text-3xl font-bold mb-3">
                    {locale === "pt"
                      ? `Unidade ${currentUnit.index}: ${currentUnit.title}`
                      : `Unit ${currentUnit.index}: ${currentUnit.title}`}
                  </h3>
                  <div
                    className="w-full bg-white/20 h-2.5 rounded-full mb-5 overflow-hidden max-w-xs"
                    role="progressbar"
                    aria-valuenow={Math.round(Math.max(5, currentPct))}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={currentUnit.title}
                  >
                    <div
                      className="bg-white h-full rounded-full"
                      style={{ width: `${Math.max(5, currentPct)}%` }}
                    />
                  </div>
                  <Link
                    to={nextLessonId ? "/lesson/$lessonId" : "/curriculum"}
                    params={nextLessonId ? { lessonId: nextLessonId } : undefined}
                    className="inline-flex items-center gap-2 bg-white text-ink px-6 py-3 rounded-2xl font-bold shadow-lg hover:scale-105 active:scale-95 transition-transform"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    {locale === "pt" ? "Continuar" : "Keep going"}
                  </Link>
                </div>
              </div>

              {/* Games teaser */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display text-lg font-bold text-ink flex items-center gap-2">
                    <Gamepad2 className="w-5 h-5 text-violet" />
                    {locale === "pt" ? "Jogos para você" : "Games for you"}
                  </h3>
                  <Link to="/games" className="text-sm font-bold text-violet hover:opacity-80">
                    {locale === "pt" ? "Ver todos" : "See all"}
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {teenGames.map((g) => (
                    <Link
                      key={g.id}
                      to="/games"
                      className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center gap-2 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <span className="text-2xl">{g.emoji}</span>
                      <span className="text-xs font-bold text-gray-700 text-center">
                        {locale === "pt" ? g.pt : g.en}
                      </span>
                      <span className="text-2xs font-semibold text-amber-500">+{g.xp} XP</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Learning Track — horizontal scroll strip */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display text-lg font-bold text-ink">
                    {locale === "pt" ? "Trilha" : "Track"}
                  </h3>
                  <Link to="/curriculum" className="text-sm font-bold text-violet hover:opacity-80">
                    {locale === "pt" ? "Ver tudo" : "View all"}
                  </Link>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                  {units.map((u) => (
                    <div
                      key={u.id}
                      className={`shrink-0 w-32 rounded-2xl overflow-hidden border relative ${
                        u.current
                          ? "ring-2 ring-violet border-violet/20"
                          : u.locked
                            ? "opacity-50 border-gray-100"
                            : "border-gray-100"
                      }`}
                    >
                      <div className="aspect-square relative">
                        {u.locked ? (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <Lock className="w-6 h-6 text-gray-300" />
                          </div>
                        ) : (
                          <>
                            <img
                              src={u.image}
                              alt={u.title}
                              loading="lazy"
                              className="w-full h-full object-cover"
                            />
                            {u.done && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                <Check className="w-6 h-6 text-white" />
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      <p className="text-2xs font-bold text-muted-foreground px-2 pt-1.5">
                        {locale === "pt" ? "UNIDADE" : "UNIT"} {u.index}
                      </p>
                      <p className="text-xs font-bold text-ink px-2 pb-2 truncate">{u.title}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Community CTA */}
              <Link
                to="/community"
                className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-violet/10 flex items-center justify-center text-violet">
                    <MessagesSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-display font-bold text-ink">
                      {locale === "pt" ? "Sala de conversa" : "Chat room"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {locale === "pt"
                        ? "Pratique com outros adolescentes"
                        : "Practice with other teens"}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300" />
              </Link>

              <AchievementsCard />
            </div>

            {/* --- Sidebar --- */}
            <aside className="space-y-6">
              <div className="bg-white/70 backdrop-blur-md border border-gray-100/80 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-ink">
                    {locale === "pt" ? "Meta Semanal" : "Weekly Goal"}
                  </h4>
                  <span className="text-xs font-bold text-violet">
                    {week.days}/{week.goalDays}
                  </span>
                </div>
                <div
                  className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden"
                  role="progressbar"
                  aria-valuenow={Math.round(week.pct * 100)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={locale === "pt" ? "Meta Semanal" : "Weekly Goal"}
                >
                  <div
                    className="h-full bg-violet rounded-full transition-all duration-700"
                    style={{ width: `${week.pct * 100}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {completedLessonCount}{" "}
                  {locale === "pt" ? "lições concluídas" : "lessons completed"} · {week.label}{" "}
                  {locale === "pt" ? "esta semana" : "this week"}
                </p>
              </div>

              <div className="bg-white/70 backdrop-blur-md border border-gray-100/80 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-ink">
                    {locale === "pt" ? "Meta Diária" : "Daily Goal"}
                  </h4>
                  <span className="text-xs font-bold text-sunset">
                    {todayXp}/{DAILY_XP_GOAL} XP
                  </span>
                </div>
                <div
                  className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden"
                  role="progressbar"
                  aria-valuenow={Math.round(todayXpPct * 100)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={locale === "pt" ? "Meta Diária" : "Daily Goal"}
                >
                  <div
                    className="h-full bg-sunset rounded-full transition-all duration-700"
                    style={{ width: `${todayXpPct * 100}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {todayXp >= DAILY_XP_GOAL
                    ? locale === "pt"
                      ? "Meta de hoje atingida! 🎉"
                      : "Today's goal reached! 🎉"
                    : locale === "pt"
                      ? `Falta${DAILY_XP_GOAL - todayXp === 1 ? "" : "m"} ${DAILY_XP_GOAL - todayXp} XP para a meta de hoje.`
                      : `${DAILY_XP_GOAL - todayXp} XP to go today.`}
                </p>
              </div>

              <LeaderboardCard />
              <ClassesCard />
              <ReminderCard reminder={reminder} locale={locale} />

              {/* Read-only subscription status — teens don't manage billing */}
              <div className="rounded-3xl border border-gray-100/80 bg-white/70 backdrop-blur-md p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <h4 className="text-sm font-bold text-ink">
                    {locale === "pt" ? "Seu acesso" : "Your access"}
                  </h4>
                </div>
                <p className="text-xs text-muted-foreground">
                  {subscription.sub?.status === "active"
                    ? locale === "pt"
                      ? "Acesso ativo pela sua conta responsável."
                      : "Active access via your guardian's account."
                    : subscription.sub?.status === "pending"
                      ? locale === "pt"
                        ? "Pagamento em verificação pelo administrador."
                        : "Payment under review by the admin."
                      : locale === "pt"
                        ? "Peça a um responsável para ativar seu plano."
                        : "Ask a guardian to activate your plan."}
                </p>
              </div>
            </aside>
          </div>
        </main>
      </div>
      <VideosMobileNav />
    </div>
  );
}
