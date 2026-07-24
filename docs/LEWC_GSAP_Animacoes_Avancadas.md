# Análise Avançada de Animações GSAP + ScrollTrigger — Homepage LEWC

## Stack de Animações

| Biblioteca | Plugin | Função | Licença |
|------------|--------|--------|---------|
| **GSAP 3.15** | Core | Motor de animação | Free (club para ScrollSmoother) |
| **ScrollTrigger** | Plugin | Animações baseadas em scroll | Free |
| **SplitText** | Plugin | Dividir texto em chars/words/lines | Club (ou CDN trial) |
| **ScrambleText** | Plugin | Efeito de "scramble" no texto | Club |

---

## Secção 1: HERO — Entrada Impactante

### Animação Actual
```tsx
<div className="animate-fade-in">  // CSS simples, sem scroll
```

### Animação Nível Awwwards com GSAP

#### 1.1 — Text Reveal com SplitText + Mask

```tsx
// O título revela-se palavra por palavra com máscara
// Cada palavra sobe de baixo para dentro de uma "janela" de visibilidade

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SplitText from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, SplitText);

function HeroSection() {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Timeline principal do Hero
      const tl = gsap.timeline({ delay: 0.3 });

      // 1. Badge aparece com scale + bounce
      tl.from(badgeRef.current, {
        scale: 0.5,
        opacity: 0,
        duration: 0.6,
        ease: "back.out(1.7)",  // Bounce effect
      });

      // 2. Título com SplitText — palavra por palavra com máscara
      const titleSplit = SplitText.create(titleRef.current, {
        type: "words, lines",
        mask: "words",  // Máscara para efeito de revelação
      });

      tl.from(titleSplit.words, {
        yPercent: 120,      // Cada palavra sobe 120%
        rotationX: -80,     // Inclinação 3D
        opacity: 0,
        duration: 0.8,
        ease: "power4.out",
        stagger: {
          each: 0.06,       // 60ms entre cada palavra
          from: "start",    // Da esquerda para a direita
        },
      }, "-=0.3");  // Sobrepor com o badge

      // 3. Subtítulo com fade + y
      tl.from(subtitleRef.current, {
        y: 30,
        opacity: 0,
        duration: 0.6,
        ease: "power3.out",
      }, "-=0.4");

      // 4. Botões CTA com stagger
      tl.from(ctaRef.current.children, {
        y: 20,
        opacity: 0,
        duration: 0.5,
        ease: "power3.out",
        stagger: 0.1,
      }, "-=0.3");

      // 5. Imagem com curtain reveal (clip-path)
      tl.fromTo(imageRef.current, 
        { 
          clipPath: "inset(0 100% 0 0)",  // Escondida à direita
        },
        {
          clipPath: "inset(0 0% 0 0)",    // Totalmente visível
          duration: 1.2,
          ease: "power4.inOut",
        },
        "-=0.8"  // Começar enquanto os botões aparecem
      );

      // 6. Floating cards aparecem com stagger e bounce
      tl.from(".floating-card", {
        scale: 0,
        opacity: 0,
        duration: 0.6,
        ease: "back.out(1.7)",
        stagger: 0.15,
      }, "-=0.4");

      // 7. Parallax no fundo durante scroll
      gsap.to(".hero-gradient", {
        yPercent: 30,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero-section",
          start: "top top",
          end: "bottom top",
          scrub: 1.5,  // Suavizado com 1.5s de atraso
        },
      });

      // 8. Imagem do hero faz parallax mais lento
      gsap.to(imageRef.current, {
        yPercent: -15,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero-section",
          start: "top top",
          end: "bottom top",
          scrub: 2,  // Mais lento que o fundo = profundidade
        },
      });

    });

    return () => ctx.revert();
  }, []);

  return (
    <section className="hero-section relative overflow-hidden">
      <div className="hero-gradient absolute inset-0 ..." />
      <h1 ref={titleRef}>Learn English Faster. Speak With Confidence.</h1>
      <p ref={subtitleRef}>...</p>
      <div ref={ctaRef}>...</div>
      <div ref={imageRef}>
        <img src={heroStudents} />
        <div className="floating-card">...</div>
      </div>
    </section>
  );
}
```

