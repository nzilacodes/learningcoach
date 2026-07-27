import { supabase } from "@/integrations/supabase/client";
import { apiFetch } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";

export const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export type CefrLevel = (typeof CEFR_LEVELS)[number];

export const cefrRank = (l: CefrLevel | string | null | undefined): number => {
  const i = CEFR_LEVELS.indexOf((l ?? "") as CefrLevel);
  return i < 0 ? 0 : i + 1;
};

type LevelAccess = { maxUnlockedLevel: CefrLevel | null; minExamScore: number };

/** Max unlocked level + min passing score, computed server-side from the
 * user's diagnostic CEFR level and passed level_exam_attempts rows. */
function useLevelAccess() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["level_access", user?.id],
    enabled: !!user,
    queryFn: () => apiFetch<LevelAccess>("/v1/me/level-access"),
  });
}

export function useMaxUnlockedLevel() {
  const { data, ...rest } = useLevelAccess();
  return { ...rest, data: data?.maxUnlockedLevel ?? null };
}

export function useMinExamScore() {
  const { data, ...rest } = useLevelAccess();
  return { ...rest, data: data?.minExamScore ?? 70 };
}

export function useLevelExam(level: CefrLevel) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["level_exam", level, user?.id],
    enabled: !!user,
    // Questions come back without the answer key — grading happens server-side.
    queryFn: () => apiFetch<{ level: CefrLevel; title: string; questions: { q: string; opts: string[] }[] }>(
      `/v1/level-exams/${level}`,
    ),
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
