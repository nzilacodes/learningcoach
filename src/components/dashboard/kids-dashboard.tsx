import { Link } from "@tanstack/react-router";
import { Flame, Star, Lock, Check, Play, LogOut, PartyPopper } from "lucide-react";
import { VideosSidebar, VideosMobileNav } from "@/components/videos/videos-sidebar";
import { useLocale } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { AGE_TRACKS } from "@/lib/age-tracks";
import type { DashboardData } from "@/lib/learning";
import { AchievementsCard, ClassesCard } from "@/components/dashboard/extras";

/** Kids layout: one big CTA, giant streak/XP badges, a simple vertical path
 * instead of a dense grid, and no subscription/reminder controls — those are
 * a parent's job, not a 6–12 year old's. */
export function KidsDashboard(data: DashboardData) {
  const { locale } = useLocale();
  const { signOut } = useAuth();
  const track = AGE_TRACKS.kids;
  const { units, currentUnit, currentPct, nextLessonId } = data;
  const displayName = data.firstName ?? (locale === "pt" ? "Amigo" : "Friend");

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      <VideosSidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-panel-bg">
        {/* ====== TopBar ====== */}
        <header className="h-16 flex items-center justify-between px-4 md:px-6 bg-white/90 backdrop-blur-xl border-b border-amber-100 shrink-0 z-10">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌟</span>
            <h1 className="font-display text-lg font-bold text-[var(--ink)] truncate">
              {locale === "pt" ? `Oi, ${displayName}!` : `Hi, ${displayName}!`}
            </h1>
          </div>
          <button
            onClick={() => signOut()}
            aria-label={locale === "pt" ? "Sair da conta" : "Sign out"}
            className="p-2 text-muted-foreground hover:bg-gray-50 rounded-full transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto pb-24 scrollbar-hide">
          <div className="max-w-2xl mx-auto px-4 md:px-6 py-6 space-y-6">
            {/* Big streak/XP badges */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-orange-400 to-amber-400 rounded-3xl p-5 text-white shadow-lg flex flex-col items-center">
                <Flame className="w-9 h-9 mb-1" fill="currentColor" />
                <span className="font-display text-3xl font-bold">
                  {data.userStats?.streak_days ?? 0}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-white/80">
                  {locale === "pt" ? "dias seguidos" : "day streak"}
                </span>
              </div>
              <div className="bg-gradient-to-br from-violet-400 to-fuchsia-400 rounded-3xl p-5 text-white shadow-lg flex flex-col items-center">
                <Star className="w-9 h-9 mb-1" fill="currentColor" />
                <span className="font-display text-3xl font-bold">
                  {(data.userStats?.xp ?? 0).toLocaleString()}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-white/80">XP</span>
              </div>
            </div>

            {/* Hero: one big CTA */}
            <div
              className={`bg-gradient-to-br ${track.color} rounded-4xl p-6 text-white text-center shadow-xl relative overflow-hidden`}
            >
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 blur-3xl rounded-full" />
              <div className="relative z-10">
                <img
                  src={currentUnit.image}
                  alt=""
                  className="w-24 h-24 mx-auto rounded-3xl object-cover shadow-lg mb-4 border-4 border-white/40"
                  loading="lazy"
                />
                <h2 className="font-display text-2xl font-bold mb-1">{currentUnit.title}</h2>
                <p className="text-white/80 text-sm mb-5">
                  {locale === "pt" ? "Vamos aprender juntos!" : "Let's learn together!"}
                </p>
                <div className="w-full bg-white/20 h-3 rounded-full mb-5 overflow-hidden max-w-xs mx-auto">
                  <div
                    className="bg-white h-full rounded-full"
                    style={{ width: `${Math.max(8, currentPct)}%` }}
                  />
                </div>
                <Link
                  to={nextLessonId ? "/lesson/$lessonId" : "/curriculum"}
                  params={nextLessonId ? { lessonId: nextLessonId } : undefined}
                  className="inline-flex items-center gap-2 bg-white text-[var(--ink)] px-10 py-4 rounded-full font-bold text-lg shadow-lg hover:scale-105 active:scale-95 transition-transform"
                >
                  <Play className="w-5 h-5 fill-current" />
                  {locale === "pt" ? "Jogar!" : "Play!"}
                </Link>
              </div>
            </div>

            {/* Simple path */}
            <div>
              <h3 className="font-display text-lg font-bold text-[var(--ink)] mb-3 text-center">
                {locale === "pt" ? "Meu caminho" : "My path"}
              </h3>
              <div className="flex flex-col items-center gap-3">
                {units.map((u, i) => (
                  <div key={u.id} className="flex flex-col items-center">
                    {(() => {
                      const nodeClass = `w-16 h-16 rounded-full flex items-center justify-center border-4 shadow-md transition-transform ${
                        u.locked
                          ? "bg-gray-100 border-gray-200"
                          : u.done
                            ? "bg-emerald-400 border-emerald-200"
                            : u.current
                              ? "bg-white border-amber-300 scale-110"
                              : "bg-white border-gray-100"
                      }`;
                      const content = u.locked ? (
                        <Lock className="w-6 h-6 text-gray-300" />
                      ) : u.done ? (
                        <Check className="w-7 h-7 text-white" />
                      ) : (
                        <span className="text-2xl">{track.images[i % track.images.length]}</span>
                      );
                      return u.locked ? (
                        <div className={nodeClass}>{content}</div>
                      ) : (
                        <Link to="/curriculum" className={nodeClass}>
                          {content}
                        </Link>
                      );
                    })()}
                    <span className="mt-1 text-2xs font-bold text-muted-foreground">{u.title}</span>
                    {i < units.length - 1 && (
                      <div className="h-4 w-1 bg-amber-200 rounded-full my-1" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Achievements — prominent */}
            <div className="flex items-center gap-2 justify-center text-[var(--ink)]">
              <PartyPopper className="w-5 h-5 text-amber-500" />
              <h3 className="font-display text-lg font-bold">
                {locale === "pt" ? "Minhas Conquistas" : "My Achievements"}
              </h3>
            </div>
            <AchievementsCard />

            <ClassesCard variant="readonly" />
          </div>
        </main>
      </div>
      <VideosMobileNav />
    </div>
  );
}
