import type { Metadata } from "next";
import { Montserrat, Cormorant_Garamond } from "next/font/google";
import { getRequestLocale } from "@/lib/i18n";
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

// TODO: final title/description copy pending client pricing/package document
// (see masaar-holidays-content-seo-starter-kit.md, Section 2 — SEO Master Map)
export const metadata: Metadata = {
  title: "Masaar Holidays",
  description: "",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Reads the `x-locale` header middleware.ts stamps on every public-site
  // request (unset/"en" for /admin, which isn't localized) — see
  // lib/i18n.ts for why this works without a `[locale]` route param or
  // duplicated page files.
  const locale = await getRequestLocale();

  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      className={`${montserrat.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-warm-ivory text-masaar-black">
        {children}
      </body>
    </html>
  );
}
