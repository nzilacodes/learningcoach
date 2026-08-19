import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { apiFetch, ApiError } from "@/lib/api/client";

type Role = "admin" | "user";

export type AuthUser = {
  id: string;
  email: string;
  roles: Role[];
  fullName: string | null;
  age: number | null;
  onboardingStatus: string | null;
  cefrLevel: string | null;
  country: string | null;
  nativeLanguage: string | null;
  learningGoal: string | null;
  interests: string[] | null;
  avatarUrl: string | null;
  demoCompleted: boolean | null;
  selectedPlan: string | null;
};

interface AuthCtx {
  user: AuthUser | null;
  roles: Role[];
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  /** Re-fetches the current session from the backend — call after login/signup/profile changes. */
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  user: null,
  roles: [],
  isAdmin: false,
  loading: true,
  signOut: async () => {},
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const inFlight = useRef<Promise<void> | null>(null);

  const refresh = useCallback(() => {
    // De-duplicate concurrent refresh() calls (e.g. an onboarding step's
    // onDone() firing around the same time as another consumer's refresh) so
    // an older response can't resolve after a newer one and clobber state.
    if (inFlight.current) return inFlight.current;

    const promise = (async () => {
      try {
        const me = await apiFetch<AuthUser>("/v1/me");
        setUser(me);
      } catch (err) {
        // Only a real 401 (session invalid/expired, already retried once via
        // refreshSession() inside apiFetch) means "not logged in". A network
        // hiccup or 5xx shouldn't silently sign out a user who was already
        // authenticated.
        if (err instanceof ApiError && err.status === 401) {
          setUser(null);
        } else {
          console.error("[auth] failed to refresh session", err);
        }
      }
    })();

    inFlight.current = promise.finally(() => {
      inFlight.current = null;
    });
    return inFlight.current;
  }, []);

  useEffect(() => {
    void (async () => {
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  const signOut = async () => {
    try {
      await apiFetch("/v1/auth/logout", { method: "POST" });
    } catch {
      // best-effort — clear local state regardless
    }
    setUser(null);
  };

  const roles = user?.roles ?? [];
  const isAdmin = roles.includes("admin");

  return (
    <Ctx.Provider value={{ user, roles, isAdmin, loading, signOut, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
