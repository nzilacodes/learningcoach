import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, BarChart3, CreditCard } from "lucide-react";

function csvDownload(name: string, rows: Record<string, any>[]) {
  if (!rows.length) return;
  const cols = Object.keys(rows[0]);
  const esc = (v: any) => {
    if (v == null) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* -------- Subscriptions manager -------- */
export function SubscriptionsSection() {
  const { data = [], refetch } = useQuery({
    queryKey: ["admin_subscriptions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("id,user_id,status,starts_at,expires_at,activation_code,subscription_plans(tier,billing_cycle,duration_days)")
        .order("created_at", { ascending: false })
        .limit(200);
      const ids = Array.from(new Set((data ?? []).map((s: any) => s.user_id)));
      const profiles: Record<string, any> = {};
      if (ids.length) {
        const { data: profs } = await supabase.from("profiles").select("id,full_name,email").in("id", ids);
        for (const p of profs ?? []) profiles[p.id] = p;
      }
      return (data ?? []).map((s: any) => ({ ...s, profile: profiles[s.user_id] }));
    },
  });

  const cancelSub = async (id: string) => {
    await supabase.from("subscriptions").update({ status: "cancelled" }).eq("id", id);
    refetch();
  };

  return (
    <div className="mt-10 rounded-2xl border border-border bg-card shadow-card">
      <div className="border-b border-border px-6 py-4 flex items-center justify-between">
        <h2 className="font-display text-xl font-bold flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-magenta" /> Assinaturas
        </h2>
        <Button size="sm" variant="outline" onClick={() => csvDownload("subscriptions", data.map((s: any) => ({
          learner: s.profile?.full_name, email: s.profile?.email,
          tier: s.subscription_plans?.tier, cycle: s.subscription_plans?.billing_cycle,
          status: s.status, starts_at: s.starts_at, expires_at: s.expires_at, code: s.activation_code,
        })))}>
          <Download className="h-3.5 w-3.5 mr-1" /> CSV
        </Button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aluno</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Início</TableHead>
              <TableHead>Expira</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">Sem assinaturas</TableCell>
              </TableRow>
            )}
            {data.map((s: any) => (
              <TableRow key={s.id}>
                <TableCell>
                  <div className="font-medium">{s.profile?.full_name ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">{s.profile?.email}</div>
                </TableCell>
                <TableCell className="capitalize">{s.subscription_plans?.tier} · {s.subscription_plans?.billing_cycle}</TableCell>
                <TableCell><Badge variant={s.status === "active" ? "default" : "outline"} className="capitalize">{s.status}</Badge></TableCell>
                <TableCell className="text-xs">{s.starts_at ? new Date(s.starts_at).toLocaleDateString() : "—"}</TableCell>
                <TableCell className="text-xs">{s.expires_at ? new Date(s.expires_at).toLocaleDateString() : "—"}</TableCell>
                <TableCell><code className="text-xs">{s.activation_code ?? "—"}</code></TableCell>
                <TableCell>
                  {s.status === "active" && (
                    <Button size="sm" variant="outline" onClick={() => cancelSub(s.id)}>Cancelar</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

/* -------- Analytics (last 30 days: signups + revenue) -------- */
export function AnalyticsSection() {
  const { data } = useQuery({
    queryKey: ["admin_analytics_30d"],
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 86400000);
      const [{ data: profs }, { data: pays }] = await Promise.all([
        supabase.from("profiles").select("created_at").gte("created_at", since.toISOString()),
        supabase.from("payments").select("paid_at,amount_kz,status").eq("status", "paid").gte("paid_at", since.toISOString()),
      ]);
      const days: Record<string, { signups: number; revenue: number }> = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
        days[d] = { signups: 0, revenue: 0 };
      }
      for (const p of profs ?? []) {
        const k = new Date(p.created_at).toISOString().slice(0, 10);
        if (days[k]) days[k].signups++;
      }
      for (const p of pays ?? []) {
        const k = p.paid_at ? new Date(p.paid_at).toISOString().slice(0, 10) : null;
        if (k && days[k]) days[k].revenue += p.amount_kz ?? 0;
      }
      return Object.entries(days).map(([day, v]) => ({ day, ...v }));
    },
  });

  const totalSignups = data?.reduce((a, b) => a + b.signups, 0) ?? 0;
  const totalRevenue = data?.reduce((a, b) => a + b.revenue, 0) ?? 0;
  const maxSignups = Math.max(1, ...(data ?? []).map((d) => d.signups));
  const maxRevenue = Math.max(1, ...(data ?? []).map((d) => d.revenue));

  return (
    <div className="mt-10 rounded-2xl border border-border bg-card shadow-card">
      <div className="border-b border-border px-6 py-4 flex items-center justify-between">
        <h2 className="font-display text-xl font-bold flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-violet" /> Analytics — últimos 30 dias
        </h2>
        <div className="flex gap-4 text-xs">
          <span><b>{totalSignups}</b> novos alunos</span>
          <span><b>{totalRevenue.toLocaleString("pt-AO")}</b> Kz</span>
        </div>
      </div>
      <div className="p-6">
        <div className="mb-4">
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Novos registos por dia</div>
          <div className="flex items-end gap-1 h-24">
            {(data ?? []).map((d) => (
              <div key={d.day} className="flex-1 group relative">
                <div
                  className="bg-magenta/70 rounded-t hover:bg-magenta transition-colors"
                  style={{ height: `${(d.signups / maxSignups) * 100}%`, minHeight: d.signups ? "2px" : "0" }}
                  title={`${d.day}: ${d.signups} registos`}
                />
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Receita diária (Kz)</div>
          <div className="flex items-end gap-1 h-24">
            {(data ?? []).map((d) => (
              <div key={d.day} className="flex-1">
                <div
                  className="bg-gradient-to-t from-sunset to-amber rounded-t"
                  style={{ height: `${(d.revenue / maxRevenue) * 100}%`, minHeight: d.revenue ? "2px" : "0" }}
                  title={`${d.day}: ${d.revenue.toLocaleString()} Kz`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------- Reports (CSV exports) -------- */
export function ReportsSection() {
  const exportUsers = async () => {
    const { data } = await supabase.from("profiles").select("full_name,email,phone,country,age,cefr_level,onboarding_status,created_at").limit(5000);
    csvDownload("users", data ?? []);
  };
  const exportPayments = async () => {
    const { data } = await supabase.from("payments").select("user_id,amount_kz,status,reference,paid_at,created_at").limit(5000);
    csvDownload("payments", data ?? []);
  };
  const exportDiagnostics = async () => {
    const { data } = await supabase.from("diagnostic_results").select("user_id,cefr_level,grammar_score,vocabulary_score,reading_score,listening_score,writing_score,speaking_score,pronunciation_score,created_at").limit(5000);
    csvDownload("diagnostics", data ?? []);
  };

  return (
    <div className="mt-10 rounded-2xl border border-border bg-card shadow-card p-6">
      <h2 className="font-display text-xl font-bold flex items-center gap-2 mb-4">
        <Download className="h-5 w-5 text-emerald-500" /> Relatórios
      </h2>
      <p className="text-sm text-muted-foreground mb-4">Exportar dados em CSV para análise externa.</p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={exportUsers}><Download className="h-3.5 w-3.5 mr-1" /> Utilizadores</Button>
        <Button variant="outline" size="sm" onClick={exportPayments}><Download className="h-3.5 w-3.5 mr-1" /> Pagamentos</Button>
        <Button variant="outline" size="sm" onClick={exportDiagnostics}><Download className="h-3.5 w-3.5 mr-1" /> Diagnósticos</Button>
      </div>
    </div>
  );
}
