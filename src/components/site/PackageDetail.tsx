import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPackageBySlugAndType } from "@/lib/data/public";
import type { PackageType } from "@/lib/types/database";
import { packageGeneralTemplateKey } from "@/lib/whatsapp-templates";
import { Container } from "./Container";
import { ExternalImage } from "./ExternalImage";
import { Price } from "./Price";
import { WhatsAppButton } from "./WhatsAppButton";

const TIER_LABEL = { essential: "Essential", signature: "Signature", prive: "Privé" } as const;

/** Shared by /umrah/[slug] and /hajj/[slug] — same two-CTA pattern as the hotel detail page. */
export async function PackageDetail({ type, slug }: { type: PackageType; slug: string }) {
  const detail = await getPackageBySlugAndType(slug, type);
  if (!detail) notFound();
  const { pkg, roomPrices } = detail;

  const inclusions = pkg.inclusions_text?.split("\n").map((line) => line.trim()).filter(Boolean) ?? [];
  const listHref = type === "hajj" ? "/hajj" : "/umrah";
  const listLabel = type === "hajj" ? "Hajj" : "Umrah";

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
                <WhatsAppButton templateKey={packageGeneralTemplateKey(type, pkg.tier)} className="w-full">
                  Enquire about this package
                </WhatsAppButton>
              </div>
            </div>
          </aside>
        </Container>
      </section>
    </>
  );
}
