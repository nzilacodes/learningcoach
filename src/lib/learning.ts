import { apiFetch } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

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
