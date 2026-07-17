import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type AgeTheme = "kids" | "teens" | "adults";

const AgeThemeContext = createContext<{
  theme: AgeTheme;
  setTheme: (t: AgeTheme) => void;
}>({ theme: "adults", setTheme: () => {} });

const CLASSES: Record<AgeTheme, string> = {
  kids: "theme-kids",
  teens: "theme-teens",
  adults: "theme-adults",
};

export function AgeThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<AgeTheme>("adults");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("age-theme");
    if (saved === "kids" || saved === "teens" || saved === "adults") {
      setThemeState(saved);
    }
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    Object.values(CLASSES).forEach((c) => root.classList.remove(c));
    root.classList.add(CLASSES[theme]);
  }, [theme]);

  const setTheme = (t: AgeTheme) => {
    setThemeState(t);
    if (typeof window !== "undefined") window.localStorage.setItem("age-theme", t);
  };

  return (
    <AgeThemeContext.Provider value={{ theme, setTheme }}>{children}</AgeThemeContext.Provider>
  );
}

export const useAgeTheme = () => useContext(AgeThemeContext);
