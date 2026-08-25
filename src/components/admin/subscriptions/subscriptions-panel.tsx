import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CreditCard, Download } from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";
import { useLocale } from "@/lib/i18n";
import { useNotification } from "@/lib/notifications/notification-provider";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { AdminDataTable, type AdminDataTableColumn } from "@/components/admin/admin-data-table";
import { csvDownload } from "@/components/admin/csv-download";

type AdminSubscription = {
  id: string;
  status: string;
  starts_at: string | null;
  expires_at: string | null;
  activation_code: string | null;
  profiles?: { full_name: string | null; email: string | null } | null;
  subscription_plans?: { tier: string; billing_cycle: string } | null;
};

const FILTERS = [
  { value: "", label: { pt: "Todas", en: "All" } },
  { value: "active", label: { pt: "Ativas", en: "Active" } },
  { value: "cancelled", label: { pt: "Canceladas", en: "Cancelled" } },
] as const;

export function SubscriptionsPanel() {
  const { locale } = useLocale();
  const { user, isAdmin } = useAuth();
  const notify = useNotification();
  const { data = [], refetch } = useQuery({
    queryKey: ["admin_subscriptions"],
    queryFn: async () =>
      (await apiFetch<{ items: AdminSubscription[] }>("/v1/admin/subscriptions?limit=200")).items,
    enabled: !!user && isAdmin,
  });
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = useMemo(
    () => (statusFilter ? data.filter((s) => s.status === statusFilter) : data),
    [data, statusFilter],
  );

  const cancelSub = async (id: string) => {
    setCancelingId(id);
    try {
      await apiFetch(`/v1/admin/subscriptions/${id}/cancel`, { method: "POST" });
      refetch();
    } catch (e) {
      notify.fromError(e, { dedupeKey: "admin:cancel-subscription" });
    } finally {
      setCancelingId(null);
    }
  };

  const columns: AdminDataTableColumn<AdminSubscription>[] = [
    {
      key: "learner",
      header: locale === "pt" ? "Aluno" : "Learner",
      sortable: true,
      sortValue: (s) => s.profiles?.full_name ?? "",
      render: (s) => (
        <div>
          <div className="font-medium">{s.profiles?.full_name ?? "—"}</div>
          <div className="text-xs text-muted-foreground">{s.profiles?.email}</div>
        </div>
      ),
    },
    {
      key: "plan",
      header: locale === "pt" ? "Plano" : "Plan",
      render: (s) => (
        <span className="capitalize">
          {s.subscription_plans?.tier} · {s.subscription_plans?.billing_cycle}
        </span>
      ),
    },
    {
      key: "status",
      header: locale === "pt" ? "Estado" : "Status",
      sortable: true,
      sortValue: (s) => s.status,
      render: (s) => (
        <Badge variant={s.status === "active" ? "default" : "outline"} className="capitalize">
          {s.status}
        </Badge>
      ),
    },
    {
      key: "starts_at",
      header: locale === "pt" ? "Início" : "Start",
      render: (s) => (
        <span className="text-xs">
          {s.starts_at ? new Date(s.starts_at).toLocaleDateString("pt-AO") : "—"}
        </span>
      ),
    },
    {
      key: "expires_at",
      header: locale === "pt" ? "Expira" : "Expires",
      sortable: true,
      sortValue: (s) => s.expires_at ?? "",
      render: (s) => (
        <span className="text-xs">
          {s.expires_at ? new Date(s.expires_at).toLocaleDateString("pt-AO") : "—"}
        </span>
      ),
    },
    {
      key: "code",
      header: locale === "pt" ? "Código" : "Code",
      render: (s) => <code className="text-xs">{s.activation_code ?? "—"}</code>,
    },
    {
      key: "actions",
      header: locale === "pt" ? "Ações" : "Actions",
      render: (s) =>
        s.status === "active" ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="outline" disabled={cancelingId === s.id}>
                {cancelingId === s.id
                  ? locale === "pt"
                    ? "A cancelar…"
                    : "Cancelling…"
                  : locale === "pt"
                    ? "Cancelar"
                    : "Cancel"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {locale === "pt" ? "Cancelar esta assinatura?" : "Cancel this subscription?"}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {locale === "pt"
                    ? `${s.profiles?.full_name ?? "Este aluno"} perde o acesso ao plano pago imediatamente. Esta ação não pode ser desfeita a partir daqui.`
                    : `${s.profiles?.full_name ?? "This learner"} loses access to the paid plan immediately. This can't be undone from here.`}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{locale === "pt" ? "Voltar" : "Back"}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => cancelSub(s.id)}
                  className="bg-red-500 hover:bg-red-600"
                >
                  {locale === "pt" ? "Cancelar assinatura" : "Cancel subscription"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-bold text-ink flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-magenta" />{" "}
          {locale === "pt" ? "Assinaturas" : "Subscriptions"}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                  statusFilter === f.value
                    ? "bg-[var(--primary)] text-white shadow-md"
                    : "bg-white border border-gray-200 text-gray-500"
                }`}
              >
                {locale === "pt" ? f.label.pt : f.label.en}
              </button>
            ))}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              csvDownload(
                "subscriptions",
                filtered.map((s) => ({
                  learner: s.profiles?.full_name,
                  email: s.profiles?.email,
                  tier: s.subscription_plans?.tier,
                  cycle: s.subscription_plans?.billing_cycle,
                  status: s.status,
                  starts_at: s.starts_at,
                  expires_at: s.expires_at,
                  code: s.activation_code,
                })),
              )
            }
          >
            <Download className="h-3.5 w-3.5 mr-1" /> CSV
          </Button>
        </div>
      </div>
      <AdminDataTable
        columns={columns}
        data={filtered}
        getRowId={(s) => s.id}
        getSearchText={(s) => `${s.profiles?.full_name ?? ""} ${s.profiles?.email ?? ""}`}
        searchPlaceholder={locale === "pt" ? "Pesquisar por aluno…" : "Search by learner…"}
        emptyLabel={locale === "pt" ? "Sem assinaturas" : "No subscriptions"}
      />
    </div>
  );
}
