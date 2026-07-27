import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Split Text Engine — converte texto em caracteres <span>
 */
function splitText(targets: NodeListOf<HTMLElement> | HTMLElement[]) {
  targets.forEach((target) => {
    const text = target.textContent ?? "";
    target.textContent = "";
    const chars = text.split("");
    chars.forEach((char) => {
      const span = document.createElement("span");
      if (char === " ") {
        span.className = "whitespace";
        span.innerHTML = "&nbsp;";
      } else {
        span.className = "char";
        span.textContent = char;
      }
      target.appendChild(span);
    });
  });
}

/**
 * Spotlight hover effect on bento cards
 */
function attachSpotlight(card: HTMLElement) {
  const handleMove = (e: MouseEvent) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty("--mouse-x", `${x}px`);
    card.style.setProperty("--mouse-y", `${y}px`);
  };
  card.addEventListener("mousemove", handleMove);
  return () => card.removeEventListener("mousemove", handleMove);
}

export function useLandingAnimations() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduceMotion) return;

      const cleanups: Array<() => void> = [];
      const mm = gsap.matchMedia();

      // ---------- HERO ----------
      // Hero — no animation, stays visible always

      mm.add("(pointer: fine)", () => {
        const heroEl = document.querySelector<HTMLElement>("[data-anim='hero-section']");
        const floats = gsap.utils.toArray<HTMLElement>("[data-anim='hero-float']");
        if (!heroEl || !floats.length) return;

        const movers = floats.map((el, i) => ({
          x: gsap.quickTo(el, "x", { duration: 0.6, ease: "power3.out" }),
          y: gsap.quickTo(el, "y", { duration: 0.6, ease: "power3.out" }),
          strength: i % 2 === 0 ? 14 : -10,
        }));

        const handleMove = (e: MouseEvent) => {
          const rect = heroEl.getBoundingClientRect();
          const relX = (e.clientX - rect.left) / rect.width - 0.5;
          const relY = (e.clientY - rect.top) / rect.height - 0.5;
          movers.forEach((m) => {
            m.x(relX * m.strength);
            m.y(relY * m.strength);
          });
        };

        heroEl.addEventListener("mousemove", handleMove);
        return () => heroEl.removeEventListener("mousemove", handleMove);
      });

      // ---------- STATS — Everything together on scroll ----------
      const heroForStats = document.querySelector<HTMLElement>("[data-anim='hero-section']");
      const statsOverlay = document.querySelector<HTMLElement>("[data-anim='stats-overlay']");
      const statCards = gsap.utils.toArray<HTMLElement>("[data-anim='stat-card']");

      if (heroForStats && statsOverlay && statCards.length) {
        mm.add("(min-width: 768px)", () => {
          const heroText = heroForStats.querySelectorAll<HTMLElement>(
            "[data-anim='hero-badge'], [data-anim='hero-line'], [data-anim='hero-copy'], [data-anim='hero-social']",
          );
          const heroImage = heroForStats.querySelectorAll<HTMLElement>(
            "[data-anim='hero-image'], [data-anim='hero-float']",
          );

          // Set initial state for cards
          gsap.set(statCards, { opacity: 0, y: 50, scale: 0.9 });

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: heroForStats,
              start: "top top",
              end: "+=1800",
              pin: true,
              scrub: 0.8,
            },
          });

          // Hero content dims + blur
          tl.to(heroText, { opacity: 0.15, filter: "blur(4px)", duration: 1, ease: "none" }, 0);
          tl.to(
            heroImage,
            { scale: 0.85, opacity: 0.25, filter: "blur(6px)", duration: 1, ease: "none" },
            0,
          );

          // Overlay appears
          tl.to(statsOverlay, { opacity: 1, duration: 1, ease: "none" }, 0);

          // Cards one by one with scale
          statCards.forEach((card, i) => {
            tl.to(
              card,
              {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.12,
                ease: "back.out(1.2)",
                onStart: () => {
                  // Counter animation
                  const counter = card.querySelector<HTMLElement>("[data-anim='stat-counter']");
                  if (counter) {
                    const target = parseFloat(counter.dataset.target ?? "0");
                    const suffix = counter.dataset.suffix ?? "";
                    const decimals = Number(counter.dataset.decimals ?? 0);
                    if (target > 0) {
                      const obj = { val: 0 };
                      gsap.to(obj, {
                        val: target,
                        duration: 0.5,
                        ease: "power2.out",
                        onUpdate: () => {
                          counter.textContent = decimals
                            ? obj.val.toFixed(decimals) + suffix
                            : Math.round(obj.val).toLocaleString("en-US") + suffix;
                        },
                      });
                    }
                  }
                },
              },
              0.1 + i * 0.1,
            );
          });

          return () => {
            tl.kill();
            gsap.set(statsOverlay, { clearProps: "all" });
            statCards.forEach((c) => gsap.set(c, { clearProps: "all" }));
            gsap.set(heroText, { clearProps: "all" });
            gsap.set(heroImage, { clearProps: "all" });
          };
        });

        mm.add("(max-width: 767px)", () => {
          // Mobile: no animation, stats are a normal section below hero
        });
      }

      // ---------- Título de secção genérico (reveal simples) ----------
      gsap.utils.toArray<HTMLElement>("[data-anim='section-heading']").forEach((el) => {
        gsap.set(el, { y: 24, opacity: 0 });
        ScrollTrigger.create({
          trigger: el,
          start: "top 90%",
          once: true,
          onEnter: () => gsap.to(el, { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" }),
        });
      });

      // ================================================================
      // CHOOSE YOUR PATH + TOOLKIT — Pinned Timeline (original)
      // ================================================================
      const pinContainer = document.querySelector<HTMLElement>("[data-anim='pin-container']");
      const ageCards = gsap.utils.toArray<HTMLElement>("[data-anim='age-panel']");
      const bentoCards = gsap.utils.toArray<HTMLElement>("[data-anim='feature-card']");
      const toolSection = document.querySelector<HTMLElement>("[data-anim='toolkit-section']");

      if (pinContainer && ageCards.length && toolSection && bentoCards.length) {
        const splitTargets = document.querySelectorAll<HTMLElement>(".split-text");
        if (splitTargets.length) {
          splitText(splitTargets);
        }

        mm.add("(min-width: 768px)", () => {
          gsap.set(".card-content", { opacity: 0, y: 60 });
          gsap.set("[data-anim='bento-header']", { opacity: 0, y: 30 });
          gsap.set(bentoCards, { opacity: 0, y: 40, scale: 0.98 });

          bentoCards.forEach((card) => {
            const icon = card.querySelector<HTMLElement>("[data-anim='feature-icon']");
            if (icon) gsap.set(icon, { opacity: 0, y: 15 });
          });

          gsap.set(".split-text .char", {
            opacity: 0,
            y: 12,
            rotateX: -25,
            transformOrigin: "50% 100%",
          });

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: pinContainer,
              start: "top top",
              end: "+=5000",
              scrub: 0.5,
              pin: true,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          });

          tl.to(".card-content", {
            opacity: 1,
            y: 0,
            duration: 1,
            stagger: { each: 0.25, ease: "power2.inOut" },
            ease: "power2.out",
          });

          tl.to(toolSection, {
            yPercent: -100,
            duration: 1.5,
            ease: "power3.inOut",
          });

          tl.to(
            "[data-anim='bento-header']",
            {
              opacity: 1,
              y: 0,
              duration: 0.6,
              ease: "power2.out",
            },
            "-=0.4",
          );

          bentoCards.forEach((card, index) => {
            const icon = card.querySelector<HTMLElement>(".icon-wrapper");
            const chars = card.querySelectorAll<HTMLElement>(".char");

            tl.to(
              card,
              {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.5,
                ease: "power2.out",
              },
              index === 0 ? "-=0.1" : "-=0.45",
            );

            if (icon) {
              tl.to(
                icon,
                {
                  opacity: 1,
                  y: 0,
                  duration: 0.25,
                  ease: "power2.out",
                },
                "-=0.45",
              );
            }

            if (chars.length) {
              tl.to(
                chars,
                {
                  opacity: 1,
                  y: 0,
                  rotateX: 0,
                  duration: 0.2,
                  stagger: 0.006,
                  ease: "power1.out",
                },
                "-=0.35",
              );
            }
          });

          const spotlightCleanups = bentoCards.map((card) => attachSpotlight(card));
          cleanups.push(() => spotlightCleanups.forEach((fn) => fn()));

          return () => {
            ScrollTrigger.getAll().forEach((st) => {
              if (st.vars.trigger === pinContainer) st.kill();
            });
          };
        });

        mm.add("(max-width: 767px)", () => {
          gsap.set(".card-content", { opacity: 1, y: 0 });
          gsap.set("[data-anim='bento-header']", { opacity: 1, y: 0 });
          gsap.set(bentoCards, { opacity: 1, y: 0, scale: 1 });

          bentoCards.forEach((card) => {
            const icon = card.querySelector<HTMLElement>("[data-anim='feature-icon']");
            if (icon) gsap.set(icon, { opacity: 1, y: 0 });
          });

          gsap.set(".split-text .char", {
            opacity: 1,
            y: 0,
            rotateX: 0,
          });
        });
      }

      // ---------- CEFR BARS ----------
      gsap.from("[data-anim='cefr-bar']", {
        scaleY: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "elastic.out(1, 0.65)",
        scrollTrigger: { trigger: "[data-anim='cefr-section']", start: "top 80%", once: true },
      });
      gsap.from("[data-anim='cefr-label']", {
        y: 10,
        opacity: 0,
        duration: 0.4,
        stagger: 0.1,
        delay: 0.3,
        scrollTrigger: { trigger: "[data-anim='cefr-section']", start: "top 80%", once: true },
      });

      // ---------- RESULTS / TESTIMONIAL ----------
      const resultsTl = gsap.timeline({
        scrollTrigger: { trigger: "[data-anim='results-section']", start: "top 78%", once: true },
      });
      resultsTl
        .from("[data-anim='testimonial-copy']", { x: -30, opacity: 0, duration: 0.7 })
        .from(
          "[data-anim='result-stat']",
          { y: 16, opacity: 0, duration: 0.5, stagger: 0.1 },
          "-=0.4",
        )
        .from("[data-anim='testimonial-card']", { x: 30, opacity: 0, duration: 0.7 }, "-=0.6")
        .from(
          "[data-anim='testimonial-quote-mark']",
          { scale: 0, duration: 0.4, ease: "back.out(3)" },
          "-=0.3",
        );

      // ---------- FINAL CTA ----------
      gsap.from("[data-anim='final-cta']", {
        scale: 0.95,
        opacity: 0,
        duration: 0.7,
        ease: "power2.out",
        scrollTrigger: { trigger: "[data-anim='final-cta']", start: "top 88%", once: true },
      });

      // Círculos decorativos: flutuação contínua
      gsap.to("[data-anim='decor-circle']", {
        y: 18,
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 0.6,
      });

      // Refresh ScrollTrigger positions after layout settles
      const refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 400);
      cleanups.push(() => window.clearTimeout(refreshTimer));

      return () => cleanups.forEach((fn) => fn());
    },
    { scope: root },
  );

  return root;
}
