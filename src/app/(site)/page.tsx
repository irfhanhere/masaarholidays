import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Container } from "@/components/site/Container";
import { Hero } from "@/components/site/Hero";
import { TestimonialsMarquee } from "@/components/site/TestimonialsMarquee";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import {
  BedIcon,
  CarIcon,
  CompassIcon,
  DocumentIcon,
  FamilyIcon,
  HeadsetIcon,
  HeartHandIcon,
  LocationIcon,
  SuitcaseIcon,
} from "@/components/site/icons";
import {
  getHomeContent,
  getPublishedPrivateTrips,
  getPublishedTestimonials,
  getPublishedUmrahInventoryConfigurations,
} from "@/lib/data/public";
import { HomePrivateTrips } from "@/components/site/HomePrivateTrips";
import { WhyMasaar } from "@/components/site/WhyMasaar";
import { MasaarPremiumUmrahSpotlight } from "@/components/site/MasaarPremiumUmrahSpotlight";
import { MasaarBestSellingUmrahSpotlight } from "@/components/site/MasaarBestSellingUmrahSpotlight";
import { TamaraHighlight } from "@/components/site/TamaraHighlight";
import { ExploreMoreUmrahSection } from "@/components/site/ExploreMoreUmrahSection";
import { HomeAdditionalServices } from "@/components/site/HomeAdditionalServices";
import { getHomepageAdditionalServices } from "@/lib/data/additional-services";
import { getMasaarPremiumPackage } from "@/lib/data/premium-package";
import { getMasaarBestSellingPackage } from "@/lib/data/best-selling-package";
import { buildStaticPageMetadata } from "@/lib/i18n";
import { getSiteOrigin } from "@/lib/site-url";

// Admin-editable via Admin → Page SEO (page_seo table) — see buildStaticPageMetadata.
export async function generateMetadata(): Promise<Metadata> {
  return buildStaticPageMetadata({
    path: "/",
    fallbackTitle: "Umrah Travel Agency UAE | Masaar Holidays",
    fallbackDescription:
      "Private, family-paced Umrah journeys from the UAE. Thoughtful planning, handpicked hotels, and personal support from start to finish. Plan your journey today.",
  });
}

const SERVICES = [
  { icon: CompassIcon, label: "Private Trips", note: "Meaningful places & heritage", href: "/private-trips" },
  { icon: BedIcon, label: "Hotel", note: "Comfortable stays", href: "/hotels" },
  { icon: CarIcon, label: "Private Transfer", note: "Safe & reliable transport", href: "/transfers" },
  { icon: DocumentIcon, label: "Visa", note: "Hassle-free processing with step-by-step guidance", href: "/visa" },
  { icon: LocationIcon, label: "Location", note: "Key destinations", href: "/contact" },
  { icon: HeadsetIcon, label: "Assistance", note: "Support at every step", href: "/contact" },
  { icon: FamilyIcon, label: "Family", note: "For every generation", href: "/contact" },
  { icon: HeartHandIcon, label: "Care", note: "Your comfort, our priority", href: "/contact" },
  { icon: SuitcaseIcon, label: "Luggage", note: "Travel with ease", href: "/contact" },
];

