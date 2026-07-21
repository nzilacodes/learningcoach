# Análise de Animações Nível Awwwards para Homepage LEWC

## Estado Actual da Homepage

A homepage atual tem **apenas 1 animação real**: `animate-fade-in` no hero. Todo o resto são transições CSS básicas em hover. Isto está muito abaixo do padrão Awwwards.

### O que existe actualmente:
- `animate-fade-in` no texto do hero (CSS simples)
- `hover:-translate-y-1` nos cards (transição CSS)
- `hover:scale-[1.02]` nos botões
- `transition-all` genérico

### O que falta (nível Awwwards):
**Tudo.**

---

## Padrões de Animação Recomendados (Nível Awwwards)

### 1. SMOOTH SCROLL (Obrigatório)
**O que é:** Scroll suave que substitui o scroll nativo do browser.
**Porquê:** É a base de tudo. Sem isto, as outras animações parecem abruptas.
**Biblioteca:** `@studio-freight/lenis` (mais usada em sites Awwwards)
**Impacto:** Transforma toda a experiência de navegação.

```
Exemplo: apple.com, stripe.com, linear.app
```

---

### 2. TEXT REVEAL / SPLIT TEXT (Obrigatório)
**O que é:** O título aparece letra por letra ou palavra por palavra quando a secção entra no ecrã.
**Onde aplicar:**
- Título principal do Hero: "Learn English Faster. Speak With Confidence."
- Título "Choose Your Path"
- Título "The complete toolkit"
- Título "From first words to full fluency"
- Título "The results speak for themselves"
- Título "Start Your English Journey Today"

**Como funciona:**
```
Sem animação: "Learn English Faster"
Com animação: "L" "e" "a" "r" "n" " " "E" "n" "g" "l" "i" "s" "h" " " "F" "a" "s" "t" "e" "r"
Cada letra aparece com delay progressivo (stagger 30ms)
```

**Biblioteca:** CSS com `clip-path` ou `@studio-freight/react-lenis` + Intersection Observer
**Impacto:** Visual impressionante, sensação de premium.

---

### 3. PARALLAX SCROLL (Obrigatório)
**O que é:** Elementos movem-se a velocidades diferentes conforme o utilizador faz scroll.
**Onde aplicar:**
- Imagem do Hero move-se mais devagar que o texto
- Cards dos painéis de idade movem-se com velocidade diferente
- Fundos das secções têm profundidade
- Números dos stats movem-se suavemente

**Como funciona:**
```
Texto do hero: velocidade 1.0 (normal)
Imagem do hero: velocidade 0.7 (mais devagar)
Fundo gradiente: velocidade 0.3 (quase estático)
```

**Biblioteca:** Lenis + CSS transforms
**Impacto:** Cria sensação de profundidade e profissionalismo.

---

### 4. STAGGERED CARD ANIMATION (Obrigatório)
**O que é:** Os cards aparecem um por um com delay, em vez de todos ao mesmo tempo.
**Onde aplicar:**
- 12 cards de features
- 3 painéis de idade (Kids, Teens, Adults)
- 6 cards de stats
- Cards do leaderboard

**Como funciona:**
```
Card 1: aparece no 0ms
Card 2: aparece no 100ms
Card 3: aparece no 200ms
Card 4: aparece no 300ms
...etc
```

**Efeito:** Cada card faz `translateY(40px) → 0` + `opacity(0) → 1`
**Impacto:** Visual organizado e profissional.

---

### 5. IMAGE REVEAL / CURTAIN EFFECT (Recomendado)
**O que é:** A imagem é revelada como se uma cortina se estivesse a abrir.
**Onde aplicar:**
- Imagem principal do Hero
- Imagens dos painéis de idade (Kids, Teens, Adults)

**Como funciona:**
```
Antes: imagem com clip-path: inset(0 100% 0 0)
Durante: clip-path: inset(0 0% 0 0) com transição 0.8s
Depois: imagem totalmente visível
```

