import { useState, useEffect, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { Languages, User as UserIcon, X, ArrowRight, ChevronDown } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import coachLogo from "@/assets/coach-logo.png";

export function SiteHeader() {
  const { locale, setLocale, t } = useLocale();
  const { user, isAdmin } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 20);

      const docH = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docH > 0 ? Math.min((y / docH) * 100, 100) : 0);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Sheet (Radix Dialog) manages body scroll lock itself while menuOpen —
  // no manual document.body.style.overflow needed anymore.

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const navLinks = [
    { to: "/placement", label: locale === "pt" ? "Começar" : "Start", cta: true },
    { to: "/pricing", label: t("nav.pricing") },
    { to: "/ai-coach", label: t("nav.coach") },
    { to: "/games", label: t("nav.games") },
  ];

  const moreLinks = [
    { to: "/dashboard", label: t("nav.dashboard") },
    { to: "/curriculum", label: locale === "pt" ? "Currículo" : "Curriculum" },
    { to: "/videos", label: locale === "pt" ? "Vídeos" : "Videos" },
    { to: "/pronunciation", label: locale === "pt" ? "Pronúncia" : "Pronunciation" },
    { to: "/reading", label: "Reading" },
    { to: "/rewards", label: locale === "pt" ? "Recompensas" : "Rewards" },
    { to: "/community", label: t("nav.community") },
    { to: "/about", label: locale === "pt" ? "Sobre" : "About" },
    { to: "/contact", label: locale === "pt" ? "Contacto" : "Contact" },
  ];

  return (
    <>
      {/* Scroll Progress Bar */}
      <div className="fixed left-0 top-0 z-scroll-progress h-[3px] w-full">
        <div
          className="h-full bg-gradient-to-r from-marketing-teal via-marketing-lime to-marketing-teal transition-[width] duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Navbar */}
      <header
        className={`fixed left-0 right-0 top-0 z-50 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          scrolled ? "pt-3" : "pt-5"
        }`}
      >
        <div
          className={`mx-auto px-4 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            scrolled ? "max-w-7xl" : "max-w-full"
          }`}
        >
          <nav
            className={`flex items-center justify-between gap-4 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              scrolled
                ? "rounded-2xl border border-slate-200/60 bg-white/80 px-4 sm:px-6 py-3 shadow-xl shadow-slate-900/5 backdrop-blur-xl"
                : "rounded-none border-transparent bg-transparent px-4 sm:px-6 py-4"
            }`}
          >
            {/* Logo */}
            <Link
              to="/"
              className="group flex items-center gap-2.5 transition-transform duration-300 hover:scale-[1.02]"
            >
              <div className="relative">
                <img
                  src={coachLogo}
                  alt="LEWC"
                  className="h-10 w-10 rounded-xl object-contain shadow-lg ring-1 ring-slate-200 transition-all duration-300 group-hover:ring-marketing-teal/50 group-hover:shadow-marketing-teal/20"
                />
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-marketing-lime" />
              </div>
              <div className="hidden leading-tight sm:block">
                <div className="text-sm font-bold text-slate-800">Learning English</div>
                <div className="text-2xs font-medium tracking-wider text-muted-foreground uppercase">
                  with Coach
                </div>
              </div>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden items-center gap-1 lg:flex">
              {navLinks.map((link) =>
                link.cta ? (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="group relative rounded-xl bg-gradient-to-r from-marketing-teal to-marketing-teal-dark px-5 py-2 text-sm font-bold text-white shadow-lg shadow-marketing-teal/25 transition-all duration-300 hover:shadow-marketing-teal/40 hover:scale-[1.03]"
                  >
                    <span className="relative z-10 flex items-center gap-1.5">
                      {link.label}
                      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                ) : (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="group relative rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors duration-300 hover:text-slate-900"
                  >
                    {link.label}
                    <span className="absolute bottom-0.5 left-1/2 h-0.5 w-0 rounded-full bg-marketing-teal transition-all duration-300 group-hover:left-4 group-hover:w-[calc(100%-2rem)]" />
                  </Link>
                ),
              )}

              {/* More dropdown — hover-controlled to match the rest of the desktop nav,
                  but backed by Radix for real focus/keyboard/Escape handling. */}
              <div onMouseEnter={() => setMoreOpen(true)} onMouseLeave={() => setMoreOpen(false)}>
                <DropdownMenu open={moreOpen} onOpenChange={setMoreOpen}>
                  <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground outline-none transition-colors duration-300 hover:text-foreground focus-visible:text-foreground">
                    {locale === "pt" ? "Mais" : "More"}
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform duration-300 ${moreOpen ? "rotate-180" : ""}`}
                    />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    sideOffset={8}
                    className="w-56 rounded-2xl border-slate-200 p-2 shadow-2xl shadow-slate-900/10"
                  >
                    {moreLinks.map((link) => (
                      <DropdownMenuItem
                        key={link.to}
                        asChild
                        className="rounded-xl px-4 py-2.5 text-sm text-muted-foreground focus:bg-slate-50 focus:text-slate-900"
                      >
                        <Link to={link.to}>{link.label}</Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* Language Toggle — icon only */}
              <button
                onClick={() => setLocale(locale === "pt" ? "en" : "pt")}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-muted-foreground transition-all duration-300 hover:border-marketing-teal/30 hover:bg-marketing-teal/5 hover:text-marketing-teal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                aria-label="Toggle language"
              >
                <Languages className="h-4 w-4" />
              </button>

              {/* Auth Buttons - Desktop */}
              {user && (
                <div className="hidden items-center gap-2 lg:flex">
                  <Link
                    to={isAdmin ? "/admin" : "/dashboard"}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-muted-foreground transition-all duration-300 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                  >
                    <UserIcon className="h-4 w-4" />
                    {isAdmin ? "Admin" : locale === "pt" ? "Painel" : "Dashboard"}
                  </Link>
                </div>
              )}

              {/* CTA Button */}
              <Link
                to={user ? "/dashboard" : "/auth"}
                className="group hidden items-center gap-2.5 rounded-full bg-marketing-ink px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white transition-all duration-300 hover:shadow-lg lg:inline-flex"
              >
                {user
                  ? locale === "pt"
                    ? "Painel"
                    : "Dashboard"
                  : locale === "pt"
                    ? "Entrar"
                    : "Sign in"}
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-marketing-ink">
                  <ArrowRight className="h-4 w-4 -rotate-45 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </Link>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-muted-foreground transition-all duration-300 hover:border-marketing-teal/30 hover:bg-marketing-teal/5 hover:text-marketing-teal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring lg:hidden"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
              >
                <div className="relative h-5 w-5">
                  <span
                    className={`absolute left-0 top-0 h-0.5 w-5 rounded-full bg-current transition-all duration-300 ${
                      menuOpen ? "top-2 rotate-45" : "top-0 rotate-0"
                    }`}
                  />
                  <span
                    className={`absolute left-0 top-2 h-0.5 w-5 rounded-full bg-current transition-all duration-300 ${
                      menuOpen ? "opacity-0" : "opacity-100"
                    }`}
                  />
                  <span
                    className={`absolute left-0 top-0 h-0.5 w-5 rounded-full bg-current transition-all duration-300 ${
                      menuOpen ? "top-2 -rotate-45" : "top-4 rotate-0"
                    }`}
                  />
                </div>
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile Menu Panel */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent
          side="right"
          className="w-[85%] max-w-sm border-none bg-white p-0 shadow-2xl shadow-slate-900/20 [&>button]:hidden lg:hidden"
        >
          <SheetTitle className="sr-only">{locale === "pt" ? "Menu" : "Menu"}</SheetTitle>
          <div className="flex h-full flex-col overflow-y-auto px-6 pt-6 pb-10">
            {/* Mobile menu header */}
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src={coachLogo} alt="LEWC" className="h-9 w-9 rounded-xl object-contain" />
                <div>
                  <div className="text-sm font-bold text-slate-800">Learning English</div>
                  <div className="text-2xs text-muted-foreground uppercase tracking-wider">
                    with Coach
                  </div>
                </div>
              </div>
              <button
                onClick={closeMenu}
                aria-label="Close menu"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-muted-foreground transition-colors hover:bg-slate-200 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mobile nav links */}
            <div className="space-y-1">
              {navLinks.map((link, i) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={closeMenu}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 text-base font-medium transition-all duration-300 ${
                    link.cta
                      ? "bg-gradient-to-r from-marketing-teal to-marketing-teal-dark text-white shadow-lg shadow-marketing-teal/20"
                      : "text-muted-foreground hover:bg-slate-50 hover:text-slate-900"
                  }`}
                  style={{ transitionDelay: `${i * 50}ms` }}
                >
                  {link.label}
                  <ArrowRight className="h-4 w-4 opacity-50" />
                </Link>
              ))}
            </div>

            {/* Divider */}
            <div className="my-6 h-px bg-slate-100" />

            {/* More links */}
            <div className="space-y-1">
              <div className="px-4 pb-2 text-2xs font-bold uppercase tracking-widest text-slate-300">
                {locale === "pt" ? "Mais" : "More"}
              </div>
              {moreLinks.map((link, i) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={closeMenu}
                  className="block rounded-xl px-4 py-2.5 text-sm text-muted-foreground transition-all duration-200 hover:bg-slate-50 hover:text-slate-700"
                  style={{ transitionDelay: `${(i + navLinks.length) * 40}ms` }}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Mobile auth */}
            <div className="mt-auto pt-8">
              {user ? (
                <div className="space-y-2">
                  <Link
                    to={isAdmin ? "/admin" : "/dashboard"}
                    onClick={closeMenu}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-muted-foreground transition-all hover:bg-slate-50 hover:text-slate-900"
                  >
                    <UserIcon className="h-4 w-4" />
                    {isAdmin ? "Admin" : locale === "pt" ? "Painel" : "Dashboard"}
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link
                    to="/auth"
                    onClick={closeMenu}
                    className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-marketing-teal to-marketing-teal-dark px-4 py-3 text-sm font-bold text-white shadow-lg shadow-marketing-teal/25 transition-all hover:shadow-marketing-teal/40"
                  >
                    {locale === "pt" ? "Começar grátis" : "Start for free"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                  <Link
                    to="/auth"
                    onClick={closeMenu}
                    className="flex w-full items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-muted-foreground transition-all hover:bg-slate-50 hover:text-slate-700"
                  >
                    {t("nav.signin")}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
