# Layout Guide — Learning English with Coach

Este ficheiro documenta todos os padrões de layout, estilo e estrutura usados no projeto. Usa-o como referência ao criar ou modificar páginas.

---

## 1. Sidebar Reutilizável

O sidebar está em `src/components/videos/videos-sidebar.tsx` e é usado em todas as páginas internas (Videos, AI Coach, Reading, Games).

### Como importar:
```tsx
import { VideosSidebar, VideosMobileNav } from "@/components/videos/videos-sidebar";
```

### Estrutura JSX:
```tsx
<div className="flex h-screen overflow-hidden bg-[var(--background)]">
  {/* Left Sidebar */}
  <VideosSidebar />

  {/* Main area */}
  <div className="flex-1 flex flex-col min-w-0 bg-white">
    {/* Top Header Bar */}
    <header>...</header>

    {/* Content */}
    <main className="flex-1 overflow-y-auto pb-20 md:pb-6 scrollbar-hide">
      {/* Conteúdo da página */}
    </main>
  </div>

  {/* Mobile bottom nav */}
  <VideosMobileNav />
</div>
```

### Sidebar Desktop:
- Largura: `w-72` (expandido) / `w-20` (colapsado)
- Background: `bg-white`
- Border: `border-r border-gray-100`
- Nav items: `rounded-2xl`, `py-3`, `px-4`
- Item ativo: `bg-[var(--violet)]/5 text-[var(--violet)] font-bold`
- Ícones: Lucide React (não Tabler)
- Perfil do utilizador com dropdown para cima
- Colapsável com botão

### Sidebar Mobile:
- Bottom nav fixo com 4 itens principais + botão "Mais"
- Dropdown "Mais" com links restantes

---

## 2. Top Header Bar

Cada página tem um top header uniforme:

```tsx
<header className="h-16 flex items-center justify-between px-6 bg-white border-b border-gray-100 shrink-0 z-10">
  <div className="flex items-center gap-2">
    <h1 className="font-display text-xl font-bold text-[var(--ink)]">Nome da Página</h1>
  </div>
  <div className="flex items-center gap-3">
    {/* Upgrade button */}
    <button className="bg-[var(--ink)] text-white px-4 py-1.5 rounded-lg flex items-center gap-2 text-sm font-semibold hover:opacity-90 transition-opacity">
      <Zap className="w-4 h-4 text-yellow-400" fill="currentColor" />
      Upgrade
    </button>
    {/* Help */}
    <button className="p-2 text-gray-500 hover:bg-gray-50 rounded-full transition-colors">
      <HelpCircle className="w-5 h-5" />
    </button>
    {/* Gift */}
    <button className="p-2 text-gray-500 hover:bg-gray-50 rounded-full transition-colors">
      <Gift className="w-5 h-5" />
    </button>
    {/* Avatar — mobile com dropdown */}
    {/* Avatar — desktop sem dropdown */}
  </div>
</header>
```

---

## 3. Avatar com Dropdown

### Desktop:
```tsx
<div className="hidden md:block">
  <div className="relative inline-flex">
    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
      <User className="w-4 h-4 text-gray-600" />
    </div>
    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
  </div>
</div>
```

### Mobile (com dropdown):
```tsx
<div className="relative md:hidden" ref={avatarRef}>
  {avatarMenuOpen && (
    <>
      <div className="fixed inset-0 z-20" onClick={() => setAvatarMenuOpen(false)} />
      <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-100 rounded-2xl shadow-2xl z-30 py-2 dropdown-enter premium-shadow">
        {/* Opções: Ver perfil, Definições, Sair */}
      </div>
    </>
  )}
  <button onClick={() => setAvatarMenuOpen(!avatarMenuOpen)} className="relative inline-flex">
    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
      <User className="w-4 h-4 text-gray-600" />
    </div>
    <span className="absolute -bottom-0.5 -right-0.5 block w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
  </button>
</div>
```

---

## 4. Ícones

**IMPORTANTE:** Usar sempre **Lucide React** (já instalado). NUNCA usar Tabler Icons.

```tsx
import { User, Settings, LogOut, HelpCircle, Gift, Zap, Play, Star, ... } from "lucide-react";
```

