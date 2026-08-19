import { Baby, GraduationCap, User } from "lucide-react";
import { useAgeTheme, type AgeTheme } from "@/lib/age-theme";
import { useLocale } from "@/lib/i18n";

const OPTIONS: { key: AgeTheme; icon: typeof Baby; pt: string; en: string }[] = [
  { key: "kids", icon: Baby, pt: "Crianças", en: "Kids" },
  { key: "teens", icon: GraduationCap, pt: "Teens", en: "Teens" },
  { key: "adults", icon: User, pt: "Adultos", en: "Adults" },
];

export function AgeThemeSwitcher() {
  const { theme, setTheme } = useAgeTheme();
  const { locale } = useLocale();
  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-background/50 p-0.5">
      {OPTIONS.map((o) => {
        const active = theme === o.key;
        return (
          <button
            key={o.key}
            onClick={() => setTheme(o.key)}
            aria-label={locale === "pt" ? o.pt : o.en}
            title={locale === "pt" ? o.pt : o.en}
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-2xs font-semibold transition-all ${
              active
                ? "bg-gradient-sunset text-white shadow-soft"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <o.icon className="h-3.5 w-3.5" />
            <span className="hidden md:inline">{locale === "pt" ? o.pt : o.en}</span>
          </button>
        );
      })}
    </div>
  );
}
