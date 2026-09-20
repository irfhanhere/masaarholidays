import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { EmptyState, SectionHeading } from "@/components/site/SectionHeading";
import { Container } from "@/components/site/Container";
import { Hero } from "@/components/site/Hero";
import { FeaturedPackageCard } from "@/components/site/FeaturedPackageCard";
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
  type PublicUmrahInventoryConfig,
} from "@/lib/data/public";
import { HomePrivateTrips } from "@/components/site/HomePrivateTrips";
import { WhyMasaar } from "@/components/site/WhyMasaar";
import { buildStaticPageMetadata } from "@/lib/i18n";
import type { PackageTier } from "@/lib/types/database";

// Admin-editable via Admin → Page SEO (page_seo table) — see buildStaticPageMetadata.
export async function generateMetadata(): Promise<Metadata> {
  return buildStaticPageMetadata({
    path: "/",
    fallbackTitle: "Umrah Travel Agency UAE | Masaar Holidays",
    fallbackDescription:
      "Masaar Holidays plans private, family-paced Umrah journeys from the UAE — personalised support, curated accommodation, and one dedicated point of contact throughout.",
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

const TIER_ORDER: PackageTier[] = ["essential", "signature", "exclusive"];

/** One representative inventory configuration per tier for the Home page teaser —
 *  real duration + pricing from umrah_inventory_configurations, never the legacy
 *  packages/package_room_prices placeholder rows. Prefers the evergreen
 *  (month-agnostic) Makkah+Madinah configuration, shortest duration first, matching
 *  the default shown on /umrah itself; falls back to Makkah Only, then to any month,
 *  so a tier is only omitted if it truly has no published configuration yet. */
function pickFeaturedUmrahConfigs(configs: PublicUmrahInventoryConfig[]): PublicUmrahInventoryConfig[] {
  return TIER_ORDER.map((tier) => {
    const tierConfigs = configs.filter((c) => c.package.tier === tier);
    const shortestMatch = (journeyType: PublicUmrahInventoryConfig["journey_type"], genericOnly: boolean) =>
      tierConfigs
        .filter((c) => c.journey_type === journeyType && (!genericOnly || c.month_id === null))
        .sort((a, b) => a.duration_nights - b.duration_nights)[0];

    return (
      shortestMatch("makkah_madinah", true) ??
      shortestMatch("makkah_madinah", false) ??
      shortestMatch("makkah_only", true) ??
      shortestMatch("makkah_only", false) ??
      null
    );
  }).filter((c): c is PublicUmrahInventoryConfig => Boolean(c));
}

export default async function HomePage() {
  const [inventoryConfigs, testimonials, homeContent, privateTrips] = await Promise.all([
    getPublishedUmrahInventoryConfigurations(),
    getPublishedTestimonials(),
    getHomeContent(),
    getPublishedPrivateTrips(),
  ]);

  const featuredConfigs = pickFeaturedUmrahConfigs(inventoryConfigs);

  return (
    <>
      <Hero
        eyebrow="Masaar Holidays"
        h1="Thoughtfully Planned Umrah Journeys from"
        h1Gold="the UAE"
        image="/brand/banners/umrah.png"
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
                <p className="text-xs text-masaar-black/50">{note}</p>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* Featured Umrah packages — exactly our 3 tiers, one card each */}
      <section className="bg-warm-ivory py-16">
        <Container>
          <SectionHeading eyebrow="Featured Umrah Packages" title="Choose a Package That Suits Your Journey" />
          <div className="mt-10">
            {featuredConfigs.length > 0 ? (
              <div className="space-y-6">
                {featuredConfigs.map((config) => (
                  <FeaturedPackageCard
                    key={config.id}
                    pkg={config.package}
                    roomPrices={config.room_prices.map((rp) => ({
                      room_type: rp.occupancy_type,
                      price_aed: rp.price_aed,
                    }))}
                    durationLabel={config.duration_label}
                    fallbackImageUrl="/brand/banners/umrah.png"
                    makkahHotel={config.makkah_hotel ?? null}
                    madinahHotel={config.madinah_hotel ?? null}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No packages published yet"
                note="Add Umrah packages from Admin → Packages once pricing is confirmed."
              />
            )}
          </div>
        </Container>
      </section>

      {/* Unified Services & Private Trips Section */}
      <HomePrivateTrips trips={privateTrips} />

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
