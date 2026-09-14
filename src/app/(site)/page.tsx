import type { Metadata } from "next";
import Link from "next/link";
import { ContentPending, EmptyState, SectionHeading } from "@/components/site/SectionHeading";
import { Container } from "@/components/site/Container";
import { Hero } from "@/components/site/Hero";
import { PackageCard } from "@/components/site/PackageCard";
import { TestimonialCard } from "@/components/site/TestimonialCard";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import {
  BedIcon,
  CarIcon,
  DocumentIcon,
} from "@/components/site/icons";
import { getPublishedPackages, getPublishedTestimonials } from "@/lib/data/public";
import { buildPageMetadata } from "@/lib/i18n";
import { WHATSAPP_TEMPLATES } from "@/lib/whatsapp-templates";

// SEO Master Map — masaar-holidays-content-seo-starter-kit.md, Section 2.
export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    path: "/",
    title: "Umrah Travel Agency UAE | Masaar Holidays",
    description:
      "Masaar Holidays plans private, family-paced Umrah journeys from the UAE — personalised support, curated accommodation, and one dedicated point of contact throughout.",
  });
}

export default async function HomePage() {
  const [umrahPackages, testimonials] = await Promise.all([
    getPublishedPackages("umrah"),
    getPublishedTestimonials(3),
  ]);

  return (
    <>
      <Hero
        eyebrow="Masaar Holidays"
        h1="Thoughtfully Planned Umrah Journeys from the UAE"
        image="/brand/banners/default.png"
      >
        <div className="mt-6 max-w-lg">
          <ContentPending note="Hero intro line pending final copy (brand + SEO phrase combined per starter-kit Section 0)." />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <WhatsAppButton message={WHATSAPP_TEMPLATES.general}>Plan Your Umrah</WhatsAppButton>
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
            <div className="mt-4">
              <ContentPending />
            </div>
            <Link href="/about" className="mt-4 inline-block text-sm font-semibold text-deep-gold hover:underline">
              Discover Our Story →
            </Link>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-black/5">
            {/* TODO: swap for a licensed/approved photo once selected */}
          </div>
        </Container>
      </section>

      {/* Our services */}
      <section className="py-16">
        <Container>
          <SectionHeading eyebrow="Our Services" title="Thoughtful Services for a Smoother Journey" />
          <div className="mt-10 grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
            {[
              { icon: BedIcon, label: "Hotel" },
              { icon: CarIcon, label: "Private Transfer" },
              { icon: DocumentIcon, label: "Visa" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-3 text-center">
                <span className="flex size-14 items-center justify-center rounded-full bg-warm-ivory text-deep-gold">
                  <Icon />
                </span>
                <p className="text-sm font-medium text-masaar-black">{label}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Featured Umrah packages */}
      <section className="bg-warm-ivory py-16">
        <Container>
          <SectionHeading eyebrow="Featured Umrah Packages" title="Choose a Package That Suits Your Journey" />
          <div className="mt-10">
            {umrahPackages.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {umrahPackages.map((pkg) => (
                  <PackageCard key={pkg.id} pkg={pkg} />
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

      {/* Quick links */}
      <section className="py-16">
        <Container className="grid gap-6 sm:grid-cols-3">
          {[
            { href: "/hotels", label: "Hotels in Makkah & Madinah" },
            { href: "/transfers", label: "Private Transfers" },
            { href: "/visa", label: "Visa Assistance" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg border border-black/10 bg-white p-6 transition-colors hover:border-pure-gold"
            >
              <h3 className="font-semibold text-masaar-black">{item.label}</h3>
              <span className="mt-2 inline-block text-sm text-deep-gold">Explore →</span>
            </Link>
          ))}
        </Container>
      </section>

      {/* Testimonials — hidden entirely until real, published reviews exist
          (brief Part 4: "no fake testimonials, ever — leave the section
          empty or hidden"). */}
      {testimonials.length > 0 && (
        <section className="bg-warm-ivory py-16">
          <Container>
            <SectionHeading eyebrow="What Our Guests Say" title="Journeys We've Been Trusted With" />
            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              {testimonials.map((t) => (
                <TestimonialCard key={t.id} testimonial={t} />
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* CTA banner */}
      <section className="bg-masaar-black py-12 text-white">
        <Container className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div>
            <h2 className="text-xl font-semibold">Speak to a Masaar Advisor</h2>
            <p className="mt-1 text-sm text-white/70">
              Have questions or ready to plan your journey? We&apos;re here to help.
            </p>
          </div>
          <WhatsAppButton message={WHATSAPP_TEMPLATES.general}>WhatsApp Us Today</WhatsAppButton>
        </Container>
      </section>
    </>
  );
}
