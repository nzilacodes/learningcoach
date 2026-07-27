# Plano — Redesign da página `/games` (baseado no design 1B)

Documento de planeamento, ainda sem implementação. Objetivo: descrever a decisão tomada, os ficheiros envolvidos e os passos para quem for implementar (inclui contexto para o Carlos/mimocode, que não participou desta conversa).

## Decisão

- Ficamos com a opção **1B ("Ledger")** do mockup em `Design/Games/Design de página de jogos (3)/Games.dc.html` (linhas 198–313). A opção 1A é descartada.
- **Sidebar e topbar NÃO vêm do mockup.** O mockup usa um nav horizontal próprio ("Fluent." + links + avatar "JD") que não existe no projeto. Em vez disso:
  - Sidebar: reaproveitar `VideosSidebar` / `VideosMobileNav` de `src/components/videos/videos-sidebar.tsx`, exatamente como já é usada em `/videos`, `/ai-coach`, `/reading` (ver `LAYOUT_GUIDE.md`, secção 1).
  - Topbar: reaproveitar o header padrão `h-16` documentado em `LAYOUT_GUIDE.md`, secção 2 (título + Upgrade + Help + Gift + avatar), o mesmo que `src/routes/games.tsx` já usa hoje.
- O rail esquerdo de filtros do 1B (busca + categoria + nível, 260px) **fica**, mas passa a ser um painel de filtros do catálogo, colocado depois da `VideosSidebar` — não substitui a navegação global do site.

## Ficheiros existentes a reutilizar (nada disto precisa de ser criado do zero)

| Ficheiro | Papel |
| --- | --- |
| `src/routes/games.tsx` | página a alterar |
| `src/components/videos/videos-sidebar.tsx` | `VideosSidebar` + `VideosMobileNav`, mantidos como estão |
| `src/lib/use-age-group.ts` | hook `useAgeGroup()` → `{ group, source, age }` |
| `src/lib/age-tracks.ts` | `AGE_TRACKS[group].games` — já tem uma lista de jogos própria por idade |
| `src/lib/age-theme.tsx` | `AgeThemeProvider` / `useAgeTheme` (contexto + localStorage) |
| `src/components/age-theme-switcher.tsx` | seletor Kids/Teens/Adults já pronto, usado por ex. em `track.tsx` |
| `src/styles.css` | variáveis `--primary`, `--violet`, etc. |
| `Design/Games/Design de página de jogos (3)/Games.dc.html` | mockup de referência (opção 1B, linhas 199–313) |

## Segmentação por idade — o código já existe, só não está ligado a `/games`

Confirmado no código (não foi apagado):

- `src/lib/age-tracks.ts` já define `AGE_TRACKS.kids.games`, `AGE_TRACKS.teens.games` e `AGE_TRACKS.adults.games` — cada grupo com a sua lista própria de jogos (ex.: kids tem "Jogo da Memória", "Arrastar Animais", "Karaokê ABC"; teens tem "Lyric Challenge", "Slang Duel"; adults tem "Simulador de Entrevista", "Negociação de Contrato").
- `src/lib/use-age-group.ts` já resolve o grupo do utilizador (idade do perfil, com fallback para o tema manual).
- `src/routes/track.tsx` já consome isto (`AGE_TRACKS[group].games`, linha ~164) e é o padrão a copiar.
- **O que falta:** `src/routes/games.tsx` hoje usa uma lista `GAMES` fixa, com imagens do Unsplash, sem qualquer ligação a `useAgeGroup`/`AGE_TRACKS`. É por isso que a página só mostra o perfil "adulto" — não porque o código de crianças/teens tenha sido apagado, mas porque esta página nunca foi ligada a essa infraestrutura.

Passos para religar:

1. Em `games.tsx`, importar `useAgeGroup` e `AGE_TRACKS` e substituir o array `GAMES` fixo por `AGE_TRACKS[group].games`.
2. Adicionar à página o `AgeThemeSwitcher` (ou equivalente), para o utilizador poder alternar manualmente entre Kids/Teens/Adults, como já acontece noutras páginas.
3. O tipo `AgeTrack.games` em `age-tracks.ts` hoje só tem `{ pt, en, emoji, xp }`. O catálogo do 1B pede mais campos por jogo — `rating`, `dur`, `level` (CEFR), `cat` (categoria), `plays`, `locked/unlock`. É preciso estender esse tipo (e preencher os 3 grupos) ou manter esses campos extra como metadata só usada por `games.tsx`.

## Cores — regra específica pedida

O mockup usa uma única variável de acento (`--color-accent: #ec3013`, um vermelho-laranja) para quase tudo: botões, badges de XP, estrela de rating, chip de categoria ativo, links, etc.

**Regra a aplicar:** trocar a cor laranja **só nos botões** (`.btn`, `.btn-primary`, `.btn-ghost` e qualquer `<button>`/`<a>` que funcione como ação: "Jogar", "Continuar jogando", "Ver conquistas", "Começar um jogo", "Ver todos") pela cor primária do projeto (`var(--primary)` / `var(--violet)`, ver `LAYOUT_GUIDE.md` secção 5 e 9 — mesmo padrão dos botões usados no resto do site).

**Não mexer** no resto do que está laranja: badge "+XP", ícone de estrela do rating, chip de categoria ativo, texto "Para você", cor dos links — isso fica exatamente como está no mockup.

## O que aproveitar do mockup 1B

- Status strip com stats (XP total / Moedas / Medalhas / Dias seguidos) no topo do conteúdo.
- Rail esquerdo: busca + lista de categorias com contagem + tags de nível (A2–C1 / Todos).
- Grid do catálogo: cards com imagem/monograma, tag de XP, rating, categoria, duração/nível, botão "Jogar" ou estado bloqueado com motivo.
- Secção "Mais jogados" (ranking numerado).
- Banner CTA final.

## Responsividade (obrigatório)

- Seguir os breakpoints já usados no resto do site (`LAYOUT_GUIDE.md` secção 8): grid 1 coluna em mobile → 2 em tablet → 3–4 em desktop.
- O rail de filtros de 260px do 1B não tem hoje um comportamento definido para mobile — precisa de virar um painel colapsável/drawer ou subir para filtros horizontais no topo em ecrãs pequenos, já que a `VideosMobileNav` ocupa a base do ecrã.
- Manter `pb-20 md:pb-6` e `scrollbar-hide` no `<main>`, como nas restantes páginas.
- Testar os 3 age themes (kids/teens/adults) em mobile e desktop, não só o "adults" que é o único visível hoje.

## Passos de implementação (resumo sequencial)

1. Estender `AGE_TRACKS[*].games` em `age-tracks.ts` com os campos que faltam (`rating`, `dur`, `level`, `cat`, `plays`, `locked`, `unlock`).
2. Em `games.tsx`: `useAgeGroup()` + `AGE_TRACKS[group].games` no lugar do array fixo `GAMES`.
3. Manter `VideosSidebar`/`VideosMobileNav` e o header `h-16` padrão — não importar nada do nav do mockup.
4. Construir a status strip ligada a dados reais de gamificação (`src/lib/gamification.ts`) em vez dos valores fixos do mockup.
5. Construir o rail de filtros (busca + categoria + nível), responsivo.
6. Construir o grid de catálogo + secção "Mais jogados", com estado vazio (`Nenhum jogo encontrado`).
7. Aplicar a troca de cor só nos botões, conforme a regra acima.
8. Adicionar o `AgeThemeSwitcher` à página.
9. Testar responsividade e os 3 age themes.

## Em aberto (confirmar antes de implementar)

- Fonte de dados real da status strip (XP/Moedas/Medalhas/Dias) — tabelas reais (`xp_events` etc., ver `Estrutura-back.md`/`docs/AUDITORIA_TECNICA.md`) ou mock por agora?
- Este redesign cobre só a página de **listagem** de jogos. Os jogos em si continuarem por implementar (achado `EDU-02` em `docs/AUDITORIA_TECNICA.md`) não faz parte deste plano — os botões "Jogar" continuam sem destino real até essa outra frente ser resolvida.