#### Efeito Visual:
```
Frame 0:    [vazio]
Frame 300ms: Badge aparece com bounce
Frame 500ms: "Learn" sobe de baixo com máscara
Frame 560ms: "English" sobe
Frame 620ms: "Faster." sobe
Frame 700ms: Subtítulo fade in
Frame 900ms: Botões aparecem
Frame 1000ms: Imagem revela-se da esquerda para a direita
Frame 1200ms: Floating cards saltam para posição
```

---

## Secção 2: STATS — Contadores Animados

### Animação Actual
```tsx
<div>{s.value}</div>  // Número estático, sem animação
```

### Animação Nível Awwwards

```tsx
function StatsSection() {
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Contadores animam quando a secção entra no viewport
      const counters = gsap.utils.toArray(".stat-number");
      
      counters.forEach((counter) => {
        const target = parseInt(counter.getAttribute("data-target") || "0");
        
        gsap.fromTo(counter, 
          { innerText: 0 },
          {
            innerText: target,
            duration: 2.5,
            ease: "power2.out",
            snap: { innerText: 1 },  // Números inteiros
            scrollTrigger: {
              trigger: counter,
              start: "top 85%",  // Começa quando 85% do viewport
              toggleActions: "play none none none",
            },
          }
        );
      });

      // Labels aparecem com stagger
      gsap.from(".stat-label", {
        y: 20,
        opacity: 0,
        duration: 0.6,
        ease: "power3.out",
        stagger: 0.1,
        scrollTrigger: {
          trigger: statsRef.current,
          start: "top 80%",
        },
      });

      // Linha divisória anima-se (width de 0 a 100%)
      gsap.from(".stats-divider", {
        scaleX: 0,
        duration: 1.5,
        ease: "power4.inOut",
        scrollTrigger: {
          trigger: statsRef.current,
          start: "top 90%",
        },
      });

    }, statsRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={statsRef}>
      <div className="stats-divider" />
      <div className="grid">
        {stats.map((s) => (
          <div key={s.label}>
            <div className="stat-number" data-target={parseInt(s.value)}>
              0
            </div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### Efeito Visual:
```
[Scroll até stats]
→ Linha divisória cresce da esquerda
→ Números contam de 0 ao valor final (2.5s cada)
→ Labels aparecem com stagger
```

---

## Secção 3: AGE PANELS — Cards com Tilt + Parallax

### Animação Actual
```tsx
className="hover:-translate-y-1 hover:shadow-2xl"  // Só hover CSS
```

### Animação Nível Awwwards

```tsx
function AgePanelsSection() {
  useEffect(() => {
    const ctx = gsap.context(() => {
      const panels = gsap.utils.toArray(".age-panel");

      // 1. Cada card entra com stagger e animação diferente
      panels.forEach((panel, i) => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: panel,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        });

        // Card sobe com rotação 3D
        tl.from(panel, {
          y: 80,
          rotationX: 15,  // Inclinação 3D
          opacity: 0,
          duration: 0.9,
          ease: "power3.out",
          delay: i * 0.15,  // Stagger manual
        });

        // Imagem dentro do card faz zoom suave
        tl.from(panel.querySelector("img"), {
          scale: 1.2,
          duration: 1.2,
          ease: "power2.out",
        }, "-=0.6");

        // Texto aparece com reveal
        const textSplit = SplitText.create(
          panel.querySelector("h3"), 
          { type: "words", mask: "words" }
        );
        tl.from(textSplit.words, {
          yPercent: 100,
          opacity: 0,
          duration: 0.6,
          ease: "power3.out",
          stagger: 0.04,
        }, "-=0.4");
      });

      // 2. Parallax individual em cada card
      panels.forEach((panel, i) => {
        const direction = i % 2 === 0 ? 1 : -1;  // Alterna direção
        gsap.to(panel, {
          y: direction * 30,  // Cards ímpares sobem, pares descem
          ease: "none",
          scrollTrigger: {
            trigger: panel,
            start: "top bottom",
            end: "bottom top",
            scrub: 1.5,
          },
        });
      });

      // 3. Tilt effect com mousemove
      panels.forEach((panel) => {
        panel.addEventListener("mousemove", (e) => {
          const rect = panel.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          
          gsap.to(panel, {
            rotationY: ((x - centerX) / centerX) * 8,  // Max 8 graus
            rotationX: -((y - centerY) / centerY) * 8,
            duration: 0.4,
            ease: "power2.out",
            transformPerspective: 1000,  // Profundidade 3D
          });
        });

        panel.addEventListener("mouseleave", () => {
          gsap.to(panel, {
            rotationY: 0,
            rotationX: 0,
            duration: 0.6,
            ease: "elastic.out(1, 0.5)",  // Efeito elástico
          });
        });
      });

    });

    return () => ctx.revert();
  }, []);

  return <div>...</div>;
}
```

#### Efeito Visual:
```
[Scroll até Age Panels]
→ Card 1 sobe com rotação 3D (esquerda)
→ Card 2 sobe com rotação 3D (centro, delay 150ms)
→ Card 3 sobe com rotação 3D (direita, delay 300ms)
→ Imagens fazem zoom suave
→ Títulos revelam-se palavra por palavra

