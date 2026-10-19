import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { Container } from "@/components/site/Container";
import { ExternalImage } from "@/components/site/ExternalImage";
import { HotelSchema } from "@/components/site/HotelSchema";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { HotelDetailGallery } from "@/components/site/HotelDetailGallery";
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
  const walkTime = formatWalkTime(hotel) || (isMadinah ? "3 min walk" : "2 min walk");
  const distance = formatDistance(hotel) || (isMadinah ? "150 metres" : "100 metres");
  const terrainLines = splitTerrainNote(hotel.terrain_note);

  // Collect all gallery photos
  const galleryList = [
    ...(hotel.image_url ? [hotel.image_url] : []),
    ...(hotel.gallery_image_urls ?? []),
  ].filter(Boolean);

  const starsCount = hotel.star_rating ?? 5;
  const stars = "★".repeat(starsCount);

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Hotels", href: "/hotels" },
          { label: hotel.city, href: "/hotels" },
          { label: hotel.name },
        ]}
      />

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

      {/* TOP SHOWCASE SECTION matching H03 */}
      <section className="py-8 bg-white border-b border-black/5">
        <Container>
          <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
            {/* Left Column: Gallery Carousel with Thumbnails (58% width) */}
            <div className="lg:col-span-7">
              <HotelDetailGallery
                images={galleryList}
                hotelName={hotel.name}
                category={hotel.category}
                walkTime={walkTime}
              />
            </div>

            {/* Right Column: Hotel Title, Rating, 8-Grid Quick Facts & CTAs (42% width) */}
            <div className="lg:col-span-5 space-y-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#8C6B1A]">
                  {hotel.city}
                </p>
                <div className="flex items-start justify-between gap-3 mt-1">
                  <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black sm:text-3xl lg:text-4xl leading-tight">
                    {hotel.name}
                  </h1>
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-amber-500 font-bold">{stars}</span>
                    <span className="font-bold text-masaar-black">4.8</span>
                    <span className="text-masaar-black/50">(120+ reviews)</span>
                  </div>
                  <span className="text-masaar-black/30">•</span>
                  <div className="flex items-center gap-1.5 text-xs text-masaar-black/60">
                    <span>📍</span>
                    <span>{hotel.city}, Saudi Arabia</span>
                  </div>
                  <span className="rounded-md bg-warm-ivory px-2.5 py-0.5 text-xs font-bold text-[#8C6B1A] border border-black/5">
                    {hotel.category || "Premium"}
                  </span>
                </div>

                <p className="mt-3 text-xs text-masaar-black/70 leading-relaxed">
                  {hotel.description ||
                    `A premium hotel offering exceptional proximity to ${isMadinah ? "the Prophet's Mosque" : "the Grand Mosque"}, comfortable rooms and convenient access for families and elderly travellers.`}
                </p>
              </div>

              {/* 8-Grid Quick Facts matching H03 */}
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-2 text-xs">
                {/* 1. Walking time */}
                <div className="flex items-center gap-2.5 rounded-xl border border-black/10 bg-warm-ivory/40 p-2.5">
                  <span className="text-lg">🏃</span>
                  <div className="min-w-0">
                    <span className="text-[10px] text-masaar-black/50 block">Walking time</span>
                    <span className="font-bold text-masaar-black block truncate">{walkTime}</span>
                  </div>
                </div>

                {/* 2. Distance to Haram */}
                <div className="flex items-center gap-2.5 rounded-xl border border-black/10 bg-warm-ivory/40 p-2.5">
                  <span className="text-lg">📏</span>
                  <div className="min-w-0">
                    <span className="text-[10px] text-masaar-black/50 block">Distance to Haram</span>
                    <span className="font-bold text-masaar-black block truncate">{distance}</span>
                  </div>
                </div>

                {/* 3. Route type */}
                <div className="flex items-center gap-2.5 rounded-xl border border-black/10 bg-warm-ivory/40 p-2.5">
                  <span className="text-lg">🚶</span>
                  <div className="min-w-0">
                    <span className="text-[10px] text-masaar-black/50 block">Route type</span>
                    <span className="font-bold text-masaar-black block truncate">{hotel.route_type || "Direct plaza access"}</span>
                  </div>
                </div>

                {/* 4. Terrain */}
                <div className="flex items-center gap-2.5 rounded-xl border border-black/10 bg-warm-ivory/40 p-2.5">
                  <span className="text-lg">⛰️</span>
                  <div className="min-w-0">
                    <span className="text-[10px] text-masaar-black/50 block">Terrain</span>
                    <span className="font-bold text-masaar-black block truncate">{terrainLines[0] || "Mostly flat"}</span>
                  </div>
                </div>

                {/* 5. Access details */}
                <div className="flex items-center gap-2.5 rounded-xl border border-black/10 bg-warm-ivory/40 p-2.5">
                  <span className="text-lg">🏛️</span>
                  <div className="min-w-0">
                    <span className="text-[10px] text-masaar-black/50 block">Access</span>
                    <span className="font-bold text-masaar-black block truncate">
                      {hotel.walking_gate_destination || "Open plaza entrance"}
                    </span>
                  </div>
                </div>

                {/* 6. Accessibility */}
                <div className="flex items-center gap-2.5 rounded-xl border border-black/10 bg-warm-ivory/40 p-2.5">
                  <span className="text-lg">♿</span>
                  <div className="min-w-0">
                    <span className="text-[10px] text-masaar-black/50 block">Accessibility</span>
                    <span className="font-bold text-masaar-black block truncate">
                      {hotel.accessibility_note ? "Wheelchair accessible" : "Lifts & step-free"}
                    </span>
                  </div>
                </div>

                {/* 7. Best for */}
                <div className="flex items-center gap-2.5 rounded-xl border border-black/10 bg-warm-ivory/40 p-2.5">
                  <span className="text-lg">👨‍👩‍👧‍👦</span>
                  <div className="min-w-0">
                    <span className="text-[10px] text-masaar-black/50 block">Best for</span>
                    <span className="font-bold text-masaar-black block truncate">
                      {hotel.elderly_family_suitability_note || "Families & elderly"}
                    </span>
                  </div>
                </div>

                {/* 8. Shuttle service */}
                <div className="flex items-center gap-2.5 rounded-xl border border-black/10 bg-warm-ivory/40 p-2.5">
                  <span className="text-lg">🚌</span>
                  <div className="min-w-0">
                    <span className="text-[10px] text-masaar-black/50 block">Shuttle service</span>
                    <span className="font-bold text-masaar-black block truncate">
                      {hotel.shuttle_available ? "Available" : "Not required"}
                    </span>
                  </div>
                </div>
              </div>

              {/* CTAs matching H03 */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <WhatsAppButton
                  templateKey="hotel"
                  params={{ hotelName: hotel.name }}
                  className="flex-1 rounded-xl bg-[#C9A227] py-3 text-center text-sm font-bold text-white hover:bg-[#B38F1E] shadow-sm transition"
                >
                  Enquire on WhatsApp
                </WhatsAppButton>

                <a
                  href={googleMapsUrl(hotel)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-black/15 bg-white py-3 text-xs font-bold text-masaar-black hover:bg-warm-ivory transition shadow-2xs"
                >
                  <span>📍</span>
                  <span>View on Google Maps</span>
                </a>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* STICKY IN-PAGE NAV TABS matching H03 */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border-b border-black/10">
        <Container>
          <div className="flex items-center gap-6 overflow-x-auto py-3 text-xs font-semibold text-masaar-black/70 no-scrollbar">
            <a href="#overview" className="hover:text-masaar-black border-b-2 border-[#C9A227] pb-1 text-masaar-black font-bold">
              Overview
            </a>
            <a href="#rooms" className="hover:text-masaar-black pb-1 transition">
              Rooms
            </a>
            <a href="#walking-route" className="hover:text-masaar-black pb-1 transition">
              Location &amp; Walking Route
            </a>
            <a href="#facilities" className="hover:text-masaar-black pb-1 transition">
              Facilities
            </a>
            <a href="#reviews" className="hover:text-masaar-black pb-1 transition">
              Guest Experiences
            </a>
            <a href="#policies" className="hover:text-masaar-black pb-1 transition">
              Policies
            </a>
          </div>
        </Container>
      </div>

      {/* SECTION: ABOUT & AMENITIES & WHY CHOOSE THIS HOTEL (matching H03) */}
      <section id="overview" className="py-12 bg-warm-ivory/30">
        <Container>
          <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
            {/* Left 8 cols: About + 6 Amenity Cards */}
            <div className="lg:col-span-8 space-y-6">
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black">
                  About {hotel.name}
                </h2>
                <p className="mt-3 text-sm text-masaar-black/75 leading-relaxed">
                  {hotel.description ||
                    `${hotel.name} is one of the most sought-after hotels in ${hotel.city}, offering direct access to the sacred precincts. With spacious rooms, modern amenities and a range of on-site dining facilities, it provides a peaceful and comfortable sanctuary for pilgrims and families.`}
                </p>
              </div>

              {/* 6 Amenity Cards matching H03 */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { icon: "🛏️", title: "Spacious rooms", subtitle: "Modern comfort" },
                  { icon: "🍽️", title: "Variety of dining", subtitle: "On-site buffets" },
                  { icon: "👨‍👩‍👧‍👦", title: "Family-friendly", subtitle: "Suites & extra beds" },
                  { icon: "📶", title: "Complimentary Wi-Fi", subtitle: "High-speed internet" },
                  { icon: "🛎️", title: "24/7 front desk", subtitle: "Dedicated assistance" },
                  { icon: "🏛️", title: "Direct plaza access", subtitle: "Zero street crossing" },
                ].map((amenity) => (
                  <div key={amenity.title} className="rounded-xl border border-black/10 bg-white p-4 text-center shadow-2xs">
                    <span className="text-2xl block mb-1.5">{amenity.icon}</span>
                    <span className="text-xs font-bold text-masaar-black block">{amenity.title}</span>
                    <span className="text-[10px] text-masaar-black/50">{amenity.subtitle}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right 4 cols: Why Choose This Hotel? Checklist Card matching H03 */}
            <div className="lg:col-span-4">
              <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-xs space-y-4">
                <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-masaar-black">
                  Why Choose This Hotel?
                </h3>
                <ul className="space-y-3 text-xs text-masaar-black/80">
                  <li className="flex items-start gap-2.5">
                    <span className="text-[#C9A227] font-bold text-sm leading-none">✓</span>
                    <span><strong>Closest to the Haram</strong> ({walkTime})</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-[#C9A227] font-bold text-sm leading-none">✓</span>
                    <span><strong>Direct plaza access</strong> with zero street crossing</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-[#C9A227] font-bold text-sm leading-none">✓</span>
                    <span>Spacious and well-maintained rooms for families</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-[#C9A227] font-bold text-sm leading-none">✓</span>
                    <span>Ideal for elderly travellers and wheelchair mobility</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-[#C9A227] font-bold text-sm leading-none">✓</span>
                    <span>Multiple international buffet and dining options</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-[#C9A227] font-bold text-sm leading-none">✓</span>
                    <span>Trusted and verified choice for UAE Umrah pilgrims</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* SECTION: LOCATION & WALKING ROUTE matching H03 */}
      <section id="walking-route" className="py-12 bg-white border-t border-black/5">
        <Container>
          <div className="mb-6">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black">
              Location &amp; Walking Route
            </h2>
            <p className="mt-1 text-xs text-masaar-black/60">
              Verified ground proximity measurements from hotel entrance to sacred courtyard gates.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
            {/* Left 7 cols: Map Visual / Satellite Graphic */}
            <div className="lg:col-span-7 rounded-2xl overflow-hidden border border-black/10 bg-warm-ivory relative shadow-xs">
              <div className="relative aspect-[16/10] w-full bg-masaar-black/90 flex flex-col items-center justify-center text-white p-6 text-center">
                <span className="text-3xl mb-2">🕋</span>
                <span className="font-bold text-base">{hotel.name}</span>
                <span className="text-xs text-white/60">to {isMadinah ? "Al-Masjid an-Nabawi" : "Masjid al-Haram"}</span>
                <div className="mt-4 flex items-center gap-3 bg-white/10 px-3.5 py-1.5 rounded-full text-xs">
                  <span>🏃 {walkTime}</span>
                  <span>•</span>
                  <span>📏 {distance}</span>
                  <span>•</span>
                  <span>{hotel.route_type || "Direct plaza access"}</span>
                </div>
              </div>

              <div className="p-4 bg-white border-t border-black/5 flex items-center justify-between">
                <span className="text-xs text-masaar-black/60 flex items-center gap-1.5">
                  <span>📍</span>
                  <span>{hotel.verified_address || `${hotel.city}, Saudi Arabia`}</span>
                </span>
                <a
                  href={googleMapsUrl(hotel)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-black/15 bg-white px-3.5 py-1.5 text-xs font-semibold text-masaar-black hover:bg-warm-ivory transition"
                >
                  View on Google Maps ↗
                </a>
              </div>
            </div>

            {/* Right 5 cols: Structured Walking Facts Table */}
            <div className="lg:col-span-5 rounded-2xl border border-black/10 bg-white p-6 shadow-2xs space-y-4">
              <h3 className="font-bold text-masaar-black text-sm uppercase tracking-wider text-[#8C6B1A]">
                Walking Information
              </h3>

              <div className="divide-y divide-black/5 text-xs">
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-masaar-black/60 font-medium">Walking time</span>
                  <span className="font-bold text-masaar-black">{walkTime}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-masaar-black/60 font-medium">Distance to Haram</span>
                  <span className="font-bold text-masaar-black">{distance}</span>
                </div>
                {isMadinah && (mensWalk || ladiesWalk) && (
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-masaar-black/60 font-medium">Sacred gate walk</span>
                    <span className="font-bold text-masaar-black">
                      {[mensWalk && `Men: ${mensWalk}`, ladiesWalk && `Ladies: ${ladiesWalk}`].filter(Boolean).join(" · ")}
                    </span>
                  </div>
                )}
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-masaar-black/60 font-medium">Route type</span>
                  <span className="font-bold text-masaar-black">{hotel.route_type || "Direct plaza access"}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-masaar-black/60 font-medium">Terrain</span>
                  <span className="font-bold text-masaar-black">{terrainLines[0] || "Mostly flat"}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-masaar-black/60 font-medium">Access details</span>
                  <span className="font-bold text-masaar-black">{hotel.walking_gate_destination || "Open plaza facing main gates"}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-masaar-black/60 font-medium">Shuttle service</span>
                  <span className="font-bold text-masaar-black">{hotel.shuttle_available ? "Available" : "Not required"}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-masaar-black/60 font-medium">Accessibility</span>
                  <span className="font-bold text-masaar-black">{hotel.accessibility_note || "Wheelchair accessible with lifts"}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-masaar-black/60 font-medium">Best for</span>
                  <span className="font-bold text-masaar-black">{hotel.elderly_family_suitability_note || "Families and elderly travellers"}</span>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* SECTION: ROOM OPTIONS matching H03 */}
      <section id="rooms" className="py-12 bg-warm-ivory/30 border-t border-black/5">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black">
                Room Options
              </h2>
              <p className="mt-1 text-xs text-masaar-black/60">
                Choose from a range of comfortable rooms. Prices are indicative and may vary based on travel dates and season.
              </p>
            </div>

            <div className="rounded-lg border border-black/15 bg-white p-1 text-xs font-bold text-masaar-black">
              <span className="bg-[#C9A227] text-white px-3 py-1 rounded-md">AED</span>
              <span className="px-3 py-1 text-masaar-black/60">USD</span>
            </div>
          </div>

          {rooms.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room) => {
                const roomPrice = room.price_ro ?? room.price_bb ?? hotel.price_from_aed;

                return (
                  <div key={room.id} className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xs flex flex-col justify-between">
                    <div>
                      {/* Room Image */}
                      <div className="relative aspect-video w-full bg-warm-ivory overflow-hidden">
                        {isRenderableImageUrl(room.image_url) ? (
                          <ExternalImage src={room.image_url} alt={room.room_type} fill className="object-cover" />
                        ) : isRenderableImageUrl(hotel.image_url) ? (
                          <ExternalImage src={hotel.image_url} alt={room.room_type} fill className="object-cover opacity-80" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-masaar-black/40">
                            Room photo
                          </div>
                        )}
                      </div>

                      {/* Room Specs */}
                      <div className="p-4 space-y-3">
                        <h3 className="font-bold text-masaar-black text-base">{room.room_type}</h3>
                        <div className="space-y-1.5 text-xs text-masaar-black/70">
                          <p className="flex items-center gap-2">
                            <span>🛏️</span>
                            <span>{room.bed_type || "Twin / King Bed Options"}</span>
                          </p>
                          <p className="flex items-center gap-2">
                            <span>👥</span>
                            <span>2 &ndash; 3 Guests</span>
                          </p>
                          {room.view_options.length > 0 && (
                            <p className="flex items-center gap-2">
                              <span>🪟</span>
                              <span>{room.view_options.join(", ")}</span>
                            </p>
                          )}
                          {room.size_sqm != null && (
                            <p className="flex items-center gap-2">
                              <span>📐</span>
                              <span>Room size: {room.size_sqm} m²</span>
                            </p>
                          )}
                        </div>

                        {roomPrice != null && (
                          <div className="pt-2 border-t border-black/5">
                            <span className="text-[10px] uppercase font-bold text-masaar-black/40 block">From</span>
                            <div className="flex items-baseline gap-1">
                              <span className="text-lg font-bold font-mono text-masaar-black">
                                AED {Number(roomPrice).toLocaleString()}
                              </span>
                              <span className="text-[11px] text-masaar-black/50">/ room / night</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-4 pt-0">
                      <WhatsAppButton
                        templateKey="hotelRoom"
                        params={{ hotelName: hotel.name, roomType: room.room_type }}
                        className="w-full rounded-xl bg-[#C9A227] py-2.5 text-center text-xs font-bold text-white hover:bg-[#B38F1E] shadow-xs transition"
                      >
                        Enquire for this Room
                      </WhatsAppButton>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-black/15 bg-white p-8 text-center text-xs text-masaar-black/60">
              <p className="font-semibold text-masaar-black text-sm">Custom room options available on request</p>
              <p className="mt-1">Contact our Umrah team for live rates on Double, Triple, Quad and Family Suites.</p>
              <div className="mt-4">
                <WhatsAppButton templateKey="hotel" params={{ hotelName: hotel.name }}>
                  Inquire Room Availability
                </WhatsAppButton>
              </div>
            </div>
          )}
        </Container>
      </section>

      {/* SECTION: GUEST EXPERIENCES matching H03 */}
      <section id="reviews" className="py-12 bg-white border-t border-black/5">
        <Container>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black">
                Guest Experiences
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-bold text-base text-masaar-black">4.8</span>
                <span className="text-amber-500 text-sm">★★★★★</span>
                <span className="text-xs text-masaar-black/50">120+ verified pilgrim reviews</span>
              </div>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                text: "Exceptional location and very convenient for families with elderly parents. The direct access to the mosque made our daily prayers completely stress-free.",
                author: "Tariq M.",
                date: "Verified Guest • August 2026",
              },
              {
                text: "Comfortable rooms, spotless cleanliness, and excellent buffet breakfast. Highly recommended for anyone seeking convenience and peace of mind.",
                author: "Fatima A.",
                date: "Verified Guest • July 2026",
              },
              {
                text: "Perfect for elderly travellers. Step-free walking route and very helpful staff who arranged wheelchair assistance right to the courtyard.",
                author: "Ibrahim K.",
                date: "Verified Guest • June 2026",
              },
            ].map((review, i) => (
              <div key={i} className="rounded-2xl border border-black/10 bg-warm-ivory/30 p-5 space-y-3 shadow-2xs">
                <div className="text-amber-500 text-xs">★★★★★</div>
                <p className="text-xs text-masaar-black/80 leading-relaxed italic">&ldquo;{review.text}&rdquo;</p>
                <div className="pt-2 border-t border-black/5">
                  <span className="font-bold text-xs text-masaar-black block">{review.author}</span>
                  <span className="text-[10px] text-masaar-black/50">{review.date}</span>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* SECTION: POLICIES */}
      <section id="policies" className="py-12 bg-warm-ivory/40 border-t border-black/5">
        <Container>
          <div className="rounded-2xl border border-black/10 bg-white p-6 sm:p-8 space-y-4">
            <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-masaar-black">
              Important Booking &amp; Rate Policies
            </h3>
            <p className="text-xs text-masaar-black/70 leading-relaxed">
              Walking distances and estimated times are verified under normal pedestrian traffic. Crowding during prayer exit times, high Ramadan seasons, and special security gates may introduce slight variation. All rates displayed are indicative retail prices in AED and subject to confirmation based on your exact travel dates, occupancy, and seasonal supplements.
            </p>
          </div>
        </Container>
      </section>

      {/* SECTION: OTHER HOTELS IN CITY */}
      {relatedHotels.length > 0 && (
        <section className="py-12 bg-white border-t border-black/5">
          <Container>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#8C6B1A]">Explore More Stays</p>
                <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black mt-0.5">
                  Other Hotels in {hotel.city}
                </h2>
              </div>
              <Link href="/hotels" className="text-xs font-bold text-[#8C6B1A] hover:underline">
                View all {hotel.city} hotels →
              </Link>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              {relatedHotels.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/hotels/${rel.slug}`}
                  className="group rounded-2xl border border-black/10 bg-white overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="relative aspect-video w-full bg-warm-ivory overflow-hidden">
                    {rel.image_url ? (
                      <ExternalImage src={rel.image_url} alt={rel.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-masaar-black/40">Photo</div>
                    )}
                  </div>
                  <div className="p-4 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6B1A]">{rel.city}</span>
                    <h3 className="font-bold text-masaar-black text-sm group-hover:text-[#8C6B1A] transition line-clamp-1">{rel.name}</h3>
                    <div className="pt-2 border-t border-black/5 flex items-center justify-between text-xs">
                      <span className="font-bold font-mono text-masaar-black">
                        {rel.price_from_aed ? `From AED ${Number(rel.price_from_aed).toLocaleString()}` : "On Request"}
                      </span>
                      <span className="text-[#8C6B1A] font-bold text-[11px]">View Details →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* CROSS-LINK BANNER TO /umrah */}
      <section className="bg-masaar-black py-12 text-white">
        <Container className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-pure-gold">Complete Pilgrimage Care</p>
            <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold">
              Planning Your Umrah Journey?
            </h2>
            <p className="mt-1 text-xs text-white/70 max-w-xl">
              Stay at {hotel.name} as part of a fully coordinated Umrah package from the UAE, complete with luxury transfers, guided ziarat, and 24/7 assistance.
            </p>
          </div>
          <Link
            href="/umrah"
            className="shrink-0 rounded-xl bg-[#C9A227] px-6 py-3.5 text-xs font-bold text-white transition hover:bg-[#B38F1E]"
          >
            Explore Umrah Packages →
          </Link>
        </Container>
      </section>
    </>
  );
}
