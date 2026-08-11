import { apiFetch } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";
import { useMaxUnlockedLevel } from "@/lib/level-access";
import unitIntroductions from "@/assets/unit-introductions.jpg";
import unitRoutine from "@/assets/unit-routine.jpg";
import unitFood from "@/assets/unit-food.jpg";
import unitTravel from "@/assets/unit-travel.jpg";
import unitWork from "@/assets/unit-work.jpg";
import unitCulture from "@/assets/unit-culture.jpg";

// ---------- CURRICULUM (courses/units/lessons) ----------
export type CourseRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  level: string;
  order_index: number;
};
export type UnitRow = {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  theme: string | null;
  order_index: number;
};
export type LessonRow = {
  id: string;
  unit_id: string;
  slug: string;
  title: string;
  summary: string | null;
  duration_min: number | null;
  xp_reward: number | null;
  order_index: number;
  lesson_type: string;
};

// ---------- SUBSCRIPTION (used by useDashboardData) ----------
export type SubscriptionRow = {
  status: string;
  expires_at: string | null;
  activation_code: string | null;
  subscription_plans: { duration_days: number; billing_cycle: string } | null;
};

export function useCurriculum() {
  return useQuery({
    queryKey: ["curriculum"],
    queryFn: () =>
      apiFetch<{ courses: CourseRow[]; units: UnitRow[]; lessons: LessonRow[] }>("/v1/courses"),
    staleTime: 60_000,
  });
}

// ---------- USER STATS ----------
export function useUserStats() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user_stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const data = await apiFetch<{
        streakDays: number;
        lastActivityDate: string | null;
        xp: number;
      }>("/v1/me/study-stats");
      return {
        xp: data.xp,
        streak_days: data.streakDays,
        last_activity_date: data.lastActivityDate,
      };
    },
  });
}

// ---------- LESSON PROGRESS ----------
export function useLessonProgress() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["lesson_progress", user?.id],
    enabled: !!user,
    queryFn: () =>
      apiFetch<
        { unit_id: string; lesson_id: string; progress_pct: number; completed_at: string | null }[]
      >("/v1/me/progress"),
  });
}

// ---------- STUDY SESSIONS ----------
export function useWeeklyStudy() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["study_week", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const data = await apiFetch<{ day: string; seconds: number }[]>(
        "/v1/me/study-sessions?days=7",
      );
      const seconds = data.reduce((a, b) => a + b.seconds, 0);
      const days = new Set(data.map((d) => d.day)).size;
      return { seconds, days };
    },
  });
}

/** Tracks time spent on a page and flushes to the backend every 30s. */
export function useStudyHeartbeat() {
  const { user } = useAuth();
  const acc = useRef(0);
  const lastTick = useRef(Date.now());

  useEffect(() => {
    if (!user) return;
    const tick = () => {
      const now = Date.now();
      if (document.visibilityState === "visible") {
        acc.current += Math.min(60, Math.floor((now - lastTick.current) / 1000));
      }
      lastTick.current = now;
    };
    const flush = async () => {
      tick();
      const s = acc.current;
      if (s < 5) return;
      acc.current = 0;
      await apiFetch("/v1/me/study-time", {
        method: "POST",
        body: JSON.stringify({ seconds: s }),
      }).catch(() => {});
    };
    const iv = setInterval(flush, 30_000);
    window.addEventListener("beforeunload", flush);
    return () => {
      clearInterval(iv);
      window.removeEventListener("beforeunload", flush);
      flush();
    };
  }, [user]);
}

// ---------- STUDY REMINDERS ----------
export function useStudyReminder() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["study_reminder", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const data = await apiFetch<{ intervalMinutes: number; enabled: boolean }>(
        "/v1/me/study-reminder",
      );
      return { interval_minutes: data.intervalMinutes, enabled: data.enabled };
    },
  });

  const save = useMutation({
    mutationFn: async (input: { interval_minutes: number; enabled: boolean }) => {
      await apiFetch("/v1/me/study-reminder", {
        method: "PUT",
        body: JSON.stringify({ intervalMinutes: input.interval_minutes, enabled: input.enabled }),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["study_reminder", user?.id] }),
  });

  // Browser notification scheduler
  useEffect(() => {
    const r = query.data;
    if (!r?.enabled) return;
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "default") Notification.requestPermission();
    const iv = setInterval(() => {
      if (Notification.permission === "granted") {
        new Notification("Learning English with Coach", {
          body: "Time to practice your English! 🌟",
        });
      }
    }, r.interval_minutes * 60_000);
    return () => clearInterval(iv);
  }, [query.data?.enabled, query.data?.interval_minutes]);

  return { ...query, save };
}

// ---------- DASHBOARD (shared data layer for all age-group dashboards) ----------
// Decorative art for the first units of the active level — the backend has no
// per-unit imagery, so these are matched positionally, same idea as before.
const UNIT_IMAGES = [unitIntroductions, unitRoutine, unitFood, unitTravel, unitWork, unitCulture];

export type DashboardUnit = {
  id: string;
  index: number;
  title: string;
  image: string;
  progress: number;
  done: boolean;
  locked: boolean;
  current: boolean;
};

