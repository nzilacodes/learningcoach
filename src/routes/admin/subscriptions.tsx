import { createFileRoute } from "@tanstack/react-router";
import { SubscriptionsPanel } from "@/components/admin/subscriptions/subscriptions-panel";

export const Route = createFileRoute("/admin/subscriptions")({
  component: SubscriptionsPanel,
  head: () => ({
    meta: [{ title: "Assinaturas — Admin" }, { name: "robots", content: "noindex, nofollow" }],
  }),
});
