// import.meta.env for the browser bundle; process.env fallback for SSR/server routes.
// Set VITE_SITE_URL once the app has a real production domain.
export const SITE_URL = import.meta.env.VITE_SITE_URL || process.env.VITE_SITE_URL || "https://example.com";
