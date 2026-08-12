import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

// Deliberately standalone from vite.config.ts — that one is wrapped by
// @lovable.dev/vite-tanstack-config (TanStack Start SSR entry, Nitro, etc.),
// none of which unit tests need. Only the "@/*" path alias is shared.
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
  },
});
