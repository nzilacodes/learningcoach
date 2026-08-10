import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { isMobile, prefersReducedMotion } from "@/lib/gsap";

gsap.registerPlugin(ScrollTrigger);

/**
 * Hook principal para animações GSAP com limpeza automática
 */
export function useGsapAnimations(
  animationFn: (gsap: typeof import("gsap").default) => void,
  deps: unknown[] = []
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ctxRef = useRef<gsap.Context | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (prefersReducedMotion()) {
      gsap.set("[data-animate]", { opacity: 1, y: 0 });
      return;
    }

    ctxRef.current = gsap.context(() => {
      animationFn(gsap);
    }, containerRef);

    return () => {
      ctxRef.current?.revert();
      ctxRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return containerRef;
}

/**
 * Hook para animações que só funcionam em desktop
 */
export function useDesktopOnly(
  animationFn: () => void,
  deps: unknown[] = []
) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (isMobile()) return;
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(animationFn, containerRef);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return containerRef;
}

/**
 * Configuração de duração baseada no dispositivo
 */
export function getAnimConfig() {
  if (prefersReducedMotion()) {
    return { duration: 0, stagger: 0, scrub: false as const };
  }
  if (isMobile()) {
    return { duration: 0.5, stagger: 0.03, scrub: false as const };
  }
  return { duration: 1, stagger: 0.08, scrub: 1.5 };
}
