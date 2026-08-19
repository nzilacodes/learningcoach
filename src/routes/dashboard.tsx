import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useAgeGroup } from "@/lib/use-age-group";
import { useDashboardData } from "@/lib/learning";
import { AdultsDashboard } from "@/components/dashboard/adults-dashboard";
import { TeensDashboard } from "@/components/dashboard/teens-dashboard";
import { KidsDashboard } from "@/components/dashboard/kids-dashboard";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
  head: () => ({
    meta: [
      { title: "Painel do aluno — Learning English with Coach" },
      { name: "description", content: "Seu painel de progresso, unidades e assinatura." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

// Age groups get genuinely distinct layouts (not just a color theme) — see
// components/dashboard/{adults,teens,kids}-dashboard.tsx. The data layer is
// shared through useDashboardData() so all three stay in sync automatically.
function DashboardPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const { group } = useAgeGroup();
  // Hooks above must run unconditionally on every render; the queries inside
  // useDashboardData() are already no-ops without a user (see useDashboardData),
  // so it's safe to call before the auth check below resolves.
  const data = useDashboardData();

  if (loading || !user || data.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> A carregar…
      </div>
    );
  }

  if (data.isError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-sm text-muted-foreground">
          Não foi possível carregar o seu painel. Tente novamente.
        </p>
        <button
          onClick={() => data.refetch()}
          className="inline-flex items-center justify-center rounded-xl bg-[var(--primary)] px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (group === "kids") return <KidsDashboard {...data} />;
  if (group === "teens") return <TeensDashboard {...data} />;
  return <AdultsDashboard {...data} />;
}