[Mouse sobre card]
→ Card inclina na direção do cursor (max 8°)
→ Efeito 3D com perspectiva

[Mouse sai do card]
→ Card volta à posição com efeito elástico

[Scroll continuado]
→ Cards movem-se a velocidades diferentes (parallax)
```

---

## Secção 4: FEATURES — Grid com Stagger Avançado

### Animação Actual
```tsx
className="hover:-translate-y-1 hover:bg-white"  // Só hover
```

### Animação Nível Awwwards

```tsx
function FeaturesSection() {
  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Título com SplitText reveal
      const titleSplit = SplitText.create(".features-title", {
        type: "lines, words",
        mask: "lines",
      });

      gsap.from(titleSplit.lines, {
        yPercent: 100,
        opacity: 0,
        duration: 0.8,
        ease: "power4.out",
        stagger: 0.1,
        scrollTrigger: {
          trigger: ".features-title",
          start: "top 85%",
        },
      });

      // 2. Cards com batch (agrupamento inteligente)
      // Em vez de stagger individual, agrupa cards que entram juntos
      ScrollTrigger.batch(".feature-card", {
        onEnter: (batch) => {
          gsap.from(batch, {
            y: 60,
            opacity: 0,
            scale: 0.95,
            duration: 0.8,
            ease: "power3.out",
            stagger: 0.08,
            overwrite: "auto",
          });
        },
        start: "top 88%",
      });

      // 3. Ícones fazem bounce quando o card aparece
      gsap.utils.toArray(".feature-icon").forEach((icon) => {
        gsap.from(icon, {
          scale: 0,
          rotation: -180,  // Rotação completa
          duration: 0.8,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: icon,
            start: "top 85%",
          },
        });
      });

      // 4. Hover effect com magnetic button
      document.querySelectorAll(".feature-card").forEach((card) => {
        card.addEventListener("mousemove", (e) => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left - rect.width / 2;
          const y = e.clientY - rect.top - rect.height / 2;
          
          gsap.to(card, {
            x: x * 0.1,  // Segue o cursor com 10% da distância
            y: y * 0.1,
            duration: 0.3,
            ease: "power2.out",
          });
        });

        card.addEventListener("mouseleave", () => {
          gsap.to(card, {
            x: 0,
            y: 0,
            duration: 0.5,
            ease: "elastic.out(1, 0.3)",
          });
        });
      });

    });

    return () => ctx.revert();
  }, []);

  return <div>...</div>;
}
```

#### Efeito Visual:
```
[Scroll até Features]
→ Título revela-se linha por linha
→ Cards aparecem em batch (agrupados)
→ Ícones fazem spin + bounce

[Mouse sobre card]
→ Card segue o cursor suavemente (magnetic)
→ Card inclina ligeiramente