Exemplos de ícones usados:
- Navegação: `Home`, `LayoutDashboard`, `Gamepad2`, `BookOpen`, `Bot`, `Film`, `Mic`, `BookMarked`, `Trophy`, `Users`
- Ações: `Search`, `Bell`, `Play`, `Send`, `MoreVertical`, `CheckCircle`, `XCircle`
- UI: `ChevronDown`, `ChevronUp`, `ChevronRight`, `PanelLeftClose`, `PanelLeftOpen`
- Avatar: `User`, `Settings`, `LogOut`
- Header: `Zap`, `HelpCircle`, `Gift`

---

## 5. CSS Variables (Cores)

```css
--primary: var(--violet)    /* Cor principal (azul/indigo) */
--violet: oklch(0.40 0.12 260)
--magenta: oklch(0.55 0.11 210)
--sunset: oklch(0.55 0.14 250)
--amber: oklch(0.72 0.12 220)
--ink: oklch(0.18 0.03 260) /* Cor do texto principal */
--background: oklch(0.985 0.005 250)
```

Uso no Tailwind:
```tsx
className="text-[var(--ink)]"
className="bg-[var(--primary)]"
className="border-[var(--primary)]/40"
```

---

## 6. Classes CSS Customizadas

Definidas em `src/styles.css`:

```css
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

.premium-shadow { box-shadow: 0 32px 64px -16px rgba(0, 0, 0, 0.08); }

.glass-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.dropdown-enter {
  animation: slideIn 0.2s ease-out;
}
@keyframes slideIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
```

---

## 7. Tipografia

```css
--font-display: "Sora", ui-sans-serif, system-ui, sans-serif;
--font-sans: "Manrope", ui-sans-serif, system-ui, sans-serif;
```

Classes:
- Títulos: `font-display font-bold` ou `font-display text-xl font-bold`
- Corpo: `text-sm`, `text-base`, `text-gray-500`, `text-gray-600`
- Labels: `text-xs font-bold uppercase tracking-widest text-gray-400`

---

## 8. Layout Responsivo

### Padrão de conteúdo:
```tsx
<main className="flex-1 overflow-y-auto pb-20 md:pb-6 scrollbar-hide">
  <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-10">
    {/* Conteúdo */}
  </div>
</main>
```

### Grid responsivo:
```tsx
{/* 1 coluna mobile, 2 tablet, 3 desktop */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">

{/* 1 coluna mobile, 2 tablet, 4 desktop */}
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
```

### Duas colunas (desktop):
```tsx
<div className="flex flex-col lg:flex-row gap-6 md:gap-8">
  <div className="flex-1 space-y-6 md:space-y-8">
    {/* Coluna esquerda */}
  </div>
  <div className="w-full lg:w-[380px] shrink-0">
    {/* Coluna direita */}
  </div>
</div>
```

---

## 9. Cards e Botões

### Card padrão:
```tsx
<div className="bg-white rounded-2xl border border-gray-100 p-5 md:p-6">
  {/* Conteúdo */}
</div>
```

### Card com hover:
```tsx
<div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all group">
  <img className="group-hover:scale-105 transition-transform duration-500" />
  <div className="p-5 md:p-6">...</div>
</div>
```

### Botão primário:
```tsx
<button className="bg-[var(--primary)] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
  Texto
</button>
```

### Botão secundário:
```tsx
<button className="border border-gray-200 text-gray-600 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
  Texto
</button>
```

### Botão pill (filtros):
```tsx
<button className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
  active ? "bg-[var(--primary)] text-white shadow-md" : "bg-white border border-gray-200 text-gray-500"
}`}>
  Texto
</button>
```

---

## 10. Avatar Dropdown no Sidebar (para cima)

```tsx
<div className="border-t border-gray-50 relative p-6" ref={profileRef}>
  {profileOpen && (
    <>
      <div className="fixed inset-0 z-20" onClick={() => setProfileOpen(false)} />
      <div className="absolute bottom-full left-4 right-4 mb-2 bg-white border border-gray-100 rounded-2xl shadow-2xl z-30 py-2 dropdown-enter premium-shadow">
        {/* Opções */}
      </div>
    </>
  )}
  <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-3 px-2">
    {/* Avatar + nome + seta */}
  </button>
