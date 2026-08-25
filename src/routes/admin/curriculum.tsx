import { createFileRoute } from "@tanstack/react-router";
import { CurriculumPanel } from "@/components/admin/curriculum/curriculum-panel";

export const Route = createFileRoute("/admin/curriculum")({
  component: CurriculumPanel,
  head: () => ({
    meta: [{ title: "Currículo — Admin" }, { name: "robots", content: "noindex, nofollow" }],
  }),
});
