"use client";

import { useState } from "react";
import Image from "next/image";
import { ExternalImage } from "./ExternalImage";

export interface PackageEnquiryInfo {
  name: string;
  tier?: string;
  destination: string;
  duration: string;
  hotelName: string;
  hotelRating?: string;
  boardBasis?: string;
  shuttleInfo?: string;
  imageUrl?: string | null;
  shortDescription?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  packageInfo: PackageEnquiryInfo;
  initialAddon?: string;
}

const WHATSAPP_NUMBER = "971557329320"; // Official UAE Masaar number from header

export function UmrahEnquiryModal({ isOpen, onClose, packageInfo, initialAddon }: Props) {
  const [occupancy, setOccupancy] = useState<"Double" | "Triple" | "Quad">("Quad");
  const [flightNeeded, setFlightNeeded] = useState(false);
  const [transfersNeeded, setTransfersNeeded] = useState(false);
  const [visaNeeded, setVisaNeeded] = useState(false);
  const [extraNights, setExtraNights] = useState(false);
  const [hotelPreference, setHotelPreference] = useState(false);
  const [addonPrivateTrip, setAddonPrivateTrip] = useState(false);

  const [selectedTrips, setSelectedTrips] = useState<string[]>([]);

  // Apply initial addon if passed — a render-time adjustment (not an
  // effect) reacting to initialAddon changing, per React's "adjusting
  // state when a prop changes" pattern.
  const [prevInitialAddon, setPrevInitialAddon] = useState(initialAddon);
  if (initialAddon !== prevInitialAddon) {
    setPrevInitialAddon(initialAddon);
    if (initialAddon) {
      if (initialAddon.toLowerCase().includes("visa")) setVisaNeeded(true);
      if (initialAddon.toLowerCase().includes("flight")) setFlightNeeded(true);
      if (initialAddon.toLowerCase().includes("transfer")) setTransfersNeeded(true);
      if (initialAddon.toLowerCase().includes("sightseeing") || initialAddon.toLowerCase().includes("ziyarat")) {
        setAddonPrivateTrip(true);
        if (initialAddon.toLowerCase().includes("madinah")) {
          setSelectedTrips((prev) => Array.from(new Set([...prev, "Private Madinah Sightseeing"])));
        } else {
          setSelectedTrips((prev) => Array.from(new Set([...prev, "Private Makkah Sightseeing"])));
        }
      }
    }
  }

  if (!isOpen) return null;

  // Build the exact structured message matching DYNAMIC WHATSAPP MESSAGE.png
  const buildWhatsAppMessage = () => {
    const items: string[] = [];

    // Add selected private trips
    if (addonPrivateTrip || selectedTrips.length > 0) {
      selectedTrips.forEach((trip) => items.push(trip));
    }

    // Add optional services
    if (visaNeeded) items.push("Umrah Visa");
    if (flightNeeded) items.push("Flight Arrangements");
    if (transfersNeeded) items.push("Private Transfers");
    if (extraNights) items.push("Extra Nights");
    if (hotelPreference) items.push("Hotel Room Preference");

    let message = `Assalamu Alaikum,\n\nI'm interested in:\n${packageInfo.name}\n${packageInfo.destination} · ${packageInfo.duration}\n\nOccupancy:\n${occupancy}\n\nHotel:\n${packageInfo.hotelName}`;

    if (items.length > 0) {
      message += `\n\nI'd also like:\n${items.map((it) => `• ${it}`).join("\n")}`;
    }

    message += `\n\nPlease share more details.\n\nJazakAllah Khair.`;
    return message;
  };

  const whatsappMessage = buildWhatsAppMessage();
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`;

  const toggleTrip = (tripName: string) => {
    setSelectedTrips((prev) =>
      prev.includes(tripName) ? prev.filter((t) => t !== tripName) : [...prev, tripName]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div
        className="relative flex w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl md:flex-row max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex size-8 items-center justify-center rounded-full bg-black/5 text-masaar-black/70 hover:bg-black/10 hover:text-masaar-black transition-colors"
          aria-label="Close modal"
        >
          ✕
        </button>

        {/* Left Summary Panel */}
        <div className="w-full md:w-5/12 bg-warm-ivory/40 p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-black/10">
          <div>
            {/* Top Photo */}
            <div className="relative h-44 w-full overflow-hidden rounded-xl bg-masaar-black mb-4">
              {packageInfo.imageUrl ? (
                <ExternalImage
                  src={packageInfo.imageUrl}
                  alt={packageInfo.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <Image
                  src="/brand/banners/umrah.png"
                  alt={packageInfo.name}
                  fill
                  className="object-cover"
                />
              )}
            </div>

            <p className="text-[10px] font-bold uppercase tracking-wider text-deep-gold">Selected Package</p>
            <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black mt-0.5">
              {packageInfo.name}
            </h3>
            <p className="text-xs text-masaar-black/60 mt-0.5 font-medium">
              {packageInfo.destination} · {packageInfo.duration}
            </p>

            <div className="mt-4 space-y-2.5 text-xs text-masaar-black/80">
              <div className="flex items-start gap-2.5">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-deep-gold/15 text-deep-gold">
                  🏨
                </span>
                <div>
                  <p className="font-semibold text-masaar-black">{packageInfo.hotelName}</p>
                  <p className="text-[11px] text-masaar-black/55">{packageInfo.hotelRating || "5-Star accommodation"}</p>
                </div>
              </div>

              {packageInfo.boardBasis && (
                <div className="flex items-start gap-2.5">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-deep-gold/15 text-deep-gold">
                    🍽️
                  </span>
                  <div>
                    <p className="font-medium text-masaar-black">{packageInfo.boardBasis}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2.5">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-deep-gold/15 text-deep-gold">
                  🚌
                </span>
                <div>
                  <p className="font-medium text-masaar-black">
                    {packageInfo.shuttleInfo || "24/7 dedicated Haram shuttle"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 border-t border-black/10 pt-3">
              <p className="text-xs leading-relaxed text-masaar-black/60">
                {packageInfo.shortDescription ||
                  "A simple and comfortable Umrah package designed for a meaningful spiritual journey."}
              </p>
            </div>
          </div>

          {/* Logo Brand Mark */}
          <div className="mt-6 pt-4 border-t border-black/10 flex items-center gap-2 text-deep-gold">
            <span className="font-[family-name:var(--font-display)] text-sm font-bold tracking-wider text-masaar-black">
              MASAAR
            </span>
            <span className="text-[10px] text-masaar-black/50">Faith · Clarity · Care · Peace</span>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="w-full md:w-7/12 p-6 md:p-8 space-y-6">
          <div>
            <h2 id="modal-title" className="font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black">
              Enquire on WhatsApp
            </h2>
            <p className="text-xs text-masaar-black/60 mt-1">
              Share your preferences and we&apos;ll get back to you on WhatsApp with the best options.
            </p>
          </div>

          {/* Step 1: Occupancy */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex size-5 items-center justify-center rounded-full bg-[#A87F12] text-white text-[11px] font-bold">
                1
              </span>
              <h3 className="text-sm font-bold text-masaar-black">Occupancy</h3>
              <span className="text-xs text-masaar-black/50">— Select the number of people per room.</span>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-1">
              {(["Double", "Triple", "Quad"] as const).map((type) => {
                const isSelected = occupancy === type;
                const icons = type === "Double" ? "👥" : type === "Triple" ? "👥👤" : "👥👥";
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setOccupancy(type)}
                    className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition-all ${
                      isSelected
                        ? "border-[#A87F12] bg-[#A87F12]/10 ring-1 ring-[#A87F12]"
                        : "border-black/15 bg-white hover:bg-warm-ivory/50"
                    }`}
                  >
                    <span className="text-xs font-bold text-masaar-black">{type}</span>
                    <span className="mt-1 text-xs">{icons}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Optional Services */}
          <div className="space-y-2 border-t border-black/10 pt-4">
            <div className="flex items-center gap-2">
              <span className="flex size-5 items-center justify-center rounded-full bg-[#A87F12] text-white text-[11px] font-bold">
                2
              </span>
              <h3 className="text-sm font-bold text-masaar-black">Optional</h3>
              <span className="text-xs text-masaar-black/50">— Select any additional services you may need.</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1 text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={flightNeeded}
                  onChange={(e) => setFlightNeeded(e.target.checked)}
                  className="rounded border-black/20 text-[#A87F12] focus:ring-[#A87F12]"
                />
                <span className="text-masaar-black">Flight needed</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={visaNeeded}
                  onChange={(e) => setVisaNeeded(e.target.checked)}
                  className="rounded border-black/20 text-[#A87F12] focus:ring-[#A87F12]"
                />
                <span className="text-masaar-black">Visa needed</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={extraNights}
                  onChange={(e) => setExtraNights(e.target.checked)}
                  className="rounded border-black/20 text-[#A87F12] focus:ring-[#A87F12]"
                />
                <span className="text-masaar-black">Extra nights</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hotelPreference}
                  onChange={(e) => setHotelPreference(e.target.checked)}
                  className="rounded border-black/20 text-[#A87F12] focus:ring-[#A87F12]"
                />
                <span className="text-masaar-black">Hotel preference</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={addonPrivateTrip}
                  onChange={(e) => setAddonPrivateTrip(e.target.checked)}
                  className="rounded border-black/20 text-[#A87F12] focus:ring-[#A87F12]"
                />
                <span className="font-semibold text-[#A87F12]">Add-on private trip</span>
              </label>
            </div>
          </div>

          {/* Step 3: Choose Private Trips */}
          <div className="space-y-2 border-t border-black/10 pt-4">
            <div className="flex items-center gap-2">
              <span className="flex size-5 items-center justify-center rounded-full bg-[#A87F12] text-white text-[11px] font-bold">
                3
              </span>
              <h3 className="text-sm font-bold text-masaar-black">Choose Private Trips</h3>
              <span className="text-xs text-masaar-black/50">— Select the private trips you&apos;re interested in.</span>
            </div>

            <div className="space-y-2 pt-1 text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={selectedTrips.includes("Private Makkah Sightseeing")}
                  onChange={() => toggleTrip("Private Makkah Sightseeing")}
                  className="rounded border-black/20 text-[#A87F12] focus:ring-[#A87F12]"
                />
                <span className="text-masaar-black">Private Makkah Sightseeing</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={selectedTrips.includes("Private Madinah Sightseeing")}
                  onChange={() => toggleTrip("Private Madinah Sightseeing")}
                  className="rounded border-black/20 text-[#A87F12] focus:ring-[#A87F12]"
                />
                <span className="text-masaar-black">Private Madinah Sightseeing</span>
              </label>
            </div>
          </div>

          {/* Action CTA Button */}
          <div className="pt-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-wa-link={whatsappUrl}
              data-wa-text={whatsappMessage}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#A87F12] px-6 py-3.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#936e0f]"
            >
              <span>💬</span>
              <span>Send Enquiry on WhatsApp →</span>
            </a>

            <p className="mt-2 text-center text-[11px] text-masaar-black/50">
              🔒 Your information is shared securely via WhatsApp.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
