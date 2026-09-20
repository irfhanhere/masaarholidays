"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { PackageRow, PublicHotelRow, ZiyaratPricingRow, ZiyaratVehicleTypeRow } from "@/lib/types/database";
import type { PublicUmrahInventoryConfig } from "@/lib/data/public";
import { splitTerrainNote } from "@/lib/hotel-format";
import { Breadcrumbs } from "./Breadcrumbs";
import { Container } from "./Container";
import { ExternalImage } from "./ExternalImage";
import { Price } from "./Price";
import { WhatsAppButton } from "./WhatsAppButton";
import { UmrahEnquiryModal } from "./UmrahEnquiryModal";
import { YourPriceWidget } from "./YourPriceWidget";

const TIER_LABEL: Record<PackageRow["tier"], string> = {
  essential: "Essential",
  signature: "Signature",
  exclusive: "Exclusive",
};

function HotelStayCard({
  hotel,
  optionTitle,
  isPrimary,
  allowSimilar,
  customNote,
}: {
  hotel: PublicHotelRow;
  optionTitle: string;
  isPrimary: boolean;
  allowSimilar: boolean;
  customNote?: string | null;
}) {
  const walkTime = hotel.walk_time_minutes
    ? hotel.walk_time_minutes_max && hotel.walk_time_minutes_max !== hotel.walk_time_minutes
      ? `~${hotel.walk_time_minutes}–${hotel.walk_time_minutes_max} min walk`
      : `~${hotel.walk_time_minutes} min walk`
    : null;

  const distanceText = walkTime
    ? `${walkTime}${hotel.distance_from_haram_meters ? ` (${hotel.distance_from_haram_meters}m)` : ""}`
    : hotel.distance_from_haram_meters
    ? `${hotel.distance_from_haram_meters}m from Haram`
    : null;

  const terrainLines = splitTerrainNote(hotel.terrain_note);

  return (
    <div className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-2xs hover:border-deep-gold/40 transition-all flex flex-col justify-between">
      {/* Optional Hotel Image */}
      {hotel.image_url && (
        <div className="relative h-40 w-full bg-warm-ivory">
          <ExternalImage src={hotel.image_url} alt={hotel.name} fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
          <div className="absolute left-3 top-3 flex items-center gap-1.5">
            <span
              className={`rounded px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                isPrimary ? "bg-pure-gold text-masaar-black" : "bg-black/70 text-white"
              }`}
            >
              {optionTitle}
            </span>
            {allowSimilar && (
              <span className="rounded bg-black/60 px-2 py-0.5 text-[10px] text-white/90 backdrop-blur-xs">
                or similar
              </span>
            )}
          </div>
          {distanceText && (
            <div className="absolute right-3 bottom-2.5 rounded bg-masaar-black/85 backdrop-blur-xs px-2.5 py-1 text-[11px] font-medium text-white shadow-xs">
              {distanceText}
            </div>
          )}
        </div>
      )}

      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-2.5">
          {!hotel.image_url && (
            <div className="flex items-center justify-between">
              <span
                className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  isPrimary ? "bg-pure-gold/20 text-masaar-black" : "bg-black/10 text-masaar-black"
                }`}
              >
                {optionTitle}
              </span>
              {allowSimilar && <span className="text-[10px] text-masaar-black/60">(or similar)</span>}
            </div>
          )}

          <div className="flex items-start justify-between gap-2">
            <h4 className="font-bold text-masaar-black text-base leading-tight">{hotel.name}</h4>
            {hotel.star_rating != null && (
              <span className="text-xs text-pure-gold shrink-0">{"★".repeat(hotel.star_rating)}</span>
            )}
          </div>

          {/* 4 Structured Walk & Terrain Proximity Fields (Item 11) */}
          <div className="rounded-lg border border-black/5 bg-warm-ivory/60 p-3 space-y-1.5 text-xs">
            {distanceText && (
              <div className="grid grid-cols-[100px_1fr] gap-1.5 leading-snug">
                <span className="font-semibold text-masaar-black">Distance:</span>
                <span className="text-masaar-black/80">{distanceText}</span>
              </div>
            )}
            {hotel.route_type && (
              <div className="grid grid-cols-[100px_1fr] gap-1.5 leading-snug">
                <span className="font-semibold text-masaar-black">Route:</span>
                <span className="text-masaar-black/80">{hotel.route_type}</span>
              </div>
            )}
            {hotel.accessibility_note && (
              <div className="grid grid-cols-[100px_1fr] gap-1.5 leading-snug">
                <span className="font-semibold text-masaar-black">Access:</span>
                <span className="text-masaar-black/80">{hotel.accessibility_note}</span>
              </div>
            )}
            {terrainLines.length > 0 && (
              <div className="grid grid-cols-[100px_1fr] gap-1.5 leading-snug">
                <span className="font-semibold text-masaar-black">Path &amp; Terrain:</span>
                <div className="text-masaar-black/80">
                  {terrainLines.length > 1 ? (
                    <ul className="space-y-0.5">
                      {terrainLines.map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ul>
                  ) : (
                    terrainLines[0]
                  )}
                </div>
              </div>
            )}
            {hotel.elderly_family_suitability_note && (
              <div className="grid grid-cols-[100px_1fr] gap-1.5 leading-snug">
                <span className="font-semibold text-masaar-black">Best for:</span>
                <span className="text-masaar-black/90 font-medium text-deep-gold">
                  {hotel.elderly_family_suitability_note}
                </span>
              </div>
            )}
          </div>

          {customNote && (
            <p className="text-xs text-masaar-black/70 italic bg-black/5 rounded p-2 border border-black/5">
              {customNote}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

interface Props {
  pkg: PackageRow;
  tierConfigs: PublicUmrahInventoryConfig[];
  ziyaratData: {
    vehicleTypes: ZiyaratVehicleTypeRow[];
    pricing: ZiyaratPricingRow[];
  };
}

export function UmrahInventoryDetailClient({ pkg, tierConfigs, ziyaratData }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Separate configs by journey type
  const makkahOnlyConfigs = tierConfigs.filter((c) => c.journey_type === "makkah_only");
  const makkahMadinahConfigs = tierConfigs.filter((c) => c.journey_type === "makkah_madinah");

  // Pick lowest price config as default for Makkah Only
  const defaultMakkahOnlyConfig = [...makkahOnlyConfigs].sort((a, b) => (a.min_price_aed ?? Infinity) - (b.min_price_aed ?? Infinity))[0] ?? tierConfigs[0];

  // Pick lowest price config as default for Makkah + Madinah
  const defaultMakkahMadinahConfig = [...makkahMadinahConfigs].sort((a, b) => (a.min_price_aed ?? Infinity) - (b.min_price_aed ?? Infinity))[0];

  const [selectedMakkahOnlyId, setSelectedMakkahOnlyId] = useState<string>(defaultMakkahOnlyConfig?.id ?? "");
  const [selectedMakkahMadinahId, setSelectedMakkahMadinahId] = useState<string>(defaultMakkahMadinahConfig?.id ?? "");

  // Which product option's pricing is showing — only one at a time, toggled by the pills above the pricing block.
  const [selectedJourneyType, setSelectedJourneyType] = useState<"makkah_only" | "makkah_madinah">(
    makkahOnlyConfigs.length > 0 ? "makkah_only" : "makkah_madinah"
  );

  const activeMakkahOnlyConfig = tierConfigs.find((c) => c.id === selectedMakkahOnlyId) ?? defaultMakkahOnlyConfig;
  const activeMakkahMadinahConfig = tierConfigs.find((c) => c.id === selectedMakkahMadinahId) ?? defaultMakkahMadinahConfig;

  // Global starting price for sidebar
  const allPrices = tierConfigs.flatMap((c) => c.room_prices.map((r) => r.price_aed));
  const minStartingPrice = allPrices.length > 0 ? Math.min(...allPrices) : pkg.starting_price_aed;

  // Active configuration for hotel/price/inclusions display — follows the same
  // Makkah Only / Makkah + Madinah toggle as the pricing section, so the
  // sidebar price and hotel cards never show a different product than the
  // one currently selected (previously this always preferred Makkah+Madinah
  // regardless of the toggle, which was confusing).
  const displayConfig = selectedJourneyType === "makkah_only" ? activeMakkahOnlyConfig : activeMakkahMadinahConfig;

  // Inclusions text fallback
  const inclusionsText = displayConfig?.inclusions_override || pkg.inclusions_text;
  const inclusionsList = inclusionsText?.split("\n").map((line) => line.trim()).filter(Boolean) ?? [];

  // Cheapest Makkah Ziyarat vehicle price, for the Optional Add-ons "From AED X" line.
  const makkahZiyaratPrices = ziyaratData.pricing.filter((p) => p.city === "Makkah").map((p) => p.price_aed);
  const makkahZiyaratFrom = makkahZiyaratPrices.length > 0 ? Math.min(...makkahZiyaratPrices) : null;

  // Occupancy prices for the active (displayed) configuration, feeding the Package Price sidebar.
  const priceForOccupancy = (occupancy: "Double" | "Triple" | "Quad") =>
    displayConfig?.room_prices.find((r) => r.occupancy_type === occupancy)?.price_aed;

  // True only when we have at least one real number to show — never fabricate
  // a price. Without this, an under-configured package (no inventory
  // configuration rows and no packages.starting_price_aed) would silently
  // fall through to YourPriceWidget's own hardcoded demo defaults.
  const hasRealPriceData = allPrices.length > 0 || pkg.starting_price_aed != null;

  return (
    <>
      <Breadcrumbs items={[{ label: "Umrah", href: "/umrah" }, { label: pkg.title }]} />

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
            <Link href="/umrah" className="hover:underline">
              Umrah
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
            <span>{displayConfig?.duration_label || `${pkg.duration_days} Days`}</span>
            <span className="text-white/30">•</span>
            <span>{makkahMadinahConfigs.length > 0 ? "Makkah & Madinah Journeys Available" : "Makkah Only Journey"}</span>
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

      {/* ── Main Content & Pricing ────────────────────────────────────── */}
      <section className="py-12">
        <Container className="grid gap-10 lg:grid-cols-3">
          <div className="space-y-10 lg:col-span-2">

            {/* ── PRICING TABLES SECTION ──────────────────────────────── */}
            <div className="space-y-6 rounded-xl border border-black/10 bg-white p-6 shadow-sm">
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-masaar-black">
                  Package Pricing & Duration Options
                </h2>
                <p className="mt-1 text-sm text-masaar-black/60">
                  Choose Makkah Only or Makkah + Madinah, then select your preferred duration to view pricing.
                </p>
              </div>

              {/* Journey type toggle — only shown when both products exist for this tier */}
              {makkahOnlyConfigs.length > 0 && makkahMadinahConfigs.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedJourneyType("makkah_only")}
                    className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide transition-colors ${
                      selectedJourneyType === "makkah_only"
                        ? "bg-deep-gold text-white"
                        : "border border-black/15 text-masaar-black/70 hover:bg-warm-ivory"
                    }`}
                  >
                    Makkah Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedJourneyType("makkah_madinah")}
                    className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide transition-colors ${
                      selectedJourneyType === "makkah_madinah"
                        ? "bg-deep-gold text-white"
                        : "border border-black/15 text-masaar-black/70 hover:bg-warm-ivory"
                    }`}
                  >
                    Makkah + Madinah
                  </button>
                </div>
              )}

              {/* MAKKAH ONLY PRICING */}
              {selectedJourneyType === "makkah_only" && activeMakkahOnlyConfig && (
                <div className="rounded-lg border border-black/10 bg-warm-ivory/30 p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-3">
                    <h3 className="text-lg font-bold text-masaar-black">Makkah Only Package</h3>

                    {/* Duration / Month Selector if multiple Makkah Only configs exist */}
                    {makkahOnlyConfigs.length > 1 && (
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-medium text-masaar-black/70">Duration / Month:</label>
                        <select
                          value={selectedMakkahOnlyId}
                          onChange={(e) => setSelectedMakkahOnlyId(e.target.value)}
                          className="rounded-md border border-black/15 bg-white px-3 py-1.5 text-xs font-semibold text-masaar-black focus:border-deep-gold focus:outline-none"
                        >
                          {makkahOnlyConfigs.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.duration_label} {c.departure_month ? `(${c.departure_month.display_label})` : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-masaar-black/70">
                    Duration: <span className="font-semibold text-masaar-black">{activeMakkahOnlyConfig.duration_label}</span>
                    {activeMakkahOnlyConfig.departure_month && (
                      <span className="ml-2 font-medium text-deep-gold">
                        ({activeMakkahOnlyConfig.departure_month.display_label})
                      </span>
                    )}
                  </div>

                  {/* Itinerary for the selected duration — updates whenever the duration above changes */}
                  {activeMakkahOnlyConfig.itinerary && activeMakkahOnlyConfig.itinerary.length > 0 ? (
                    <div className="space-y-3 border-t border-black/10 pt-4">
                      <h4 className="text-sm font-bold text-masaar-black">Day-by-Day Itinerary</h4>
                      <div className="space-y-3 border-l-2 border-deep-gold/40 pl-4">
                        {activeMakkahOnlyConfig.itinerary.map((dayItem, idx) => (
                          <div key={idx} className="relative space-y-1">
                            <div className="absolute -left-[19px] top-1 h-2.5 w-2.5 rounded-full bg-deep-gold ring-4 ring-white" />
                            <h5 className="text-xs font-bold text-masaar-black">
                              Day {dayItem.day} {dayItem.title ? `— ${dayItem.title}` : ""}
                            </h5>
                            {dayItem.items && dayItem.items.length > 0 && (
                              <ul className="space-y-1 pt-0.5 text-xs text-masaar-black/75">
                                {dayItem.items.map((item, i) => (
                                  <li key={i} className="flex items-start gap-1.5">
                                    <span className="mt-0.5 text-deep-gold">•</span>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="border-t border-black/10 pt-4">
                      <p className="text-xs italic text-masaar-black/50">
                        Day-by-day itinerary for this duration is being finalized — ask our team on WhatsApp for full details.
                      </p>
                    </div>
                  )}

                  {/* Pricing Grid — shown under the itinerary */}
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {activeMakkahOnlyConfig.room_prices.map((rp) => (
                      <div key={rp.occupancy_type} className="rounded-lg border border-black/10 bg-white p-3.5 text-center">
                        <span className="text-xs font-semibold text-masaar-black/70">{rp.occupancy_type} Room</span>
                        <div className="mt-1 text-lg font-bold text-masaar-black">
                          <Price amountAed={rp.price_aed} />
                        </div>
                        <span className="text-[10px] text-masaar-black/50">per person</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* MAKKAH + MADINAH PRICING */}
              {selectedJourneyType === "makkah_madinah" && activeMakkahMadinahConfig && (
                <div className="rounded-lg border border-black/10 bg-warm-ivory/30 p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-3">
                    <h3 className="text-lg font-bold text-masaar-black">Makkah + Madinah Combined Package</h3>

                    {/* Duration / Month Selector if multiple Makkah+Madinah configs exist */}
                    {makkahMadinahConfigs.length > 1 && (
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-medium text-masaar-black/70">Duration / Month:</label>
                        <select
                          value={selectedMakkahMadinahId}
                          onChange={(e) => setSelectedMakkahMadinahId(e.target.value)}
                          className="rounded-md border border-black/15 bg-white px-3 py-1.5 text-xs font-semibold text-masaar-black focus:border-deep-gold focus:outline-none"
                        >
                          {makkahMadinahConfigs.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.duration_label} {c.departure_month ? `(${c.departure_month.display_label})` : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-masaar-black/70">
                    Duration: <span className="font-semibold text-masaar-black">{activeMakkahMadinahConfig.duration_label}</span>
                    {activeMakkahMadinahConfig.departure_month && (
                      <span className="ml-2 font-medium text-deep-gold">
                        ({activeMakkahMadinahConfig.departure_month.display_label})
                      </span>
                    )}
                  </div>

                  {/* Pricing Grid */}
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {activeMakkahMadinahConfig.room_prices.map((rp) => (
                      <div key={rp.occupancy_type} className="rounded-lg border border-black/10 bg-white p-3.5 text-center">
                        <span className="text-xs font-semibold text-masaar-black/70">{rp.occupancy_type} Room</span>
                        <div className="mt-1 text-lg font-bold text-masaar-black">
                          <Price amountAed={rp.price_aed} />
                        </div>
                        <span className="text-[10px] text-masaar-black/50">per person</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── YOUR HOTELS SECTION ─────────────────────────────────── */}
            {displayConfig && (displayConfig.makkah_hotel || displayConfig.madinah_hotel) && (
              <div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
                <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-masaar-black">
                  Your Accommodations
                </h2>
                <p className="mt-1 text-sm text-masaar-black/60">
                  Inspected and selected hotels for this tier&apos;s level of proximity and comfort.
                </p>

                {/* Makkah Accommodation */}
                {displayConfig.makkah_hotel && (
                  <div className="mt-6 border-t border-black/10 pt-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold text-masaar-black">Makkah Hotel Options</h3>
                      <span className="rounded bg-warm-ivory px-2 py-0.5 text-xs font-medium text-deep-gold">
                        Makkah Al-Mukarramah
                      </span>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <HotelStayCard
                        hotel={displayConfig.makkah_hotel}
                        optionTitle="Option A (Primary)"
                        isPrimary={true}
                        allowSimilar={displayConfig.makkah_allow_similar}
                        customNote={displayConfig.makkah_custom_note}
                      />
                      {displayConfig.makkah_hotel_alt && (
                        <HotelStayCard
                          hotel={displayConfig.makkah_hotel_alt}
                          optionTitle="Option B (Alternate)"
                          isPrimary={false}
                          allowSimilar={displayConfig.makkah_allow_similar_alt}
                          customNote={displayConfig.makkah_custom_note_alt}
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Madinah Accommodation */}
                {displayConfig.madinah_hotel && (
                  <div className="mt-6 border-t border-black/10 pt-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold text-masaar-black">Madinah Hotel Options</h3>
                      <span className="rounded bg-warm-ivory px-2 py-0.5 text-xs font-medium text-deep-gold">
                        Al-Madinah Al-Munawwarah
                      </span>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <HotelStayCard
                        hotel={displayConfig.madinah_hotel}
                        optionTitle="Option A (Primary)"
                        isPrimary={true}
                        allowSimilar={displayConfig.madinah_allow_similar}
                        customNote={displayConfig.madinah_custom_note}
                      />
                      {displayConfig.madinah_hotel_alt && (
                        <HotelStayCard
                          hotel={displayConfig.madinah_hotel_alt}
                          optionTitle="Option B (Alternate)"
                          isPrimary={false}
                          allowSimilar={displayConfig.madinah_allow_similar_alt}
                          customNote={displayConfig.madinah_custom_note_alt}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── INCLUDED IN YOUR JOURNEY / OPTIONAL ADD-ONS ──────────── */}
            <div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
              <div className="grid gap-8 sm:grid-cols-2">
                <div>
                  <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-masaar-black">
                    Included in Your Journey
                  </h2>
                  {inclusionsList.length > 0 ? (
                    <ul className="mt-4 space-y-2.5">
                      {inclusionsList.map((line) => (
                        <li key={line} className="flex items-start gap-2.5 text-sm text-masaar-black">
                          <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-pure-gold/20 text-[11px] font-bold text-masaar-black">
                            ✓
                          </span>
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-4 text-sm text-masaar-black/60">
                      Includes hotel accommodation, private intercity transfers, visa guidance, and guided support.
                    </p>
                  )}
                </div>

                <div>
                  <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-masaar-black">
                    Optional Add-ons
                  </h2>
                  <ul className="mt-4 space-y-3 text-sm text-masaar-black">
                    <li className="flex items-start justify-between gap-3">
                      <span>Electronic Umrah Visa Processing</span>
                      <span className="shrink-0 text-masaar-black/50">Price on request</span>
                    </li>
                    <li>
                      <div className="flex items-start justify-between gap-3">
                        <span>Private Makkah Ziyarat Tour</span>
                        <span className="shrink-0 font-semibold">
                          From <Price amountAed={makkahZiyaratFrom ?? 300} />
                        </span>
                      </div>
                      {ziyaratData.vehicleTypes.length > 0 && (
                        <ul className="mt-1 space-y-0.5 pl-3 text-xs text-masaar-black/60">
                          {ziyaratData.vehicleTypes.map((vehicle) => {
                            const price = ziyaratData.pricing.find(
                              (p) => p.city === "Makkah" && p.vehicle_type_id === vehicle.id
                            )?.price_aed;
                            if (price == null) return null;
                            return (
                              <li key={vehicle.id}>
                                {vehicle.name} — <Price amountAed={price} />/vehicle
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </li>
                    <li className="flex items-start justify-between gap-3">
                      <span>Flight Arrangements</span>
                      <span className="shrink-0 font-semibold">Available upon request</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* ── PRIVATE TRIPS & ZIYARAT ADD-ONS SECTION ────────────── */}
            {(displayConfig?.private_trips.length > 0 || ziyaratData.vehicleTypes.length > 0) && (
              <div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm space-y-6">
                <div>
                  <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-masaar-black">
                    Ziyarat & Private Tour Add-ons
                  </h2>
                  <p className="mt-1 text-sm text-masaar-black/60">
                    Enhance your Umrah journey with guided private tours in Makkah & Madinah.
                  </p>
                </div>

                {/* Linked Private Trips */}
                {displayConfig?.private_trips && displayConfig.private_trips.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-deep-gold">
                      Recommended Private Tours
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {displayConfig.private_trips.map((trip) => (
                        <div key={trip.id} className="rounded-lg border border-black/10 bg-warm-ivory/50 p-4">
                          <h4 className="font-bold text-sm text-masaar-black">{trip.name}</h4>
                          <span className="text-xs font-medium text-deep-gold">{trip.destination}</span>
                          <p className="mt-1 text-xs text-masaar-black/70">{trip.short_description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ziyarat Vehicles & Pricing Matrix preview */}
                {ziyaratData.vehicleTypes.length > 0 && (
                  <div className="space-y-3 border-t border-black/10 pt-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-deep-gold">
                      Private Vehicles Catalog & Ziyarat Pricing
                    </h3>

                    <div className="grid gap-4 sm:grid-cols-3">
                      {ziyaratData.vehicleTypes.map((vehicle) => {
                        const makkahPrice = ziyaratData.pricing.find((p) => p.city === "Makkah" && p.vehicle_type_id === vehicle.id)?.price_aed;
                        const madinahPrice = ziyaratData.pricing.find((p) => p.city === "Madinah" && p.vehicle_type_id === vehicle.id)?.price_aed;

                        return (
                          <div key={vehicle.id} className="rounded-lg border border-black/10 bg-white p-3.5 text-center space-y-2">
                            {vehicle.image_url ? (
                              <img src={vehicle.image_url} alt={vehicle.name} className="h-20 w-full object-cover rounded" />
                            ) : (
                              <div className="h-20 w-full bg-warm-ivory rounded flex items-center justify-center text-xs text-masaar-black/40">
                                🚗 {vehicle.name}
                              </div>
                            )}
                            <h4 className="font-bold text-xs text-masaar-black">{vehicle.name}</h4>
                            <p className="text-[11px] text-masaar-black/60">{vehicle.capacity_label}</p>

                            <div className="border-t border-black/5 pt-2 text-[11px] space-y-1">
                              {makkahPrice != null && (
                                <div className="flex justify-between">
                                  <span>Makkah Ziyarat:</span>
                                  <span className="font-bold"><Price amountAed={makkahPrice} /></span>
                                </div>
                              )}
                              {madinahPrice != null && (
                                <div className="flex justify-between">
                                  <span>Madinah Ziyarat:</span>
                                  <span className="font-bold"><Price amountAed={madinahPrice} /></span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Sticky Sidebar ────────────────────────────────────────── */}
          <aside className="lg:sticky lg:top-28 lg:self-start">
            {hasRealPriceData ? (
              <YourPriceWidget
                doublePrice={priceForOccupancy("Double") ?? minStartingPrice ?? undefined}
                triplePrice={priceForOccupancy("Triple") ?? minStartingPrice ?? undefined}
                quadPrice={priceForOccupancy("Quad") ?? minStartingPrice ?? undefined}
                onOpenEnquiry={() => setIsModalOpen(true)}
                hideViewDetails
              />
            ) : (
              <div className="rounded-xl border border-pure-gold/40 bg-white p-6 shadow-md">
                <span className="rounded bg-masaar-black px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
                  {TIER_LABEL[pkg.tier]}
                </span>
                <h2 className="mt-3 text-xl font-bold text-masaar-black">{pkg.title}</h2>
                <p className="mt-3 text-xs leading-relaxed text-masaar-black/70">
                  Pricing for this package is confirmed directly with our UAE advisors based on your dates, room
                  setup, and private transfer needs.
                </p>
                <div className="mt-5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#A87F12] py-3.5 text-xs font-bold text-white shadow-2xs hover:bg-[#936e0f] transition-colors"
                  >
                    <span>💬</span>
                    <span>Enquire on WhatsApp</span>
                  </button>
                </div>
              </div>
            )}
          </aside>
        </Container>
      </section>

      {/* Interactive WhatsApp Enquiry Modal */}
      <UmrahEnquiryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        packageInfo={{
          name: pkg.title,
          tier: TIER_LABEL[pkg.tier],
          destination: displayConfig?.journey_type === "makkah_madinah" ? "Makkah + Madinah" : "Makkah",
          duration: displayConfig?.duration_label || `${pkg.duration_days} Days`,
          hotelName: displayConfig?.makkah_hotel?.name || pkg.makkah_hotel_name || "5-Star Hotel",
          hotelRating: "5-Star accommodation",
          shuttleInfo: displayConfig?.makkah_hotel?.shuttle_note || "24/7 dedicated Haram shuttle",
          imageUrl: pkg.hero_image_url || "/brand/banners/umrah.png",
          shortDescription: pkg.short_description || pkg.tagline || "",
        }}
      />
    </>
  );
}