export default async function HomePage() {
  const [
    testimonials,
    homeContent,
    privateTrips,
    additionalServices,
    premiumPackage,
    bestSellingPackage,
  ] = await Promise.all([
    getPublishedTestimonials(),
    getHomeContent(),
    getPublishedPrivateTrips(),
    getHomepageAdditionalServices(),
    getMasaarPremiumPackage(),
    getMasaarBestSellingPackage(),
  ]);

  const origin = getSiteOrigin();

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Masaar Holidays",
    alternateName: ["Masaar Holidays UAE", "Masaar"],
    url: origin,
    inLanguage: "en",
    description:
      "Private, family-paced Umrah journeys from the UAE with handpicked hotels, direct transfers, and personal support.",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />

      {/* 1. Existing homepage hero section */}
      <Hero
        eyebrow="Masaar Holidays"
        h1="Thoughtfully Planned Umrah Journeys from"
        h1Gold="the UAE"
        image="/brand/banners/umrah.webp"
      >
        <div className="mt-6 max-w-lg">
          <p className="text-sm text-masaar-black/60 sm:text-base">
            Faith-led travel, with clarity, care and peace —{" "}
            so you can focus on what truly matters.
          </p>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <WhatsAppButton templateKey="general">Plan Your Umrah</WhatsAppButton>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-md border border-masaar-black/30 px-5 py-3 text-sm font-semibold text-masaar-black hover:border-deep-gold hover:text-deep-gold"
          >
            Talk to Us
          </Link>
        </div>
      </Hero>

      {/* 2. New Tamara payment highlight */}
      <TamaraHighlight />

      {/* 3 & 4. Featured Umrah Packages Section: Premium & Best Selling */}
      <section className="bg-warm-ivory py-16">
        <Container>
          <SectionHeading eyebrow="Featured Umrah Packages" title="Choose a Package That Suits Your Journey" />
          <div className="mt-10 space-y-8">
            {/* 3. Existing Masaar Premium Umrah Package */}
            {premiumPackage.show_on_homepage && (
              <MasaarPremiumUmrahSpotlight pkg={premiumPackage} />
            )}

            {/* 4. New Masaar Best Selling Umrah Package */}
            {bestSellingPackage.show_on_homepage && (
              <MasaarBestSellingUmrahSpotlight pkg={bestSellingPackage} />
            )}
          </div>
        </Container>
      </section>

      {/* 5. New Explore More Umrah Packages section */}
      <ExploreMoreUmrahSection />

      {/* 6. Remaining existing homepage sections */}
      {/* Why Masaar */}
      <WhyMasaar />

      {/* Our services */}
      <section className="py-16">
        <Container>
          <SectionHeading eyebrow="Our Services" title="Thoughtful Services for a Smoother Journey" />
          <p className="mx-auto mt-4 max-w-2xl text-center text-sm text-masaar-black/60">
            From planning to return, we take care of the details so you can focus on your ibadah.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-8 sm:grid-cols-5">
            {SERVICES.map(({ icon: Icon, label, note, href }) => (
              <Link
                key={label}
                href={href}
                className="group flex flex-col items-center gap-2 text-center transition-transform hover:-translate-y-0.5"
              >
                <span className="flex size-14 items-center justify-center rounded-full bg-warm-ivory text-deep-gold transition-colors group-hover:bg-deep-gold group-hover:text-white">
                  <Icon />
                </span>
                <p className="text-sm font-medium text-masaar-black transition-colors group-hover:text-deep-gold">
                  {label}
                </p>
                <p className="text-xs text-masaar-black/70">{note}</p>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* Additional Services: Enhance Your Umrah Journey */}
      <HomeAdditionalServices services={additionalServices} />

      {/* Unified Services & Private Trips Section */}
      <HomePrivateTrips trips={privateTrips} />

      {/* Testimonials */}
      <TestimonialsMarquee testimonials={testimonials} />

      {/* CTA banner */}
      <section className="bg-masaar-black py-12 text-white">
        <Container className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div>
            <h2 className="text-xl font-semibold">Speak to a Masaar Advisor</h2>
            <p className="mt-1 text-sm text-white/70">
              Have questions or ready to plan your journey? We&apos;re here to help.
            </p>
          </div>
          <WhatsAppButton templateKey="general">WhatsApp Us Today</WhatsAppButton>
          <p className="max-w-xs text-right text-xs italic text-white/50">
            &ldquo;{homeContent?.cta_quote_text || "And take provision, but indeed, the best provision is taqwa."}&rdquo;
            <br />— {homeContent?.cta_quote_reference || "Qur'an 2:197"}
          </p>
        </Container>
      </section>
    </>
  );
}
