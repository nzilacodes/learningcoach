import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api/client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Award,
  Medal,
  Trophy,
  Target,
  Calendar,
  User,
  Sparkles,
  ExternalLink,
  Crown,
  Users,
  Bell,
  BellOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocale } from "@/lib/i18n";
import { useNotification } from "@/lib/notifications/notification-provider";
import type { useStudyReminder } from "@/lib/learning";

/* -------- Next step (recommendation engine) --------
 * Section 17 of the content-architecture doc: weakest-skill-first
 * recommendation. Renders nothing (not an empty/broken card) whenever there's
 * no recommendation yet — a brand-new learner with zero attempts, or one who
 * has already cleared every published lesson at their level. */
type Recommendation = {
  lesson_id: string;
  lesson_title: string;
  skill_label: string;
  reason: "weak_skill" | "no_attempts_yet";
};

export function NextStepCard() {
  const { user } = useAuth();
  const { locale } = useLocale();
  const { data: recommendation } = useQuery({
    queryKey: ["my_recommendation"],
    enabled: !!user,
    queryFn: () => apiFetch<Recommendation | null>("/v1/me/recommendation"),
  });

  if (!recommendation) return null;

  return (
    <Card className="mb-8 rounded-3xl border-border bg-card p-6 shadow-card">
      <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {locale === "pt" ? "O seu próximo objetivo" : "Your next objective"}
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 font-display text-lg font-bold">
            <Target className="h-5 w-5 shrink-0 text-magenta" />
            <span className="truncate">{recommendation.lesson_title}</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {recommendation.reason === "weak_skill"
              ? locale === "pt"
                ? `A sua competência mais fraca agora é ${recommendation.skill_label}.`
                : `Your weakest skill right now is ${recommendation.skill_label}.`
              : locale === "pt"
                ? `Um bom ponto de partida em ${recommendation.skill_label}.`
                : `A solid starting point in ${recommendation.skill_label}.`}
          </p>
        </div>
        <Button asChild size="sm">
          <Link to="/lesson/$lessonId" params={{ lessonId: recommendation.lesson_id }}>
            {locale === "pt" ? "Continuar" : "Continue"}
          </Link>
        </Button>
      </div>
    </Card>
  );
}

/* -------- Skill mastery breakdown --------
 * Section 7: one bar per competency, not a single blended percentage. Only
 * shown once there's at least one attempt somewhere — an all-zero grid on
 * day one would just read as broken, not "not started yet". */
type SkillMastery = {
  id: string;
  code: string;
  label: string;
  attempts: number;
  avg_score: number | null;
};

