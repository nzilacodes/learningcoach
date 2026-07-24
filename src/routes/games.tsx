import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Gamepad2,
  Brain,
  Puzzle,
  Zap,
  Grid3x3,
  MousePointerClick,
  Type,
  Volume2,
  Ear,
  Timer,
  Trophy,
  Flame,
  Lock,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useLocale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { useAgeGroup } from "@/lib/use-age-group";
import { AGE_TRACKS, AGE_GROUP_LABEL } from "@/lib/age-tracks";
import { SITE_URL } from "@/lib/site-url";


export const Route = createFileRoute("/games")({
  component: GamesPage,
  head: () => ({
    meta: [
      { title: "Jogos de inglês — Learning English with Coach" },
      {
        name: "description",
        content:
          "Aprenda inglês jogando: vocabulário, pronúncia e gramática em jogos rápidos e divertidos.",
      },
      { property: "og:title", content: "Jogos de inglês — Learning English with Coach" },
      { property: "og:description", content: "Vocabulário, pronúncia e gramática em jogos rápidos." },
      { property: "og:url", content: `${SITE_URL}/games` },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/games` }],
  }),
});

const games = [
  { icon: Brain, pt: "Jogo da Memória", en: "Memory Game", xp: 40, unlocked: true, color: "from-sunset to-amber" },
  { icon: Puzzle, pt: "Palavras Cruzadas", en: "Crossword", xp: 60, unlocked: true, color: "from-amber to-magenta" },
  { icon: Grid3x3, pt: "Caça-Palavras", en: "Word Search", xp: 30, unlocked: true, color: "from-magenta to-violet" },
  { icon: MousePointerClick, pt: "Arrastar e Soltar", en: "Drag & Drop", xp: 40, unlocked: true, color: "from-violet to-sunset" },
  { icon: Type, pt: "Complete a Frase", en: "Fill the Blank", xp: 35, unlocked: true, color: "from-sunset to-magenta" },
  { icon: Zap, pt: "Combinar Palavras", en: "Word Match", xp: 25, unlocked: true, color: "from-amber to-violet" },
  { icon: Volume2, pt: "Desafio de Pronúncia", en: "Pronunciation Challenge", xp: 80, unlocked: true, color: "from-magenta to-sunset" },
  { icon: Ear, pt: "Desafio de Escuta", en: "Listening Challenge", xp: 70, unlocked: true, color: "from-violet to-amber" },
  { icon: Timer, pt: "Quiz Relâmpago", en: "Speed Quiz", xp: 100, unlocked: false, color: "from-sunset to-violet" },
];

function GamesPage() {
  const { locale } = useLocale();
  const { group } = useAgeGroup();
  const ageGames = AGE_TRACKS[group].games;
  const ageLabel = AGE_GROUP_LABEL[group];
  return (
    <div className="min-h-screen">
      <SiteHeader />

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-magenta/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-magenta">
              <Gamepad2 className="h-3.5 w-3.5" /> {locale === "pt" ? "Jogar & Aprender" : "Play & Learn"}
            </div>
            <h1 className="mt-3 font-display text-4xl font-bold md:text-5xl">
              {locale === "pt" ? "Jogos Educativos" : "Educational Games"}
            </h1>
            <p className="mt-2 max-w-xl text-muted-foreground">
              {locale === "pt"
                ? "Ganhe XP, moedas e medalhas enquanto pratica inglês em jogos rápidos e divertidos."
                : "Earn XP, coins and badges while practicing English in quick, fun games."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="glass rounded-2xl px-4 py-3 text-center shadow-card">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber">
                <Trophy className="h-3.5 w-3.5" /> XP
              </div>
              <div className="font-display text-2xl font-bold">2.450</div>
            </div>
            <div className="glass rounded-2xl px-4 py-3 text-center shadow-card">
              <div className="flex items-center gap-1.5 text-xs font-bold text-sunset">
                <Flame className="h-3.5 w-3.5" /> {locale === "pt" ? "Streak" : "Streak"}
              </div>
              <div className="font-display text-2xl font-bold">12</div>
            </div>
          </div>
        </div>

        {/* Age-personalized games */}
        <div className="mt-10">
          <div className="flex items-end justify-between mb-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-magenta">
                {locale === "pt" ? "Para você" : "For you"} · {ageLabel.pt} ({ageLabel.range})
              </div>
              <h2 className="mt-1 font-display text-2xl font-bold">
                {locale === "pt" ? "Jogos recomendados para a sua idade" : "Games recommended for your age"}
              </h2>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ageGames.map((g) => (
              <div key={g.en} className="rounded-2xl border bg-card p-5 shadow-card hover:-translate-y-0.5 transition">
                <div className="flex items-start justify-between">
                  <span className="text-3xl" aria-hidden>{g.emoji}</span>
                  <span className="rounded-full bg-amber/15 px-2.5 py-1 text-xs font-bold text-amber">
                    +{g.xp} XP
                  </span>
                </div>
                <h3 className="mt-4 font-display text-lg font-bold">{locale === "pt" ? g.pt : g.en}</h3>
                <Button asChild className="bg-gradient-sunset mt-4 w-full text-white shadow-soft hover:opacity-90">
                  <Link to="/lesson">{locale === "pt" ? "Jogar" : "Play"}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

          {games.map((g) => (
            <div
              key={g.en}
              className={`group relative overflow-hidden rounded-3xl border p-6 shadow-card transition-all ${
                g.unlocked
                  ? "border-border bg-card hover:-translate-y-1 hover:shadow-glow"
                  : "border-border bg-muted/40 opacity-70"
              }`}
            >
              <div className={`absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br ${g.color} opacity-15 blur-2xl transition-opacity group-hover:opacity-30`} />
              <div className="flex items-start justify-between">
                <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${g.color} shadow-soft`}>
                  <g.icon className="h-7 w-7 text-white" />
                </div>
                {g.unlocked ? (
                  <span className="rounded-full bg-amber/15 px-2.5 py-1 text-xs font-bold text-amber">
                    +{g.xp} XP
                  </span>
                ) : (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <h3 className="mt-5 font-display text-xl font-bold">{locale === "pt" ? g.pt : g.en}</h3>
              <div className="mt-1 text-sm text-muted-foreground">
                {g.unlocked
                  ? locale === "pt" ? "2–5 min · Todos os níveis" : "2–5 min · All levels"
                  : locale === "pt" ? "Complete a Unidade 3 para desbloquear" : "Complete Unit 3 to unlock"}
              </div>
              {g.unlocked && (
                <Button asChild className="bg-gradient-sunset mt-5 w-full text-white shadow-soft hover:opacity-90">
                  <Link to="/lesson">{locale === "pt" ? "Jogar" : "Play"}</Link>
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
