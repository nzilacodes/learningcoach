import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Sparkles,
  Mic,
  Users,
  BookOpen,
  Headphones,
  PenTool,
  Target,
  BarChart3,
  Brain,
  Volume2,
} from "lucide-react";
import { LandingSiteHeader } from "@/components/landing-site-header";
import { SiteFooter } from "@/components/site-footer";
import { useLocale } from "@/lib/i18n";
import lewcHeroIllustration from "@/assets/lewc-hero-illustration-friendly-right-with-phrases.png";
import "../styles/landing-hero.css";
import "../styles/landing-stats.css";
import "../styles/landing-path.css";
import "../styles/landing-toolkit-video.css";
import "../styles/landing-cefr.css";
import "../styles/landing-results.css";
import "../styles/landing-final-cta.css";
import panelKids from "@/assets/lewc-card-kids.png";
import panelTeens from "@/assets/lewc-card-teens.png";
import panelAdults from "@/assets/lewc-card-adults.png";
import coachCharacter from "@/assets/lewc-ai-coach-character-lineart-transparent.png";
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

const stats = [
  {
    icon: Users,
    value: "20,000+",
    label: "Active Students",
    target: 20000,
    suffix: "+",
    decimals: 0,
  },
  {
    icon: BarChart3,
    value: "95%",
    label: "Course Completion",
    target: 95,
    suffix: "%",
    decimals: 0,
  },
  {
    icon: BookOpen,
    value: "120+",
    label: "Interactive Lessons",
    target: 120,
    suffix: "+",
    decimals: 0,
  },
  { icon: Mic, value: "50+", label: "Speaking Challenges", target: 50, suffix: "+", decimals: 0 },
  { icon: Target, value: "A1–C2", label: "Complete Levels" },
];

const toolkitFeatures = [
  { icon: Brain, name: "AI English Coach", desc: "Your personal coach available 24/7." },
  { icon: BookOpen, name: "Interactive Lessons", desc: "Engaging lessons for every level." },
  { icon: Volume2, name: "IPA Pronunciation", desc: "Master sounds with IPA guidance." },
  { icon: Mic, name: "Speaking Practice", desc: "Speak confidently with real-time feedback." },
  { icon: Headphones, name: "Listening Practice", desc: "Train your ear with real conversations." },
  { icon: Sparkles, name: "Vocabulary Builder", desc: "Learn words in context and remember more." },
  { icon: PenTool, name: "Grammar & Writing", desc: "Write better with clear grammar guidance." },
  { icon: BarChart3, name: "Progress Tracking", desc: "Track your growth and stay motivated." },
];

