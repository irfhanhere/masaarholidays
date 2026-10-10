import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { Container } from "@/components/site/Container";
import { FaqSection } from "@/components/site/FaqSection";
import { CrossLinkServices } from "@/components/site/CrossLinkServices";
import { TransferEnquiryFlow } from "@/components/site/TransferEnquiryFlow";
import { Price } from "@/components/site/Price";
import {
  getPublicTransferBySlug,
  getPublicTransfers,
  TRANSFER_CATEGORIES,
} from "@/lib/data/transfers";
import { buildPageMetadata } from "@/lib/i18n";
import { getSiteOrigin } from "@/lib/site-url";
import { getCachedWhatsAppConfig } from "@/lib/data/public";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const transfer = await getPublicTransferBySlug(slug);

  if (!transfer || !transfer.is_active) {
    return {
      title: "Transfer Route Not Found | Masaar Holidays",
      robots: { index: false, follow: false },
    };
  }

  const title =
    (transfer as any).seo_title || `${transfer.route_name} Transfer | Masaar Holidays`;
  const description =
    (transfer as any).meta_description ||
    transfer.description ||
    `Private transfer for ${transfer.route_name}. Modern air-conditioned fleet with experienced drivers and luggage assistance. Enquire on WhatsApp with Masaar Holidays.`;

  return buildPageMetadata({
    path: `/transfers/${transfer.slug}`,
    title,
    description,
    ogImageUrl: transfer.image_url,
    noindex: !transfer.is_active,
  });
}