</div>
```

---

## 11. Template de Nova Página

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { User, Settings, LogOut, HelpCircle, Gift, Zap } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { VideosSidebar, VideosMobileNav } from "@/components/videos/videos-sidebar";

export const Route = createFileRoute("/nome-da-pagina")({
  component: NovaPagina,
  head: () => ({
    meta: [
      { title: "Nome — Learning English with Coach" },
      { name: "description", content: "Descrição da página." },
    ],
  }),
});

function NovaPagina() {
  const { locale } = useLocale();
  const { user, signOut } = useAuth();
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      <VideosSidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-gray-100 shrink-0 z-10">
          <h1 className="font-display text-xl font-bold text-[var(--ink)]">Nome da Página</h1>
          <div className="flex items-center gap-3">
            <button className="bg-[var(--ink)] text-white px-4 py-1.5 rounded-lg flex items-center gap-2 text-sm font-semibold">
              <Zap className="w-4 h-4 text-yellow-400" fill="currentColor" /> Upgrade
            </button>
            <button className="p-2 text-gray-500 hover:bg-gray-50 rounded-full"><HelpCircle className="w-5 h-5" /></button>
            <button className="p-2 text-gray-500 hover:bg-gray-50 rounded-full"><Gift className="w-5 h-5" /></button>
            {/* Avatar mobile + desktop */}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto pb-20 md:pb-6 scrollbar-hide">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-10">
            {/* Conteúdo */}
          </div>
        </main>
      </div>
      <VideosMobileNav />
    </div>
  );
}
```

---

## 12. Páginas Já Implementadas

> **Nota (24/08/2026):** o Top Header Bar descrito na secção 2 já não se escreve à mão —
> use o componente `<AppHeader>` em `src/components/app-header.tsx`, que centraliza o
> markup e aceita `title`, `titleLevel`, `leftExtra`, `titleExtra`, `actions`,
> `borderClassName` e `blur` para as variantes reais (ver o próprio ficheiro para exemplos
> de uso nos 19 sítios já migrados).

| Página | Rota | Ficheiro |
|--------|------|----------|
| Videos | `/videos` | `src/routes/videos.tsx` |
| AI Coach | `/ai-coach` | `src/routes/ai-coach.tsx` |
| Reading | `/reading` | `src/routes/reading.tsx` |
| Games | `/games` | `src/routes/games.tsx` |
| Media | `/media` | `src/routes/media.tsx` |
| Pronúncia | `/pronunciation` | `src/routes/pronunciation.tsx` |
| Perfil | `/profile` | `src/routes/profile.tsx` |
| Definições | `/settings` | `src/routes/settings.tsx` |
| Currículo | `/curriculum` | `src/routes/curriculum.tsx` |
| Recompensas | `/rewards` | `src/routes/rewards.tsx` |
| Certificados | `/certificates` | `src/routes/certificates.tsx` |
| Turmas | `/classes` | `src/routes/classes.tsx` |
| Comunidade | `/community` | `src/routes/community.tsx` |
| Assinatura | `/subscription` | `src/routes/subscription.tsx` |
| Exame final | `/level-exam/$level` | `src/routes/level-exam.$level.tsx` |
| Diagnóstico | `/placement` | `src/routes/placement.tsx` |
| Lição | `/lesson/$lessonId` | `src/routes/lesson.$lessonId.tsx` |
| Vídeo | `/watch/$videoId` | `src/routes/watch.$videoId.tsx` |
| Dashboard (3 variantes) | `/dashboard` | `src/components/dashboard/{adults,teens,kids}-dashboard.tsx` |

Todas usam o mesmo padrão: Sidebar + `<AppHeader>` + Conteúdo. `videos.tsx` é a exceção
deliberada — o seu header é uma barra de pesquisa, não um título, por isso continua a
usar markup próprio em vez de `<AppHeader>`.

---

## 13. Regras Importantes

1. **NUNCA** usar Tabler Icons — apenas Lucide React
2. **SEMPRE** incluir `pb-20 md:pb-6` no main (padding bottom para mobile nav)
3. **SEMPRE** usar `scrollbar-hide` no main
4. **SEMPRE** usar `max-w-6xl mx-auto px-4 md:px-6` no conteúdo
5. **SEMPRE** ter avatar mobile com dropdown E avatar desktop sem dropdown
6. **SEMPRE** responsivo — testar em mobile e desktop
7. Usar `var(--ink)`, `var(--primary)`, etc. para cores
8. Usar `font-display` para títulos
9. Cards com `rounded-2xl border border-gray-100`
10. Botões com `rounded-xl` e `hover:opacity-90`
