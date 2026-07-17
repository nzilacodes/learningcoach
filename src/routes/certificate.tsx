import { createFileRoute } from "@tanstack/react-router";
import { Award, Download, Share2, QrCode, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n";

export const Route = createFileRoute("/certificate")({
  component: CertificatePage,
  head: () => ({
    meta: [
      { title: "Certificado CEFR — Learning English with Coach" },
      { name: "description", content: "Seu certificado de conclusão CEFR." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function CertificatePage() {
  const { locale } = useLocale();
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="bg-hero">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-aurora shadow-glow">
              <Award className="h-8 w-8 text-white" />
            </div>
            <h1 className="mt-6 font-display text-4xl font-bold md:text-5xl">
              {locale === "pt" ? "Parabéns, Maria! 🎉" : "Congratulations, Maria! 🎉"}
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-lg text-muted-foreground">
              {locale === "pt"
                ? "Você concluiu o nível B1 com 92% de aproveitamento. Aqui está seu certificado oficial."
                : "You've completed B1 level with 92% score. Here's your official certificate."}
            </p>
          </div>

          {/* Certificate */}
          <div className="relative mt-12 overflow-hidden rounded-3xl border-4 border-double border-magenta/40 bg-cream shadow-glow">
            <div className="absolute inset-0 bg-gradient-to-br from-sunset/5 via-transparent to-violet/10" />
            <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-magenta/10 blur-3xl" />
            <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-amber/20 blur-3xl" />

            <div className="relative p-12 text-center md:p-16">
              <div className="flex items-center justify-center gap-3">
                <div className="bg-gradient-sunset flex h-10 w-10 items-center justify-center rounded-xl shadow-soft">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-display text-sm font-bold">Learning English with Coach</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Official CEFR Certificate
                  </div>
                </div>
              </div>

              <div className="mt-10 text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">
                {locale === "pt" ? "Certifica-se que" : "This certifies that"}
              </div>
              <div className="mt-4 font-display text-5xl font-bold text-foreground md:text-6xl">
                Maria Silva
              </div>
              <div className="mx-auto mt-4 h-px w-32 bg-muted-foreground/30" />
              <div className="mt-6 text-lg text-muted-foreground">
                {locale === "pt"
                  ? "concluiu com êxito o nível"
                  : "has successfully completed the level"}
              </div>
              <div className="mt-2 font-display text-7xl font-bold text-gradient-sunset">B1</div>
              <div className="mt-2 text-lg font-semibold">
                {locale === "pt" ? "Intermediário — CEFR" : "Intermediate — CEFR"}
              </div>

              <div className="mx-auto mt-10 grid max-w-2xl grid-cols-3 gap-4 text-left">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {locale === "pt" ? "Aproveitamento" : "Score"}
                  </div>
                  <div className="font-display text-2xl font-bold">92%</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {locale === "pt" ? "Data" : "Date"}
                  </div>
                  <div className="font-display text-2xl font-bold">04/07/26</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">ID</div>
                  <div className="font-mono text-lg font-bold">LEC-B1-8842</div>
                </div>
              </div>

              <div className="mt-10 flex items-center justify-between">
                <div className="text-left">
                  <div className="font-display font-bold italic">Coach EDU</div>
                  <div className="mt-1 h-px w-32 bg-foreground/40" />
                  <div className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                    {locale === "pt" ? "Diretor de Ensino" : "Director of Education"}
                  </div>
                </div>
                <div className="flex h-24 w-24 items-center justify-center rounded-xl border-2 border-foreground/20 bg-white/70">
                  <QrCode className="h-16 w-16" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" className="bg-gradient-sunset text-white shadow-soft hover:opacity-90">
              <Download className="mr-1.5 h-4 w-4" />
              {locale === "pt" ? "Baixar PDF" : "Download PDF"}
            </Button>
            <Button size="lg" variant="outline">
              <Share2 className="mr-1.5 h-4 w-4" />
              {locale === "pt" ? "Compartilhar" : "Share"}
            </Button>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