[Mouse sai]
→ Card volta com efeito elástico
```

---

## Secção 5: CEFR LEVELS — Barras Animadas com Scrub

### Animação Actual
```tsx
className="h-16 h-20 h-24 h-28 h-32 h-36"  // Alturas estáticas
```

### Animação Nível Awwwards

```tsx
function CefrSection() {
  useEffect(() => {
    const ctx = gsap.context(() => {
      const bars = gsap.utils.toArray(".cefr-bar");

      // 1. Barras crescem de baixo para cima com scrub
      // O crescimento está ligado diretamente ao scroll
      bars.forEach((bar, i) => {
        gsap.fromTo(bar, 
          { 
            scaleY: 0,           // Começa zero
            transformOrigin: "bottom",  // Cresce de baixo
          },
          {
            scaleY: 1,           // Cresce até ao normal
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: bar,
              start: "top 90%",
              end: "top 40%",
              scrub: 1,  // Ligado ao scroll com 1s de suavização
            },
          }
        );
      });

      // 2. Labels aparecem com stagger
      gsap.from(".cefr-label", {
        y: 20,
        opacity: 0,
        duration: 0.5,
        ease: "power3.out",
        stagger: 0.1,
        scrollTrigger: {
          trigger: ".cefr-section",
          start: "top 60%",
        },
      });

      // 3. Texto lateral com reveal
      const cefrText = SplitText.create(".cefr-description", {
        type: "lines",
        mask: "lines",
      });

      gsap.from(efrText.lines, {
        yPercent: 80,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.08,
        scrollTrigger: {
          trigger: ".cefr-description",
          start: "top 80%",
        },
      });

      // 4. Efeito de brilho no nível atual (C2)
      gsap.to(".cefr-bar:last-child", {
        boxShadow: "0 0 40px rgba(14, 165, 164, 0.6)",
        duration: 1.5,
        ease: "power2.inOut",
        yoyo: true,
        repeat: -1,
        scrollTrigger: {
          trigger: ".cefr-section",
          start: "top 50%",
        },
      });

    });

    return () => ctx.revert();
  }, []);

  return <div>...</div>;
}
```

#### Efeito Visual:
```
[Scroll até CEFR]
→ Barras crescem de baixo para cima (scrub ligado ao scroll)
→ Labels aparecem com stagger
→ Texto revela-se linha por linha
→ Nível C2 pulsa com brilho
```

---

## Secção 6: TESTIMONIAL — Typewriter + Parallax

### Animação Actual
```tsx
<div className="rounded-[2rem] bg-[#0F172A] ...">  // Estático
```

### Animação Nível Awwwards

```tsx
function TestimonialSection() {
  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Card escuro entra com clip-path circular
      gsap.from(".testimonial-card", {
        clipPath: "circle(0% at 50% 50%)",  // Começa como ponto
        duration: 1.2,
        ease: "power4.inOut",
        scrollTrigger: {
          trigger: ".testimonial-section",
          start: "top 70%",
        },
      });

      // 2. Aspas animadas
      gsap.from(".quote-mark", {
        scale: 0,
        rotation: -180,
        duration: 0.8,
        ease: "back.out(1.7)",
        scrollTrigger: {
          trigger: ".testimonial-card",
          start: "top 60%",
        },
      });

      // 3. Texto da citação com ScrambleText
      // O texto "mistura-se" antes de se revelar
      const quoteText = ".testimonial-quote";
      gsap.from(quoteText, {
        duration: 2,
        ease: "none",
        text: {
          value: "",
          delimiter: "",
        },
        scrollTrigger: {
          trigger: quoteText,
          start: "top 75%",
        },
      });

      // 4. Avatar com efeito de blur
      gsap.from(".testimonial-avatar", {
        filter: "blur(20px)",
        scale: 1.2,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".testimonial-card",
          start: "top 50%",
        },
      });

      // 5. Parallax no card escuro
      gsap.to(".testimonial-card", {
        y: -30,
        ease: "none",
        scrollTrigger: {
          trigger: ".testimonial-section",
          start: "top bottom",
          end: "bottom top",
          scrub: 2,
        },
      });

    });

    return () => ctx.revert();
  }, []);

  return <div>...</div>;
}
```

---

## Secção 7: CTA FINAL — Efeito de Profundidade

### Animação Actual
```tsx
<div className="rounded-[3rem] bg-gradient-to-br ...">  // Estático
```

### Animação Nível Awwwards

```tsx
function CtaSection() {
  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Container com efeito de profundidade (pin)
      const ctaTl = gsap.timeline({
        scrollTrigger: {
          trigger: ".cta-section",
          start: "top top",
          end: "+=500",  // 500px de scroll
          pin: true,     // Fixa o container
          scrub: 1,
        },
      });

      // 2. Círculos de fundo movem-se em direções opostas
      ctaTl.to(".cta-circle-1", {
        x: 100,
        y: -50,
        scale: 1.2,
        duration: 1,
      }, 0);

      ctaTl.to(".cta-circle-2", {
        x: -80,
        y: 40,
        scale: 0.8,
        duration: 1,
      }, 0);

      // 3. Título revela-se
      const ctaSplit = SplitText.create(".cta-title", {
        type: "words",
        mask: "words",
      });

      ctaTl.from(ctaSplit.words, {
        yPercent: 120,
        opacity: 0,
        duration: 0.6,
        stagger: 0.05,
      }, 0.2);

      // 4. Subtítulo aparece
      ctaTl.from(".cta-subtitle", {
        y: 30,
        opacity: 0,
        duration: 0.5,
      }, 0.5);

      // 5. Botões entram com bounce
      ctaTl.from(".cta-button", {
        scale: 0.8,
        opacity: 0,
        duration: 0.5,
        ease: "back.out(1.7)",
        stagger: 0.1,
      }, 0.7);

    });

    return () => ctx.revert();
  }, []);

  return <div>...</div>;
}
```

---

## Secção 8: MARQUEE — Texto Infinito Animado

### Animação Nova (não existe actualmente)

```tsx
function MarqueeSection() {
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Texto move-se da direita para a esquerda em loop infinito
      const marquee = gsap.to(".marquee-content", {
        x: "-50%",  // Move metade do conteúdo (duplicado)
        duration: 20,
        ease: "none",
        repeat: -1,  // Infinito
      });

      // Pausa quando o mouse está sobre
      const container = document.querySelector(".marquee-container");
      container?.addEventListener("mouseenter", () => marquee.pause());
      container?.addEventListener("mouseleave", () => marquee.play());

      // Acelera com scroll
      ScrollTrigger.create({
        trigger: ".marquee-container",
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => {
          const velocity = self.getVelocity();
          const speed = Math.abs(velocity) / 500;
          gsap.to(marquee, { 
            timeScale: 1 + speed, 
            duration: 0.3,
          });
        },
      });

    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="marquee-container overflow-hidden">
      <div className="marquee-content flex whitespace-nowrap">
        {/* Texto duplicado para loop infinito */}
        <span>Grammar · Vocabulary · Pronunciation · Speaking · Listening · Writing · </span>
        <span>Grammar · Vocabulary · Pronunciation · Speaking · Listening · Writing · </span>
      </div>
    </div>
  );
}
```

---

## Instalação e Configuração

### 1. Instalar dependências

```bash
npm install gsap @gsap/react
```

### 2. Registrar plugins

```tsx
// src/lib/gsap.ts
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, SplitText);

