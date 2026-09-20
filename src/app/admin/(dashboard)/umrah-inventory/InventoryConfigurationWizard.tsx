"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge, Field, PrimaryButton, SecondaryButton, inputClass } from "@/components/admin/ui";
import type {
  HotelRow,
  PackageItineraryDay,
  PackageRow,
  PrivateTripRow,
  UmrahDepartureMonthRow,
  UmrahInventoryConfigurationRow,
  UmrahJourneyType,
} from "@/lib/types/database";
import { saveInventoryConfiguration } from "./actions";

interface Props {
  initial?: UmrahInventoryConfigurationRow;
  packages: PackageRow[];
  months: UmrahDepartureMonthRow[];
  makkahHotels: HotelRow[];
  madinahHotels: HotelRow[];
  privateTrips: PrivateTripRow[];
  initialPrices?: Record<string, number>;
  initialTripIds?: string[];
}

const WIZARD_STEPS = [
  { id: 1, title: "Journey & Duration", subtitle: "Select package tier & length" },
  { id: 2, title: "Month & Departure", subtitle: "Set departure month & status" },
  { id: 3, title: "Hotel Assignment", subtitle: "Makkah & Madinah options" },
  { id: 4, title: "Occupancy Pricing", subtitle: "Double, Triple, Quad rates" },
  { id: 5, title: "Itinerary Builder", subtitle: "Day-by-day ritual timeline" },
  { id: 6, title: "Add-ons & Services", subtitle: "Private trips & extra options" },
  { id: 7, title: "Review & Publish", subtitle: "Summary & live preview" },
];

