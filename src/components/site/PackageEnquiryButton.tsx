"use client";

import { useState } from "react";
import { WhatsAppGlyph } from "./WhatsAppButton";
import { UmrahEnquiryModal } from "./UmrahEnquiryModal";

export function PackageEnquiryButton({
  packageTitle,
  tier,
  duration,
  departureMonth,
  configurationId,
  journeyType,
  variant = "solid",
  className = "",
}: {
  packageTitle: string;
  tier: string;
  duration: string;
  departureMonth?: string;
  configurationId?: string;
  journeyType?: string;
  variant?: "solid" | "outline";
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  const base =
    "inline-flex items-center justify-center gap-2 rounded-md px-5 py-3 text-sm font-semibold transition-colors cursor-pointer";
  const styles =
    variant === "solid"
      ? "bg-pure-gold text-masaar-black hover:bg-light-gold"
      : "border border-masaar-black text-masaar-black hover:bg-masaar-black hover:text-white";

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`${base} ${styles} ${className}`}>
        <WhatsAppGlyph />
        Enquire on WhatsApp
      </button>
      <UmrahEnquiryModal
        isOpen={open}
        onClose={() => setOpen(false)}
        packageInfo={{
          name: packageTitle,
          tier: tier,
          duration: duration,
          destination: journeyType === "makkah_madinah" ? "Makkah + Madinah" : "Makkah",
          hotelName: "Handpicked 5-Star Hotel",
          hotelRating: "5-Star accommodation",
          imageUrl: "/brand/banners/umrah.webp",
          shortDescription: "Thoughtfully planned pilgrimage journey with comfortable accommodation, verified transfers, and dedicated support.",
        }}
      />
    </>
  );
}