function LandingPage() {
  const { locale } = useLocale();
  return (
    <div className="min-h-screen bg-marketing-surface text-marketing-ink">
      <LandingSiteHeader />

      {/* HERO — conteúdo editorial à esquerda, ilustração de aprendizagem à direita */}
      <section data-anim="hero-section" className="lewc-hero-section">
        <img
          data-anim="hero-image"
          className="lewc-hero-illustration"
          src={lewcHeroIllustration}
          alt="Ilustração de aprendizagem de inglês com vocabulário, speaking e listening"
        />
        <div className="lewc-hero-inner">
          <div className="lewc-hero-copy">
            <h1 data-anim="hero-line" className="lewc-hero-title">
              <span>Learn English Faster.</span>
              <span>
                <em>Speak</em> With Confidence.
              </span>
              <span>
                Learn With <em>Coach</em>
              </span>
            </h1>
            <p data-anim="hero-copy" className="lewc-hero-description">
              {locale === "pt"
                ? "Aprende inglês com vocabulário, pronúncia, listening e speaking numa jornada simples, prática e acompanhada pelo Coach."
                : "Build vocabulary, improve pronunciation, and practice listening and speaking with your Coach."}
            </p>
            <div data-anim="hero-cta" className="lewc-hero-actions">
              <Link to="/auth" className="lewc-hero-primary">
                {locale === "pt" ? "Fazer teste de nível" : "Take level test"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* MÉTRICAS — prova social e resultados da plataforma */}
      <section className="lewc-stats-section" aria-label="Resultados da plataforma">
        <div className="lewc-stats-grid">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <article key={s.label} className="lewc-stat-card">
                <div className="lewc-stat-icon" aria-hidden="true">
                  <Icon />
                </div>
                <div className="lewc-stat-value">{s.value}</div>
                <div className="lewc-stat-label">{s.label}</div>
              </article>
            );
          })}
        </div>
      </section>

      {/* PINNED CONTAINER — Choose Your Path + Toolkit */}
      <div className="relative min-h-screen overflow-visible">
        {/* SECTION 1: Choose Your Path */}
        <section data-anim="age-panels-section" className="lewc-path-section">
          <div className="lewc-path-decoration lewc-path-decoration-left" aria-hidden="true" />
          <div className="lewc-path-decoration lewc-path-decoration-right" aria-hidden="true" />
          <div className="lewc-path-shell">
            <header className="lewc-path-header">
              <h2>Choose Your Path</h2>
              <p>Personalized English learning for every age and goal.</p>
              <div className="lewc-path-rule" aria-hidden="true">
                <span />
              </div>
            </header>

            <div className="lewc-path-grid">
              <AgePanel
                image={panelKids}
                tag="Ages 5–11"
                title="Learning English for Kids"
                desc="Build confidence through fun, interactive lessons and exciting activities."
                tone="teal"
              />
              <AgePanel
                image={panelTeens}
                tag="Ages 12–17"
                title="English for Teenagers"
                desc="Develop real-world communication skills for school, exams, and beyond."
                tone="lime"
              />
              <AgePanel
                image={panelAdults}
                tag="Ages 18+"
                title="Professional English for Adults"
                desc="Advance your career with clear communication, leadership, and global fluency."
                tone="dark"
              />
            </div>
          </div>
        </section>

        {/* SECTION 2: The Complete Toolkit — estrutura responsiva construída em React/CSS */}
        <section className="lewc-toolkit-section" data-anim="toolkit-section">
          <div className="lewc-toolkit-shell">
            <header className="lewc-toolkit-header">
              <p className="lewc-toolkit-eyebrow">Everything you need</p>
              <h2 className="lewc-toolkit-heading">
                The complete toolkit of Learning English with Coach
              </h2>
            </header>

            <div className="lewc-toolkit-stage">
              <div className="lewc-toolkit-cluster lewc-toolkit-cluster-left lewc-toolkit-cluster-top">
                {toolkitFeatures.slice(0, 4).map((feature) => (
                  <ToolkitCard key={feature.name} feature={feature} />
                ))}
              </div>

              <div className="lewc-toolkit-coach" aria-label="AI Coach central">
                <span className="lewc-toolkit-coach-word is-learn">Learn</span>
                <img
                  className="lewc-toolkit-coach-character"
                  src={coachCharacter}
                  alt=""
                  aria-hidden="true"
                />
                <span className="lewc-toolkit-coach-word is-practise">Practise</span>
                <span className="lewc-toolkit-coach-word is-speak">Speak</span>
              </div>

              <div className="lewc-toolkit-cluster lewc-toolkit-cluster-right lewc-toolkit-cluster-bottom">
                {toolkitFeatures.slice(4).map((feature) => (
                  <ToolkitCard key={feature.name} feature={feature} />
                ))}
              </div>

              <ToolkitFlows />
            </div>
          </div>
        </section>
      </div>

      {/* CEFR — design criativo aprovado */}
      <section data-anim="cefr-section" className="lewc-cefr-section">
        <div className="lewc-cefr-frame">
          <div className="lewc-cefr-blob lewc-cefr-blob-top" aria-hidden="true" />
          <div className="lewc-cefr-blob lewc-cefr-blob-bottom" aria-hidden="true" />

          <header className="lewc-cefr-intro">
            <p className="lewc-cefr-eyebrow">CEFR Aligned</p>
            <h2 className="lewc-cefr-heading">From first words to full fluency.</h2>
            <p className="lewc-cefr-intro-copy">
              Cada nível concluído gera um certificado LEWC oficial.
            </p>
          </header>

          <div
            className="lewc-cefr-learning-map"
            aria-label="Progressão dos níveis CEFR de A1 a C2"
          >
            <div className="lewc-cefr-orbit" aria-hidden="true" />
            <div className="lewc-cefr-levels">
              <div className="lewc-cefr-level">
                <div className="lewc-cefr-level-dot">A1</div>
                <div className="lewc-cefr-level-name">Beginner</div>
                <div className="lewc-cefr-level-note">Start</div>
              </div>
              <div className="lewc-cefr-level">
                <div className="lewc-cefr-level-dot">A2</div>
                <div className="lewc-cefr-level-name">Elementary</div>
                <div className="lewc-cefr-level-note">Everyday</div>
              </div>
              <div className="lewc-cefr-level">
                <div className="lewc-cefr-level-dot">B1</div>
                <div className="lewc-cefr-level-name">Intermediate</div>
                <div className="lewc-cefr-level-note">Connect</div>
              </div>
              <div className="lewc-cefr-level">
                <div className="lewc-cefr-level-dot">B2</div>
                <div className="lewc-cefr-level-name">Upper-Int.</div>
                <div className="lewc-cefr-level-note">Fluency</div>
              </div>
              <div className="lewc-cefr-level">
                <div className="lewc-cefr-level-dot">C1</div>
                <div className="lewc-cefr-level-name">Advanced</div>
                <div className="lewc-cefr-level-note">Lead</div>
              </div>
              <div className="lewc-cefr-level">
                <div className="lewc-cefr-level-dot">C2</div>
                <div className="lewc-cefr-level-name">Proficient</div>
                <div className="lewc-cefr-level-note">Mastery</div>
              </div>
            </div>

            <div className="lewc-cefr-book" aria-hidden="true">
              <span className="lewc-cefr-book-spine" />
              <span className="lewc-cefr-book-word lewc-cefr-book-word-left">Learn</span>
              <span className="lewc-cefr-book-word lewc-cefr-book-word-right">Speak</span>
            </div>
            <div className="lewc-cefr-certificate" aria-label="Certificado LEWC">
              ✓
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIAL / RESULTS — design de prova visual aprovado */}
      <section className="lewc-results-section">
        <div className="lewc-results-frame">
          <div className="lewc-results-copy">
            <p className="lewc-results-eyebrow">Real Results</p>
            <h2 className="lewc-results-heading">
              The results speak <span className="lewc-results-heading-accent">for themselves.</span>
            </h2>
            <p className="lewc-results-description">
              Resultados reais de estudantes que estão a ganhar confiança, fluência e voz em inglês.
            </p>
            <div className="lewc-results-stats">
              <div className="lewc-results-stat">
                <div className="lewc-results-stat-value">98%</div>
                <div className="lewc-results-stat-label">Satisfaction</div>
              </div>
              <div className="lewc-results-stat">
                <div className="lewc-results-stat-value">15k+</div>
                <div className="lewc-results-stat-label">Lessons done</div>
              </div>
              <div className="lewc-results-stat">
                <div className="lewc-results-stat-value">4.9★</div>
                <div className="lewc-results-stat-label">Rating</div>
              </div>
            </div>
          </div>

          <div className="lewc-results-proof">
            <div className="lewc-results-proof-top">
              <span>Student confidence signal</span>
              <span className="lewc-results-proof-badge">Verified story</span>
            </div>
            <div className="lewc-results-proof-main">
              <div className="lewc-results-ring" aria-label="98 percent overall result">
                <div className="lewc-results-ring-content">
                  <div className="lewc-results-ring-value">98%</div>
                  <div className="lewc-results-ring-label">Overall result</div>
                </div>
              </div>
              <div className="lewc-results-quote">
                <div className="lewc-results-quote-mark" aria-hidden="true">
                  “
                </div>
                <p className="lewc-results-quote-text">
                  LEWC transformou a minha forma de comunicar. Já não sobrevivo às reuniões em
                  inglês — eu lidero-as.
                </p>
                <div className="lewc-results-person">
                  <div className="lewc-results-avatar" aria-hidden="true">
                    SJ
                  </div>
                  <div>
                    <div className="lewc-results-person-name">Sarah Jenkins</div>
                    <div className="lewc-results-person-role">Marketing Director</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="lewc-results-proof-foot">
              <span>From learning to leading</span>
              <span>
                <strong>Verified student story</strong>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA — English journey with complementary visual */}
      <section className="lewc-final-cta-section">
        <div className="lewc-final-cta-card">
          <div className="lewc-final-cta-layout">
            <div className="lewc-final-cta-copy">
              <p className="lewc-final-cta-eyebrow">Learning English with Coach</p>
              <h2 className="lewc-final-cta-heading">
                Start Your English{" "}
                <span className="lewc-final-cta-heading-accent">Journey Today</span>
              </h2>
              <p className="lewc-final-cta-description">
                Junta-te a milhares de estudantes que já falam com confiança. Começa grátis, sem
                cartão.
              </p>
              <div className="lewc-final-cta-actions">
                <Link to="/auth" className="lewc-final-cta-button lewc-final-cta-button-primary">
                  {locale === "pt" ? "Começar grátis" : "Start for free"}
                  <ArrowRight aria-hidden="true" />
                </Link>
                <Link
                  to="/pricing"
                  className="lewc-final-cta-button lewc-final-cta-button-secondary"
                >
                  {locale === "pt" ? "Ver planos" : "View plans"}
                  <ArrowRight aria-hidden="true" />
                </Link>
              </div>
            </div>

            <div
              className="lewc-final-cta-visual"
              aria-label="English learning journey from A1 to C2"
            >
              <div className="lewc-final-cta-visual-halo" aria-hidden="true" />
              <div className="lewc-final-cta-float lewc-final-cta-float-start" aria-hidden="true">
                Keep moving
              </div>
              <div className="lewc-final-cta-float lewc-final-cta-float-voice" aria-hidden="true">
                Find your voice
              </div>
              <div className="lewc-final-cta-ticket">
                <div className="lewc-final-cta-ticket-main">
                  <div className="lewc-final-cta-ticket-kicker">Your English journey</div>
                  <div className="lewc-final-cta-ticket-title">Your next step</div>
                  <p className="lewc-final-cta-ticket-subtitle">
                    A little progress becomes a confident voice.
                  </p>
                  <div className="lewc-final-cta-ticket-progress" aria-hidden="true">
                    <span />
                    <i />
                    <span />
                    <i />
                    <span />
                    <i />
                    <span />
                  </div>
                  <div className="lewc-final-cta-ticket-steps" aria-hidden="true">
                    <span>Learn</span>
                    <span>Practise</span>
                    <span>Speak</span>
                  </div>
                </div>
                <div className="lewc-final-cta-ticket-side">
                  <div>
                    <div className="lewc-final-cta-ticket-label">Keep going</div>
                    <strong>You’re ready</strong>
                  </div>
                  <span className="lewc-final-cta-ticket-plane" aria-hidden="true" />
                </div>
              </div>
              <div className="lewc-final-cta-caption">Your next conversation</div>
            </div>
          </div>
          <div className="lewc-final-cta-footer">
            <span>
              <strong>One step at a time.</strong> · Learn at your pace
            </span>
            <span>Your voice is waiting.</span>
          </div>
        </div>
      </section>

      <div className="lewc-final-footer-blend">
        <SiteFooter />
      </div>
    </div>
  );
}

