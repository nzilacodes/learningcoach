import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Sparkles,
  Mic,
  Gamepad2,
  Award,
  Users,
  Play,
  BookOpen,
  Headphones,
  PenTool,
  Trophy,
  Target,
  BarChart3,
  MessageCircle,
  Brain,
  Volume2,
  Star,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useLandingAnimations } from "@/hooks/use-landing-animations";
import { useLocale } from "@/lib/i18n";
import { useCurriculum } from "@/lib/learning";
import heroStudents from "@/assets/hero-students.jpg";
import panelKids from "@/assets/panel-kids.jpg";
import panelTeens from "@/assets/panel-teens.jpg";
import panelAdults from "@/assets/panel-adults.jpg";
import { SITE_URL } from "@/lib/site-url";

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({
    meta: [
      { title: "Learning English with Coach — Fluência A1 ao C2 com IA" },
      {
        name: "description",
        content:
          "LEARNING ENGLISH WITH COACH: plataforma premium de inglês do A1 ao C2 com AI Coach, pronúncia IPA, conversação e certificados para crianças, adolescentes e adultos.",
      },
      { property: "og:title", content: "Learning English with Coach — Fluência A1 ao C2 com IA" },
      {
        property: "og:description",
        content:
          "Aprenda inglês mais rápido. Fale com confiança. Aprenda com Coach — para crianças, adolescentes e adultos.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: SITE_URL },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: SITE_URL }],
  }),
});

const cefr = [
  { code: "A1", label: "Beginner", h: "h-16", bg: "bg-teal-50", text: "text-marketing-teal" },
  { code: "A2", label: "Elementary", h: "h-20", bg: "bg-teal-100", text: "text-marketing-teal" },
  { code: "B1", label: "Intermediate", h: "h-24", bg: "bg-teal-200", text: "text-marketing-teal" },
  { code: "B2", label: "Upper-Int.", h: "h-28", bg: "bg-teal-300", text: "text-marketing-teal" },
  { code: "C1", label: "Advanced", h: "h-32", bg: "bg-teal-400", text: "text-marketing-teal" },
  { code: "C2", label: "Proficient", h: "h-36", bg: "bg-marketing-teal", text: "text-white" },
];

const features = [
  {
    icon: Brain,
    name: "AI English Coach",
    desc: "Assistente 24/7 que corrige, sugere e conversa contigo.",
  },
  {
    icon: BookOpen,
    name: "Interactive Lessons",
    desc: "Aulas dinâmicas com vídeo, texto e prática.",
  },
  { icon: Mic, name: "IPA Pronunciation", desc: "Feedback fonético preciso em cada sílaba." },
  { icon: MessageCircle, name: "Speaking Practice", desc: "Sala de conversa com IA e nativos." },
  { icon: Headphones, name: "Listening Practice", desc: "Áudios reais em vários sotaques." },
  { icon: Sparkles, name: "Vocabulary Builder", desc: "Memorização por repetição espaçada." },
  { icon: PenTool, name: "Grammar & Writing", desc: "Regras claras, exercícios instantâneos." },
  { icon: Gamepad2, name: "Games & Quizzes", desc: "Aprenda enquanto joga." },
  { icon: BarChart3, name: "Progress Tracking", desc: "Métricas por skill, nível e streak." },
  { icon: Award, name: "Certificates", desc: "Diploma CEFR com QR de validação." },
  { icon: Trophy, name: "Leaderboard", desc: "Rankings mundial, nacional e amigos." },
  { icon: Users, name: "Community", desc: "Aprenda com estudantes de todo o mundo." },
];

const stats = [
  { value: "20,000+", label: "Active Students", target: 20000, suffix: "+", decimals: 0 },
  { value: "95%", label: "Course Completion", target: 95, suffix: "%", decimals: 0 },
  { value: "4.9★", label: "Average Rating", target: 4.9, suffix: "★", decimals: 1 },
  { value: "120+", label: "Interactive Lessons", target: 120, suffix: "+", decimals: 0 },
  { value: "50+", label: "Speaking Challenges", target: 50, suffix: "+", decimals: 0 },
  { value: "A1–C2", label: "Complete Levels" },
];

