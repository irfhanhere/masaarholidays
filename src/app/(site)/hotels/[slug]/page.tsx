import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { Container } from "@/components/site/Container";
import { ExternalImage } from "@/components/site/ExternalImage";
import { HotelSchema } from "@/components/site/HotelSchema";
import { Price } from "@/components/site/Price";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import {
  BathroomIcon,
  BedIcon,
  DiningIcon,
  FamilyIcon,
  LocationIcon,
  SizeIcon,
  WarningTriangleIcon,
} from "@/components/site/icons";
import {
  formatDistance,
  formatLadiesGateWalkTime,
  formatMensGateWalkTime,
  formatWalkTime,
  isRenderableImageUrl,
  splitTerrainNote,
} from "@/lib/hotel-format";
import { getActiveHotels, getHotelBySlug, getHotelRooms } from "@/lib/data/public";
import { buildPageMetadata } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const hotel = await getHotelBySlug(slug);
  if (!hotel) notFound();

  // Consistent pattern: "{Hotel} Makkah | Masaar Holidays" or "{Hotel} Madinah | Masaar Holidays", max 60 chars
  let cleanName = hotel.name.trim();
  let baseTitle = `${cleanName} ${hotel.city} | Masaar Holidays`;
  if (baseTitle.length > 60) {
    cleanName = cleanName
      .replace(/Hotel & Residences?/gi, "Hotel")
      .replace(/Hotel & Suites?/gi, "Hotel")
      .replace(/Dar Al Tawhid/gi, "Dar Al Tawhid")
      .replace(/Makkah/gi, "")
      .replace(/Madinah/gi, "")
      .trim();
    baseTitle = `${cleanName} ${hotel.city} | Masaar Holidays`;
    if (baseTitle.length > 60) {
      baseTitle = baseTitle.slice(0, 57) + "...";
    }
  }

  // Description: 120-155 characters with CTA
  let desc = hotel.meta_description || hotel.description;
  if (!desc || desc.length < 100 || desc.length > 155) {
    const starStr = hotel.star_rating ? `${hotel.star_rating}-star ` : "";
    const distStr = hotel.walk_time_minutes ? `${hotel.walk_time_minutes}-min walk to Haram` : `close to the Haram`;
    desc = `Book ${cleanName} in ${hotel.city}. Premium ${starStr}accommodation, ${distStr}, family comfort, and full Umrah support with Masaar Holidays UAE.`;
    if (desc.length > 155) {
      desc = desc.slice(0, 152) + "...";
    }
  }

  return buildPageMetadata({
    path: `/hotels/${slug}`,
    title: baseTitle,
    description: desc,
    ogImageUrl: hotel.image_url,
  });
}

const FEATURES = [
  { icon: LocationIcon, title: "Near the Haram", subtitle: "Excellent location" },
  { icon: BedIcon, title: "Modern rooms", subtitle: "Thoughtful comfort" },
  { icon: DiningIcon, title: "Dining options", subtitle: "On-site restaurants" },
  { icon: FamilyIcon, title: "Ideal for families", subtitle: "Spacious accommodation" },
];

function googleMapsUrl(hotel: { name: string; city: string; google_maps_url: string | null }) {
  if (hotel.google_maps_url) return hotel.google_maps_url;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${hotel.name} ${hotel.city}`)}`;
}

