import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, CheckCircle2, Crown, Sparkles, Star } from "lucide-react";
import { useNotification } from "@/lib/notifications/notification-provider";
import { LandingSiteHeader } from "@/components/landing-site-header";
import { SiteFooter } from "@/components/site-footer";
import { useLocale } from "@/lib/i18n";
import { apiFetch } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";
import { SITE_URL } from "@/lib/site-url";
import "@/styles/landing-pricing.css";

export const Route = createFileRoute("/pricing")({
  loader: async () => {
    const plans = await apiFetch<Plan[]>("/v1/plans").catch(() => []);
    return {
      plans: plans.map((p) => ({ ...p, features: p.features ?? [] })),
      monthlyPlans: plans.filter((p) => p.billing_cycle === "monthly"),
    };
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
    icon: typeof Sparkles;
    label: { pt: string; en: string };
    desc: { pt: string; en: string };
  }
> = {
  essential: {
    icon: Sparkles,
    label: { pt: "Essencial", en: "Essential" },
    desc: {
      pt: "Base sólida de inglês para iniciantes.",
      en: "Foundational English for beginners.",
    },
  },
  premium: {
    icon: Star,
    label: { pt: "Premium", en: "Premium" },
    desc: {
      pt: "Ferramentas avançadas para falantes intermediários.",
      en: "Advanced tools for intermediate speakers.",
    },
  },
  vip: {
    icon: Crown,
    label: { pt: "VIP Elite", en: "VIP Elite" },
    desc: {
      pt: "Mestria sem limites para utilizadores exigentes.",
      en: "Unrestricted mastery for power users.",
    },
  },
};

const TIER_ORDER: Record<Tier, number> = {
  essential: 0,
  premium: 1,
  vip: 2,
};

const CYCLE_LABEL: Record<Cycle, { pt: string; en: string }> = {
  monthly: { pt: "Mensal", en: "Monthly" },
  quarterly: { pt: "Trimestral", en: "Quarterly" },
  semiannual: { pt: "Semestral", en: "Semiannual" },
};

function PricingPage() {
  const { locale } = useLocale();
  const { plans: loaderPlans = [] } = Route.useLoaderData();
  const notify = useNotification();
  const [cycle, setCycle] = useState<Cycle>("monthly");
  const { user } = useAuth();
  const navigate = useNavigate();

  const {
    data: plans = loaderPlans,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["subscription_plans"],
    queryFn: async () => {
      const data = await apiFetch<Plan[]>("/v1/plans");
      return data.map((p) => ({ ...p, features: p.features ?? [] }));
    },
    initialData: loaderPlans,
    staleTime: 30_000,
  });

  const filtered = useMemo(
    () =>
      plans
        .filter((p) => p.billing_cycle === cycle)
        .sort((a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier]),
    [plans, cycle],
  );

  const handleSubscribe = (plan: Plan) => {
    if (!user) {
      notify.info(locale === "pt" ? "Precisa iniciar sessão" : "Sign in required");
      navigate({ to: "/auth" });
      return;
    }
    navigate({ to: "/checkout/$planId", params: { planId: plan.id } });
  };

  const totalPlans = String(Math.max(filtered.length, 3)).padStart(2, "0");

  return (
    <div className="lewc-pricing-shell">
      <LandingSiteHeader />
      <main className="lewc-pricing-page">
        <div className="lewc-pricing-content">
          <section className="lewc-pricing-billing" aria-label={locale === "pt" ? "Ciclo de pagamento" : "Payment cycle"}>
            <div className="lewc-pricing-toggle" role="group">
              {(["monthly", "quarterly", "semiannual"] as Cycle[]).map((option) => {
                const active = cycle === option;
                return (
                  <button
                    key={option}
                    type="button"
                    className={active ? "is-active" : ""}
                    aria-pressed={active}
                    onClick={() => setCycle(option)}
                  >
                    {CYCLE_LABEL[option][locale]}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="lewc-pricing-heading" aria-labelledby="pricing-heading">
            <h1 id="pricing-heading">
              {locale === "pt" ? "Encontra o " : "Find your "}
              <span>{locale === "pt" ? "teu plano" : "plan"}</span>
            </h1>
            <p>
              {locale === "pt"
                ? "Começa com a base certa. Evolui com ferramentas que acompanham o teu nível."
                : "Start with the right foundation. Grow with tools that follow your level."}
            </p>
          </section>

          {isLoading && plans.length === 0 ? (
            <div className="lewc-pricing-empty" role="status">
              {locale === "pt" ? "A carregar planos..." : "Loading plans..."}
            </div>
          ) : (isError && filtered.length === 0) || filtered.length === 0 ? (
            <div className="lewc-pricing-empty" role="status">
              {locale === "pt"
                ? "Não foi possível carregar os planos neste momento."
                : "Plans are unavailable right now."}
            </div>
          ) : (
            <section className="lewc-pricing-grid" aria-label={locale === "pt" ? "Planos disponíveis" : "Available plans"}>
              {filtered.map((plan, index) => {
                const meta = TIER_META[plan.tier];
                const Icon = meta.icon;
                const featured = plan.tier === "premium";
                const iconClass =
                  plan.tier === "premium"
                    ? "is-premium"
                    : plan.tier === "vip"
                      ? "is-vip"
                      : "";

                return (
                  <article
                    key={plan.id}
                    className={`lewc-pricing-card${featured ? " is-featured" : ""}`}
                  >
                    {featured && (
                      <span className="lewc-pricing-popular">
                        {locale === "pt" ? "Mais popular" : "Most popular"}
                      </span>
                    )}

                    <div className="lewc-pricing-card-top">
                      <span className="lewc-pricing-card-index">
                        {String(index + 1).padStart(2, "0")} / {totalPlans}
                      </span>
                      <span className={`lewc-pricing-card-icon ${iconClass}`} aria-hidden="true">
                        <Icon size={18} strokeWidth={2.1} />
                      </span>
                    </div>

                    <h2 className="lewc-pricing-card-title">{meta.label[locale]}</h2>
                    <p className="lewc-pricing-card-description">{meta.desc[locale]}</p>

                    <div className="lewc-pricing-card-price">
                      <strong>{plan.price_kz.toLocaleString("pt-AO")}</strong>
                      <span>Kz</span>
                    </div>
                    <div className="lewc-pricing-card-days">
                      {plan.duration_days} {locale === "pt" ? "dias" : "days"}
                    </div>

                    <div className="lewc-pricing-card-rule" />
                    <p className="lewc-pricing-card-included">
                      {locale === "pt" ? "O que está incluído" : "What's included"}
                    </p>

                    <ul className="lewc-pricing-card-features">
                      {plan.features.map((feature, featureIndex) => (
                        <li className="lewc-pricing-card-feature" key={`${plan.id}-feature-${featureIndex}`}>
                          <Check size={14} strokeWidth={2.4} aria-hidden="true" />
                          <span>{feature}</span>
                        </li>
                      ))}
                      {plan.call_minutes > 0 && (
                        <li className="lewc-pricing-card-feature">
                          <Check size={14} strokeWidth={2.4} aria-hidden="true" />
                          <span>
                            {plan.call_minutes} min {locale === "pt" ? "com o professor" : "with the teacher"}
                          </span>
                        </li>
                      )}
                    </ul>

                    <button
                      type="button"
                      className="lewc-pricing-card-cta"
                      onClick={() => handleSubscribe(plan)}
                    >
                      {locale === "pt" ? "Assinar agora" : "Subscribe now"} <span aria-hidden="true">→</span>
                    </button>
                  </article>
                );
              })}
            </section>
          )}

          {!isLoading && !isError && filtered.length > 0 && (
            <p className="lewc-pricing-secure">
              <CheckCircle2 size={14} strokeWidth={2.2} aria-hidden="true" />
              {locale === "pt"
                ? "Pagamento seguro via Multicaixa Express"
                : "Secure payment via Multicaixa Express"}
            </p>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
