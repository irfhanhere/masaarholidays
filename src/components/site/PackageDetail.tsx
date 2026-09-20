import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getActiveUmrahDepartureMonthBySlug, getPackageBySlugAndType } from "@/lib/data/public";
import type { PackageType } from "@/lib/types/database";
import { Breadcrumbs } from "./Breadcrumbs";
import { Container } from "./Container";
import { ExternalImage } from "./ExternalImage";
import { PackageEnquiryButton } from "./PackageEnquiryButton";
import { Price } from "./Price";
import { WhatsAppButton } from "./WhatsAppButton";
import {
  BedIcon,
  CarIcon,
  CompassIcon,
  DocumentIcon,
  HeadsetIcon,
  LocationIcon,
  ShieldIcon,
} from "./icons";

const TIER_LABEL = { essential: "Essential", signature: "Signature", exclusive: "Exclusive" } as const;

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
    type === "umrah" && departureMonthSlug
      ? await getActiveUmrahDepartureMonthBySlug(departureMonthSlug)
      : null;

  const inclusions = pkg.inclusions_text?.split("\n").map((line) => line.trim()).filter(Boolean) ?? [];
  const listHref = type === "hajj" ? "/hajj" : "/umrah";
  const listLabel = type === "hajj" ? "Hajj" : "Umrah";

  const minPrice =
    roomPrices && roomPrices.length > 0
      ? Math.min(...roomPrices.map((r) => r.price_aed))
      : pkg.starting_price_aed;

  const hasMakkahPrimary = Boolean(pkg.makkah_hotel_name);
  const hasMakkahAlt = Boolean(pkg.makkah_hotel_name_alt);
  const hasMadinahPrimary = Boolean(pkg.madinah_hotel_name);
  const hasMadinahAlt = Boolean(pkg.madinah_hotel_name_alt);

  return (
    <>
      <Breadcrumbs items={[{ label: listLabel, href: listHref }, { label: pkg.title }]} />

      {/* ── Hero Header ─────────────────────────────────────────────── */}
      <div className="relative min-h-[320px] w-full bg-masaar-black sm:min-h-[400px]">
        {pkg.hero_image_url ? (
          <ExternalImage src={pkg.hero_image_url} alt={pkg.title} fill priority className="object-cover opacity-80" />
        ) : (
          <Image src="/brand/banners/umrah.png" alt={pkg.title} fill priority className="object-cover opacity-65" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-masaar-black via-masaar-black/40 to-transparent" />
        <Container className="relative flex h-full flex-col justify-end pb-8 pt-24 text-white sm:pb-12 sm:pt-32">
          <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-widest text-light-gold">
            <Link href={listHref} className="hover:underline">
              {listLabel}
            </Link>
            <span>/</span>
            <span className="font-semibold text-white">{TIER_LABEL[pkg.tier]}</span>
          </div>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-5xl">
            {pkg.title}
          </h1>
          {pkg.tagline && (
            <p className="mt-2 text-base font-semibold text-light-gold sm:text-lg">{pkg.tagline}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/80">
            {pkg.city_destination && <span>{pkg.city_destination}</span>}
            <span className="text-white/30">•</span>
            <span>{pkg.duration_label || `${pkg.duration_days} Days`}</span>
            {type === "hajj" && pkg.maktab_category && (
              <>
                <span className="text-white/30">•</span>
                <span>{pkg.maktab_category} Maktab</span>
              </>
            )}
          </div>
          {pkg.short_description && (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/70">{pkg.short_description}</p>
          )}
        </Container>
      </div>

      {/* ── Trust Strip ─────────────────────────────────────────────── */}
      <section className="border-b border-black/10 bg-warm-ivory py-6">
        <Container>
          <div className="grid grid-cols-2 gap-4 text-center sm:grid-cols-3 md:grid-cols-5">
            {[
              { label: "Real Walking Info", note: "Directly verified gate walk times" },
              { label: "Shuttle Support", note: "Complimentary or private vehicles" },
              { label: "Senior Friendly", note: "Level pathways & step-free access" },
              { label: "Verified Hotels", note: "Personally inspected by our team" },
              { label: "Worship Focused", note: "Logistics handled for peace of mind" },
            ].map(({ label, note }) => (
              <div key={label} className="flex flex-col items-center gap-1 rounded-md bg-white/70 p-3 text-center border border-black/5">
                <span className="text-xs font-semibold text-masaar-black">{label}</span>
                <span className="text-[11px] text-masaar-black/60">{note}</span>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-12">
        <Container className="grid gap-10 lg:grid-cols-3">
          <div className="space-y-10 lg:col-span-2">
            
            {/* ── Your Hotels Section ───────────────────────────────────── */}
            {(hasMakkahPrimary || hasMadinahPrimary) && (
              <div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
                <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-masaar-black">
                  Your Hotels
                </h2>
                <p className="mt-1 text-sm text-masaar-black/60">
                  Selectable hotel options curated for this tier&apos;s positioning and proximity to the Haram.
                </p>

                {/* Makkah Stay */}
                {hasMakkahPrimary && (
                  <div className="mt-6 border-t border-black/10 pt-5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold text-masaar-black">Makkah Accommodation</h3>
                      <span className="rounded bg-warm-ivory px-2 py-0.5 text-xs font-medium text-deep-gold">
                        Makkah Al-Mukarramah
                      </span>
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      {/* Option A */}
                      <div className="rounded-lg border border-black/10 bg-warm-ivory/50 p-4">
                        <div className="flex items-center justify-between">
                          <span className="rounded bg-pure-gold/20 px-2 py-0.5 text-[10px] font-bold uppercase text-masaar-black">
                            Option A
                          </span>
                          <span className="text-xs font-medium text-deep-gold">Primary Choice</span>
                        </div>
                        <h4 className="mt-2 font-semibold text-masaar-black">{pkg.makkah_hotel_name}</h4>
                        {pkg.makkah_hotel_note && (
                          <p className="mt-1 text-xs leading-relaxed text-masaar-black/70">
                            {pkg.makkah_hotel_note}
                          </p>
                        )}
                        {pkg.makkah_hotel_access_tag && (
                          <p className="mt-2 flex items-center gap-1 text-xs text-masaar-black/60">
                            <span className="text-pure-gold">✓</span>
                            {pkg.makkah_hotel_access_tag}
                          </p>
                        )}
                      </div>

                      {/* Option B (Alternate) */}
                      {hasMakkahAlt && (
                        <div className="rounded-lg border border-black/10 bg-warm-ivory/50 p-4">
                          <div className="flex items-center justify-between">
                            <span className="rounded bg-black/10 px-2 py-0.5 text-[10px] font-bold uppercase text-masaar-black">
                              Option B
                            </span>
                            <span className="text-xs font-medium text-masaar-black/60">Alternate Option</span>
                          </div>
                          <h4 className="mt-2 font-semibold text-masaar-black">{pkg.makkah_hotel_name_alt}</h4>
                          {pkg.makkah_hotel_note_alt && (
                            <p className="mt-1 text-xs leading-relaxed text-masaar-black/70">
                              {pkg.makkah_hotel_note_alt}
                            </p>
                          )}
                          {pkg.makkah_hotel_access_tag_alt && (
                            <p className="mt-2 flex items-center gap-1 text-xs text-masaar-black/60">
                              <span className="text-pure-gold">✓</span>
                              {pkg.makkah_hotel_access_tag_alt}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Madinah Stay */}
                {hasMadinahPrimary && (
                  <div className="mt-6 border-t border-black/10 pt-5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold text-masaar-black">Madinah Accommodation</h3>
                      <span className="rounded bg-warm-ivory px-2 py-0.5 text-xs font-medium text-deep-gold">
                        Al-Madinah Al-Munawwarah
                      </span>
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      {/* Option A */}
                      <div className="rounded-lg border border-black/10 bg-warm-ivory/50 p-4">
                        <div className="flex items-center justify-between">
                          <span className="rounded bg-pure-gold/20 px-2 py-0.5 text-[10px] font-bold uppercase text-masaar-black">
                            Option A
                          </span>
                          <span className="text-xs font-medium text-deep-gold">Primary Choice</span>
                        </div>
                        <h4 className="mt-2 font-semibold text-masaar-black">{pkg.madinah_hotel_name}</h4>
                        {pkg.madinah_hotel_note && (
                          <p className="mt-1 text-xs leading-relaxed text-masaar-black/70">
                            {pkg.madinah_hotel_note}
                          </p>
                        )}
                        {pkg.madinah_hotel_access_tag && (
                          <p className="mt-2 flex items-center gap-1 text-xs text-masaar-black/60">
                            <span className="text-pure-gold">✓</span>
                            {pkg.madinah_hotel_access_tag}
                          </p>
                        )}
                      </div>

                      {/* Option B (Alternate) */}
                      {hasMadinahAlt && (
                        <div className="rounded-lg border border-black/10 bg-warm-ivory/50 p-4">
                          <div className="flex items-center justify-between">
                            <span className="rounded bg-black/10 px-2 py-0.5 text-[10px] font-bold uppercase text-masaar-black">
                              Option B
                            </span>
                            <span className="text-xs font-medium text-masaar-black/60">Alternate Option</span>
                          </div>
                          <h4 className="mt-2 font-semibold text-masaar-black">{pkg.madinah_hotel_name_alt}</h4>
                          {pkg.madinah_hotel_note_alt && (
                            <p className="mt-1 text-xs leading-relaxed text-masaar-black/70">
                              {pkg.madinah_hotel_note_alt}
                            </p>
                          )}
                          {pkg.madinah_hotel_access_tag_alt && (
                            <p className="mt-2 flex items-center gap-1 text-xs text-masaar-black/60">
                              <span className="text-pure-gold">✓</span>
                              {pkg.madinah_hotel_access_tag_alt}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── The Real Journey (Walking Route Visual) ───────────────── */}
            <div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-masaar-black">
                The Real Journey — Haram Walk & Access
              </h2>
              <p className="mt-1 text-sm text-masaar-black/60">
                Verified walking route sequence with terrain notes and step-free suitability tags.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="relative rounded-lg border border-black/10 bg-warm-ivory/60 p-4 text-center">
                  <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-deep-gold text-white font-bold text-sm">
                    1
                  </div>
                  <h4 className="mt-2 text-sm font-semibold text-masaar-black">Your Hotel</h4>
                  <p className="mt-1 text-xs text-masaar-black/70">Lobby departure point with step-free elevators</p>
                  <span className="mt-2 inline-block rounded bg-white px-2 py-0.5 text-[11px] font-medium text-masaar-black/80 border border-black/5">
                    Step-free lobby
                  </span>
                </div>

                <div className="relative rounded-lg border border-black/10 bg-warm-ivory/60 p-4 text-center">
                  <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-deep-gold text-white font-bold text-sm">
                    2
                  </div>
                  <h4 className="mt-2 text-sm font-semibold text-masaar-black">Plaza Walk / Transfer</h4>
                  <p className="mt-1 text-xs text-masaar-black/70">
                    {pkg.makkah_hotel_note || "Flat pedestrian courtyard walk"}
                  </p>
                  <span className="mt-2 inline-block rounded bg-white px-2 py-0.5 text-[11px] font-medium text-masaar-black/80 border border-black/5">
                    {pkg.makkah_hotel_access_tag || "Level pathway"}
                  </span>
                </div>

                <div className="relative rounded-lg border border-black/10 bg-warm-ivory/60 p-4 text-center">
                  <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-deep-gold text-white font-bold text-sm">
                    3
                  </div>
                  <h4 className="mt-2 text-sm font-semibold text-masaar-black">Haram Gate Entrance</h4>
                  <p className="mt-1 text-xs text-masaar-black/70">Direct access into King Fahd or Ajyad Plaza</p>
                  <span className="mt-2 inline-block rounded bg-white px-2 py-0.5 text-[11px] font-medium text-masaar-black/80 border border-black/5">
                    Verified proximity
                  </span>
                </div>
              </div>
            </div>

            {/* ── What's Included Grid ──────────────────────────────────── */}
            <div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-masaar-black">
                What&apos;s Included
              </h2>
              {inclusions.length > 0 ? (
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {inclusions.map((line) => (
                    <div key={line} className="flex items-start gap-3 rounded-lg border border-black/5 bg-warm-ivory/40 p-3.5">
                      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-pure-gold/20 text-xs font-bold text-masaar-black">
                        ✓
                      </span>
                      <span className="text-sm text-masaar-black">{line}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-masaar-black/60">
                  Includes hotel accommodation, private intercity transfers, visa guidance, and guided support.
                </p>
              )}

              {(pkg.flight_note || pkg.advance_booking_note) && (
                <div className="mt-6 space-y-1.5 border-t border-black/10 pt-4 text-xs text-masaar-black/60">
                  {pkg.flight_note && <p>✈ {pkg.flight_note}</p>}
                  {pkg.advance_booking_note && <p>ℹ {pkg.advance_booking_note}</p>}
                </div>
              )}
            </div>

            {/* ── Room Pricing Section ──────────────────────────────────── */}
            {type === "hajj" ? (
              <div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
                <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-masaar-black">
                  2027 Hajj Packages: Register Your Interest
                </h2>
                <p className="mt-2 text-sm text-masaar-black/70">
                  Packages, accommodation, and availability are subject to official regulations and confirmed
                  arrangements. Speak with our team for current-season pricing and options.
                </p>
                <div className="mt-5">
                  <PackageEnquiryButton
                    packageTitle={pkg.title}
                    tier={TIER_LABEL[pkg.tier]}
                    duration={pkg.duration_label || `${pkg.duration_days} Days`}
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
                <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-masaar-black">
                  Room & Occupancy Pricing
                </h2>
                <p className="mt-1 text-sm text-masaar-black/60">
                  Transparent rates per room occupancy. Select your preferred room setup.
                </p>

                {roomPrices.length > 0 ? (
                  <div className="mt-6 space-y-4">
                    {roomPrices.map((room) => (
                      <div
                        key={room.room_type}
                        className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-black/10 bg-warm-ivory/50 p-4 transition-colors hover:bg-warm-ivory"
                      >
                        <div>
                          <h3 className="font-semibold text-masaar-black">{room.room_type} Room</h3>
                          <p className="mt-0.5 text-sm text-masaar-black/70">
                            <Price amountAed={room.price_aed} />
                            <span className="text-xs text-masaar-black/50"> per person</span>
                          </p>
                        </div>
                        <WhatsAppButton
                          templateKey="packageRoom"
                          params={{ packageTitle: pkg.title, roomType: room.room_type }}
                        >
                          Enquire about {room.room_type}
                        </WhatsAppButton>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-6 rounded-lg border border-dashed border-black/15 bg-warm-ivory/50 px-6 py-8 text-center">
                    <p className="text-sm font-medium text-masaar-black/70">Room pricing available on enquiry</p>
                    <p className="mt-1 text-xs text-masaar-black/50">
                      Contact our UAE team on WhatsApp for live room availability and Quad/Triple/Double pricing.
                    </p>
                  </div>
                )}

                {pkg.rate_disclaimer && (
                  <p className="mt-4 text-xs italic text-masaar-black/50">{pkg.rate_disclaimer}</p>
                )}
              </div>
            )}

          </div>

          {/* ── Sticky Sidebar ────────────────────────────────────────── */}
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-xl border border-pure-gold/40 bg-white p-6 shadow-md">
              <span className="rounded bg-masaar-black px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
                {TIER_LABEL[pkg.tier]}
              </span>
              <h2 className="mt-3 text-xl font-bold text-masaar-black">{pkg.title}</h2>
              
              {type === "hajj" ? (
                <div className="mt-4 border-t border-black/10 pt-4">
                  <p className="text-xs text-masaar-black/50">2027 Hajj Packages</p>
                  <p className="text-sm font-semibold text-masaar-black">Register Your Interest</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-masaar-black/60">
                    Pricing confirmed once your interest is registered — subject to official regulations and
                    confirmed arrangements.
                  </p>
                </div>
              ) : (
                minPrice != null && (
                  <div className="mt-4 border-t border-black/10 pt-4">
                    <p className="text-xs text-masaar-black/50">Starting from</p>
                    <p className="text-2xl font-bold text-masaar-black">
                      <Price amountAed={minPrice} />
                      <span className="text-xs font-normal text-masaar-black/60"> / person</span>
                    </p>
                  </div>
                )
              )}

              <p className="mt-3 text-xs leading-relaxed text-masaar-black/70">
                Customized for your family&apos;s dates, room setup, and private transfer needs. Speak directly with our UAE advisors.
              </p>

              <div className="mt-5 space-y-3">
                <PackageEnquiryButton
                  packageTitle={pkg.title}
                  tier={TIER_LABEL[pkg.tier]}
                  duration={pkg.duration_label || `${pkg.duration_days} Days`}
                  departureMonth={departureMonth?.display_label}
                  className="w-full"
                />
              </div>

              <div className="mt-4 border-t border-black/10 pt-3 text-[11px] text-masaar-black/50 space-y-1">
                <p>✓ 100% Customisable itineraries</p>
                <p>✓ UAE-based support from booking to return</p>
                <p>✓ No hidden fees or surprise charges</p>
              </div>
            </div>
          </aside>
        </Container>
      </section>
    </>
  );
}
