import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Clock, Shield, Sparkles, ArrowRight, ArrowLeft, CheckCircle2, Loader2, Smartphone, Crown, Zap, Star } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/pricing")({
  component: PricingPage,
  head: () => ({
    meta: [
      { title: "Planos e preços — Learning English with Coach" },
      {
        name: "description",
        content:
          "Planos Essencial, Premium e VIP nos ciclos mensal, trimestral e semestral. Aprenda inglês com IA a partir de 10.000 Kz/mês.",
      },
      { property: "og:title", content: "Planos e preços — Learning English with Coach" },
      {
        property: "og:description",
        content:
          "Escolha entre Essencial (10.000 Kz), Premium (15.000 Kz) e VIP (25.000 Kz) por mês. Descontos no trimestral e semestral.",
      },
      { property: "og:url", content: "https://coach-speak-bright.lovable.app/pricing" },
      { property: "og:type", content: "product" },
    ],
    links: [{ rel: "canonical", href: "https://coach-speak-bright.lovable.app/pricing" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          name: "Learning English with Coach — Assinatura",
          description: "Plataforma de inglês com AI Coach 24/7 e certificados CEFR A1–C2.",
          brand: { "@type": "Brand", name: "Learning English with Coach" },
          offers: [
            { "@type": "Offer", name: "Essencial Mensal", price: "10000", priceCurrency: "AOA" },
            { "@type": "Offer", name: "Premium Mensal", price: "15000", priceCurrency: "AOA" },
            { "@type": "Offer", name: "VIP Mensal", price: "25000", priceCurrency: "AOA" },
          ],
        }),
      },
    ],
  }),
});

type Tier = "essential" | "premium" | "vip";
type Cycle = "monthly" | "quarterly" | "semiannual";

interface Plan {
  id: string;
  tier: Tier;
  billing_cycle: Cycle;
  price_kz: number;
  duration_days: number;
  call_minutes: number;
  community_access: boolean;
  features: string[];
}

const TIER_META: Record<Tier, { icon: typeof Zap; color: string; label: { pt: string; en: string } }> = {
  essential: { icon: Zap, color: "from-sky-500 to-cyan-500", label: { pt: "Essencial", en: "Essential" } },
  premium: { icon: Star, color: "from-magenta to-sunset", label: { pt: "Premium", en: "Premium" } },
  vip: { icon: Crown, color: "from-amber to-orange-500", label: { pt: "VIP", en: "VIP" } },
};

const CYCLE_LABEL: Record<Cycle, { pt: string; en: string }> = {
  monthly: { pt: "Mensal", en: "Monthly" },
  quarterly: { pt: "Trimestral", en: "Quarterly" },
  semiannual: { pt: "Semestral", en: "Semiannual" },
};

