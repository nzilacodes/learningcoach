// import.meta.env for the browser bundle; process.env fallback for SSR/server routes.
// Set VITE_SITE_URL once the app has a real production domain.
const rawSiteUrl =
  import.meta.env.VITE_SITE_URL || process.env.VITE_SITE_URL || "https://example.com";
// Every call site appends a path directly (`${SITE_URL}/about`), so a
// trailing slash in the env var (as shown in .env.example) would otherwise
// produce double slashes in canonical URLs and the sitemap.
export const SITE_URL = rawSiteUrl.replace(/\/+$/, "");
