import { apiFetch } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export type HeartsState = {
  hearts: number | null;
  maxHearts: number | null;
  unlimited: boolean;
  nextRegenAt: string | null;
  regenMinutes: number;
};

export function useHearts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["hearts", user?.id],
    enabled: !!user,
    queryFn: () => apiFetch<HeartsState>("/v1/me/hearts"),
    // Short staleTime: hearts change from lesson submissions elsewhere in the
    // app (invalidated explicitly there) and regenerate over time in the
    // background — a refetch every 15s keeps the header indicator's
    // "next heart in Xm" countdown honest without hammering the endpoint.
    staleTime: 15_000,
    refetchInterval: 60_000,
  });
}

export function useInvalidateHearts() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["hearts"] });
}
