import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { EmptyState, SectionHeading } from "@/components/site/SectionHeading";
import { Container } from "@/components/site/Container";
import { Hero } from "@/components/site/Hero";
import { PackageCard } from "@/components/site/PackageCard";
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
  getPackageRoomPricesByPackageIds,
  getPublishedPackages,
  getPublishedPrivateTrips,
  getPublishedTestimonials,
} from "@/lib/data/public";
import { HomePrivateTrips } from "@/components/site/HomePrivateTrips";
import { buildStaticPageMetadata } from "@/lib/i18n";
import type { PackageRow, PackageTier } from "@/lib/types/database";

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

/** One representative package per tier — the featured duration variant if one's marked, else the shortest. Keeps the Home page teaser to exactly our 3 tiers, never every duration variant (that's what /umrah itself is for). */
function pickTierRepresentatives(packages: PackageRow[]): PackageRow[] {
  return TIER_ORDER.map((tier) => {
    const items = packages.filter((p) => p.tier === tier).sort((a, b) => a.duration_nights - b.duration_nights);
    return items.find((p) => p.is_featured) ?? items[0];
  }).filter((p): p is PackageRow => Boolean(p));
}

export default async function HomePage() {
  const [umrahPackages, testimonials, homeContent, privateTrips] = await Promise.all([
    getPublishedPackages("umrah"),
    getPublishedTestimonials(),
    getHomeContent(),
    getPublishedPrivateTrips(),
  ]);

  const tierPackages = pickTierRepresentatives(umrahPackages);
  // Same live "starting from" computation as PackageGrid (see
  // components/site/PackageGrid.tsx) — kept here rather than switching
  // this section to PackageGrid since it deliberately shows exactly our
  // 3 tiers, not every duration variant.
  const roomPricesByPackage = await getPackageRoomPricesByPackageIds(tierPackages.map((p) => p.id));

  return (
    <>
      <Hero
        eyebrow="Masaar Holidays"
        h1="Thoughtfully Planned Umrah Journeys from the UAE"
        image="/brand/banners/default.png"
      >
        <div className="mt-6 max-w-lg">
          <p className="text-sm text-white/80 sm:text-base">
            Thoughtful planning, trusted partners and dedicated support — so you can focus on what truly
            matters.
          </p>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <WhatsAppButton templateKey="general">Plan Your Umrah</WhatsAppButton>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-md border border-white px-5 py-3 text-sm font-semibold text-white hover:bg-white hover:text-masaar-black"
          >
            Talk to Us
          </Link>
        </div>
      </Hero>

      {/* Why Masaar */}
      <section className="bg-warm-ivory py-16">
        <Container className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHeading eyebrow="Why Masaar" title="More Than a Trip. A Meaningful Journey." align="left" />
            <p className="mt-4 text-sm leading-relaxed text-masaar-black/70">
              At Masaar Holidays, we believe Umrah and Hajj are deeply personal journeys. We&apos;re here to
              make the planning simpler, more comfortable and more meaningful — with honest guidance, trusted
              partners and genuine care at every step.
            </p>
            <Link href="/about" className="mt-4 inline-block text-sm font-semibold text-deep-gold hover:underline">
              Discover Our Story →
            </Link>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-black/5">
            <Image src="/brand/banners/umrah.png" alt="" fill className="object-cover" />
          </div>
        </Container>
      </section>

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
            {tierPackages.length > 0 ? (
              <div className="space-y-4">
                {tierPackages.map((pkg) => (
                  <PackageCard
                    key={pkg.id}
                    pkg={pkg}
                    roomPrices={roomPricesByPackage.get(pkg.id) ?? []}
                    fallbackImageUrl="/brand/banners/umrah.png"
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
