import { useEffect, useRef } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useAgeTheme } from "@/lib/age-theme";

// Routes that are always accessible (no login required for content).
const PUBLIC_PATHS = new Set([
  "/",
  "/auth",
  "/reset-password",
  "/pricing",
  "/cefr-levels",
  "/about",
  "/contact",
]);

// Route where the mandatory onboarding wizard lives.
const ONBOARDING_PATH = "/onboarding";

function ageToRoom(age: number): "kids" | "teens" | "adults" {
  if (age < 13) return "kids";
  if (age < 18) return "teens";
  return "adults";
}

export function OnboardingGate() {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { setTheme } = useAgeTheme();
  const themeInitialized = useRef(false);

  useEffect(() => {
    if (loading || !user) return;

    // Admin bypasses onboarding entirely.
    if (isAdmin) return;

    const status = user.onboardingStatus ?? "profile";
    const isPublic = PUBLIC_PATHS.has(path);
    const isOnboarding = path === ONBOARDING_PATH;

    // Mandatory flow: while onboarding isn't complete, force user to /onboarding.
    if (status !== "complete") {
      if (!isOnboarding && !isPublic) {
        navigate({ to: ONBOARDING_PATH });
      }
      return;
    }

    // Onboarding complete: block returning to /onboarding.
    if (isOnboarding) {
      navigate({ to: "/dashboard" });
      return;
    }

    // Apply age theme once.
    if (user.age != null && !themeInitialized.current) {
      setTheme(ageToRoom(user.age));
      themeInitialized.current = true;
    }
  }, [loading, user, path, navigate, setTheme, isAdmin]);

  return null;
}