function LandingPage() {
  const root = useLandingAnimations();
  const { locale } = useLocale();
  const { data: curriculum } = useCurriculum();
  const demoCourse = curriculum?.courses.slice().sort((a, b) => a.order_index - b.order_index)[0];
  const demoUnit = curriculum?.units
    .filter((u) => u.course_id === demoCourse?.id)
    .sort((a, b) => a.order_index - b.order_index)[0];
  const demoLesson = curriculum?.lessons
    .filter((l) => l.unit_id === demoUnit?.id)
    .sort((a, b) => a.order_index - b.order_index)[0];
  return (
    <div ref={root} className="min-h-screen bg-marketing-surface text-marketing-ink">
      <SiteHeader />

      {/* HERO — Pinned with stats overlay */}
      <section data-anim="hero-section" className="relative overflow-hidden pt-28 pb-28 md:pt-36">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(1000px_500px_at_10%_-10%,color-mix(in_oklab,var(--marketing-teal)_18%,transparent),transparent_60%),radial-gradient(800px_500px_at_95%_10%,color-mix(in_oklab,var(--marketing-lime)_16%,transparent),transparent_60%)]" />
        {/* Hero content — z-10 */}
        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-14 px-6 lg:grid-cols-2">
          <div>
            <div
              data-anim="hero-badge"
              className="mb-6 inline-flex items-center gap-2 rounded-full bg-lime-100 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-marketing-lime-dark"
            >
              <Sparkles className="h-3.5 w-3.5" /> Premium English Coaching
            </div>
            <h1 className="text-5xl font-extrabold leading-[1.05] tracking-tight text-marketing-ink md:text-6xl lg:text-7xl">
              <span data-anim="hero-line" className="block">
                Learn English Faster.
              </span>
              <span data-anim="hero-line" className="block">
                Speak With <span className="text-marketing-teal">Confidence.</span>
              </span>
              <span data-anim="hero-line" className="block">
                Learn With Coach.
              </span>
            </h1>
            <p
              data-anim="hero-copy"
              className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600"
            >
              A plataforma{" "}
              <span className="font-bold text-marketing-ink">LEARNING ENGLISH WITH COACH</span>{" "}
              ensina inglês do A1 ao C2 com IA, pronúncia IPA, conversação, vídeos, jogos, quizzes e
              aulas interativas — para crianças, adolescentes e adultos.
            </p>
            <div data-anim="hero-cta" className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                to="/placement"
                className="group inline-flex items-center gap-3 rounded-full bg-marketing-ink px-8 py-4 text-sm font-bold uppercase tracking-widest text-white shadow-xl transition-all hover:scale-[1.02] hover:shadow-2xl"
              >
                {locale === "pt" ? "Começar agora" : "Start now"}
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-marketing-ink">
                  <ArrowRight className="h-5 w-5 -rotate-45 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </Link>
              <Link
                to={demoLesson ? "/lesson/$lessonId" : "/curriculum"}
                params={demoLesson ? { lessonId: demoLesson.id } : undefined}
                className="inline-flex items-center gap-3 rounded-full border-2 border-slate-200 bg-white px-8 py-4 text-sm font-bold uppercase tracking-widest text-marketing-ink transition-all hover:border-marketing-teal hover:text-marketing-teal"
              >
                <Play className="h-4 w-4" />
                {locale === "pt" ? "Ver demo" : "Watch demo"}
              </Link>
            </div>
            <div data-anim="hero-social" className="mt-8 flex items-center gap-4">
              <div className="flex -space-x-3">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-10 w-10 rounded-full border-2 border-white shadow"
                    style={{
                      background: `linear-gradient(135deg, hsl(${170 + i * 15} 60% 55%), hsl(${80 + i * 20} 65% 55%))`,
                    }}
                  />
                ))}
              </div>
              <div>
                <div className="flex items-center gap-0.5">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} className="h-4 w-4 fill-marketing-lime text-marketing-lime" />
                  ))}
                </div>
                <p className="text-sm font-medium text-slate-500">
                  Trusted by 20,000+ students worldwide
                </p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div
              data-anim="hero-image"
              className="relative aspect-square overflow-hidden rounded-[2.5rem] shadow-2xl shadow-teal-900/20 ring-1 ring-white/40"
            >
              <img
                src={heroStudents}
                alt="Diverse happy students learning English together"
                width={1024}
                height={1024}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-marketing-teal/25 via-transparent to-marketing-lime/10" />
              <div className="absolute left-6 top-6 rounded-2xl bg-white/85 px-4 py-2 text-xs font-black uppercase tracking-widest text-marketing-teal backdrop-blur-md">
                Learning English with Coach
              </div>
            </div>
            {/* Floating stat card */}
            <div
              data-anim="hero-float"
              className="absolute -bottom-6 -left-6 flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-xl"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-lime-100">
                <Trophy className="h-6 w-6 text-marketing-lime-dark" />
              </div>
              <div>
                <p className="text-lg font-black text-marketing-ink">98%</p>
                <p className="text-xs font-medium text-slate-500">Fluency success rate</p>
              </div>
            </div>
            <div
              data-anim="hero-float"
              className="absolute -right-4 top-10 flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-xl"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-marketing-teal">
                <Volume2 className="h-5 w-5" />
              </div>
              <div>
                <p className="font-mono text-xs text-slate-500">/ˈkoʊtʃ/</p>
                <p className="text-sm font-bold">coach</p>
              </div>
            </div>
          </div>
        </div>

        {/* Dim overlay — z-15, above content — desktop only via CSS */}
        <div data-anim="hero-dim" className="hero-dim-overlay hidden md:block" />

        {/* STATS — Desktop: overlay on hero | Mobile: normal section below */}
        <div
          data-anim="stats-overlay"
          className="pointer-events-none absolute inset-0 z-20 hidden items-center justify-center md:flex"
        >
          <div className="grid w-full max-w-3xl grid-cols-2 gap-4 px-6 sm:grid-cols-3 sm:gap-5">
            {stats.map((s, i) => (
              <div
                key={s.label}
                data-anim="stat-card"
                data-index={i}
                className="stat-card pointer-events-auto rounded-3xl border border-white/20 bg-white/95 p-6 text-center shadow-2xl shadow-black/15 backdrop-blur-md sm:p-8"
              >
                <div
                  data-anim="stat-counter"
                  data-target={s.target ?? 0}
                  data-suffix={"suffix" in s ? s.suffix : undefined}
                  data-decimals={"decimals" in s ? s.decimals : undefined}
                  className="font-display text-3xl font-extrabold text-marketing-teal sm:text-4xl"
                >
                  {"target" in s && s.target !== undefined ? "0" : s.value}
                </div>
                <div className="mt-2 text-2xs font-semibold uppercase tracking-wider text-slate-400 sm:text-xs">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS — Mobile only: normal section below hero */}
      <section className="border-y border-slate-100 bg-white py-10 md:hidden">
        <div className="mx-auto grid grid-cols-2 gap-4 px-6">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-slate-100 bg-white p-4 text-center shadow-md"
            >
              <div className="font-display text-2xl font-extrabold text-marketing-teal">
                {s.value}
              </div>
              <div className="mt-1 text-2xs font-semibold uppercase tracking-wider text-slate-400">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PINNED CONTAINER — Choose Your Path + Toolkit */}
      <div
        data-anim="pin-container"
        className="relative min-h-screen overflow-visible md:h-screen md:overflow-clip"
      >
        {/* SECTION 1: Choose Your Path */}
        <section
          data-anim="age-panels-section"
          className="h-full flex items-center bg-marketing-surface"
        >
          <div className="mx-auto max-w-7xl px-6 w-full py-10">
            <div className="headline-container text-center mb-10">
              <h2>Choose Your Path</h2>
              <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-marketing-lime" />
              <p className="mx-auto mt-3 max-w-xl text-sm text-slate-500">
                Programas especializados para cada fase da vida — todos na plataforma LEARNING
                ENGLISH WITH COACH.
              </p>
            </div>

            <div className="cards-grid">
              <AgePanel
                image={panelKids}
                tag="Ages 5–11"
                title="Learning English for Kids"
                desc="Aulas coloridas e gamificadas que constroem confiança desde a primeira palavra."
                tone="teal"
                bullets={["Phonics & Alphabet", "Songs & Games", "Speaking Buddies"]}
              />
              <AgePanel
                image={panelTeens}
                tag="Ages 12–17"
                title="English for Teenagers"
                desc="Preparação académica e conversação real com colegas do mundo inteiro."
                tone="lime"
                bullets={["Exam Prep TOEFL/IELTS", "Debates & Speaking", "Interactive Videos"]}
                highlighted
              />
              <AgePanel
                image={panelAdults}
                tag="Ages 18+"
                title="Professional English for Adults"
                desc="Fluência para reuniões, apresentações e crescimento de carreira global."
                tone="dark"
                bullets={["Business English", "1:1 with Coach", "Networking Practice"]}
              />
            </div>
          </div>
        </section>

        {/* SECTION 2: The Complete Toolkit — Dark Bento */}
        <section
          className="relative w-full z-10 bg-[#030712] md:absolute md:top-full md:left-0 md:h-full md:overflow-y-auto"
          data-anim="toolkit-section"
        >
          {/* Clip-path wave SVG definition */}
          <svg width="0" height="0" className="absolute">
            <defs>
              <clipPath id="waveClip" clipPathUnits="objectBoundingBox">
                <path d="M 0,1 L 0,0.08 C 0.33,-0.03 0.66,0.05 1,0.08 L 1,1 Z" />
              </clipPath>
            </defs>
          </svg>

          <div className="mx-auto max-w-7xl px-6 py-12 h-full flex flex-col justify-center">
            {/* Bento Header */}
            <div data-anim="bento-header" className="mb-8">
              <div className="mb-3 inline-block rounded-full bg-teal-900/50 px-3 py-1 text-2xs font-bold uppercase tracking-widest text-teal-300">
                Everything you need
              </div>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <h2 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">
                  The complete toolkit of{" "}
                  <span className="text-marketing-teal-dark">Learning English with Coach</span>
                </h2>
                <p className="max-w-xs text-xs leading-relaxed text-gray-500 lg:text-right">
                  Todas as ferramentas para dominares o inglês — do A1 ao C2.
                </p>
              </div>
            </div>

            {/* Bento Grid */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((f) => (
                <div key={f.name} className="bento-card" data-anim="feature-card">
                  <div className="bento-card-inner">
                    <div className="icon-wrapper" data-anim="feature-icon">
                      <f.icon className="h-4 w-4" />
                    </div>
                    <h3 className="split-text">{f.name}</h3>
                    <p>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* CEFR */}
      <section data-anim="cefr-section" className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="rounded-[2.5rem] border border-slate-100 bg-white p-10 shadow-sm md:p-14">
            <div className="grid items-end gap-10 lg:grid-cols-4">
              <div data-anim="section-heading" className="lg:col-span-1">
                <div className="mb-3 inline-block rounded-full bg-lime-100 px-3 py-1 text-2xs font-black uppercase tracking-widest text-marketing-lime-dark">
                  CEFR Aligned
                </div>
                <h2 className="text-3xl font-extrabold tracking-tight">
                  From first words to full fluency.
                </h2>
                <p className="mt-3 text-sm text-slate-500">
                  Cada nível concluído gera um certificado LEWC oficial.
                </p>
              </div>
              <div className="lg:col-span-3">
                <div className="grid grid-cols-6 items-end gap-3">
                  {cefr.map((lvl) => (
                    <div key={lvl.code} className="group flex flex-col items-center">
                      <div
                        data-anim="cefr-bar"
                        className={`flex w-full origin-bottom ${lvl.h} items-center justify-center rounded-t-2xl ${lvl.bg} ${lvl.text} text-lg font-black shadow-sm transition-shadow group-hover:shadow-lg`}
                      >
                        {lvl.code}
                      </div>
                      <div
                        data-anim="cefr-label"
                        className="mt-2 text-2xs font-semibold uppercase tracking-widest text-slate-400"
                      >
                        {lvl.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIAL / RESULTS */}
      <section data-anim="results-section" className="py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 md:grid-cols-2">
          <div data-anim="testimonial-copy">
            <div className="mb-4 inline-block rounded-full bg-teal-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-marketing-teal">
              Real Results
            </div>
            <h2 className="text-4xl font-extrabold leading-tight tracking-tight">
              The results speak <br />
              <span className="text-marketing-lime">for themselves.</span>
            </h2>
            <div className="mt-8 flex gap-12">
              <div data-anim="result-stat">
                <div className="text-4xl font-black text-marketing-teal">98%</div>
                <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Satisfaction
                </div>
              </div>
              <div data-anim="result-stat">
                <div className="text-4xl font-black text-marketing-lime">15k+</div>
                <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Lessons done
                </div>
              </div>
              <div data-anim="result-stat">
                <div className="text-4xl font-black text-marketing-ink">4.9★</div>
                <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Rating
                </div>
              </div>
            </div>
          </div>
          <div
            data-anim="testimonial-card"
            className="relative rounded-[2rem] bg-marketing-ink p-10 text-white shadow-2xl"
          >
            <div
              data-anim="testimonial-quote-mark"
              className="absolute -left-6 -top-6 flex h-14 w-14 items-center justify-center rounded-full bg-marketing-lime font-serif text-4xl leading-none text-marketing-ink"
            >
              "
            </div>
            <p className="text-xl italic leading-relaxed">
              LEWC transformou a minha forma de comunicar. Já não sobrevivo às reuniões em inglês —
              eu lidero-as.
            </p>
            <div className="mt-8 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-marketing-teal to-marketing-lime" />
              <div>
                <div className="font-bold">Sarah Jenkins</div>
                <div className="text-xs text-marketing-teal-dark">
                  Marketing Director · Level C1
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-6 py-20">
        <div
          data-anim="final-cta"
          className="relative mx-auto max-w-6xl overflow-hidden rounded-[3rem] bg-gradient-to-br from-marketing-teal to-marketing-teal-dark p-14 text-center text-white md:p-20"
        >
          <div
            data-anim="decor-circle"
            className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10"
          />
          <div
            data-anim="decor-circle"
            className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-marketing-lime/20 blur-2xl"
          />
          <div className="relative">
            <div className="mb-4 inline-block rounded-full bg-white/15 px-4 py-1.5 text-xs font-black uppercase tracking-widest">
              Learning English with Coach
            </div>
            <h2 className="text-4xl font-extrabold tracking-tight md:text-5xl">
              Start Your English Journey Today
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-white/85">
              Junta-te a milhares de estudantes que já falam com confiança. Começa grátis, sem
              cartão.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link
                to="/placement"
                className="group inline-flex items-center gap-3 rounded-full bg-white px-8 py-4 text-sm font-bold uppercase tracking-widest text-marketing-ink shadow-2xl transition-all hover:scale-105"
              >
                {locale === "pt" ? "Começar grátis" : "Start for free"}
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-marketing-ink text-white">
                  <ArrowRight className="h-5 w-5 -rotate-45 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </Link>
              <Link
                to="/pricing"
                className="inline-flex items-center gap-2 rounded-full border-2 border-white/40 px-8 py-4 text-sm font-bold uppercase tracking-widest text-white transition-all hover:bg-white/10"
              >
                {locale === "pt" ? "Ver planos" : "View plans"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function AgePanel({
  image,
  tag,
  title,
  desc,
  bullets,
  tone,
  highlighted,
}: {
  image: string;
  tag: string;
  title: string;
  desc: string;
  bullets: string[];
  tone: "teal" | "lime" | "dark";
  highlighted?: boolean;
}) {
  const chip =
    tone === "teal"
      ? "bg-teal-100 text-marketing-teal"
      : tone === "lime"
        ? "bg-lime-100 text-marketing-lime-dark"
        : "bg-slate-900 text-white";
  return (
    <div className="card-wrapper" data-anim="age-panel">
      <div className="card-content">
        <div className="relative h-36 overflow-hidden rounded-xl mb-4">
          <img
            src={image}
            alt={title}
            loading="lazy"
            width={1024}
            height={1024}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          <div className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-2xs font-black uppercase tracking-widest text-marketing-ink backdrop-blur">
            {tag}
          </div>
          {highlighted && (
            <div className="absolute right-3 top-3 rounded-full bg-marketing-teal px-2.5 py-0.5 text-2xs font-black uppercase tracking-widest text-white">
              Popular
            </div>
          )}
          <div className="absolute bottom-3 left-3 text-2xs font-black uppercase tracking-widest text-white/95">
            Learning English with Coach
          </div>
        </div>
        <div className={`isometric-icon ${chip}`}>
          <Target className="h-8 w-8" />
        </div>
        <h3 className="text-base font-bold text-marketing-ink">{title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{desc}</p>
        <ul className="mt-3 space-y-1.5">
          {bullets.map((b) => (
            <li key={b} className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-marketing-lime" /> {b}
            </li>
          ))}
        </ul>
        <Link
          to="/placement"
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-marketing-teal transition-all hover:gap-2.5"
        >
          Explore Curriculum <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
