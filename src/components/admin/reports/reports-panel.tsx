import { useState } from "react";
import { Download } from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import { useLocale } from "@/lib/i18n";
import { useNotification } from "@/lib/notifications/notification-provider";
import { Button } from "@/components/ui/button";
import { csvDownload } from "@/components/admin/csv-download";
import { Card } from "@/components/ui/card";

export function ReportsPanel() {
  const { locale } = useLocale();
  const notify = useNotification();
  const [pending, setPending] = useState<"users" | "payments" | "diagnostics" | null>(null);

  const runExport = async (kind: "users" | "payments" | "diagnostics", path: string) => {
    setPending(kind);
    try {
      csvDownload(kind, await apiFetch<Record<string, unknown>[]>(path));
    } catch (e) {
      notify.fromError(e, { dedupeKey: "admin:export-report" });
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold text-ink">
        {locale === "pt" ? "Relatórios" : "Reports"}
      </h2>
      <Card className="rounded-2xl border-gray-100 bg-white p-6 shadow-none">
        <p className="text-sm text-muted-foreground mb-4">
          {locale === "pt"
            ? "Exportar dados em CSV para análise externa."
            : "Export data as CSV for external analysis."}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pending === "users"}
            onClick={() => runExport("users", "/v1/admin/reports/users")}
          >
            <Download className="h-3.5 w-3.5 mr-1" />{" "}
            {pending === "users"
              ? locale === "pt"
                ? "A exportar…"
                : "Exporting…"
              : locale === "pt"
                ? "Utilizadores"
                : "Users"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={pending === "payments"}
            onClick={() => runExport("payments", "/v1/admin/reports/payments")}
          >
            <Download className="h-3.5 w-3.5 mr-1" />{" "}
            {pending === "payments"
              ? locale === "pt"
                ? "A exportar…"
                : "Exporting…"
              : locale === "pt"
                ? "Pagamentos"
                : "Payments"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={pending === "diagnostics"}
            onClick={() => runExport("diagnostics", "/v1/admin/reports/diagnostics")}
          >
            <Download className="h-3.5 w-3.5 mr-1" />{" "}
            {pending === "diagnostics"
              ? locale === "pt"
                ? "A exportar…"
                : "Exporting…"
              : "Diagnósticos"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
