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
  defaultMonthSlug: string | null;
}

const DURATIONS = [
  { label: "4N / 5D", days: 5, nights: 4, desc: "A concise spiritual immersion across both holy sanctuaries." },
  { label: "5N / 6D", days: 6, nights: 5, desc: "A comfortable split between Makkah devotion and Madinah peace." },
  { label: "6N / 7D", days: 7, nights: 6, desc: "A balanced journey of comfort, spirituality and discovery." },
  { label: "7N / 8D", days: 8, nights: 7, desc: "Generous time for prayers, Rawdah ziyarah, and reflection." },
  { label: "8N / 9D", days: 9, nights: 8, desc: "Deep spiritual renewal with unhurried visits and rest." },
  { label: "9N / 10D", days: 10, nights: 9, desc: "Comprehensive pilgrimage experience with guided sightseeing." },
  { label: "10N / 11D", days: 11, nights: 10, desc: "Extended sacred stay with luxury amenities and private transport." },
];

const TIER_DEFAULTS = {
  essential: {
    makkahHotel: "VOCO Makkah",
    madinahHotel: "Crowne Plaza Madinah",
    basePrice: 1850,
  },
  signature: {
    makkahHotel: "Jabal Omar Marriott",
    madinahHotel: "Millennium Taiba",
    basePrice: 2217,
  },
  exclusive: {
    makkahHotel: "Dar Al Tawheed InterContinental",
    madinahHotel: "The Oberoi Madinah",
    basePrice: 3890,
  },
};

