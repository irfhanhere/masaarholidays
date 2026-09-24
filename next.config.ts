import type { NextConfig } from "next";

// VERCEL_ENV distinguishes a real Production deploy from a Preview deploy
// (NODE_ENV is "production" for both, which is why the runtime fallback in
// lib/site-url.ts#getSiteOrigin() can't use it to decide whether to warn —
// every PR preview would trigger it). This check only fires for the actual
// masaarholidays.com deploy, so it's safe to make loud: if it fires, the
// live site is about to ship localhost URLs into robots.txt, sitemap.xml,
// and every page's canonical/hreflang tags again. See lib/site-url.ts for
// the full incident history.
if (process.env.VERCEL_ENV === "production" && !process.env.NEXT_PUBLIC_SITE_URL) {
  console.warn(
    "\n*** WARNING: NEXT_PUBLIC_SITE_URL is not set in this Production build. ***\n" +
      "robots.txt, sitemap.xml, and every page's canonical/hreflang tags will fall " +
      "back to the real production URL via lib/site-url.ts's safety net, but the " +
      "actual fix is to set NEXT_PUBLIC_SITE_URL=https://masaarholidays.com in " +
      "Vercel Project Settings -> Environment Variables (Production) and redeploy.\n"
  );
}

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        "www.masaarholidays.com",
        "masaarholidays.com",
        "*.masaarholidays.com",
        "localhost:3000",
        "127.0.0.1:3000",
      ],
    },
  },
};

export default nextConfig;
