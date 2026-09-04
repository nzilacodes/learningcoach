import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Award,
  ShieldCheck,
  ShieldX,
  GraduationCap,
  Upload,
  BadgeCheck,
  Plus,
  Copy,
  MoreVertical,
  Lightbulb,
  ExternalLink,
  Search,
} from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";
import { useLocale } from "@/lib/i18n";
import { useNotification } from "@/lib/notifications/notification-provider";
import { CEFR_LEVELS } from "@/lib/level-access";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AdminDataTable, type AdminDataTableColumn } from "@/components/admin/admin-data-table";

type AdminCertificate = {
  id: string;
  user_id: string;
  level: string;
  score: number | null;
  course_title: string | null;
  verification_code: string;
  issued_at: string;
  revoked_at: string | null;
  revoked_reason: string | null;
  full_name: string | null;
  email: string;
};

type AdminUser = { id: string; full_name: string | null; email: string | null };

type VerifyResult = {
  verification_code: string;
  full_name: string | null;
  level: string;
  course_title: string | null;
  score: number | null;
  issued_at: string;
  valid: boolean;
};

function initials(name: string | null, email: string) {
  const source = (name?.trim() || email || "?").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

function relativeDays(iso: string, locale: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return locale === "pt" ? "hoje" : "today";
  if (days === 1) return locale === "pt" ? "há 1 dia" : "1 day ago";
  return locale === "pt" ? `há ${days} dias` : `${days} days ago`;
}

function withinDateFilter(iso: string, filter: string) {
  if (filter === "all") return true;
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (filter === "7d") return days <= 7;
  if (filter === "30d") return days <= 30;
  if (filter === "month") {
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }
  return true;
}

function RevokeDialog({
  cert,
  onClose,
  onRevoked,
}: {
  cert: AdminCertificate | null;
  onClose: () => void;
  onRevoked: (cert: AdminCertificate, reason: string) => Promise<void>;
}) {
  const { locale } = useLocale();
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setReason("");
  }, [cert]);

  return (
    <AlertDialog open={!!cert} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {locale === "pt" ? "Revogar este certificado?" : "Revoke this certificate?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {locale === "pt"
              ? `O certificado de ${cert?.level} de ${cert?.full_name ?? cert?.email} deixa de ser válido na verificação pública imediatamente. Indique o motivo — fica registado.`
              : `${cert?.full_name ?? cert?.email}'s ${cert?.level} certificate stops verifying as valid immediately. State a reason — it's kept on record.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={locale === "pt" ? "Motivo da revogação…" : "Reason for revoking…"}
          rows={3}
        />
        <AlertDialogFooter>
          <AlertDialogCancel>{locale === "pt" ? "Voltar" : "Back"}</AlertDialogCancel>
          <AlertDialogAction
            disabled={!reason.trim() || pending}
            onClick={async (e) => {
              e.preventDefault();
              if (!cert) return;
              setPending(true);
              try {
                await onRevoked(cert, reason.trim());
              } finally {
                setPending(false);
              }
            }}
            className="bg-red-500 hover:bg-red-600"
          >
            {pending
              ? locale === "pt"
                ? "A revogar…"
                : "Revoking…"
              : locale === "pt"
                ? "Revogar"
                : "Revoke"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function IssueCertificateDialog({
  open,
  onOpenChange,
  onIssued,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIssued: (input: {
    userId: string;
    level: string;
    score?: number;
    courseTitle?: string;
  }) => Promise<void>;
}) {
  const { locale } = useLocale();
  const { user, isAdmin } = useAuth();
  const [studentQuery, setStudentQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [level, setLevel] = useState<string>("A1");
  const [score, setScore] = useState("");
  const [courseTitle, setCourseTitle] = useState("");
  const [pending, setPending] = useState(false);

  const { data: students = [] } = useQuery({
    queryKey: ["admin_users_for_certificate"],
    enabled: !!user && isAdmin && open,
    staleTime: 60_000,
    queryFn: async () =>
      (await apiFetch<{ items: AdminUser[] }>("/v1/admin/users?limit=500")).items,
  });

  useEffect(() => {
    if (!open) {
      setStudentQuery("");
      setSelectedUser(null);
      setLevel("A1");
      setScore("");
      setCourseTitle("");
    }
  }, [open]);

  const q = studentQuery.trim().toLowerCase();
  const visibleStudents = (
    q
      ? students.filter((s) => `${s.full_name ?? ""} ${s.email ?? ""}`.toLowerCase().includes(q))
      : students
  ).slice(0, 50);

  async function submit() {
    if (!selectedUser) return;
    setPending(true);
    try {
      await onIssued({
        userId: selectedUser.id,
        level,
        score: score.trim() ? Number(score) : undefined,
        courseTitle: courseTitle.trim() || undefined,
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{locale === "pt" ? "Emitir certificado" : "Issue certificate"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs font-semibold text-muted-foreground">
              {locale === "pt" ? "Aluno" : "Learner"}
            </Label>
            {selectedUser ? (
              <div className="mt-1 flex items-center justify-between rounded-xl border border-sunset/30 bg-sunset/5 px-3 py-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-ink">
                    {selectedUser.full_name || selectedUser.email}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">{selectedUser.email}</div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setSelectedUser(null)}>
                  {locale === "pt" ? "Trocar" : "Change"}
                </Button>
              </div>
            ) : (
              <>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                  <Input
                    value={studentQuery}
                    onChange={(e) => setStudentQuery(e.target.value)}
                    placeholder={
                      locale === "pt" ? "Pesquisar por nome ou email…" : "Search by name or email…"
                    }
                    className="pl-9"
                  />
                </div>
                <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-gray-100">
                  {visibleStudents.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedUser(s)}
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
                    >
                      <div className="font-medium text-ink">{s.full_name || "—"}</div>
                      <div className="text-xs text-muted-foreground">{s.email}</div>
                    </button>
                  ))}
                  {visibleStudents.length === 0 && (
                    <p className="p-3 text-xs text-muted-foreground">
                      {locale === "pt" ? "Sem alunos encontrados." : "No learners found."}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-muted-foreground">
                {locale === "pt" ? "Nível" : "Level"}
              </Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CEFR_LEVELS.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground">
                {locale === "pt" ? "Nota (opcional)" : "Score (optional)"}
              </Label>
              <Input
                className="mt-1"
                type="number"
                min={0}
                max={100}
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder={locale === "pt" ? "usa exame aprovado" : "uses passed exam"}
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold text-muted-foreground">
              {locale === "pt" ? "Título do curso (opcional)" : "Course title (optional)"}
            </Label>
            <Input
              className="mt-1"
              value={courseTitle}
              onChange={(e) => setCourseTitle(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button disabled={!selectedUser || pending} onClick={submit}>
            {pending
              ? locale === "pt"
                ? "A emitir…"
                : "Issuing…"
              : locale === "pt"
                ? "Emitir certificado"
                : "Issue certificate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function VerifyCodeDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { locale } = useLocale();
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "found" | "not_found">("idle");
  const [result, setResult] = useState<VerifyResult | null>(null);

  useEffect(() => {
    if (!open) {
      setCode("");
      setStatus("idle");
      setResult(null);
    }
  }, [open]);

  async function check() {
    const trimmed = code.trim();
    if (!trimmed) return;
    setStatus("checking");
    try {
      const data = await apiFetch<VerifyResult>(
        `/v1/certificates/verify/${encodeURIComponent(trimmed)}`,
      );
      setResult(data);
      setStatus("found");
    } catch {
      // The verify endpoint only ever fails with 404 "not found" for a bad
      // code (see certificates/routes.ts) — any other failure is rare enough
      // (network blip, 500) that folding it into the same "not found" message
      // here, rather than a separate generic-error state, is an acceptable
      // simplification for this admin-only lookup dialog.
      setResult(null);
      setStatus("not_found");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{locale === "pt" ? "Verificar código" : "Verify code"}</DialogTitle>
        </DialogHeader>
        <div className="flex gap-2">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && check()}
            placeholder={locale === "pt" ? "Código de verificação…" : "Verification code…"}
            className="font-mono"
          />
          <Button onClick={check} disabled={!code.trim() || status === "checking"}>
            {status === "checking"
              ? locale === "pt"
                ? "A verificar…"
                : "Checking…"
              : locale === "pt"
                ? "Verificar"
                : "Verify"}
          </Button>
        </div>

        {status === "not_found" && (
          <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
            {locale === "pt"
              ? "Nenhum certificado corresponde a este código."
              : "No certificate matches this code."}
          </p>
        )}

        {status === "found" && result && (
          <div className="rounded-xl border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div className="font-display text-lg font-bold text-ink">
                {result.full_name || "—"}
              </div>
              {result.valid ? (
                <Badge className="bg-emerald-500 text-white">
                  {locale === "pt" ? "Válido" : "Valid"}
                </Badge>
              ) : (
                <Badge variant="destructive">{locale === "pt" ? "Revogado" : "Revoked"}</Badge>
              )}
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline">{result.level}</Badge>
              {result.course_title && <span>· {result.course_title}</span>}
              {result.score != null && <span>· {result.score}%</span>}
            </div>
            <Button asChild size="sm" variant="outline" className="mt-3">
              <Link to="/verify/$code" params={{ code: result.verification_code }} target="_blank">
                {locale === "pt" ? "Ver página pública" : "View public page"}
                <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CertificateDetailSheet({
  cert,
  onClose,
}: {
  cert: AdminCertificate | null;
  onClose: () => void;
}) {
  const { locale } = useLocale();
  return (
    <Sheet open={!!cert} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{locale === "pt" ? "Certificado" : "Certificate"}</SheetTitle>
          <SheetDescription>
            {locale === "pt"
              ? "Detalhes completos do certificado emitido."
              : "Full detail of the issued certificate."}
          </SheetDescription>
        </SheetHeader>
        {cert && (
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-sunset/10 font-bold text-sunset">
                  {initials(cert.full_name, cert.email)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="truncate font-semibold text-ink">{cert.full_name || "—"}</div>
                <div className="truncate text-xs text-muted-foreground">{cert.email}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-muted/60 p-3">
                <div className="text-2xs font-bold uppercase tracking-widest text-muted-foreground">
                  {locale === "pt" ? "Nível" : "Level"}
                </div>
                <div className="mt-1 font-display text-lg font-bold text-ink">{cert.level}</div>
              </div>
              <div className="rounded-xl bg-muted/60 p-3">
                <div className="text-2xs font-bold uppercase tracking-widest text-muted-foreground">
                  {locale === "pt" ? "Nota" : "Score"}
                </div>
                <div className="mt-1 font-display text-lg font-bold text-ink">
                  {cert.score != null ? `${cert.score}%` : "—"}
                </div>
              </div>
            </div>
            <div>
              <div className="text-2xs font-bold uppercase tracking-widest text-muted-foreground">
                {locale === "pt" ? "Código de verificação" : "Verification code"}
              </div>
              <code className="mt-1 block break-all rounded-lg bg-muted/60 p-2 text-xs">
                {cert.verification_code}
              </code>
            </div>
            <div>
              <div className="text-2xs font-bold uppercase tracking-widest text-muted-foreground">
                {locale === "pt" ? "Emitido em" : "Issued"}
              </div>
              <div className="mt-1 text-sm text-ink">
                {new Date(cert.issued_at).toLocaleString(locale === "pt" ? "pt-AO" : "en-US")}
              </div>
            </div>
            {cert.revoked_at && (
              <div className="rounded-xl bg-red-50 p-3">
                <div className="text-2xs font-bold uppercase tracking-widest text-red-600">
                  {locale === "pt" ? "Revogado" : "Revoked"}
                </div>
                <div className="mt-1 text-sm text-red-700">{cert.revoked_reason}</div>
                <div className="mt-1 text-xs text-red-500">
                  {new Date(cert.revoked_at).toLocaleString(locale === "pt" ? "pt-AO" : "en-US")}
                </div>
              </div>
            )}
            <Button asChild variant="outline" className="w-full">
              <Link to="/verify/$code" params={{ code: cert.verification_code }} target="_blank">
                {locale === "pt" ? "Ver página pública" : "View public page"}
                <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export function CertificatesPanel() {
  const { locale } = useLocale();
  const { user, isAdmin } = useAuth();
  const notify = useNotification();

  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [issueOpen, setIssueOpen] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<AdminCertificate | null>(null);
  const [viewCert, setViewCert] = useState<AdminCertificate | null>(null);

  const { data: certificates = [], refetch } = useQuery({
    queryKey: ["admin_certificates"],
    enabled: !!user && isAdmin,
    queryFn: async () =>
      (await apiFetch<{ items: AdminCertificate[] }>("/v1/admin/certificates?limit=500")).items,
  });

  const searchLower = search.trim().toLowerCase();
  const filteredCertificates = certificates.filter((c) => {
    if (searchLower) {
      const haystack = `${c.full_name ?? ""} ${c.email} ${c.verification_code}`.toLowerCase();
      if (!haystack.includes(searchLower)) return false;
    }
    if (levelFilter !== "all" && c.level !== levelFilter) return false;
    if (statusFilter === "valid" && c.revoked_at) return false;
    if (statusFilter === "revoked" && !c.revoked_at) return false;
    if (!withinDateFilter(c.issued_at, dateFilter)) return false;
    return true;
  });

  const hasActiveFilters =
    !!search || levelFilter !== "all" || statusFilter !== "all" || dateFilter !== "all";
  const clearFilters = () => {
    setSearch("");
    setLevelFilter("all");
    setStatusFilter("all");
    setDateFilter("all");
  };

  const revoke = async (cert: AdminCertificate, reason: string) => {
    try {
      await apiFetch(`/v1/admin/certificates/${cert.id}/revoke`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
      notify.success(locale === "pt" ? "Certificado revogado" : "Certificate revoked");
      setRevokeTarget(null);
      refetch();
    } catch (e) {
      notify.fromError(e, { dedupeKey: "admin:revoke-certificate" });
    }
  };

  const issueCertificate = async (input: {
    userId: string;
    level: string;
    score?: number;
    courseTitle?: string;
  }) => {
    try {
      await apiFetch("/v1/admin/certificates", { method: "POST", body: JSON.stringify(input) });
      notify.success(locale === "pt" ? "Certificado emitido" : "Certificate issued");
      setIssueOpen(false);
      refetch();
    } catch (e) {
      notify.fromError(e, { dedupeKey: "admin:issue-certificate" });
    }
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      notify.success(locale === "pt" ? "Código copiado" : "Code copied");
    } catch {
      notify.fromError(new Error("Clipboard unavailable"), { dedupeKey: "admin:copy-code" });
    }
  };

  const columns: AdminDataTableColumn<AdminCertificate>[] = [
    {
      key: "learner",
      header: locale === "pt" ? "Aluno" : "Learner",
      sortable: true,
      sortValue: (c) => c.full_name ?? "",
      render: (c) => (
        <div className="flex items-center gap-2.5">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-sunset/10 text-2xs font-bold text-sunset">
              {initials(c.full_name, c.email)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="truncate font-medium text-ink">{c.full_name || "—"}</div>
            <div className="truncate text-xs text-muted-foreground">{c.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "level",
      header: "Nível",
      sortable: true,
      sortValue: (c) => c.level,
      render: (c) => <Badge variant="outline">{c.level}</Badge>,
    },
    {
      key: "score",
      header: locale === "pt" ? "Nota" : "Score",
      sortable: true,
      sortValue: (c) => c.score ?? -1,
      render: (c) => (c.score != null ? `${c.score}%` : "—"),
    },
    {
      key: "issued_at",
      header: locale === "pt" ? "Emitido em" : "Issued",
      sortable: true,
      sortValue: (c) => c.issued_at,
      render: (c) => (
        <div>
          <div className="text-xs text-ink">
            {new Date(c.issued_at).toLocaleDateString(locale === "pt" ? "pt-AO" : "en-US")}
          </div>
          <div className="text-2xs text-muted-foreground">{relativeDays(c.issued_at, locale)}</div>
        </div>
      ),
    },
    {
      key: "code",
      header: locale === "pt" ? "Código" : "Code",
      render: (c) => (
        <div className="flex items-center gap-1.5">
          <code className="text-xs">{c.verification_code}</code>
          <button
            type="button"
            onClick={() => copyCode(c.verification_code)}
            className="text-gray-300 hover:text-ink"
            aria-label={locale === "pt" ? "Copiar código" : "Copy code"}
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
    {
      key: "status",
      header: locale === "pt" ? "Estado" : "Status",
      sortable: true,
      sortValue: (c) => (c.revoked_at ? 1 : 0),
      render: (c) =>
        c.revoked_at ? (
          <Badge variant="destructive" title={c.revoked_reason ?? undefined}>
            {locale === "pt" ? "Revogado" : "Revoked"}
          </Badge>
        ) : (
          <Badge className="bg-emerald-500 text-white">
            {locale === "pt" ? "Válido" : "Valid"}
          </Badge>
        ),
    },
    {
      key: "actions",
      header: locale === "pt" ? "Ações" : "Actions",
      render: (c) => (
        <div className="flex items-center gap-1">
          <Button size="sm" variant="outline" onClick={() => setViewCert(c)}>
            {locale === "pt" ? "Ver" : "View"}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="rounded-md p-1.5 text-gray-400 hover:bg-muted hover:text-ink"
                aria-label={locale === "pt" ? "Mais ações" : "More actions"}
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!c.revoked_at && (
                <DropdownMenuItem
                  onClick={() => setRevokeTarget(c)}
                  className="text-red-500 focus:text-red-600"
                >
                  {locale === "pt" ? "Revogar certificado" : "Revoke certificate"}
                </DropdownMenuItem>
              )}
              {c.revoked_at && (
                <DropdownMenuItem disabled>
                  {locale === "pt" ? "Já revogado" : "Already revoked"}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  const revoked = certificates.filter((c) => c.revoked_at).length;
  const valid = certificates.length - revoked;
  const certifiedStudents = new Set(certificates.map((c) => c.user_id)).size;
  const issuedThisMonth = certificates.filter((c) => withinDateFilter(c.issued_at, "month")).length;
  const validPct = certificates.length ? Math.round((valid / certificates.length) * 100) : 0;
  const revokedPct = certificates.length ? Math.round((revoked / certificates.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-2xl font-bold text-ink">
            <Award className="h-5 w-5 text-amber-500" />{" "}
            {locale === "pt" ? "Certificados" : "Certificates"}
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {locale === "pt"
              ? "Gerencie, emita e valide os certificados dos alunos."
              : "Manage, issue and validate learners' certificates."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => setIssueOpen(true)}>
            <Upload className="mr-1.5 h-4 w-4" />{" "}
            {locale === "pt" ? "Emitir certificado" : "Issue certificate"}
          </Button>
          <Button variant="outline" onClick={() => setVerifyOpen(true)}>
            <BadgeCheck className="mr-1.5 h-4 w-4" />{" "}
            {locale === "pt" ? "Verificar código" : "Verify code"}
          </Button>
          <Button onClick={() => setIssueOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />{" "}
            {locale === "pt" ? "Novo certificado" : "New certificate"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
            <Award className="h-5 w-5" />
          </div>
          <div className="mt-3 text-2xl font-bold text-ink">{certificates.length}</div>
          <div className="text-xs text-muted-foreground">
            {locale === "pt" ? "Total de certificados" : "Total issued"}
          </div>
          <div className="mt-1 text-2xs font-medium text-sky-600">
            +{issuedThisMonth} {locale === "pt" ? "este mês" : "this month"}
          </div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="mt-3 text-2xl font-bold text-ink">{valid}</div>
          <div className="text-xs text-muted-foreground">
            {locale === "pt" ? "Certificados válidos" : "Valid certificates"}
          </div>
          <div className="mt-1 text-2xs font-medium text-emerald-600">
            {validPct}% {locale === "pt" ? "do total" : "of total"}
          </div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <ShieldX className="h-5 w-5" />
          </div>
          <div className="mt-3 text-2xl font-bold text-ink">{revoked}</div>
          <div className="text-xs text-muted-foreground">
            {locale === "pt" ? "Certificados revogados" : "Revoked certificates"}
          </div>
          <div className="mt-1 text-2xs font-medium text-amber-600">
            {revokedPct}% {locale === "pt" ? "do total" : "of total"}
          </div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-violet/10 text-violet">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="mt-3 text-2xl font-bold text-ink">{certifiedStudents}</div>
          <div className="text-xs text-muted-foreground">
            {locale === "pt" ? "Alunos certificados" : "Certified learners"}
          </div>
          <div className="mt-1 text-2xs font-medium text-violet">
            {certifiedStudents > 0 ? (certificates.length / certifiedStudents).toFixed(1) : "0"}{" "}
            {locale === "pt" ? "certificados/aluno" : "certs/learner"}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-gray-100 bg-white p-3">
        <div className="relative min-w-[14rem] flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              locale === "pt"
                ? "Pesquisar por nome, email ou código…"
                : "Search by name, email or code…"
            }
            className="pl-9"
          />
        </div>
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-[9.5rem]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {locale === "pt" ? "Todos os níveis" : "All levels"}
            </SelectItem>
            {CEFR_LEVELS.map((l) => (
              <SelectItem key={l} value={l}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[9.5rem]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {locale === "pt" ? "Todos os estados" : "All statuses"}
            </SelectItem>
            <SelectItem value="valid">{locale === "pt" ? "Válido" : "Valid"}</SelectItem>
            <SelectItem value="revoked">{locale === "pt" ? "Revogado" : "Revoked"}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-[9.5rem]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{locale === "pt" ? "Todas as datas" : "All dates"}</SelectItem>
            <SelectItem value="7d">{locale === "pt" ? "Últimos 7 dias" : "Last 7 days"}</SelectItem>
            <SelectItem value="30d">
              {locale === "pt" ? "Últimos 30 dias" : "Last 30 days"}
            </SelectItem>
            <SelectItem value="month">{locale === "pt" ? "Este mês" : "This month"}</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" disabled={!hasActiveFilters} onClick={clearFilters}>
          {locale === "pt" ? "Limpar filtros" : "Clear filters"}
        </Button>
      </div>

      <AdminDataTable
        columns={columns}
        data={filteredCertificates}
        getRowId={(c) => c.id}
        selectable
        pageSize={10}
        pageSizeOptions={[10, 25, 50, 100]}
        emptyLabel={locale === "pt" ? "Sem certificados emitidos" : "No certificates issued"}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-100 bg-sky-50 p-4">
        <div className="flex gap-3">
          <Lightbulb className="h-5 w-5 shrink-0 text-sky-500" />
          <p className="text-sm text-sky-900">
            <b>{locale === "pt" ? "Dica:" : "Tip:"}</b>{" "}
            {locale === "pt"
              ? "Os certificados incluem um código único de verificação que pode ser validado publicamente."
              : "Certificates include a unique verification code that can be validated publicly."}
          </p>
        </div>
        <Button variant="outline" className="shrink-0 bg-white" onClick={() => setVerifyOpen(true)}>
          {locale === "pt" ? "Verificar certificado" : "Verify certificate"}
          <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
        </Button>
      </div>

      <IssueCertificateDialog
        open={issueOpen}
        onOpenChange={setIssueOpen}
        onIssued={issueCertificate}
      />
      <VerifyCodeDialog open={verifyOpen} onOpenChange={setVerifyOpen} />
      <RevokeDialog cert={revokeTarget} onClose={() => setRevokeTarget(null)} onRevoked={revoke} />
      <CertificateDetailSheet cert={viewCert} onClose={() => setViewCert(null)} />
    </div>
  );
}
