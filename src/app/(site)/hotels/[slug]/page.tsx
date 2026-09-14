import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/site/Container";
import { ExternalImage } from "@/components/site/ExternalImage";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { formatDistance, formatWalkTime } from "@/lib/hotel-format";
import { getHotelBySlug, getHotelRooms } from "@/lib/data/public";
import { buildPageMetadata } from "@/lib/i18n";
import { WHATSAPP_TEMPLATES } from "@/lib/whatsapp-templates";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const hotel = await getHotelBySlug(slug);
  if (!hotel) return buildPageMetadata({ path: `/hotels/${slug}`, title: "Hotel | Masaar Holidays" });
  return buildPageMetadata({
    path: `/hotels/${slug}`,
    title: `${hotel.name} | Masaar Holidays`,
    description:
      hotel.description ??
      `${hotel.name} in ${hotel.city} — room options and details, arranged through Masaar Holidays.`,
  });
}

export default async function HotelDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const hotel = await getHotelBySlug(slug);
  if (!hotel) notFound();

  const rooms = await getHotelRooms(hotel.id);
  const walkTime = formatWalkTime(hotel);
  const distance = formatDistance(hotel);

  return (
    <>
      <div className="relative h-72 w-full bg-masaar-black sm:h-96">
        {hotel.image_url ? (
          <ExternalImage src={hotel.image_url} alt={hotel.name} fill priority className="object-cover opacity-90" />
        ) : (
          <Image src="/brand/banners/hotel.png" alt="" fill priority className="object-cover opacity-70" />
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
          {hotel.star_rating != null && (
            <p className="mt-1 text-pure-gold">{"★".repeat(hotel.star_rating)}</p>
          )}
        </Container>
      </div>

      <section className="py-10">
        <Container className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {(walkTime || distance || hotel.terrain_note) && (
              <div className="mb-8 rounded-lg border border-black/10 bg-warm-ivory p-5">
                <h2 className="font-semibold text-masaar-black">Proximity to the Haram</h2>
                <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-masaar-black/70">
                  {distance && <span>{distance}</span>}
                  {walkTime && <span>{walkTime}</span>}
                </div>
                {hotel.terrain_note && (
                  <p className="mt-2 text-sm text-masaar-black/60">{hotel.terrain_note}</p>
                )}
              </div>
            )}

            {hotel.description && (
              <p className="mb-8 text-sm leading-relaxed text-masaar-black/70">{hotel.description}</p>
            )}

            <h2 className="mb-4 font-[family-name:var(--font-display)] text-2xl font-semibold text-masaar-black">
              Room Options
            </h2>
            {rooms.length > 0 ? (
              <div className="space-y-4">
                {rooms.map((room) => (
                  <div key={room.id} className="rounded-lg border border-black/10 bg-white p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-masaar-black">{room.room_type}</h3>
                        {room.bed_type && <p className="text-xs text-masaar-black/50">{room.bed_type}</p>}
                        {room.notes && <p className="mt-1 text-sm text-masaar-black/60">{room.notes}</p>}
                      </div>
                      <div className="text-right">
                        {room.price_ro != null && (
                          <p className="text-sm text-masaar-black/70">
                            Room Only <span className="font-semibold text-masaar-black">AED {room.price_ro.toLocaleString()}</span>
                          </p>
                        )}
                        {room.price_bb != null && (
                          <p className="text-sm text-masaar-black/70">
                            B&amp;B <span className="font-semibold text-masaar-black">AED {room.price_bb.toLocaleString()}</span>
                          </p>
                        )}
                        {room.rate_period_label && (
                          <p className="mt-1 text-xs italic text-masaar-black/40">{room.rate_period_label}</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-4">
                      <WhatsAppButton message={WHATSAPP_TEMPLATES.hotelRoom(hotel.name, room.room_type)}>
                        Enquire about this room
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
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-lg border border-pure-gold/30 bg-warm-ivory p-6">
              <h2 className="font-semibold text-masaar-black">Interested in {hotel.name}?</h2>
              <p className="mt-1 text-sm text-masaar-black/60">
                Speak with our team for availability, pricing and booking.
              </p>
              <div className="mt-4">
                <WhatsAppButton message={WHATSAPP_TEMPLATES.hotel(hotel.name)} className="w-full">
                  Enquire about this hotel
                </WhatsAppButton>
              </div>
            </div>
          </aside>
        </Container>
      </section>
    </>
  );
}
