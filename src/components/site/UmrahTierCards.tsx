"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { PackageRow } from "@/lib/types/database";
import type { PublicUmrahInventoryConfig } from "@/lib/data/public";
import { Container } from "./Container";
import { ExternalImage } from "./ExternalImage";
import { Price } from "./Price";
import type { PackageEnquiryInfo } from "./UmrahEnquiryModal";

interface Props {
  packages: PackageRow[];
  inventoryConfigs: PublicUmrahInventoryConfig[];
  onOpenEnquiry?: (info: PackageEnquiryInfo) => void;
  monthSlug?: string | null;
}

interface TierConfigInfo {
  caption: string;
  badgeLabel: string;
  category: string;
  defaultPhoto: string;
  makkahHotel: {
    name: string;
    rating: string;
    distance: string;
    access: string;
  };
  madinahHotel: {
    name: string;
    rating: string;
    distance: string;
    access: string;
  };
  transfers: string;
  makkahMadinahTransport: string;
  haramainTrainIncluded: boolean;
  flightsNote: string;
  departuresInfo: string;
  confirmedServices: string[];
  exclusions: string[];
  fallbackPrices: Record<string, { double: number; triple: number; quad: number }>;
}

const TIER_ORDER: Array<PackageRow["tier"]> = ["essential", "signature", "exclusive"];