export default async function TransferDetailPage({ params }: Props) {
  const { slug } = await params;
  const [transfer, whatsappConfig] = await Promise.all([
    getPublicTransferBySlug(slug),
    getCachedWhatsAppConfig(),
  ]);

  if (!transfer || !transfer.is_active) {
    notFound();
  }

  const origin = getSiteOrigin();
  const catMeta =
    TRANSFER_CATEGORIES[transfer.transfer_type] || TRANSFER_CATEGORIES.other;

  // Structured Data (Breadcrumbs & Service)
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
          {
            "@type": "ListItem",
            position: 3,
            name: transfer.route_name,
            item: `${origin}/transfers/${transfer.slug}`,
          },
        ],
      },
      {
        "@type": "Service",
        name: transfer.route_name,
        serviceType: "Private Transfer",
        provider: {
          "@type": "TravelAgency",
          name: "Masaar Holidays",
          url: origin,
        },
        description: transfer.description || transfer.longDescriptionText,
        areaServed: ["Makkah", "Madinah", "Jeddah", "Taif"],
      },
    ],
  };

  // Get other routes for bottom recommendation
  const allRoutes = await getPublicTransfers();
  const relatedRoutes = allRoutes
    .filter((r) => r.slug !== transfer.slug && r.transfer_type === transfer.transfer_type)
    .slice(0, 3);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Breadcrumbs
        items={[
          { label: "Transfers", href: "/transfers" },
          { label: transfer.route_name },
        ]}
      />

      {/* Hero Header */}
      <section className="border-b border-black/10 bg-warm-ivory/40 py-10 sm:py-14">
        <Container>
          <div className="grid items-center gap-8 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-deep-gold/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-deep-gold">
                {catMeta.badge}
              </span>

              <h1 className="mt-3 text-2xl font-bold tracking-tight text-masaar-black sm:text-4xl">
                {transfer.route_name}
              </h1>

              <p className="mt-4 text-sm leading-relaxed text-masaar-black/70 sm:text-base">
                {transfer.longDescriptionText || transfer.description}
              </p>

              {/* Service Highlights Strip */}
              <div className="mt-6 flex flex-wrap gap-3">
                <div className="flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-medium text-masaar-black shadow-2xs">
                  <span className="text-deep-gold">✓</span>
                  <span>Meet &amp; Greet</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-medium text-masaar-black shadow-2xs">
                  <span className="text-deep-gold">✓</span>
                  <span>Luggage Assistance</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-medium text-masaar-black shadow-2xs">
                  <span className="text-deep-gold">✓</span>
                  <span>Private A/C Vehicle</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-medium text-masaar-black shadow-2xs">
                  <span className="text-deep-gold">✓</span>
                  <span>Professional Chauffeur</span>
                </div>
              </div>
            </div>

            {/* Hero Image */}
            <div className="lg:col-span-5">
              <div className="relative aspect-16/10 w-full overflow-hidden rounded-2xl border border-black/10 bg-warm-ivory shadow-sm">
                <Image
                  src={transfer.image_url || "/brand/banners/default.webp"}
                  alt={transfer.route_name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Main Interactive Booking / Enquiry Flow Section */}
      <section className="py-12 sm:py-16">
        <Container>
          <TransferEnquiryFlow
            route={transfer}
            whatsappPhone={whatsappConfig?.phoneNumber}
          />
        </Container>
      </section>

      {/* Route Information & Inclusions Section */}
      <section className="border-t border-black/10 bg-warm-ivory/25 py-14">
        <Container>
          <div className="mx-auto max-w-4xl">
            <h2 className="text-xl font-bold text-masaar-black sm:text-2xl">
              Transfer Information &amp; Route Guidance
            </h2>

            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <div className="rounded-xl border border-black/10 bg-white p-6 shadow-xs">
                <div className="flex items-center gap-2 text-deep-gold">
                  <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <h3 className="font-bold text-masaar-black text-sm">Pickup &amp; Drop-off</h3>
                </div>
                <div className="mt-4 space-y-3 text-xs">
                  <div>
                    <span className="font-semibold text-masaar-black/50 uppercase text-[10px]">
                      Pickup Location:
                    </span>
                    <p className="mt-0.5 font-medium text-masaar-black">
                      {transfer.pickupLocation}
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold text-masaar-black/50 uppercase text-[10px]">
                      Drop-off Destination:
                    </span>
                    <p className="mt-0.5 font-medium text-masaar-black">
                      {transfer.dropoffLocation}
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold text-masaar-black/50 uppercase text-[10px]">
                      Estimated Travel Time:
                    </span>
                    <p className="mt-0.5 font-medium text-masaar-black">
                      {transfer.durationText} (traffic dependent)
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-black/10 bg-white p-6 shadow-xs">
                <div className="flex items-center gap-2 text-deep-gold">
                  <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="font-bold text-masaar-black text-sm">Service Inclusions</h3>
                </div>
                <ul className="mt-4 space-y-2 text-xs text-masaar-black/75">
                  <li className="flex items-center gap-2">
                    <span className="text-deep-gold">✓</span>
                    <span>Private, dedicated vehicle reserved exclusively for your party</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-deep-gold">✓</span>
                    <span>Meet &amp; greet assistance at the pickup point with name sign</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-deep-gold">✓</span>
                    <span>Full luggage handling and loading assistance</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-deep-gold">✓</span>
                    <span>All expressway tolls and standard waiting time included</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-deep-gold">✓</span>
                    <span>Direct route to your hotel lobby without shared group stops</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Special Instructions & Important Notes */}
            {transfer.routeNotesText && (
              <div className="mt-6 rounded-xl border border-black/10 bg-white p-6 shadow-xs">
                <h3 className="text-sm font-bold text-masaar-black">Important Route Notes</h3>
                <p className="mt-2 text-xs leading-relaxed text-masaar-black/70">
                  {transfer.routeNotesText}
                </p>
              </div>
            )}
          </div>
        </Container>
      </section>

      {/* Related Transfer Routes */}
      {relatedRoutes.length > 0 && (
        <section className="py-14 border-t border-black/10">
          <Container>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-deep-gold">
                  Related Transfers
                </span>
                <h2 className="mt-1 text-xl font-bold text-masaar-black">
                  More {catMeta.badge}
                </h2>
              </div>
              <Link
                href="/transfers"
                className="text-xs font-semibold text-deep-gold underline hover:text-masaar-black"
              >
                View All Routes →
              </Link>
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedRoutes.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/transfers/${rel.slug}`}
                  className="group flex flex-col overflow-hidden rounded-xl border border-black/10 bg-white p-4 shadow-2xs transition-all hover:border-deep-gold/40 hover:shadow-md"
                >
                  <div className="relative aspect-16/10 w-full overflow-hidden rounded-lg bg-warm-ivory">
                    <Image
                      src={rel.image_url || "/brand/banners/default.webp"}
                      alt={`Private transfer route: ${rel.route_name}`}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-masaar-black group-hover:text-deep-gold">
                    {rel.route_name}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs text-masaar-black/60">
                    {rel.description}
                  </p>
                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-black/5 text-xs">
                    <span className="font-semibold text-deep-gold">
                      {rel.startingPriceAed ? <>From <Price amountAed={rel.startingPriceAed} /></> : "Enquiry Only"}
                    </span>
                    <span className="text-masaar-black/50 group-hover:text-masaar-black">
                      View Details →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* Explore More Services */}
      <CrossLinkServices exclude="transfers" />

      {/* FAQs */}
      <FaqSection category="transfers" />
    </>
  );
}
