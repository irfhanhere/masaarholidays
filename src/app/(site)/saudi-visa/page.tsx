import type { Metadata } from "next";
import { SaudiVisaLandingPage } from "@/components/site/SaudiVisaLandingPage";
import { getSiteOrigin } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Saudi Tourist Visa UAE | 1-Year Multiple Entry | AED 750",
  description:
    "Apply for a 1-Year Multiple-Entry Saudi Tourist Visa through Masaar Holidays. Individual applications from AED 750, with a 5% family application discount for 3 or more applicants.",
  alternates: {
    canonical: `${getSiteOrigin()}/saudi-visa`,
  },
  openGraph: {
    title: "Saudi Tourist Visa UAE | 1-Year Multiple Entry | AED 750",
    description:
      "Apply for a 1-Year Multiple-Entry Saudi Tourist Visa through Masaar Holidays. Individual applications from AED 750, with a 5% family application discount for 3 or more applicants.",
    url: `${getSiteOrigin()}/saudi-visa`,
    siteName: "Masaar Holidays",
    images: [
      {
        url: `${getSiteOrigin()}/brand/saudi-visa-kaaba-hero.jpg`,
        width: 1200,
        height: 630,
        alt: "Saudi Tourist Visa - Masaar Holidays",
      },
    ],
    locale: "en_AE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Saudi Tourist Visa UAE | 1-Year Multiple Entry | AED 750",
    description:
      "Apply for a 1-Year Multiple-Entry Saudi Tourist Visa through Masaar Holidays. Fast ~2 working days processing.",
    images: [`${getSiteOrigin()}/brand/saudi-visa-kaaba-hero.jpg`],
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function SaudiVisaRoute() {
  return <SaudiVisaLandingPage />;
}
