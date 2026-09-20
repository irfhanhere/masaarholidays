import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { Container } from "@/components/site/Container";
import { ExternalImage } from "@/components/site/ExternalImage";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { getPublishedPrivateTrips } from "@/lib/data/public";
import { buildStaticPageMetadata } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return buildStaticPageMetadata({
    path: "/private-trips",
    fallbackTitle: "Private Trips in Makkah & Madinah | Masaar Holidays",
    fallbackDescription:
      "Explore meaningful, private sightseeing journeys around Makkah and Madinah with your own vehicle, driver and pace.",
  });
}

const FEATURES = [
  {
    label: "Your Group Only",
    note: "A private and comfortable experience",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M17 20h5v-1a4 4 0 00-3-3.87M9 20H4v-1a4 4 0 013-3.87m5-3.13a4 4 0 100-8 4 4 0 000 8zm6 1a4 4 0 100-8 4 4 0 000 8zm-12 0a4 4 0 100-8 4 4 0 000 8z" />
    ),
  },
  {
    label: "Comfortable Transport",
    note: "Well-maintained vehicles for your journey",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M8 7h8m-8 4h8m-9 8h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
    ),
  },
  {
    label: "Meaningful Places",
    note: "Carefully planned routes around Makkah and Madinah",
    icon: (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </>
    ),
  },
  {
    label: "Flexible & Customisable",
    note: "A pace and plan that works for you",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
  },
];

