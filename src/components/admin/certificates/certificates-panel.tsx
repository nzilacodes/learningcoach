import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Award, ShieldCheck, ShieldX } from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";
import { useLocale } from "@/lib/i18n";
import { useNotification } from "@/lib/notifications/notification-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
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

function RevokeDialog({
  cert,
  onRevoked,
}: {
  cert: AdminCertificate;
  onRevoked: (reason: string) => Promise<void>;
}) {
  const { locale } = useLocale();
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="outline">
          {locale === "pt" ? "Revogar" : "Revoke"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {locale === "pt" ? "Revogar este certificado?" : "Revoke this certificate?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {locale === "pt"
              ? `O certificado de ${cert.level} de ${cert.full_name ?? cert.email} deixa de ser válido na verificação pública imediatamente. Indique o motivo — fica registado.`
              : `${cert.full_name ?? cert.email}'s ${cert.level} certificate stops verifying as valid immediately. State a reason — it's kept on record.`}
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
              setPending(true);
              try {
                await onRevoked(reason.trim());
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

export function CertificatesPanel() {
  const { locale } = useLocale();
  const { user, isAdmin } = useAuth();
  const notify = useNotification();

  const { data: certificates = [], refetch } = useQuery({
    queryKey: ["admin_certificates"],
    enabled: !!user && isAdmin,
    queryFn: async () =>
      (await apiFetch<{ items: AdminCertificate[] }>("/v1/admin/certificates?limit=200")).items,
  });

  const revoke = async (cert: AdminCertificate, reason: string) => {
    try {
      await apiFetch(`/v1/admin/certificates/${cert.id}/revoke`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
      notify.success(locale === "pt" ? "Certificado revogado" : "Certificate revoked");
      refetch();
    } catch (e) {
      notify.fromError(e, { dedupeKey: "admin:revoke-certificate" });
    }
  };

  const columns: AdminDataTableColumn<AdminCertificate>[] = [
    {
      key: "learner",
      header: locale === "pt" ? "Aluno" : "Learner",
      sortable: true,
      sortValue: (c) => c.full_name ?? "",
      render: (c) => (
        <div>
          <div className="font-medium">{c.full_name || "—"}</div>
          <div className="text-xs text-muted-foreground">{c.email}</div>
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
      render: (c) => (c.score != null ? `${c.score}%` : "—"),
    },
    {
      key: "issued_at",
      header: locale === "pt" ? "Emitido em" : "Issued",
      sortable: true,
      sortValue: (c) => c.issued_at,
      render: (c) => (
        <span className="text-xs">
          {new Date(c.issued_at).toLocaleDateString(locale === "pt" ? "pt-AO" : "en-US")}
        </span>
      ),
    },
    {
      key: "code",
      header: locale === "pt" ? "Código" : "Code",
      render: (c) => <code className="text-xs">{c.verification_code}</code>,
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
      render: (c) =>
        !c.revoked_at ? <RevokeDialog cert={c} onRevoked={(reason) => revoke(c, reason)} /> : null,
    },
  ];

  const revoked = certificates.filter((c) => c.revoked_at).length;
  const valid = certificates.length - revoked;

  return (
    <div className="space-y-6">
      <h2 className="flex items-center gap-2 font-display text-2xl font-bold text-ink">
        <Award className="h-5 w-5 text-amber-500" />{" "}
        {locale === "pt" ? "Certificados" : "Certificates"}
      </h2>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <Award className="h-5 w-5" />
          </div>
          <div className="mt-3 text-2xl font-bold text-ink">{certificates.length}</div>
          <div className="text-xs text-muted-foreground">
            {locale === "pt" ? "Total emitidos" : "Total issued"}
          </div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="mt-3 text-2xl font-bold text-ink">{valid}</div>
          <div className="text-xs text-muted-foreground">
            {locale === "pt" ? "Válidos" : "Valid"}
          </div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-500">
            <ShieldX className="h-5 w-5" />
          </div>
          <div className="mt-3 text-2xl font-bold text-ink">{revoked}</div>
          <div className="text-xs text-muted-foreground">
            {locale === "pt" ? "Revogados" : "Revoked"}
          </div>
        </div>
      </div>

      <AdminDataTable
        columns={columns}
        data={certificates}
        getRowId={(c) => c.id}
        getSearchText={(c) => `${c.full_name ?? ""} ${c.email} ${c.verification_code}`}
        searchPlaceholder={
          locale === "pt" ? "Pesquisar por aluno ou código…" : "Search by learner or code…"
        }
        emptyLabel={locale === "pt" ? "Sem certificados emitidos" : "No certificates issued"}
      />
    </div>
  );
}