export function SkillMasteryCard() {
  const { user } = useAuth();
  const { locale } = useLocale();
  const { data: mastery = [] } = useQuery({
    queryKey: ["my_skill_mastery"],
    enabled: !!user,
    queryFn: () => apiFetch<SkillMastery[]>("/v1/me/skill-mastery"),
  });

  const withAttempts = mastery.filter((m) => m.attempts > 0);
  if (withAttempts.length === 0) return null;

  return (
    <Card className="mb-8 rounded-3xl border-border bg-card p-6 shadow-card">
      <div className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {locale === "pt" ? "Desenvolver competências" : "Develop your skills"}
      </div>
      <div className="space-y-3">
        {withAttempts.map((m) => (
          <div key={m.id}>
            <div className="flex items-center justify-between text-xs font-semibold">
              <span>{m.label}</span>
              <span className="text-muted-foreground">{m.avg_score ?? 0}%</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-magenta transition-all"
                style={{ width: `${m.avg_score ?? 0}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* -------- Profile header -------- */
export function ProfileHeader() {
  const { user } = useAuth();
  const { data: rank } = useQuery({
    queryKey: ["my_rank", user?.id],
    enabled: !!user,
    queryFn: () => apiFetch<{ rank: number; total: number; xp: number } | null>("/v1/me/rank"),
  });

  const initials = (user?.fullName ?? user?.email ?? "?")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Card className="mb-8 rounded-3xl border-border bg-card p-6 shadow-card">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="relative">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.fullName ?? "avatar"}
              className="h-20 w-20 rounded-2xl object-cover ring-2 ring-magenta/40"
            />
          ) : (
            <div className="bg-gradient-sunset flex h-20 w-20 items-center justify-center rounded-2xl text-2xl font-bold text-white shadow-soft">
              {initials || <User className="h-8 w-8" />}
            </div>
          )}
          {user?.cefrLevel && (
            <span className="absolute -bottom-2 -right-2 rounded-full bg-magenta px-2 py-0.5 text-xs font-bold text-white shadow-soft">
              {user.cefrLevel}
            </span>
          )}
        </div>
        <div className="flex-1">
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Perfil
          </div>
          <h2 className="font-display text-2xl font-bold">{user?.fullName || "Aluno"}</h2>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {user?.country && <span>🌍 {user.country}</span>}
            {user?.nativeLanguage && <span>🗣️ {user.nativeLanguage}</span>}
            {rank && (
              <span className="inline-flex items-center gap-1 font-semibold text-magenta">
                <Crown className="h-3 w-3" /> #{rank.rank} / {rank.total}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

/* -------- Leaderboard -------- */
export function LeaderboardCard() {
  const { user } = useAuth();
  const { data = [], isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () =>
      apiFetch<
        Array<{
          rank: number;
          user_id: string;
          display_name: string;
          xp: number;
          streak: number;
          cefr_level: string | null;
        }>
      >("/v1/leaderboard?limit=8"),
  });

  return (
    <Card className="rounded-3xl border-border bg-card p-6 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display font-bold">Ranking</h3>
        <Trophy className="h-4 w-4 text-amber" />
      </div>
      <ol className="space-y-2">
        {isLoading && <li className="text-xs text-muted-foreground">A carregar…</li>}
        {!isLoading && data.length === 0 && (
          <li className="text-xs text-muted-foreground">Sem alunos ainda.</li>
        )}
        {data.map((row) => {
          const isMe = row.user_id === user?.id;
          const medal =
            row.rank === 1 ? "🥇" : row.rank === 2 ? "🥈" : row.rank === 3 ? "🥉" : `#${row.rank}`;
          return (
            <li
              key={row.user_id}
              className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm ${
                isMe ? "bg-magenta/10 ring-1 ring-magenta/40" : "bg-background"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-8 text-center font-bold">{medal}</span>
                <span className="font-medium">{row.display_name}</span>
                {row.cefr_level && (
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-2xs font-bold">
                    {row.cefr_level}
                  </span>
                )}
              </div>
              <span className="font-semibold tabular-nums">{row.xp.toLocaleString()} XP</span>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

/* -------- Certificates -------- */
type CertificateRow = {
  id: string;
  level: string;
  issued_at: string;
  verification_code: string;
  pdf_url: string | null;
};

export function CertificatesCard() {
  const { user } = useAuth();
  const { data = [], isLoading } = useQuery({
    queryKey: ["my_certificates", user?.id],
    enabled: !!user,
    queryFn: () => apiFetch<CertificateRow[]>("/v1/me/certificates"),
  });

  return (
    <Card className="rounded-3xl border-border bg-card p-6 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display font-bold">Certificados</h3>
        <div className="flex items-center gap-2">
          {data.length > 0 && (
            <Link
              to="/certificates"
              className="text-2xs font-semibold text-magenta hover:underline"
            >
              Ver todos
            </Link>
          )}
          <Medal className="h-4 w-4 text-magenta" />
        </div>
      </div>
      {isLoading ? (
        <p className="text-xs text-muted-foreground">A carregar…</p>
      ) : data.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Ainda sem certificados. Conclua um nível para emitir o seu primeiro.
        </p>
      ) : (
        <ul className="space-y-2">
          {data.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between rounded-xl border border-border bg-background p-3"
            >
              <div>
                <div className="text-sm font-bold">Nível {c.level}</div>
                <div className="text-2xs text-muted-foreground">
                  {new Date(c.issued_at).toLocaleDateString()} · {c.verification_code}
                </div>
              </div>
              {c.pdf_url && (
                <Button asChild size="sm" variant="outline">
                  <a href={c.pdf_url} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/* -------- Achievements -------- */
export function AchievementsCard() {
  const { user } = useAuth();
  const { data = [], isLoading } = useQuery({
    queryKey: ["my_achievements", user?.id],
    enabled: !!user,
    queryFn: () =>
      apiFetch<
        { earned_at: string; achievements: { title: string; icon: string; xp_reward: number } }[]
      >("/v1/me/achievements"),
  });

  return (
    <Card className="rounded-3xl border-border bg-card p-6 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display font-bold">Conquistas</h3>
        <Award className="h-4 w-4 text-amber" />
      </div>
      {isLoading ? (
        <p className="text-xs text-muted-foreground">A carregar…</p>
      ) : data.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Complete lições para desbloquear conquistas.
        </p>
      ) : (
        <ul className="space-y-2">
          {data.slice(0, 6).map((a, i) => (
            <li
              key={i}
              className="flex items-center gap-3 rounded-xl border border-border bg-background p-3"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber/15 text-lg">
                {a.achievements?.icon ?? "🏅"}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold">{a.achievements?.title ?? "Conquista"}</div>
                <div className="text-2xs text-muted-foreground">
                  {new Date(a.earned_at).toLocaleDateString()}
                  {a.achievements?.xp_reward ? ` · +${a.achievements.xp_reward} XP` : ""}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/* -------- Activity calendar (last 12 weeks heatmap) -------- */
export function ActivityCalendar() {
  const { user } = useAuth();
  const { data = [], isLoading } = useQuery({
    queryKey: ["activity_calendar", user?.id],
    enabled: !!user,
    queryFn: () => apiFetch<{ day: string; seconds: number }[]>("/v1/me/study-sessions?days=84"),
  });

  const map = new Map<string, number>();
  for (const d of data) map.set(d.day.slice(0, 10), d.seconds);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cells: { day: string; seconds: number }[] = [];
  for (let i = 83; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    cells.push({ day: key, seconds: map.get(key) ?? 0 });
  }
  const total = cells.reduce((a, b) => a + b.seconds, 0);
  const activeDays = cells.filter((c) => c.seconds > 0).length;

  const level = (s: number) => {
    if (s === 0) return "bg-muted";
    if (s < 300) return "bg-magenta/30";
    if (s < 900) return "bg-magenta/60";
    return "bg-magenta";
  };

  return (
    <Card className="rounded-3xl border-border bg-card p-6 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display font-bold">Calendário</h3>
        <Calendar className="h-4 w-4 text-muted-foreground" />
      </div>
      {isLoading ? (
        <div className="grid grid-flow-col grid-rows-7 gap-1">
          {Array.from({ length: 84 }).map((_, i) => (
            <div key={i} className="h-3 w-3 animate-pulse rounded-sm bg-muted" />
          ))}
        </div>
      ) : (
        <div className="grid grid-flow-col grid-rows-7 gap-1">
          {cells.map((c) => (
            <div
              key={c.day}
              title={`${c.day} · ${Math.round(c.seconds / 60)} min`}
              className={`h-3 w-3 rounded-sm ${level(c.seconds)}`}
            />
          ))}
        </div>
      )}
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>{isLoading ? "A carregar…" : `${activeDays} dias ativos · 12 semanas`}</span>
        <span>
          {isLoading ? "" : `${Math.floor(total / 3600)}h ${Math.floor((total % 3600) / 60)}m`}
        </span>
      </div>
    </Card>
  );
}

/* -------- Goals -------- */
export function GoalsCard() {
  const { user } = useAuth();

  return (
    <Card className="rounded-3xl border-border bg-card p-6 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display font-bold">Objetivos</h3>
        <Target className="h-4 w-4 text-sunset" />
      </div>
      {user?.learningGoal ? (
        <div className="rounded-xl border border-border bg-background p-3">
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Meta principal
          </div>
          <div className="mt-1 flex items-start gap-2 text-sm font-semibold">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-magenta" />
            <span>{user.learningGoal}</span>
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Defina um objetivo no seu perfil para receber recomendações personalizadas.
        </p>
      )}
      {user?.interests && user.interests.length > 0 && (
        <div className="mt-3">
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Interesses
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {user.interests.map((i: string) => (
              <span key={i} className="rounded-full bg-muted px-2 py-0.5 text-2xs font-medium">
                {i}
              </span>
            ))}
          </div>
        </div>
      )}
      <Button asChild size="sm" variant="outline" className="mt-4 w-full">
        <Link to="/onboarding">Editar objetivos</Link>
      </Button>
    </Card>
  );
}

/* -------- Classes (Turmas) -------- */
type MyClasses = {
  owned: { id: string; name: string; invite_code: string; member_count: number }[];
  joined: { id: string; name: string; owner_name: string }[];
};

/**
 * `variant="full"` (adults/teens): summary of owned + joined classes with a
 * link to /classes. `variant="readonly"` (kids): a single read-only line
 * naming the class they're in — class management is a parent/coach task.
 */
export function ClassesCard({ variant = "full" }: { variant?: "full" | "readonly" }) {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["my_classes", user?.id],
    enabled: !!user,
    queryFn: () => apiFetch<MyClasses>("/v1/me/classes"),
  });

  if (variant === "readonly") {
    // Returning null while still loading made a slow fetch look identical to
    // "not in any class" — the card just silently never appeared instead of
    // showing a loading state first.
    if (isLoading) {
      return (
        <Card className="rounded-3xl border-border bg-card p-6 shadow-card">
          <div className="mb-2 flex items-center gap-2">
            <Users className="h-4 w-4 text-violet" />
            <h3 className="font-display font-bold">Minha turma</h3>
          </div>
          <p className="text-sm text-muted-foreground">A carregar…</p>
        </Card>
      );
    }
    const joined = data?.joined ?? [];
    if (joined.length === 0) return null;
    return (
      <Card className="rounded-3xl border-border bg-card p-6 shadow-card">
        <div className="mb-2 flex items-center gap-2">
          <Users className="h-4 w-4 text-violet" />
          <h3 className="font-display font-bold">Minha turma</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Você está na turma:{" "}
          <span className="font-semibold text-foreground">{joined[0].name}</span>
        </p>
      </Card>
    );
  }

  const owned = data?.owned ?? [];
  const joined = data?.joined ?? [];
  const total = owned.length + joined.length;

  return (
    <Card className="rounded-3xl border-border bg-card p-6 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display font-bold flex items-center gap-2">
          <Users className="h-4 w-4 text-violet" />
          Turmas
        </h3>
      </div>
      {isLoading ? (
        <p className="text-xs text-muted-foreground">A carregar…</p>
      ) : total === 0 ? (
        <p className="text-xs text-muted-foreground">
          Crie uma turma para acompanhar o progresso de outros alunos, ou entre numa turma com um
          código de convite.
        </p>
      ) : (
        <ul className="space-y-1.5 text-sm">
          {owned.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between rounded-xl bg-background px-3 py-2"
            >
              <span className="font-medium">{c.name}</span>
              <span className="text-xs text-muted-foreground">
                {c.member_count} aluno{c.member_count === 1 ? "" : "s"}
              </span>
            </li>
          ))}
          {joined.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between rounded-xl bg-background px-3 py-2"
            >
              <span className="font-medium">{c.name}</span>
              <span className="text-xs text-muted-foreground">{c.owner_name}</span>
            </li>
          ))}
        </ul>
      )}
      <Button asChild size="sm" variant="outline" className="mt-4 w-full">
        <Link to="/classes">Gerir turmas</Link>
      </Button>
    </Card>
  );
}

/* -------- Study reminder (shared by adults/teens dashboards) -------- */
export function ReminderCard({
  reminder,
  locale,
}: {
  reminder: ReturnType<typeof useStudyReminder>;
  locale: "pt" | "en";
}) {
  const notify = useNotification();
  const r = reminder.data ?? { interval_minutes: 30, enabled: false };
  const options = [15, 30, 45, 60, 90];
  return (
    <div className="bg-white/70 backdrop-blur-md border border-gray-100/80 rounded-3xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-sm font-bold text-ink flex items-center gap-2">
          {r.enabled ? (
            <Bell className="w-4 h-4 text-violet" />
          ) : (
            <BellOff className="w-4 h-4 text-muted-foreground" />
          )}
          {locale === "pt" ? "Lembrete de estudo" : "Study reminder"}
        </h3>
        <button
          onClick={async () => {
            const turningOn = !r.enabled;
            // Ask for (or check) permission BEFORE persisting "enabled" — the
            // toggle used to flip to "Ativo" immediately regardless of the
            // outcome, so denying the browser prompt left the UI claiming
            // reminders were on when no notification could ever fire.
            if (turningOn && typeof Notification !== "undefined") {
              if (Notification.permission === "denied") {
                notify.warning(
                  locale === "pt"
                    ? "Notificações bloqueadas — permita-as nas definições do navegador"
                    : "Notifications blocked — allow them in your browser settings",
                );
                return;
              }
              if (Notification.permission === "default") {
                const p = await Notification.requestPermission();
                if (p !== "granted") {
                  notify.warning(
                    locale === "pt"
                      ? "Permita notificações no navegador"
                      : "Please allow notifications",
                  );
                  return;
                }
              }
            }
            reminder.save.mutate({ interval_minutes: r.interval_minutes, enabled: turningOn });
          }}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${r.enabled ? "bg-violet text-white" : "border border-gray-200 text-muted-foreground"}`}
        >
          {r.enabled ? (locale === "pt" ? "Ativo" : "On") : locale === "pt" ? "Desativado" : "Off"}
        </button>
      </div>
      <div className="flex gap-2">
        {options.map((m) => (
          <button
            key={m}
            onClick={() => reminder.save.mutate({ interval_minutes: m, enabled: r.enabled })}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
              r.interval_minutes === m
                ? "bg-violet text-white"
                : "bg-gray-100 text-muted-foreground hover:bg-gray-200"
            }`}
          >
            {m < 60 ? `${m}m` : `1h`}
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        {locale === "pt"
          ? `Notificação a cada ${r.interval_minutes} min`
          : `Notify every ${r.interval_minutes} min`}
      </p>
    </div>
  );
}