const TIER_METADATA: Record<PackageRow["tier"], TierConfigInfo> = {
  essential: {
    caption: "A BLESSED BEGINNING",
    badgeLabel: "ESSENTIAL",
    category: "Smart & Budget-Friendly",
    defaultPhoto: "/brand/banners/umrah.webp",
    makkahHotel: {
      name: "VOCO Makkah (or similar)",
      rating: "4-Star Hotel",
      distance: "1,400m from Haram",
      access: "24/7 Complimentary hotel shuttle service (8-min ride)",
    },
    madinahHotel: {
      name: "Zowar International Madinah",
      rating: "4-Star Hotel",
      distance: "250m from Haram",
      access: "4-min level flat walk to Northern Courtyard",
    },
    transfers: "Private air-conditioned transfers across all legs",
    makkahMadinahTransport: "Air-conditioned intercity highway coach",
    haramainTrainIncluded: false,
    flightsNote: "Return flight tickets from UAE (DXB/SHJ/AUH) arranged on request",
    departuresInfo: "Confirmed monthly UAE departures & custom private dates",
    confirmedServices: [
      "Comfortable hotel accommodation in Makkah & Madinah",
      "24/7 Complimentary Makkah Haram shuttle service",
      "Private air-conditioned airport & intercity transfers",
      "Umrah visa guidance & processing support",
      "24/7 Masaar Holidays guest helpline",
    ],
    exclusions: [
      "International flights (available on request)",
      "Daily lunch & dinner (room-only / breakfast as booked)",
      "Haramain High-Speed Train (standard coach included; upgrade available)",
      "Personal expenses and hotel laundry",
    ],
    fallbackPrices: {
      "2 Nights / 3 Days": { double: 889, triple: 689, quad: 489 },
      "3 Nights / 4 Days": { double: 1229, triple: 829, quad: 629 },
      "5 Nights / 6 Days": { double: 1689, triple: 1189, quad: 849 },
      "6 Nights / 7 Days": { double: 2138, triple: 1640, quad: 1341 },
    },
  },
  signature: {
    caption: "A MORE MEANINGFUL JOURNEY",
    badgeLabel: "SIGNATURE",
    category: "Comfort & Walking Access — Most Chosen",
    defaultPhoto: "/trips/private-trip-makkah-card.webp",
    makkahHotel: {
      name: "Jabal Omar Marriott Hotel (or similar)",
      rating: "5-Star Luxury",
      distance: "350m from Haram",
      access: "4-min easy flat walk directly across King Fahd Gate",
    },
    madinahHotel: {
      name: "Millennium Taiba Hotel (or similar)",
      rating: "5-Star Hotel",
      distance: "150m from Haram",
      access: "2-min direct walk onto the Prophet's Mosque courtyard",
    },
    transfers: "Dedicated private vehicle mobility sequence (Sedan / SUV)",
    makkahMadinahTransport: "Private vehicle intercity transfer sequence",
    haramainTrainIncluded: false,
    flightsNote: "Return flight ticketing coordination from all UAE airports on request",
    departuresInfo: "Confirmed monthly UAE departures & custom family departures",
    confirmedServices: [
      "5-Star accommodation in Makkah & Madinah courtyard perimeter",
      "Daily Gourmet Buffet Breakfast included",
      "Complete private vehicle mobility sequence",
      "Private Guided Makkah Ziyarat Tour (Historical landmarks)",
      "Umrah visa processing & express concierge assistance",
    ],
    exclusions: [
      "International flights (arranged separately on request)",
      "Lunch & dinner (gourmet breakfast included)",
      "Haramain High-Speed Train (private car included; train upgrade available)",
      "Personal expenses",
    ],
    fallbackPrices: {
      "2 Nights / 3 Days": { double: 1543, triple: 1302, quad: 1147 },
      "3 Nights / 4 Days": { double: 1890, triple: 1580, quad: 1390 },
      "5 Nights / 6 Days": { double: 2450, triple: 2050, quad: 1790 },
      "6 Nights / 7 Days": { double: 3478, triple: 2627, quad: 2217 },
    },
  },
  exclusive: {
    caption: "THE HIGHEST STANDARD OF CARE",
    badgeLabel: "EXCLUSIVE",
    category: "Front-Row Luxury & VIP Concierge",
    defaultPhoto: "/trips/private-trip-transport.webp",
    makkahHotel: {
      name: "InterContinental Dar Al Tawhid",
      rating: "5-Star Ultra Luxury",
      distance: "50m from Haram",
      access: "1-min direct step-out onto Grand Mosque courtyard marble (Zero Steps)",
    },
    madinahHotel: {
      name: "InterContinental Dar Al Hijra",
      rating: "5-Star Luxury",
      distance: "50m from Haram",
      access: "1-min flat walk to Prophet's Mosque Northern Courtyard",
    },
    transfers: "VIP Private Luxury Vehicle (GMC Yukon XL / Mercedes V-Class)",
    makkahMadinahTransport: "Haramain High-Speed Train (Business Class) with station transfers",
    haramainTrainIncluded: true,
    flightsNote: "Bespoke return flights and Business Class coordination on request",
    departuresInfo: "Bespoke VIP departures customized around your exact travel dates",
    confirmedServices: [
      "Front-row 5-Star luxury properties in Makkah & Madinah (Zero Steps)",
      "Daily 5-Star Gourmet Buffet Breakfast included",
      "VIP Private Luxury transfers (GMC Yukon XL / Mercedes V-Class across airport legs)",
      "Haramain High-Speed Train (Business Class) tickets between Makkah & Madinah",
      "Private Guided Historical Ziyarat in Makkah & Madinah with specialist historian",
      "Priority check-in & express luggage handling",
      "Full Umrah visa processing & Saudi medical insurance",
      "24/7 Dedicated VIP Personal Concierge",
    ],
    exclusions: [
      "International flights (bespoke coordination available on request)",
      "Lunch & dinner (daily 5-star breakfast included)",
      "Personal room incidentals",
    ],
    fallbackPrices: {
      "2 Nights / 3 Days": { double: 2543, triple: 2102, quad: 1847 },
      "3 Nights / 4 Days": { double: 3100, triple: 2590, quad: 2250 },
      "5 Nights / 6 Days": { double: 3950, triple: 3300, quad: 2890 },
      "6 Nights / 7 Days": { double: 5358, triple: 4124, quad: 3495 },
    },
  },
};

