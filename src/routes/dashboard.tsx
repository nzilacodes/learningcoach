import { createFileRoute } from "@tanstack/react-router";
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
  const { group } = useAgeGroup();
  const data = useDashboardData();

  if (group === "kids") return <KidsDashboard {...data} />;
  if (group === "teens") return <TeensDashboard {...data} />;
  return <AdultsDashboard {...data} />;
}
