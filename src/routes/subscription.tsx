import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  Crown,
  Calendar,
  FileText,
  Receipt,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Download,
} from "lucide-react";
import { VideosSidebar, VideosMobileNav } from "@/components/videos/videos-sidebar";
import {
  HeaderActionLinks,
  MobileAvatarMenu,
  DesktopAvatarLink,
} from "@/components/mobile-avatar-menu";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetch } from "@/lib/api/client";
import type { PaymentRow, SubscriptionRow, PlanRow } from "@/lib/api/billing-types";
import { normalizeApiError, type NormalizedError } from "@/lib/errors/normalize-api-error";
import { InlineStatusFromError } from "@/components/feedback/inline-status";

export const Route = createFileRoute("/subscription")({
  component: SubscriptionPage,
  head: () => ({
    meta: [
      { title: "Minha assinatura — Coach" },
      {
        name: "description",
        content: "Consulta a tua assinatura ativa, faturas e histórico de pagamentos.",
      },
    ],
  }),
});

type SubWithPlan = SubscriptionRow & { subscription_plans: PlanRow | null };
type PayWithPlan = PaymentRow & {
  subscription_plans: Pick<PlanRow, "tier" | "billing_cycle" | "price_kz" | "duration_days"> | null;
};

function SubscriptionPage() {
  const [subs, setSubs] = useState<SubWithPlan[]>([]);
  const [pays, setPays] = useState<PayWithPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<NormalizedError | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, p] = await Promise.all([
        apiFetch<SubWithPlan[]>("/v1/me/subscriptions"),
        apiFetch<PayWithPlan[]>("/v1/me/payments"),
      ]);
      setSubs(s);
      setPays(p);
    } catch (e) {
      setError(normalizeApiError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const active = subs.find((s) => s.status === "active");
  const invoices = pays.filter((p) => p.status === "paid");

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      <VideosSidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <header className="h-16 flex items-center justify-between px-4 md:px-6 bg-white border-b border-gray-100 shrink-0 z-10">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="font-display text-xl font-bold text-[var(--ink)] truncate">
              Assinatura
            </h2>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <HeaderActionLinks />
            <MobileAvatarMenu />
            <DesktopAvatarLink />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto pb-20 md:pb-6 scrollbar-hide bg-hero">
          <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
            <h1 className="font-display text-3xl font-bold md:text-4xl">Minha assinatura</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Gere a tua assinatura, consulta faturas e o histórico completo.
            </p>

            {loading ? (
              <div className="mt-10 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> A carregar…
              </div>
            ) : error ? (
              <Card className="mt-10 border-dashed">
                <CardContent className="p-10 text-center">
                  <div className="mx-auto max-w-md text-left">
                    <InlineStatusFromError
                      error={error}
                      action={{ label: "Tentar novamente", onClick: () => void load() }}
                    />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Tabs defaultValue="current" className="mt-6">
                <TabsList>
                  <TabsTrigger value="current">
                    <Crown className="mr-1.5 h-4 w-4" />
                    Minha Assinatura
                  </TabsTrigger>
                  <TabsTrigger value="invoices">
                    <Receipt className="mr-1.5 h-4 w-4" />
                    Minhas Faturas
                  </TabsTrigger>
                  <TabsTrigger value="history">
                    <Clock className="mr-1.5 h-4 w-4" />
                    Meu Histórico
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="current" className="mt-6">
                  {active ? (
                    <Card className="border-2 border-primary/30">
                      <CardContent className="p-6">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <Badge className="bg-gradient-sunset text-white">
                              {active.subscription_plans?.tier?.toUpperCase() || "PLANO"}
                            </Badge>
                            <div className="mt-2 font-display text-2xl font-bold">
                              Plano {active.subscription_plans?.tier} ·{" "}
                              {active.subscription_plans?.billing_cycle}
                            </div>
                            <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Calendar className="h-3.5 w-3.5" />
                              Ativo até{" "}
                              {active.expires_at
                                ? new Date(active.expires_at).toLocaleDateString()
                                : "—"}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-display text-3xl font-bold">
                              {active.subscription_plans?.price_kz.toLocaleString("pt-AO")} Kz
                            </div>
                            <div className="text-xs text-muted-foreground">/ ciclo</div>
                          </div>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-2">
                          <Button asChild variant="outline">
                            <Link to="/pricing">Mudar de plano</Link>
                          </Button>
                          <Button asChild>
                            <Link to="/dashboard">Ir para os cursos</Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="border-dashed">
                      <CardContent className="p-10 text-center">
                        <Crown className="mx-auto h-10 w-10 text-muted-foreground/60" />
                        <p className="mt-3 text-sm text-muted-foreground">
                          Não tens nenhuma assinatura ativa.
                        </p>
                        <Button asChild className="mt-4 bg-gradient-sunset text-white">
                          <Link to="/pricing">Ver planos</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="invoices" className="mt-6">
                  {invoices.length === 0 ? (
                    <EmptyState text="Ainda sem faturas emitidas." />
                  ) : (
                    <div className="space-y-3">
                      {invoices.map((p) => (
                        <InvoiceRow key={p.id} payment={p} />
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="history" className="mt-6">
                  {pays.length === 0 ? (
                    <EmptyState text="Sem movimentos." />
                  ) : (
                    <div className="space-y-2">
                      {pays.map((p) => (
                        <HistoryRow key={p.id} payment={p} />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>
        </main>
      </div>
      <VideosMobileNav />
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <Card className="border-dashed">
      <CardContent className="p-10 text-center text-sm text-muted-foreground">{text}</CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; icon: typeof CheckCircle2; label: string }> = {
    paid: {
      cls: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
      icon: CheckCircle2,
      label: "Pago",
    },
    pending: {
      cls: "bg-amber-500/15 text-amber-700 border-amber-500/30",
      icon: Clock,
      label: "Pendente",
    },
    cancelled: {
      cls: "bg-muted text-muted-foreground border-border",
      icon: XCircle,
      label: "Cancelado",
    },
    expired: {
      cls: "bg-destructive/15 text-destructive border-destructive/30",
      icon: XCircle,
      label: "Expirado",
    },
  };
  const cfg = map[status] ?? map.pending;
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-2xs font-semibold ${cfg.cls}`}
    >
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

function InvoiceRow({ payment }: { payment: PayWithPlan }) {
  const downloadInvoice = () => {
    const html = invoiceHtml(payment);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${payment.invoice_number || payment.id}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="font-mono text-sm font-bold">
              {payment.invoice_number || payment.id.slice(0, 8)}
            </div>
            <div className="text-xs text-muted-foreground">
              {payment.paid_at ? new Date(payment.paid_at).toLocaleDateString() : "—"} ·{" "}
              {payment.subscription_plans?.tier?.toUpperCase()}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="font-display text-lg font-bold">
            {payment.amount_kz.toLocaleString("pt-AO")} Kz
          </div>
          <Button size="sm" variant="outline" onClick={downloadInvoice}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Fatura
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function HistoryRow({ payment }: { payment: PayWithPlan }) {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-background px-4 py-3">
      <div>
        <div className="text-sm font-semibold">
          {payment.subscription_plans?.tier?.toUpperCase() || "PLANO"} · {payment.method || "—"}
        </div>
        <div className="text-xs text-muted-foreground">
          {new Date(payment.created_at).toLocaleString()} · Ref {payment.reference || "—"}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-sm font-semibold">{payment.amount_kz.toLocaleString("pt-AO")} Kz</div>
        <StatusBadge status={payment.status} />
      </div>
    </div>
  );
}

function invoiceHtml(p: PayWithPlan) {
  const date = p.paid_at ? new Date(p.paid_at).toLocaleDateString() : "—";
  return `<!doctype html><html><head><meta charset="utf-8"><title>${p.invoice_number}</title>
<style>body{font-family:system-ui;padding:40px;max-width:720px;margin:auto;color:#222}
h1{margin:0;font-size:28px}table{width:100%;border-collapse:collapse;margin-top:24px}
td,th{padding:10px;border-bottom:1px solid #eee;text-align:left}.total{font-size:22px;font-weight:700}
.brand{color:#be5a3c;font-weight:700;letter-spacing:.1em;font-size:12px}</style></head><body>
<div class="brand">LEARNING ENGLISH WITH COACH</div>
<h1>Fatura ${p.invoice_number ?? ""}</h1>
<p>Data: ${date}<br/>Referência: ${p.reference ?? "—"}<br/>Método: ${p.method ?? "—"}</p>
<table><tr><th>Descrição</th><th>Valor</th></tr>
<tr><td>Assinatura ${p.subscription_plans?.tier?.toUpperCase() ?? ""} — ${p.subscription_plans?.billing_cycle ?? ""}</td>
<td>${p.amount_kz.toLocaleString("pt-AO")} Kz</td></tr>
<tr><td class="total">TOTAL</td><td class="total">${p.amount_kz.toLocaleString("pt-AO")} Kz</td></tr></table>
<p style="margin-top:40px;font-size:11px;color:#888">Documento emitido eletronicamente. ID: ${p.id}</p>
</body></html>`;
}
