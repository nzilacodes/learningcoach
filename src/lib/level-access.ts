import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";

export const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export type CefrLevel = (typeof CEFR_LEVELS)[number];

export const cefrRank = (l: CefrLevel | string | null | undefined): number => {
  const i = CEFR_LEVELS.indexOf((l ?? "") as CefrLevel);
  return i < 0 ? 0 : i + 1;
};

/** Max level the current user has unlocked. Base = diagnostic CEFR, +1 per passed level exam. */
export function useMaxUnlockedLevel() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["max_unlocked_level", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("my_max_unlocked_level");
      if (error) throw error;
      return (data as CefrLevel | null) ?? null;
    },
  });
}

export function useMinExamScore() {
  return useQuery({
    queryKey: ["app_settings_min_score"],
    queryFn: async () => {
      const { data } = await supabase.from("app_settings").select("min_exam_score").maybeSingle();
      return data?.min_exam_score ?? 70;
    },
    staleTime: 60_000,
  });
}

export function useLevelExam(level: CefrLevel) {
  return useQuery({
    queryKey: ["level_exam", level],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("level_exams")
        .select("level,title,questions")
        .eq("level", level)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useLevelAttempts(level?: CefrLevel) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["level_attempts", user?.id, level ?? "all"],
    enabled: !!user,
    queryFn: async () => {
      let q = supabase
        .from("level_exam_attempts")
        .select("level,score,passed,created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (level) q = q.eq("level", level);
      const { data } = await q;
      return data ?? [];
    },
  });
}

export function canAccessLevel(target: CefrLevel, unlocked: CefrLevel | null) {
  if (!unlocked) return false;
  return cefrRank(target) <= cefrRank(unlocked);
}
