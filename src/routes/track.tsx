import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useAgeGroup } from "@/lib/use-age-group";
import { AGE_TRACKS, AGE_GROUP_LABEL, type AgeGroup } from "@/lib/age-tracks";
import { useAgeTheme } from "@/lib/age-theme";
import {
  Sparkles,
  BookOpen,
  Gamepad2,
  Youtube,
  MessageSquare,
  GraduationCap,
  Users,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/track")({
  component: TrackPage,
  head: () => ({
    meta: [
      { title: "Meu Percurso — Learning English with Coach" },
      {
        name: "description",
        content:
          "Percurso de inglês personalizado por idade: Crianças (6–12), Adolescentes (13–17) e Adultos (18+). Temas, vocabulário, jogos e vídeos diferentes para cada faixa etária.",
      },
      { property: "og:title", content: "Meu Percurso — Learning English with Coach" },
      {
        property: "og:description",
        content: "Percursos diferenciados para crianças, adolescentes e adultos, personalizados automaticamente pela idade.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
});

const GROUPS: AgeGroup[] = ["kids", "teens", "adults"];

function TrackPage() {
  const { locale } = useLocale();
  const { user } = useAuth();
  const { group, source, age } = useAgeGroup();
  const { setTheme } = useAgeTheme();
  const track = AGE_TRACKS[group];
  const label = AGE_GROUP_LABEL[group];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className={`bg-gradient-to-br ${track.color} text-white`}>
          <div className="container mx-auto px-4 py-14 max-w-5xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-3 py-1 text-xs font-semibold uppercase tracking-widest mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              {locale === "pt" ? "Meu percurso" : "My track"} · {label.pt} ({label.range})
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-3">
              {locale === "pt" ? track.hero.pt : track.hero.en}
            </h1>
            <p className="text-lg text-white/90 max-w-2xl">
              {locale === "pt" ? track.tagline.pt : track.tagline.en}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              {GROUPS.map((g) => {
                const active = g === group;
                return (
                  <button
                    key={g}
                    onClick={() => setTheme(g)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition backdrop-blur ${
                      active
                        ? "bg-white text-slate-900 border-white"
                        : "bg-white/10 hover:bg-white/20 border-white/30 text-white"
                    }`}
                  >
                    {AGE_GROUP_LABEL[g].pt} · {AGE_GROUP_LABEL[g].range}
                  </button>
                );
              })}
            </div>

            {user && (
              <p className="mt-4 text-sm text-white/80">
                {source === "profile" && age != null
                  ? locale === "pt"
                    ? `Personalizado automaticamente para a sua idade (${age} anos).`
                    : `Auto-personalized for your age (${age}).`
                  : locale === "pt"
                    ? "Defina a sua idade no perfil para personalização automática."
                    : "Set your age in the profile for auto-personalization."}
              </p>
            )}
          </div>
        </section>

        <section className="container mx-auto px-4 py-12 max-w-5xl space-y-12">
          {/* Themes */}
          <Block
            icon={<BookOpen className="w-5 h-5" />}
            title={locale === "pt" ? "Temas do percurso" : "Track themes"}
          >
            <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
              {track.themes.map((t) => (
                <div key={t.en} className="rounded-xl border bg-card p-4 flex items-center gap-3">
                  <span className="text-2xl" aria-hidden>{t.emoji}</span>
                  <div>
                    <div className="text-sm font-medium">{locale === "pt" ? t.pt : t.en}</div>
                  </div>
                </div>
              ))}
            </div>
          </Block>

          {/* Vocabulary */}
          <Block
            icon={<GraduationCap className="w-5 h-5" />}
            title={locale === "pt" ? "Vocabulário essencial" : "Essential vocabulary"}
          >
            <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
              {track.vocabulary.map((v) => (
                <div key={v.word} className="rounded-xl border bg-card p-4 text-center">
                  <div className="text-3xl mb-1" aria-hidden>{v.emoji}</div>
                  <div className="font-semibold">{v.word}</div>
                  <div className="text-xs text-muted-foreground">{v.pt}</div>
                </div>
              ))}
            </div>
          </Block>

          {/* Examples */}
          <Block
            icon={<MessageSquare className="w-5 h-5" />}
            title={locale === "pt" ? "Exemplos reais" : "Real examples"}
          >
            <ul className="space-y-2">
              {track.examples.map((e) => (
                <li key={e.en} className="rounded-xl border bg-card p-4">
                  <div className="font-medium">{e.en}</div>
                  <div className="text-sm text-muted-foreground">{e.pt}</div>
                </li>
              ))}
            </ul>
          </Block>

          {/* Games */}
          <Block
            icon={<Gamepad2 className="w-5 h-5" />}
            title={locale === "pt" ? "Jogos para esta idade" : "Games for this age"}
            action={
              <Button asChild variant="outline" size="sm">
                <Link to="/games">
                  {locale === "pt" ? "Ver todos" : "See all"} <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            }
          >
            <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
              {track.games.map((g) => (
                <div key={g.id} className="rounded-xl border bg-card p-4 flex items-center gap-3">
                  <span className="text-2xl" aria-hidden>{g.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{locale === "pt" ? g.pt : g.en}</div>
                    <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">+{g.xp} XP</div>
                  </div>
                </div>
              ))}
            </div>
          </Block>

          {/* Exercises */}
          <Block
            icon={<Users className="w-5 h-5" />}
            title={locale === "pt" ? "Exercícios recomendados" : "Recommended exercises"}
          >
            <div className="grid gap-3 md:grid-cols-2">
              {track.exercises.map((ex) => (
                <div key={ex.en} className="rounded-xl border bg-card p-4 flex items-center gap-3">
                  <span className="text-2xl" aria-hidden>{ex.icon}</span>
                  <div className="text-sm">{locale === "pt" ? ex.pt : ex.en}</div>
                </div>
              ))}
            </div>
          </Block>

          {/* Videos */}
          <Block
            icon={<Youtube className="w-5 h-5" />}
            title={locale === "pt" ? "Vídeos curados" : "Curated videos"}
          >
            <div className="grid gap-3 md:grid-cols-3">
              {track.videos.map((v) => (
                <a
                  key={v.url}
                  href={v.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border bg-card p-4 hover:bg-accent transition block"
                >
                  <div className="text-xs text-muted-foreground mb-1">{v.channel} · {v.level}</div>
                  <div className="font-medium">{locale === "pt" ? v.title.pt : v.title.en}</div>
                  <div className="mt-2 text-xs text-primary inline-flex items-center gap-1">
                    <Youtube className="w-3.5 h-3.5" /> YouTube
                  </div>
                </a>
              ))}
            </div>
          </Block>

          <div className="rounded-2xl border p-6 bg-card text-center">
            <h2 className="text-xl font-bold mb-2">
              {locale === "pt" ? "Começar aula personalizada" : "Start a personalized lesson"}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              {locale === "pt"
                ? "Aulas, jogos e vídeos adaptados ao seu perfil etário."
                : "Lessons, games and videos tailored to your age profile."}
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button asChild>
                <Link to="/curriculum">{locale === "pt" ? "Ir para o Currículo" : "Go to Curriculum"}</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/games">{locale === "pt" ? "Ver Jogos" : "See Games"}</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function Block({
  icon,
  title,
  action,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold inline-flex items-center gap-2">
          <span className="text-primary">{icon}</span>
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}
