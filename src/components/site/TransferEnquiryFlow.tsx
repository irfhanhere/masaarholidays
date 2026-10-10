"use client";

import { useId, useMemo, useState } from "react";
import Image from "next/image";
import type { EnrichedTransferRoute, RouteVehicleOption } from "@/lib/data/transfers-catalog";
import { buildWhatsAppLink } from "@/lib/contact";
import { convertFromAed, formatCurrency } from "@/lib/currency";
import { useCurrency } from "./CurrencyProvider";
import { Price } from "./Price";

interface Props {
  route: EnrichedTransferRoute;
  whatsappPhone?: string;
}

export function TransferEnquiryFlow({ route, whatsappPhone }: Props) {
  const { currency, rates } = useCurrency();
  const isAirportRoute = route.transfer_type === "airport";
  const formId = useId();

  // Active step: 1 = Vehicle, 2 = Details, 3 = Review
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Available active vehicles
  const vehicles = useMemo(() => {
    return route.availableVehicles.filter((v) => v.isActive && v.priceAed > 0);
  }, [route.availableVehicles]);

  // Selected vehicle state (default to first vehicle if available)
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(
    vehicles[0]?.vehicleId || ""
  );

  const selectedVehicle = useMemo(() => {
    return (
      vehicles.find((v) => v.vehicleId === selectedVehicleId) ||
      vehicles[0] ||
      null
    );
  }, [vehicles, selectedVehicleId]);

  // Journey Details Form State
  const [travelDate, setTravelDate] = useState<string>("");
  const [pickupTime, setPickupTime] = useState<string>("10:00");
  const [passengers, setPassengers] = useState<number>(2);
  const [luggage, setLuggage] = useState<string>("2");
  const [flightNumber, setFlightNumber] = useState<string>("");
  const [pickupLocation, setPickupLocation] = useState<string>(route.pickupLocation);
  const [dropoffLocation, setDropoffLocation] = useState<string>(route.dropoffLocation);
  const [additionalNotes, setAdditionalNotes] = useState<string>("");
  const [validationError, setValidationError] = useState<string | null>(null);

  // Today's date in YYYY-MM-DD for min date
  const todayStr = useMemo(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  }, []);

  // Format date for display
  const formattedDate = useMemo(() => {
    if (!travelDate) return "Not specified";
    try {
      const parts = travelDate.split("-");
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
      }
    } catch {
      // fallback
    }
    return travelDate;
  }, [travelDate]);

  // Generate WhatsApp message and link
  const whatsappUrl = useMemo(() => {
    const vehicleText = selectedVehicle
      ? `${selectedVehicle.vehicleName} (${selectedVehicle.modelYear})`
      : "Standard Transfer";

    const lines: string[] = [
      "Assalamu Alaikum Masaar Holidays,",
      "I would like to enquire about the following private transfer.",
      "",
      `Route: ${route.route_name}`,
      `Vehicle: ${vehicleText}`,
      `Travel Date: ${formattedDate}`,
      `Pickup Time: ${pickupTime}`,
      `Passengers: ${passengers}`,
    ];

    if (luggage && luggage !== "0") {
      lines.push(`Luggage: ${luggage} suitcases`);
    }

    if (isAirportRoute && flightNumber.trim()) {
      lines.push(`Flight Number: ${flightNumber.trim()}`);
    }

    if (pickupLocation && pickupLocation !== route.pickupLocation) {
      lines.push(`Pickup Point: ${pickupLocation.trim()}`);
    }

    if (dropoffLocation && dropoffLocation !== route.dropoffLocation) {
      lines.push(`Drop-off Point: ${dropoffLocation.trim()}`);
    }

    if (selectedVehicle?.priceAed) {
      const converted = convertFromAed(selectedVehicle.priceAed, currency, rates);
      const displayPrice = converted != null ? formatCurrency(converted, currency) : `AED ${selectedVehicle.priceAed}`;
      const priceText = currency !== "AED" ? `${displayPrice} (AED ${selectedVehicle.priceAed})` : displayPrice;
      lines.push(`Displayed Price: ${priceText}`);
    }

    if (additionalNotes.trim()) {
      lines.push("", "Additional Notes:", additionalNotes.trim());
    }

    lines.push(
      "",
      "Please confirm vehicle availability and the final booking details.",
      "JazakAllah Khair."
    );

    const message = lines.join("\n");
    return buildWhatsAppLink(message, whatsappPhone);
  }, [
    route,
    selectedVehicle,
    formattedDate,
    pickupTime,
    passengers,
    luggage,
    isAirportRoute,
    flightNumber,
    pickupLocation,
    dropoffLocation,
    additionalNotes,
    whatsappPhone,
    currency,
    rates,
  ]);

  // Handle continuing to Step 2
  const handleProceedToDetails = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    setValidationError(null);
    setCurrentStep(2);
    // Smooth scroll to step form
    const elem = document.getElementById("enquiry-wizard");
    if (elem) elem.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Handle validation and proceeding to Step 3 (Review)
  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!travelDate) {
      setValidationError("Please select your travel date.");
      return;
    }
    if (!pickupTime) {
      setValidationError("Please select your estimated pickup time.");
      return;
    }
    if (passengers < 1) {
      setValidationError("Please specify at least 1 passenger.");
      return;
    }
    if (selectedVehicle && passengers > selectedVehicle.passengerCapacity) {
      setValidationError(
        `The selected ${selectedVehicle.vehicleName} accommodates up to ${selectedVehicle.passengerCapacity} passengers. Please adjust passenger count or select a larger vehicle.`
      );
      return;
    }

    setValidationError(null);
    setCurrentStep(3);
    const elem = document.getElementById("enquiry-wizard");
    if (elem) elem.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div id="enquiry-wizard" className="scroll-mt-20">
      {/* Step Indicator Header */}
      <div className="mb-8 rounded-xl border border-black/10 bg-white p-4 shadow-xs sm:p-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className="flex items-center gap-2 text-left"
          >
            <span
              className={`flex size-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                currentStep >= 1
                  ? "bg-masaar-black text-white"
                  : "bg-black/10 text-masaar-black/50"
              }`}
            >
              1
            </span>
            <div className="hidden sm:block">
              <span className="block text-xs font-medium text-masaar-black/50 uppercase tracking-wider">
                Step 1
              </span>
              <span
                className={`text-sm font-semibold ${
                  currentStep === 1 ? "text-deep-gold" : "text-masaar-black"
                }`}
              >
                Choose Vehicle
              </span>
            </div>
          </button>

          <div
            className={`h-0.5 flex-1 mx-4 transition-colors ${
              currentStep >= 2 ? "bg-deep-gold" : "bg-black/10"
            }`}
          />

          <button
            type="button"
            onClick={() => {
              if (selectedVehicle) setCurrentStep(2);
            }}
            className="flex items-center gap-2 text-left"
          >
            <span
              className={`flex size-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                currentStep >= 2
                  ? "bg-masaar-black text-white"
                  : "bg-black/10 text-masaar-black/50"
              }`}
            >
              2
            </span>
            <div className="hidden sm:block">
              <span className="block text-xs font-medium text-masaar-black/50 uppercase tracking-wider">
                Step 2
              </span>
              <span
                className={`text-sm font-semibold ${
                  currentStep === 2 ? "text-deep-gold" : "text-masaar-black"
                }`}
              >
                Journey Details
              </span>
            </div>
          </button>

          <div
            className={`h-0.5 flex-1 mx-4 transition-colors ${
              currentStep === 3 ? "bg-deep-gold" : "bg-black/10"
            }`}
          />

          <button
            type="button"
            onClick={() => {
              if (travelDate && pickupTime) setCurrentStep(3);
            }}
            className="flex items-center gap-2 text-left"
          >
            <span
              className={`flex size-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                currentStep === 3
                  ? "bg-deep-gold text-white"
                  : "bg-black/10 text-masaar-black/50"
              }`}
            >
              3
            </span>
            <div className="hidden sm:block">
              <span className="block text-xs font-medium text-masaar-black/50 uppercase tracking-wider">
                Step 3
              </span>
              <span
                className={`text-sm font-semibold ${
                  currentStep === 3 ? "text-deep-gold" : "text-masaar-black"
                }`}
              >
                Review &amp; Enquire
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* STEP 1: CHOOSE VEHICLE */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-xl font-bold text-masaar-black sm:text-2xl">
                Choose Your Vehicle
              </h2>
              <p className="mt-1 text-xs text-masaar-black/60 sm:text-sm">
                Select the vehicle that best fits your passenger count and luggage needs.
                Prices include meet &amp; greet and highway toll fees.
              </p>
            </div>
            <div className="text-xs text-masaar-black/50">
              Prices displayed in <strong className="font-bold text-masaar-black">{currency}</strong>
            </div>
          </div>

          {vehicles.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {vehicles.map((v) => {
                const isSelected = selectedVehicle?.vehicleId === v.vehicleId;
                return (
                  <div
                    key={v.vehicleId}
                    className={`relative flex flex-col justify-between overflow-hidden rounded-xl border bg-white p-5 transition-all duration-200 ${
                      isSelected
                        ? "border-deep-gold ring-2 ring-deep-gold shadow-md"
                        : "border-black/10 hover:border-black/25 hover:shadow-sm"
                    }`}
                  >
                    {/* Vehicle Header & Image */}
                    <div>
                      <div className="relative aspect-16/10 w-full overflow-hidden rounded-lg bg-warm-ivory">
                        <Image
                          src={v.imageUrl || "/vehicles/sedan.jpg"}
                          alt={`${v.vehicleName} private transfer vehicle`}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-contain p-2"
                        />
                      </div>

                      <div className="mt-4 flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-base font-bold text-masaar-black">
                            {v.vehicleName}
                          </h3>
                          <span className="text-xs text-masaar-black/50">
                            {v.modelYear} • {v.vehicleType}
                          </span>
                        </div>
                      </div>

                      <p className="mt-2 text-xs leading-relaxed text-masaar-black/65">
                        {v.description}
                      </p>

                      {/* Specs Strip */}
                      <div className="mt-4 flex flex-wrap gap-2 border-t border-black/5 pt-3">
                        <div className="flex items-center gap-1.5 rounded-md bg-warm-ivory/80 px-2.5 py-1 text-xs text-masaar-black/80">
                          <svg className="size-3.5 text-deep-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7 7z" />
                          </svg>
                          <span>Up to {v.passengerCapacity} Passengers</span>
                        </div>

                        <div className="flex items-center gap-1.5 rounded-md bg-warm-ivory/80 px-2.5 py-1 text-xs text-masaar-black/80">
                          <svg className="size-3.5 text-deep-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                          <span>{v.luggageCapacity} Suitcases</span>
                        </div>
                      </div>

                      {/* Features Checkmarks */}
                      <ul className="mt-3 space-y-1 text-[11px] text-masaar-black/65">
                        {v.features.map((feat, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-deep-gold">✓</span>
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Price & Action */}
                    <div className="mt-6 border-t border-black/10 pt-4">
                      <div className="mb-3 flex items-baseline justify-between">
                        <span className="text-xs text-masaar-black/60">Indicative Price</span>
                        <div className="text-right">
                          <span className="text-xl font-bold text-masaar-black">
                            <Price amountAed={v.priceAed} />
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleProceedToDetails(v.vehicleId)}
                        className={`w-full rounded-lg py-2.5 text-xs font-bold transition-colors ${
                          isSelected
                            ? "bg-deep-gold text-white hover:bg-deep-gold/90"
                            : "bg-masaar-black text-white hover:bg-deep-gold"
                        }`}
                      >
                        {isSelected ? "Selected — Continue →" : "Select Vehicle"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-black/10 bg-warm-ivory/50 p-8 text-center">
              <h3 className="text-base font-semibold text-masaar-black">
                Custom Fleet Arrangements
              </h3>
              <p className="mt-2 text-xs text-masaar-black/60">
                Vehicles for this specific route are arranged on-demand. Please contact our team
                directly on WhatsApp for a custom quotation and confirmed fleet availability.
              </p>
              <div className="mt-4">
                <a
                  href={buildWhatsAppLink(
                    `Assalamu Alaikum, I would like to enquire about custom transfer arrangements for route: ${route.route_name}.`,
                    whatsappPhone
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-masaar-black px-4 py-2 text-xs font-semibold text-white hover:bg-deep-gold"
                >
                  Enquire Directly on WhatsApp
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: JOURNEY DETAILS FORM */}
      {currentStep === 2 && (
        <form onSubmit={handleProceedToReview} className="space-y-6">
          {/* Selected Vehicle Reminder Bar */}
          {selectedVehicle && (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-black/10 bg-warm-ivory/40 p-4">
              <div className="flex items-center gap-3">
                <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-white">
                  <Image
                    src={selectedVehicle.imageUrl || "/vehicles/sedan.jpg"}
                    alt={`${selectedVehicle.vehicleName} private transfer vehicle`}
                    fill
                    className="object-contain p-1"
                  />
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider text-masaar-black/50 font-semibold">
                    Selected Vehicle
                  </span>
                  <div className="text-sm font-bold text-masaar-black">
                    {selectedVehicle.vehicleName}{" "}
                    <span className="font-normal text-xs text-masaar-black/60">
                      ({selectedVehicle.modelYear})
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-[10px] text-masaar-black/50 uppercase">Rate</span>
                  <div className="text-sm font-bold text-deep-gold">
                    <Price amountAed={selectedVehicle.priceAed} />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="text-xs font-semibold text-deep-gold underline hover:text-masaar-black"
                >
                  Change
                </button>
              </div>
            </div>
          )}

          {/* Form Fields Card */}
          <div className="rounded-xl border border-black/10 bg-white p-6 shadow-xs">
            <h2 className="text-lg font-bold text-masaar-black">Enter Journey Details</h2>
            <p className="mt-1 text-xs text-masaar-black/60">
              Provide your travel timing and party size so we can verify vehicle suitability and prepare your enquiry.
            </p>

            {validationError && (
              <div className="mt-4 rounded-lg bg-red-50 p-3 text-xs font-medium text-red-700">
                {validationError}
              </div>
            )}

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {/* Travel Date */}
              <div>
                <label htmlFor={`${formId}-travel-date`} className="block text-xs font-semibold text-masaar-black">
                  Travel Date <span className="text-red-500">*</span>
                </label>
                <input
                  id={`${formId}-travel-date`}
                  type="date"
                  min={todayStr}
                  value={travelDate}
                  onChange={(e) => setTravelDate(e.target.value)}
                  required
                  className="mt-1.5 w-full rounded-lg border border-black/15 bg-white px-3 py-2.5 text-xs text-masaar-black focus:border-deep-gold focus:outline-none"
                />
              </div>

              {/* Pickup Time */}
              <div>
                <label htmlFor={`${formId}-pickup-time`} className="block text-xs font-semibold text-masaar-black">
                  Estimated Pickup Time <span className="text-red-500">*</span>
                </label>
                <input
                  id={`${formId}-pickup-time`}
                  type="time"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  required
                  className="mt-1.5 w-full rounded-lg border border-black/15 bg-white px-3 py-2.5 text-xs text-masaar-black focus:border-deep-gold focus:outline-none"
                />
              </div>

              {/* Passenger Count */}
              <div>
                <label htmlFor={`${formId}-passengers`} className="block text-xs font-semibold text-masaar-black">
                  Number of Passengers <span className="text-red-500">*</span>
                </label>
                <div className="mt-1.5 flex items-center gap-3">
                  <input
                    id={`${formId}-passengers`}
                    type="number"
                    min={1}
                    max={selectedVehicle?.passengerCapacity || 50}
                    value={passengers}
                    onChange={(e) => setPassengers(Math.max(1, parseInt(e.target.value) || 1))}
                    required
                    className="w-full rounded-lg border border-black/15 bg-white px-3 py-2.5 text-xs text-masaar-black focus:border-deep-gold focus:outline-none"
                  />
                  {selectedVehicle && (
                    <span className="shrink-0 text-[11px] text-masaar-black/50">
                      (Max {selectedVehicle.passengerCapacity})
                    </span>
                  )}
                </div>
              </div>

              {/* Luggage Quantity */}
              <div>
                <label htmlFor={`${formId}-luggage`} className="block text-xs font-semibold text-masaar-black">
                  Number of Suitcases <span className="text-masaar-black/40 font-normal">(Optional)</span>
                </label>
                <select
                  id={`${formId}-luggage`}
                  value={luggage}
                  onChange={(e) => setLuggage(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-black/15 bg-white px-3 py-2.5 text-xs text-masaar-black focus:border-deep-gold focus:outline-none"
                >
                  <option value="0">0 (Hand carry only)</option>
                  <option value="1">1 Large Suitcase</option>
                  <option value="2">2 Large Suitcases</option>
                  <option value="3">3 Large Suitcases</option>
                  <option value="4">4 Large Suitcases</option>
                  <option value="5">5 Large Suitcases</option>
                  <option value="6">6 Large Suitcases</option>
                  <option value="8">7–8 Suitcases</option>
                  <option value="12">9–12 Suitcases</option>
                  <option value="20">15+ Suitcases (Group)</option>
                </select>
              </div>

              {/* Flight Number (Only shown for airport routes) */}
              {isAirportRoute && (
                <div className="sm:col-span-2">
                  <label htmlFor={`${formId}-flight-number`} className="block text-xs font-semibold text-masaar-black">
                    Flight Number <span className="text-masaar-black/40 font-normal">(Optional — e.g. SV 123, EK 804)</span>
                  </label>
                  <input
                    id={`${formId}-flight-number`}
                    type="text"
                    value={flightNumber}
                    onChange={(e) => setFlightNumber(e.target.value)}
                    placeholder="Enter flight number for live arrival monitoring"
                    className="mt-1.5 w-full rounded-lg border border-black/15 bg-white px-3 py-2.5 text-xs text-masaar-black focus:border-deep-gold focus:outline-none"
                  />
                </div>
              )}

              {/* Pickup Location details */}
              <div>
                <label htmlFor={`${formId}-pickup-location`} className="block text-xs font-semibold text-masaar-black">
                  Pickup Location / Meeting Point
                </label>
                <input
                  id={`${formId}-pickup-location`}
                  type="text"
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  placeholder="e.g. Airport Terminal 1, Hotel Name"
                  className="mt-1.5 w-full rounded-lg border border-black/15 bg-white px-3 py-2.5 text-xs text-masaar-black focus:border-deep-gold focus:outline-none"
                />
              </div>

              {/* Drop-off Location details */}
              <div>
                <label htmlFor={`${formId}-dropoff-location`} className="block text-xs font-semibold text-masaar-black">
                  Drop-off Location / Destination
                </label>
                <input
                  id={`${formId}-dropoff-location`}
                  type="text"
                  value={dropoffLocation}
                  onChange={(e) => setDropoffLocation(e.target.value)}
                  placeholder="e.g. Makkah Hotel Name, Terminal 1"
                  className="mt-1.5 w-full rounded-lg border border-black/15 bg-white px-3 py-2.5 text-xs text-masaar-black focus:border-deep-gold focus:outline-none"
                />
              </div>

              {/* Additional Notes */}
              <div className="sm:col-span-2">
                <label htmlFor={`${formId}-notes`} className="block text-xs font-semibold text-masaar-black">
                  Special Requests / Additional Notes <span className="text-masaar-black/40 font-normal">(Optional)</span>
                </label>
                <textarea
                  id={`${formId}-notes`}
                  rows={2}
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="e.g. traveling with an infant, need baby seat, wheelchair assistance..."
                  className="mt-1.5 w-full rounded-lg border border-black/15 bg-white px-3 py-2.5 text-xs text-masaar-black focus:border-deep-gold focus:outline-none"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-8 flex items-center justify-between border-t border-black/5 pt-4">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="text-xs font-semibold text-masaar-black/60 hover:text-masaar-black"
              >
                ← Back to Vehicle Selection
              </button>

              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-masaar-black px-6 py-2.5 text-xs font-bold text-white transition-colors hover:bg-deep-gold"
              >
                <span>Continue to Review</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* STEP 3: REVIEW & ENQUIRE */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="rounded-xl border border-black/10 bg-white p-6 shadow-xs sm:p-8">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-deep-gold">
                  Enquiry Summary
                </span>
                <h2 className="mt-1 text-xl font-bold text-masaar-black sm:text-2xl">
                  Review Your Transfer Enquiry
                </h2>
                <p className="mt-1 text-xs text-masaar-black/60">
                  Please verify your journey details below. Clicking the button will open WhatsApp with your pre-filled enquiry.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-medium text-masaar-black hover:bg-black/5"
              >
                Edit Details
              </button>
            </div>

            {/* Summary Details Grid */}
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {/* Left Column: Route & Vehicle Card */}
              <div className="rounded-lg border border-black/10 bg-warm-ivory/30 p-5">
                <div className="flex items-center gap-3">
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-white border border-black/10">
                    <Image
                      src={selectedVehicle?.imageUrl || "/vehicles/sedan.jpg"}
                      alt={`${selectedVehicle?.vehicleName || "Transfer"} private vehicle`}
                      fill
                      className="object-contain p-1"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-deep-gold">
                      Route
                    </span>
                    <h3 className="text-sm font-bold text-masaar-black">
                      {route.route_name}
                    </h3>
                    <div className="text-xs text-masaar-black/70">
                      Vehicle: <strong>{selectedVehicle?.vehicleName}</strong> ({selectedVehicle?.modelYear})
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-2 border-t border-black/10 pt-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-masaar-black/60">Estimated Journey:</span>
                    <span className="font-semibold text-masaar-black">{route.durationText}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-masaar-black/60">Pickup:</span>
                    <span className="max-w-[60%] truncate font-medium text-masaar-black text-right">
                      {pickupLocation}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-masaar-black/60">Drop-off:</span>
                    <span className="max-w-[60%] truncate font-medium text-masaar-black text-right">
                      {dropoffLocation}
                    </span>
                  </div>
                  {selectedVehicle?.priceAed ? (
                    <div className="flex justify-between border-t border-black/10 pt-2 text-sm font-bold">
                      <span className="text-masaar-black">Indicative Price:</span>
                      <span className="text-deep-gold">
                        <Price amountAed={selectedVehicle.priceAed} />
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Right Column: Travel Party & Schedule Details */}
              <div className="rounded-lg border border-black/10 bg-white p-5 space-y-3 text-xs">
                <div className="flex justify-between border-b border-black/5 pb-2">
                  <span className="text-masaar-black/60">Travel Date:</span>
                  <span className="font-bold text-masaar-black">{formattedDate}</span>
                </div>

                <div className="flex justify-between border-b border-black/5 pb-2">
                  <span className="text-masaar-black/60">Pickup Time:</span>
                  <span className="font-bold text-masaar-black">{pickupTime}</span>
                </div>

                <div className="flex justify-between border-b border-black/5 pb-2">
                  <span className="text-masaar-black/60">Passengers:</span>
                  <span className="font-bold text-masaar-black">{passengers} Passengers</span>
                </div>

                <div className="flex justify-between border-b border-black/5 pb-2">
                  <span className="text-masaar-black/60">Suitcases:</span>
                  <span className="font-bold text-masaar-black">{luggage} Suitcases</span>
                </div>

                {isAirportRoute && flightNumber.trim() && (
                  <div className="flex justify-between border-b border-black/5 pb-2">
                    <span className="text-masaar-black/60">Flight Number:</span>
                    <span className="font-bold text-masaar-black uppercase">{flightNumber.trim()}</span>
                  </div>
                )}

                {additionalNotes.trim() && (
                  <div className="pt-1">
                    <span className="text-masaar-black/60">Notes:</span>
                    <p className="mt-1 italic text-masaar-black/80">{additionalNotes.trim()}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Notice Banner */}
            <div className="mt-6 flex items-start gap-3 rounded-lg bg-amber-50/80 p-4 text-xs text-amber-900 border border-amber-200/60">
              <svg className="size-5 shrink-0 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <strong className="font-semibold">Availability Verification:</strong>
                <p className="mt-0.5">
                  This enquiry requests availability and final confirmation from Masaar Holidays.
                  Our concierge team will review your travel details on WhatsApp and confirm driver scheduling.
                </p>
              </div>
            </div>

            {/* WhatsApp CTA Button */}
            <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-black/10 pt-6 sm:flex-row">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="text-xs font-semibold text-masaar-black/60 hover:text-masaar-black"
              >
                ← Back to Edit Details
              </button>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#25D366] px-8 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-[#1EBE5D] hover:shadow-lg sm:w-auto"
              >
                <svg className="size-5 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                </svg>
                <span>Enquire on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
