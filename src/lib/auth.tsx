import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { apiFetch } from "@/lib/api/client";

type Role = "admin" | "user";

export type AuthUser = {
  id: string;
  email: string;
  roles: Role[];
  fullName: string | null;
  age: number | null;
  onboardingStatus: string | null;
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

  const refresh = useCallback(async () => {
    try {
      const me = await apiFetch<AuthUser>("/v1/me");
      setUser(me);
    } catch {
      setUser(null);
    }
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
