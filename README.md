# learningcoach

Frontend for **Learning English with Coach** — a CEFR-aligned (A1–C2) English learning
platform with age-tracked experiences (kids/teens/adults), an AI coach, pronunciation
practice, video lessons, community rooms, gamification, and CEFR certificates.

TanStack Start (React 19) + TanStack Router (file-based routes) + TanStack Query +
Tailwind CSS v4. Talks to the [`learningcoachbackEnd`](../learningcoachbackEnd) Fastify
API — there's no direct database access from this app.

## Quick start

```bash
npm install
cp .env.example .env   # at minimum, point VITE_API_URL at a running backend
npm run dev              # http://localhost:3000, expects the backend on :8787
```

Run [`learningcoachbackEnd`](../learningcoachbackEnd) alongside this (see its own
README) — this app has no fallback data source; every page that isn't pure marketing
copy depends on the backend being reachable.

## Environment variables

See `.env.example`. `VITE_API_URL` defaults to `http://localhost:8787` if unset, which
is right for local dev against the backend's default port — you only need to set it
explicitly for a non-default backend URL or in production builds (currently injected at
build time in CI, not committed to `.env`). `VITE_SITE_URL` and the Sentry DSNs are
optional; unset Sentry vars mean `Sentry.init()` never runs, client or server.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build (`.output/`) |
| `npm run preview` | Preview a production build locally |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (memory-safe invocation baked into the script — see below) |
| `npm run format` | Prettier, whole repo |
| `npm test` | Vitest |

`npm run lint` runs ESLint via `node --max-old-space-size=4096 ./node_modules/eslint/bin/eslint.js .`
instead of the plain `eslint .` binary — this project's ESLint config is heavy enough
that the default Node heap size can OOM mid-lint; the explicit flag avoids that without
requiring a separate wrapper script.

## Architecture notes

- **Routing**: one-level flat file-based routes under `src/routes/`
  (`src/routes/lesson.$lessonId.tsx` → `/lesson/:lessonId`). `src/routes/__root.tsx`
  wires up the providers (auth, locale, notifications, age theme) and the
  `<html>`/`<head>` document shell.
- **Design tokens**: Tailwind v4 CSS-first config in `src/styles.css` via `@theme inline`.
  Two independent token sets: age-themed brand accents (`--sunset`/`--amber`/`--magenta`/
  `--violet`, overridden per `.theme-kids`/`.theme-teens`/`.theme-adults`) for the
  authenticated app, and fixed `--marketing-*` tokens for the public/marketing pages —
  see the comment block at the top of `styles.css` before changing either.
- **Two app shells**: `SiteHeader`/`SiteFooter` for public/marketing/pre-auth pages
  (landing, pricing, auth, checkout, admin console) vs. `VideosSidebar` + the
  `HeaderActionLinks`/`MobileAvatarMenu`/`DesktopAvatarLink` cluster for the
  authenticated in-app experience (dashboard, curriculum, lessons, videos, community,
  etc.). A page reached from an authenticated page should use the same shell as its
  parent — check a sibling route before picking one for a new page.
- **Forms**: react-hook-form + Zod (`@hookform/resolvers/zod`), using the shared
  `Form`/`FormField`/`FormItem`/`FormControl`/`FormMessage` components in
  `src/components/ui/form.tsx`. Backend Zod validation errors carry a `fieldPaths` array
  (see `src/lib/errors/normalize-api-error.ts`) that call sites map onto `form.setError`.
- **i18n**: no real translation library — `locale === "pt" ? "…" : "…"` inline ternaries
  are the actual, deliberate convention (see the comment block at the top of
  `src/lib/i18n.tsx`), not a stopgap. The small dict `useLocale()` also exposes is for
  the handful of strings shared verbatim across the header/footer.

## Deploy

`.github/workflows/deploy.yml` lints, type-checks, builds (injecting `VITE_API_URL` for
the target environment), and deploys to a VPS via SSH + systemd on every push to `main`.
It health-checks the new release (`curl` against `/`, retrying for up to 60s) but —
unlike the backend's deploy workflow — does **not** automatically roll back to the
previous release if that check fails; a failed health check just fails the workflow,
leaving the bad release active until someone intervenes manually.

## Testing

`npm test` covers isolated `src/lib/` utilities. There's no component or end-to-end test
coverage yet — UI changes are currently verified manually.
