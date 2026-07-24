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
  { code: "A1", label: "Beginner", h: "h-16", bg: "bg-teal-50", text: "text-[#0EA5A4]" },
  { code: "A2", label: "Elementary", h: "h-20", bg: "bg-teal-100", text: "text-[#0EA5A4]" },
  { code: "B1", label: "Intermediate", h: "h-24", bg: "bg-teal-200", text: "text-[#0EA5A4]" },
  { code: "B2", label: "Upper-Int.", h: "h-28", bg: "bg-teal-300", text: "text-[#0EA5A4]" },
  { code: "C1", label: "Advanced", h: "h-32", bg: "bg-teal-400", text: "text-[#0EA5A4]" },
  { code: "C2", label: "Proficient", h: "h-36", bg: "bg-[#0EA5A4]", text: "text-white" },
];

const features = [
  { icon: Brain, name: "AI English Coach", desc: "Assistente 24/7 que corrige, sugere e conversa contigo." },
  { icon: BookOpen, name: "Interactive Lessons", desc: "Aulas dinâmicas com vídeo, texto e prática." },
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
  { value: "20,000+", label: "Active Students" },
  { value: "95%", label: "Course Completion" },
  { value: "4.9★", label: "Average Rating" },
  { value: "120+", label: "Interactive Lessons" },
  { value: "50+", label: "Speaking Challenges" },
  { value: "A1–C2", label: "Complete Levels" },
];

