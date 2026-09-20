"use client";

import { useState } from "react";
import type { PackageRow } from "@/lib/types/database";
import { UmrahEnquiryModal, type PackageEnquiryInfo } from "./UmrahEnquiryModal";
import { WhatsAppGlyph } from "./WhatsAppButton";

const TIER_LABEL: Record<PackageRow["tier"], string> = {
  essential: "Essential",
  signature: "Signature",
  exclusive: "Exclusive",
};

/**
 * The same "Occupancy → Optional → Choose Private Trips" WhatsApp enquiry
 * popup used across the Umrah page (UmrahEnquiryModal), wired up as a
 * standalone button for package cards outside the Umrah landing page
 * (Hajj, Home) — those pages don't have a shared parent tracking modal
 * state, so this owns it locally instead of going through onOpenEnquiry.
 */
export function PackageEnquiryTrigger({
  pkg,
  hotelName,
  destination,
  duration,
  shuttleInfo,
  fallbackImageUrl,
  className = "",
  variant = "solid",
}: {
  pkg: PackageRow;
  /** Overrides pkg.makkah_hotel_name / pkg.madinah_hotel_name when the caller has already resolved a more specific hotel (e.g. from a selected duration config). */
  hotelName?: string;
  destination?: string;
  duration?: string;
  shuttleInfo?: string;
  fallbackImageUrl?: string;
  className?: string;
  variant?: "solid" | "outline";
}) {
  const [isOpen, setIsOpen] = useState(false);

  const info: PackageEnquiryInfo = {
    name: pkg.title,
    tier: TIER_LABEL[pkg.tier],
    destination: destination || pkg.city_destination || "Makkah",
    duration: duration || pkg.duration_label || `${pkg.duration_days} Days`,
    hotelName: hotelName || pkg.makkah_hotel_name || pkg.madinah_hotel_name || "Handpicked hotel",
    hotelRating: "5-Star accommodation",
    shuttleInfo: shuttleInfo || pkg.makkah_hotel_access_tag || pkg.madinah_hotel_access_tag || undefined,
    imageUrl: pkg.hero_image_url || fallbackImageUrl,
    shortDescription: pkg.short_description || pkg.tagline || undefined,
  };

  const base =
    "inline-flex items-center justify-center gap-2 rounded-md px-5 py-3 text-sm font-semibold transition-colors cursor-pointer";
  const styles =
    variant === "solid"
      ? "bg-pure-gold text-masaar-black hover:bg-light-gold"
      : "border border-masaar-black text-masaar-black hover:bg-masaar-black hover:text-white";

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)} className={`${base} ${styles} ${className}`}>
        <WhatsAppGlyph />
        Enquire on WhatsApp
      </button>
      <UmrahEnquiryModal isOpen={isOpen} onClose={() => setIsOpen(false)} packageInfo={info} />
    </>
  );
}