// Configurações globais
gsap.defaults({
  ease: "power3.out",
  duration: 0.8,
});

export { gsap, ScrollTrigger, SplitText };
```

### 3. Hook personalizado para React

```tsx
// src/hooks/useGsapScrollAnimation.ts
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function useGsapScrollAnimation(
  animationFn: (gsap: typeof import("gsap").default) => void,
  deps: any[] = []
) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      animationFn(gsap);
    }, containerRef);

    return () => ctx.revert();
  }, deps);

  return containerRef;
}
```

---

## Referências Awwwards com GSAP

| Site | Animação GSAP | URL |
|------|---------------|-----|
| Apple | Parallax + ScrollTrigger pin | apple.com |
| Stripe | Gradient animation + scrub | stripe.com |
| Linear | Page transitions + Flip | linear.app |
| GSAP Showcase | Todos os plugins | gsap.com/showcase |
| Awwwards SOTD | Mix de tudo | awwwards.com |

---

## Métricas de Performance

| Métrica | Target | Como Medir |
|---------|--------|------------|
| Scroll FPS | 60fps constante | Chrome DevTools Performance |
| GSAP Animation Duration | <16ms por frame | GSAP DevTools |
| Bundle Size GSAP | ~25KB gzipped | Bundle analyzer |
| First Paint | <1.5s | Lighthouse |
| Total Blocking Time | <200ms | Lighthouse |

---

## Conclusão

Com GSAP + ScrollTrigger + SplitText, a homepage do LEWC pode atingir nível Awwwards:

1. **SplitText** revela texto palavra por palavra com máscaras
2. **ScrollTrigger** liga animações ao scroll com scrub
3. **Tilt + Magnetic** criam interactividade 3D
4. **Pin** fixa secções durante o scroll
5. **Parallax** cria profundidade real
6. **Batch** agrupa elementos para performances optimizadas

**Próximo passo:** Implementar o Hero com SplitText + Curtain reveal como prova de conceito.

---

## OTIMIZAÇÃO MOBILE E PERFORMANCE (CRÍTICO)

### Princípios Fundamentais

1. **Menos é mais em mobile** — Animações mais simples, mais rápidas, menos DOM nodes
2. **Transform e Opacity sempre** — Nunca animar layout properties (width, height, margin, top, left)
3. **GPU acceleration** — Usar `force3D: true` e `will-change: transform`
4. **prefers-reduced-motion** — Respeitar a preferência do utilizador de reduzir animações
5. **Lazy animations** — Só carregar animações quando a secção está perto do viewport

---

### 1. Configuração GSAP com matchMedia para Responsive

```tsx
// src/lib/gsap.ts
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, SplitText);

