import "server-only";

const PRODUCTION_FALLBACK_ORIGIN = "https://masaarholidays.com";

/**
 * The site's real origin (no trailing slash) — the single source every
 * absolute-URL builder (sitemap, robots.txt, hreflang/canonical, JSON-LD,
 * OG images, invite emails) reads from, instead of each repeating its own
 * `process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"` fallback.
 *
 * That repeated-fallback pattern is exactly what caused a real production
 * incident: NEXT_PUBLIC_SITE_URL was never set in Vercel's Production
 * environment variables, so every one of those seven call sites silently
 * fell back to "http://localhost:3000" — shipped to search engines as the
 * live robots.txt Sitemap line, every sitemap.xml <loc>, every page's
 * canonical/hreflang tags, and OG image URLs.
 *
 * Fix NEXT_PUBLIC_SITE_URL in Vercel (Project Settings -> Environment
 * Variables -> NEXT_PUBLIC_SITE_URL=https://masaarholidays.com, Production
 * environment) — that's the real fix. This function's production fallback
 * below is a safety net only, not a substitute for setting it: outside of
 * local development, it defaults to the real domain instead of localhost
 * so this specific failure mode (a broken env var silently shipping
 * localhost URLs to production) can't happen again even if the variable
 * is ever unset again, logging a warning so it's visible in server logs
 * when that happens. A hard build failure was the other option considered
 * — rejected because `next build` also runs with NODE_ENV=production for
 * every Vercel Preview deployment, which gets a fresh, unpredictable
 * *.vercel.app URL each time and has no reason to have this variable set;
 * failing those builds would block every PR preview, not just catch a
 * real misconfiguration.
 */
export function getSiteOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");

  if (process.env.NODE_ENV === "production") {
    console.warn(
      `NEXT_PUBLIC_SITE_URL is not set — falling back to ${PRODUCTION_FALLBACK_ORIGIN}. ` +
        "Set NEXT_PUBLIC_SITE_URL in your hosting provider's environment variables to fix this properly."
    );
    return PRODUCTION_FALLBACK_ORIGIN;
  }

  return "http://localhost:3000";
}