function PricingPage() {
  const { locale } = useLocale();
  const [cycle, setCycle] = useState<Cycle>("monthly");
  const [step, setStep] = useState<"choose" | "reference" | "verifying">("choose");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [payment, setPayment] = useState<{ reference: string; entity: string; amount: number; id: string } | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: plans = [] } = useQuery({
    queryKey: ["subscription_plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("price_kz");
      if (error) throw error;
      return (data as unknown as Plan[]).map((p) => ({ ...p, features: (p.features as unknown as string[]) ?? [] }));
    },
  });

  const filtered = useMemo(() => plans.filter((p) => p.billing_cycle === cycle), [plans, cycle]);

  const createPayment = useMutation({
    mutationFn: async (plan: Plan) => {
      if (!user) throw new Error("auth");
      const reference = `MCX${Date.now().toString().slice(-9)}`;
      const { data: sub, error: se } = await supabase
        .from("subscriptions")
        .insert({ user_id: user.id, plan_id: plan.id, status: "pending" })
        .select()
        .single();
      if (se) throw se;
      const { data: pay, error: pe } = await supabase
        .from("payments")
        .insert({
          user_id: user.id,
          subscription_id: sub.id,
          plan_id: plan.id,
          amount_kz: plan.price_kz,
          reference,
          entity: "11473",
          status: "pending",
        })
        .select()
        .single();
      if (pe) throw pe;
      return { pay, plan };
    },
    onSuccess: ({ pay, plan }) => {
      setPayment({ reference: pay.reference, entity: pay.entity, amount: plan.price_kz, id: pay.id });
      setSelectedPlan(plan);
      setStep("reference");
      qc.invalidateQueries({ queryKey: ["my_payments"] });
    },
    onError: (e: Error) => {
      if (e.message === "auth") {
        toast.error(locale === "pt" ? "Faça login primeiro" : "Please sign in first");
        navigate({ to: "/auth" });
      } else {
        toast.error(e.message);
      }
    },
  });

  const handleSubscribe = (plan: Plan) => {
    if (!user) {
      toast.info(locale === "pt" ? "Precisa iniciar sessão" : "Sign in required");
      navigate({ to: "/auth" });
      return;
    }
    navigate({ to: "/checkout/$planId", params: { planId: plan.id } });
  };

  const copyRef = () => {
    if (payment) {
      navigator.clipboard.writeText(payment.reference);
      toast.success(locale === "pt" ? "Referência copiada" : "Reference copied");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-6 py-12">
        {step === "choose" && (
          <>
            <div className="text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1 text-xs font-semibold shadow-card backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-magenta" />
                {locale === "pt" ? "Escolha o seu plano" : "Pick your plan"}
              </div>
              <h1 className="mt-4 font-display text-4xl font-bold md:text-5xl">
                {locale === "pt" ? "Aprenda inglês " : "Learn English "}
                <span className="text-gradient-sunset">
                  {locale === "pt" ? "no seu ritmo" : "your way"}
                </span>
              </h1>
              <p className="mt-3 text-muted-foreground">
                {locale === "pt"
                  ? "Cancele quando quiser. Pagamento via Multicaixa Express."
                  : "Cancel anytime. Payment via Multicaixa Express."}
              </p>
            </div>

            <div className="mt-8 flex justify-center">
              <div className="inline-flex rounded-full border border-border bg-card p-1 shadow-card">
                {(["monthly", "quarterly", "semiannual"] as Cycle[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCycle(c)}
                    className={`rounded-full px-5 py-2 text-sm font-semibold transition-all ${
                      cycle === c ? "bg-gradient-sunset text-white shadow-soft" : "text-muted-foreground"
                    }`}
                  >
                    {CYCLE_LABEL[c][locale]}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {filtered.map((plan) => {
                const meta = TIER_META[plan.tier];
                const Icon = meta.icon;
                const featured = plan.tier === "premium";
                return (
                  <div
                    key={plan.id}
                    className={`relative rounded-3xl border bg-card p-8 shadow-card transition-all hover:-translate-y-1 hover:shadow-glow ${
                      featured ? "border-magenta ring-2 ring-magenta/30" : "border-border"
                    }`}
                  >
                    {featured && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-sunset px-3 py-1 text-xs font-bold text-white shadow-soft">
                        {locale === "pt" ? "MAIS POPULAR" : "MOST POPULAR"}
                      </div>
                    )}
                    <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${meta.color} text-white shadow-soft`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-4 font-display text-2xl font-bold">{meta.label[locale]}</h3>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="font-display text-4xl font-bold">{plan.price_kz.toLocaleString("pt-AO")}</span>
                      <span className="text-sm text-muted-foreground">Kz</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {plan.duration_days} {locale === "pt" ? "dias" : "days"}
                    </div>
                    <ul className="mt-6 space-y-2.5 text-sm">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                          <span>{f}</span>
                        </li>
                      ))}
                      {plan.call_minutes > 0 && (
                        <li className="flex items-start gap-2 font-semibold">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                          {plan.call_minutes} min {locale === "pt" ? "com o professor" : "with the teacher"}
                        </li>
                      )}
                    </ul>
                    <Button
                      onClick={() => handleSubscribe(plan)}
                      disabled={createPayment.isPending}
                      className={`mt-6 w-full ${featured ? "bg-gradient-sunset text-white shadow-soft" : ""}`}
                      variant={featured ? "default" : "outline"}
                      size="lg"
                    >
                      {createPayment.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : locale === "pt" ? "Assinar Agora" : "Subscribe Now"}
                    </Button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {step === "reference" && selectedPlan && payment && (
          <div className="mx-auto max-w-2xl">
            <button
              onClick={() => setStep("choose")}
              className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> {locale === "pt" ? "Voltar" : "Back"}
            </button>
            <div className="glass rounded-3xl p-8 shadow-glow">
              <div className="flex items-center gap-3">
                <Smartphone className="h-6 w-6 text-magenta" />
                <h2 className="font-display text-2xl font-bold">
                  {locale === "pt" ? "Pagamento por Multicaixa Express" : "Multicaixa Express Payment"}
                </h2>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {locale === "pt"
                  ? "Efetue o pagamento com a referência abaixo. Após a confirmação, o administrador ativará a sua assinatura."
                  : "Complete the payment using the reference below. After verification, the admin will activate your subscription."}
              </p>

              <div className="mt-6 grid gap-4 rounded-2xl border border-border bg-background/50 p-6">
                <Row label={locale === "pt" ? "Plano" : "Plan"} value={`${TIER_META[selectedPlan.tier].label[locale]} · ${CYCLE_LABEL[selectedPlan.billing_cycle][locale]}`} />
                <Row label={locale === "pt" ? "Valor" : "Amount"} value={`${payment.amount.toLocaleString("pt-AO")} Kz`} bold />
                <Row label={locale === "pt" ? "Entidade" : "Entity"} value={payment.entity} />
                <div className="flex items-center justify-between border-t border-border pt-4">
                  <span className="text-xs uppercase tracking-widest text-muted-foreground">
                    {locale === "pt" ? "Referência" : "Reference"}
                  </span>
                  <div className="flex items-center gap-2">
                    <code className="rounded-lg bg-muted px-3 py-1.5 font-mono text-lg font-bold text-magenta">
                      {payment.reference}
                    </code>
                    <Button variant="outline" size="icon" onClick={copyRef}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-start gap-3 rounded-2xl bg-amber/10 p-4 text-xs">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
                <p>
                  {locale === "pt"
                    ? "Esta referência expira em 72 horas. Após pagar, notifique o administrador via WhatsApp."
                    : "This reference expires in 72 hours. After payment, notify the admin via WhatsApp."}
                </p>
              </div>

              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                <Button
                  size="lg"
                  onClick={() => {
                    const msg = encodeURIComponent(
                      `Olá! Efetuei o pagamento.%0AReferência: ${payment.reference}%0AValor: ${payment.amount} Kz%0APlano: ${TIER_META[selectedPlan.tier].label.pt} ${CYCLE_LABEL[selectedPlan.billing_cycle].pt}`
                    );
                    window.open(`https://wa.me/244929193415?text=${msg}`, "_blank");
                    setStep("verifying");
                  }}
                  className="bg-gradient-sunset text-white shadow-soft"
                >
                  {locale === "pt" ? "Já paguei — notificar" : "I've paid — notify"}
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/dashboard">{locale === "pt" ? "Ir para o painel" : "Go to dashboard"}</Link>
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === "verifying" && (
          <div className="mx-auto max-w-lg text-center">
            <div className="glass rounded-3xl p-10 shadow-glow">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h2 className="mt-4 font-display text-2xl font-bold">
                {locale === "pt" ? "Aguardando verificação" : "Awaiting verification"}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {locale === "pt"
                  ? "O administrador irá confirmar o pagamento e ativar a sua assinatura em breve. Pode acompanhar o estado no seu painel."
                  : "The admin will confirm your payment and activate your subscription soon. Track the status in your dashboard."}
              </p>
              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Shield className="h-3.5 w-3.5" /> {locale === "pt" ? "Pagamento seguro" : "Secure payment"}
              </div>
              <Button asChild className="mt-6 bg-gradient-sunset text-white">
                <Link to="/dashboard">{locale === "pt" ? "Ver painel" : "View dashboard"}</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className={bold ? "font-display text-lg font-bold" : "font-medium"}>{value}</span>
    </div>
  );
}
