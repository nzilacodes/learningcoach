import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  Users,
  DollarSign,
  Calendar,
  TrendingUp,
  Clock,
  Target,
  UserCheck,
  UserX,
  FileSpreadsheet,
  FileText,
  ShieldCheck,
  AlertTriangle,
  Loader2,
} from "lucide-react";
export type AnalyticsData = {
  students: number;
  active_7: number;
  active_30: number;
  revenue_total: number;
  revenue_month: number;
  revenue_year: number;
  avg_study_min: number;
  completion_rate: number;
  dropout_rate: number;
  retention_rate: number;
  revenue_series: { month: string; amount: number }[];
  students_series: { month: string; count: number }[];
  activity_series: { day: string; seconds: number; users: number }[];
  plans: { name: string; tier: string; orders: number; revenue: number }[];
  methods: { method: string; count: number; revenue: number }[];
};
import { useNotification } from "@/lib/notifications/notification-provider";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";

export const Route = createFileRoute("/analytics")({
  component: AnalyticsPage,
  head: () => ({
    meta: [
      { title: "Analytics — Coach" },
      {
        name: "description",
        content: "Painel administrativo com métricas completas da plataforma.",
      },
    ],
  }),
});

const COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-chart-6)",
];

function fmtKz(n: number) {
  return new Intl.NumberFormat("pt-PT").format(n) + " Kz";
}

function AnalyticsPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const notify = useNotification();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [authLoading, user, navigate]);

  const load = () => {
    setLoading(true);
    setError(false);
    apiFetch<AnalyticsData>("/v1/admin/analytics?days=30")
      .then((d) => setData(d))
      .catch((e) => {
        setError(true);
        notify.fromError(e, { dedupeKey: "analytics:load" });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!authLoading && user && isAdmin) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, isAdmin]);

  function exportExcel() {
    if (!data) return;
    const wb = XLSX.utils.book_new();
    const summary = [
      ["Métrica", "Valor"],
      ["Total de alunos", data.students],
      ["Ativos (7 dias)", data.active_7],
      ["Ativos (30 dias)", data.active_30],
      ["Receita total (Kz)", data.revenue_total],
      ["Receita do mês (Kz)", data.revenue_month],
      ["Receita do ano (Kz)", data.revenue_year],
      ["Tempo médio de estudo (min)", data.avg_study_min],
      ["Taxa de retenção (%)", data.retention_rate],
      ["Taxa de conclusão (%)", data.completion_rate],
      ["Taxa de abandono (%)", data.dropout_rate],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), "Resumo");
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(data.revenue_series),
      "Receita Mensal",
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(data.students_series),
      "Novos Alunos",
    );
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.activity_series), "Atividade");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.plans), "Planos");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.methods), "Métodos");
    XLSX.writeFile(wb, `analytics_${new Date().toISOString().slice(0, 10)}.xlsx`);
    notify.success("Excel exportado");
  }

  function exportPDF() {
    if (!data) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Relatório de Analytics — Coach", 14, 20);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString("pt-PT")}`, 14, 28);

    doc.setFontSize(14);
    doc.text("Resumo", 14, 40);
    doc.setFontSize(11);
    const rows: [string, string][] = [
      ["Total de alunos", String(data.students)],
      ["Ativos (7 dias)", String(data.active_7)],
      ["Ativos (30 dias)", String(data.active_30)],
      ["Receita total", fmtKz(data.revenue_total)],
      ["Receita do mês", fmtKz(data.revenue_month)],
      ["Receita do ano", fmtKz(data.revenue_year)],
      ["Tempo médio de estudo", `${data.avg_study_min} min`],
      ["Taxa de retenção", `${data.retention_rate}%`],
      ["Taxa de conclusão", `${data.completion_rate}%`],
      ["Taxa de abandono", `${data.dropout_rate}%`],
    ];
    let y = 50;
    rows.forEach(([k, v]) => {
      doc.text(k, 14, y);
      doc.text(v, 120, y);
      y += 7;
    });

    y += 6;
    doc.setFontSize(14);
    doc.text("Receita mensal (últimos 12 meses)", 14, y);
    y += 8;
    doc.setFontSize(10);
    data.revenue_series.forEach((r) => {
      doc.text(`${r.month}`, 14, y);
      doc.text(fmtKz(Number(r.amount)), 120, y);
      y += 6;
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save(`analytics_${new Date().toISOString().slice(0, 10)}.pdf`);
    notify.success("PDF exportado");
  }

  if (authLoading)
    return (
      <div className="flex items-center justify-center gap-2 p-10 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> A carregar…
      </div>
    );

  if (user && !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-lg px-6 py-20 text-center">
          <ShieldCheck className="mx-auto h-12 w-12 text-primary" />
          <h1 className="mt-4 font-display text-2xl font-bold">Acesso restrito</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Esta área é apenas para administradores. Se acredita que devia ter acesso, contacte o
            Coach.
          </p>
          <Button asChild className="mt-6">
            <Link to="/dashboard">Ir para o painel</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold">Analytics</h1>
            <p className="text-sm text-muted-foreground">Métricas completas da plataforma</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportExcel} disabled={!data}>
              <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
            </Button>
            <Button variant="outline" onClick={exportPDF} disabled={!data}>
              <FileText className="mr-2 h-4 w-4" /> PDF
            </Button>
          </div>
        </div>

        {error && !loading ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-10 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-destructive">
              Não foi possível carregar os dados de analytics.
            </p>
            <Button size="sm" variant="outline" onClick={load}>
              Tentar novamente
            </Button>
          </div>
        ) : loading || !data ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                icon={<Users className="h-5 w-5" />}
                label="Alunos"
                value={data.students.toString()}
                sub={`${data.active_30} ativos (30d)`}
              />
              <KpiCard
                icon={<DollarSign className="h-5 w-5" />}
                label="Receita total"
                value={fmtKz(data.revenue_total)}
              />
              <KpiCard
                icon={<Calendar className="h-5 w-5" />}
                label="Receita do mês"
                value={fmtKz(data.revenue_month)}
              />
              <KpiCard
                icon={<TrendingUp className="h-5 w-5" />}
                label="Receita do ano"
                value={fmtKz(data.revenue_year)}
              />
              <KpiCard
                icon={<Clock className="h-5 w-5" />}
                label="Tempo médio estudo"
                value={`${data.avg_study_min} min`}
                sub="por sessão (30d)"
              />
              <KpiCard
                icon={<UserCheck className="h-5 w-5" />}
                label="Retenção"
                value={`${data.retention_rate}%`}
                sub="ativos / total"
              />
              <KpiCard
                icon={<Target className="h-5 w-5" />}
                label="Conclusão"
                value={`${data.completion_rate}%`}
                sub="lições completas"
              />
              <KpiCard
                icon={<UserX className="h-5 w-5" />}
                label="Abandono"
                value={`${data.dropout_rate}%`}
              />
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <ChartCard title="Receita mensal (12 meses)">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data.revenue_series}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="month" fontSize={11} />
                    <YAxis fontSize={11} />
                    <Tooltip formatter={(v: number) => fmtKz(Number(v))} />
                    <Bar dataKey="amount" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Novos alunos por mês">
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={data.students_series}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="month" fontSize={11} />
                    <YAxis fontSize={11} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Atividade diária (30 dias)">
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={data.activity_series}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="day" fontSize={10} />
                    <YAxis fontSize={11} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="users"
                      name="Utilizadores"
                      stroke="#10b981"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="seconds"
                      name="Segundos"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Receita por plano">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={data.plans} dataKey="revenue" nameKey="name" outerRadius={100} label>
                      {data.plans.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => fmtKz(Number(v))} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <ChartCard title="Métodos de pagamento">
                <div className="space-y-2">
                  {data.methods.map((m) => (
                    <div
                      key={m.method}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <div className="font-medium capitalize">{m.method.replace("_", " ")}</div>
                        <div className="text-xs text-muted-foreground">{m.count} transações</div>
                      </div>
                      <div className="text-right font-semibold">{fmtKz(Number(m.revenue))}</div>
                    </div>
                  ))}
                </div>
              </ChartCard>

              <ChartCard title="Desempenho por plano">
                <div className="space-y-2">
                  {data.plans.map((p) => (
                    <div
                      key={p.name}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-muted-foreground uppercase">
                          {p.tier} · {p.orders} pedidos
                        </div>
                      </div>
                      <div className="text-right font-semibold">{fmtKz(Number(p.revenue))}</div>
                    </div>
                  ))}
                </div>
              </ChartCard>
            </div>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          {icon}
          <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
        </div>
        <div className="mt-2 font-display text-2xl font-bold">{value}</div>
        {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
