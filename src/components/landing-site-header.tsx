/**
 * LewcHeader — transparent adaptive navbar
 *  - transparente por defeito, blur ao scroll
 *  - tema claro/escuro detectado via IntersectionObserver em [data-header-theme]
 *  - sem border-bottom nem sombra linha
 *  - auto-hide ao scroll
 *  - hamburger: 2 traços → × morph
 *  - menu mobile: painel branco, stagger expo-out
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import coachLogo from "@/assets/coach-logo.png";
import "../styles/landing-site-header.css";
export function LandingSiteHeader() {
  const { locale, setLocale } = useLocale();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const hamburgerRef = useRef<HTMLButtonElement | null>(null);
  /* ── Header fixo: apenas actualiza o estado visual ao fazer scroll ── */
  useEffect(() => {
    const h = headerRef.current;
    if (!h) return;
    const update = () => h.classList.toggle("is-scrolled", window.scrollY > 30);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  /* ── Adaptive theme via IntersectionObserver ───────────────────────
     Observa todas as secções com [data-header-theme].
     A secção mais próxima do topo (intersecting com rootMargin que cobre
     exactamente a altura do header) determina o tema actual.
     Quando nenhuma está a intersetar (entre secções), mantém o último.  */
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const HEADER_H = 80; // px — deve coincidir com o CSS

    const apply = (theme: string) => {
      header.setAttribute("data-theme", theme);
    };

    // Map para saber qual tema cada elemento pede
    const themeMap = new WeakMap<Element, string>();

    const observer = new IntersectionObserver(
      (entries) => {
        // Encontrar a entrada que está a intersetar E mais próxima do topo
        let topmost: IntersectionObserverEntry | null = null;
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          if (!topmost || e.boundingClientRect.top < topmost.boundingClientRect.top) {
            topmost = e;
          }
        }
        if (topmost) {
          apply(themeMap.get(topmost.target) ?? "light");
        }
      },
      {
        // Fatia vertical que cobre exactamente a zona do header
        rootMargin: `-${HEADER_H}px 0px -${window.innerHeight - HEADER_H - 1}px 0px`,
        threshold: 0,
      },
    );

    const sections = document.querySelectorAll<HTMLElement>("[data-header-theme]");
    sections.forEach((el) => {
      themeMap.set(el, el.dataset.headerTheme ?? "light");
      observer.observe(el);
    });

    // Estado inicial — primeira secção
    if (sections.length > 0) {
      apply(sections[0].dataset.headerTheme ?? "light");
    }

    return () => observer.disconnect();
  }, []);

  /* ── Focus management ──────────────────────────────────────────── */
  useEffect(() => {
    if (menuOpen) {
      const t = window.setTimeout(() => {
        menuRef.current?.querySelector<HTMLElement>(".l-mmenu-close")?.focus();
      }, 120);
      return () => window.clearTimeout(t);
    }
    hamburgerRef.current?.focus();
  }, [menuOpen]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const close = () => {
    setMenuOpen(false);
  };
  const pt = locale === "pt";

  type HeaderRoute = "/pricing" | "/about" | "/contact";

  const navLinks: { to: HeaderRoute; labelPt: string; labelEn: string }[] = [
    { to: "/pricing", labelPt: "Preços", labelEn: "Pricing" },
    { to: "/about", labelPt: "Sobre", labelEn: "About" },
    { to: "/contact", labelPt: "Contacto", labelEn: "Contact" },
  ];

  return (
    <div className="lewc">
      {/* data-theme é gerido pelo IntersectionObserver acima */}
      <header ref={headerRef} className="l-header" data-theme="light">
        {/* Logo */}
        <Link
          to="/"
          className="l-logo"
          onClick={close}
          aria-label="LEWC — Learning English with Coach"
        >
          <span className="l-mark" aria-hidden="true">
            <img src={coachLogo} alt="" />
          </span>
          <span className="l-logo-copy">LEWC</span>
        </Link>

        {/* Desktop nav */}
        <nav className="l-nav" aria-label="Main navigation">
          {navLinks.map((l) => (
            <Link key={l.to} to={l.to}>
              {pt ? l.labelPt : l.labelEn}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div
          className="l-header-actions"
          style={{ display: "flex", alignItems: "center", gap: 10 }}
        >
          <button
            onClick={() => setLocale(pt ? "en" : "pt")}
            aria-label="Toggle language"
            className="l-lang"
          >
            {pt ? "EN" : "PT"}
          </button>
          {!user && (
            <Link to="/auth" className="lewc-hero-primary l-header-cta">
              <span className="l-hero-btn-text">{pt ? "Começar agora" : "Start now"}</span>
            </Link>
          )}
          <button
            ref={hamburgerRef}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuOpen}
            aria-controls="l-mmenu-panel"
            className={`l-hamburger${menuOpen ? " is-open" : ""}`}
          >
            <span />
            <span />
          </button>
        </div>
      </header>

      {/* ── Menu mobile ─────────────────────────────────────────── */}
      <div
        ref={menuRef}
        className={`l-mmenu${menuOpen ? " is-open" : ""}`}
        aria-hidden={!menuOpen}
        inert={!menuOpen}
      >
        <button
          className="l-mmenu-backdrop"
          onClick={close}
          tabIndex={-1}
          aria-label="Fechar menu"
        />
        <div
          id="l-mmenu-panel"
          className="l-mmenu-panel"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          <div className="l-mmenu-head">
            <span className="l-mmenu-title">LEWC</span>
            <span className="l-mmenu-tag">Menu</span>
            <button className="l-mmenu-close" onClick={close} aria-label="Fechar menu">
              ✕
            </button>
          </div>
          <nav className="l-mmenu-nav" aria-label="Mobile navigation">
            {navLinks.map((l, i) => (
              <div className="l-mmenu-li" key={l.to} style={{ "--i": i } as React.CSSProperties}>
                <Link to={l.to} onClick={close} className="l-mmenu-link">
                  <span className="l-mmenu-link-i">
                    <b>0{i + 1}</b>
                    {pt ? l.labelPt : l.labelEn}
                  </span>
                </Link>
              </div>
            ))}
          </nav>
          <div className="l-mmenu-foot">
            <button
              onClick={() => setLocale(pt ? "en" : "pt")}
              className="l-mmenu-lang"
              aria-label="Toggle language"
            >
              {pt ? "EN" : "PT"}
            </button>
            {!user && (
              <Link to="/auth" onClick={close} className="lewc-hero-primary l-mobile-cta">
                {pt ? "Começar agora" : "Start now"}
                <ArrowUpRight size={16} />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
