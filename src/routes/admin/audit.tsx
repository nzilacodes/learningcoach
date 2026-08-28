import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ShieldCheck, ShieldAlert, Lock, AlertTriangle, Activity, Ban, Search } from "lucide-react";
import { useNotification } from "@/lib/notifications/notification-provider";

export type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };

export type AuditLog = {
  id: string;
  user_id: string | null;
  actor_email: string | null;
  action: string;
  entity: string | null;
  entity_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  severity: string;
  metadata: JsonValue;
  created_at: string;
};

export type LoginAttempt = {
  id: string;
  email: string;
  ip_address: string | null;
  user_agent: string | null;
  success: boolean;
  reason: string | null;
  created_at: string;
};

export type Lockout = {
  id: string;
  email: string;
  ip_address: string | null;
  reason: string;
  locked_until: string;
  created_at: string;
};

type SecuritySummary = {
  total_events_24h: number;
  failed_logins_24h: number;
  active_lockouts: number;
  critical_events_7d: number;
  suspicious_ips: { ip_address: string; attempts: number }[];
  recent_lockouts: Lockout[];
};

export const Route = createFileRoute("/admin/audit")({
  component: AdminAuditPage,
  head: () => ({
    meta: [{ title: "Auditoria — Admin" }, { name: "robots", content: "noindex, nofollow" }],
  }),
});

function fmtDate(s: string) {
  return new Date(s).toLocaleString("pt-PT");
}

