import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Locale = "pt" | "en";

type Dict = Record<string, { pt: string; en: string }>;

export const dict = {
  "nav.features": { pt: "Recursos", en: "Features" },
  "nav.levels": { pt: "Níveis", en: "Levels" },
  "nav.pricing": { pt: "Preços", en: "Pricing" },
  "nav.dashboard": { pt: "Painel", en: "Dashboard" },
  "nav.coach": { pt: "AI Coach", en: "AI Coach" },
  "nav.games": { pt: "Jogos", en: "Games" },
  "nav.community": { pt: "Comunidade", en: "Community" },
  "nav.signin": { pt: "Entrar", en: "Sign in" },
  "nav.start": { pt: "Começar grátis", en: "Start free" },

  "hero.badge": { pt: "IA + método CEFR A1–C2", en: "AI-powered · CEFR A1–C2" },
  "hero.title1": { pt: "Aprenda inglês com um", en: "Learn English with a" },
  "hero.title2": { pt: "coach que se adapta a você.", en: "coach that adapts to you." },
  "hero.sub": {
    pt: "Aulas personalizadas por idade e nível, pronúncia com IPA, prática de fala com IA, jogos, leituras ilustradas e certificados oficiais.",
    en: "Lessons personalized by age and level, IPA pronunciation, AI speaking practice, games, illustrated readings and official certificates.",
  },
  "hero.cta.primary": { pt: "Começar grátis", en: "Start free" },
  "hero.cta.secondary": { pt: "Fazer teste de nível", en: "Take placement test" },
  "hero.trust": {
    pt: "Já são mais de 12.400 alunos aprendendo",
    en: "12,400+ learners already onboard",
  },

  "modes.title": { pt: "Um curso para cada idade", en: "A course for every age" },
  "modes.sub": {
    pt: "O Coach adapta cor, ritmo e conteúdo automaticamente.",
    en: "The Coach adapts colors, pace and content automatically.",
  },
  "modes.kids": { pt: "Crianças", en: "Kids" },
  "modes.kids.age": { pt: "5–11 anos", en: "5–11 years" },
  "modes.kids.desc": {
    pt: "Personagens animados, histórias, canções e jogos coloridos.",
    en: "Animated characters, stories, songs and colorful games.",
  },
  "modes.teen": { pt: "Adolescentes", en: "Teens" },
  "modes.teen.age": { pt: "12–17 anos", en: "12–17 years" },
  "modes.teen.desc": {
    pt: "Temas de escola, música, tecnologia e redes sociais.",
    en: "School topics, music, tech and social media.",
  },
  "modes.adult": { pt: "Adultos", en: "Adults" },
  "modes.adult.age": { pt: "18+ anos", en: "18+ years" },
  "modes.adult.desc": {
    pt: "Business English, IELTS, TOEFL e conversação profissional.",
    en: "Business English, IELTS, TOEFL and professional conversation.",
  },

  "features.title": {
    pt: "Tudo que você precisa para dominar o inglês",
    en: "Everything you need to master English",
  },
  "features.ai": { pt: "AI Coach", en: "AI Coach" },
  "features.ai.desc": {
    pt: "Tutor 24/7 que corrige gramática, pronúncia e escrita.",
    en: "24/7 tutor that corrects grammar, pronunciation and writing.",
  },
  "features.ipa": { pt: "Pronúncia com IPA", en: "IPA pronunciation" },
  "features.ipa.desc": {
    pt: "Compare sua voz com falantes nativos em tempo real.",
    en: "Compare your voice with native speakers in real time.",
  },
  "features.placement": { pt: "Teste diagnóstico", en: "Placement test" },
  "features.placement.desc": {
    pt: "Descubra seu nível CEFR de A1 a C2 em minutos.",
    en: "Find your CEFR level from A1 to C2 in minutes.",
  },
  "features.games": { pt: "Gamificação", en: "Gamification" },
  "features.games.desc": {
    pt: "XP, moedas, ligas e conquistas diárias.",
    en: "XP, coins, leagues and daily achievements.",
  },
  "features.cert": { pt: "Certificados", en: "Certificates" },
  "features.cert.desc": {
    pt: "Certificado com QR de verificação a cada nível concluído.",
    en: "Certificate with QR verification per level completed.",
  },
  "features.community": { pt: "Salas por idade", en: "Age-based rooms" },
  "features.community.desc": {
    pt: "Prática em comunidade com moderação por IA.",
    en: "Community practice with AI moderation.",
  },

  "levels.title": {
    pt: "Da primeira palavra à fluência total",
    en: "From first word to full fluency",
  },
  "levels.sub": {
    pt: "Progrida por seis níveis CEFR. 80% para desbloquear o próximo.",
    en: "Progress through six CEFR levels. 80% unlocks the next.",
  },

  "pricing.title": { pt: "Planos simples e diretos", en: "Simple, direct plans" },
  "pricing.sub": {
    pt: "Pagamento via Multicaixa Express. Cancele quando quiser.",
    en: "Pay via Multicaixa Express. Cancel anytime.",
  },
  "pricing.month": { pt: "Mensal", en: "Monthly" },
  "pricing.quarter": { pt: "Trimestral", en: "Quarterly" },
  "pricing.semester": { pt: "Semestral", en: "Semiannual" },
  "pricing.perMonth": { pt: "/mês", en: "/mo" },
  "pricing.save": { pt: "Economize", en: "Save" },
  "pricing.popular": { pt: "Mais escolhido", en: "Most popular" },
  "pricing.cta": { pt: "Assinar plano", en: "Choose plan" },
  "pricing.f1": { pt: "Todos os níveis A1–C2", en: "All levels A1–C2" },
  "pricing.f2": { pt: "AI Coach ilimitado", en: "Unlimited AI Coach" },
  "pricing.f3": { pt: "2 conversas semanais com professor", en: "2 weekly teacher calls" },
  "pricing.f4": { pt: "Certificados oficiais", en: "Official certificates" },

  "cta.title": { pt: "Pronto para começar sua jornada?", en: "Ready to start your journey?" },
  "cta.sub": {
    pt: "Faça o teste de nível gratuito e receba um plano personalizado em minutos.",
    en: "Take the free placement test and get a personalized plan in minutes.",
  },
  "cta.button": { pt: "Fazer teste agora", en: "Start test now" },

  "footer.tag": {
    pt: "Aprenda inglês com um coach que entende você.",
    en: "Learn English with a coach who gets you.",
  },
  "footer.rights": { pt: "Todos os direitos reservados.", en: "All rights reserved." },
} satisfies Dict;

export type DictKey = keyof typeof dict;

const LocaleContext = createContext<{
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (k: DictKey) => string;
}>({ locale: "pt", setLocale: () => {}, t: (k) => k });

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("pt");

  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("locale") : null;
    if (saved === "pt" || saved === "en") setLocaleState(saved);
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    if (typeof window !== "undefined") window.localStorage.setItem("locale", l);
  };

  const t = (k: DictKey) => dict[k][locale];

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>{children}</LocaleContext.Provider>
  );
}

export const useLocale = () => useContext(LocaleContext);
