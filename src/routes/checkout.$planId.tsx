import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  CreditCard, Landmark, Smartphone, Hash, Copy, Check, Loader2,
  ShieldCheck, ArrowLeft, Sparkles,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import {
  listPlans, createSubscriptionOrder, simulatePaymentConfirmation,
  type PlanRow, type PaymentMethod, type OrderInfo,
} from "@/lib/subscriptions.functions";

export const Route = createFileRoute("/checkout/$planId")({
  loader: async ({ params }) => {
    const plans = await listPlans();
    const plan = plans.find((p) => p.id === params.planId);
    if (!plan) throw new Error("Plano não encontrado");
    return { plan };
  },
  errorComponent: ({ error }) => (
    <div className="min-h-screen"><SiteHeader />
      <div className="mx-auto max-w-2xl p-10 text-center">
        <p className="text-destructive">{error.message}</p>
        <Button asChild className="mt-4"><Link to="/pricing">Voltar aos planos</Link></Button>
      </div>
    </div>
  ),
  notFoundComponent: () => <div className="p-10 text-center">Plano não encontrado.</div>,
  component: CheckoutPage,
  head: ({ params }) => ({
    meta: [
      { title: `Checkout ${params.planId} — Coach` },
      { name: "description", content: "Finalize a sua assinatura com pagamento por cartão, referência Multicaixa ou transferência bancária." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

const METHODS: {
  id: PaymentMethod; icon: typeof CreditCard; title: string; desc: string; providers: string[];
}[] = [
  { id: "card", icon: CreditCard, title: "Cartão bancário", desc: "Multicaixa Express, Visa, Mastercard", providers: ["Multicaixa Express", "AppyPay", "PayPay AO"] },
  { id: "reference", icon: Hash, title: "Referência de pagamento", desc: "Pague em qualquer ATM ou app Multicaixa Express", providers: ["EMIS", "Multicaixa"] },
  { id: "transfer", icon: Landmark, title: "Transferência bancária", desc: "BAI, BFA, BIC, Millennium, Standard Bank", providers: ["BAI", "BFA", "BIC"] },
  { id: "mobile_money", icon: Smartphone, title: "Mobile Money", desc: "Unitel Money · Africell Money", providers: ["Unitel Money", "Africell Money"] },
];

function CheckoutPage() {
  const { plan } = Route.useLoaderData();
  const navigate = useNavigate();
  const createFn = useServerFn(createSubscriptionOrder);
  const simulateFn = useServerFn(simulatePaymentConfirmation);

  const [method, setMethod] = useState<PaymentMethod>("reference");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      const o = await createFn({ data: { planId: plan.id, method, phone: phone || null } });
      setOrder(o);
      toast.success("Pedido criado. Complete o pagamento.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao criar pedido");
    } finally {
      setLoading(false);
    }
  }

  async function confirm() {
    if (!order) return;
    setConfirming(true);
    try {
      await simulateFn({ data: { paymentId: order.payment_id } });
      toast.success("Pagamento confirmado — cursos liberados!");
      navigate({ to: "/subscription" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="bg-hero">
        <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
          <Link to="/pricing" className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-1 h-3.5 w-3.5" />Voltar aos planos
          </Link>

          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div>
              <h1 className="font-display text-3xl font-bold md:text-4xl">Finalizar assinatura</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Pagamento seguro · Ativação automática após confirmação
              </p>

              {!order ? (
                <Card className="mt-6">
                  <CardContent className="p-6">
                    <h2 className="font-display font-bold">Método de pagamento</h2>
                    <RadioGroup
                      value={method}
                      onValueChange={(v) => setMethod(v as PaymentMethod)}
                      className="mt-4 grid gap-3"
                    >
                      {METHODS.map((m) => {
                        const Icon = m.icon;
                        return (
                          <Label
                            key={m.id}
                            htmlFor={m.id}
                            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${method === m.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"}`}
                          >
                            <RadioGroupItem value={m.id} id={m.id} className="mt-1" />
                            <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                            <div className="flex-1">
                              <div className="font-semibold">{m.title}</div>
                              <div className="text-xs text-muted-foreground">{m.desc}</div>
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {m.providers.map((p) => (
                                  <Badge key={p} variant="secondary" className="text-[10px]">{p}</Badge>
                                ))}
                              </div>
                            </div>
                          </Label>
                        );
                      })}
                    </RadioGroup>

                    {(method === "mobile_money" || method === "card") && (
                      <div className="mt-4">
                        <Label htmlFor="phone">Telefone (opcional)</Label>
                        <Input
                          id="phone" value={phone} onChange={(e) => setPhone(e.target.value)}
                          placeholder="+244 9XX XXX XXX"
                        />
                      </div>
                    )}

                    <Button
                      className="mt-6 w-full bg-gradient-sunset text-white"
                      size="lg" onClick={submit} disabled={loading}
                    >
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Gerar ordem de pagamento
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="mt-6 border-2 border-primary/30">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 text-primary">
                      <ShieldCheck className="h-5 w-5" />
                      <h2 className="font-display font-bold">Ordem gerada</h2>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Efetue o pagamento com os dados abaixo. Após confirmação, os cursos são liberados automaticamente.
                    </p>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      {method === "reference" && (
                        <>
                          <Field label="Entidade" value={order.entity} />
                          <Field label="Referência" value={order.reference} mono />
                        </>
                      )}
                      {method === "transfer" && (
                        <>
                          <Field label="Banco" value="BAI — Banco Angolano de Investimentos" />
                          <Field label="IBAN" value="AO06 0040 0000 1234 5678 9012 3" mono />
                          <Field label="Titular" value="Learning English with Coach, Lda." />
                          <Field label="Descritivo" value={order.invoice_number} mono />
                        </>
                      )}
                      {method === "mobile_money" && (
                        <>
                          <Field label="Número Unitel Money" value="923 000 000" mono />
                          <Field label="Referência" value={order.reference} mono />
                        </>
                      )}
                      {method === "card" && (
                        <Field label="Referência gateway" value={order.reference} mono />
                      )}
                      <Field label="Fatura" value={order.invoice_number} mono />
                      <Field label="Total" value={`${order.amount_kz.toLocaleString("pt-AO")} Kz`} />
                    </div>

                    <div className="mt-6 rounded-lg border bg-muted/40 p-4 text-xs text-muted-foreground">
                      Este é um ambiente sandbox. Em produção, o gateway (Multicaixa Express / EMIS / AppyPay)
                      confirmará o pagamento por webhook. Podes simular a confirmação abaixo.
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button onClick={confirm} disabled={confirming} className="flex-1">
                        {confirming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        Simular confirmação
                      </Button>
                      <Button asChild variant="outline">
                        <Link to="/subscription">Ver assinatura</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Summary */}
            <Card className="h-fit">
              <CardContent className="p-6">
                <h3 className="font-display font-bold">Resumo</h3>
                <div className="mt-4 space-y-2 text-sm">
                  <Row label="Plano" value={plan.tier.toUpperCase()} />
                  <Row label="Ciclo" value={plan.billing_cycle} />
                  <Row label="Duração" value={`${plan.duration_days} dias`} />
                </div>
                <div className="my-4 h-px bg-border" />
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="font-display text-2xl font-bold">
                    {plan.price_kz.toLocaleString("pt-AO")} <span className="text-sm">Kz</span>
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold capitalize">{value}</span>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-center justify-between gap-2">
        <div className={`font-semibold ${mono ? "font-mono text-sm" : ""}`}>{value}</div>
        <Button
          size="icon" variant="ghost" className="h-7 w-7"
          onClick={() => {
            navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </div>
  );
}
