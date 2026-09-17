import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Container } from "@/components/site/Container";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { PrivateTripGallery } from "@/components/site/PrivateTripGallery";
import { getPrivateTripBySlug } from "@/lib/data/public";
import { buildPageMetadata } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPrivateTripBySlug(slug);

  if (!data || data.trip.status !== "published") {
    return buildPageMetadata({
      path: `/private-trips/${slug}`,
      title: "Private Trip | Masaar Holidays",
    });
  }

  const { trip } = data;
  const title = trip.meta_title || `${trip.name} | Masaar Holidays`;
  const description =
    trip.meta_description ||
    trip.short_description ||
    `Arranged private sightseeing experience in ${trip.destination} with Masaar Holidays.`;

  const ogImage = trip.featured_image_url || trip.hero_image_url || "/trips/PRIVATE-TRIP-MADINAH-CARD.png";

  return buildPageMetadata({
    path: `/private-trips/${slug}`,
    title,
    description,
    ogImageUrl: ogImage,
  });
}

export default async function PrivateTripDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getPrivateTripBySlug(slug);

  if (!data) {
    notFound();
  }

  const { trip, stops } = data;

  // Fallback stop gallery images
  const galleryImages = [
    ...(stops.filter((s) => s.image_url).map((s) => ({ src: s.image_url as string, alt: s.stop_name }))),
    { src: "/trips/STOP-MADINAH-MOUNT-UHUD.png", alt: "Mount Uhud" },
    { src: "/trips/STOP-MADINAH-SHUHADA-UHUD.png", alt: "Shuhada Uhud" },
    { src: "/trips/STOP-MADINAH-MOUNT-RUMAH.png", alt: "Mount Rumah" },
    { src: "/trips/DESTINATION IMAGE.png", alt: "Madinah Heritage" },
    { src: "/trips/HOTEL  BANNER.png", alt: "Private Tour" },
  ].filter((img, index, self) => index === self.findIndex((t) => t.src === img.src));

  const importantNotes = trip.important_note
    ? trip.important_note.split("\n").filter((p) => p.trim().length > 0)
    : [
        "Be ready in your hotel lobby 10 minutes before the trip starts.",
        "Private vehicle with an experienced driver.",
        "Timings are approximate and may vary based on traffic and conditions.",
        "Dress modestly and follow local guidelines.",
      ];

  const whatsIncluded = [
    "Private transportation",
    "Experienced driver",
    "Customizable stops (on request)",
    "Flexible timing within the day",
  ];

  const timeSlots = trip.time_slots && trip.time_slots.length > 0
    ? trip.time_slots
    : ["7:00 AM", "8:00 AM", "9:00 AM", "2:00 PM", "3:00 PM", "4:00 PM"];

  return (
    <div className="bg-warm-ivory">
      {/* 1. Full-Width Hero Section */}
      <section className="relative min-h-[520px] w-full bg-masaar-black text-white sm:min-h-[580px] lg:min-h-[640px]">
        {/* Hero Background Image */}
        <div className="absolute inset-0">
          <Image
            src={trip.hero_image_url || trip.featured_image_url || "/trips/PRIVATE-TRIP-MADINAH-HERO.jpg"}
            alt={trip.name}
            fill
            priority
            className="object-cover object-center opacity-70"
          />
          {/* Subtle luxurious gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-masaar-black via-masaar-black/50 to-masaar-black/30" />
        </div>

        <Container className="relative flex min-h-[520px] flex-col justify-end py-16 sm:min-h-[580px] sm:py-20 lg:min-h-[640px]">
          <div className="max-w-3xl">
            {/* Kicker / Eyebrow */}
            <p className="text-xs font-semibold tracking-widest text-[#E6C65C] uppercase">
              PRIVATE TRIP &middot; {trip.destination}
            </p>

            {/* H1 Heading */}
            <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
              {trip.name}
            </h1>

            {/* Short Description */}
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
              {trip.short_description}
            </p>

            {/* 3 Highlight Badges */}
            <div className="mt-8 flex flex-wrap items-center gap-6 sm:gap-8">
              {/* Duration */}
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-white/10 text-[#E6C65C] backdrop-blur-xs">
                  <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{trip.duration}</p>
                  <p className="text-xs text-white/60">Duration</p>
                </div>
              </div>

              {/* Group */}
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-white/10 text-[#E6C65C] backdrop-blur-xs">
                  <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">Private Trip</p>
                  <p className="text-xs text-white/60">Only your group</p>
                </div>
              </div>

              {/* Vehicle */}
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-white/10 text-[#E6C65C] backdrop-blur-xs">
                  <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M8 7h8m-8 4h8m-9 8h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">Comfortable</p>
                  <p className="text-xs text-white/60">Private vehicle</p>
                </div>
              </div>
            </div>

            {/* Enquire Button */}
            <div className="mt-8">
              <WhatsAppButton
                templateKey="privateTripEnquiry"
                params={{
                  tripName: trip.name,
                  destination: trip.destination,
                  duration: trip.duration,
                }}
                className="bg-[#A87F12] text-white hover:bg-[#C9A227] px-6 py-3.5"
              >
                Enquire on WhatsApp →
              </WhatsAppButton>
            </div>
          </div>
        </Container>
      </section>

      {/* 2. "Your Journey" Route Timeline Section */}
      <section className="py-20">
        <Container>
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-semibold tracking-widest text-[#A87F12] uppercase">
                EXPLORE {trip.destination}
              </p>
              <h2 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold text-masaar-black sm:text-4xl">
                Your Journey
              </h2>
              <div className="mt-2 h-0.5 w-12 bg-[#A87F12]" />
            </div>
            <p className="max-w-md text-sm text-masaar-black/70">
              A thoughtfully planned route covering the most significant places in and around {trip.destination}.
            </p>
          </div>

          {/* Timeline Route Display */}
          <div className="mt-14">
            {/* Desktop Horizontal Route View */}
            <div className="hidden lg:block overflow-x-auto pb-4">
              <div className="relative flex items-start justify-between gap-4 min-w-[900px] pt-4">
                {/* Connecting Dotted Line */}
                <div className="absolute top-[48px] left-[40px] right-[40px] border-t-2 border-dashed border-[#C9A227]/40 z-0" />

                {stops.map((stop, idx) => (
                  <div key={idx} className="relative z-10 flex flex-1 flex-col items-center text-center">
                    {/* Circle Image Thumbnail */}
                    <div className="relative mb-3 flex size-20 items-center justify-center rounded-full border-2 border-white bg-[#FAF5E8] p-1 shadow-md">
                      <div className="relative size-full overflow-hidden rounded-full">
                        {stop.image_url ? (
                          <Image src={stop.image_url} alt={stop.stop_name} fill className="object-cover" />
                        ) : (
                          <div className="flex size-full items-center justify-center bg-[#FAF5E8] text-deep-gold">
                            <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Number badge */}
                      <span className="absolute -bottom-2 flex size-6 items-center justify-center rounded-full bg-[#A87F12] font-mono text-[11px] font-bold text-white shadow-xs">
                        {String(stop.stop_number).padStart(2, "0")}
                      </span>
                    </div>

                    <h4 className="mt-2 text-sm font-bold text-masaar-black line-clamp-2 max-w-[130px]">
                      {stop.stop_name}
                    </h4>

                    <p className="mt-0.5 text-xs text-masaar-black/60 font-medium">
                      {stop.visit_type === "Pass By"
                        ? "Pass By"
                        : stop.visit_type === "Pickup"
                        ? "Pickup"
                        : stop.visit_type === "Drop Off"
                        ? "Drop Off"
                        : stop.visit_duration || "Visit"}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile / Tablet Vertical Route View */}
            <div className="lg:hidden relative space-y-6 pl-8 before:absolute before:top-4 before:bottom-4 before:left-3.5 before:w-0.5 before:border-l-2 before:border-dashed before:border-[#C9A227]/50">
              {stops.map((stop, idx) => (
                <div key={idx} className="relative flex items-start gap-4">
                  {/* Number Badge Dot */}
                  <span className="absolute -left-8 top-1 flex size-7 items-center justify-center rounded-full bg-[#A87F12] font-mono text-xs font-bold text-white shadow-xs">
                    {String(stop.stop_number).padStart(2, "0")}
                  </span>

                  <div className="flex flex-1 items-center gap-4 rounded-xl border border-black/10 bg-white p-4 shadow-xs">
                    {stop.image_url && (
                      <div className="relative size-14 shrink-0 overflow-hidden rounded-lg">
                        <Image src={stop.image_url} alt={stop.stop_name} fill className="object-cover" />
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-bold text-masaar-black">{stop.stop_name}</h4>
                      <p className="text-xs text-deep-gold font-medium mt-0.5">
                        {stop.visit_type === "Pass By"
                          ? "Pass By"
                          : stop.visit_type === "Pickup"
                          ? "Pickup"
                          : stop.visit_type === "Drop Off"
                          ? "Drop Off"
                          : stop.visit_duration || "Visit"}
                      </p>
                      {stop.short_description && (
                        <p className="text-xs text-masaar-black/60 mt-1">{stop.short_description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* 3. 3 Operational Cards Grid */}
      <section className="bg-white py-16 border-y border-black/10">
        <Container>
          <div className="grid gap-8 md:grid-cols-3">
            {/* Card 1: Available Time Slots */}
            <div className="flex flex-col rounded-2xl border border-black/10 bg-warm-ivory/40 p-6 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-white text-[#A87F12] shadow-xs">
                  <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                <div>
                  <h3 className="font-semibold text-masaar-black">Available Time Slots</h3>
                  <p className="text-xs text-masaar-black/60">Choose a convenient time for your trip.</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-2.5">
                {timeSlots.map((slot) => (
                  <div
                    key={slot}
                    className="flex items-center justify-center rounded-lg border border-black/10 bg-white py-2.5 text-xs font-semibold text-masaar-black shadow-2xs"
                  >
                    {slot}
                  </div>
                ))}
              </div>
            </div>

            {/* Card 2: Important Information */}
            <div className="flex flex-col rounded-2xl border border-black/10 bg-warm-ivory/40 p-6 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-white text-[#A87F12] shadow-xs">
                  <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                <div>
                  <h3 className="font-semibold text-masaar-black">Important Information</h3>
                  <p className="text-xs text-masaar-black/60">Please read before booking.</p>
                </div>
              </div>

              <ul className="mt-6 space-y-3 text-xs leading-relaxed text-masaar-black/80">
                {importantNotes.map((note, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-[#A87F12] text-[10px] text-white">
                      ✓
                    </span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Card 3: What's Included */}
            <div className="flex flex-col rounded-2xl border border-black/10 bg-warm-ivory/40 p-6 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-white text-[#A87F12] shadow-xs">
                  <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </span>
                <div>
                  <h3 className="font-semibold text-masaar-black">What&apos;s Included</h3>
                  <p className="text-xs text-masaar-black/60">A comfortable and worry-free experience.</p>
                </div>
              </div>

              <ul className="mt-6 space-y-3 text-xs leading-relaxed text-masaar-black/80">
                {whatsIncluded.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-[#A87F12] text-[10px] text-white">
                      ✓
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </section>

      {/* 4. Photo Gallery Section */}
      <section className="py-20">
        <Container>
          <PrivateTripGallery images={galleryImages} />
        </Container>
      </section>

      {/* 5. Closing CTA Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-warm-ivory to-[#EFEBE1] py-20 border-t border-black/10">
        <Container className="flex flex-col items-center justify-between gap-8 md:flex-row md:items-center">
          <div className="max-w-xl text-center md:text-left">
            <p className="text-xs font-semibold tracking-widest text-[#A87F12] uppercase">
              READY TO EXPLORE?
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold text-masaar-black sm:text-4xl">
              Interested in this private trip?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-masaar-black/70">
              Get in touch with us on WhatsApp. We&apos;ll be happy to assist you with details, customization and special requests.
            </p>
          </div>

          <div className="flex flex-col items-center gap-3">
            <WhatsAppButton
              templateKey="privateTripEnquiry"
              params={{
                tripName: trip.name,
                destination: trip.destination,
                duration: trip.duration,
              }}
              className="bg-[#A87F12] text-white hover:bg-[#C9A227] px-8 py-4 text-base font-semibold shadow-md"
            >
              Enquire on WhatsApp →
            </WhatsAppButton>

            <div className="flex items-center gap-1.5 text-xs text-masaar-black/60">
              <svg className="size-3.5 text-masaar-black/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>No obligation. Just a conversation.</span>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
