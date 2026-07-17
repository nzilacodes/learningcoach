import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Flame,
  Trophy,
  Star,
  Clock,
  BookOpen,
  Mic,
  Gamepad2,
  Award,
  Lock,
  Check,
  ArrowRight,
  Target,
  Calendar,
  MessageCircle,
  Bell,
  BellOff,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  useUserStats,
  useLessonProgress,
  useWeeklyStudy,
  useStudyHeartbeat,
  useStudyReminder,
} from "@/lib/learning";
import {
  ProfileHeader,
  LeaderboardCard,
  CertificatesCard,
  AchievementsCard,
  ActivityCalendar,
  GoalsCard,
} from "@/components/dashboard/extras";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
  head: () => ({
    meta: [
      { title: "Painel do aluno — Learning English with Coach" },
      { name: "description", content: "Seu painel de progresso, unidades e assinatura." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

import unitIntroductions from "@/assets/unit-introductions.jpg";
import unitRoutine from "@/assets/unit-routine.jpg";
import unitFood from "@/assets/unit-food.jpg";
import unitTravel from "@/assets/unit-travel.jpg";
import unitWork from "@/assets/unit-work.jpg";
import unitCulture from "@/assets/unit-culture.jpg";

const UNIT_DEFS = [
  { id: "1", pt: "Apresentações", en: "Introductions", image: unitIntroductions },
  { id: "2", pt: "Rotina Diária", en: "Daily Routine", image: unitRoutine },
  { id: "3", pt: "Comida e Bebida", en: "Food & Drink", image: unitFood },
  { id: "4", pt: "Viagens", en: "Travel", image: unitTravel },
  { id: "5", pt: "Trabalho", en: "At Work", image: unitWork },
  { id: "6", pt: "Cultura", en: "Culture", image: unitCulture },
];

function DashboardPage() {
  const { locale } = useLocale();
  const { user } = useAuth();
  useStudyHeartbeat();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name,cefr_level")
        .eq("id", user!.id)
        .maybeSingle();
      return data;
    },
  });
  const { data: userStats } = useUserStats();
  const { data: progress = [] } = useLessonProgress();
  const { data: week } = useWeeklyStudy();
  const reminder = useStudyReminder();

  const { data: sub } = useQuery({
    queryKey: ["my_subscription", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("status,expires_at,starts_at,activation_code,subscription_plans(tier,billing_cycle,duration_days)")
        .eq("user_id", user!.id)
        .in("status", ["active", "pending"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data as any;
    },
  });

  const daysLeft = sub?.expires_at
    ? Math.max(0, Math.ceil((new Date(sub.expires_at).getTime() - Date.now()) / 86400000))
    : null;
  const totalDays = sub?.subscription_plans?.duration_days ?? 30;
  const pct = daysLeft != null ? Math.min(100, Math.round((daysLeft / totalDays) * 100)) : 0;
  const planLabel = sub?.subscription_plans?.billing_cycle
    ? ({ monthly: locale === "pt" ? "Mensal" : "Monthly", quarterly: locale === "pt" ? "Trimestral" : "Quarterly", semiannual: locale === "pt" ? "Semestral" : "Semiannual" } as any)[
        sub.subscription_plans.billing_cycle
      ]
    : null;

  const weekSeconds = week?.seconds ?? 0;
  const weekLabel = `${Math.floor(weekSeconds / 3600)}h ${Math.floor((weekSeconds % 3600) / 60)}m`;
  const goalDays = 5;
  const weekPct = Math.min(1, (week?.days ?? 0) / goalDays);

  const progressByUnit = new Map(progress.map((p: any) => [p.unit_id, p.progress_pct]));
  const completedCount = progress.filter((p: any) => p.progress_pct >= 100).length;
  const currentUnit = UNIT_DEFS.find((u) => {
    const pct = progressByUnit.get(u.id) ?? 0;
    return pct > 0 && pct < 100;
  }) ?? UNIT_DEFS[completedCount] ?? UNIT_DEFS[0];
  const currentPct = progressByUnit.get(currentUnit.id) ?? 0;

  const stats = [
    { icon: Flame, label: locale === "pt" ? "Sequência" : "Streak", value: String(userStats?.streak_days ?? 0), unit: locale === "pt" ? "dias" : "days", color: "text-sunset bg-sunset/10" },
    { icon: Star, label: "XP", value: (userStats?.xp ?? 0).toLocaleString(), unit: "", color: "text-amber bg-amber/10" },
    { icon: Trophy, label: locale === "pt" ? "Concluídas" : "Completed", value: String(completedCount), unit: locale === "pt" ? "unidades" : "units", color: "text-magenta bg-magenta/10" },
    { icon: Clock, label: locale === "pt" ? "Estudou" : "Studied", value: weekLabel, unit: locale === "pt" ? "semana" : "this week", color: "text-violet bg-violet/10" },
  ];

  const units = UNIT_DEFS.map((u, i) => {
    const p = progressByUnit.get(u.id) ?? 0;
    const prevDone = i === 0 || (progressByUnit.get(UNIT_DEFS[i - 1].id) ?? 0) >= 100;
    return {
      id: u.id,
      title: locale === "pt" ? u.pt : u.en,
      image: u.image,
      progress: p,
      done: p >= 100,
      locked: !prevDone && p === 0,
      current: u.id === currentUnit.id,
    };
  });

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Profile header (avatar, name, level, ranking) */}
        <ProfileHeader />

        {/* Welcome */}
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="text-sm font-semibold text-muted-foreground">
              {locale === "pt" ? "Bom dia" : "Good morning"} 👋
            </div>
            <h1 className="mt-1 font-display text-3xl font-bold md:text-4xl">
              {locale === "pt"
                ? `Vamos praticar hoje${profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}?`
                : `Ready to practice today${profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}?`}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="glass flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold">
              <div className="bg-gradient-sunset flex h-6 w-6 items-center justify-center rounded-full text-xs text-white">
                {profile?.cefr_level ?? "—"}
              </div>
              {locale === "pt" ? "Nível atual" : "Current level"}
            </div>
            <Button className="bg-gradient-sunset text-white shadow-soft hover:opacity-90">
              <MessageCircle className="mr-1.5 h-4 w-4" />
              {locale === "pt" ? "Falar com professor" : "Talk to teacher"}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div className="mt-4 font-display text-3xl font-bold">
                {s.value} <span className="text-sm font-medium text-muted-foreground">{s.unit}</span>
              </div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Extras row: Calendar, Ranking, Certificates, Achievements, Goals */}
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <ActivityCalendar />
          <LeaderboardCard />
          <GoalsCard />
          <CertificatesCard />
          <AchievementsCard />
        </div>


        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Continue + Units */}
          <div className="space-y-6">
            {/* Continue card */}
            <div className="bg-gradient-aurora shadow-glow relative overflow-hidden rounded-3xl p-8 text-white">
              <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
              <div className="text-xs font-semibold uppercase tracking-widest opacity-80">
                {locale === "pt" ? "Continuar de onde parou" : "Continue where you stopped"}
              </div>
              <h2 className="mt-2 font-display text-3xl font-bold">
                {locale === "pt" ? `Unidade ${currentUnit.id} · ${currentUnit.pt}` : `Unit ${currentUnit.id} · ${currentUnit.en}`}
              </h2>
              <div className="mt-2 text-white/85">
                {locale === "pt" ? "Continue a sua trilha personalizada" : "Continue your personalized track"}
              </div>
              <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-white/20">
                <div className="h-full rounded-full bg-white" style={{ width: `${currentPct}%` }} />
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span>{currentPct}% {locale === "pt" ? "concluído" : "complete"}</span>
                <span>~ 12 min</span>
              </div>
              <Button asChild size="lg" className="mt-6 bg-white text-violet hover:bg-white/90">
                <Link to="/lesson">
                  {locale === "pt" ? "Retomar aula" : "Resume lesson"} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Units */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-xl font-bold">
                  {locale === "pt" ? "Sua trilha B1" : "Your B1 track"}
                </h3>
                <span className="text-sm text-muted-foreground">
                  {locale === "pt" ? "80% para desbloquear" : "80% to unlock"}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {units.map((u) => (
                  <div
                    key={u.id}
                    className={`overflow-hidden rounded-2xl border transition-all ${
                      u.current
                        ? "border-magenta bg-card shadow-soft ring-2 ring-magenta/20"
                        : u.locked
                        ? "border-border bg-muted/40 opacity-70"
                        : "border-border bg-card shadow-card hover:-translate-y-0.5"
                    }`}
                  >
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <img
                        src={u.image}
                        alt={u.title}
                        loading="lazy"
                        width={800}
                        height={450}
                        className={`h-full w-full object-cover transition-transform duration-500 ${u.locked ? "grayscale" : "hover:scale-105"}`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-card/85 via-card/10 to-transparent" />
                      <div className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-sunset text-sm font-bold text-white shadow-soft">
                        {u.id}
                      </div>
                      <div className="absolute right-3 top-3">
                        {u.done ? (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white shadow-soft">
                            <Check className="h-4 w-4" />
                          </div>
                        ) : u.locked ? (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-background/80 backdrop-blur">
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          </div>
                        ) : (
                          <span className="rounded-full bg-background/85 px-2 py-0.5 text-xs font-bold text-magenta backdrop-blur">{u.progress}%</span>
                        )}
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="font-semibold">{u.title}</div>
                      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div className="bg-gradient-sunset h-full transition-all" style={{ width: `${u.progress}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div>
              <h3 className="mb-4 font-display text-xl font-bold">
                {locale === "pt" ? "Prática rápida" : "Quick practice"}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { icon: Mic, label: locale === "pt" ? "Falar" : "Speak", color: "from-sunset to-amber" },
                  { icon: BookOpen, label: locale === "pt" ? "Ler" : "Read", color: "from-amber to-magenta" },
                  { icon: Gamepad2, label: locale === "pt" ? "Jogar" : "Play", color: "from-magenta to-violet" },
                  { icon: Target, label: locale === "pt" ? "Quiz" : "Quiz", color: "from-violet to-sunset" },
                ].map((a) => (
                  <button
                    key={a.label}
                    className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 text-left shadow-card transition-all hover:-translate-y-0.5 hover:shadow-soft"
                  >
                    <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${a.color} text-white shadow-soft`}>
                      <a.icon className="h-5 w-5" />
                    </div>
                    <div className="mt-3 font-semibold">{a.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Weekly goal */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold">
                  {locale === "pt" ? "Meta semanal" : "Weekly goal"}
                </h3>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-4 flex items-center justify-center">
                <div className="relative h-32 w-32">
                  <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                    <circle cx="50" cy="50" r="42" strokeWidth="10" className="fill-none stroke-muted" />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      strokeWidth="10"
                      strokeLinecap="round"
                      className="fill-none stroke-sunset"
                      strokeDasharray={`${(weekPct * 2 * Math.PI * 42).toFixed(1)} 999`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="font-display text-2xl font-bold">{Math.round(weekPct * 100)}%</div>
                    <div className="text-xs text-muted-foreground">{week?.days ?? 0}/{goalDays} {locale === "pt" ? "dias" : "days"}</div>
                  </div>
                </div>
              </div>
              <div className="mt-3 text-center text-xs text-muted-foreground">
                {weekLabel} {locale === "pt" ? "esta semana" : "this week"}
              </div>
            </div>

            {/* Study reminder */}
            <ReminderCard reminder={reminder} locale={locale} />


            {/* Recent badges */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
              <h3 className="font-display font-bold">{locale === "pt" ? "Conquistas recentes" : "Recent achievements"}</h3>
              <div className="mt-4 space-y-3">
                {[
                  { icon: Flame, label: locale === "pt" ? "10 dias seguidos" : "10-day streak", color: "text-sunset" },
                  { icon: Award, label: locale === "pt" ? "Mestre do IPA" : "IPA master", color: "text-magenta" },
                  { icon: Trophy, label: locale === "pt" ? "500 palavras" : "500 words", color: "text-amber" },
                ].map((b) => (
                  <div key={b.label} className="flex items-center gap-3 rounded-xl border border-border bg-background p-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-muted ${b.color}`}>
                      <b.icon className="h-4 w-4" />
                    </div>
                    <div className="text-sm font-semibold">{b.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Subscription */}
            {sub?.status === "active" && daysLeft != null ? (
              <div className="bg-gradient-sunset shadow-glow rounded-3xl p-6 text-white">
                <div className="text-xs font-semibold uppercase tracking-widest opacity-80">
                  {locale === "pt" ? "Assinatura" : "Subscription"}
                </div>
                <div className="mt-1 font-display text-xl font-bold">
                  {planLabel} · {daysLeft} {locale === "pt" ? "dias restantes" : "days left"}
                </div>
                {sub.activation_code && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(sub.activation_code);
                      toast.success(locale === "pt" ? "Código copiado" : "Code copied");
                    }}
                    className="mt-2 rounded-full bg-white/15 px-2 py-1 font-mono text-xs backdrop-blur"
                  >
                    {sub.activation_code}
                  </button>
                )}
                <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                  <div className="h-full rounded-full bg-white" style={{ width: `${pct}%` }} />
                </div>
                <Button asChild size="sm" className="mt-4 bg-white text-sunset hover:bg-white/90">
                  <Link to="/pricing">{locale === "pt" ? "Renovar" : "Renew"}</Link>
                </Button>
              </div>
            ) : sub?.status === "pending" ? (
              <div className="rounded-3xl border border-amber/40 bg-amber/10 p-6">
                <div className="text-xs font-semibold uppercase tracking-widest text-amber">
                  {locale === "pt" ? "Aguardando ativação" : "Awaiting activation"}
                </div>
                <div className="mt-1 font-display text-lg font-bold">
                  {locale === "pt" ? "Pagamento em verificação" : "Payment under review"}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {locale === "pt"
                    ? "O administrador irá ativar a sua assinatura após confirmar o pagamento."
                    : "The admin will activate your subscription after confirming the payment."}
                </p>
              </div>
            ) : (
              <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
                <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {locale === "pt" ? "Sem assinatura" : "No subscription"}
                </div>
                <div className="mt-1 font-display text-lg font-bold">
                  {locale === "pt" ? "Escolha um plano" : "Choose a plan"}
                </div>
                <Button asChild size="sm" className="bg-gradient-sunset mt-4 text-white">
                  <Link to="/pricing">{locale === "pt" ? "Ver planos" : "See plans"}</Link>
                </Button>
              </div>
            )}
          </aside>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}

function ReminderCard({ reminder, locale }: { reminder: ReturnType<typeof useStudyReminder>; locale: "pt" | "en" }) {
  const r = reminder.data ?? { interval_minutes: 30, enabled: false };
  const options = [15, 30, 45, 60, 90];
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold flex items-center gap-2">
          {r.enabled ? <Bell className="h-4 w-4 text-magenta" /> : <BellOff className="h-4 w-4 text-muted-foreground" />}
          {locale === "pt" ? "Lembrete de estudo" : "Study reminder"}
        </h3>
        <button
          onClick={() => {
            reminder.save.mutate({ interval_minutes: r.interval_minutes, enabled: !r.enabled });
            if (!r.enabled && typeof Notification !== "undefined" && Notification.permission === "default") {
              Notification.requestPermission().then((p) => {
                if (p !== "granted") toast.error(locale === "pt" ? "Permita notificações no navegador" : "Please allow notifications");
              });
            }
          }}
          className={`rounded-full px-3 py-1 text-xs font-semibold ${r.enabled ? "bg-magenta text-white" : "border border-border"}`}
        >
          {r.enabled ? (locale === "pt" ? "Ativo" : "On") : (locale === "pt" ? "Desativado" : "Off")}
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {options.map((m) => (
          <button
            key={m}
            onClick={() => reminder.save.mutate({ interval_minutes: m, enabled: r.enabled })}
            className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
              r.interval_minutes === m
                ? "bg-gradient-sunset text-white"
                : "border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {m}m
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        {locale === "pt" ? `Notificação a cada ${r.interval_minutes} min` : `Notify every ${r.interval_minutes} min`}
      </p>
    </div>
  );
}
