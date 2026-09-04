import { useEffect, useState } from "react";
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

  // useAuth()'s session resolves asynchronously on the client, so `user` (and
  // therefore `age`) legitimately differs between the server-rendered HTML
  // and the client's very first render — using it unconditionally threw a
  // hydration mismatch (LEARNINGCOACHFRONTEND-1: server "Adultos", client
  // "Crianças"). Same fix AgeThemeProvider already applies to its own
  // localStorage read: stay on the shared default (`theme`) through the
  // first client render, and only switch to the profile-derived group in an
  // effect, once mounted — a normal post-hydration update, not a mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const age = mounted ? (user?.age ?? null) : null;
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
