// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { sentryTanstackStart } from "@sentry/tanstackstart-react/vite";

export default defineConfig({
  // The application is self-hosted on the LearningCoach VPS. Nitro's default
  // target for this Lovable project is Cloudflare Workers, which is not
  // executable by Node.js on the server.
  nitro: { preset: "node-server" },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
    // Redirect the client entry to src/client.tsx (loads instrument.client.ts before hydrating).
    client: { entry: "client" },
  },
  // org/project/authToken read from SENTRY_ORG/SENTRY_PROJECT/SENTRY_AUTH_TOKEN
  // env vars (set in CI, see .github/workflows/deploy.yml) — uploads source
  // maps automatically on `npm run build`; no-ops locally when they're unset.
  plugins: [sentryTanstackStart()],
});
