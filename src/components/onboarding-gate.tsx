import { useEffect, useRef } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { ageToRoom, useAgeTheme } from "@/lib/age-theme";

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

// The full diagnostic test lives on its own route. It doubles as a public
// marketing CTA for logged-out visitors, but for an authenticated user it's
// also reachable as the onboarding wizard's "placement" step — allow it
// through the gate in that case instead of bouncing back to /onboarding.
const PLACEMENT_PATH = "/placement";

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
    const isPlacementStep = path === PLACEMENT_PATH && status === "placement";

    // Mandatory flow: while onboarding isn't complete, force user to /onboarding.
    if (status !== "complete") {
      if (!isOnboarding && !isPublic && !isPlacementStep) {
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
