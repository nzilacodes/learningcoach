import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, CheckCircle2, Crown, Zap, Star } from "lucide-react";
import { useNotification } from "@/lib/notifications/notification-provider";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n";
import { apiFetch } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";
import { SITE_URL } from "@/lib/site-url";

export const Route = createFileRoute("/pricing")({
  // Seeds the same "subscription_plans" query the page body's useQuery reads
  // (same key + queryFn shape) via the router's shared queryClient, so the
  // client-side useQuery is a cache hit instead of a second network request —
  // this also gives head()'s JSON-LD live prices instead of a hardcoded
  // snapshot that would silently drift whenever an admin changed a price.
  loader: async ({ context }) => {
    const plans = await context.queryClient
      .ensureQueryData({
        queryKey: ["subscription_plans"],
        queryFn: async () => {
          const data = await apiFetch<Plan[]>("/v1/plans");
          return data.map((p) => ({ ...p, features: p.features ?? [] }));
        },
      })
      .catch(() => [] as Plan[]);
    return { monthlyPlans: plans.filter((p) => p.billing_cycle === "monthly") };
  },
  component: PricingPage,
  head: ({ loaderData }) => ({
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
      { property: "og:url", content: `${SITE_URL}/pricing` },
      { property: "og:type", content: "product" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/pricing` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          name: "Learning English with Coach — Assinatura",
          description: "Plataforma de inglês com AI Coach 24/7 e certificados CEFR A1–C2.",
          brand: { "@type": "Brand", name: "Learning English with Coach" },
          offers: (loaderData?.monthlyPlans ?? []).map((p) => ({
            "@type": "Offer",
            name: `${TIER_META[p.tier].label.pt} Mensal`,
            price: String(p.price_kz),
            priceCurrency: "AOA",
          })),
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
  const notify = useNotification();
  const [cycle, setCycle] = useState<Cycle>("monthly");
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: plans = [] } = useQuery({
    queryKey: ["subscription_plans"],
    queryFn: async () => {
      const data = await apiFetch<Plan[]>("/v1/plans");
      return data.map((p) => ({ ...p, features: p.features ?? [] }));
    },
  });

  const filtered = useMemo(() => plans.filter((p) => p.billing_cycle === cycle), [plans, cycle]);

  const handleSubscribe = (plan: Plan) => {
    if (!user) {
      notify.info(locale === "pt" ? "Precisa iniciar sessão" : "Sign in required");
      navigate({ to: "/auth" });
      return;
    }
    navigate({ to: "/checkout/$planId", params: { planId: plan.id } });
  };

  return (
    <div className="mt-16 min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-[1440px] px-4 py-12">
        <>
          <div className="mb-12 text-center">
            <h1 className="mt-4 font-display text-4xl font-bold md:text-5xl text-marketing-ink">
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
                  className={`rounded-full px-4 sm:px-7 py-2.5 text-2xs sm:text-2xs font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] transition-all duration-300 whitespace-nowrap ${
                    cycle === c
                      ? "bg-white text-marketing-ink shadow-flat-sm ring-1 ring-slate-100"
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

                  const orbColor =
                    plan.tier === "essential"
                      ? "bg-teal-400"
                      : plan.tier === "premium"
                        ? "bg-pink-400"
                        : "bg-indigo-400";
                  const ringColor =
                    plan.tier === "premium" ? "ring-pink-400/20" : "ring-slate-200/20";

                  return (
                    <div
                      key={plan.id}
                      className={`relative h-full w-full flex justify-center transition-all duration-300 ${
                        featured ? "z-[5]" : "z-[1]"
                      }`}
                    >
                      {/* Glassmorphic Orb Backdrop - Absolute positioned but pointer-events-none */}
                      <div
                        className={`orb absolute -inset-6 ${orbColor} rounded-full z-0 opacity-15 blur-[100px] pointer-events-none transition-opacity duration-700`}
                      />

                      {/* Glass Card - Unified elegant styles for all, elevation for featured */}
                      <div
                        className={`glass-card relative z-10 flex h-full flex-col p-8 w-full md:max-w-[420px] rounded-4xl bg-white/80 backdrop-blur-2xl border border-white/40 shadow-flat-md transition-all duration-500 lg:min-h-[600px] ${
                          featured ? `lg:-translate-y-10 ring-2 ${ringColor} shadow-flat-lg` : ""
                        }`}
                      >
                        {featured && (
                          <div className="absolute top-8 right-8 inline-flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border border-slate-100 shadow-sm z-20">
                            <Star className="h-3 w-3 fill-pink-500 text-pink-500" />
                            <span className="text-2xs font-black uppercase tracking-widest text-slate-600">
                              {locale === "pt" ? "MAIS POPULAR" : "MOST POPULAR"}
                            </span>
                          </div>
                        )}

                        <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-10 ring-1 ring-slate-100 relative overflow-hidden">
                          {featured && (
                            <div className="absolute inset-0 bg-gradient-to-br from-pink-400/20 to-orange-400/20" />
                          )}
                          <Icon
                            className={`h-8 w-8 relative z-10 ${plan.tier === "essential" ? "text-marketing-teal" : plan.tier === "premium" ? "text-pink-500" : "text-indigo-600"}`}
                          />
                        </div>

                        <h2 className="font-display text-3xl font-bold mb-2 text-marketing-ink">
                          {meta.label[locale]}
                        </h2>
                        <p className="text-sm text-slate-500 mb-10 leading-relaxed max-w-[280px]">
                          {meta.desc[locale]}
                        </p>

                        <div className="flex items-baseline gap-1 mb-1">
                          <span className="text-5xl sm:text-6xl font-black tracking-tighter text-marketing-ink">
                            {plan.price_kz.toLocaleString("pt-AO")}
                          </span>
                          <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                            Kz
                          </span>
                        </div>
                        <div className="text-2xs font-black uppercase tracking-[0.2em] text-slate-400 mb-10">
                          {plan.duration_days} {locale === "pt" ? "DIAS" : "DAYS"}
                        </div>

                        <div className="w-full h-px bg-slate-200/80 mb-10" />

                        <div className="flex-grow">
                          <p className="text-2xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6">
                            {locale === "pt" ? "O que está incluído:" : "What's included:"}
                          </p>
                          <ul className="space-y-4">
                            {plan.features.map((f, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-4 text-sm font-medium text-slate-600"
                              >
                                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                                <span>{f}</span>
                              </li>
                            ))}
                            {plan.call_minutes > 0 && (
                              <li className="flex items-start gap-4 text-sm font-bold text-marketing-ink">
                                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                                <span>
                                  {plan.call_minutes} min{" "}
                                  {locale === "pt" ? "com o professor" : "with the teacher"}
                                </span>
                              </li>
                            )}
                          </ul>
                        </div>

                        <Button
                          onClick={() => handleSubscribe(plan)}
                          className="mt-12 w-full py-8 px-6 bg-marketing-ink text-white text-xs font-bold uppercase tracking-[0.25em] rounded-full shadow-flat-btn transition-all hover:bg-slate-900 active:scale-95 overflow-hidden group/btn"
                          variant="default"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                          {locale === "pt" ? "Assinar Agora" : "Subscribe Now"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <p className="text-center mt-12 text-2xs font-bold uppercase tracking-[0.2em] text-slate-400">
            {locale === "pt"
              ? "Pagamento Seguro via Multicaixa Express"
              : "Secure Payment via Multicaixa Express"}
          </p>
        </>
      </div>
      <SiteFooter />
    </div>
  );
}