// Configurações globais otimizadas
gsap.defaults({
  ease: "power3.out",
  force3D: true,  // GPU acceleration em todos os tweens
  overwrite: "auto",  // Previne sobreposição de animações
});

// Configurar matchMedia para diferentes ecrãs
ScrollTrigger.matchMedia({
  // Desktop: animações completas
  "(min-width: 769px)": function () {
    // Todas as animações desktop aqui
  },

  // Tablet: animações simplificadas
  "(min-width: 481px) and (max-width: 768px)": function () {
    // Animações simplificadas para tablet
  },

  // Mobile: animações mínimas
  "(max-width: 480px)": function () {
    // Apenas fade-in básico, sem parallax complexo
  },

  // Respeitar preferência de redução de movimento
  "(prefers-reduced-motion: reduce)": function () {
    // Desativar todas as animações ou usar apenas fade-in
    gsap.globalTimeline.timeScale(100);  // Animações instantâneas
  },
});

export { gsap, ScrollTrigger, SplitText };
```

---

### 2. Hook Otimizado com Limpeza de Memória

```tsx
// src/hooks/useGsapAnimations.ts
import { useEffect, useRef, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Detectar mobile
const isMobile = () => {
  if (typeof window === "undefined") return false;
  return window.innerWidth <= 768;
};

// Detectar prefers-reduced-motion
const prefersReducedMotion = () => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

export function useGsapAnimations(
  animationFn: () => void,
  deps: any[] = []
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ctxRef = useRef<gsap.Context | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Se o utilizador prefere menos movimento, pular animações
    if (prefersReducedMotion()) {
      // Mostrar tudo imediatamente sem animação
      gsap.set("[data-animate]", { opacity: 1, y: 0 });
      return;
    }

    // Criar contexto GSAP para limpeza automática
    ctxRef.current = gsap.context(() => {
      animationFn();
    }, containerRef);

    return () => {
      // Limpeza automática de todas as animações
      ctxRef.current?.revert();
      ctxRef.current = null;

      // Forçar limpeza de ScrollTriggers órfãos
      ScrollTrigger.getAll().forEach((st) => {
        if (containerRef.current?.contains(st.trigger)) {
          st.kill();
        }
      });
    };
  }, deps);

  return containerRef;
}

// Hook para animações que só funcionam em desktop
export function useDesktopOnly(
  animationFn: () => void,
  deps: any[] = []
) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (isMobile()) return;  // Não executar em mobile
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(animationFn, containerRef);
    return () => ctx.revert();
  }, deps);

  return containerRef;
}

// Hook para animações leves em mobile
export function useMobileFriendly(
  desktopFn: () => void,
  mobileFn: () => void,
  deps: any[] = []
) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (prefersReducedMotion()) return;

    const fn = isMobile() ? mobileFn : desktopFn;
    const ctx = gsap.context(fn, containerRef);
    return () => ctx.revert();
  }, deps);

  return containerRef;
}
```

---

### 3. Animações Desktop vs Mobile

| Secção | Desktop | Mobile | Razão |
|--------|---------|--------|-------|
| **Hero** | SplitText reveal + Curtain + Parallax | Fade-in simples + slide up | SplitText cria muitos DOM nodes em mobile |
| **Stats** | Counter animation + batch | Apenas fade-in | Contadores são pesados em ecrãs pequenos |
| **Age Panels** | Tilt 3D + Parallax scrub | Slide up simples | Tilt precisa de mousemove (não existe em touch) |
| **Features** | Batch + Magnetic hover | Fade-in com stagger leve | Magnetic não funciona em touch |
| **CEFR** | Bars grow com scrub | Bars aparecem de uma vez | Scrub é pesado em mobile |
| **Testimonial** | Circle clip + ScrambleText | Fade-in simples | Clip-path complexo pode causar lag |
| **CTA** | Pin + Depth effect | Fade-in simples | Pin é problemático em mobile |
| **Marquee** | Infinite scroll + velocity | Desativado | Marquee em scroll é pesado |

---

### 4. Otimizações de Performance

#### 4.1 — Limitar DOM Nodes do SplitText

```tsx
// MÁXIMO de caracteres para SplitText em mobile
const MAX_CHARS_MOBILE = 50;
const MAX_CHARS_DESKTOP = 200;

