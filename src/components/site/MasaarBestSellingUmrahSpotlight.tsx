import React from "react";
import Link from "next/link";
import { CONTACT } from "@/lib/contact";
import {
  TrainIcon,
  PlaneIcon,
  CompassIcon,
  DocumentIcon,
  FamilyIcon,
  CheckIcon,
  CarIcon,
  BedIcon,
} from "@/components/site/icons";
import type { PremiumPackage } from "@/lib/types/premium-package";
import { DEFAULT_BEST_SELLING_PACKAGE } from "@/lib/data/best-selling-package-catalog";

interface Props {
  pkg?: PremiumPackage;
}

export function MasaarBestSellingUmrahSpotlight({ pkg = DEFAULT_BEST_SELLING_PACKAGE }: Props) {
  const whatsappUrl = `https://wa.me/${CONTACT.whatsappPhoneIntl}?text=${encodeURIComponent(
    `Assalamu Alaikum Masaar Holidays, I am interested in the ${pkg.title} (${pkg.duration_days} Days / ${pkg.duration_nights} Nights). Please share availability, room options, and package details.`
  )}`;

  const makkahHotel = pkg.hotels.find((h) => h.city.toLowerCase() === "makkah") || pkg.hotels[0];
  const madinahHotel = pkg.hotels.find((h) => h.city.toLowerCase() === "madinah") || pkg.hotels[1];

  const quadPrice = pkg.pricing.find((p) => p.room_type.toLowerCase().includes("quad"))?.price_aed ?? 3900;
  const triplePrice = pkg.pricing.find((p) => p.room_type.toLowerCase().includes("triple"))?.price_aed ?? 4100;
  const doublePrice = pkg.pricing.find((p) => p.room_type.toLowerCase().includes("double"))?.price_aed ?? 4500;
  const singlePrice = pkg.pricing.find((p) => p.room_type.toLowerCase().includes("single"))?.price_aed ?? 6400;
  const childPrice = pkg.pricing.find((p) => p.room_type.toLowerCase().includes("child"))?.price_aed ?? 2700;

  return (
    <div className="relative mb-10 overflow-hidden rounded-2xl border-2 border-pure-gold/50 bg-gradient-to-br from-white via-white to-warm-ivory p-6 shadow-md sm:p-8">
      {/* Top Banner Tag */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 pb-4">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-pure-gold px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-masaar-black shadow-xs">
            ★ BEST SELLING
          </span>
          <span className="text-xs font-semibold text-deep-gold">
            Most Chosen Package from UAE
          </span>
        </div>
        <span className="rounded bg-black/5 px-2.5 py-1 text-xs font-medium text-masaar-black/70">
          ⏱️ {pkg.duration_days} Days / {pkg.duration_nights} Nights
        </span>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
        {/* Main Details */}
        <div className="lg:col-span-7">
          <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black sm:text-3xl">
            {pkg.title}
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-masaar-black/75 sm:text-sm">
            {pkg.short_description}
          </p>

          {/* Stays: Makkah & Madinah clearly displayed with nights */}
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs text-masaar-black/80">
            {/* Makkah */}
            <div className="rounded-xl border border-black/10 bg-white/80 p-3.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-deep-gold">
                  Makkah ({makkahHotel.nights} Nights)
                </p>
                <span className="text-[10px] text-masaar-black/50 font-medium">Hotel Stay</span>
              </div>
              <p className="mt-1 font-bold text-masaar-black text-sm">{makkahHotel.hotel_name}</p>
              <p className="text-[11px] text-masaar-black/60 mt-0.5">
                {makkahHotel.distance_note || "DoubleTree by Hilton Makkah (3 Nights Stay)"}
              </p>
            </div>

            {/* Madinah */}
            <div className="rounded-xl border border-black/10 bg-white/80 p-3.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-deep-gold">
                  Madinah ({madinahHotel.nights} Nights)
                </p>
                <span className="text-[10px] text-masaar-black/50 font-medium">Hotel Stay</span>
              </div>
              <p className="mt-1 font-bold text-masaar-black text-sm">{madinahHotel.hotel_name}</p>
              <p className="text-[11px] text-masaar-black/60 mt-0.5">
                {madinahHotel.distance_note || "Worth Tharawat Hotel (2 Nights Stay)"}
              </p>
            </div>
          </div>

          {/* Confirmed Package Inclusions */}
          <div className="mt-5 border-t border-black/5 pt-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-masaar-black/50 mb-2.5">
              Included In This Journey:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <span className="flex items-center gap-2 text-masaar-black/80">
                <PlaneIcon className="size-3.5 text-deep-gold shrink-0" />
                <span>1. Flights Included</span>
              </span>
              <span className="flex items-center gap-2 text-masaar-black/80">
                <BedIcon className="size-3.5 text-deep-gold shrink-0" />
                <span>2. Hotels (DoubleTree &amp; Worth Tharawat)</span>
              </span>
              <span className="flex items-center gap-2 text-masaar-black/80">
                <CheckIcon className="size-3.5 text-deep-gold shrink-0" />
                <span>3. Daily Breakfast</span>
              </span>
              <span className="flex items-center gap-2 text-masaar-black/80">
                <CarIcon className="size-3.5 text-deep-gold shrink-0" />
                <span>4. Airport Transfers</span>
              </span>
              <span className="flex items-center gap-2 rounded-md bg-emerald-50 px-2 py-1 font-semibold text-emerald-900 border border-emerald-200/80">
                <TrainIcon className="size-3.5 text-emerald-700 shrink-0" />
                <span>5. Makkah to Madinah Transfer</span>
              </span>
              <span className="flex items-center gap-2 text-masaar-black/80">
                <DocumentIcon className="size-3.5 text-deep-gold shrink-0" />
                <span>6. Saudi Visa Processing</span>
              </span>
              <span className="flex items-center gap-2 text-masaar-black/80">
                <span className="text-deep-gold font-bold">♿</span>
                <span>7. Wheelchair Assistance</span>
              </span>
              <span className="flex items-center gap-2 text-masaar-black/80">
                <FamilyIcon className="size-3.5 text-deep-gold shrink-0" />
                <span>8. Umrah Guide Assistance</span>
              </span>
            </div>
          </div>

          {/* Complimentary eSIM Highlight */}
          <div className="mt-4 rounded-xl border border-emerald-200/70 bg-emerald-50/50 p-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-900">
                <span className="flex size-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] text-white">✓</span>
                <span>Complimentary Saudi eSIM Included</span>
              </span>
              <span className="rounded-full bg-emerald-600/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                Free High-Speed Data
              </span>
            </div>
            <p className="mt-1 text-[11px] text-masaar-black/70">
              Stay connected effortlessly from arrival with complimentary Saudi mobile data for every pilgrim.
            </p>
          </div>
        </div>

        {/* Pricing Summary & Action */}
        <div className="rounded-xl border border-black/10 bg-warm-ivory/60 p-5 lg:col-span-5 text-center sm:text-left flex flex-col justify-between">
          <div>
            <div className="flex items-baseline justify-between border-b border-black/10 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-pure-gold block">
                  Best Value Pricing
                </span>
                <span className="text-xs font-semibold text-masaar-black/70">Starting From</span>
              </div>
              <div className="text-right">
                <span className="font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black sm:text-3xl">
                  AED {quadPrice.toLocaleString()}
                </span>
                <span className="block text-[10px] text-masaar-black/60">per person (Quad Room)</span>
              </div>
            </div>

            {/* Room-wise pricing breakdown */}
            <div className="mt-3 space-y-1.5 text-xs text-masaar-black/75">
              <div className="flex justify-between items-center py-1 border-b border-black/5">
                <span className="font-medium">Quad Room:</span>
                <span className="font-bold text-masaar-black">AED {quadPrice.toLocaleString()} <span className="text-[10px] font-normal text-black/50">/ person</span></span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-black/5">
                <span className="font-medium">Triple Room:</span>
                <span className="font-bold text-masaar-black">AED {triplePrice.toLocaleString()} <span className="text-[10px] font-normal text-black/50">/ person</span></span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-black/5">
                <span className="font-medium">Double Room:</span>
                <span className="font-bold text-masaar-black">AED {doublePrice.toLocaleString()} <span className="text-[10px] font-normal text-black/50">/ person</span></span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-black/5">
                <span className="font-medium">Single Room:</span>
                <span className="font-bold text-masaar-black">AED {singlePrice.toLocaleString()} <span className="text-[10px] font-normal text-black/50">/ person</span></span>
              </div>
              <div className="flex justify-between items-center py-1 bg-amber-50/60 rounded px-1 text-[11px] text-amber-900 font-medium">
                <span>Child with Bed:</span>
                <span className="font-bold">AED {childPrice.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            <Link
              href="/umrah/masaar-best-selling-umrah"
              className="inline-flex w-full items-center justify-center rounded-md bg-masaar-black py-2.5 px-4 text-xs font-semibold text-white shadow hover:bg-black/90 transition-all"
            >
              View Full Package &amp; Itinerary →
            </Link>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center rounded-md border border-pure-gold bg-pure-gold/15 py-2 px-4 text-xs font-bold text-masaar-black hover:bg-pure-gold/25 transition-all"
            >
              Enquire on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
