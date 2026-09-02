import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  CreditCard,
  Clock,
  DollarSign,
  BookOpen,
  Wallet,
  TrendingUp,
  Gauge,
  Award,
  ShieldCheck,
  Download,
  ArrowRight,
  FileWarning,
} from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";
import { useLocale } from "@/lib/i18n";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/admin/")({
  component: AdminOverview,
  head: () => ({
    meta: [{ title: "Visão geral — Admin" }, { name: "robots", content: "noindex, nofollow" }],
  }),
});

type AdminStats = {
  totalUsers: number;
  activeSubscriptions: number;
  pendingPayments: number;
  monthRevenue: number;
};
type ReviewSummaryRow = { lesson_id: string; draft: number; in_review: number; published: number };

const QUICK_LINKS = [
  { to: "/admin/users", Icon: Users, label: { pt: "Alunos", en: "Learners" } },
  { to: "/admin/payments", Icon: CreditCard, label: { pt: "Pagamentos", en: "Payments" } },
  { to: "/admin/subscriptions", Icon: Wallet, label: { pt: "Assinaturas", en: "Subscriptions" } },
  { to: "/admin/certificates", Icon: Award, label: { pt: "Certificados", en: "Certificates" } },
  { to: "/admin/curriculum", Icon: BookOpen, label: { pt: "Currículo", en: "Curriculum" } },
  { to: "/admin/performance", Icon: Gauge, label: { pt: "Desempenho", en: "Performance" } },
  { to: "/admin/analytics", Icon: TrendingUp, label: { pt: "Analytics", en: "Analytics" } },
  { to: "/admin/audit", Icon: ShieldCheck, label: { pt: "Auditoria", en: "Audit" } },
  { to: "/admin/reports", Icon: Download, label: { pt: "Relatórios", en: "Reports" } },
] as const;

function AdminOverview() {
  const { locale } = useLocale();
  const { user, isAdmin } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["admin_stats"],
    enabled: !!user && isAdmin,
    queryFn: () => apiFetch<AdminStats>("/v1/admin/stats"),
  });
  const { data: reviewSummary = [] } = useQuery({
    queryKey: ["admin_review_summary"],
    enabled: !!user && isAdmin,
    queryFn: () => apiFetch<ReviewSummaryRow[]>("/v1/admin/exercises/review-summary"),
  });
  const pendingReview = reviewSummary.reduce((sum, r) => sum + r.draft + r.in_review, 0);

  const statCards = [
    {
      icon: Users,
      label: locale === "pt" ? "Total de alunos" : "Total learners",
      value: stats?.totalUsers ?? 0,
      color: "text-sunset bg-sunset/10",
    },
    {
      icon: CreditCard,
      label: locale === "pt" ? "Assinaturas ativas" : "Active subs",
      value: stats?.activeSubscriptions ?? 0,
      color: "text-magenta bg-magenta/10",
    },
    {
      icon: Clock,
      label: locale === "pt" ? "Pagamentos pendentes" : "Pending payments",
      value: stats?.pendingPayments ?? 0,
      color: "text-amber bg-amber/10",
    },
    {
      icon: DollarSign,
      label: locale === "pt" ? "Receita (mês)" : "Revenue (month)",
      value: `${(stats?.monthRevenue ?? 0).toLocaleString("pt-AO")} Kz`,
      color: "text-violet bg-violet/10",
    },
    {
      icon: FileWarning,
      label: locale === "pt" ? "Conteúdo por rever" : "Content to review",
      value: pendingReview,
      color: "text-red-500 bg-red-50",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs font-bold uppercase tracking-widest text-magenta">Admin</div>
        <h2 className="mt-1 font-display text-2xl font-bold text-ink md:text-3xl">
          {locale === "pt" ? "Visão geral" : "Overview"}
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((s) => (
          <Card key={s.label} className="rounded-2xl border-gray-100 bg-white p-5 shadow-none">
            <div
              className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${s.color}`}
            >
              <s.icon className="h-5 w-5" />
            </div>
            <div className="mt-3 text-2xl font-bold text-ink">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </Card>
        ))}
      </div>

      <div>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">
          {locale === "pt" ? "Janelas" : "Windows"}
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="group flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-5 transition-all hover:shadow-lg"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet/5 text-violet">
                  <l.Icon className="h-5 w-5" />
                </span>
                <span className="font-display font-bold text-ink">
                  {locale === "pt" ? l.label.pt : l.label.en}
                </span>
              </span>
              <ArrowRight className="h-4 w-4 text-gray-300 transition-transform group-hover:translate-x-1 group-hover:text-violet" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
