import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Detectar dispositivo
export const isMobile = () => typeof window !== "undefined" && window.innerWidth <= 768;

export const isTablet = () =>
  typeof window !== "undefined" && window.innerWidth > 480 && window.innerWidth <= 768;

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Configurações globais otimizadas
gsap.defaults({
  ease: "power3.out",
  force3D: true,
  overwrite: "auto",
});

// Configurar ScrollTrigger
ScrollTrigger.config({
  limitCallbacks: true,
  ignoreMobileResize: true,
});

export { gsap, ScrollTrigger };
