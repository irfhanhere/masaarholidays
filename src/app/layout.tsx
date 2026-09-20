import type { Metadata } from "next";
import { headers } from "next/headers";
import Script from "next/script";
import { Montserrat, Cormorant_Garamond } from "next/font/google";
import { LOCALE_DIR, getRequestLocale } from "@/lib/i18n";
import { getSiteOrigin } from "@/lib/site-url";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

// Fallback shell only — every real page overrides title/description via
// its own generateMetadata (see lib/i18n.ts#buildPageMetadata, which
// every page.tsx calls). metadataBase lets root-relative OG image paths
// (e.g. "/brand/banners/umrah.png") resolve to absolute URLs.
export const metadata: Metadata = {
  title: "Masaar Holidays",
  description: "",
  metadataBase: new URL(getSiteOrigin()),
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

  return (
    <html
      lang={locale}
      dir={LOCALE_DIR[locale]}
      className={`${montserrat.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-warm-ivory text-masaar-black">
        {children}
        {gaId && !isAdminRoute && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