export function UmrahMakkahMadinahSection({ packages, inventoryConfigs, onOpenEnquiry, defaultMonthSlug }: Props) {
  const [selectedTier, setSelectedTier] = useState<"essential" | "signature" | "exclusive">("signature");
  const [selectedDuration, setSelectedDuration] = useState("6N / 7D");

  const currentDurationInfo = DURATIONS.find((d) => d.label === selectedDuration) || DURATIONS[2];

  // Find corresponding package
  const pkg = packages.find((p) => p.tier === selectedTier) || packages[0];

  // Look for a published Makkah+Madinah config matching tier & duration
  const mmConfigs = inventoryConfigs.filter(
    (c) => c.package?.tier === selectedTier && c.journey_type === "makkah_madinah"
  );
  const matchedConfig = mmConfigs.find(
    (c) => c.duration_nights === currentDurationInfo.nights || c.duration_label.includes(selectedDuration)
  ) || mmConfigs[0];

  const tierDefaults = TIER_DEFAULTS[selectedTier];
  const makkahHotel = matchedConfig?.makkah_hotel?.name || tierDefaults.makkahHotel;
  const madinahHotel = matchedConfig?.madinah_hotel?.name || tierDefaults.madinahHotel;
  const price = matchedConfig?.min_price_aed || tierDefaults.basePrice;

  const handleEnquiry = () => {
    if (onOpenEnquiry && pkg) {
      onOpenEnquiry({
        name: `${pkg.title} (Makkah + Madinah)`,
        tier: selectedTier.toUpperCase(),
        destination: "Makkah + Madinah",
        duration: currentDurationInfo.label,
        hotelName: `${makkahHotel} & ${madinahHotel}`,
        hotelRating: "5-Star accommodation",
        shuttleInfo: "Private intercity & Haram transport",
        imageUrl: pkg.hero_image_url || "/trips/PRIVATE-TRIP-MADINAH-CARD.png",
        shortDescription: currentDurationInfo.desc,
      });
    }
  };

  return (
    <section className="py-16 bg-[#FAF7F2] border-t border-black/10">
      <Container className="space-y-10">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#A87F12]">
              <span>—</span>
              <span>OR MAKE YOUR JOURNEY A LITTLE LONGER</span>
              <span>—</span>
            </div>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold text-masaar-black sm:text-5xl">
              Makkah + Madinah
            </h2>
            <p className="mt-2 text-sm sm:text-base text-masaar-black/70 max-w-xl">
              Experience the spiritual and historical beauty of both holy cities.
            </p>
          </div>

          <div className="hidden lg:block text-right text-masaar-black/60">
            <p className="font-[family-name:var(--font-display)] text-sm font-semibold tracking-wide">
              Two Sacred Cities,<br />One Deeper Journey
            </p>
            <div className="mt-1 h-0.5 w-6 ml-auto bg-[#C9A227]" />
          </div>
        </div>

        {/* 2-Column Main Card */}
        <div className="grid gap-8 lg:grid-cols-12 items-stretch">
          {/* Left Column: Madinah Green Dome Portrait Photo */}
          <div className="relative min-h-[350px] lg:col-span-4 rounded-2xl overflow-hidden bg-masaar-black shadow-sm">
            <Image
              src="/trips/PRIVATE-TRIP-MADINAH-CARD.png"
              alt="Prophet's Mosque in Madinah"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            <div className="absolute top-6 left-6 text-white drop-shadow-md">
              <p className="font-[family-name:var(--font-display)] text-lg font-bold leading-snug">
                More Moments.<br />A Deeper<br />Meaning.
              </p>
              <div className="mt-2 h-0.5 w-8 bg-[#C9A227]" />
            </div>
          </div>

          {/* Right Column: Interactive Card */}
          <div className="lg:col-span-8 flex flex-col justify-between rounded-2xl border border-black/10 bg-white p-6 sm:p-8 shadow-sm space-y-6">
            <div className="space-y-6">
              {/* Selectors Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/10 pb-6">
                <div>
                  <p className="text-xs font-bold text-masaar-black mb-2 uppercase tracking-wider">Select Your Package</p>
                  <div className="flex flex-wrap gap-2">
                    {(["essential", "signature", "exclusive"] as const).map((tier) => {
                      const isActive = selectedTier === tier;
                      return (
                        <button
                          key={tier}
                          type="button"
                          onClick={() => setSelectedTier(tier)}
                          className={`rounded-lg px-4 py-2 text-xs font-bold capitalize transition-all ${
                            isActive
                              ? "bg-[#A87F12] text-white shadow-2xs"
                              : "bg-black/5 text-masaar-black/70 hover:bg-black/10"
                          }`}
                        >
                          {tier}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-masaar-black mb-2 uppercase tracking-wider">Choose Your Duration</p>
                  <div className="flex flex-wrap gap-1.5">
                    {DURATIONS.map((dur) => {
                      const isActive = selectedDuration === dur.label;
                      return (
                        <button
                          key={dur.label}
                          type="button"
                          onClick={() => setSelectedDuration(dur.label)}
                          className={`rounded-md px-2.5 py-1.5 text-xs font-bold transition-all ${
                            isActive
                              ? "bg-[#A87F12] text-white shadow-2xs"
                              : "bg-black/5 text-masaar-black/65 hover:bg-black/10"
                          }`}
                        >
                          {dur.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Active Info Block */}
              <div className="space-y-4">
                <div>
                  <span className="rounded bg-[#A87F12] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    {selectedTier}
                  </span>
                  <h3 className="mt-1.5 font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black">
                    {currentDurationInfo.nights} Nights / {currentDurationInfo.days} Days
                  </h3>
                  <p className="text-xs text-masaar-black/65 font-medium mt-0.5">{currentDurationInfo.desc}</p>
                </div>

                {/* Hotels Block with Thumbnails */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center rounded-xl border border-black/10 bg-warm-ivory/30 p-4">
                  <div className="sm:col-span-5 flex items-center gap-3">
                    <div className="relative size-12 rounded-lg overflow-hidden shrink-0 bg-black/10">
                      <Image src="/brand/banners/umrah.png" alt={makkahHotel} fill className="object-cover" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-[#A87F12]">Makkah</p>
                      <p className="text-xs font-bold text-masaar-black">{makkahHotel}</p>
                      <p className="text-[10px] text-masaar-black/50">(or similar)</p>
                    </div>
                  </div>

                  <div className="sm:col-span-5 flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-black/10 pt-3 sm:pt-0 sm:pl-4">
                    <div className="relative size-12 rounded-lg overflow-hidden shrink-0 bg-black/10">
                      <Image src="/trips/PRIVATE-TRIP-MADINAH-CARD.png" alt={madinahHotel} fill className="object-cover" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-[#A87F12]">Madinah</p>
                      <p className="text-xs font-bold text-masaar-black">{madinahHotel}</p>
                      <p className="text-[10px] text-masaar-black/50">(or similar)</p>
                    </div>
                  </div>

                  <div className="sm:col-span-2 text-right border-t sm:border-t-0 border-black/10 pt-2 sm:pt-0">
                    <p className="text-[10px] text-masaar-black/50">From</p>
                    <p className="text-xl font-bold text-[#A87F12]">AED {price.toLocaleString()}</p>
                    <p className="text-[10px] text-masaar-black/60">/ person</p>
                  </div>
                </div>

                {/* 4 Trust Icons */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-base text-[#A87F12]">🏨</span>
                    <div>
                      <p className="font-bold text-masaar-black">Premium hotels</p>
                      <p className="text-[10px] text-masaar-black/55">in both cities</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-base text-[#A87F12]">🚗</span>
                    <div>
                      <p className="font-bold text-masaar-black">Private transfers</p>
                      <p className="text-[10px] text-masaar-black/55">between cities</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-base text-[#A87F12]">🕌</span>
                    <div>
                      <p className="font-bold text-masaar-black">Guided ziyarat</p>
                      <p className="text-[10px] text-masaar-black/55">in Makkah & Madinah</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-base text-[#A87F12]">🎧</span>
                    <div>
                      <p className="font-bold text-masaar-black">24/7 guest support</p>
                      <p className="text-[10px] text-masaar-black/55">throughout your journey</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Buttons Row */}
            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-black/10">
              {pkg && (
                <Link
                  href={
                    defaultMonthSlug && matchedConfig
                      ? `/umrah/departures/${defaultMonthSlug}/${selectedTier}?duration=${matchedConfig.duration_nights}&occupancy=Double`
                      : `/umrah/${pkg.slug}`
                  }
                  className="rounded-xl border border-black/20 bg-white px-5 py-3 text-center text-xs font-bold text-masaar-black hover:bg-warm-ivory transition-colors"
                >
                  View Journey Details →
                </Link>
              )}

              <button
                type="button"
                onClick={handleEnquiry}
                className="inline-flex items-center gap-2 rounded-xl bg-[#A87F12] px-6 py-3 text-center text-xs font-bold text-white shadow-2xs hover:bg-[#936e0f] transition-colors"
              >
                <span>💬</span>
                <span>Enquire on WhatsApp →</span>
              </button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
