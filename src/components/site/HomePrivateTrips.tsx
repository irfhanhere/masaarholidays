import Image from "next/image";
import Link from "next/link";
import { Container } from "./Container";
import { SectionHeading } from "./SectionHeading";
import type { PrivateTripRow } from "@/lib/types/database";

const CORE_SERVICES = [
  {
    href: "/hotels",
    label: "Hotels in Makkah & Madinah",
    note: "A handpicked selection of hotels to suit different needs and preferences.",
    image: "/brand/banners/hotel.png",
  },
  {
    href: "/transfers",
    label: "Private Transfers",
    note: "Reliable and comfortable transport across all major routes.",
    image: "/brand/banners/destination.png",
  },
  {
    href: "/visa",
    label: "Visa Assistance",
    note: "Simple, reliable visa processing with dedicated support.",
    image: "/brand/banners/default.png",
  },
];

export function HomePrivateTrips({ trips = [] }: { trips?: PrivateTripRow[] }) {
  // Find Makkah and Madinah trips if available from DB, or fallback to defaults
  const makkahTrip = trips.find((t) => t.destination === "Makkah" && t.status === "published") || {
    name: "Private Makkah Sightseeing",
    slug: "makkah-private-sightseeing",
    destination: "Makkah",
    duration: "2 – 2.5 Hours",
    short_description: "Explore selected places around Makkah with private transportation.",
    featured_image_url: "/trips/PRIVATE-TRIP-MAKKAH-CARD.png",
  };

  const madinahTrip = trips.find((t) => t.destination === "Madinah" && t.status === "published") || {
    name: "Private Madinah Sightseeing",
    slug: "madinah-private-sightseeing",
    destination: "Madinah",
    duration: "2 – 2.5 Hours",
    short_description: "Visit selected places around Madinah at a comfortable pace.",
    featured_image_url: "/trips/PRIVATE-TRIP-MADINAH-CARD.png",
  };

  const displayTrips = [makkahTrip, madinahTrip];

  return (
    <section id="private-trips" className="py-20 scroll-mt-10">
      <Container>
        {/* Unified Section Heading & Intro */}
        <div className="text-center">
          <SectionHeading
            eyebrow="Services & Experiences"
            title="Hotels, Transfers, Visa & Private Sightseeing"
          />
          <p className="mx-auto mt-3 max-w-2xl text-sm text-masaar-black/70 sm:text-base">
            Curated accommodation, reliable transfers, visa processing and private sightseeing — arranged with personal care for every part of your journey.
          </p>
        </div>

        {/* 5-Card Unified Layout: 3 core services on top, 2 private sightseeing experiences on bottom */}
        <div className="mt-12 space-y-6">
          {/* Row 1: 3 Core Travel Services */}
          <div className="grid gap-6 sm:grid-cols-3">
            {CORE_SERVICES.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex flex-col overflow-hidden rounded-lg border border-black/10 bg-white transition-all hover:border-pure-gold hover:shadow-md"
              >
                <div className="relative h-48 w-full overflow-hidden bg-warm-ivory">
                  <Image
                    src={item.image}
                    alt={item.label}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="text-lg font-semibold text-masaar-black transition-colors group-hover:text-deep-gold">
                    {item.label}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-masaar-black/60">
                    {item.note}
                  </p>
                  <span className="mt-4 inline-flex items-center text-sm font-semibold text-deep-gold group-hover:underline">
                    Explore →
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Row 2: 2 Private Sightseeing Experiences */}
          <div className="grid gap-6 md:grid-cols-2">
            {displayTrips.map((trip) => {
              const detailHref = `/private-trips/${trip.slug}`;
              return (
                <Link
                  key={trip.slug}
                  href={detailHref}
                  className="group flex flex-col overflow-hidden rounded-lg border border-black/10 bg-white transition-all hover:border-pure-gold hover:shadow-md"
                >
                  <div className="relative h-48 w-full overflow-hidden bg-warm-ivory sm:h-56">
                    <Image
                      src={trip.featured_image_url || "/trips/PRIVATE-TRIP-MAKKAH-CARD.png"}
                      alt={trip.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-3 left-3 rounded-md bg-masaar-black/80 px-2.5 py-1 text-xs font-semibold tracking-wider text-white uppercase backdrop-blur-xs">
                      {trip.destination}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="text-lg font-semibold text-masaar-black transition-colors group-hover:text-deep-gold">
                      {trip.name}
                    </h3>

                    <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-deep-gold">
                      <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{trip.duration}</span>
                    </div>

                    <p className="mt-2 flex-1 text-sm leading-relaxed text-masaar-black/60">
                      {trip.short_description}
                    </p>

                    <span className="mt-4 inline-flex items-center text-sm font-semibold text-deep-gold group-hover:underline">
                      Explore →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* 3 Callout Features Strip */}
        <div className="mt-16 grid gap-6 border-t border-black/10 pt-10 sm:grid-cols-3">
          <div className="flex items-start gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-warm-ivory text-deep-gold shadow-2xs">
              <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-masaar-black">Private &amp; Comfortable</h4>
              <p className="mt-0.5 text-xs text-masaar-black/60">Travel at your own pace</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-warm-ivory text-deep-gold shadow-2xs">
              <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-masaar-black">Customizable</h4>
              <p className="mt-0.5 text-xs text-masaar-black/60">Tailor the trip to your interests</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-warm-ivory text-deep-gold shadow-2xs">
              <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-masaar-black">Meaningful Places</h4>
              <p className="mt-0.5 text-xs text-masaar-black/60">Discover heritage and history</p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
