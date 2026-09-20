import type { Metadata } from "next";
import { Hero } from "@/components/site/Hero";
import { FaqSchema } from "@/components/site/FaqSchema";
import { getPublishedFaqs } from "@/lib/data/public";
import { buildStaticPageMetadata } from "@/lib/i18n";
import { FaqPageClient } from "./FaqPageClient";

// Admin-editable via Admin → Page SEO (page_seo table) — see buildStaticPageMetadata.
export async function generateMetadata(): Promise<Metadata> {
  return buildStaticPageMetadata({
    path: "/faq",
    fallbackTitle: "Frequently Asked Questions | Masaar Holidays",
    fallbackDescription:
      "Find answers to common questions about Umrah, Hajj, hotels, transfers, visas, and planning your family journey with Masaar Holidays.",
  });
}

export default async function FaqPage() {
  const allFaqs = await getPublishedFaqs();

  return (
    <>
      <FaqSchema faqs={allFaqs} />
      <Hero
        eyebrow="Support For Your Journey"
        h1="Frequently Asked Questions"
        image="/brand/banners/destination.png"
      >
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-masaar-black/75 sm:text-base">
          Find quick answers to common questions about our services, processes, and your journey with Masaar Holidays.
        </p>
      </Hero>

      <FaqPageClient allFaqs={allFaqs} />
    </>
  );
}