/**
 * Consolidates everything the three age-group dashboards need: stats,
 * progress, weekly study, reminder settings, subscription and the computed
 * unit/lesson track. Presentation (labels, icons, layout) stays in each
 * `*-dashboard.tsx` component — this hook only computes shared data.
 */
export function useDashboardData() {
  const { user } = useAuth();
  useStudyHeartbeat();

  const { data: userStats } = useUserStats();
  const { data: progress = [] } = useLessonProgress();
  const { data: week } = useWeeklyStudy();
  const reminder = useStudyReminder();
  const { data: unlockedLevel } = useMaxUnlockedLevel();
  const { data: curriculum } = useCurriculum();

  const { data: sub } = useQuery({
    queryKey: ["my_subscription", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const subs = await apiFetch<SubscriptionRow[]>("/v1/me/subscriptions");
      return subs.find((s) => s.status === "active" || s.status === "pending") ?? null;
    },
  });

  const daysLeft = sub?.expires_at
    ? Math.max(0, Math.ceil((new Date(sub.expires_at).getTime() - Date.now()) / 86400000))
    : null;
  const totalDays = sub?.subscription_plans?.duration_days ?? 30;
  const subscriptionPct =
    daysLeft != null ? Math.min(100, Math.round((daysLeft / totalDays) * 100)) : 0;
  const billingCycle: string | null = sub?.subscription_plans?.billing_cycle ?? null;

  const weekSeconds = week?.seconds ?? 0;
  const weekLabel = `${Math.floor(weekSeconds / 3600)}h ${Math.floor((weekSeconds % 3600) / 60)}m`;
  const goalDays = 5;
  const weekDays = week?.days ?? 0;
  const weekPct = Math.min(1, weekDays / goalDays);

  const activeCourse = curriculum?.courses.find((c) => c.level === (unlockedLevel ?? "A1"));
  const previewUnits = useMemo(() => {
    if (!activeCourse || !curriculum) return [];
    return curriculum.units
      .filter((u) => u.course_id === activeCourse.id)
      .sort((a, b) => a.order_index - b.order_index)
      .slice(0, UNIT_IMAGES.length);
  }, [activeCourse, curriculum]);
  const lessonsByUnit = useMemo(() => {
    const m = new Map<string, LessonRow[]>();
    (curriculum?.lessons ?? [])
      .slice()
      .sort((a, b) => a.order_index - b.order_index)
      .forEach((l) => {
        const arr = m.get(l.unit_id) ?? [];
        arr.push(l);
        m.set(l.unit_id, arr);
      });
    return m;
  }, [curriculum]);
  const doneLessonIds = useMemo(
    () =>
      new Set(
        progress.filter((p) => p.completed_at || p.progress_pct >= 100).map((p) => p.lesson_id),
      ),
    [progress],
  );

  const baseUnits: DashboardUnit[] = previewUnits.map((u, i) => {
    const lessons = lessonsByUnit.get(u.id) ?? [];
    const total = lessons.length;
    const done = lessons.filter((l) => doneLessonIds.has(l.id)).length;
    const p = total ? Math.round((done / total) * 100) : 0;
    const prevLessons = i === 0 ? [] : (lessonsByUnit.get(previewUnits[i - 1].id) ?? []);
    // .every() on an empty array is vacuously true — a predecessor unit with
    // no published lessons yet shouldn't permanently lock everything after it.
    const prevDone = i === 0 || prevLessons.every((l) => doneLessonIds.has(l.id));
    return {
      id: u.id,
      index: i + 1,
      title: u.title,
      image: UNIT_IMAGES[i],
      progress: p,
      done: p >= 100 && total > 0,
      locked: !prevDone && p === 0,
      current: false,
    };
  });
  // Exactly one "current" unit: the first unlocked one that isn't finished yet
  // (falls back to the last unit once everything in the preview is done).
  const currentIndex = baseUnits.findIndex((u) => !u.done && !u.locked);
  const units: DashboardUnit[] = baseUnits.map((u, i) => ({
    ...u,
    current: currentIndex === -1 ? i === baseUnits.length - 1 : i === currentIndex,
  }));
  const currentUnit: DashboardUnit = units[
    currentIndex === -1 ? units.length - 1 : currentIndex
  ] ?? {
    id: "",
    index: 1,
    title: "",
    image: UNIT_IMAGES[0],
    progress: 0,
    done: false,
    locked: false,
    current: true,
  };
  const currentPct = currentUnit.progress;
  const completedLessonCount = doneLessonIds.size;
  const currentUnitLessons = currentUnit.id ? (lessonsByUnit.get(currentUnit.id) ?? []) : [];
  const nextLessonId = (
    currentUnitLessons.find((l) => !doneLessonIds.has(l.id)) ?? currentUnitLessons[0]
  )?.id;

  return {
    user,
    userStats,
    progress,
    week: { seconds: weekSeconds, label: weekLabel, days: weekDays, goalDays, pct: weekPct },
    reminder,
    subscription: { sub, daysLeft, totalDays, pct: subscriptionPct, billingCycle },
    units,
    currentUnit,
    currentPct,
    completedLessonCount,
    nextLessonId,
    firstName: user?.fullName?.split(" ")[0] ?? null,
  };
}

export type DashboardData = ReturnType<typeof useDashboardData>;