export function UmrahTierCards({ packages, inventoryConfigs, onOpenEnquiry, monthSlug }: Props) {
  // Map packages by tier
  const orderedPackages = TIER_ORDER.map((tier) => packages.find((p) => p.tier === tier)).filter(
    (p): p is PackageRow => Boolean(p)
  );

  return (
    <section className="py-16 bg-[#FAF7F2]">
      <Container className="space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-[#A87F12]">
            <span>—</span>
            <span>THREE DISTINCT UMRAH EXPERIENCES</span>
            <span>—</span>
          </div>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold text-masaar-black sm:text-5xl">
            Choose Your Umrah Experience
          </h2>
          <p className="mt-3 text-sm sm:text-base text-masaar-black/70 leading-relaxed">
            Three carefully configured, genuine packages designed around verified hotels, real walking distances, dedicated mobility, and transparent pricing.
          </p>
        </div>

        {/* 3 Tier Stacked Full-Width Cards */}
        <div className="space-y-10">
          {orderedPackages.map((pkg) => (
            <TierCard
              key={pkg.id}
              pkg={pkg}
              configs={inventoryConfigs.filter((c) => c.package_id === pkg.id)}
              onOpenEnquiry={onOpenEnquiry}
              monthSlug={monthSlug}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}

function TierCard({
  pkg,
  configs,
  onOpenEnquiry,
  monthSlug,
}: {
  pkg: PackageRow;
  configs: PublicUmrahInventoryConfig[];
  onOpenEnquiry?: (info: PackageEnquiryInfo) => void;
  monthSlug?: string | null;
}) {
  const meta = TIER_METADATA[pkg.tier] || TIER_METADATA.essential;
  const isSignature = pkg.tier === "signature";
  const isExclusive = pkg.tier === "exclusive";

  // Makkah-only configs for duration tabs
  const makkahConfigs = configs.filter((c) => c.journey_type === "makkah_only");

  // Determine available durations
  const availableDurations =
    makkahConfigs.length > 0
      ? makkahConfigs.map((c) => c.duration_label)
      : ["2 Nights / 3 Days", "3 Nights / 4 Days", "5 Nights / 6 Days", "6 Nights / 7 Days"];

  const [selectedDuration, setSelectedDuration] = useState<string>(availableDurations[0] || "2 Nights / 3 Days");

  // Find active config for selected duration
  const activeConfig = makkahConfigs.find((c) => c.duration_label === selectedDuration) || makkahConfigs[0];

  // Resolve prices for Double, Triple, Quad
  let doublePrice = 0;
  let triplePrice = 0;
  let quadPrice = 0;

  if (activeConfig && activeConfig.room_prices.length > 0) {
    const d = activeConfig.room_prices.find((r) => r.occupancy_type.toLowerCase() === "double");
    const t = activeConfig.room_prices.find((r) => r.occupancy_type.toLowerCase() === "triple");
    const q = activeConfig.room_prices.find((r) => r.occupancy_type.toLowerCase() === "quad");
    doublePrice = d?.price_aed ?? 0;
    triplePrice = t?.price_aed ?? 0;
    quadPrice = q?.price_aed ?? 0;
  }

  // Fallback to meta pricing if needed
  if (!doublePrice && meta.fallbackPrices[selectedDuration]) {
    doublePrice = meta.fallbackPrices[selectedDuration].double;
    triplePrice = meta.fallbackPrices[selectedDuration].triple;
    quadPrice = meta.fallbackPrices[selectedDuration].quad;
  }

  const startingPrice = quadPrice || triplePrice || doublePrice || pkg.starting_price_aed;

  const makkahHotelName = activeConfig?.makkah_hotel?.name || pkg.makkah_hotel_name || meta.makkahHotel.name;
  const madinahHotelName = pkg.madinah_hotel_name || meta.madinahHotel.name;

  const handleEnquiry = () => {
    if (onOpenEnquiry) {
      onOpenEnquiry({
        name: pkg.title,
        tier: meta.badgeLabel,
        destination: "Makkah & Madinah",
        duration: selectedDuration,
        hotelName: makkahHotelName,
        hotelRating: meta.makkahHotel.rating,
        shuttleInfo: meta.makkahHotel.access,
        imageUrl: pkg.hero_image_url || meta.defaultPhoto,
        shortDescription: pkg.short_description || pkg.tagline || "",
      });
    }
  };

  return (
    <div
      className={`flex flex-col lg:flex-row overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md ${
        isSignature
          ? "border-[#C9A227] ring-2 ring-[#C9A227]/30"
          : isExclusive
          ? "border-[#1F2937] ring-1 ring-black/10"
          : "border-black/10"
      }`}
    >
      {/* Left Photo Panel with Caption Overlay */}
      <div className="relative h-72 lg:h-auto lg:w-5/12 bg-masaar-black shrink-0 overflow-hidden">
        {pkg.hero_image_url ? (
          <ExternalImage
            src={pkg.hero_image_url}
            alt={`${pkg.title} Umrah package showcase`}
            fill
            sizes="(max-width: 1024px) 100vw, 42vw"
            className="object-cover"
          />
        ) : (
          <Image
            src={meta.defaultPhoto}
            alt={`${pkg.title} Umrah package showcase`}
            fill
            sizes="(max-width: 1024px) 100vw, 42vw"
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-black/70" />

        {/* Caption Overlay */}
        <div className="absolute top-6 left-6 text-white drop-shadow-md">
          <p className="font-[family-name:var(--font-display)] text-xs font-bold tracking-widest uppercase text-white/90">
            {meta.caption}
          </p>
          <div className="mt-1.5 h-0.5 w-8 bg-[#C9A227]" />
        </div>

        {/* Floating Category Tag */}
        <div className="absolute bottom-6 left-6 right-6 text-white text-xs">
          <span className="inline-block rounded-md bg-black/60 px-2.5 py-1 backdrop-blur-xs font-semibold text-light-gold border border-white/10">
            {meta.category}
          </span>
          <p className="mt-2 text-white/80 text-[11px] leading-relaxed line-clamp-2">
            {pkg.short_description || pkg.tagline}
          </p>
        </div>
      </div>

      {/* Right Content Panel */}
      <div className="flex flex-1 flex-col justify-between p-6 sm:p-8 space-y-6">
        <div>
          {/* Badges Row */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white ${
                isExclusive ? "bg-[#111827]" : isSignature ? "bg-[#78350F]" : "bg-[#4A5568]"
              }`}
            >
              {meta.badgeLabel}
            </span>
            {isSignature && (
              <span className="rounded-md bg-[#A87F12] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-2xs">
                MOST CHOSEN
              </span>
            )}
            {meta.haramainTrainIncluded && (
              <span className="rounded-md bg-[#047857] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-2xs">
                🚄 HARAMAIN TRAIN INCLUDED
              </span>
            )}
          </div>

          {/* Title & Tagline */}
          <div className="mt-2.5">
            <h3 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold text-masaar-black">
              {pkg.title}
            </h3>
            <p className="mt-1 text-sm text-masaar-black/70 font-medium">
              {pkg.tagline || "A personalized spiritual journey designed around your comfort."}
            </p>
          </div>

          {/* Verified Hotel & Haram Proximity Section */}
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3.5 rounded-xl border border-black/10 bg-[#FAF7F2] p-4 text-xs">
            {/* Makkah Hotel Card */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-masaar-black">
                <span className="text-base text-[#A87F12]">🕋</span>
                <span>Makkah Stay:</span>
                <span className="text-[11px] font-semibold text-[#8B6E16] bg-[#F5EACB] px-1.5 py-0.5 rounded">
                  {meta.makkahHotel.rating}
                </span>
              </div>
              <p className="font-semibold text-masaar-black pl-5">{makkahHotelName}</p>
              <p className="text-[11px] text-masaar-black/75 pl-5">
                <strong>Distance:</strong> {meta.makkahHotel.distance}
              </p>
              <p className="text-[11px] text-[#2563EB] font-medium pl-5">
                {meta.makkahHotel.access}
              </p>
            </div>

            {/* Madinah Hotel Card */}
            <div className="space-y-1 border-t md:border-t-0 md:border-l border-black/10 pt-3 md:pt-0 md:pl-4">
              <div className="flex items-center gap-1.5 font-bold text-masaar-black">
                <span className="text-base text-[#A87F12]">🕌</span>
                <span>Madinah Stay:</span>
                <span className="text-[11px] font-semibold text-[#8B6E16] bg-[#F5EACB] px-1.5 py-0.5 rounded">
                  {meta.madinahHotel.rating}
                </span>
              </div>
              <p className="font-semibold text-masaar-black pl-5">{madinahHotelName}</p>
              <p className="text-[11px] text-masaar-black/75 pl-5">
                <strong>Distance:</strong> {meta.madinahHotel.distance}
              </p>
              <p className="text-[11px] text-[#059669] font-medium pl-5">
                {meta.madinahHotel.access}
              </p>
            </div>
          </div>

          {/* Transport, Train & Flights Strip */}
          <div className="mt-4 rounded-xl border border-black/10 bg-white p-3.5 space-y-2 text-xs">
            <div className="flex items-start gap-2 text-masaar-black/80">
              <span className="shrink-0 text-sm">🚗</span>
              <div>
                <strong className="text-masaar-black">Transfers:</strong> {meta.transfers}
              </div>
            </div>

            <div className="flex items-start gap-2 text-masaar-black/80">
              <span className="shrink-0 text-sm">🚄</span>
              <div>
                <strong className="text-masaar-black">Makkah–Madinah:</strong>{" "}
                {meta.makkahMadinahTransport}
              </div>
            </div>

            <div className="flex items-start gap-2 text-masaar-black/80">
              <span className="shrink-0 text-sm">✈️</span>
              <div>
                <strong className="text-masaar-black">Return Flights:</strong> {meta.flightsNote}
              </div>
            </div>
          </div>

          {/* Select Duration Segmented Pills */}
          <div className="mt-5 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-masaar-black/60">Select Duration</p>
              <span className="text-[11px] text-masaar-black/50">{meta.departuresInfo}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableDurations.map((dur) => {
                const isActive = dur === selectedDuration;
                return (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => setSelectedDuration(dur)}
                    className={`rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                      isActive
                        ? "bg-[#E6D8B8] text-[#5C450A] shadow-2xs border border-[#C9A227]/40"
                        : "bg-black/5 text-masaar-black/70 hover:bg-black/10 border border-transparent"
                    }`}
                  >
                    {dur}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prices per person breakdown */}
          <div className="mt-5 space-y-2">
            <p className="text-xs text-masaar-black/60 font-medium">Prices per person ({selectedDuration})</p>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-3">
                <div className="rounded-xl border border-black/10 bg-warm-ivory/40 px-3.5 py-2 text-center min-w-[90px]">
                  <p className="text-[10px] font-bold text-masaar-black/60 uppercase">Double</p>
                  <p className="text-sm font-bold text-masaar-black mt-0.5"><Price amountAed={doublePrice} /></p>
                </div>

                <div className="rounded-xl border border-black/10 bg-warm-ivory/40 px-3.5 py-2 text-center min-w-[90px]">
                  <p className="text-[10px] font-bold text-masaar-black/60 uppercase">Triple</p>
                  <p className="text-sm font-bold text-masaar-black mt-0.5"><Price amountAed={triplePrice} /></p>
                </div>

                <div className="rounded-xl border border-black/10 bg-warm-ivory/40 px-3.5 py-2 text-center min-w-[90px]">
                  <p className="text-[10px] font-bold text-masaar-black/60 uppercase">Quad</p>
                  <p className="text-sm font-bold text-masaar-black mt-0.5"><Price amountAed={quadPrice} /></p>
                </div>
              </div>

              {/* "From AED X / person" */}
              <div className="text-right">
                <span className="text-[11px] font-medium text-masaar-black/50">From</span>
                <p className="text-2xl font-bold text-[#A87F12]">
                  {startingPrice ? <Price amountAed={startingPrice} /> : "—"}
                </p>
                <span className="text-[11px] text-masaar-black/60">/ person (Quad)</span>
              </div>
            </div>
          </div>

          {/* Key Inclusions & Exclusions Accordion / Preview */}
          <div className="mt-4 pt-3 border-t border-black/10 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <p className="font-bold text-emerald-800 flex items-center gap-1.5 mb-1.5">
                <span>✓</span> Key Inclusions:
              </p>
              <ul className="space-y-1 text-masaar-black/75 text-[11px]">
                {meta.confirmedServices.slice(0, 3).map((s, i) => (
                  <li key={i} className="line-clamp-1">• {s}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-bold text-rose-800 flex items-center gap-1.5 mb-1.5">
                <span>✕</span> Exclusions:
              </p>
              <ul className="space-y-1 text-masaar-black/65 text-[11px]">
                {meta.exclusions.slice(0, 2).map((e, i) => (
                  <li key={i} className="line-clamp-1">• {e}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Buttons Row */}
        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-black/10">
          <Link
            href={
              monthSlug
                ? `/umrah/departures/${monthSlug}/${pkg.tier}`
                : `/umrah/${pkg.tier}`
            }
            className="rounded-xl border border-black/20 bg-white px-5 py-3 text-center text-xs font-bold text-masaar-black hover:bg-warm-ivory transition-colors"
          >
            View Full Package Details →
          </Link>

          <button
            type="button"
            onClick={handleEnquiry}
            className="inline-flex items-center gap-2 rounded-xl bg-[#A87F12] px-6 py-3 text-center text-xs font-bold text-white shadow-2xs hover:bg-[#936e0f] transition-colors"
          >
            <span>💬</span>
            <span>Enquire on WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
}