function getSplitConfig(isMobile: boolean) {
  return isMobile
    ? { type: "lines", mask: "lines" }  // Só lines, sem chars
    : { type: "words, chars", mask: "words" };  // Completo
}
```

#### 4.2 — Usar Transform em vez de Layout

```tsx
// MÁ ❌ — Layout properties (pesado)
gsap.to(element, {
  top: 100,        // Recalcula layout
  left: 50,        // Recalcula layout
  width: 200,      // Recalcula layout
  height: 100,     // Recalcula layout
  marginTop: 20,   // Recalcula layout
});

// BEM ✅ — Transform (leve, GPU)
gsap.to(element, {
  y: 100,          // Transform
  x: 50,           // Transform
  scaleX: 2,       // Transform
  scaleY: 1,       // Transform
  opacity: 0.5,    // Composite layer
});
```

#### 4.3 — Batch para Muitos Elementos

```tsx
// MÁ ❌ — Stagger individual de 12 cards
gsap.from(".feature-card", {
  y: 60,
  stagger: 0.1,  // 12 cards × 0.1s = 1.2s de animation building
});

// BEM ✅ — Batch agrupa cards que entram juntos
ScrollTrigger.batch(".feature-card", {
  onEnter: (batch) => {
    gsap.to(batch, {
      y: 0,
      opacity: 1,
      stagger: 0.08,
      overwrite: "auto",
    });
  },
  start: "top 88%",
});
```

#### 4.4 — will-change para Animações Pesadas

```css
/* Aplicar will-change apenas durante a animação */
.animação-pesada {
  will-change: transform, opacity;
}

/* Remover depois da animação */
.animação-concluída {
  will-change: auto;
}
```

```tsx
// No GSAP: adicionar/remover will-change automaticamente
gsap.to(element, {
  willChange: "transform, opacity",
  y: 100,
  duration: 1,
  onComplete: () => {
    gsap.set(element, { willChange: "auto" });
  },
});
```

#### 4.5 — Limitar Stagger em Mobile

```tsx
// Desktop: stagger de 0.08s
// Mobile: stagger de 0.03s (mais rápido, menos overhead)
const staggerDuration = isMobile() ? 0.03 : 0.08;

gsap.from(".card", {
  y: 40,
  opacity: 0,
  stagger: staggerDuration,
});
```

---

### 5. Durações de Animação Otimizadas

| Dispositivo | Duração Máxima | Stagger Máximo | Notas |
|-------------|----------------|----------------|-------|
| Desktop | 1.2s | 0.1s | Pode ser mais elaborado |
| Tablet | 0.8s | 0.06s | Simplificado |
| Mobile | 0.5s | 0.03s | Mínimo, rápido |

```tsx
// Configuração automática baseada no dispositivo
const getConfig = () => {
  if (isMobile()) {
    return {
      duration: 0.5,
      stagger: 0.03,
      ease: "power2.out",  // Mais suave que power4
      scrub: false,  // Sem scrub em mobile
    };
  }
  return {
    duration: 1,
    stagger: 0.08,
    ease: "power3.out",
    scrub: 1.5,
  };
};
```

---

### 6. Parallax — Desativar em Mobile

```tsx
// Parallax é pesado em mobile — desativar
if (!isMobile()) {
  gsap.to(".parallax-element", {
    yPercent: 30,
    ease: "none",
    scrollTrigger: {
      trigger: ".section",
      start: "top bottom",
      end: "bottom top",
      scrub: 1.5,
    },
  });
}
// Em mobile: elemento fica estático (zero overhead)
```

---

### 7. Pin — Usar com Cuidado em Mobile

```tsx
// Pin pode causar problemas em mobile (scroll buggy)
// Usar apenas em desktop
if (!isMobile()) {
  ScrollTrigger.create({
    trigger: ".cta-section",
    start: "top top",
    end: "+=500",
    pin: true,
    scrub: 1,
  });
}

