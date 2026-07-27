import { createFileRoute, Link } from "@tanstack/react-router";
import { GraduationCap, Globe2, Sparkles, Users, Target, Heart } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n";

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () => ({
    meta: [
      { title: "Sobre nós — Learning English with Coach" },
      {
        name: "description",
        content:
          "Conheça a LEWC: uma plataforma premium de inglês do A1 ao C2, com IA, método CEFR e experiência personalizada por idade.",
      },
      { property: "og:title", content: "Sobre a Learning English with Coach" },
      {
        property: "og:description",
        content: "Missão, visão e método por trás da plataforma de inglês com AI Coach.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://coach-speak-bright.lovable.app/about" }],
  }),
});

function AboutPage() {
  const { locale } = useLocale();
  const pt = locale === "pt";

  const values = [
    {
      icon: Target,
      title: pt ? "Método CEFR" : "CEFR method",
      desc: pt
        ? "Do A1 ao C2, com progresso mensurável e certificados oficiais."
        : "From A1 to C2, with measurable progress and official certificates.",
    },
    {
      icon: Sparkles,
      title: pt ? "IA que ensina" : "AI that teaches",
      desc: pt
        ? "AI Coach 24/7 para conversação, correção de pronúncia e feedback imediato."
        : "24/7 AI Coach for conversation, pronunciation and instant feedback.",
    },
    {
      icon: Heart,
      title: pt ? "Feito para cada idade" : "Built for every age",
      desc: pt
        ? "Ambientes Kids, Teens e Adults com ritmo, cores e conteúdo próprios."
        : "Kids, Teens and Adults environments with their own pace, colors and content.",
    },
    {
      icon: Globe2,
      title: pt ? "Acesso global" : "Global access",
      desc: pt
        ? "Disponível em qualquer dispositivo, com foco mobile-first."
        : "Available on any device, mobile-first by design.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl pt-28 pb-28 px-6 py-16">
        <section className="text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <GraduationCap className="h-3.5 w-3.5" /> {pt ? "Sobre nós" : "About us"}
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight md:text-6xl">
            {pt ? "Ensinamos inglês como" : "We teach English as it"}{" "}
            <span className="bg-gradient-sunset bg-clip-text text-transparent">
              {pt ? "deveria ser aprendido." : "should be learned."}
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            {pt
              ? "A LEWC (Learning English with Coach) nasceu para tornar o inglês acessível, moderno e verdadeiramente eficaz — combinando pedagogia comprovada, inteligência artificial e uma experiência premium."
              : "LEWC (Learning English with Coach) was born to make English accessible, modern and truly effective — combining proven pedagogy, artificial intelligence and a premium experience."}
          </p>
        </section>

        <section className="mt-16 grid gap-6 md:grid-cols-2">
          <div className="glass rounded-2xl p-8 shadow-card">
            <div className="mb-3 inline-flex items-center gap-2 text-primary">
              <Target className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider">
                {pt ? "Missão" : "Mission"}
              </span>
            </div>
            <p className="text-lg leading-relaxed">
              {pt
                ? "Democratizar o acesso a um ensino de inglês de alta qualidade, personalizado por idade e nível, com resultados reais."
                : "Democratize access to high-quality English learning, personalized by age and level, with real results."}
            </p>
          </div>
          <div className="glass rounded-2xl p-8 shadow-card">
            <div className="mb-3 inline-flex items-center gap-2 text-primary">
              <Sparkles className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider">
                {pt ? "Visão" : "Vision"}
              </span>
            </div>
            <p className="text-lg leading-relaxed">
              {pt
                ? "Ser a plataforma de referência em inglês nos países lusófonos, unindo tecnologia, cultura e educação."
                : "Be the reference English platform in Portuguese-speaking countries, uniting technology, culture and education."}
            </p>
          </div>
        </section>

        <section className="mt-16">
          <h2 className="font-display text-2xl font-bold md:text-3xl">
            {pt ? "O que nos move" : "What drives us"}
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <div key={v.title} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
                <v.icon className="h-6 w-6 text-primary" />
                <h3 className="mt-3 font-display text-lg font-bold">{v.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-3xl bg-gradient-sunset p-10 text-center text-white shadow-card">
          <Users className="mx-auto h-10 w-10" />
          <h2 className="mt-4 font-display text-3xl font-bold">
            {pt ? "Junte-se a milhares de alunos" : "Join thousands of learners"}
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-white/90">
            {pt
              ? "Comece hoje mesmo — grátis, sem cartão de crédito."
              : "Start today — free, no credit card required."}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" variant="secondary" className="text-foreground">
              <Link to="/auth">{pt ? "Criar conta" : "Create account"}</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10">
              <Link to="/pricing">{pt ? "Ver planos" : "See pricing"}</Link>
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
