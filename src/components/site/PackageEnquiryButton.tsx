"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { buildWhatsAppLink } from "@/lib/contact";
import { createClient } from "@/lib/supabase/client";
import { WhatsAppGlyph } from "./WhatsAppButton";
import { useWhatsAppTemplates } from "./WhatsAppTemplatesProvider";

interface PrivateTripOption {
  id: string;
  name: string;
  duration: string;
  short_description: string;
  featured_image_url?: string | null;
}

const FALLBACK_PRIVATE_TRIPS: PrivateTripOption[] = [
  {
    id: "makkah",
    name: "Private Makkah Sightseeing",
    duration: "2 – 2.5 Hours",
    short_description: "Explore selected places around Makkah with private transportation.",
    featured_image_url: "/trips/PRIVATE-TRIP-MAKKAH-CARD.png",
  },
  {
    id: "madinah",
    name: "Private Madinah Sightseeing",
    duration: "2 – 2.5 Hours",
    short_description: "Visit selected places around Madinah at a comfortable pace.",
    featured_image_url: "/trips/PRIVATE-TRIP-MADINAH-CARD.png",
  },
];

/**
 * Replaces the plain "WhatsApp" button on Umrah/Hajj package cards and
 * detail pages with a popup enquiry builder: read-only package
 * context, 7 optional add-on toggles (flight/visa/hotel/transfers/
 * price-match/extra-nights/private-trips), then a single pre-filled WhatsApp message.
 * Fully client-side — nothing here is written to the database; the
 * toggle state only ever becomes text in the outgoing message.
 */
