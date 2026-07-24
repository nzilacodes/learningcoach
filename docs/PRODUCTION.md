# Learning English with Coach — Production Checklist

Guia técnico para lançamento comercial.

## 1. Hospedagem e Deploy

A plataforma corre em **Lovable Cloud** com deploy automático a cada commit.

### GitHub (código-fonte)
1. Painel Lovable → botão `+` (canto inferior esquerdo) → **GitHub → Connect project**
2. Autorizar a Lovable GitHub App
3. Escolher a organização e clicar **Create Repository**
4. Sync bidirecional: push no GitHub → deploy no Lovable; edit no Lovable → commit no GitHub.

### Vercel (opcional — self-hosting)
Depois de conectar ao GitHub:
1. Vercel → New Project → Import do repo GitHub
2. Framework preset: **TanStack Start** (Vite)
3. Build command: `bun run build` · Output: `.output`
4. Copiar as variáveis `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID` para Vercel → Settings → Environment Variables.

### Domínio personalizado
1. Publish (canto superior direito) → Add custom domain
2. Adicionar registos DNS no registrar:
   - A `@` → `185.158.133.1`
   - A `www` → `185.158.133.1`
   - TXT `_lovable` → valor fornecido no painel
3. SSL é provisionado automaticamente após propagação (até 72h).

## 2. SEO
- `public/robots.txt` — bloqueia rotas privadas (`/admin`, `/dashboard`, `/auth`, `/certificate`, `/placement`).
- `src/routes/sitemap[.]xml.ts` — sitemap dinâmico servido em `/sitemap.xml`.
- Metadata por rota via `head()` — title/description/OG/canonical.
- JSON-LD Organization no `__root.tsx`.

## 3. Google Analytics
1. Criar propriedade GA4 → obter `G-XXXXXXXXXX`.
2. Adicionar em Lovable → Project Settings → Environment Variables: `VITE_GA_ID=G-XXXXXXXXXX`.
3. Redeploy. O script é injetado em `__root.tsx` apenas quando a variável existe.

## 4. Backups automáticos
Lovable Cloud (Supabase) faz backups diários automáticos com retenção conforme o plano. Para exportar manualmente: **Cloud → Advanced settings → Export data**.

## 5. Logs e Monitorização
- **Cloud → Logs**: PostgreSQL, API, Auth.
- **Cloud → Analytics**: consultas lentas e uso.
- Erros de frontend são reportados via `reportLovableError` (ver `src/lib/lovable-error-reporting.ts`) para o painel Lovable.
- Auditoria de segurança em `/audit` (apenas admin).

## 6. Tratamento de erros
- `notFoundComponent` (404) e `errorComponent` (500) definidos em `src/routes/__root.tsx`.
- Rota `/maintenance` para janelas de manutenção controladas.

## 7. Segurança
- RLS ativo em todas as tabelas `public.*`.
- JWT via Supabase Auth; HTTPS obrigatório na Lovable Cloud.
- Rate limit, brute-force lockout (5 tentativas / 15 min), Have-I-Been-Pwned password check.
- Painel de auditoria em `/audit` para admin.

## 8. Escalabilidade
- Frontend: SSR edge (Cloudflare Workers) com preload por intent.
- Cache: TanStack Query (`staleTime: 60s`, `gcTime: 5min`).
- Base de dados: escalar plano em **Cloud → Overview → Advanced settings → Instance size**.

## 9. Checklist final de lançamento
- [ ] Domínio custom apontado e SSL Active
- [ ] `VITE_GA_ID` configurado
- [ ] Robots + sitemap acessíveis (`/robots.txt`, `/sitemap.xml`)
- [ ] Página `/pricing` com preços corretos
- [ ] Admin (silvinogomes1992@gmail.com) confirma acesso a `/admin`, `/analytics`, `/audit`
- [ ] Fluxo checkout de teste com cartão / referência
- [ ] Certificate flow: emissão + validação em `/verify/<code>`
- [ ] Streak + XP contabilizados após 1 aula
- [ ] Publish final via botão **Publish**
