import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api/client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Award, Medal, Trophy, Target, Calendar, User, Sparkles, ExternalLink, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <div className="mb-8 rounded-3xl border border-border bg-card p-6 shadow-card">
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
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Perfil</div>
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
    </div>
  );
}

/* -------- Leaderboard -------- */
export function LeaderboardCard() {
  const { user } = useAuth();
  const { data = [] } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () =>
      apiFetch<
        Array<{ rank: number; user_id: string; display_name: string; xp: number; streak: number; cefr_level: string | null }>
      >("/v1/leaderboard?limit=8"),
  });

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display font-bold">Ranking</h3>
        <Trophy className="h-4 w-4 text-amber" />
      </div>
      <ol className="space-y-2">
        {data.length === 0 && <li className="text-xs text-muted-foreground">Sem alunos ainda.</li>}
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
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold">
                    {row.cefr_level}
                  </span>
                )}
              </div>
              <span className="font-semibold tabular-nums">{row.xp.toLocaleString()} XP</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* -------- Certificates -------- */
export function CertificatesCard() {
  const { user } = useAuth();
  const { data = [] } = useQuery({
    queryKey: ["my_certificates", user?.id],
    enabled: !!user,
    queryFn: () => apiFetch<any[]>("/v1/me/certificates"),
  });

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display font-bold">Certificados</h3>
        <Medal className="h-4 w-4 text-magenta" />
      </div>
      {data.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Ainda sem certificados. Conclua um nível para emitir o seu primeiro.
        </p>
      ) : (
        <ul className="space-y-2">
          {data.map((c: any) => (
            <li key={c.id} className="flex items-center justify-between rounded-xl border border-border bg-background p-3">
              <div>
                <div className="text-sm font-bold">Nível {c.level}</div>
                <div className="text-[11px] text-muted-foreground">
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
    </div>
  );
}

/* -------- Achievements -------- */
export function AchievementsCard() {
  const { user } = useAuth();
  const { data = [] } = useQuery({
    queryKey: ["my_achievements", user?.id],
    enabled: !!user,
    queryFn: () => apiFetch<{ earned_at: string; achievements: { title: string; icon: string; xp_reward: number } }[]>(
      "/v1/me/achievements",
    ),
  });

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display font-bold">Conquistas</h3>
        <Award className="h-4 w-4 text-amber" />
      </div>
      {data.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Complete lições para desbloquear conquistas.
        </p>
      ) : (
        <ul className="space-y-2">
          {data.slice(0, 6).map((a, i) => (
            <li key={i} className="flex items-center gap-3 rounded-xl border border-border bg-background p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber/15 text-lg">
                {a.achievements?.icon ?? "🏅"}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold">{a.achievements?.title ?? "Conquista"}</div>
                <div className="text-[11px] text-muted-foreground">
                  {new Date(a.earned_at).toLocaleDateString()}
                  {a.achievements?.xp_reward ? ` · +${a.achievements.xp_reward} XP` : ""}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* -------- Activity calendar (last 12 weeks heatmap) -------- */
export function ActivityCalendar() {
  const { user } = useAuth();
  const { data = [] } = useQuery({
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
    <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display font-bold">Calendário</h3>
        <Calendar className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="grid grid-flow-col grid-rows-7 gap-1">
        {cells.map((c) => (
          <div
            key={c.day}
            title={`${c.day} · ${Math.round(c.seconds / 60)} min`}
            className={`h-3 w-3 rounded-sm ${level(c.seconds)}`}
          />
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>{activeDays} dias ativos · 12 semanas</span>
        <span>{Math.floor(total / 3600)}h {Math.floor((total % 3600) / 60)}m</span>
      </div>
    </div>
  );
}

/* -------- Goals -------- */
export function GoalsCard() {
  const { user } = useAuth();

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display font-bold">Objetivos</h3>
        <Target className="h-4 w-4 text-sunset" />
      </div>
      {user?.learningGoal ? (
        <div className="rounded-xl border border-border bg-background p-3">
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Meta principal</div>
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
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Interesses</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {user.interests.map((i: string) => (
              <span key={i} className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium">
                {i}
              </span>
            ))}
          </div>
        </div>
      )}
      <Button asChild size="sm" variant="outline" className="mt-4 w-full">
        <Link to="/onboarding">Editar objetivos</Link>
      </Button>
    </div>
  );
}
