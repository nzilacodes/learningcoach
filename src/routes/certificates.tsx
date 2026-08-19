import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Award, Download, ShieldCheck, QrCode, Loader2, ExternalLink } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api/client";
import { generateCertificatePdf, downloadBlob } from "@/lib/certificate-pdf";
import { useNotification } from "@/lib/notifications/notification-provider";

type CertificateRow = {
  id: string;
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  full_name: string | null;
  course_title: string | null;
  score: number | null;
  issued_at: string;
  verification_code: string;
  signature: string | null;
};

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

export const Route = createFileRoute("/certificates")({
  component: CertificatesPage,
  head: () => ({
    meta: [
      { title: "Certificados — Learning English with Coach" },
      {
        name: "description",
        content: "Emite, descarrega e valida os teus certificados CEFR oficiais.",
      },
      { property: "og:title", content: "Certificados CEFR — Coach" },
      {
        property: "og:description",
        content: "Certificados oficiais com QR Code e assinatura digital.",
      },
    ],
  }),
});

function CertificatesPage() {
  const navigate = useNavigate();
  const notify = useNotification();
  const [items, setItems] = useState<CertificateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const rows = await apiFetch<CertificateRow[]>("/v1/me/certificates");
      setItems(rows);
    } catch (e) {
      notify.fromError(e, { dedupeKey: "certificates:list" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleIssue(level: (typeof LEVELS)[number]) {
    setIssuing(level);
    try {
      const cert = await apiFetch<CertificateRow>("/v1/certificates", {
        method: "POST",
        body: JSON.stringify({ level }),
      });
      notify.success(`Certificado ${cert.level} emitido!`);
      await refresh();
    } catch (e) {
      // PAYMENT_REQUIRED gets the "Ver planos" CTA centrally now, instead of
      // this call site hand-checking e.status === 402.
      notify.fromError(e, {
        dedupeKey: "certificates:issue",
        onUpgrade: () => navigate({ to: "/pricing" }),
      });
    } finally {
      setIssuing(null);
    }
  }

  async function handleDownload(cert: CertificateRow) {
    try {
      const verifyUrl = `${window.location.origin}/verify/${cert.verification_code}`;
      const blob = await generateCertificatePdf({
        fullName: cert.full_name || "Student",
        level: cert.level,
        courseTitle: cert.course_title,
        score: cert.score,
        issuedAt: cert.issued_at,
        verificationCode: cert.verification_code,
        signature: cert.signature || "",
        verifyUrl,
      });
      downloadBlob(blob, `Certificate-${cert.verification_code}.pdf`);
    } catch (e) {
      notify.fromError(e, { dedupeKey: "certificates:pdf" });
    }
  }

  const owned = new Set(items.map((c) => c.level));

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="bg-hero">
        <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-aurora shadow-glow">
              <Award className="h-7 w-7 text-white" />
            </div>
            <h1 className="mt-4 font-display text-4xl font-bold md:text-5xl">
              Certificados oficiais
            </h1>
            <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
              Cada nível concluído gera automaticamente um certificado com QR Code, código único e
              assinatura digital.
            </p>
          </div>

          {/* Emitir */}
          <Card className="mt-10 border-border/60">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <h2 className="font-display text-lg font-bold">Emitir certificado</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {LEVELS.map((lvl) => {
                  const has = owned.has(lvl);
                  return (
                    <Button
                      key={lvl}
                      variant={has ? "outline" : "default"}
                      size="sm"
                      disabled={!!issuing || has}
                      onClick={() => handleIssue(lvl)}
                    >
                      {issuing === lvl ? (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : null}
                      {has ? `${lvl} ✓` : `Emitir ${lvl}`}
                    </Button>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Só emite o certificado depois de concluíres o nível. Cada certificado tem um código
                único e verificável.
              </p>
            </CardContent>
          </Card>

          {/* Verificação */}
          <VerifyBox />

          {/* Histórico */}
          <div className="mt-8">
            <h2 className="mb-3 font-display text-lg font-bold">Histórico</h2>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> A carregar…
              </div>
            ) : items.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center text-sm text-muted-foreground">
                  Ainda não tens certificados. Conclui um nível e emite o teu primeiro.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {items.map((c) => (
                  <Card
                    key={c.id}
                    className="overflow-hidden border-2 border-double border-magenta/30"
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <Badge variant="secondary" className="mb-2">
                            CEFR {c.level}
                          </Badge>
                          <div className="font-display text-xl font-bold">
                            {c.full_name || "Student"}
                          </div>
                          {c.course_title && (
                            <div className="text-sm text-muted-foreground">{c.course_title}</div>
                          )}
                        </div>
                        <QrCode className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <div className="uppercase tracking-wider text-muted-foreground">Data</div>
                          <div className="font-semibold">
                            {new Date(c.issued_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div>
                          <div className="uppercase tracking-wider text-muted-foreground">
                            Score
                          </div>
                          <div className="font-semibold">
                            {c.score != null ? `${Math.round(Number(c.score))}%` : "—"}
                          </div>
                        </div>
                        <div>
                          <div className="uppercase tracking-wider text-muted-foreground">ID</div>
                          <div className="font-mono text-2xs font-semibold">
                            {c.verification_code}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => handleDownload(c)}>
                          <Download className="mr-1.5 h-3.5 w-3.5" />
                          PDF
                        </Button>
                        <Button asChild size="sm" variant="outline">
                          <Link to="/verify/$code" params={{ code: c.verification_code }}>
                            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                            Página pública
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}

function VerifyBox() {
  const [code, setCode] = useState("");
  return (
    <Card className="mt-6 border-border/60">
      <CardContent className="p-6">
        <div className="mb-3 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <h2 className="font-display text-lg font-bold">Validar certificado</h2>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder="Ex: LEC-B1-8AC2F1D3"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="font-mono"
          />
          <Button asChild disabled={!code.trim()}>
            <Link to="/verify/$code" params={{ code: code.trim() }}>
              Verificar
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