function ToolkitCard({ feature }: { feature: (typeof toolkitFeatures)[number] }) {
  const Icon = feature.icon;
  return (
    <article className="lewc-toolkit-card">
      <div className="lewc-toolkit-card-icon" aria-hidden="true">
        <Icon />
      </div>
      <div className="lewc-toolkit-card-copy">
        <h3 className="lewc-toolkit-card-title">{feature.name}</h3>
        <p className="lewc-toolkit-card-description">{feature.desc}</p>
      </div>
      <span className="lewc-toolkit-card-dot" aria-hidden="true" />
    </article>
  );
}

function ToolkitFlows() {
  const desktopPaths = [
    "M 246 86 C 310 86, 340 116, 386 127",
    "M 246 242 C 314 242, 344 208, 386 249",
    "M 246 398 C 314 398, 344 300, 386 371",
    "M 246 554 C 314 554, 344 392, 386 493",
    "M 754 127 C 690 127, 660 86, 614 127",
    "M 754 249 C 686 249, 656 242, 614 249",
    "M 754 371 C 686 371, 656 398, 614 371",
    "M 754 493 C 686 493, 656 554, 614 493",
  ];
  const mobilePaths = [
    "M 86 92 C 86 138, 128 170, 146 216",
    "M 304 92 C 304 138, 262 170, 244 216",
    "M 86 196 C 86 206, 138 208, 174 216",
    "M 304 196 C 304 206, 252 208, 216 216",
    "M 146 514 C 128 556, 86 580, 86 626",
    "M 244 514 C 262 556, 304 580, 304 626",
    "M 174 514 C 138 524, 86 606, 86 730",
    "M 216 514 C 252 524, 304 606, 304 730",
  ];
  return (
    <>
      <svg
        className="lewc-toolkit-flows is-desktop"
        viewBox="0 0 1000 620"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {desktopPaths.map((path, index) => (
          <g key={path}>
            <path className="lewc-toolkit-flow-path" d={path} />
            <circle
              className="lewc-toolkit-flow-node"
              cx={index < 4 ? 386 : 614}
              cy={127 + (index % 4) * 122}
              r="5"
            />
            <circle className="lewc-toolkit-flow-pulse" r="4">
              <animateMotion
                dur={`${2.4 + (index % 3) * 0.25}s`}
                begin={`${index * 0.17}s`}
                repeatCount="indefinite"
                path={path}
              />
            </circle>
          </g>
        ))}
      </svg>
      <svg
        className="lewc-toolkit-flows is-mobile"
        viewBox="0 0 390 740"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {mobilePaths.map((path, index) => (
          <g key={path}>
            <path className="lewc-toolkit-flow-path" d={path} />
            <circle
              className="lewc-toolkit-flow-node"
              cx={index % 2 === 0 ? 146 : 244}
              cy={index < 4 ? 216 : 514}
              r="5"
            />
            <circle className="lewc-toolkit-flow-pulse" r="4">
              <animateMotion
                dur={`${2.1 + (index % 3) * 0.2}s`}
                begin={`${index * 0.12}s`}
                repeatCount="indefinite"
                path={path}
              />
            </circle>
          </g>
        ))}
      </svg>
    </>
  );
}

function AgePanel({
  image,
  tag,
  title,
  desc,
  tone,
}: {
  image: string;
  tag: string;
  title: string;
  desc: string;
  tone: "teal" | "lime" | "dark";
}) {
  const badgeClass = tone === "teal" ? "is-teal" : tone === "lime" ? "is-lavender" : "is-blue";
  return (
    <article className="lewc-path-card">
      <div className="lewc-path-art">
        <img src={image} alt={title} loading="lazy" width={1024} height={1024} />
      </div>
      <div className={`lewc-path-badge ${badgeClass}`}>{tag}</div>
      <h3>{title}</h3>
      <p>{desc}</p>
      <Link to="/placement" className="lewc-path-link">
        <span>Explore Curriculum</span>
        <ArrowRight aria-hidden="true" />
      </Link>
    </article>
  );
}