export function InventoryConfigurationWizard({
  initial,
  packages,
  months,
  makkahHotels,
  madinahHotels,
  privateTrips,
  initialPrices = {},
  initialTripIds = [],
}: Props) {
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [selectedPackageId, setSelectedPackageId] = useState(initial?.package_id || packages[0]?.id || "");
  const [journeyType, setJourneyType] = useState<UmrahJourneyType>(initial?.journey_type || "makkah_madinah");
  const [monthId, setMonthId] = useState(initial?.month_id || months[0]?.id || "");
  const [nights, setNights] = useState(initial?.duration_nights || 4);
  const [days, setDays] = useState(initial?.duration_days || 5);
  const [durationLabel, setDurationLabel] = useState(initial?.duration_label || "4 Nights / 5 Days");
  const [status, setStatus] = useState<"published" | "draft">(initial?.status || "published");

  // Hotels State
  const [makkahHotelId, setMakkahHotelId] = useState(initial?.makkah_hotel_id || makkahHotels[0]?.id || "");
  const [makkahAllowSimilar, setMakkahAllowSimilar] = useState(initial?.makkah_allow_similar ?? true);
  const [makkahNote, setMakkahNote] = useState(initial?.makkah_custom_note || "");

  const [makkahHotelIdAlt, setMakkahHotelIdAlt] = useState(initial?.makkah_hotel_id_alt || "");
  const [makkahAllowSimilarAlt, setMakkahAllowSimilarAlt] = useState(initial?.makkah_allow_similar_alt ?? true);
  const [makkahNoteAlt, setMakkahNoteAlt] = useState(initial?.makkah_custom_note_alt || "");

  const [madinahHotelId, setMadinahHotelId] = useState(initial?.madinah_hotel_id || madinahHotels[0]?.id || "");
  const [madinahAllowSimilar, setMadinahAllowSimilar] = useState(initial?.madinah_allow_similar ?? true);
  const [madinahNote, setMadinahNote] = useState(initial?.madinah_custom_note || "");

  const [madinahHotelIdAlt, setMadinahHotelIdAlt] = useState(initial?.madinah_hotel_id_alt || "");
  const [madinahAllowSimilarAlt, setMadinahAllowSimilarAlt] = useState(initial?.madinah_allow_similar_alt ?? true);
  const [madinahNoteAlt, setMadinahNoteAlt] = useState(initial?.madinah_custom_note_alt || "");

  // Pricing State
  const [priceDouble, setPriceDouble] = useState(initialPrices.Double || initialPrices.double || 3500);
  const [priceTriple, setPriceTriple] = useState(initialPrices.Triple || initialPrices.triple || 3000);
  const [priceQuad, setPriceQuad] = useState(initialPrices.Quad || initialPrices.quad || 2600);
  const [priceSingle, setPriceSingle] = useState(initialPrices.Single || initialPrices.single || 5200);

  // Itinerary State
  const defaultItinerary: PackageItineraryDay[] = [
    { day: 1, title: "Arrival & Makkah", items: ["Jeddah Airport → Private transfer → Hotel check-in.", "Rest of the day at leisure."] },
    { day: 2, title: "Makkah", items: ["Stay in Makkah • Umrah / personal worship.", "Free time for ibadah and explore the surroundings."] },
    { day: 3, title: "Departure", items: ["Hotel check-out → Private transfer → Jeddah Airport.", "End of a blessed journey."] },
  ];
  const [itinerary, setItinerary] = useState<PackageItineraryDay[]>(
    Array.isArray(initial?.itinerary) && initial.itinerary.length > 0
      ? initial.itinerary
      : defaultItinerary
  );

  // Inclusions & Add-ons State
  const [inclusionsOverride, setInclusionsOverride] = useState(initial?.inclusions_override || "");
  const [selectedTripIds, setSelectedTripIds] = useState<string[]>(initialTripIds);

  const selectedPkg = packages.find((p) => p.id === selectedPackageId);
  const selectedMonth = months.find((m) => m.id === monthId);
  const selectedMakkahHotel = makkahHotels.find((h) => h.id === makkahHotelId);
  const selectedMakkahHotelAlt = makkahHotels.find((h) => h.id === makkahHotelIdAlt);
  const selectedMadinahHotel = madinahHotels.find((h) => h.id === madinahHotelId);
  const selectedMadinahHotelAlt = madinahHotels.find((h) => h.id === madinahHotelIdAlt);

  function handleAddItineraryDay() {
    setItinerary([
      ...itinerary,
      { day: itinerary.length + 1, title: `Day ${itinerary.length + 1}`, items: ["Activities details..."] },
    ]);
  }

  function handleRemoveItineraryDay(idx: number) {
    const updated = itinerary.filter((_, i) => i !== idx).map((d, i) => ({ ...d, day: i + 1 }));
    setItinerary(updated);
  }

  function handleItineraryChange(idx: number, field: "title" | "itemsText", value: string) {
    const updated = [...itinerary];
    if (field === "title") {
      updated[idx] = { ...updated[idx], title: value };
    } else {
      updated[idx] = { ...updated[idx], items: value.split("\n").filter(Boolean) };
    }
    setItinerary(updated);
  }

  function toggleTripSelection(tripId: string) {
    if (selectedTripIds.includes(tripId)) {
      setSelectedTripIds(selectedTripIds.filter((id) => id !== tripId));
    } else {
      setSelectedTripIds([...selectedTripIds, tripId]);
    }
  }

  return (
    <form action={saveInventoryConfiguration} className="space-y-6">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="package_id" value={selectedPackageId} />
      <input type="hidden" name="journey_type" value={journeyType} />
      <input type="hidden" name="month_id" value={monthId} />
      <input type="hidden" name="duration_nights" value={nights} />
      <input type="hidden" name="duration_days" value={days} />
      <input type="hidden" name="duration_label" value={durationLabel} />
      <input type="hidden" name="status" value={status} />

      <input type="hidden" name="makkah_hotel_id" value={makkahHotelId} />
      {makkahAllowSimilar && <input type="hidden" name="makkah_allow_similar" value="on" />}
      <input type="hidden" name="makkah_custom_note" value={makkahNote} />

      <input type="hidden" name="makkah_hotel_id_alt" value={makkahHotelIdAlt} />
      {makkahAllowSimilarAlt && <input type="hidden" name="makkah_allow_similar_alt" value="on" />}
      <input type="hidden" name="makkah_custom_note_alt" value={makkahNoteAlt} />

      <input type="hidden" name="madinah_hotel_id" value={madinahHotelId} />
      {madinahAllowSimilar && <input type="hidden" name="madinah_allow_similar" value="on" />}
      <input type="hidden" name="madinah_custom_note" value={madinahNote} />

      <input type="hidden" name="madinah_hotel_id_alt" value={madinahHotelIdAlt} />
      {madinahAllowSimilarAlt && <input type="hidden" name="madinah_allow_similar_alt" value="on" />}
      <input type="hidden" name="madinah_custom_note_alt" value={madinahNoteAlt} />

      <input type="hidden" name="price_double" value={priceDouble} />
      <input type="hidden" name="price_triple" value={priceTriple} />
      <input type="hidden" name="price_quad" value={priceQuad} />
      <input type="hidden" name="price_single" value={priceSingle} />

      <input type="hidden" name="itinerary_json" value={JSON.stringify(itinerary)} />
      <input type="hidden" name="inclusions_override" value={inclusionsOverride} />
      {selectedTripIds.map((tid) => (
        <input key={tid} type="hidden" name="private_trip_ids" value={tid} />
      ))}

      {/* ── TOP CONTEXT CARDS BAR (Matching ADMIN - HOTEL ASSIGNMENT.png) ───── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-xl border border-black/10 bg-white p-4 shadow-2xs">
        <div className="flex items-center gap-3 border-r border-black/10 pr-4 last:border-0">
          <div className="flex size-10 items-center justify-center rounded-lg bg-warm-ivory text-deep-gold">
            📦
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-masaar-black/50">PACKAGE</p>
            <p className="text-sm font-bold text-masaar-black">{selectedPkg?.title || "Essential"}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 border-r border-black/10 pr-4 last:border-0">
          <div className="flex size-10 items-center justify-center rounded-lg bg-warm-ivory text-deep-gold">
            📍
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-masaar-black/50">JOURNEY</p>
            <p className="text-sm font-bold text-masaar-black">
              {journeyType === "makkah_madinah" ? "Makkah + Madinah" : "Makkah Only"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 border-r border-black/10 pr-4 last:border-0">
          <div className="flex size-10 items-center justify-center rounded-lg bg-warm-ivory text-deep-gold">
            📅
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-masaar-black/50">DURATION</p>
            <p className="text-sm font-bold text-masaar-black">{durationLabel}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-warm-ivory text-deep-gold">
            📆
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-masaar-black/50">MONTH</p>
            <p className="text-sm font-bold text-masaar-black">
              {selectedMonth?.display_label || "November 2026"}
            </p>
          </div>
        </div>
      </div>

      {/* ── MAIN LAYOUT: LEFT STEP RAIL + STEP CONTENT ───────────────────── */}
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Left Step Rail */}
        <aside className="space-y-2 lg:col-span-1">
          <div className="rounded-xl border border-black/10 bg-white p-4 shadow-2xs">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-masaar-black/50">
              Configuration Steps
            </h3>
            <nav className="space-y-1">
              {WIZARD_STEPS.map((step) => {
                const isCompleted = step.id < currentStep;
                const isActive = step.id === currentStep;

                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setCurrentStep(step.id)}
                    className={`flex w-full items-start gap-3 rounded-lg p-2.5 text-left transition-all ${
                      isActive
                        ? "bg-warm-ivory/80 font-semibold text-deep-gold ring-1 ring-deep-gold/30"
                        : isCompleted
                        ? "text-masaar-black/80 hover:bg-warm-ivory/40"
                        : "text-masaar-black/40 hover:bg-gray-50"
                    }`}
                  >
                    <span
                      className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        isActive
                          ? "bg-deep-gold text-white"
                          : isCompleted
                          ? "bg-emerald-600 text-white"
                          : "bg-black/10 text-masaar-black/60"
                      }`}
                    >
                      {isCompleted ? "✓" : step.id}
                    </span>
                    <div>
                      <p className="text-xs font-bold">{step.title}</p>
                      <p className="text-[10px] text-masaar-black/50">{step.subtitle}</p>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Step Content Panel */}
        <div className="space-y-6 lg:col-span-3">

          {/* STEP 1: JOURNEY & DURATION */}
          {currentStep === 1 && (
            <div className="rounded-xl border border-black/10 bg-white p-6 shadow-2xs space-y-6">
              <div>
                <h3 className="text-xl font-bold text-masaar-black">Journey & Duration</h3>
                <p className="text-xs text-masaar-black/60">Select package tier, journey type, and duration details.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Package Tier" required>
                  <select
                    value={selectedPackageId}
                    onChange={(e) => setSelectedPackageId(e.target.value)}
                    className={inputClass}
                  >
                    {packages.map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.title} ({pkg.tier.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Journey Type" required>
                  <div className="mt-2 flex gap-4">
                    <label className="flex items-center gap-2 text-sm font-semibold text-masaar-black cursor-pointer">
                      <input
                        type="radio"
                        name="jtype_radio"
                        value="makkah_only"
                        checked={journeyType === "makkah_only"}
                        onChange={() => setJourneyType("makkah_only")}
                        className="text-deep-gold focus:ring-deep-gold"
                      />
                      Makkah Only
                    </label>
                    <label className="flex items-center gap-2 text-sm font-semibold text-masaar-black cursor-pointer">
                      <input
                        type="radio"
                        name="jtype_radio"
                        value="makkah_madinah"
                        checked={journeyType === "makkah_madinah"}
                        onChange={() => setJourneyType("makkah_madinah")}
                        className="text-deep-gold focus:ring-deep-gold"
                      />
                      Makkah + Madinah
                    </label>
                  </div>
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Nights" required>
                  <input
                    type="number"
                    min={1}
                    value={nights}
                    onChange={(e) => {
                      const n = parseInt(e.target.value || "1", 10);
                      setNights(n);
                      setDays(n + 1);
                      setDurationLabel(`${n} Nights / ${n + 1} Days`);
                    }}
                    className={inputClass}
                  />
                </Field>

                <Field label="Days" required>
                  <input
                    type="number"
                    min={1}
                    value={days}
                    onChange={(e) => {
                      const d = parseInt(e.target.value || "1", 10);
                      setDays(d);
                      setDurationLabel(`${nights} Nights / ${d} Days`);
                    }}
                    className={inputClass}
                  />
                </Field>

                <Field label="Duration Display Label">
                  <input
                    type="text"
                    value={durationLabel}
                    onChange={(e) => setDurationLabel(e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>
            </div>
          )}

          {/* STEP 2: MONTH & DEPARTURE */}
          {currentStep === 2 && (
            <div className="rounded-xl border border-black/10 bg-white p-6 shadow-2xs space-y-6">
              <div>
                <h3 className="text-xl font-bold text-masaar-black">Month & Departure</h3>
                <p className="text-xs text-masaar-black/60">Assign to a departure month and set publish status.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Departure Month" required>
                  <select
                    value={monthId}
                    onChange={(e) => setMonthId(e.target.value)}
                    className={inputClass}
                  >
                    {months.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.display_label} ({m.is_active ? "Active" : "Inactive"})
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Publish Status">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as "published" | "draft")}
                    className={inputClass}
                  >
                    <option value="published">Published (Visible on site)</option>
                    <option value="draft">Draft (Hidden)</option>
                  </select>
                </Field>
              </div>
            </div>
          )}

          {/* STEP 3: HOTEL ASSIGNMENT (Matching ADMIN - HOTEL ASSIGNMENT.png) */}
          {currentStep === 3 && (
            <div className="rounded-xl border border-black/10 bg-white p-6 shadow-2xs space-y-6">
              <div>
                <div className="flex items-center gap-2 text-deep-gold">
                  <span>🏨</span>
                  <h3 className="text-xl font-bold text-masaar-black">Hotel Assignment</h3>
                </div>
                <p className="text-xs text-masaar-black/60">Select the Makkah and Madinah properties for this configuration.</p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Makkah Property Card */}
                <div className="rounded-xl border border-black/10 bg-white p-5 space-y-4 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🕋</span>
                    <div>
                      <h4 className="font-bold text-base text-masaar-black">Makkah Property</h4>
                      <p className="text-[11px] text-masaar-black/50">Select the hotel for Makkah from your hotel database.</p>
                    </div>
                  </div>

                  <Field label="Makkah Hotel *" required>
                    <select
                      id="makkah_hotel_select"
                      value={makkahHotelId}
                      onChange={(e) => setMakkahHotelId(e.target.value)}
                      className={inputClass}
                    >
                      {makkahHotels.map((h) => (
                        <option key={h.id} value={h.id}>{h.name}</option>
                      ))}
                    </select>
                  </Field>

                  {/* Selected Hotel Rich Preview Card */}
                  {selectedMakkahHotel && (
                    <div className="flex gap-4 rounded-xl border border-black/10 bg-warm-ivory/20 p-3.5">
                      <img
                        src={selectedMakkahHotel.image_url || "/images/hotels/voco-makkah.jpg"}
                        alt={selectedMakkahHotel.name}
                        className="h-28 w-28 shrink-0 rounded-lg object-cover border border-black/10"
                      />
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <h5 className="font-bold text-sm text-masaar-black">{selectedMakkahHotel.name}</h5>
                          <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                            {selectedMakkahHotel.category || "Premium"}
                          </span>
                        </div>
                        <p className="text-masaar-black/60 font-medium">📍 {selectedMakkahHotel.city || "Makkah"}</p>
                        <div className="pt-1 space-y-0.5 text-[11px] text-masaar-black/80">
                          <p>🚌 Shuttle Service</p>
                          <p>☕ Room Only</p>
                          <p className="text-masaar-black/60 line-clamp-2">{selectedMakkahHotel.description || `${selectedMakkahHotel.star_rating}-star hotel with modern amenities.`}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <label className="flex items-center gap-2 text-xs font-semibold text-masaar-black cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={makkahAllowSimilar}
                      onChange={(e) => setMakkahAllowSimilar(e.target.checked)}
                      className="rounded border-black/20 text-deep-gold focus:ring-deep-gold"
                    />
                    Allow equivalent property (&quot;or similar&quot;)
                  </label>
                </div>

                {/* Madinah Property Card */}
                {journeyType === "makkah_madinah" && (
                  <div className="rounded-xl border border-black/10 bg-white p-5 space-y-4 shadow-2xs">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🕌</span>
                      <div>
                        <h4 className="font-bold text-base text-masaar-black">Madinah Property</h4>
                        <p className="text-[11px] text-masaar-black/50">Select the hotel for Madinah from your hotel database.</p>
                      </div>
                    </div>

                    <Field label="Madinah Hotel *" required>
                      <select
                        id="madinah_hotel_select"
                        value={madinahHotelId}
                        onChange={(e) => setMadinahHotelId(e.target.value)}
                        className={inputClass}
                      >
                        {madinahHotels.map((h) => (
                          <option key={h.id} value={h.id}>{h.name}</option>
                        ))}
                      </select>
                    </Field>

                    {/* Selected Hotel Rich Preview Card */}
                    {selectedMadinahHotel && (
                      <div className="flex gap-4 rounded-xl border border-black/10 bg-warm-ivory/20 p-3.5">
                        <img
                          src={selectedMadinahHotel.image_url || "/images/hotels/zowar-madinah.jpg"}
                          alt={selectedMadinahHotel.name}
                          className="h-28 w-28 shrink-0 rounded-lg object-cover border border-black/10"
                        />
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <h5 className="font-bold text-sm text-masaar-black">{selectedMadinahHotel.name}</h5>
                            <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                              {selectedMadinahHotel.category || "Standard"}
                            </span>
                          </div>
                          <p className="text-masaar-black/60 font-medium">📍 {selectedMadinahHotel.city || "Madinah"}</p>
                          <div className="pt-1 space-y-0.5 text-[11px] text-masaar-black/80">
                            <p>🏃 10 minutes to Haram</p>
                            <p>☕ Room Only</p>
                            <p className="text-masaar-black/60 line-clamp-2">{selectedMadinahHotel.description || `${selectedMadinahHotel.star_rating}-star hotel with comfortable stay.`}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <label className="flex items-center gap-2 text-xs font-semibold text-masaar-black cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={madinahAllowSimilar}
                        onChange={(e) => setMadinahAllowSimilar(e.target.checked)}
                        className="rounded border-black/20 text-deep-gold focus:ring-deep-gold"
                      />
                      Allow equivalent property (&quot;or similar&quot;)
                    </label>
                  </div>
                )}
              </div>

              {/* Bottom Callout Banner */}
              <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50/60 p-4 text-xs text-blue-900">
                <span className="text-base">ℹ</span>
                <p>Hotel details (images, descriptions, facilities, etc.) are managed in the Hotels section. You can edit hotel information there.</p>
              </div>
            </div>
          )}

          {/* STEP 4: PRICING */}
          {currentStep === 4 && (
            <div className="rounded-xl border border-black/10 bg-white p-6 shadow-2xs space-y-6">
              <div>
                <h3 className="text-xl font-bold text-masaar-black">Occupancy Pricing</h3>
                <p className="text-xs text-masaar-black/60">
                  Set the per-person pricing for this duration. Prices are in AED.
                </p>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-xs text-amber-900">
                <span className="text-base">ℹ</span>
                <p>You are configuring prices for <strong>{durationLabel}</strong>. Other durations will be added as separate inventory configurations.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-black/10 bg-white p-4 space-y-2">
                  <p className="font-bold text-xs text-masaar-black flex items-center gap-2">👥 Double Occupancy</p>
                  <Field label="">
                    <div className="flex items-center">
                      <span className="rounded-l-lg border border-r-0 border-black/10 bg-warm-ivory/50 px-3 py-2 text-xs font-bold text-masaar-black/70">AED</span>
                      <input
                        id="price_double_input"
                        type="number"
                        min={0}
                        value={priceDouble || ""}
                        onChange={(e) => setPriceDouble(parseFloat(e.target.value || "0"))}
                        className={`${inputClass} rounded-l-none`}
                        placeholder="799"
                      />
                    </div>
                  </Field>
                  <p className="text-[10px] text-masaar-black/50">Price per person (AED)</p>
                </div>

                <div className="rounded-xl border border-black/10 bg-white p-4 space-y-2">
                  <p className="font-bold text-xs text-masaar-black flex items-center gap-2">👨‍👩‍👦 Triple Occupancy</p>
                  <Field label="">
                    <div className="flex items-center">
                      <span className="rounded-l-lg border border-r-0 border-black/10 bg-warm-ivory/50 px-3 py-2 text-xs font-bold text-masaar-black/70">AED</span>
                      <input
                        id="price_triple_input"
                        type="number"
                        min={0}
                        value={priceTriple || ""}
                        onChange={(e) => setPriceTriple(parseFloat(e.target.value || "0"))}
                        className={`${inputClass} rounded-l-none`}
                        placeholder="699"
                      />
                    </div>
                  </Field>
                  <p className="text-[10px] text-masaar-black/50">Price per person (AED)</p>
                </div>

                <div className="rounded-xl border border-black/10 bg-white p-4 space-y-2">
                  <p className="font-bold text-xs text-masaar-black flex items-center gap-2">👨‍👩‍👧‍👦 Quad Occupancy</p>
                  <Field label="">
                    <div className="flex items-center">
                      <span className="rounded-l-lg border border-r-0 border-black/10 bg-warm-ivory/50 px-3 py-2 text-xs font-bold text-masaar-black/70">AED</span>
                      <input
                        id="price_quad_input"
                        type="number"
                        min={0}
                        value={priceQuad || ""}
                        onChange={(e) => setPriceQuad(parseFloat(e.target.value || "0"))}
                        className={`${inputClass} rounded-l-none`}
                        placeholder="599"
                      />
                    </div>
                  </Field>
                  <p className="text-[10px] text-masaar-black/50">Price per person (AED)</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: ITINERARY BUILDER (Matching ADMIN -ITINERARY BUILDER.png) */}
          {currentStep === 5 && (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Left Column: Day Card Builder */}
              <div className="rounded-xl border border-black/10 bg-white p-6 shadow-2xs space-y-6 lg:col-span-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🗺</span>
                      <h3 className="text-xl font-bold text-masaar-black">Itinerary</h3>
                    </div>
                    <p className="text-xs text-masaar-black/60">Add and manage the day-wise itinerary for this configuration.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {itinerary.map((day, idx) => (
                    <div key={idx} className="rounded-xl border border-black/10 bg-white p-5 space-y-4 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="cursor-grab text-masaar-black/30">:::</span>
                          <div className="flex size-9 items-center justify-center rounded-lg bg-amber-100/70 text-xs font-bold text-amber-900">
                            Day {String(day.day).padStart(2, "0")}
                          </div>
                        </div>
                        {itinerary.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItineraryDay(idx)}
                            className="rounded bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                          >
                            🗑 Delete
                          </button>
                        )}
                      </div>

                      <Field label="Day Title">
                        <input
                          type="text"
                          value={day.title || ""}
                          onChange={(e) => handleItineraryChange(idx, "title", e.target.value)}
                          placeholder="Arrival & Makkah"
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Description">
                        <textarea
                          rows={3}
                          value={day.items ? day.items.join("\n") : ""}
                          onChange={(e) => handleItineraryChange(idx, "itemsText", e.target.value)}
                          placeholder="Jeddah Airport → Private transfer → Hotel check-in. Rest of the day at leisure."
                          className={inputClass}
                        />
                        <p className="text-right text-[10px] text-masaar-black/40 pt-1">
                          {(day.items ? day.items.join("\n") : "").length}/500
                        </p>
                      </Field>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleAddItineraryDay}
                    className="w-full rounded-xl border border-dashed border-black/20 p-3 text-xs font-bold text-masaar-black/70 hover:bg-warm-ivory/50"
                  >
                    + Add Day
                  </button>
                </div>
              </div>

              {/* Right Column: Live Itinerary Preview Panel */}
              <div className="rounded-xl border border-black/10 bg-white p-6 shadow-2xs space-y-5 lg:col-span-1">
                <div>
                  <div className="flex items-center gap-2 text-deep-gold">
                    <span>👁</span>
                    <h4 className="font-bold text-base text-masaar-black">Itinerary Preview</h4>
                  </div>
                  <p className="text-[11px] text-masaar-black/50">This is how the itinerary will appear on the website.</p>
                </div>

                <div className="space-y-6 relative border-l-2 border-amber-200 ml-4 pl-6 pt-2">
                  {itinerary.map((day, i) => (
                    <div key={i} className="relative space-y-1">
                      <div className="absolute -left-[35px] top-0 flex size-8 items-center justify-center rounded-full bg-amber-900 text-[10px] font-bold text-white shadow-xs">
                        {String(day.day).padStart(2, "0")}
                      </div>
                      <p className="text-xs font-bold text-masaar-black">{day.title || `Day ${day.day}`}</p>
                      <div className="text-[11px] text-masaar-black/70 leading-relaxed">
                        {day.items ? day.items.map((it, k) => <p key={k}>{it}</p>) : <p>Activities description...</p>}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/60 p-3 text-[11px] text-blue-900">
                  <span>ℹ</span>
                  <p>Each configuration (e.g. 2N/3D, 5N/6D) can have its own unique itinerary.</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: ADD-ONS & SERVICES */}
          {currentStep === 6 && (
            <div className="rounded-xl border border-black/10 bg-white p-6 shadow-2xs space-y-6">
              <div>
                <h3 className="text-xl font-bold text-masaar-black">Add-ons & Services</h3>
                <p className="text-xs text-masaar-black/60">Select recommended private trips and inclusions override.</p>
              </div>

              {/* Private Trips Checklist */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-masaar-black">Recommended Private Trips</h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  {privateTrips.map((trip) => {
                    const isChecked = selectedTripIds.includes(trip.id);
                    return (
                      <div
                        key={trip.id}
                        onClick={() => toggleTripSelection(trip.id)}
                        className={`flex gap-3 rounded-lg border p-3 cursor-pointer transition-all ${
                          isChecked
                            ? "border-deep-gold bg-light-gold/10 ring-1 ring-deep-gold/30"
                            : "border-black/10 bg-white hover:border-black/20"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="mt-1 rounded border-black/20 text-deep-gold"
                        />
                        <div>
                          <p className="text-xs font-bold text-masaar-black">{trip.name}</p>
                          <p className="text-[11px] font-medium text-deep-gold">{trip.destination}</p>
                          <p className="text-[10px] text-masaar-black/60 line-clamp-2">{trip.short_description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Inclusions Override */}
              <Field label="Inclusions Override" hint="Leave blank to inherit tier default inclusions">
                <textarea
                  rows={3}
                  value={inclusionsOverride}
                  onChange={(e) => setInclusionsOverride(e.target.value)}
                  placeholder="Custom inclusions override text..."
                  className={inputClass}
                />
              </Field>
            </div>
          )}

          {/* STEP 7: REVIEW & PUBLISH */}
          {currentStep === 7 && (
            <div className="rounded-xl border border-black/10 bg-white p-6 shadow-2xs space-y-6">
              <div>
                <h3 className="text-xl font-bold text-masaar-black">Review & Publish</h3>
                <p className="text-xs text-masaar-black/60">Summary of all configuration settings before saving.</p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Left: Summary Breakdown */}
                <div className="space-y-4 rounded-xl border border-black/10 bg-warm-ivory/30 p-5 text-xs">
                  <div className="flex justify-between border-b border-black/10 pb-2">
                    <span className="font-bold text-masaar-black">Package & Journey</span>
                    <button type="button" onClick={() => setCurrentStep(1)} className="text-deep-gold font-bold underline">Edit</button>
                  </div>
                  <p><strong>Tier:</strong> {selectedPkg?.title}</p>
                  <p><strong>Journey:</strong> {journeyType === "makkah_madinah" ? "Makkah + Madinah" : "Makkah Only"}</p>
                  <p><strong>Duration:</strong> {durationLabel}</p>

                  <div className="flex justify-between border-b border-black/10 pt-2 pb-2">
                    <span className="font-bold text-masaar-black">Hotels</span>
                    <button type="button" onClick={() => setCurrentStep(3)} className="text-deep-gold font-bold underline">Edit</button>
                  </div>
                  <p><strong>Makkah Option A:</strong> {selectedMakkahHotel?.name ?? "None"}</p>
                  {journeyType === "makkah_madinah" && (
                    <p><strong>Madinah Option A:</strong> {selectedMadinahHotel?.name ?? "None"}</p>
                  )}

                  <div className="flex justify-between border-b border-black/10 pt-2 pb-2">
                    <span className="font-bold text-masaar-black">Pricing</span>
                    <button type="button" onClick={() => setCurrentStep(4)} className="text-deep-gold font-bold underline">Edit</button>
                  </div>
                  <p>Double: AED {priceDouble} | Triple: AED {priceTriple} | Quad: AED {priceQuad} | Single: AED {priceSingle}</p>
                </div>

                {/* Right: Actions Box */}
                <div className="flex flex-col justify-between rounded-xl border border-deep-gold/40 bg-white p-5 space-y-4">
                  <div>
                    <h4 className="font-bold text-base text-masaar-black">Ready to Save Configuration?</h4>
                    <p className="mt-1 text-xs text-masaar-black/60">
                      Saving will update the live public site availability immediately if set to Published.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <PrimaryButton id="publish_config_btn" type="submit" className="w-full py-3">
                      {initial?.id ? "Save & Publish Configuration" : "Create & Publish Configuration"}
                    </PrimaryButton>
                    <Link href="/admin/umrah-inventory" className="block text-center text-xs text-masaar-black/60 underline pt-2">
                      Cancel & Exit
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP NAVIGATION BUTTONS ────────────────────────────────────────── */}
          <div className="flex items-center justify-between border-t border-black/10 pt-4">
            <SecondaryButton
              type="button"
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
            >
              ← Previous Step
            </SecondaryButton>

            {currentStep < 7 ? (
              <PrimaryButton
                type="button"
                onClick={() => setCurrentStep((prev) => Math.min(7, prev + 1))}
              >
                Next Step →
              </PrimaryButton>
            ) : (
              <PrimaryButton type="submit">
                {initial?.id ? "Save Configuration" : "Create Configuration"}
              </PrimaryButton>
            )}
          </div>

        </div>
      </div>
    </form>
  );
}
