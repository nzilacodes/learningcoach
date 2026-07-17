import { Link, useNavigate } from "@tanstack/react-router";
import { Languages, LogOut, User as UserIcon } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { AgeThemeSwitcher } from "@/components/age-theme-switcher";
import { useAuth } from "@/lib/auth";
import coachLogo from "@/assets/coach-logo.png";

export function SiteHeader() {
  const { locale, setLocale, t } = useLocale();
  const { isAdmin } = useAuth();

  const linkCls =
    "rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground whitespace-nowrap";

  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="mx-auto max-w-7xl px-4 pt-4">
        <div className="glass rounded-2xl px-4 py-2.5 shadow-card">
          <div className="flex items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-2.5">
              <img
                src={coachLogo}
                alt="Learning English with Coach logo"
                className="h-11 w-11 rounded-full object-contain shadow-soft ring-1 ring-amber/40"
              />
              <div className="leading-tight">
                <div className="font-display text-sm font-bold">Learning English</div>
                <div className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                  with Coach
                </div>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              <AgeThemeSwitcher />
              <button
                onClick={() => setLocale(locale === "pt" ? "en" : "pt")}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-background/50 px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wider hover:bg-accent"
                aria-label="Toggle language"
              >
                <Languages className="h-3.5 w-3.5" />
                {locale}
              </button>
              <AuthActions />
            </div>
          </div>

          <nav className="mt-2 hidden flex-col gap-1 border-t border-border/50 pt-2 lg:flex">
            <div className="flex flex-wrap items-center justify-center gap-1">
              <Link to="/dashboard" className={linkCls}>{t("nav.dashboard")}</Link>
              <Link to="/curriculum" className={linkCls}>{locale === "pt" ? "Currículo" : "Curriculum"}</Link>
              <Link to="/track" className={linkCls}>{locale === "pt" ? "Percurso" : "Track"}</Link>
              <Link to="/videos" className={linkCls}>{locale === "pt" ? "Vídeos" : "Videos"}</Link>
              <Link to="/pronunciation" className={linkCls}>{locale === "pt" ? "Pronúncia" : "Pronunciation"}</Link>
              <Link to="/reading" className={linkCls}>Reading</Link>
              <Link to="/rewards" className={linkCls}>{locale === "pt" ? "Recompensas" : "Rewards"}</Link>
              <Link to="/certificates" className={linkCls}>{locale === "pt" ? "Certificados" : "Certificates"}</Link>
              <Link to="/subscription" className={linkCls}>{locale === "pt" ? "Assinatura" : "Subscription"}</Link>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-1">
              <Link to="/ai-coach" className={linkCls}>{t("nav.coach")}</Link>
              <Link to="/games" className={linkCls}>{t("nav.games")}</Link>
              <Link to="/community" className={linkCls}>{t("nav.community")}</Link>
              <Link to="/pricing" className={linkCls}>{t("nav.pricing")}</Link>
              <Link to="/about" className={linkCls}>{locale === "pt" ? "Sobre" : "About"}</Link>
              <Link to="/contact" className={linkCls}>{locale === "pt" ? "Contacto" : "Contact"}</Link>
              {isAdmin && (
                <>
                  <Link to="/admin" className={linkCls}>Admin</Link>
                  <Link to="/analytics" className={linkCls}>Analytics</Link>
                  <Link to="/audit" className={linkCls}>Auditoria</Link>
                </>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}


function AuthActions() {
  const { user, signOut, isAdmin } = useAuth();
  const { locale, t } = useLocale();
  const navigate = useNavigate();

  if (!user) {
    return (
      <>
        <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
          <Link to="/auth">{t("nav.signin")}</Link>
        </Button>
        <Button asChild size="sm" className="bg-gradient-sunset text-white shadow-soft hover:opacity-90">
          <Link to="/auth">{locale === "pt" ? "Começar" : "Get started"}</Link>
        </Button>
      </>
    );
  }
  return (
    <>
      <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
        <Link to="/dashboard"><UserIcon className="mr-1 h-4 w-4" />{isAdmin ? "Admin" : (locale === "pt" ? "Painel" : "Dashboard")}</Link>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={async () => {
          await signOut();
          navigate({ to: "/" });
        }}
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </>
  );
}
