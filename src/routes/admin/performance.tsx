import { createFileRoute } from "@tanstack/react-router";
import { PerformancePanel } from "@/components/admin/performance/performance-panel";

export const Route = createFileRoute("/admin/performance")({
  component: PerformancePanel,
  head: () => ({
    meta: [{ title: "Desempenho — Admin" }, { name: "robots", content: "noindex, nofollow" }],
  }),
});
