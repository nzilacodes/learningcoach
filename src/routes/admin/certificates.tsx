import { createFileRoute } from "@tanstack/react-router";
import { CertificatesPanel } from "@/components/admin/certificates/certificates-panel";

export const Route = createFileRoute("/admin/certificates")({
  component: CertificatesPanel,
  head: () => ({
    meta: [{ title: "Certificados — Admin" }, { name: "robots", content: "noindex, nofollow" }],
  }),
});
