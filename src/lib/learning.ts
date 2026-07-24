import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

// ---------- USER STATS ----------
export function useUserStats() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user_stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("user_stats")
        .select("xp,streak_days,last_activity_date")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data ?? { xp: 0, streak_days: 0, last_activity_date: null };
    },
  });
}

// ---------- LESSON PROGRESS ----------
export function useLessonProgress() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["lesson_progress", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("lesson_progress")
        .select("unit_id,lesson_id,progress_pct,completed_at")
        .eq("user_id", user!.id);
      return data ?? [];
    },
  });
}

// ---------- STUDY SESSIONS ----------
export function useWeeklyStudy() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["study_week", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const since = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
      const { data } = await supabase
        .from("study_sessions")
        .select("day,seconds")
        .eq("user_id", user!.id)
        .gte("day", since);
      const seconds = (data ?? []).reduce((a, b) => a + b.seconds, 0);
      const days = new Set((data ?? []).map((d) => d.day)).size;
      return { seconds, days };
    },
  });
}

/** Tracks time spent on a page and flushes to DB every 30s. */
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
      const today = new Date().toISOString().slice(0, 10);
      const { data: cur } = await supabase
        .from("study_sessions")
        .select("seconds")
        .eq("user_id", user.id)
        .eq("day", today)
        .maybeSingle();
      await supabase
        .from("study_sessions")
        .upsert(
          { user_id: user.id, day: today, seconds: (cur?.seconds ?? 0) + s },
          { onConflict: "user_id,day" },
        );
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
      const { data } = await supabase
        .from("study_reminders")
        .select("interval_minutes,enabled")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data ?? { interval_minutes: 30, enabled: false };
    },
  });

  const save = useMutation({
    mutationFn: async (input: { interval_minutes: number; enabled: boolean }) => {
      if (!user) return;
      const { error } = await supabase
        .from("study_reminders")
        .upsert({ user_id: user.id, ...input });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["study_reminder", user?.id] }),
  });

  // Browser notification scheduler
  useEffect(() => {
    const r = query.data;
    if (!r?.enabled) return;
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "default") Notification.requestPermission();
    const iv = setInterval(
      () => {
        if (Notification.permission === "granted") {
          new Notification("Learning English with Coach", {
            body: "Time to practice your English! 🌟",
          });
        }
      },
      r.interval_minutes * 60_000,
    );
    return () => clearInterval(iv);
  }, [query.data?.enabled, query.data?.interval_minutes]);

  return { ...query, save };
}
