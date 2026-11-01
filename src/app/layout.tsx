import type { Metadata } from "next";
import { headers } from "next/headers";
import Script from "next/script";
import { LOCALE_DIR, getRequestLocale } from "@/lib/i18n";
import { getSiteOrigin } from "@/lib/site-url";
import "./globals.css";

// Fallback shell only — every real page overrides title/description via
// its own generateMetadata (see lib/i18n.ts#buildPageMetadata, which
// every page.tsx calls). metadataBase lets root-relative OG image paths
// (e.g. "/brand/banners/umrah.webp") resolve to absolute URLs.
export const metadata: Metadata = {
  title: "Masaar Holidays",
  description: "",
  metadataBase: new URL(getSiteOrigin()),
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Reads the `x-locale` header middleware.ts stamps on every public-site
  // request (unset/"en" for /admin, which isn't localized) — see
  // lib/i18n.ts for why this works without a `[locale]` route param or
  // duplicated page files.
  const locale = await getRequestLocale();

  // This layout wraps both the public site and /admin/** through the same
  // <html>/<body> — there's no separate root layout for admin routes —
  // so GA4 below is gated on the `x-pathname` header middleware.ts stamps
  // on every request, rather than relying on route structure to keep
  // admin traffic out of analytics.
  const h = await headers();
  const isAdminRoute = (h.get("x-pathname") ?? "").startsWith("/admin");
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID || process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID || "GTM-M558K96T";

  return (
    <html
      lang={locale}
      dir={LOCALE_DIR[locale]}
      className="h-full antialiased"
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600;1,700&family=Montserrat:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-warm-ivory text-masaar-black">
        {gtmId && !isAdminRoute && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}
        {children}
        {gtmId && !isAdminRoute && (
          <Script id="google-tag-manager" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${gtmId}');
            `}
          </Script>
        )}
        {gaId && !isAdminRoute && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="lazyOnload" />
            <Script id="google-analytics" strategy="lazyOnload">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        )}
        {metaPixelId && !isAdminRoute && (
          <Script id="meta-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${metaPixelId}');
            `}
          </Script>
        )}
      </body>
    </html>
  );
}
