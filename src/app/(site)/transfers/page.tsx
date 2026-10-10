import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { Container } from "@/components/site/Container";
import { Hero } from "@/components/site/Hero";
import { SectionHeading } from "@/components/site/SectionHeading";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { getPublicTransfers } from "@/lib/data/transfers";
import { buildStaticPageMetadata } from "@/lib/i18n";
import { CrossLinkServices } from "@/components/site/CrossLinkServices";
import { FaqSection } from "@/components/site/FaqSection";
import { TransfersCatalogueClient } from "@/components/site/TransfersCatalogueClient";
import { getSiteOrigin } from "@/lib/site-url";

export async function generateMetadata(): Promise<Metadata> {
  return buildStaticPageMetadata({
    path: "/transfers",
    fallbackTitle: "Private Umrah Transfers in Saudi Arabia | Masaar Holidays",
    fallbackDescription:
      "Private transfers for Umrah between Jeddah, Makkah, Madinah, and Taif. Airport meet & greet, Haramain train connections, and modern fleet with verified drivers.",
  });
}

export default async function TransfersPage() {
  const routes = await getPublicTransfers();
  const origin = getSiteOrigin();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: origin,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Transfers",
            item: `${origin}/transfers`,
          },
        ],
      },
      {
        "@type": "Service",
        name: "Private Umrah Transfers",
        serviceType: "Ground Transportation",
        provider: {
          "@type": "TravelAgency",
          name: "Masaar Holidays",
          url: origin,
        },
        description:
          "Private transfers across Saudi Arabia including King Abdulaziz Airport (JED), Prince Mohammad Airport (MED), Makkah, Madinah, Haramain High Speed Train, and Taif.",
        areaServed: ["Jeddah", "Makkah", "Madinah", "Taif"],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Breadcrumbs items={[{ label: "Transfers" }]} />

      {/* Hero Section */}
      <Hero
        eyebrow="Private Transfers"
        h1="Arrive With Ease,"
        h1Gold="Leave With Peace"
        image="/brand/banners/Airport Banner.webp"
      >
        <p className="mt-4 max-w-xl text-sm text-masaar-black/70 sm:text-base">
          Private transfers for your Umrah journey — airports, the Haramain train, and intercity
          routes, arranged with personal care.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <a
            href="#transfer-routes"
            className="inline-flex items-center gap-2 rounded-lg bg-masaar-black px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-deep-gold"
          >
            <span>Explore Transfer Routes</span>
            <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </a>

          <WhatsAppButton templateKey="general">Enquire on WhatsApp</WhatsAppButton>
        </div>

        {/* 3 Trust Badges */}
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-lg border border-black/10 bg-white/70 p-3 backdrop-blur-xs">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-warm-ivory text-deep-gold">
              <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </span>
            <span className="text-xs font-semibold text-masaar-black">
              Comfortable & Reliable Vehicles
            </span>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-black/10 bg-white/70 p-3 backdrop-blur-xs">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-warm-ivory text-deep-gold">
              <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </span>
            <span className="text-xs font-semibold text-masaar-black">
              Professional Licensed Drivers
            </span>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-black/10 bg-white/70 p-3 backdrop-blur-xs">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-warm-ivory text-deep-gold">
              <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <span className="text-xs font-semibold text-masaar-black">
              24/7 Concierge Support
            </span>
          </div>
        </div>
      </Hero>

      {/* Main Routes Catalogue */}
      <section className="py-16">
        <Container>
          <div className="text-center">
            <SectionHeading
              eyebrow="Transfer Routes"
              title="Find Your Transfer Route"
            />
            <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-masaar-black/65">
              Choose from our most requested transfer routes or filter by category. Every journey is
              private, punctual, and operated with dedicated meet &amp; greet assistance.
            </p>
          </div>

          <div className="mt-10">
            <TransfersCatalogueClient routes={routes} />
          </div>
        </Container>
      </section>

      {/* Why Choose Masaar Section ("More Than Just a Transfer") */}
      <section className="border-t border-black/10 bg-warm-ivory/30 py-16">
        <Container>
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-deep-gold">
              Why Choose Masaar
            </span>
            <h2 className="mt-2 text-2xl font-bold text-masaar-black sm:text-3xl">
              More Than Just a Transfer
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-masaar-black/60">
              We take care of every detail, so you can focus on what truly matters during your pilgrimage.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            <div className="flex flex-col items-center rounded-xl border border-black/10 bg-white p-6 text-center shadow-xs">
              <span className="flex size-12 items-center justify-center rounded-full bg-warm-ivory text-deep-gold">
                <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </span>
              <h3 className="mt-4 text-sm font-bold text-masaar-black">Modern Fleet</h3>
              <p className="mt-2 text-xs text-masaar-black/60">
                Well-maintained, clean, and comfortable air-conditioned vehicles for every group size.
              </p>
            </div>

            <div className="flex flex-col items-center rounded-xl border border-black/10 bg-white p-6 text-center shadow-xs">
              <span className="flex size-12 items-center justify-center rounded-full bg-warm-ivory text-deep-gold">
                <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </span>
              <h3 className="mt-4 text-sm font-bold text-masaar-black">Verified Drivers</h3>
              <p className="mt-2 text-xs text-masaar-black/60">
                Professional, experienced, and courteous drivers familiar with holy city routes and pilgrim needs.
              </p>
            </div>

            <div className="flex flex-col items-center rounded-xl border border-black/10 bg-white p-6 text-center shadow-xs">
              <span className="flex size-12 items-center justify-center rounded-full bg-warm-ivory text-deep-gold">
                <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <h3 className="mt-4 text-sm font-bold text-masaar-black">On-Time Service</h3>
              <p className="mt-2 text-xs text-masaar-black/60">
                Punctual pickups and flight-monitored arrivals you can depend on, day or night.
              </p>
            </div>

            <div className="flex flex-col items-center rounded-xl border border-black/10 bg-white p-6 text-center shadow-xs">
              <span className="flex size-12 items-center justify-center rounded-full bg-warm-ivory text-deep-gold">
                <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </span>
              <h3 className="mt-4 text-sm font-bold text-masaar-black">24/7 Support</h3>
              <p className="mt-2 text-xs text-masaar-black/60">
                Our support team is always accessible via WhatsApp for schedule updates and assistance.
              </p>
            </div>

            <div className="flex flex-col items-center rounded-xl border border-black/10 bg-white p-6 text-center shadow-xs">
              <span className="flex size-12 items-center justify-center rounded-full bg-warm-ivory text-deep-gold">
                <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </span>
              <h3 className="mt-4 text-sm font-bold text-masaar-black">Private &amp; Flexible</h3>
              <p className="mt-2 text-xs text-masaar-black/60">
                Tailored exclusively for your party with flexible departure times and luggage care.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* How It Works Section */}
      <section className="py-16">
        <Container>
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-deep-gold">
              How It Works
            </span>
            <h2 className="mt-2 text-2xl font-bold text-masaar-black sm:text-3xl">
              Get Your Transfer in 3 Simple Steps
            </h2>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            <div className="relative flex flex-col items-center rounded-xl border border-black/10 bg-white p-8 text-center shadow-xs">
              <div className="flex size-12 items-center justify-center rounded-full bg-masaar-black text-sm font-bold text-white">
                1
              </div>
              <h3 className="mt-4 text-base font-bold text-masaar-black">Choose Your Route</h3>
              <p className="mt-2 text-xs leading-relaxed text-masaar-black/65">
                Browse our curated transfer routes and select the vehicle type that best suits your family size and luggage.
              </p>
            </div>

            <div className="relative flex flex-col items-center rounded-xl border border-black/10 bg-white p-8 text-center shadow-xs">
              <div className="flex size-12 items-center justify-center rounded-full bg-masaar-black text-sm font-bold text-white">
                2
              </div>
              <h3 className="mt-4 text-base font-bold text-masaar-black">Send an Enquiry</h3>
              <p className="mt-2 text-xs leading-relaxed text-masaar-black/65">
                Enter your journey date, pickup time, and passenger count. Review your summary and click to enquire on WhatsApp.
              </p>
            </div>

            <div className="relative flex flex-col items-center rounded-xl border border-black/10 bg-white p-8 text-center shadow-xs">
              <div className="flex size-12 items-center justify-center rounded-full bg-masaar-black text-sm font-bold text-white">
                3
              </div>
              <h3 className="mt-4 text-base font-bold text-masaar-black">Confirm &amp; Travel</h3>
              <p className="mt-2 text-xs leading-relaxed text-masaar-black/65">
                Our team confirms driver availability, coordinates arrival details, and guarantees a peaceful journey.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Explore More Services */}
      <CrossLinkServices exclude="transfers" />

      {/* FAQs */}
      <FaqSection category="transfers" />

      {/* Final WhatsApp CTA Section */}
      <section className="bg-masaar-black py-16 text-white">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-deep-gold">
              Personalized Assistance
            </span>
            <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
              Need a Custom Route or Special Group Transfer?
            </h2>
            <p className="mt-4 text-sm text-white/70">
              Travelling with a large delegation, have unique timing requirements, or need multi-day
              transport across Saudi Arabia? Our concierge team is ready to assist.
            </p>
            <div className="mt-8 flex justify-center">
              <WhatsAppButton templateKey="general">
                Chat With Our Transfers Team
              </WhatsAppButton>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
