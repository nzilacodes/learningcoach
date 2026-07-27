import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Copy,
  Clock,
  Shield,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Smartphone,
  Crown,
  Zap,
  Star,
} from "lucide-react";
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

const TIER_META: Record<
  Tier,
  {
    icon: typeof Zap;
    color: string;
    label: { pt: string; en: string };
    desc: { pt: string; en: string };
  }
> = {
  essential: { 
    icon: Sparkles, 
    color: "bg-white ring-slate-100", 
    label: { pt: "Essencial", en: "Essential" },
    desc: {
      pt: "Base sólida de inglês para iniciantes.",
      en: "Foundational English for beginners.",
    },
  },
  premium: { 
    icon: Star, 
    color: "bg-white/40 ring-white/60 backdrop-blur-sm", 
    label: { pt: "Premium", en: "Premium" },
    desc: {
      pt: "Ferramentas avançadas para falantes intermediários.",
      en: "Advanced tools for intermediate speakers.",
    },
  },
  vip: { 
    icon: Crown, 
    color: "bg-white ring-slate-100", 
    label: { pt: "VIP Elite", en: "VIP Elite" },
    desc: {
      pt: "Mestria sem limites para utilizadores exigentes.",
      en: "Unrestricted mastery for power users.",
    },
  },
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
  const [payment, setPayment] = useState<{
    reference: string;
    entity: string;
    amount: number;
    id: string;
  } | null>(null);
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
      return (data as unknown as Plan[]).map((p) => ({
        ...p,
        features: (p.features as unknown as string[]) ?? [],
      }));
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
    <div className="mt-16 min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-[1440px] px-4 py-12">
        {step === "choose" && (
          <>
            <div className="mb-12 text-center">
              <h1 className="mt-4 font-display text-4xl font-bold md:text-5xl text-[#0F172A]">
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

            <div className="mt-8 flex justify-center px-2">
              {/* Refined toggle to match image-1.png - Made responsive for small screens */}
              <div className="inline-flex items-center gap-1 rounded-full border border-slate-200/60 bg-slate-50/50 p-1.5 shadow-sm backdrop-blur-sm max-w-full overflow-x-auto no-scrollbar">
                {(["monthly", "quarterly", "semiannual"] as Cycle[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCycle(c)}
                    className={`rounded-full px-4 sm:px-7 py-2.5 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] transition-all duration-300 whitespace-nowrap ${
                      cycle === c 
                        ? "bg-white text-[#0F172A] shadow-[0_2px_8px_rgba(15,23,42,0.08)] ring-1 ring-slate-100" 
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {CYCLE_LABEL[c][locale]}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-20 relative px-4">
              <div className="mx-auto max-w-[1440px]">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 justify-items-center items-stretch overflow-visible">
                  {filtered.map((plan) => {
                    const meta = TIER_META[plan.tier];
                    const Icon = meta.icon;
                    const featured = plan.tier === "premium";
                    
                    const orbColor = plan.tier === "essential" ? "bg-teal-400" : plan.tier === "premium" ? "bg-pink-400" : "bg-indigo-400";
                    const ringColor = plan.tier === "premium" ? "ring-pink-400/20" : "ring-slate-200/20";

                    return (
                      <div 
                        key={plan.id} 
                        className={`relative h-full w-full flex justify-center transition-all duration-300 ${
                          featured ? "z-[5]" : "z-[1]"
                        }`}
                      >
                        {/* Glassmorphic Orb Backdrop - Absolute positioned but pointer-events-none */}
                        <div className={`orb absolute -inset-6 ${orbColor} rounded-full z-0 opacity-15 blur-[100px] pointer-events-none transition-opacity duration-700`} />
                        
                        {/* Glass Card - Unified elegant styles for all, elevation for featured */}
                        <div className={`glass-card relative z-10 flex h-full flex-col p-8 w-full md:max-w-[420px] rounded-[2.5rem] bg-white/80 backdrop-blur-2xl border border-white/40 shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-500 lg:min-h-[600px] ${
                          featured 
                            ? `lg:-translate-y-10 ring-2 ${ringColor} shadow-[0_40px_80px_-20px_rgba(15,23,42,0.1)]` 
                            : ""
                        }`}>
                          
                          {featured && (
                            <div className="absolute top-8 right-8 inline-flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border border-slate-100 shadow-sm z-20">
                              <Star className="h-3 w-3 fill-pink-500 text-pink-500" />
                              <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">
                                {locale === "pt" ? "MAIS POPULAR" : "MOST POPULAR"}
                              </span>
                            </div>
                          )}

                          <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-10 ring-1 ring-slate-100 relative overflow-hidden">
                            {featured && <div className="absolute inset-0 bg-gradient-to-br from-pink-400/20 to-orange-400/20" />}
                            <Icon className={`h-8 w-8 relative z-10 ${plan.tier === "essential" ? "text-[#0EA5A4]" : plan.tier === "premium" ? "text-pink-500" : "text-indigo-600"}`} />
                          </div>

                          <h3 className="font-display text-3xl font-bold mb-2 text-[#0F172A]">{meta.label[locale]}</h3>
                          <p className="text-sm text-slate-500 mb-10 leading-relaxed max-w-[280px]">{meta.desc[locale]}</p>

                          <div className="flex items-baseline gap-1 mb-1">
                            <span className="text-5xl sm:text-6xl font-black tracking-tighter text-[#0F172A]">
                              {plan.price_kz.toLocaleString("pt-AO")}
                            </span>
                            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                              Kz
                            </span>
                          </div>
                          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-10">
                            {plan.duration_days} {locale === "pt" ? "DIAS" : "DAYS"}
                          </div>

                          <div className="w-full h-px bg-slate-200/80 mb-10" />

                          <div className="flex-grow">
                            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">
                              {locale === "pt" ? "O que está incluído:" : "What's included:"}
                            </p>
                            <ul className="space-y-4">
                              {plan.features.map((f, i) => (
                                <li key={i} className="flex items-start gap-4 text-sm font-medium text-slate-600">
                                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                                  <span>{f}</span>
                                </li>
                              ))}
                              {plan.call_minutes > 0 && (
                                <li className="flex items-start gap-4 text-sm font-bold text-[#0F172A]">
                                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                                  <span>
                                    {plan.call_minutes} min {locale === "pt" ? "com o professor" : "with the teacher"}
                                  </span>
                                </li>
                              )}
                            </ul>
                          </div>

                          <Button
                            onClick={() => handleSubscribe(plan)}
                            disabled={createPayment.isPending}
                            className="mt-12 w-full py-8 px-6 bg-[#0F172A] text-white text-xs font-bold uppercase tracking-[0.25em] rounded-full shadow-[0_20px_45px_-5px_rgba(15,23,42,0.35)] transition-all hover:bg-slate-900 active:scale-95 overflow-hidden group/btn"
                            variant="default"
                          >
                            {createPayment.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                                {locale === "pt" ? "Assinar Agora" : "Subscribe Now"}
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            <p className="text-center mt-12 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
              {locale === "pt" ? "Pagamento Seguro via Multicaixa Express" : "Secure Payment via Multicaixa Express"}
            </p>
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