export default async function PrivateTripsLandingPage() {
  const trips = await getPublishedPrivateTrips();

  const makkahTrip = trips.find((t) => t.destination === "Makkah") ?? {
    name: "Private Makkah Sightseeing",
    slug: "makkah-private-sightseeing",
    destination: "Makkah" as const,
    duration: "2 – 2.5 Hours",
    short_description: "Explore selected places around Makkah with private transportation.",
    featured_image_url: "/trips/PRIVATE-TRIP-MAKKAH-CARD.png",
  };
  const madinahTrip = trips.find((t) => t.destination === "Madinah") ?? {
    name: "Private Madinah Sightseeing",
    slug: "madinah-private-sightseeing",
    destination: "Madinah" as const,
    duration: "2 – 2.5 Hours",
    short_description: "Visit selected places around Madinah at a comfortable pace.",
    featured_image_url: "/trips/PRIVATE-TRIP-MADINAH-CARD.png",
  };
  const displayTrips = [makkahTrip, madinahTrip];

  return (
    <>
      <Breadcrumbs items={[{ label: "Private Trips" }]} />

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <div className="relative w-full overflow-hidden border-b border-black/10 bg-[#FAF7F2]">
        <div className="pointer-events-none absolute bottom-0 right-0 top-0 w-full lg:w-7/12">
          <div className="relative h-full w-full">
            <Image
              src="/trips/PRIVATE-TRIP-TRANSPORT.png"
              alt="Private transport around Makkah and Madinah"
              fill
              priority
              className="object-cover object-right"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#FAF7F2] via-[#FAF7F2]/80 to-transparent lg:via-[#FAF7F2]/50" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#FAF7F2] via-transparent to-transparent lg:hidden" />
          </div>
        </div>

        <Container className="relative z-10 py-14 lg:py-20">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#A87F12]">
              <span>—</span>
              <span>Private Trips</span>
            </div>
            <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-masaar-black sm:text-5xl sm:leading-[1.15]">
              Meaningful Places.
              <br />
              <span className="text-deep-gold">Private Journeys.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-masaar-black/75 sm:text-lg">
              Explore selected places around Makkah and Madinah with private transportation and a pace that works
              for you.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="#journeys"
                className="inline-flex items-center gap-2.5 rounded-xl bg-[#A87F12] px-7 py-4 text-sm font-bold text-white shadow-md transition-all hover:bg-[#936e0f] hover:shadow-lg"
              >
                Explore Private Trips
              </a>
            </div>
          </div>
        </Container>
      </div>

      {/* ── 4-Item Trust Strip ─────────────────────────────────────── */}
      <section className="border-b border-black/10 bg-white py-10">
        <Container>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.label} className="flex items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-warm-ivory text-deep-gold shadow-2xs">
                  <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {f.icon}
                  </svg>
                </span>
                <div>
                  <h3 className="text-sm font-bold text-masaar-black">{f.label}</h3>
                  <p className="mt-0.5 text-xs text-masaar-black/60">{f.note}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Choose Your Private Journey ────────────────────────────── */}
      <section id="journeys" className="scroll-mt-24 py-20">
        <Container>
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#A87F12]">
                <span>—</span>
                <span>Explore Our Private Trips</span>
              </div>
              <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold text-masaar-black sm:text-4xl">
                Choose Your Private Journey
              </h2>
            </div>
            <p className="max-w-md text-sm text-masaar-black/70">
              Two extraordinary cities. Unique places to explore. Thoughtfully planned for a comfortable and
              meaningful experience.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {displayTrips.map((trip) => (
              <Link
                key={trip.slug}
                href={`/private-trips/${trip.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-black/10 bg-white transition-all hover:border-deep-gold hover:shadow-md"
              >
                <div className="relative h-56 w-full overflow-hidden bg-warm-ivory">
                  <ExternalImage
                    src={trip.featured_image_url || "/trips/PRIVATE-TRIP-MAKKAH-CARD.png"}
                    alt={trip.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute left-3 top-3 rounded-md bg-masaar-black/85 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-xs">
                    {trip.destination}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold text-masaar-black group-hover:text-deep-gold">
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

                  <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-4">
                    <div className="flex items-center gap-4 text-xs text-masaar-black/60">
                      <span className="flex items-center gap-1.5">
                        <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M8 7h8m-8 4h8m-9 8h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Private vehicle
                      </span>
                      <span className="flex items-center gap-1.5">
                        <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M17 20h5v-1a4 4 0 00-3-3.87M9 20H4v-1a4 4 0 013-3.87m5-3.13a4 4 0 100-8 4 4 0 000 8z" />
                        </svg>
                        Your group only
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-[#A87F12] px-4 py-2 text-xs font-bold text-white transition-colors group-hover:bg-[#936e0f]">
                      View Trip →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Discover Places That Inspire ───────────────────────────── */}
      <section className="border-y border-black/10 bg-warm-ivory/60 py-10">
        <Container className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white text-deep-gold shadow-2xs">
              <svg className="size-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M20 7h-3.586l-1.707-1.707A1 1 0 0014 5h-4a1 1 0 00-.707.293L7.586 7H4a1 1 0 00-1 1v10a2 2 0 002 2h14a2 2 0 002-2V8a1 1 0 00-1-1z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M12 17a4 4 0 100-8 4 4 0 000 8z" />
              </svg>
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#A87F12]">More Than a Journey</p>
              <h3 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold text-masaar-black">
                Discover Places That Inspire
              </h3>
            </div>
          </div>
          <p className="max-w-md text-sm text-masaar-black/70">
            From historic sites to natural landscapes, our private trips give you the time and comfort to
            experience the beauty and stories of the Holy Cities.
          </p>
        </Container>
      </section>

      {/* ── We're Here to Help CTA ─────────────────────────────────── */}
      <section className="relative overflow-hidden bg-masaar-black py-16 text-white">
        <div className="absolute inset-0 opacity-20">
          <Image src="/trips/PRIVATE-TRIP-TRANSPORT.png" alt="" fill className="object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-masaar-black via-masaar-black/90 to-masaar-black/80" />
        <Container className="relative flex flex-col items-center justify-between gap-6 text-center sm:flex-row sm:text-left">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-light-gold">Have Questions?</p>
            <h3 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold sm:text-3xl">
              We&apos;re Here to Help
            </h3>
            <p className="mt-2 max-w-md text-sm text-white/70">
              Get in touch with our team on WhatsApp. We&apos;ll be happy to share more details and help you plan
              your private trip.
            </p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <WhatsAppButton templateKey="general">Enquire on WhatsApp</WhatsAppButton>
            <p className="text-xs text-white/50">No obligation. Just a conversation.</p>
          </div>
        </Container>
      </section>
    </>
  );
}
