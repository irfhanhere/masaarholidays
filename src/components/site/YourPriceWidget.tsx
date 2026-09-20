"use client";

import { useState } from "react";
import Link from "next/link";

interface Props {
  doublePrice?: number;
  triplePrice?: number;
  quadPrice?: number;
  packageSlug?: string;
  onOpenEnquiry?: () => void;
  /** Hide the "View Details" button — for use on the package detail page itself, where linking to the current page is redundant. */
  hideViewDetails?: boolean;
}

export function YourPriceWidget({
  doublePrice = 799,
  triplePrice = 699,
  quadPrice = 599,
  packageSlug,
  onOpenEnquiry,
  hideViewDetails = false,
}: Props) {
  const [selectedOccupancy, setSelectedOccupancy] = useState<"Double" | "Triple" | "Quad">("Quad");

  const WHATSAPP_NUMBER = "971552276299";
  const defaultMessage = encodeURIComponent(
    `Assalamu Alaikum,\n\nI'm interested in booking with ${selectedOccupancy} occupancy.\n\nPlease share current pricing and availability.\n\nJazakAllah Khair.`
  );

  return (
    <div className="rounded-3xl border border-black/10 bg-white p-6 sm:p-8 shadow-sm space-y-6 max-w-xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black">
              Your Price
            </h3>
            <span className="text-masaar-black/40">—</span>
          </div>
          <p className="text-xs text-masaar-black/60 font-medium">Per Person</p>
        </div>

        <div className="flex items-center gap-2 text-right">
          <span className="text-lg">👥</span>
          <div>
            <p className="text-[11px] font-bold text-masaar-black">Choose your</p>
            <p className="text-[10px] text-masaar-black/60">preferred occupancy</p>
          </div>
        </div>
      </div>

      {/* Occupancy Segmented Buttons */}
      <div className="grid grid-cols-3 gap-2 rounded-xl bg-warm-ivory/50 p-1.5 border border-black/5">
        {(["Double", "Triple", "Quad"] as const).map((type) => {
          const isSelected = selectedOccupancy === type;
          const icon = type === "Double" ? "👤" : type === "Triple" ? "👥" : "👥👥";
          return (
            <button
              key={type}
              type="button"
              onClick={() => setSelectedOccupancy(type)}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-bold transition-all ${
                isSelected
                  ? "bg-[#A87F12] text-white shadow-2xs"
                  : "text-masaar-black/70 hover:bg-black/5"
              }`}
            >
              <span>{icon}</span>
              <span>{type}</span>
            </button>
          );
        })}
      </div>

      {/* List of Occupancy Options */}
      <div className="space-y-3">
        {/* Double */}
        <div
          onClick={() => setSelectedOccupancy("Double")}
          className={`flex items-center justify-between rounded-xl border p-4 cursor-pointer transition-all ${
            selectedOccupancy === "Double"
              ? "border-[#A87F12] bg-[#A87F12]/5 ring-1 ring-[#A87F12]"
              : "border-black/10 bg-white hover:bg-warm-ivory/30"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">🛏️</span>
            <div>
              <p className="text-sm font-bold text-masaar-black">Double</p>
              <p className="text-[11px] text-masaar-black/55">2 people per room</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-base font-bold text-masaar-black">AED {doublePrice.toLocaleString()}</p>
            <p className="text-[10px] text-masaar-black/55">/ person</p>
          </div>
        </div>

        {/* Triple */}
        <div
          onClick={() => setSelectedOccupancy("Triple")}
          className={`flex items-center justify-between rounded-xl border p-4 cursor-pointer transition-all ${
            selectedOccupancy === "Triple"
              ? "border-[#A87F12] bg-[#A87F12]/5 ring-1 ring-[#A87F12]"
              : "border-black/10 bg-white hover:bg-warm-ivory/30"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">🛏️</span>
            <div>
              <p className="text-sm font-bold text-masaar-black">Triple</p>
              <p className="text-[11px] text-masaar-black/55">3 people per room</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-base font-bold text-masaar-black">AED {triplePrice.toLocaleString()}</p>
            <p className="text-[10px] text-masaar-black/55">/ person</p>
          </div>
        </div>

        {/* Quad */}
        <div
          onClick={() => setSelectedOccupancy("Quad")}
          className={`flex items-center justify-between rounded-xl border p-4 cursor-pointer transition-all ${
            selectedOccupancy === "Quad"
              ? "border-[#A87F12] bg-[#A87F12]/5 ring-1 ring-[#A87F12]"
              : "border-black/10 bg-white hover:bg-warm-ivory/30"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">🛏️</span>
            <div>
              <p className="text-sm font-bold text-masaar-black">Quad</p>
              <p className="text-[11px] text-masaar-black/55">4 people per room</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-base font-bold text-masaar-black">AED {quadPrice.toLocaleString()}</p>
            <p className="text-[10px] text-masaar-black/55">/ person</p>
          </div>
        </div>
      </div>

      {/* Starting from / Best Value Box */}
      <div className="flex items-center justify-between rounded-2xl border border-black/10 bg-warm-ivory/60 p-4">
        <div>
          <p className="text-[10px] uppercase font-bold text-masaar-black/50">Starting from</p>
          <p className="text-2xl font-bold text-[#A87F12]">
            AED {quadPrice.toLocaleString()}{" "}
            <span className="text-xs font-normal text-masaar-black/60">/ person</span>
          </p>
        </div>

        <div className="flex items-center gap-2 text-right border-l border-black/10 pl-4">
          <span className="text-lg">🏷️</span>
          <div>
            <p className="text-xs font-bold text-masaar-black">Best value</p>
            <p className="text-[10px] text-masaar-black/55">For a comfortable journey</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className={`grid gap-3 pt-2 ${hideViewDetails ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"}`}>
        {!hideViewDetails &&
          (packageSlug ? (
            <Link
              href={`/umrah/${packageSlug}`}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-black/20 bg-white py-3 text-xs font-bold text-masaar-black hover:bg-warm-ivory transition-colors"
            >
              <span>👁️</span>
              <span>View Details →</span>
            </Link>
          ) : (
            <button
              type="button"
              className="flex items-center justify-center gap-1.5 rounded-xl border border-black/20 bg-white py-3 text-xs font-bold text-masaar-black hover:bg-warm-ivory transition-colors"
            >
              <span>👁️</span>
              <span>View Details →</span>
            </button>
          ))}

        {onOpenEnquiry ? (
          <button
            type="button"
            onClick={onOpenEnquiry}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-[#A87F12] py-3 text-xs font-bold text-white shadow-2xs hover:bg-[#936e0f] transition-colors"
          >
            <span>💬</span>
            <span>Enquire on WhatsApp →</span>
          </button>
        ) : (
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${defaultMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 rounded-xl bg-[#A87F12] py-3 text-xs font-bold text-white shadow-2xs hover:bg-[#936e0f] transition-colors"
          >
            <span>💬</span>
            <span>Enquire on WhatsApp →</span>
          </a>
        )}
      </div>

      {/* Bottom Trust Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-t border-black/10 pt-4 text-[10px] text-masaar-black/60 text-center">
        <div>
          <p className="font-bold text-masaar-black">✓ Verified Hotels</p>
          <p>Trusted stays</p>
        </div>
        <div>
          <p className="font-bold text-masaar-black">✓ Private Transfers</p>
          <p>Hassle-free travel</p>
        </div>
        <div>
          <p className="font-bold text-masaar-black">✓ 24/7 Support</p>
          <p>We&apos;re always here</p>
        </div>
        <div>
          <p className="font-bold text-masaar-black">✓ Spiritual Journey</p>
          <p>With peace of mind</p>
        </div>
      </div>
    </div>
  );
}
