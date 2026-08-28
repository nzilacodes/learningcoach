import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useLocale } from "@/lib/i18n";
import { LandingSiteHeader } from "@/components/landing-site-header";
import { SiteFooter } from "@/components/site-footer";
import { SITE_URL } from "@/lib/site-url";
import "@/styles/about-page.css";
import "@/styles/about-typography.css";

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
    links: [{ rel: "canonical", href: `${SITE_URL}/about` }],
  }),
});

function AboutPage() {
  const { locale } = useLocale();
  const pt = locale === "pt";
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqItems = pt
    ? [
        {
          question: "O LEWC serve para qualquer nível?",
          answer:
            "Sim. A jornada está alinhada ao CEFR, do A1 ao C2. O teste de colocação adapta aulas, vocabulário, listening e speaking ao teu nível.",
        },
        {
          question: "A IA substitui um professor?",
          answer:
            "Não. A AI Coach dá feedback imediato, enquanto professores conduzem aulas ao vivo, sessões 1:1 e feedback humano mais profundo.",
        },
        {
          question: "Posso aprender só pelo telemóvel?",
          answer:
            "Sim. Podes praticar pronúncia, listening, reading, speaking e rever aulas gravadas em qualquer dispositivo.",
        },
        {
          question: "Como funcionam os certificados?",
          answer:
            "Ao concluir um nível e cumprir os critérios de progresso, recebes um certificado LEWC alinhado ao CEFR com QR de validação.",
        },
        {
          question: "Há aulas ao vivo e gravadas?",
          answer:
            "Há as duas opções: grupos pequenos, sessões 1:1 e uma biblioteca gravada para estudar no teu ritmo.",
        },
      ]
    : [
        {
          question: "Is LEWC suitable for every level?",
          answer:
            "Yes. The journey follows CEFR from A1 to C2. The placement test adapts lessons, vocabulary, listening and speaking to your level.",
        },
        {
          question: "Does AI replace a teacher?",
          answer:
            "No. AI Coach gives instant feedback while teachers lead live classes, 1:1 sessions and deeper human feedback.",
        },
        {
          question: "Can I learn using only my phone?",
          answer:
            "Yes. You can practise pronunciation, listening, reading and speaking and review recorded lessons on any device.",
        },
        {
          question: "How do the certificates work?",
          answer:
            "After completing a level and meeting the progress criteria, you receive a CEFR-aligned LEWC certificate with a validation QR code.",
        },
        {
          question: "Are there live and recorded lessons?",
          answer:
            "Both options are available: small groups, 1:1 sessions and a recorded library to study at your own pace.",
        },
      ];

  const principles = pt
    ? [
        ["Método CEFR", "Do A1 ao C2, com progresso mensurável e certificados oficiais."],
        ["IA que ensina", "AI Coach 24/7 para conversação, correção de pronúncia e feedback imediato."],
        ["Feito para cada idade", "Ambientes Kids, Teens e Adults com ritmo, cores e conteúdo próprios."],
        ["Acesso global", "Disponível em qualquer dispositivo, com foco mobile-first."],
      ]
    : [
        ["CEFR method", "From A1 to C2, with measurable progress and official certificates."],
        ["AI that teaches", "24/7 AI Coach for conversation, pronunciation correction and instant feedback."],
        ["Built for every age", "Kids, Teens and Adults environments with their own pace, colors and content."],
        ["Global access", "Available on any device, mobile-first by design."],
      ];

  return (
    <div className="lewc-about-shell">
      <LandingSiteHeader />
      <main className="lewc-about-page">
        <section className="lewc-about-hero">
          <h1>
            {pt ? "Ensinamos inglês como " : "We teach English as "}
            <span>{pt ? "deveria ser aprendido." : "it should be learned."}</span>
          </h1>
          <p>
            {pt
              ? "A LEWC (Learning English with Coach) nasceu para tornar o inglês acessível, moderno e verdadeiramente eficaz combinando pedagogia comprovada, inteligência artificial e uma experiência premium."
              : "LEWC (Learning English with Coach) was born to make English accessible, modern and truly effective combining proven pedagogy, artificial intelligence and a premium experience."}
          </p>
        </section>

        <section className="lewc-about-beliefs" id="mission">
          <div className="lewc-about-section-top">
            <div>
              <h2>
                {pt ? "Missão " : "Mission "}
                <span>{pt ? "e Visão" : "and Vision"}</span>
              </h2>
            </div>
            <div className="lewc-about-code">{pt ? "Missão / Visão" : "Mission / Vision"}</div>
          </div>
          <div className="lewc-about-belief-list">
            <article className="lewc-about-belief-row">
              <div className="lewc-about-belief-number">01</div>
              <div className="lewc-about-belief-label">{pt ? "Missão" : "Mission"}</div>
              <p>
                {pt
                  ? "Democratizar o acesso a um ensino de inglês de alta qualidade, personalizado por idade e nível, com resultados reais."
                  : "Democratize access to high-quality English learning, personalized by age and level, with real results."}
              </p>
            </article>
            <article className="lewc-about-belief-row">
              <div className="lewc-about-belief-number">02</div>
              <div className="lewc-about-belief-label">{pt ? "Visão" : "Vision"}</div>
              <p>
                {pt
                  ? "Ser a plataforma de referência em inglês nos países lusófonos, unindo tecnologia, cultura e educação."
                  : "Be the reference English platform in Portuguese-speaking countries, uniting technology, culture and education."}
              </p>
            </article>
          </div>
        </section>

        <section className="lewc-about-principles" id="values">
          <div className="lewc-about-principles-inner">
            <div className="lewc-about-principles-head">
              <div>
                
                <h2>
                  {pt ? "O que nos " : "What "}
                  <span>{pt ? "move" : "drives us"}</span>
                </h2>
              </div>
            </div>
            <div className="lewc-about-principles-grid">
              {principles.map(([title, description], index) => (
                <article className="lewc-about-principle-card" key={title}>
                  <div className="lewc-about-principle-index">0{index + 1}</div>
                  <div className="lewc-about-principle-icon" aria-hidden="true">
                    {index === 0 ? "◎" : index === 1 ? "✦" : index === 2 ? "♡" : "◌"}
                  </div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="lewc-about-faq" aria-labelledby="about-faq-heading">
          <div className="lewc-about-faq-head">
            <div className="lewc-about-code">FAQ</div>
            <h2 id="about-faq-heading">
              {pt ? "Tens alguma dúvida? " : "Have a question? "}
              <span>{pt ? "Estamos aqui para ajudar." : "We are here to help."}</span>
            </h2>
          </div>
          <div className="lewc-about-faq-list">
            {faqItems.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <article className={`lewc-about-faq-item${isOpen ? " is-open" : ""}`} key={item.question}>
                  <button
                    type="button"
                    className="lewc-about-faq-question lewc-about-focus"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                  >
                    <span>{item.question}</span>
                    <span aria-hidden="true">+</span>
                  </button>
                  <div className="lewc-about-faq-answer">{item.answer}</div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="lewc-about-cta">
          <div className="lewc-about-cta-panel">
            <div>
              <h2>{pt ? "Começa a tua jornada hoje." : "Start your journey today."}</h2>
            </div>
            <Link to="/auth">{pt ? "Começar grátis" : "Start for free"}&nbsp; →</Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
