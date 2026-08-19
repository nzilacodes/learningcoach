import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useAgeTheme } from "@/lib/age-theme";
import { ageFromYears, type AgeGroup } from "@/lib/age-tracks";

/**
 * Determines the user's age group from their registered age (profiles.age,
 * via the session already loaded by useAuth()). Falls back to the manual
 * age-theme when there is no age set. Also keeps the visual age-theme in
 * sync with the registered age automatically.
 */
export function useAgeGroup(): {
  group: AgeGroup;
  source: "profile" | "manual";
  age: number | null;
} {
  const { user } = useAuth();
  const { theme, setTheme } = useAgeTheme();

  const age = user?.age ?? null;
  const derived: AgeGroup | null = age != null ? ageFromYears(age) : null;

  useEffect(() => {
    if (derived && derived !== theme) setTheme(derived);
  }, [derived, theme, setTheme]);

  return {
    group: derived ?? theme,
    source: derived ? "profile" : "manual",
    age,
  };
}
