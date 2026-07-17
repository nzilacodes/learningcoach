import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useAgeTheme } from "@/lib/age-theme";
import { ageFromYears, type AgeGroup } from "@/lib/age-tracks";

/**
 * Determines the user's age group from their registered age (profiles.age).
 * Falls back to the manual age-theme when there is no profile / no age set.
 * Also keeps the visual age-theme in sync with the registered age automatically.
 */
export function useAgeGroup(): { group: AgeGroup; source: "profile" | "manual"; age: number | null } {
  const { user } = useAuth();
  const { theme, setTheme } = useAgeTheme();

  const { data: age } = useQuery({
    queryKey: ["profile_age", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("age").eq("id", user!.id).maybeSingle();
      return (data?.age ?? null) as number | null;
    },
    staleTime: 60_000,
  });

  const derived: AgeGroup | null = age != null ? ageFromYears(age) : null;

  useEffect(() => {
    if (derived && derived !== theme) setTheme(derived);
  }, [derived, theme, setTheme]);

  return {
    group: derived ?? theme,
    source: derived ? "profile" : "manual",
    age: age ?? null,
  };
}
