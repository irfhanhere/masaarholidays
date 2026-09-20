"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { PackageRow } from "@/lib/types/database";
import type { PublicUmrahInventoryConfig } from "@/lib/data/public";
import { Container } from "./Container";
import { ExternalImage } from "./ExternalImage";
import type { PackageEnquiryInfo } from "./UmrahEnquiryModal";

interface Props {
  packages: PackageRow[];
  inventoryConfigs: PublicUmrahInventoryConfig[];
  onOpenEnquiry?: (info: PackageEnquiryInfo) => void;
}

const TIER_ORDER: Array<PackageRow["tier"]> = ["essential", "signature", "exclusive"];

const TIER_METADATA: Record<
  PackageRow["tier"],
  {
    caption: string;
    badgeLabel: string;
    defaultPhoto: string;
    hotelShuttleNote: string;
    fallbackPrices: Record<string, { double: number; triple: number; quad: number }>;
  }
> = {
  essential: {
    caption: "A BLESSED BEGINNING",
    badgeLabel: "ESSENTIAL",
    defaultPhoto: "/brand/banners/umrah.png",
    hotelShuttleNote: "24/7 dedicated Haram shuttle",
    fallbackPrices: {
      "2 Nights / 3 Days": { double: 799, triple: 699, quad: 599 },
      "3 Nights / 4 Days": { double: 999, triple: 849, quad: 749 },
      "5 Nights / 6 Days": { double: 1299, triple: 1099, quad: 949 },
    },
  },
  signature: {
    caption: "A MORE MEANINGFUL JOURNEY",
    badgeLabel: "SIGNATURE",
    defaultPhoto: "/trips/PRIVATE-TRIP-MAKKAH-CARD.png",
    hotelShuttleNote: "Walking distance to the Haram",
    fallbackPrices: {
      "2 Nights / 3 Days": { double: 1543, triple: 1302, quad: 1147 },
      "3 Nights / 4 Days": { double: 1890, triple: 1580, quad: 1390 },
      "5 Nights / 6 Days": { double: 2450, triple: 2050, quad: 1790 },
    },
  },
  exclusive: {
    caption: "THE HIGHEST STANDARD OF CARE",
    badgeLabel: "EXCLUSIVE",
    defaultPhoto: "/trips/PRIVATE-TRIP-TRANSPORT.png",
    hotelShuttleNote: "Haram Plaza access",
    fallbackPrices: {
      "2 Nights / 3 Days": { double: 2543, triple: 2102, quad: 1847 },
      "3 Nights / 4 Days": { double: 3100, triple: 2590, quad: 2250 },
      "5 Nights / 6 Days": { double: 3950, triple: 3300, quad: 2890 },
    },
  },
};