function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden pt-16 pb-28">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(1000px_500px_at_10%_-10%,color-mix(in_oklab,#0EA5A4_18%,transparent),transparent_60%),radial-gradient(800px_500px_at_95%_10%,color-mix(in_oklab,#84CC16_16%,transparent),transparent_60%)]" />
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 lg:grid-cols-2">
          <div className="animate-fade-in">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-lime-100 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#65a30d]">
              <Sparkles className="h-3.5 w-3.5" /> Premium English Coaching
            </div>
            <h1 className="text-5xl font-extrabold leading-[1.05] tracking-tight text-[#0F172A] md:text-6xl lg:text-7xl">
              Learn English Faster.
              <br />
              Speak With <span className="text-[#0EA5A4]">Confidence.</span>
              <br />
              Learn With Coach.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
              A plataforma <span className="font-bold text-[#0F172A]">LEARNING ENGLISH WITH COACH</span> ensina inglês do A1 ao C2 com IA, pronúncia IPA, conversação, vídeos, jogos, quizzes e aulas interativas — para crianças, adolescentes e adultos.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                to="/placement"
                className="group inline-flex items-center gap-2 rounded-2xl bg-[#0EA5A4] px-8 py-4 text-base font-bold text-white shadow-xl shadow-teal-500/25 transition-all hover:scale-[1.02] hover:bg-[#14B8A6]"
              >
                Start Learning
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/lesson"
                className="inline-flex items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-8 py-4 text-base font-bold text-[#0F172A] transition-all hover:border-[#0EA5A4] hover:text-[#0EA5A4]"
              >
                <Play className="h-4 w-4" /> Watch Demo
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-4">
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
                    <Star key={i} className="h-4 w-4 fill-[#84CC16] text-[#84CC16]" />
                  ))}
                </div>
                <p className="text-sm font-medium text-slate-500">Trusted by 20,000+ students worldwide</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="relative aspect-square overflow-hidden rounded-[2.5rem] shadow-2xl shadow-teal-900/20 ring-1 ring-white/40">
              <img
                src={heroStudents}
                alt="Diverse happy students learning English together"
                width={1024}
                height={1024}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-[#0EA5A4]/25 via-transparent to-[#84CC16]/10" />
              <div className="absolute left-6 top-6 rounded-2xl bg-white/85 px-4 py-2 text-xs font-black uppercase tracking-widest text-[#0EA5A4] backdrop-blur-md">
                Learning English with Coach
              </div>
            </div>
            {/* Floating stat card */}
            <div className="absolute -bottom-6 -left-6 flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-lime-100">
                <Trophy className="h-6 w-6 text-[#65a30d]" />
              </div>
              <div>
                <p className="text-lg font-black text-[#0F172A]">98%</p>
                <p className="text-xs font-medium text-slate-500">Fluency success rate</p>
              </div>
            </div>
            <div className="absolute -right-4 top-10 flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-xl">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-[#0EA5A4]">
                <Volume2 className="h-5 w-5" />
              </div>
              <div>
                <p className="font-mono text-xs text-slate-500">/ˈkoʊtʃ/</p>
                <p className="text-sm font-bold">coach</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-y border-slate-200 bg-white py-14">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 md:grid-cols-3 lg:grid-cols-6">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-['Poppins',_sans-serif] text-3xl font-extrabold text-[#0EA5A4] md:text-4xl">
                {s.value}
              </div>
              <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* AGE PANELS */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">Choose Your Path</h2>
            <div className="mx-auto mt-4 h-1.5 w-20 rounded-full bg-[#84CC16]" />
            <p className="mx-auto mt-4 max-w-xl text-slate-500">
              Programas especializados para cada fase da vida — todos na plataforma LEARNING ENGLISH WITH COACH.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
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

      {/* FEATURES */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-4 inline-block rounded-full bg-teal-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#0EA5A4]">
              Everything you need
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
              The complete toolkit of{" "}
              <span className="text-[#0EA5A4]">Learning English with Coach</span>
            </h2>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div
                key={f.name}
                className="group rounded-3xl border border-slate-100 bg-[#F8FAFC] p-6 transition-all hover:-translate-y-1 hover:bg-white hover:shadow-xl hover:shadow-teal-500/10"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-100 text-[#0EA5A4] transition-colors group-hover:bg-[#0EA5A4] group-hover:text-white">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-[#0F172A]">{f.name}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CEFR */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="rounded-[2.5rem] border border-slate-100 bg-white p-10 shadow-sm md:p-14">
            <div className="grid items-end gap-10 lg:grid-cols-4">
              <div className="lg:col-span-1">
                <div className="mb-3 inline-block rounded-full bg-lime-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#65a30d]">
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
                        className={`flex w-full ${lvl.h} items-center justify-center rounded-t-2xl ${lvl.bg} ${lvl.text} text-lg font-black shadow-sm transition-all group-hover:-translate-y-1 group-hover:shadow-lg`}
                      >
                        {lvl.code}
                      </div>
                      <div className="mt-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
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
      <section className="py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 md:grid-cols-2">
          <div>
            <div className="mb-4 inline-block rounded-full bg-teal-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#0EA5A4]">
              Real Results
            </div>
            <h2 className="text-4xl font-extrabold leading-tight tracking-tight">
              The results speak <br />
              <span className="text-[#84CC16]">for themselves.</span>
            </h2>
            <div className="mt-8 flex gap-12">
              <div>
                <div className="text-4xl font-black text-[#0EA5A4]">98%</div>
                <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Satisfaction
                </div>
              </div>
              <div>
                <div className="text-4xl font-black text-[#84CC16]">15k+</div>
                <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Lessons done
                </div>
              </div>
              <div>
                <div className="text-4xl font-black text-[#0F172A]">4.9★</div>
                <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Rating
                </div>
              </div>
            </div>
          </div>
          <div className="relative rounded-[2rem] bg-[#0F172A] p-10 text-white shadow-2xl">
            <div className="absolute -left-6 -top-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#84CC16] font-serif text-4xl leading-none text-[#0F172A]">
              "
            </div>
            <p className="text-xl italic leading-relaxed">
              LEWC transformou a minha forma de comunicar. Já não sobrevivo às reuniões em inglês — eu lidero-as.
            </p>
            <div className="mt-8 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#0EA5A4] to-[#84CC16]" />
              <div>
                <div className="font-bold">Sarah Jenkins</div>
                <div className="text-xs text-[#14B8A6]">Marketing Director · Level C1</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-6 py-20">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[3rem] bg-gradient-to-br from-[#0EA5A4] to-[#14B8A6] p-14 text-center text-white md:p-20">
          <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10" />
          <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-[#84CC16]/20 blur-2xl" />
          <div className="relative">
            <div className="mb-4 inline-block rounded-full bg-white/15 px-4 py-1.5 text-xs font-black uppercase tracking-widest">
              Learning English with Coach
            </div>
            <h2 className="text-4xl font-extrabold tracking-tight md:text-5xl">
              Start Your English Journey Today
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-white/85">
              Junta-te a milhares de estudantes que já falam com confiança. Começa grátis, sem cartão.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link
                to="/placement"
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-10 py-5 text-lg font-black text-[#0EA5A4] shadow-2xl transition-all hover:scale-105 hover:bg-[#84CC16] hover:text-white"
              >
                Start Free <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/pricing"
                className="inline-flex items-center gap-2 rounded-2xl border-2 border-white/40 px-10 py-5 text-lg font-bold text-white transition-all hover:bg-white/10"
              >
                Explore Courses
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
      ? "bg-teal-100 text-[#0EA5A4]"
      : tone === "lime"
        ? "bg-lime-100 text-[#65a30d]"
        : "bg-slate-900 text-white";
  return (
    <div
      className={`group relative overflow-hidden rounded-3xl border bg-white transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-teal-500/10 ${
        highlighted ? "border-[#84CC16] shadow-xl shadow-lime-500/10" : "border-slate-100"
      }`}
    >
      <div className="relative h-52 overflow-hidden">
        <img
          src={image}
          alt={title}
          loading="lazy"
          width={1024}
          height={1024}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#0F172A] backdrop-blur">
          {tag}
        </div>
        <div className="absolute bottom-4 left-4 text-[10px] font-black uppercase tracking-widest text-white/95">
          Learning English with Coach
        </div>
      </div>
      <div className="p-7">
        <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl ${chip}`}>
          <Target className="h-5 w-5" />
        </div>
        <h3 className="text-xl font-extrabold text-[#0F172A]">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">{desc}</p>
        <ul className="mt-5 space-y-2 text-sm">
          {bullets.map((b) => (
            <li key={b} className="flex items-center gap-2 font-medium text-slate-600">
              <span className="h-1.5 w-1.5 rounded-full bg-[#84CC16]" /> {b}
            </li>
          ))}
        </ul>
        <Link
          to="/placement"
          className="mt-6 inline-flex items-center gap-2 font-bold text-[#0EA5A4] transition-all hover:gap-3"
        >
          Explore Curriculum <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
