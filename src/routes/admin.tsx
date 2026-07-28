import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, CreditCard, DollarSign, Clock, TrendingUp, ShieldCheck, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLocale } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api/client";
import { SubscriptionsSection, AnalyticsSection, ReportsSection } from "@/components/admin/sections";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({
    meta: [
      { title: "Admin — Learning English with Coach" },
      { name: "description", content: "Painel de administração." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function AdminPage() {
  const { locale } = useLocale();
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const { data: stats } = useQuery({
    queryKey: ["admin_stats", isAdmin],
    enabled: !!user && isAdmin,
    queryFn: async () => {
      const s = await apiFetch<{
        totalUsers: number;
        activeSubscriptions: number;
        pendingPayments: number;
        monthRevenue: number;
      }>("/v1/admin/stats");
      return { total: s.totalUsers, active: s.activeSubscriptions, pending: s.pendingPayments, revenue: s.monthRevenue };
    },
  });

  const { data: users = [] } = useQuery({
    queryKey: ["admin_users"],
    enabled: !!user && isAdmin,
    queryFn: async () => {
      const res = await apiFetch<{ items: any[] }>("/v1/admin/users?limit=200");
      return res.items;
    },
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["admin_payments"],
    enabled: !!user && isAdmin,
    queryFn: async () => {
      const res = await apiFetch<{ items: any[] }>("/v1/admin/payments?limit=100");
      return res.items;
    },
  });

  const activate = useMutation({
    mutationFn: async (payment: any) =>
      apiFetch<{ activationCode: string | null }>(`/v1/admin/payments/${payment.id}/activate`, { method: "POST" }),
    onSuccess: ({ activationCode }) => {
      if (activationCode) {
        navigator.clipboard?.writeText(activationCode).catch(() => {});
        toast.success(
          locale === "pt" ? `Ativada. Código: ${activationCode} (copiado)` : `Activated. Code: ${activationCode} (copied)`,
          { duration: 8000 },
        );
      } else {
        toast.success(locale === "pt" ? "Pagamento ativado" : "Payment activated");
      }
      qc.invalidateQueries({ queryKey: ["admin_payments"] });
      qc.invalidateQueries({ queryKey: ["admin_stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const cancel = useMutation({
    mutationFn: async (payment: any) => apiFetch(`/v1/admin/payments/${payment.id}/cancel`, { method: "POST" }),
    onSuccess: () => {
      toast.success(locale === "pt" ? "Pagamento cancelado" : "Payment cancelled");
      qc.invalidateQueries({ queryKey: ["admin_payments"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (loading) return <div className="p-10 text-center">...</div>;

  if (user && !isAdmin) {
    return (
      <div className="theme-adults min-h-screen bg-background text-foreground">
        <SiteHeader />
        <div className="mx-auto max-w-lg px-6 py-20 text-center">
          <ShieldCheck className="mx-auto h-12 w-12 text-magenta" />
          <h1 className="mt-4 font-display text-2xl font-bold">
            {locale === "pt" ? "Acesso restrito" : "Restricted access"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {locale === "pt"
              ? "Esta área é apenas para administradores. Se acredita que devia ter acesso, contacte o Coach."
              : "This area is admin-only. Contact the Coach if you should have access."}
          </p>
          <Button asChild className="mt-6">
            <Link to="/dashboard">{locale === "pt" ? "Ir para o painel" : "Go to dashboard"}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const statCards = [
    { icon: Users, label: locale === "pt" ? "Total de alunos" : "Total learners", value: stats?.total ?? 0, color: "text-sunset bg-sunset/10" },
    { icon: CreditCard, label: locale === "pt" ? "Assinaturas ativas" : "Active subs", value: stats?.active ?? 0, color: "text-magenta bg-magenta/10" },
    { icon: Clock, label: locale === "pt" ? "Pendentes" : "Pending", value: stats?.pending ?? 0, color: "text-amber bg-amber/10" },
    { icon: DollarSign, label: locale === "pt" ? "Receita (mês)" : "Revenue (month)", value: `${(stats?.revenue ?? 0).toLocaleString("pt-AO")} Kz`, color: "text-violet bg-violet/10" },
  ];

  return (
    <div className="theme-adults min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-magenta">Admin</div>
            <h1 className="mt-1 font-display text-3xl font-bold md:text-4xl">
              {locale === "pt" ? "Painel do Administrador" : "Administrator Dashboard"}
            </h1>
          </div>
          <Badge variant="outline" className="gap-1">
            <TrendingUp className="h-3 w-3" /> Live
          </Badge>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div className="mt-3 text-2xl font-bold">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-border bg-card shadow-card">
          <div className="border-b border-border px-6 py-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">{locale === "pt" ? "Alunos" : "Learners"}</h2>
            <span className="text-xs text-muted-foreground">{users.length} {locale === "pt" ? "registados" : "registered"}</span>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{locale === "pt" ? "Nome" : "Name"}</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>{locale === "pt" ? "Telefone" : "Phone"}</TableHead>
                  <TableHead>{locale === "pt" ? "País" : "Country"}</TableHead>
                  <TableHead>{locale === "pt" ? "Idade" : "Age"}</TableHead>
                  <TableHead>{locale === "pt" ? "Sala" : "Room"}</TableHead>
                  <TableHead>CEFR</TableHead>
                  <TableHead>{locale === "pt" ? "Registo" : "Joined"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                      {locale === "pt" ? "Sem alunos" : "No learners"}
                    </TableCell>
                  </TableRow>
                )}
                {users.map((u: any) => {
                  const room = u.age == null ? "—" : u.age < 13 ? "Kids" : u.age < 18 ? "Teens" : "Adults";
                  return (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                      <TableCell className="text-xs">{u.email || "—"}</TableCell>
                      <TableCell className="text-xs">{u.phone || "—"}</TableCell>
                      <TableCell className="text-xs">{u.country || "—"}</TableCell>
                      <TableCell>{u.age ?? "—"}</TableCell>
                      <TableCell><Badge variant="outline">{room}</Badge></TableCell>
                      <TableCell><Badge variant="outline">{u.cefr_level || "—"}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-border bg-card shadow-card">
          <div className="border-b border-border px-6 py-4">
            <h2 className="font-display text-xl font-bold">{locale === "pt" ? "Pagamentos" : "Payments"}</h2>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{locale === "pt" ? "Aluno" : "Learner"}</TableHead>
                  <TableHead>{locale === "pt" ? "Plano" : "Plan"}</TableHead>
                  <TableHead>{locale === "pt" ? "Valor" : "Amount"}</TableHead>
                  <TableHead>{locale === "pt" ? "Referência" : "Reference"}</TableHead>
                  <TableHead>{locale === "pt" ? "Estado" : "Status"}</TableHead>
                  <TableHead>{locale === "pt" ? "Código / Expira" : "Code / Expires"}</TableHead>
                  <TableHead>{locale === "pt" ? "Ações" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                      {locale === "pt" ? "Ainda sem pagamentos" : "No payments yet"}
                    </TableCell>
                  </TableRow>
                )}
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="font-medium">{p.profiles?.full_name || "—"}</div>
                      <div className="text-xs text-muted-foreground">{p.profiles?.email}</div>
                    </TableCell>
                    <TableCell className="capitalize">
                      {p.subscription_plans?.tier} · {p.subscription_plans?.billing_cycle}
                    </TableCell>
                    <TableCell className="font-semibold">{p.amount_kz.toLocaleString("pt-AO")} Kz</TableCell>
                    <TableCell><code className="text-xs">{p.reference}</code></TableCell>
                    <TableCell><StatusBadge status={p.status} /></TableCell>
                    <TableCell className="text-xs">
                      {p.subscriptions?.activation_code ? (
                        <div>
                          <code className="font-mono font-semibold text-magenta">{p.subscriptions.activation_code}</code>
                          {p.subscriptions?.expires_at && (
                            <div className="text-muted-foreground">
                              {locale === "pt" ? "expira" : "expires"} {new Date(p.subscriptions.expires_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {p.status === "pending" && (
                        <div className="flex gap-1">
                          <Button size="sm" onClick={() => activate.mutate(p)} disabled={activate.isPending} className="bg-emerald-500 text-white hover:bg-emerald-600">
                            <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> {locale === "pt" ? "Ativar" : "Activate"}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => cancel.mutate(p)}>
                            <XCircle className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <SubscriptionsSection />
        <AnalyticsSection />
        <ReportsSection />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber/20 text-amber-700 dark:text-amber-400",
    paid: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400",
    cancelled: "bg-muted text-muted-foreground",
    expired: "bg-destructive/20 text-destructive",
  };
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${map[status] ?? ""}`}>{status}</span>;
}