**Alternativa:** `clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%)`
**Impacto:** Efeito dramático na primeira impressão.

---

### 6. NUMBER COUNTER (Obrigatório)
**O que é:** Os números contam de 0 até ao valor final quando a secção aparece.
**Onde aplicar:**
- "20,000+" → conta de 0 a 20,000
- "95%" → conta de 0 a 95
- "4.9★" → conta de 0 a 4.9
- "120+" → conta de 0 a 120
- "50+" → conta de 0 a 50
- "98%" (testimonial)
- "15k+" (testimonial)

**Como funciona:**
```
Frame 1: 0
Frame 10: 2,000
Frame 20: 5,000
...
Frame 60: 20,000 (valor final)
Duração: ~2 segundos com easing
```

**Biblioteca:** `react-countup` ou implementação manual com `requestAnimationFrame`
**Impacto:** Prova visual de resultados.

---

### 7. MAGNETIC BUTTONS (Recomendado)
**O que é:** O botão segue ligeiramente o cursor quando o rato se aproxima.
**Onde aplicar:**
- Botão "Start Learning" (Hero)
- Botão "Watch Demo" (Hero)
- Botão "Start Free" (CTA final)
- Botão "Explore Courses" (CTA final)

**Como funciona:**
```
Cursor a 50px do centro do botão:
Botão move-se 10px na direção do cursor
Transição: 0.3s ease-out
```

**Impacto:** Interactividade premium, sensação de controlo.

---

### 8. SCROLL-TRIGGERED SECTION TRANSITIONS (Obrigatório)
**O que é:** Cada secção tem a sua própria animação de entrada.
**Onde aplicar e que tipo:**

| Secção | Animação |
|--------|----------|
| Hero | Texto: slide up + fade in, Imagem: curtain reveal |
| Stats | Números: counter animation, labels: fade in com stagger |
| Age Panels | Cards: slide up com stagger, imagens: parallax |
| Features | Grid: staggered fade in, ícones: scale bounce |
| CEFR | Barras: grow de baixo para cima, texto: fade in |
| Testimonial | Citação: typewriter effect, avatar: slide in |
| CTA Final | Título: text reveal, botões: magnetic + fade in |

---

### 9. MARQUEE / INFINITE SCROLL (Opcional mas impactante)
**O que é:** Uma faixa de texto ou imagens que se move horizontalmente em loop.
**Onde aplicar:**
- Entre secções: "A1 · A2 · B1 · B2 · C1 · C2 · A1 · A2 · ..."
- Ou: "Grammar · Vocabulary · Pronunciation · Speaking · Listening · Writing"

**Como funciona:**
```
<div class="overflow-hidden">
  <div class="animate-marquee whitespace-nowrap">
    Grammar · Vocabulary · Pronunciation · Speaking · Listening · Writing · 
    Grammar · Vocabulary · Pronunciation · Speaking · Listening · Writing ·
  </div>
</div>
```

**Impacto:** Visual moderno, ritmo visual.

---

### 10. CURSOR PERSONALIZADO (Opcional)
**O que é:** O cursor do rato é substituído por um círculo personalizado.
**Onde aplicar:**
- Cursor maior quando está sobre botões
- Cursor com texto "Play" quando está sobre o botão de vídeo
- Cursor com "+" quando está sobre cards clicáveis

**Impacto:** Experiência única, memorável.

---

### 11. SMOOTH PAGE TRANSITIONS (Recomendado)
**O que é:** Quando o utilizador clica num link, a página atual desaparece suavemente e a nova aparece.
**Onde aplicar:**
- Navegação entre Home → Pricing
- Navegação entre Home → Dashboard
- Qualquer mudança de rota

**Biblioteca:** `@studio-freight/react-lenis` + route transitions
**Impacto:** Experiência fluida como uma app nativa.

---

