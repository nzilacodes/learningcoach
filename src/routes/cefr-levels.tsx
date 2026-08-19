import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Lock, Trophy } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cefrRank, useMaxUnlockedLevel, useMinExamScore, type CefrLevel } from "@/lib/level-access";
import { SITE_URL } from "@/lib/site-url";

export const Route = createFileRoute("/cefr-levels")({
  component: CefrLevelsPage,
  head: () => ({
    meta: [
      { title: "Níveis CEFR (A1–C2): guia completo do Quadro Europeu" },
      {
        name: "description",
        content:
          "Entenda os níveis CEFR A1, A2, B1, B2, C1 e C2: o que você sabe fazer em cada nível, quanto tempo leva e como avançar aprendendo inglês.",
      },
      { property: "og:title", content: "Níveis CEFR (A1–C2): guia completo" },
      {
        property: "og:description",
        content:
          "Guia prático dos níveis CEFR A1–C2 aplicado ao aprendizado de inglês, com competências, tempo estimado e próximos passos.",
      },
      { property: "og:url", content: `${SITE_URL}/cefr-levels` },
      { property: "og:type", content: "article" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/cefr-levels` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "Níveis CEFR (A1–C2): guia completo do Quadro Europeu",
          description: "Guia prático dos níveis CEFR A1–C2 aplicado ao aprendizado de inglês.",
          author: { "@type": "Organization", name: "Learning English with Coach" },
        }),
      },
    ],
  }),
});

const LEVELS = [
  {
    code: "A1",
    name: "Iniciante",
    hours: "70–100h",
    color: "from-emerald-500/20 to-emerald-500/5",
    can: [
      "Apresentar-se e responder perguntas pessoais simples",
      "Usar frases básicas do dia a dia (comprar, cumprimentar)",
      "Entender palavras e expressões familiares faladas devagar",
    ],
  },
  {
    code: "A2",
    name: "Básico",
    hours: "180–200h",
    color: "from-teal-500/20 to-teal-500/5",
    can: [
      "Descrever rotina, família, trabalho e ambiente próximo",
      "Comunicar-se em tarefas simples e rotineiras",
      "Ler textos curtos: cardápios, avisos, e-mails básicos",
    ],
  },
  {
    code: "B1",
    name: "Intermediário",
    hours: "350–400h",
    color: "from-sky-500/20 to-sky-500/5",
    can: [
      "Lidar com a maioria das situações em viagens",
      "Produzir textos simples sobre temas familiares",
      "Descrever experiências, planos e opiniões",
    ],
  },
  {
    code: "B2",
    name: "Intermediário superior",
    hours: "500–600h",
    color: "from-indigo-500/20 to-indigo-500/5",
    can: [
      "Interagir com fluência com falantes nativos",
      "Entender ideias principais de textos complexos",
      "Argumentar e defender pontos de vista",
    ],
  },
  {
    code: "C1",
    name: "Avançado",
    hours: "700–800h",
    color: "from-purple-500/20 to-purple-500/5",
    can: [
      "Usar o idioma de forma flexível em contextos sociais e profissionais",
      "Entender textos longos e reconhecer significados implícitos",
      "Produzir textos claros, bem estruturados e detalhados",
    ],
  },
  {
    code: "C2",
    name: "Proficiente",
    hours: "1.000h+",
    color: "from-rose-500/20 to-rose-500/5",
    can: [
      "Entender virtualmente tudo o que lê ou ouve",
      "Resumir informações de diferentes fontes",
      "Expressar-se com precisão em contextos complexos",
    ],
  },
];

function CefrLevelsPage() {
  const { user } = useAuth();
  const { data: unlocked } = useMaxUnlockedLevel();
  const { data: minScore = 70 } = useMinExamScore();
  // Before the placement diagnostic, `unlocked` is null — default to A1 so
  // the easiest level isn't shown locked too (matches the same fallback
  // used for the dashboard's active course, see lib/learning.ts).
  const unlockedRank = cefrRank(unlocked ?? "A1");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <section className="container mx-auto px-4 py-16 max-w-4xl">
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              Guia CEFR
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Níveis CEFR: A1 a C2 explicados</h1>
            <p className="text-lg text-muted-foreground">
              O <strong>Quadro Europeu Comum de Referência para Línguas (CEFR)</strong> divide a
              proficiência em seis níveis. Descubra em qual você está e o que precisa dominar para
              avançar.
            </p>
            {user && unlocked && (
              <div className="mt-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 bg-card">
                <Trophy className="w-4 h-4 text-primary" />
                <span className="text-sm">
                  Seu nível atual desbloqueado: <strong>{unlocked}</strong> · Nota mínima do exame:{" "}
                  <strong>{minScore}%</strong>
                </span>
              </div>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-2 mb-16">
            {LEVELS.map((level) => {
              const rank = cefrRank(level.code as CefrLevel);
              const isUnlocked = user ? rank <= unlockedRank : false;
              const isCurrent = user ? rank === unlockedRank : false;
              const locked = user && !isUnlocked;
              return (
                <div
                  key={level.code}
                  className={`relative rounded-2xl border p-6 bg-gradient-to-br ${level.color} ${locked ? "opacity-60" : ""}`}
                >
                  <div className="flex items-baseline justify-between mb-3">
                    <div>
                      <div className="text-3xl font-bold flex items-center gap-2">
                        {level.code}
                        {locked && <Lock className="w-4 h-4 text-muted-foreground" />}
                        {isCurrent && (
                          <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                            ATUAL
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">{level.name}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">{level.hours}</div>
                  </div>
                  <ul className="space-y-2 mb-4">
                    {level.can.map((item) => (
                      <li key={item} className="flex gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  {user && (
                    <div className="pt-3 border-t border-border/60">
                      {locked ? (
                        <p className="text-xs text-muted-foreground">
                          Bloqueado — passe o exame final de {unlocked ?? "níveis anteriores"} para
                          desbloquear.
                        </p>
                      ) : isCurrent ? (
                        <Button size="sm" asChild>
                          <Link to="/level-exam/$level" params={{ level: level.code }}>
                            Fazer exame final {level.code}
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Link>
                        </Button>
                      ) : (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          ✓ Nível concluído
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="prose prose-neutral dark:prose-invert max-w-none mb-12">
            <h2>Como saber o meu nível de inglês?</h2>
            <p>
              A forma mais rápida é fazer um <strong>teste de nivelamento</strong>. Na nossa
              plataforma, ele avalia leitura, vocabulário e compreensão e posiciona você
              automaticamente entre A1 e C2 em poucos minutos.
            </p>
            <h2>Quanto tempo leva para avançar um nível?</h2>
            <p>
              Depende da dedicação. Com <strong>30 minutos por dia</strong> na nossa metodologia
              (aulas curtas + prática com AI Coach + Sala de Conversa), a maioria dos alunos avança
              um nível a cada 4–6 meses.
            </p>
            <h2>Certificado CEFR</h2>
            <p>
              Ao concluir cada nível na plataforma, você recebe um{" "}
              <strong>certificado digital</strong> com o código CEFR correspondente, útil para
              currículo, universidade e imigração.
            </p>
          </div>

          <div className="text-center bg-primary/5 rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-2">Descubra o seu nível agora</h2>
            <p className="text-muted-foreground mb-6">
              Faça o teste de nivelamento gratuito e comece pela lição certa.
            </p>
            <Button asChild size="lg">
              <Link to="/placement">
                Fazer teste de nivelamento
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