export default async function HotelDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const hotel = await getHotelBySlug(slug);
  if (!hotel) notFound();

  const [rooms, allHotels] = await Promise.all([
    getHotelRooms(hotel.id),
    getActiveHotels(),
  ]);
  const relatedHotels = allHotels
    .filter((h) => h.city === hotel.city && h.id !== hotel.id)
    .slice(0, 3);
  const isMadinah = hotel.city === "Madinah";
  const mensWalk = formatMensGateWalkTime(hotel);
  const ladiesWalk = formatLadiesGateWalkTime(hotel);
  const walkTime = formatWalkTime(hotel);
  const distance = formatDistance(hotel);
  const terrainLines = splitTerrainNote(hotel.terrain_note);
  const galleryPhotos = hotel.gallery_image_urls.slice(0, 4);

  return (
    <>
      <Breadcrumbs items={[{ label: "Hotels", href: "/hotels" }, { label: hotel.name }]} />
      <HotelSchema
        name={hotel.name}
        city={hotel.city}
        slug={hotel.slug}
        description={hotel.description}
        starRating={hotel.star_rating}
        imageUrl={hotel.image_url}
        priceFromAed={hotel.price_from_aed}
        walkMinutes={hotel.walk_time_minutes}
        shuttleAvailable={hotel.shuttle_available}
      />
      <div className="relative h-72 w-full bg-masaar-black sm:h-96">
        {hotel.image_url ? (
          <ExternalImage src={hotel.image_url} alt={hotel.name} fill sizes="100vw" priority className="object-cover opacity-90" />
        ) : (
          <Image src="/brand/banners/hotel.webp" alt={`${hotel.name} in ${hotel.city}`} fill sizes="100vw" priority className="object-cover opacity-70" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-masaar-black/90 via-masaar-black/30 to-transparent" />
        <Container className="relative flex h-full flex-col justify-end pb-8 text-white">
          <p className="text-xs uppercase tracking-widest text-light-gold">
            <Link href="/hotels" className="hover:underline">
              Hotels
            </Link>{" "}
            / {hotel.city}
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-4xl">
            {hotel.name}
          </h1>
          {hotel.description && <p className="mt-2 max-w-xl text-sm text-white/80">{hotel.description}</p>}
          {hotel.star_rating != null && (
            <p className="mt-1 text-pure-gold">{"★".repeat(hotel.star_rating)}</p>
          )}
        </Container>
      </div>

      <section className="bg-warm-ivory py-8">
        <Container>
          <div className="grid grid-cols-2 divide-y divide-black/10 sm:grid-cols-4 sm:divide-y-0 sm:divide-x">
            {FEATURES.map(({ icon: Icon, title, subtitle }) => (
              <div key={title} className="flex flex-col items-center gap-1.5 px-4 py-4 text-center">
                <span className="flex size-11 items-center justify-center rounded-full bg-white text-deep-gold">
                  <Icon className="size-5" />
                </span>
                <p className="text-sm font-medium text-masaar-black">{title}</p>
                <p className="text-xs text-masaar-black/50">{subtitle}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-10">
        <Container className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-lg border border-black/10 bg-white p-6 lg:col-span-2">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-masaar-black">
              About {hotel.name}
            </h2>
            {hotel.description && <p className="mt-3 text-sm leading-relaxed text-masaar-black/70">{hotel.description}</p>}

            <div className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-4">
              <div>
                <p className="flex items-center gap-1.5 text-xs font-semibold text-masaar-black">
                  <LocationIcon className="size-4 text-deep-gold" /> {hotel.city}
                </p>
                <p className="mt-1 text-xs text-masaar-black/50">Saudi Arabia</p>
              </div>

              {isMadinah ? (
                <>
                  <div>
                    <p className="text-xs font-semibold text-masaar-black">Men&apos;s Gate</p>
                    <p className="mt-1 text-xs text-masaar-black/50">
                      {mensWalk ?? "Not yet confirmed"}
                      {hotel.nearest_mens_gate && ` — ${hotel.nearest_mens_gate}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-masaar-black">Ladies&apos; Gate</p>
                    <p className="mt-1 text-xs text-masaar-black/50">
                      {ladiesWalk ?? "Not yet confirmed"}
                      {hotel.nearest_ladies_gate && ` — ${hotel.nearest_ladies_gate}`}
                    </p>
                  </div>
                </>
              ) : (
                <div>
                  <p className="text-xs font-semibold text-masaar-black">Proximity to the Haram</p>
                  <p className="mt-1 text-xs text-masaar-black/50">
                    {[distance, walkTime].filter(Boolean).join(" · ") || "Not yet confirmed"}
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-masaar-black">Hotel Category</p>
                <p className="mt-1 text-xs text-masaar-black/50">{hotel.category ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-masaar-black">Star Rating</p>
                <p className="mt-1 text-xs text-masaar-black/50">
                  {hotel.star_rating ? "★".repeat(hotel.star_rating) : "To be confirmed"}
                </p>
              </div>
            </div>

            {(hotel.zone || hotel.route_type || hotel.elderly_family_suitability_note || hotel.shuttle_note || hotel.accessibility_note || hotel.shuttle_available || terrainLines.length > 0) && (
              <div className="mt-6 grid gap-3 border-t border-black/10 pt-5 sm:grid-cols-2">
                {hotel.zone && (
                  <p className="text-xs text-masaar-black/60">
                    <span className="font-semibold text-masaar-black">Zone: </span>
                    {hotel.zone}
                  </p>
                )}
                {hotel.route_type && (
                  <p className="text-xs text-masaar-black/60">
                    <span className="font-semibold text-masaar-black">Route: </span>
                    {hotel.route_type}
                  </p>
                )}
                {terrainLines.length > 0 && (
                  <p className="text-xs text-masaar-black/60 sm:col-span-2">
                    <span className="font-semibold text-masaar-black">Path &amp; Terrain: </span>
                    {terrainLines.length > 1 ? (
                      <ul className="mt-1 list-disc space-y-0.5 pl-4">
                        {terrainLines.map((line, i) => (
                          <li key={i}>{line}</li>
                        ))}
                      </ul>
                    ) : (
                      terrainLines[0]
                    )}
                  </p>
                )}
                {hotel.elderly_family_suitability_note && (
                  <p className="text-xs text-masaar-black/60">
                    <span className="font-semibold text-masaar-black">Elderly &amp; Family: </span>
                    {hotel.elderly_family_suitability_note}
                  </p>
                )}
                {(hotel.shuttle_available || hotel.shuttle_note) && (
                  <p className="text-xs text-masaar-black/60">
                    <span className="font-semibold text-masaar-black">Shuttle: </span>
                    {hotel.shuttle_note ?? (hotel.shuttle_available ? "Available" : "Not required")}
                  </p>
                )}
                {hotel.accessibility_note && (
                  <p className="text-xs text-masaar-black/60 sm:col-span-2">
                    <span className="font-semibold text-masaar-black">Accessibility: </span>
                    {hotel.accessibility_note}
                  </p>
                )}
              </div>
            )}

            {/* Structured narrative overview built from verified database fields (Targeting 350-500 words per hotel) */}
            <div className="mt-8 space-y-4 border-t border-black/10 pt-6 text-sm leading-relaxed text-masaar-black/80">
              <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-masaar-black">
                Location &amp; Proximity to the Holy Mosque
              </h3>
              <p>
                {hotel.name} is situated in {hotel.city}{hotel.zone ? ` within the ${hotel.zone} district` : ""}, providing pilgrims with reliable access to the sacred precincts. {isMadinah ? `Guests staying here enjoy convenient walking proximity to the Prophet's Mosque (Al-Masjid an-Nabawi). Walking time to the nearest men's entrance${hotel.nearest_mens_gate ? ` (${hotel.nearest_mens_gate})` : ""} is estimated at ${mensWalk || "a short walk"}, while access to the women's gates${hotel.nearest_ladies_gate ? ` (${hotel.nearest_ladies_gate})` : ""} is approximately ${ladiesWalk || "within easy walking distance"}.` : `For pilgrims performing Umrah or Hajj, the hotel is situated approximately ${distance || "a short distance"} (${walkTime || "convenient walking time"}) from the courtyard of the Grand Mosque (Al-Masjid al-Haram).`}
              </p>

              <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-masaar-black pt-2">
                Walking Route &amp; Transit Information
              </h3>
              <p>
                {terrainLines.length > 0 ? `The walking path between the hotel and the mosque features ${terrainLines.join(". ")}. ` : ""}
                {hotel.shuttle_available || hotel.shuttle_note
                  ? `Dedicated transport service: ${hotel.shuttle_note || "Complimentary shuttle transport is arranged for guests between the hotel and the Haram courtyard to ensure effortless transit around prayer times."}`
                  : `Due to its location, most pilgrims walk directly between the hotel and the Haram without requiring vehicular transfer.`}
                {hotel.accessibility_note ? ` ${hotel.accessibility_note}` : ""}
              </p>

              <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-masaar-black pt-2">
                Pilgrim &amp; Family Suitability
              </h3>
              <p>
                {hotel.elderly_family_suitability_note
                  ? hotel.elderly_family_suitability_note
                  : `${hotel.name} is well-suited for families, elderly pilgrims, and individuals seeking a peaceful stay in ${hotel.city}. With ${hotel.star_rating ? `${hotel.star_rating}-star hospitality` : "comfortable facilities"}, spacious lobbies, and dedicated guest support, travelers can focus entirely on their worship.`}
              </p>

              <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-masaar-black pt-2">
                Booking Through Masaar Holidays
              </h3>
              <p>
                Booking your accommodation through Masaar Holidays guarantees transparent UAE pricing in AED, verified room reservations, and complete coordination with our local ground teams in Saudi Arabia. We can combine your stay at {hotel.name} with airport transfers from Jeddah or Madinah, Haramain High-Speed Rail tickets, and private family Ziyarat tours.
              </p>
            </div>
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-lg border border-pure-gold/30 bg-warm-ivory p-6">
              <h2 className="font-semibold text-masaar-black">Interested in {hotel.name}?</h2>
              <p className="mt-1 text-sm text-masaar-black/60">
                Speak with our team for availability, pricing and the best room options for your journey.
              </p>
              <div className="mt-4">
                <WhatsAppButton templateKey="hotel" params={{ hotelName: hotel.name }} className="w-full">
                  Enquire on WhatsApp
                </WhatsAppButton>
              </div>
              <ul className="mt-4 space-y-1.5 text-xs text-masaar-black/60">
                <li>✓ Personalised recommendations</li>
                <li>✓ Latest availability and rates</li>
                <li>✓ Support from our experienced team</li>
              </ul>
            </div>
          </aside>
        </Container>
      </section>

      <section className="pb-10">
        <Container>
          <h2 className="mb-1 font-[family-name:var(--font-display)] text-2xl font-semibold text-masaar-black">
            Room Options
          </h2>
          <p className="mb-6 text-sm text-masaar-black/60">
            Choose from a range of room types. Availability, rates and policies may vary based on your travel dates.
          </p>

          {rooms.length > 0 ? (
            <div className="space-y-4">
              {rooms.map((room) => (
                <div key={room.id} className="grid gap-4 rounded-lg border border-black/10 bg-white p-5 sm:grid-cols-[140px_1fr_auto]">
                  <div className="relative h-28 w-full overflow-hidden rounded-md bg-warm-ivory sm:h-full">
                    {isRenderableImageUrl(room.image_url) ? (
                      <ExternalImage src={room.image_url} alt={room.room_type} fill className="object-cover" />
                    ) : isRenderableImageUrl(hotel.image_url) ? (
                      <ExternalImage src={hotel.image_url} alt={room.room_type} fill className="object-cover opacity-70" />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-masaar-black/30">
                        <BedIcon className="size-6" />
                        <span className="text-[10px] font-medium">Image pending</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold text-masaar-black">{room.room_type}</h3>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-masaar-black/60">
                      {room.size_sqm != null && (
                        <span className="inline-flex items-center gap-1">
                          <SizeIcon className="size-3.5" /> {room.size_sqm} m²
                        </span>
                      )}
                      {room.bed_count != null && (
                        <span className="inline-flex items-center gap-1">
                          <BedIcon className="size-3.5" /> {room.bed_count} bed{room.bed_count === 1 ? "" : "s"}
                        </span>
                      )}
                      {room.bathroom_count != null && (
                        <span className="inline-flex items-center gap-1">
                          <BathroomIcon className="size-3.5" /> {room.bathroom_count} bathroom
                          {room.bathroom_count === 1 ? "" : "s"}
                        </span>
                      )}
                      {room.bed_type && <span>{room.bed_type}</span>}
                    </div>
                    {room.notes && <p className="mt-1 text-sm text-masaar-black/60">{room.notes}</p>}

                    {room.board_basis_options.length > 0 && (
                      <div className="mt-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-masaar-black/40">
                          Board Basis
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {room.board_basis_options.map((option) => (
                            <span
                              key={option}
                              className="rounded-full bg-admin-surface px-2.5 py-1 text-[11px] font-medium text-masaar-black/70"
                            >
                              {option}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {room.cancellation_policy_options.length > 0 && (
                      <div className="mt-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-masaar-black/40">
                          Cancellation Policy
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {room.cancellation_policy_options.map((option) => (
                            <span
                              key={option}
                              className="rounded-full bg-admin-surface px-2.5 py-1 text-[11px] font-medium text-masaar-black/70"
                            >
                              {option}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {room.view_options.length > 0 && (
                      <div className="mt-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-masaar-black/40">
                          View Options
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {room.view_options.map((option) => (
                            <span key={option} className="text-[11px] text-masaar-black/60">
                              ✓ {option}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-start justify-between gap-3 sm:items-end sm:text-right">
                    <div>
                      {room.price_ro != null && (
                        <>
                          <p className="text-xs text-masaar-black/50">From</p>
                          <p className="text-lg font-semibold text-masaar-black">
                            <Price amountAed={room.price_ro} />
                            <span className="text-xs font-normal text-masaar-black/50"> per night</span>
                          </p>
                        </>
                      )}
                      {room.price_bb != null && (
                        <p className="text-sm text-masaar-black/70">
                          B&amp;B <span className="font-semibold text-masaar-black"><Price amountAed={room.price_bb} /></span>
                        </p>
                      )}
                      {room.rate_period_label && (
                        <p className="mt-1 max-w-[180px] text-xs italic text-masaar-black/40">{room.rate_period_label}</p>
                      )}
                    </div>
                    <WhatsAppButton
                      templateKey="hotelRoom"
                      params={{ hotelName: hotel.name, roomType: room.room_type }}
                      className="w-full sm:w-auto"
                    >
                      Enquire Now
                    </WhatsAppButton>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-black/15 bg-white/60 px-6 py-10 text-center">
              <p className="text-sm font-medium text-masaar-black/70">Room details coming soon</p>
              <p className="mt-1 text-sm text-masaar-black/50">
                Message us on WhatsApp for current availability and pricing.
              </p>
            </div>
          )}
        </Container>
      </section>

      <section className="pb-10">
        <Container className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="mb-4 font-[family-name:var(--font-display)] text-xl font-semibold text-masaar-black">
              Hotel Gallery
            </h2>
            {galleryPhotos.length > 0 || hotel.image_url ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {(galleryPhotos.length > 0 ? galleryPhotos : hotel.image_url ? [hotel.image_url] : []).map((url, i) => (
                  <div key={url + i} className="relative aspect-square overflow-hidden rounded-md bg-warm-ivory">
                    <ExternalImage src={url} alt={`${hotel.name} photo ${i + 1}`} fill className="object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center rounded-md border border-dashed border-black/15 bg-warm-ivory text-sm text-masaar-black/40">
                Photos coming soon
              </div>
            )}
          </div>

          <div>
            <h2 className="mb-4 font-[family-name:var(--font-display)] text-xl font-semibold text-masaar-black">
              Location
            </h2>
            <p className="text-sm text-masaar-black/60">
              {hotel.zone ? `${hotel.zone} in ${hotel.city}` : `Close to the Haram in ${hotel.city}`}
            </p>
            <a
              href={googleMapsUrl(hotel)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-black/15 px-4 py-2 text-sm font-semibold text-masaar-black hover:bg-warm-ivory"
            >
              <LocationIcon className="size-4" /> View on Google Maps
            </a>
          </div>
        </Container>
      </section>

      {/* Related Hotels in same city */}
      {relatedHotels.length > 0 && (
        <section className="bg-warm-ivory/50 py-12 border-t border-black/5">
          <Container>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-pure-gold">Explore More Stays</p>
                <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black">
                  Other Hotels in {hotel.city}
                </h2>
              </div>
              <Link href="/hotels" className="text-sm font-semibold text-deep-gold hover:underline">
                View all {hotel.city} hotels →
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedHotels.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/hotels/${rel.slug}`}
                  className="group flex flex-col overflow-hidden rounded-xl border border-black/10 bg-white transition-all hover:border-pure-gold hover:shadow-md"
                >
                  <div className="relative h-44 w-full overflow-hidden bg-warm-ivory">
                    {rel.image_url ? (
                      <ExternalImage
                        src={rel.image_url}
                        alt={rel.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-masaar-black/40">
                        Photo coming soon
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-deep-gold">{rel.city}</p>
                      <h3 className="mt-1 font-bold text-masaar-black group-hover:text-deep-gold">{rel.name}</h3>
                      <p className="mt-1 text-xs text-masaar-black/60 line-clamp-2">
                        {rel.description ||
                          (rel.zone ? `Located in ${rel.zone}, ${rel.city}.` : `Near the Haram in ${rel.city}.`)}
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between text-xs">
                      <span className="font-semibold text-masaar-black">
                        {rel.price_from_aed ? <>From <Price amountAed={rel.price_from_aed} /></> : "Price on request"}
                      </span>
                      <span className="text-deep-gold font-semibold group-hover:underline">View Details →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* Internal Link to /umrah */}
      <section className="bg-masaar-black py-12 text-white">
        <Container className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-pure-gold">Complete Pilgrimage Arrangements</p>
            <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold">
              Planning Your Umrah Journey?
            </h2>
            <p className="mt-1 text-sm text-white/70 max-w-xl">
              Stay at {hotel.name} as part of a fully supported Umrah package from the UAE, complete with Haram transfers, guided ziarat, and personalized care.
            </p>
          </div>
          <Link
            href="/umrah"
            className="shrink-0 rounded-xl bg-pure-gold px-6 py-3.5 text-sm font-bold text-masaar-black transition-colors hover:bg-light-gold"
          >
            Explore Umrah Packages →
          </Link>
        </Container>
      </section>

      <section className="pb-16">
        <Container>
          <div className="rounded-lg border border-light-gold/40 bg-warm-ivory p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-deep-gold">
                <WarningTriangleIcon className="size-5" />
              </span>
              <div>
                <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-deep-gold">
                  Important Information
                </h3>
                <p className="mt-2 text-sm text-masaar-black/70">
                  Distances, room types, availability, rates, facilities and policies may change and may vary
                  based on your travel dates and specific requirements.
                </p>
                <p className="mt-2 text-sm text-masaar-black/70">
                  Please confirm the latest information with our team before making a booking.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
