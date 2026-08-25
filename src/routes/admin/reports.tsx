import { createFileRoute } from "@tanstack/react-router";
import { ReportsPanel } from "@/components/admin/reports/reports-panel";

export const Route = createFileRoute("/admin/reports")({
  component: ReportsPanel,
  head: () => ({
    meta: [{ title: "Relatórios — Admin" }, { name: "robots", content: "noindex, nofollow" }],
  }),
});
