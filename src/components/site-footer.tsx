import { useLocale } from "@/lib/i18n";
import coachLogo from "@/assets/coach-logo.png";

export function SiteFooter() {
  const { t } = useLocale();
  return (
    <footer className="mt-24 border-t border-border/60">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <img
              src={coachLogo}
              alt="LEWC"
              className="h-10 w-10 rounded-xl object-contain shadow-soft"
            />
            <div>
              <div className="font-display font-bold">Learning English with Coach</div>
              <div className="text-sm text-muted-foreground">{t("footer.tag")}</div>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Narcidi Spaces · {t("footer.rights")}
          </div>
        </div>
      </div>
    </footer>
  );
}
