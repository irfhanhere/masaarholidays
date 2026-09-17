import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getActiveUmrahDepartureMonthBySlug, getPackageBySlugAndType } from "@/lib/data/public";
import type { PackageType } from "@/lib/types/database";
import { Container } from "./Container";
import { ExternalImage } from "./ExternalImage";
import { PackageEnquiryButton } from "./PackageEnquiryButton";
import { Price } from "./Price";
import { WhatsAppButton } from "./WhatsAppButton";

const TIER_LABEL = { essential: "Essential", signature: "Signature", exclusive: "Exclusive" } as const;

/**
 * Shared by /umrah/[slug] and /hajj/[slug] — same two-CTA pattern as the
 * hotel detail page. `departureMonthSlug` is only ever set for Umrah,
 * carried forward via a `?month=` query param when a visitor reaches
 * this page from a card on an Umrah departure-month page (see
 * PackageCard.tsx) — looked up here so the sidebar enquiry popup can
 * mention that month too, exactly like the card it came from.
 */
export async function PackageDetail({
  type,
  slug,
  departureMonthSlug,
}: {
  type: PackageType;
  slug: string;
  departureMonthSlug?: string;
}) {
  const detail = await getPackageBySlugAndType(slug, type);
  if (!detail) notFound();
  const { pkg, roomPrices } = detail;

  const departureMonth =
    type === "umrah" && departureMonthSlug ? await getActiveUmrahDepartureMonthBySlug(departureMonthSlug) : null;

  const inclusions = pkg.inclusions_text?.split("\n").map((line) => line.trim()).filter(Boolean) ?? [];
  const listHref = type === "hajj" ? "/hajj" : "/umrah";
  const listLabel = type === "hajj" ? "Hajj" : "Umrah";
  // `?? []` guards against migration 0019 not being applied yet — the
  // column simply wouldn't exist on `pkg` in that case, not an error.
  const itinerarySegments = pkg.itinerary_segments ?? [];

  return (
    <>
      <div className="relative h-72 w-full bg-masaar-black sm:h-96">
        {pkg.hero_image_url ? (
          <ExternalImage src={pkg.hero_image_url} alt={pkg.title} fill priority className="object-cover opacity-90" />
        ) : (
          <Image src="/brand/banners/default.png" alt="" fill priority className="object-cover opacity-70" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-masaar-black/90 via-masaar-black/30 to-transparent" />
        <Container className="relative flex h-full flex-col justify-end pb-8 text-white">
          <p className="text-xs uppercase tracking-widest text-light-gold">
            <Link href={listHref} className="hover:underline">
              {listLabel}
            </Link>{" "}
            / {TIER_LABEL[pkg.tier]}
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-4xl">
            {pkg.title}
          </h1>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/80">
            {pkg.city_destination && <span>{pkg.city_destination}</span>}
            <span>{pkg.duration_label || `${pkg.duration_days} Days`}</span>
            {type === "hajj" && pkg.maktab_category && <span>{pkg.maktab_category} Maktab</span>}
          </div>
        </Container>
      </div>

      <section className="py-10">
        <Container className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {(pkg.validity_label || inclusions.length > 0) && (
              <div className="mb-8 rounded-lg border border-black/10 bg-warm-ivory p-5">
                {pkg.validity_label && (
                  <p className="text-sm text-masaar-black/70">
                    <span className="font-semibold text-masaar-black">Validity: </span>
                    {pkg.validity_label}
                  </p>
                )}
                {inclusions.length > 0 && (
                  <div className="mt-3">
                    <h2 className="text-sm font-semibold text-masaar-black">Every package includes</h2>
                    <ul className="mt-2 space-y-1 text-sm text-masaar-black/70">
                      {inclusions.map((line) => (
                        <li key={line} className="flex gap-2">
                          <span className="text-pure-gold">•</span>
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {(pkg.flight_note || pkg.advance_booking_note) && (
                  <div className="mt-3 space-y-1 border-t border-black/10 pt-3 text-xs text-masaar-black/50">
                    {pkg.flight_note && <p>{pkg.flight_note}</p>}
                    {pkg.advance_booking_note && <p>{pkg.advance_booking_note}</p>}
                  </div>
                )}
              </div>
            )}

            {type === "hajj" ? (
              itinerarySegments.length > 0 && (
                <div className="mb-8">
                  <h2 className="mb-4 font-[family-name:var(--font-display)] text-2xl font-semibold text-masaar-black">
                    Itinerary
                  </h2>
                  <ul className="space-y-3">
                    {itinerarySegments.map((segment, i) => (
                      <li key={i} className="rounded-lg border border-black/10 bg-white p-4">
                        <p className="text-sm text-masaar-black">
                          <span className="font-semibold text-masaar-black">{segment.location}</span>
                          <span className="text-masaar-black/70">
                            {" "}
                            — {segment.nights} {segment.nights === 1 ? "Night" : "Nights"}
                            {segment.board_type && ` · ${segment.board_type}`}
                          </span>
                        </p>
                        {segment.note && <p className="mt-1 text-sm text-masaar-black/60">{segment.note}</p>}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            ) : (
              pkg.itinerary.length > 0 && (
                <div className="mb-8">
                  <h2 className="mb-4 font-[family-name:var(--font-display)] text-2xl font-semibold text-masaar-black">
                    Itinerary
                  </h2>
                  <div className="space-y-3">
                    {pkg.itinerary.map((day) => (
                      <div key={day.day} className="rounded-lg border border-black/10 bg-white p-4">
                        <p className="text-sm font-semibold text-masaar-black">Day {day.day}</p>
                        <ul className="mt-1 space-y-1 text-sm text-masaar-black/70">
                          {day.items.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}

            <h2 className="mb-4 font-[family-name:var(--font-display)] text-2xl font-semibold text-masaar-black">
              Room Pricing
            </h2>
            {roomPrices.length > 0 ? (
              <div className="space-y-4">
                {roomPrices.map((room) => (
                  <div
                    key={room.room_type}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-black/10 bg-white p-5"
                  >
                    <div>
                      <h3 className="font-semibold text-masaar-black">{room.room_type}</h3>
                      <p className="text-sm text-masaar-black/70">
                        <Price amountAed={room.price_aed} />
                        <span className="text-xs text-masaar-black/50"> per person</span>
                      </p>
                    </div>
                    <WhatsAppButton
                      templateKey="packageRoom"
                      params={{ packageTitle: pkg.title, roomType: room.room_type }}
                    >
                      Enquire about this room option
                    </WhatsAppButton>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-black/15 bg-white/60 px-6 py-10 text-center">
                <p className="text-sm font-medium text-masaar-black/70">Room pricing coming soon</p>
                <p className="mt-1 text-sm text-masaar-black/50">
                  Message us on WhatsApp for current availability and pricing.
                </p>
              </div>
            )}

            {pkg.rate_disclaimer && (
              <p className="mt-4 text-xs italic text-masaar-black/40">{pkg.rate_disclaimer}</p>
            )}
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-lg border border-pure-gold/30 bg-warm-ivory p-6">
              <h2 className="font-semibold text-masaar-black">Interested in {pkg.title}?</h2>
              <p className="mt-1 text-sm text-masaar-black/60">
                Speak with our team for availability, pricing and booking.
              </p>
              <div className="mt-4">
                <PackageEnquiryButton
                  packageTitle={pkg.title}
                  tier={TIER_LABEL[pkg.tier]}
                  duration={pkg.duration_label || `${pkg.duration_days} Days`}
                  departureMonth={departureMonth?.display_label}
                  className="w-full"
                />
              </div>
            </div>
          </aside>
        </Container>
      </section>
    </>
  );
}
