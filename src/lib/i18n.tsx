import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Locale = "pt" | "en";

type Dict = Record<string, { pt: string; en: string }>;

/**
 * This dictionary is NOT the app's i18n mechanism — it's a leftover from an
 * earlier landing-page draft. The actual, working convention used by every
 * route and component (auth.tsx, dashboards, checkout, etc.) is inline:
 *
 *   const { locale } = useLocale();
 *   {locale === "pt" ? "Texto em português" : "English text"}
 *
 * That pattern appears in 29+ files and covers the entire app; this dict
 * only ever covered a handful of landing-page/nav strings, and 47 of its
 * original 55 keys had zero callers (dead weight — see the dead-code audit).
 * Only the keys with real callers (nav/footer) are kept below. Don't add new
 * keys here for new copy — follow the inline ternary pattern instead, it's
 * what the rest of the app already does.
 */
export const dict = {
  "nav.pricing": { pt: "Preços", en: "Pricing" },
  "nav.dashboard": { pt: "Painel", en: "Dashboard" },
  "nav.coach": { pt: "AI Coach", en: "AI Coach" },
  "nav.games": { pt: "Jogos", en: "Games" },
  "nav.community": { pt: "Comunidade", en: "Community" },
  "nav.signin": { pt: "Entrar", en: "Sign in" },

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