// Em mobile: sem pin, scroll natural
```

---

### 8. Carregamento Lazy de Animações

```tsx
// Só carregar animações quando a secção está perto do viewport
const lazyAnimation = (element: Element, animationFn: () => void) => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animationFn();
          observer.unobserve(entry.target);  // Uma vez
        }
      });
    },
    { rootMargin: "100px" }  // 100px antes de entrar no viewport
  );
  observer.observe(element);
};
```

---

### 9. Monitorização de Performance

```tsx
// Dev only: monitorizar FPS
if (import.meta.env.DEV) {
  let lastTime = performance.now();
  let frames = 0;

  const checkFPS = () => {
    frames++;
    const now = performance.now();
    if (now - lastTime >= 1000) {
      console.log(`FPS: ${frames}`);
      frames = 0;
      lastTime = now;
    }
    requestAnimationFrame(checkFPS);
  };
  requestAnimationFrame(checkFPS);
}
```

---

### 10. Checklist de Performance

| Item | Target | Como Verificar |
|------|--------|----------------|
| FPS em scroll | ≥55fps | Chrome DevTools Performance |
| DOM nodes adicionados | <100 | Chrome DevTools Elements |
| Animações simultâneas | <5 | GSAP DevTools |
| Bundle size GSAP | <30KB gzipped | Bundle analyzer |
| Lighthouse Performance | >90 | Lighthouse |
| First Contentful Paint | <1.5s | Lighthouse |
| Largest Contentful Paint | <2.5s | Lighthouse |
| Total Blocking Time | <200ms | Lighthouse |
| Cumulative Layout Shift | <0.1 | Lighthouse |
| prefers-reduced-motion | Respeitado | Teste manual |

---

### 11. Erros Comuns a Evitar

| Erro | Porquê é mau | Solução |
|------|-------------|---------|
| Animar `top/left` | Recalcula layout a cada frame | Usar `x/y` (transform) |
| SplitText com 500+ chars | Muitos DOM nodes | Limitar a 50 em mobile |
| Parallax em mobile | Bateria e performance | Desativar em mobile |
| Pin em mobile | Scroll buggy | Usar apenas desktop |
| Stagger >0.1s | Parece lag | Usar 0.03-0.08s |
| Sem limpeza de ScrollTrigger | Memory leak | Usar `gsap.context()` |
| Sem `prefers-reduced-motion` | Acessibilidade | Respeitar preferência |
| will-change permanente | GPU memory leak | Remover após animação |

---

### 12. Resumo de Otimizações por Dispositivo

#### Desktop (≥769px)
- SplitText completo (chars + words + lines)
- Parallax com scrub
- Tilt 3D com mousemove
- Magnetic hover
- Pin em secções selecionadas
- Stagger: 0.08s
- Duração: até 1.2s

#### Tablet (481-768px)
- SplitText apenas lines
- Parallax simplificado (menos profundidade)
- Sem tilt (touch não suporta)
- Sem magnetic (touch)
- Sem pin
- Stagger: 0.05s
- Duração: até 0.8s

#### Mobile (≤480px)
- Sem SplitText (ou só lines se necessário)
- Sem parallax
- Sem tilt
- Sem magnetic
- Sem pin
- Apenas fade-in + slide up
- Stagger: 0.03s
- Duração: até 0.5s
- Marquee desativado

#### prefers-reduced-motion
- Todas as animações desativadas
- Elementos aparecem imediatamente (opacity: 1)
- Sem transições

---

### Conclusão de Performance

Com estas otimizações:

1. **Mobile fica leve** — Animações mínimas, sem overhead
2. **Desktop fica premium** — Animações completas nível Awwwards
3. **Acessibilidade** — Respeita preferências do utilizador
4. **Performance** — 60fps em todos os dispositivos
5. **Bateria** — Menos processamento = mais bateria
6. **SEO** — Não afeta Core Web Vitals negativamente

**Regra de ouro:** Se em dúvida, desativar em mobile. Melhor uma página sem animações do que uma página que engasga.
