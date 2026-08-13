// Loaded via `node --import ./instrument.server.mjs` before the Nitro server
// entry starts — must run first so Sentry can auto-instrument Node internals
// (http, etc.) before anything else requires them. Server-side reads
// process.env directly (not import.meta.env — this isn't part of the Vite
// client bundle).
import * as Sentry from "@sentry/tanstackstart-react";

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.2,
  });
}