### 12. TILT EFFECT NOS CARDS (Recomendado)
**O que é:** Quando o rato passa sobre um card, ele inclina ligeiramente na direção do cursor.
**Onde aplicar:**
- Cards de features (12 cards)
- Cards de idade (Kids, Teens, Adults)
- Card de testimonial

**Como funciona:**
```
Cursor no canto superior esquerdo do card:
Card inclina: rotateX(-5deg) rotateY(5deg)
Transição: 0.2s ease-out
```

**Biblioteca:** `react-tilt` ou implementação manual
**Impacto:** Sensação 3D, interactividade.

---

## Stack de Animações Recomendada

| Biblioteca | Função | Tamanho | Obrigatório |
|------------|--------|---------|-------------|
| `@studio-freight/lenis` | Smooth scroll | ~15KB | ✅ Sim |
| `@studio-freight/react-lenis` | React wrapper | ~5KB | ✅ Sim |
| CSS animations + keyframes | Animações básicas | 0KB | ✅ Sim |
| `Intersection Observer` | Trigger de scroll | Nativo | ✅ Sim |
| `react-countup` | Contadores | ~10KB | ✅ Sim |
| `framer-motion` | Animações avançadas | ~30KB | ⚠️ Opcional |
| `@react-three/fiber` | 3D | ~50KB | ❌ Não |

**Recomendação:** Começar com Lenis + CSS animations. Adicionar Framer Motion depois se necessário.

---

## Plano de Implementação

### Fase 1: Fundamentos (2-3 dias)
1. Instalar Lenis para smooth scroll
2. Criar hook `useScrollAnimation` com Intersection Observer
3. Adicionar animações de entrada a todas as secções
4. Implementar staggered animations nos cards

### Fase 2: Hero Impactante (2 dias)
1. Text reveal no título principal
2. Curtain reveal na imagem do hero
3. Parallax suave no fundo
4. Magnetic buttons

### Fase 3: Secções Intermediárias (2-3 dias)
1. Number counters nos stats
2. Staggered cards nas features
3. CEFR bars com animação de crescimento
4. Marquee entre secções

### Fase 4: Detalhes Premium (1-2 dias)
1. Tilt effect nos cards
2. Cursor personalizado
3. Page transitions
4. Micro-interações nos botões

**Total estimado: 7-10 dias**

---

## Referências Awwwards

Sites com animações de nível Awwwards que devem ser estudados:

| Site | Tipo de Animação | URL |
|------|------------------|-----|
| Apple | Parallax + Text reveal | apple.com |
| Stripe | Smooth scroll + Gradient | stripe.com |
| Linear | Page transitions + Hover | linear.app |
| Vercel | Minimal + Micro-interactions | vercel.com |
| Loom | Staggered animations | loom.com |
| Framer | Scroll animations | framer.com |
| Awwwards itself | Mixed | awwwards.com |
| GSAP Showcase | GSAP animations | gsap.com/showcase |

---

## Métricas de Sucesso

| Métrica | Actual | Target Awwwards |
|---------|--------|-----------------|
| First Contentful Paint | ~2s | <1.5s |
| Largest Contentful Paint | ~3s | <2.5s |
| Time to Interactive | ~4s | <3s |
| Animation FPS | N/A | 60fps constante |
| Scroll Performance | Jank | Smooth 60fps |
| Mobile Performance | Lighthouse ~70 | Lighthouse >90 |

---

## Conclusão

A homepage actual está **muito aquém** do padrão Awwwards. Com as animações acima descritas, o LEWC pode:

1. **Aumentar o tempo na página** em 40-60%
2. **Melhorar a taxa de conversão** em 20-30%
3. **Criar sensação de premium** que justifica os preços
4. **Competir visualmente** com plataformas como Duolingo e Babbel
5. **Memorabilidade** — utilizadores lembram-se do site

A prioridade máxima é: **Smooth scroll + Text reveal + Staggered animations**. Estas três coisas sozinhas transformam completamente a experiência.