export function UmrahTierCards({ packages, inventoryConfigs, onOpenEnquiry }: Props) {
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
            <span>UMRAH PACKAGES</span>
            <span>—</span>
          </div>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold text-masaar-black sm:text-5xl">
            Choose Your Umrah Experience
          </h2>
          <p className="mt-3 text-sm sm:text-base text-masaar-black/70 leading-relaxed">
            Three carefully designed ways to experience Umrah, from practical comfort to uncompromised luxury.
          </p>
        </div>

        {/* 3 Tier Stacked Full-Width Cards */}
        <div className="space-y-8">
          {orderedPackages.map((pkg) => (
            <TierCard
              key={pkg.id}
              pkg={pkg}
              configs={inventoryConfigs.filter((c) => c.package_id === pkg.id)}
              onOpenEnquiry={onOpenEnquiry}
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
}: {
  pkg: PackageRow;
  configs: PublicUmrahInventoryConfig[];
  onOpenEnquiry?: (info: PackageEnquiryInfo) => void;
}) {
  const meta = TIER_METADATA[pkg.tier] || TIER_METADATA.essential;
  const isSignature = pkg.tier === "signature";

  // Makkah-only configs for duration tabs
  const makkahConfigs = configs.filter((c) => c.journey_type === "makkah_only");

  // Determine available durations
  const availableDurations =
    makkahConfigs.length > 0
      ? makkahConfigs.map((c) => c.duration_label)
      : ["2 Nights / 3 Days", "3 Nights / 4 Days", "5 Nights / 6 Days"];

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

  // Fallback to meta mock pricing if database has no entries yet for this duration
  if (!doublePrice && meta.fallbackPrices[selectedDuration]) {
    doublePrice = meta.fallbackPrices[selectedDuration].double;
    triplePrice = meta.fallbackPrices[selectedDuration].triple;
    quadPrice = meta.fallbackPrices[selectedDuration].quad;
  }

  const startingPrice = quadPrice || triplePrice || doublePrice || pkg.starting_price_aed;

  const hotelName = activeConfig?.makkah_hotel?.name || pkg.makkah_hotel_name || "VOCO Makkah";
  const shuttleNote = activeConfig?.makkah_hotel?.shuttle_note || meta.hotelShuttleNote;

  const handleEnquiry = () => {
    if (onOpenEnquiry) {
      onOpenEnquiry({
        name: pkg.title,
        tier: meta.badgeLabel,
        destination: "Makkah",
        duration: selectedDuration,
        hotelName,
        hotelRating: "5-Star accommodation",
        shuttleInfo: shuttleNote,
        imageUrl: pkg.hero_image_url || meta.defaultPhoto,
        shortDescription: pkg.short_description || pkg.tagline || "",
      });
    }
  };

  return (
    <div
      className={`flex flex-col lg:flex-row overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md ${
        isSignature ? "border-[#C9A227] ring-2 ring-[#C9A227]/30" : "border-black/10"
      }`}
    >
      {/* Left Photo Panel with Caption Overlay */}
      <div className="relative h-64 lg:h-auto lg:w-5/12 bg-masaar-black shrink-0 overflow-hidden">
        {pkg.hero_image_url ? (
          <ExternalImage src={pkg.hero_image_url} alt={pkg.title} fill className="object-cover" />
        ) : (
          <Image src={meta.defaultPhoto} alt={pkg.title} fill className="object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-black/60" />

        {/* Caption Overlay */}
        <div className="absolute top-6 left-6 text-white drop-shadow-md">
          <p className="font-[family-name:var(--font-display)] text-xs font-bold tracking-widest uppercase text-white/90">
            {meta.caption}
          </p>
          <div className="mt-1.5 h-0.5 w-8 bg-[#C9A227]" />
        </div>
      </div>

      {/* Right Content Panel */}
      <div className="flex flex-1 flex-col justify-between p-6 sm:p-8 space-y-6">
        <div>
          {/* Badges Row */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-[#4A5568] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
              {meta.badgeLabel}
            </span>
            {isSignature && (
              <span className="rounded-md bg-[#A87F12] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-2xs">
                MOST CHOSEN
              </span>
            )}
          </div>

          {/* Title & Tagline */}
          <h3 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold text-masaar-black">
            {pkg.title}
          </h3>
          <p className="mt-1 text-sm text-masaar-black/70 font-medium">
            {pkg.tagline || "A seamless, budget-smart spiritual experience."}
          </p>

          {/* 3-Icon Meta Row */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 border-y border-black/10 py-3 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="text-base text-[#A87F12]">📍</span>
              <div>
                <p className="font-bold text-masaar-black">Makkah</p>
                <p className="text-[11px] text-masaar-black/60">{hotelName} (or similar)</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="text-base text-[#A87F12]">📅</span>
              <div>
                <p className="font-bold text-masaar-black">2 – 5 Nights</p>
                <p className="text-[11px] text-masaar-black/60">Makkah only</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="text-base text-[#A87F12]">🏨</span>
              <div>
                <p className="font-bold text-masaar-black">{shuttleNote}</p>
              </div>
            </div>
          </div>

          {/* Select Duration Segmented Pills */}
          <div className="mt-5 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-masaar-black/60">Select Duration</p>
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

          {/* Prices per person */}
          <div className="mt-5 space-y-2">
            <p className="text-xs text-masaar-black/60 font-medium">Prices per person ({selectedDuration})</p>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-3">
                <div className="rounded-xl border border-black/10 bg-warm-ivory/30 px-4 py-2.5 text-center min-w-[100px]">
                  <p className="text-[10px] font-bold text-masaar-black/60 uppercase">Double</p>
                  <p className="text-sm font-bold text-masaar-black mt-0.5">AED {doublePrice.toLocaleString()}</p>
                </div>

                <div className="rounded-xl border border-black/10 bg-warm-ivory/30 px-4 py-2.5 text-center min-w-[100px]">
                  <p className="text-[10px] font-bold text-masaar-black/60 uppercase">Triple</p>
                  <p className="text-sm font-bold text-masaar-black mt-0.5">AED {triplePrice.toLocaleString()}</p>
                </div>

                <div className="rounded-xl border border-black/10 bg-warm-ivory/30 px-4 py-2.5 text-center min-w-[100px]">
                  <p className="text-[10px] font-bold text-masaar-black/60 uppercase">Quad</p>
                  <p className="text-sm font-bold text-masaar-black mt-0.5">AED {quadPrice.toLocaleString()}</p>
                </div>
              </div>

              {/* "From AED X / person" */}
              <div className="text-right">
                <span className="text-[11px] font-medium text-masaar-black/50">From</span>
                <p className="text-2xl font-bold text-[#A87F12]">
                  AED {startingPrice ? startingPrice.toLocaleString() : "—"}
                </p>

                <span className="text-[11px] text-masaar-black/60">/ person</span>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons Row */}
        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-black/10">
          <Link
            href={`/umrah/${pkg.slug}`}
            className="rounded-xl border border-black/20 bg-white px-5 py-3 text-center text-xs font-bold text-masaar-black hover:bg-warm-ivory transition-colors"
          >
            View Details →
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
