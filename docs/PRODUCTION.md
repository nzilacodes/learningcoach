# Learning English with Coach — Production Runbook

> This replaces an older version of this document that described a Lovable Cloud +
> Supabase deploy (auto-deploy from the Lovable editor, Supabase Auth/RLS, Supabase
> backups). None of that is how the app runs today — it was fully migrated off Supabase
> to a self-hosted Fastify backend (see [`learningcoachbackEnd`](../../learningcoachbackEnd)).
> If you find another copy of the old instructions anywhere, they're wrong — this file is
> the current one.

## 1. Hosting & deploy

Both repos deploy independently via GitHub Actions on every push to `main`:

- **Frontend** (`learningcoach/.github/workflows/deploy.yml`): lint → typecheck → build
  (with `VITE_API_URL` baked in for the target backend) → SSH/scp to the VPS → activate
  release → restart the `learningcoach` systemd service → health-check `/`. **No
  automatic rollback** — a failed health check fails the workflow but leaves the bad
  release active; roll back manually (see §6).
- **Backend** (`learningcoachbackEnd/.github/workflows/deploy.yml`): build → (optionally)
  upload Sentry source maps → rsync to the VPS → activate release → restart the
  `learningcoachbackend` systemd service → health-check → **automatic rollback to the
  previous release** if the service doesn't come back up.
- Neither workflow runs database migrations automatically. After deploying a change that
  includes new files under `learningcoachbackEnd/supabase/migrations/`, run
  `npm run migrate` by hand (see the backend README) — before or after the code deploy
  depending on whether the migration is additive-safe for the currently-running version.

Both apps run behind releases-with-symlink layout on the VPS (`releases/<sha>/` +
a `current` symlink), so a manual rollback is just repointing the symlink and restarting
the service — see §6.

## 2. Environment variables

Real values live in each app's `.env` on the VPS (not in this repo). See each app's
`.env.example` for the full annotated list. The two that must never be wrong in
production:

- Backend `SANDBOX_PAYMENTS_ENABLED` must be `false` (or unset — that's the default). If
  it's ever `true` in production, anyone can mark their own payment as paid via
  `POST /v1/payments/:id/simulate`.
- Frontend `VITE_API_URL` (injected at build time by CI, not read from a runtime `.env`)
  must point at the real backend domain — currently `https://back.learningcoach.co.ao`,
  hardcoded directly in `deploy.yml`.

## 3. SEO

- `public/robots.txt` blocks private routes.
- `src/routes/sitemap[.]xml.ts` serves a dynamic sitemap at `/sitemap.xml`.
- Per-route metadata via each route's `head()` (title/description/OG/canonical), built
  from `VITE_SITE_URL` (see `src/lib/site-url.ts`) — falls back to a placeholder domain
  if unset, so make sure it's actually set in the production build env.

## 4. Backups

Whatever backup policy the Postgres host (wherever `DATABASE_URL` points) provides —
there's no app-level backup/export tooling. Confirm and document the actual current
provider/policy here once it's settled; this is currently the least-verified part of
this runbook.

## 5. Logs & monitoring

- App logs: `journalctl --user -u learningcoach.service` / `learningcoachbackend.service`
  on the VPS (pino logs; pino-pretty in dev).
- Errors: Sentry, when `SENTRY_DSN`/`VITE_SENTRY_DSN` are configured — otherwise nothing
  is centrally collected beyond the systemd journal.
- Admin-only in-app views: `/analytics`, `/audit`, `/track` (linked from `/admin`).

## 6. Manual rollback

On the VPS, for either app:

```bash
# Both apps deploy under the same VPS user, one apps/ subdir each:
app_dir=/home/learningcoach/apps/learningcoach          # or .../learningcoachbackend
ls -1dt "$app_dir/releases/"*/                            # find the previous good release
ln -sfn "$app_dir/releases/<previous-sha>" "$app_dir/current"
systemctl --user restart learningcoach                    # or learningcoachbackend
```

If the rollback also needs a migration reverted, there's no automated down-migration
tooling — write and run the reverse SQL by hand, carefully, against `DATABASE_URL`.

## 7. Error handling

- `notFoundComponent` (404) / `errorComponent` (500) — `src/routes/__root.tsx`.
- `/maintenance` — a standalone route for planned maintenance windows; nothing switches
  the app into it automatically, it's a page to link to (or point DNS/a proxy at) during
  a manual maintenance window.

## 8. Security posture (current, not aspirational)

- No RLS — this architecture doesn't use Postgres RLS or PostgREST at all. Authorization
  is enforced entirely in the Fastify app layer (`requireAuth`/`requireRole` preHandlers
  per route). See `learningcoachbackEnd/src/plugins/roles.ts`.
- Auth: JWT access tokens (`jose`) + hashed opaque refresh tokens, not Supabase Auth.
- Rate limiting (`@fastify/rate-limit`) on sensitive endpoints (auth, AI, contact,
  community); no generic brute-force lockout beyond what's on the login endpoint
  specifically.
- `/audit` (admin-only) surfaces login attempts, lockouts, and an audit log.

## 9. Scaling notes

- Frontend: SSR via the Node build deployed on the VPS (no edge/Workers deployment in
  the current setup, despite what an older version of this doc claimed).
- Client caching: TanStack Query (`staleTime: 60s`, `gcTime: 5min` by default — see
  `src/router.tsx`).
- Database: whatever the Postgres host allows — check current plan/instance size with
  whoever manages `DATABASE_URL`'s target before assuming headroom.

## 10. Launch checklist

- [ ] `VITE_API_URL` in `deploy.yml` points at the correct backend domain
- [ ] Backend `SANDBOX_PAYMENTS_ENABLED=false` confirmed on the VPS
- [ ] `robots.txt` + `/sitemap.xml` reachable and correct
- [ ] `/pricing` shows correct, current prices
- [ ] Admin account confirmed working on `/admin`, `/analytics`, `/audit`
- [ ] A real (not simulated) end-to-end payment method tested, once a PSP is wired up —
      today, checkout is honest about being placeholder-only (see the backend README's
      "Payments — current state" section); don't check this box until that's no longer true
- [ ] Certificate flow: issue one, verify it at `/verify/<code>`
- [ ] Streak + XP update correctly after completing one lesson