export function PackageEnquiryButton({
  packageTitle,
  tier,
  duration,
  departureMonth,
  variant = "solid",
  className = "",
}: {
  packageTitle: string;
  tier: string;
  duration: string;
  departureMonth?: string;
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
      {open && (
        <PackageEnquiryModal
          packageTitle={packageTitle}
          tier={tier}
          duration={duration}
          departureMonth={departureMonth}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function PackageEnquiryModal({
  packageTitle,
  tier,
  duration,
  departureMonth,
  onClose,
}: {
  packageTitle: string;
  tier: string;
  duration: string;
  departureMonth?: string;
  onClose: () => void;
}) {
  const { getMessage, phoneNumber } = useWhatsAppTemplates();

  // Existing 6 toggles
  const [flightNeeded, setFlightNeeded] = useState(false);
  const [flightDate, setFlightDate] = useState("");
  const [visaNeeded, setVisaNeeded] = useState(false);
  const [visaNote, setVisaNote] = useState("");
  const [hotelPreference, setHotelPreference] = useState(false);
  const [hotelNote, setHotelNote] = useState("");
  const [transfersNeeded, setTransfersNeeded] = useState(false);
  const [priceMatchFound, setPriceMatchFound] = useState(false);
  const [priceMatchNote, setPriceMatchNote] = useState("");
  const [extraNights, setExtraNights] = useState(false);
  const [extraNightsNote, setExtraNightsNote] = useState("");

  // 7th toggle: Add-on private trip
  const [addonTripsNeeded, setAddonTripsNeeded] = useState(false);
  const [availableTrips, setAvailableTrips] = useState<PrivateTripOption[]>(FALLBACK_PRIVATE_TRIPS);
  const [selectedTripIds, setSelectedTripIds] = useState<string[]>([]);
  const [additionalMessage, setAdditionalMessage] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  // Load published private trips
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("private_trips")
          .select("id, name, duration, short_description, featured_image_url")
          .eq("status", "published")
          .order("display_order", { ascending: true });

        if (!error && data && data.length > 0 && !cancelled) {
          setAvailableTrips(data);
        }
      } catch {
        // Fallback to FALLBACK_PRIVATE_TRIPS
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function toggleTripSelection(tripId: string) {
    if (selectedTripIds.includes(tripId)) {
      setSelectedTripIds(selectedTripIds.filter((id) => id !== tripId));
    } else {
      setSelectedTripIds([...selectedTripIds, tripId]);
    }
  }

  function removeTripSelection(tripId: string) {
    setSelectedTripIds(selectedTripIds.filter((id) => id !== tripId));
  }

  function buildFullMessage(): string {
    const lines = [getMessage("packageEnquiry", { packageTitle, tier, duration })];

    if (departureMonth) lines.push(`Interested month: ${departureMonth}`);
    if (flightNeeded) {
      lines.push(`Flight needed: yes${flightDate ? ` (preferred date: ${flightDate})` : ""}`);
    }
    if (visaNeeded) {
      lines.push(`Visa needed: yes${visaNote.trim() ? ` — ${visaNote.trim()}` : ""}`);
    }
    if (hotelPreference) {
      lines.push(`Hotel preference: ${hotelNote.trim() || "yes"}`);
    }
    if (transfersNeeded) {
      lines.push("Transfers needed: yes");
    }
    if (priceMatchFound) {
      lines.push(`Found a better price elsewhere: ${priceMatchNote.trim() || "yes"}`);
    }
    if (extraNights) {
      lines.push(`Extra nights / extended stay: ${extraNightsNote.trim() || "yes"}`);
    }

    // Add-on Private Trips formatting
    if (addonTripsNeeded && selectedTripIds.length > 0) {
      lines.push("");
      lines.push("I'd also like information about:");
      for (const id of selectedTripIds) {
        const matched = availableTrips.find((t) => t.id === id);
        if (matched) {
          lines.push(`• ${matched.name}`);
        }
      }
    }

    if (additionalMessage.trim()) {
      lines.push("");
      lines.push(`Note: ${additionalMessage.trim()}`);
    }

    return lines.join("\n");
  }

  function handleSend() {
    window.open(buildWhatsAppLink(buildFullMessage(), phoneNumber), "_blank", "noopener,noreferrer");
    onClose();
  }

  const selectedTrips = availableTrips.filter((t) => selectedTripIds.includes(t.id));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Enquire on WhatsApp"
      className="fixed inset-0 z-50 flex items-end justify-center bg-masaar-black/60 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-masaar-black">
              Enquire on WhatsApp
            </h2>
            <p className="mt-1 text-sm text-masaar-black/60">
              {packageTitle} &middot; {tier} &middot; {duration}
            </p>
            {departureMonth && <p className="mt-0.5 text-xs text-masaar-black/50">Departure: {departureMonth}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-md p-1.5 text-masaar-black/50 hover:bg-warm-ivory hover:text-masaar-black"
          >
            ✕
          </button>
        </div>

        <p className="mt-4 text-sm text-masaar-black/60">
          Happy to help with anything else — everything below is optional, and there&apos;s no
          obligation.
        </p>

        <div className="mt-4 space-y-4">
          {/* 1. Flight needed */}
          <ToggleField label="Flight needed" checked={flightNeeded} onChange={setFlightNeeded}>
            <label className="mb-1 block text-xs font-medium text-masaar-black/70">Preferred travel date</label>
            <input
              type="date"
              value={flightDate}
              onChange={(e) => setFlightDate(e.target.value)}
              className="w-full rounded-md border border-black/15 px-3 py-2 text-sm"
            />
          </ToggleField>

          {/* 2. Visa needed */}
          <ToggleField label="Visa needed" checked={visaNeeded} onChange={setVisaNeeded}>
            <input
              value={visaNote}
              onChange={(e) => setVisaNote(e.target.value)}
              placeholder="e.g. already have UAE residency visa"
              className="w-full rounded-md border border-black/15 px-3 py-2 text-sm"
            />
          </ToggleField>

          {/* 3. Hotel preference */}
          <ToggleField label="Hotel preference" checked={hotelPreference} onChange={setHotelPreference}>
            <input
              value={hotelNote}
              onChange={(e) => setHotelNote(e.target.value)}
              placeholder="e.g. sea-view room, ground floor"
              className="w-full rounded-md border border-black/15 px-3 py-2 text-sm"
            />
          </ToggleField>

          {/* 4. Transfers needed */}
          <label className="flex items-center gap-2 text-sm text-masaar-black cursor-pointer">
            <input
              type="checkbox"
              checked={transfersNeeded}
              onChange={(e) => setTransfersNeeded(e.target.checked)}
              className="rounded border-black/20 text-deep-gold focus:ring-deep-gold"
            />
            Transfers needed
          </label>

          {/* 5. Found a better price elsewhere? */}
          <ToggleField
            label="Found a better price elsewhere?"
            checked={priceMatchFound}
            onChange={setPriceMatchFound}
          >
            <input
              value={priceMatchNote}
              onChange={(e) => setPriceMatchNote(e.target.value)}
              placeholder="e.g. Saw AED 2,700 on [agency] website"
              className="w-full rounded-md border border-black/15 px-3 py-2 text-sm"
            />
          </ToggleField>

          {/* 6. Extra nights */}
          <ToggleField
            label="I'd like extra nights / an extended stay"
            checked={extraNights}
            onChange={setExtraNights}
          >
            <input
              value={extraNightsNote}
              onChange={(e) => setExtraNightsNote(e.target.value)}
              placeholder="e.g. 2 extra nights in Madinah, or not sure yet — happy to discuss"
              className="w-full rounded-md border border-black/15 px-3 py-2 text-sm"
            />
          </ToggleField>

          {/* 7. Add-on private trip */}
          <div className="rounded-xl border border-black/10 bg-warm-ivory/30 p-3.5">
            <label className="flex items-center gap-2 text-sm font-semibold text-masaar-black cursor-pointer">
              <input
                type="checkbox"
                checked={addonTripsNeeded}
                onChange={(e) => setAddonTripsNeeded(e.target.checked)}
                className="rounded border-black/20 text-deep-gold focus:ring-deep-gold"
              />
              I&apos;d like an add-on private trip
            </label>

            {addonTripsNeeded && (
              <div className="mt-4 space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-masaar-black">Choose a private trip</h4>
                  <p className="text-xs text-masaar-black/60">
                    You can select one or more private trips to include in your enquiry.
                  </p>
                </div>

                {/* 2-Column Selectable Cards Grid */}
                <div className="grid gap-3 sm:grid-cols-2">
                  {availableTrips.map((trip) => {
                    const isSelected = selectedTripIds.includes(trip.id);
                    return (
                      <div
                        key={trip.id}
                        onClick={() => toggleTripSelection(trip.id)}
                        className={`group relative flex flex-col overflow-hidden rounded-xl border bg-white p-3 shadow-2xs transition-all cursor-pointer ${
                          isSelected
                            ? "border-[#A87F12] ring-1 ring-[#A87F12]"
                            : "border-black/10 hover:border-black/20"
                        }`}
                      >
                        {/* Image + Checkbox badge */}
                        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg bg-warm-ivory">
                          {trip.featured_image_url && (
                            <Image
                              src={trip.featured_image_url}
                              alt={trip.name}
                              fill
                              className="object-cover"
                            />
                          )}
                          <div
                            className={`absolute top-2 right-2 flex size-5 items-center justify-center rounded border transition-colors ${
                              isSelected
                                ? "border-[#A87F12] bg-[#A87F12] text-white"
                                : "border-white/80 bg-black/40 text-transparent"
                            }`}
                          >
                            ✓
                          </div>
                        </div>

                        {/* Title & Info */}
                        <div className="mt-2.5 flex flex-1 flex-col">
                          <h5 className="font-semibold text-xs text-masaar-black">{trip.name}</h5>
                          <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-deep-gold">
                            <svg className="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{trip.duration}</span>
                          </div>
                          <p className="mt-1 text-[11px] leading-relaxed text-masaar-black/70 line-clamp-2">
                            {trip.short_description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Selected Chips Strip */}
                {selectedTrips.length > 0 && (
                  <div className="rounded-lg border border-black/10 bg-white p-3">
                    <p className="text-xs font-semibold text-masaar-black">
                      Selected ({selectedTrips.length})
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {selectedTrips.map((t) => (
                        <span
                          key={t.id}
                          className="inline-flex items-center gap-1.5 rounded-md bg-warm-ivory px-2.5 py-1 text-xs font-medium text-masaar-black border border-black/10"
                        >
                          {t.name}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeTripSelection(t.id);
                            }}
                            className="text-masaar-black/50 hover:text-masaar-black"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Additional Message Textarea */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-masaar-black/70">
                    Additional Message (Optional)
                  </label>
                  <div className="relative">
                    <textarea
                      value={additionalMessage}
                      onChange={(e) => setAdditionalMessage(e.target.value.slice(0, 500))}
                      rows={3}
                      placeholder="Let us know if you have any specific requests..."
                      className="w-full rounded-md border border-black/15 bg-white p-3 text-xs text-masaar-black focus:border-deep-gold focus:outline-none"
                    />
                    <span className="absolute right-2 bottom-2 text-[10px] text-masaar-black/40">
                      {additionalMessage.length}/500
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Buttons */}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-black/15 bg-white px-4 py-3 text-sm font-semibold text-masaar-black transition-colors hover:bg-warm-ivory"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSend}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#A87F12] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#C9A227]"
          >
            <WhatsAppGlyph />
            Send on WhatsApp
          </button>
        </div>

        <p className="mt-2 text-center text-[11px] text-masaar-black/50">
          You&apos;ll be redirected to WhatsApp with your selected details.
        </p>
      </div>
    </div>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
  children,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-2 text-sm text-masaar-black cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="rounded border-black/20 text-deep-gold focus:ring-deep-gold"
        />
        {label}
      </label>
      {checked && <div className="mt-2 pl-6">{children}</div>}
    </div>
  );
}
