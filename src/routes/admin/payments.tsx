import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, XCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useLocale } from "@/lib/i18n";
import { apiFetch } from "@/lib/api/client";
import { useNotification } from "@/lib/notifications/notification-provider";
import { Button } from "@/components/ui/button";
import { AdminDataTable, type AdminDataTableColumn } from "@/components/admin/admin-data-table";

export const Route = createFileRoute("/admin/payments")({
  component: AdminPaymentsPage,
  head: () => ({
    meta: [{ title: "Pagamentos — Admin" }, { name: "robots", content: "noindex, nofollow" }],
  }),
});

type AdminPayment = {
  id: string;
  amount_kz: number;
  reference: string;
  status: string;
  profiles?: { full_name: string | null; email: string | null } | null;
  subscription_plans?: { tier: string; billing_cycle: string } | null;
  subscriptions?: { activation_code: string | null; expires_at: string | null } | null;
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber/20 text-amber-700",
    paid: "bg-emerald-500/20 text-emerald-700",
    cancelled: "bg-muted text-muted-foreground",
    expired: "bg-destructive/20 text-destructive",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${map[status] ?? ""}`}>
      {status}
    </span>
  );
}

function AdminPaymentsPage() {
  const { locale } = useLocale();
  const notify = useNotification();
  const { user, isAdmin } = useAuth();
  const qc = useQueryClient();

  const { data: payments = [] } = useQuery({
    queryKey: ["admin_payments"],
    enabled: !!user && isAdmin,
    queryFn: async () =>
      (await apiFetch<{ items: AdminPayment[] }>("/v1/admin/payments?limit=100")).items,
  });

  const activate = useMutation({
    mutationFn: (payment: AdminPayment) =>
      apiFetch<{ activationCode: string | null }>(`/v1/admin/payments/${payment.id}/activate`, {
        method: "POST",
      }),
    onSuccess: ({ activationCode }) => {
      if (activationCode) {
        navigator.clipboard?.writeText(activationCode).catch(() => {});
        notify.success(
          locale === "pt"
            ? `Ativada. Código: ${activationCode} (copiado)`
            : `Activated. Code: ${activationCode} (copied)`,
          { duration: 8000 },
        );
      } else {
        notify.success(locale === "pt" ? "Pagamento ativado" : "Payment activated");
      }
      qc.invalidateQueries({ queryKey: ["admin_payments"] });
      qc.invalidateQueries({ queryKey: ["admin_stats"] });
      // Activating a payment also activates its linked subscription
      // server-side — without this, the subscriptions window kept showing
      // the pre-activation state until an unrelated refetch.
      qc.invalidateQueries({ queryKey: ["admin_subscriptions"] });
    },
    onError: (e) => notify.fromError(e, { dedupeKey: "admin:activate-payment" }),
  });

  const cancel = useMutation({
    mutationFn: (payment: AdminPayment) =>
      apiFetch(`/v1/admin/payments/${payment.id}/cancel`, { method: "POST" }),
    onSuccess: () => {
      notify.success(locale === "pt" ? "Pagamento cancelado" : "Payment cancelled");
      qc.invalidateQueries({ queryKey: ["admin_payments"] });
      qc.invalidateQueries({ queryKey: ["admin_stats"] });
    },
    onError: (e) => notify.fromError(e, { dedupeKey: "admin:cancel-payment" }),
  });

  const columns: AdminDataTableColumn<AdminPayment>[] = [
    {
      key: "learner",
      header: locale === "pt" ? "Aluno" : "Learner",
      sortable: true,
      sortValue: (p) => p.profiles?.full_name ?? "",
      render: (p) => (
        <div>
          <div className="font-medium">{p.profiles?.full_name || "—"}</div>
          <div className="text-xs text-muted-foreground">{p.profiles?.email}</div>
        </div>
      ),
    },
    {
      key: "plan",
      header: locale === "pt" ? "Plano" : "Plan",
      render: (p) => (
        <span className="capitalize">
          {p.subscription_plans?.tier} · {p.subscription_plans?.billing_cycle}
        </span>
      ),
    },
    {
      key: "amount",
      header: locale === "pt" ? "Valor" : "Amount",
      sortable: true,
      sortValue: (p) => p.amount_kz,
      render: (p) => <span className="font-semibold">{p.amount_kz.toLocaleString("pt-AO")} Kz</span>,
    },
    {
      key: "reference",
      header: locale === "pt" ? "Referência" : "Reference",
      render: (p) => <code className="text-xs">{p.reference}</code>,
    },
    {
      key: "status",
      header: locale === "pt" ? "Estado" : "Status",
      sortable: true,
      sortValue: (p) => p.status,
      render: (p) => <StatusBadge status={p.status} />,
    },
    {
      key: "code",
      header: locale === "pt" ? "Código / Expira" : "Code / Expires",
      render: (p) =>
        p.subscriptions?.activation_code ? (
          <div className="text-xs">
            <code className="font-mono font-semibold text-magenta">
              {p.subscriptions.activation_code}
            </code>
            {p.subscriptions?.expires_at && (
              <div className="text-muted-foreground">
                {locale === "pt" ? "expira" : "expires"}{" "}
                {new Date(p.subscriptions.expires_at).toLocaleDateString()}
              </div>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "actions",
      header: locale === "pt" ? "Ações" : "Actions",
      render: (p) =>
        p.status === "pending" ? (
          <div className="flex gap-1">
            <Button
              size="sm"
              onClick={() => activate.mutate(p)}
              disabled={activate.isPending}
              className="bg-emerald-500 text-white hover:bg-emerald-600"
            >
              <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> {locale === "pt" ? "Ativar" : "Activate"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (
                  !window.confirm(
                    locale === "pt" ? "Cancelar este pagamento pendente?" : "Cancel this pending payment?",
                  )
                )
                  return;
                cancel.mutate(p);
              }}
            >
              <XCircle className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold text-ink">
        {locale === "pt" ? "Pagamentos" : "Payments"}
      </h2>
      <AdminDataTable
        columns={columns}
        data={payments}
        getRowId={(p) => p.id}
        getSearchText={(p) => `${p.profiles?.full_name ?? ""} ${p.profiles?.email ?? ""} ${p.reference}`}
        searchPlaceholder={
          locale === "pt" ? "Pesquisar por aluno ou referência…" : "Search by learner or reference…"
        }
        emptyLabel={locale === "pt" ? "Ainda sem pagamentos" : "No payments yet"}
      />
    </div>
  );
}
