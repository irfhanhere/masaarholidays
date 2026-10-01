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
  devIndicators: false,
  htmlLimitedBots:
    /[\w-]+-Google|Google-[\w-]+|Chrome-Lighthouse|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|Yeti|googleweblight|Screaming Frog|curl|Wget/i,
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.halalstatic.com",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async redirects() {
    return [
      // 1. Host redirect: apex domain to www
      {
        source: "/:path*",
        has: [{ type: "host", value: "masaarholidays.com" }],
        destination: "https://www.masaarholidays.com/:path*",
        permanent: true,
      },
      // 2. Direct replacements for retired Hajj package slugs with an exact equivalent
      {
        source: "/hajj/hajj-essential-10-days",
        destination: "/hajj/hajj-essential-9-days",
        permanent: true,
      },
      {
        source: "/hajj/hajj-signature-10-days",
        destination: "/hajj/hajj-signature-9-days",
        permanent: true,
      },
      // 3. Umrah placeholder slugs -> clean tier URLs
      {
        source: "/umrah/umrah-essential-placeholder",
        destination: "/umrah/essential",
        permanent: true,
      },
      {
        source: "/umrah/umrah-signature-placeholder",
        destination: "/umrah/signature",
        permanent: true,
      },
      {
        source: "/umrah/umrah-exclusive-placeholder",
        destination: "/umrah/exclusive",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      // Security headers across all routes
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      // Cache-Control for unhashed static asset folders: /brand, /trips, /hotels, /vehicles
      {
        source: "/brand/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=2592000, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/trips/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=2592000, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/hotels/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=2592000, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/vehicles/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=2592000, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
  experimental: {
    inlineCss: true,
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
