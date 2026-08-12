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

// Exported so callers that need to invalidate this query (e.g. after passing
// a level exam) use the exact same key instead of a hand-typed guess that
// can silently drift out of sync and turn the invalidation into a no-op.
export const levelAccessQueryKey = (userId: string | undefined) => ["level_access", userId];

/** Max unlocked level + min passing score, computed server-side from the
 * user's diagnostic CEFR level and passed level_exam_attempts rows. */
function useLevelAccess() {
  const { user } = useAuth();
  return useQuery({
    queryKey: levelAccessQueryKey(user?.id),
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

// `unlocked` is null before a user has taken the placement diagnostic (see
// getMaxUnlockedLevel in the backend's exams module). A1 — the easiest level
// — should still be reachable in that state rather than locking everything,
// so this defaults to "A1" instead of treating null as "nothing unlocked".
// Matches the same `?? "A1"` fallback already used for the dashboard's
// active course in lib/learning.ts.
export function canAccessLevel(target: CefrLevel, unlocked: CefrLevel | null) {
  return cefrRank(target) <= cefrRank(unlocked ?? "A1");
}