function AdminAuditPage() {
  const { user, isAdmin } = useAuth();
  const notify = useNotification();
  const [summary, setSummary] = useState<SecuritySummary | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [attempts, setAttempts] = useState<LoginAttempt[]>([]);
  const [lockouts, setLockouts] = useState<Lockout[]>([]);
  const [query, setQuery] = useState("");
  const [dataLoading, setDataLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const load = () => {
    setDataLoading(true);
    setLoadError(false);
    // Promise.allSettled (not .all with per-call .catch fallbacks) so a
    // failure is actually detectable — swallowing every rejection into a
    // fallback value before Promise.all sees it would let a total fetch
    // failure render as a normal-looking, fully-empty dashboard.
    Promise.allSettled([
      apiFetch<SecuritySummary>("/v1/admin/security-summary"),
      apiFetch<AuditLog[]>("/v1/admin/audit-logs"),
      apiFetch<LoginAttempt[]>("/v1/admin/login-attempts"),
      apiFetch<Lockout[]>("/v1/admin/lockouts"),
    ])
      .then(([s, l, a, k]) => {
        if (s.status === "fulfilled") setSummary(s.value);
        if (l.status === "fulfilled") setLogs(l.value);
        if (a.status === "fulfilled") setAttempts(a.value);
        if (k.status === "fulfilled") setLockouts(k.value);
        if ([s, l, a, k].some((r) => r.status === "rejected")) {
          setLoadError(true);
          notify.error("Falha ao carregar alguns dados de auditoria.");
        }
      })
      .finally(() => setDataLoading(false));
  };

  useEffect(() => {
    if (user && isAdmin) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAdmin]);

  const filteredLogs = logs.filter(
    (l) =>
      !query ||
      `${l.action} ${l.actor_email ?? ""} ${l.entity ?? ""}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );

  function sevBadge(s: string) {
    if (s === "critical") return <Badge variant="destructive">crítico</Badge>;
    if (s === "warning") return <Badge className="bg-amber-500 text-white">aviso</Badge>;
    return <Badge variant="secondary">info</Badge>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 font-display text-2xl font-bold text-ink">
          <ShieldCheck className="h-6 w-6 text-emerald-500" />
          Painel de Auditoria & Segurança
        </h2>
        <p className="text-sm text-muted-foreground">
          Monitorização de acessos, eventos críticos e deteção de brute-force.
        </p>
      </div>

      {loadError && !dataLoading && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <span>Alguns dados de auditoria não puderam ser carregados.</span>
          <Button size="sm" variant="outline" onClick={load}>
            Tentar novamente
          </Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          icon={<Activity className="h-5 w-5" />}
          label="Eventos (24h)"
          value={summary?.total_events_24h ?? 0}
        />
        <Kpi
          icon={<ShieldAlert className="h-5 w-5 text-red-500" />}
          label="Falhas login (24h)"
          value={summary?.failed_logins_24h ?? 0}
        />
        <Kpi
          icon={<Lock className="h-5 w-5 text-amber-500" />}
          label="Bloqueios ativos"
          value={summary?.active_lockouts ?? 0}
        />
        <Kpi
          icon={<AlertTriangle className="h-5 w-5 text-orange-500" />}
          label="Críticos (7 dias)"
          value={summary?.critical_events_7d ?? 0}
        />
      </div>

      {summary?.suspicious_ips && summary.suspicious_ips.length > 0 && (
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-red-600 dark:text-red-400">
              <Ban className="h-5 w-5" /> IPs suspeitos (últimas 24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {summary.suspicious_ips.map((ip) => (
                <Badge key={ip.ip_address} variant="destructive" className="font-mono">
                  {ip.ip_address} · {ip.attempts} tentativas
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="logs">
        <TabsList>
          <TabsTrigger value="logs">Logs de Auditoria</TabsTrigger>
          <TabsTrigger value="attempts">Tentativas de Login</TabsTrigger>
          <TabsTrigger value="lockouts">Bloqueios</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base">Eventos ({filteredLogs.length})</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Filtrar..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Utilizador</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Entidade</TableHead>
                    <TableHead>Severidade</TableHead>
                    <TableHead>IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="whitespace-nowrap text-xs">
                        {fmtDate(l.created_at)}
                      </TableCell>
                      <TableCell className="text-xs">{l.actor_email ?? "—"}</TableCell>
                      <TableCell className="font-medium">{l.action}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {l.entity ?? "—"}
                        {l.entity_id ? `#${l.entity_id.slice(0, 8)}` : ""}
                      </TableCell>
                      <TableCell>{sevBadge(l.severity)}</TableCell>
                      <TableCell className="font-mono text-xs">{l.ip_address ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                  {filteredLogs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        Sem eventos.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attempts" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Últimas 100 tentativas</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Sucesso</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attempts.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="whitespace-nowrap text-xs">
                        {fmtDate(a.created_at)}
                      </TableCell>
                      <TableCell className="text-xs">{a.email}</TableCell>
                      <TableCell>
                        {a.success ? (
                          <Badge className="bg-emerald-500 text-white">OK</Badge>
                        ) : (
                          <Badge variant="destructive">Falha</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {a.reason ?? "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{a.ip_address ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                  {attempts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Sem tentativas.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lockouts" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Contas bloqueadas</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Até</TableHead>
                    <TableHead>IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lockouts.map((l) => {
                    const active = new Date(l.locked_until) > new Date();
                    return (
                      <TableRow key={l.id}>
                        <TableCell className="whitespace-nowrap text-xs">
                          {fmtDate(l.created_at)}
                        </TableCell>
                        <TableCell className="text-xs">{l.email}</TableCell>
                        <TableCell>{l.reason}</TableCell>
                        <TableCell className="text-xs">
                          {fmtDate(l.locked_until)}{" "}
                          {active && (
                            <Badge variant="destructive" className="ml-2">
                              ativo
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{l.ip_address ?? "—"}</TableCell>
                      </TableRow>
                    );
                  })}
                  {lockouts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Sem bloqueios.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="bg-muted/30">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-5 w-5 text-emerald-500" /> Camadas de segurança ativas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 text-sm sm:grid-cols-2">
            <li>
              ✅ <b>JWT</b> — sessões assinadas pelo backend (jose), em cookies HttpOnly
            </li>
            <li>
              ✅ <b>HTTPS</b> — TLS forçado em todas as ligações
            </li>
            <li>
              ✅ <b>Autorização no backend</b> — cada rota admin exige papel verificado no servidor
            </li>
            <li>
              ✅ <b>Proteção SQL Injection</b> — queries parametrizadas via postgres.js
            </li>
            <li>
              ✅ <b>Proteção XSS</b> — escaping automático React + CSP
            </li>
            <li>
              ✅ <b>Proteção CSRF</b> — token de dupla submissão (cookie + header) + SameSite
              cookies
            </li>
            <li>
              ✅ <b>Password hashing</b> — bcrypt (custo 12) + regras mínimas de complexidade
            </li>
            <li>
              ✅ <b>Backups automáticos</b> — snapshots diários da BD
            </li>
            <li>
              ✅ <b>Auto-lock</b> — 5 tentativas em 15 min → 15 min bloqueado
            </li>
            <li>
              ✅ <b>Auditoria</b> — todos os eventos críticos registados
            </li>
            <li>
              ✅ <b>Deteção suspeita</b> — IPs com falhas recorrentes
            </li>
            <li>
              ✅ <b>Sessões seguras</b> — refresh tokens rotativos
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          {icon}
          <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
        </div>
        <div className="mt-2 font-display text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
