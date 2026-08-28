import "./instrument.client";

import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { StartClient } from "@tanstack/react-start/client";

// Routes/components are code-split and fetched by build hash (e.g.
// assets/onboarding-LYpOe1fF.js). A tab left open across a deploy still has
// the *old* hash in memory; the server no longer has that file (each build
// removes the previous one), so the dynamic import 404s. Vite reports that
// as `vite:preloadError` on window — unhandled, the section that failed to
// load just never renders: no error, no content, a permanently blank area
// (this is what was happening on /onboarding after a deploy landed while
// the tab was already open). Reload once to pick up the current build.
window.addEventListener("vite:preloadError", () => {
  if (sessionStorage.getItem("reloaded-after-preload-error")) return;
  sessionStorage.setItem("reloaded-after-preload-error", "1");
  window.location.reload();
});
// Clear the guard shortly after load so a *later* preload error (a
// different deploy, later in the same tab's life) can still trigger a
// reload — it only exists to stop this handler from reloading twice in a row.
setTimeout(() => sessionStorage.removeItem("reloaded-after-preload-error"), 10_000);

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <StartClient />
    </StrictMode>,
  );
});
