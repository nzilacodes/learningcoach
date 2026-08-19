import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Award, ShieldCheck, ShieldAlert, ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiFetch, ApiError } from "@/lib/api/client";
import { normalizeApiError } from "@/lib/errors/normalize-api-error";
import { InlineStatusFromError } from "@/components/feedback/inline-status";

type VerifiedCertificate = {
  verification_code: string;
  full_name: string | null;
  level: string;
  course_title: string | null;
  score: number | null;
  issued_at: string;
  signature: string | null;
  valid: boolean;
};

export const Route = createFileRoute("/verify/$code")({
  loader: async ({ params }) => {
    try {
      const cert = await apiFetch<VerifiedCertificate>(
        `/v1/certificates/verify/${encodeURIComponent(params.code)}`,
      );
      return { cert };
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return { cert: null };
      throw e;
    }
  },
  errorComponent: ({ error, reset }) => (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-destructive" />
        <h1 className="mt-4 font-display text-2xl font-bold">Erro na verificação</h1>
        <div className="mx-auto mt-4 max-w-md text-left">
          <InlineStatusFromError
            error={normalizeApiError(error)}
            action={{ label: "Tentar novamente", onClick: reset }}
          />
        </div>
      </div>
      <SiteFooter />
    </div>
  ),
  notFoundComponent: () => <NotFoundView />,
  component: VerifyPage,
  head: ({ params }) => ({
    meta: [
      { title: `Validação de Certificado ${params.code} — Coach` },
      {
        name: "description",
        content:
          "Página pública de validação de certificado CEFR emitido pela Learning English with Coach.",
      },
      { property: "og:title", content: `Certificado ${params.code}` },
      { property: "og:description", content: "Verifica a autenticidade deste certificado CEFR." },
    ],
  }),
});

function NotFoundView() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-destructive" />
        <h1 className="mt-4 font-display text-2xl font-bold">Certificado não encontrado</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          O código introduzido não corresponde a nenhum certificado emitido.
        </p>
        <Button asChild className="mt-4" variant="outline">
          <Link to="/certificates">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Voltar
          </Link>
        </Button>
      </div>
      <SiteFooter />
    </div>
  );
}

function VerifyPage() {
  const { cert } = Route.useLoaderData();
  if (!cert) {
    throw notFound();
  }

  const isValid = cert.valid;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="bg-hero">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <div className="text-center">
            <div
              className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl shadow-glow ${isValid ? "bg-emerald-500/90" : "bg-destructive/90"}`}
            >
              {isValid ? (
                <ShieldCheck className="h-7 w-7 text-white" />
              ) : (
                <ShieldAlert className="h-7 w-7 text-white" />
              )}
            </div>
            <h1 className="mt-4 font-display text-3xl font-bold md:text-4xl">
              {isValid ? "Certificado autêntico" : "Certificado revogado"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {isValid
                ? "Este certificado foi emitido oficialmente pela plataforma Learning English with Coach."
                : "Este certificado já não é válido. Contacte o suporte se acredita que isto é um erro."}
            </p>
          </div>

          <Card className="mt-8 overflow-hidden border-2 border-double border-magenta/30">
            <CardContent className="p-8">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  Official CEFR Certificate
                </div>
              </div>

              <div className="mt-6 text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
                Emitido a
              </div>
              <div className="mt-1 font-display text-4xl font-bold">
                {cert.full_name || "Student"}
              </div>

              <div className="mt-6 flex items-baseline gap-3">
                <span className="text-muted-foreground text-sm">Nível concluído:</span>
                <Badge className="text-lg">{cert.level}</Badge>
                {cert.course_title && (
                  <span className="text-sm text-muted-foreground">· {cert.course_title}</span>
                )}
              </div>

              <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-4">
                <Meta label="Data" value={new Date(cert.issued_at).toLocaleDateString()} />
                <Meta
                  label="Score"
                  value={cert.score != null ? `${Math.round(Number(cert.score))}%` : "—"}
                />
                <Meta label="Código" value={cert.verification_code} mono />
                <Meta label="Estado" value={isValid ? "Válido ✓" : "Revogado ✕"} />
              </div>

              <div className="mt-8 rounded-lg border bg-muted/30 p-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Assinatura digital (SHA-256)
                </div>
                <div className="mt-1 break-all font-mono text-[11px] text-foreground/80">
                  {cert.signature}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 text-center">
            <Button asChild variant="outline">
              <Link to="/certificates">Ver os meus certificados</Link>
            </Button>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}

function Meta({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className={`mt-1 font-semibold ${mono ? "font-mono text-sm" : "text-base"}`}>
        {value}
      </div>
    </div>
  );
}
