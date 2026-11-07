"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import type { LineItemPricingInput } from "@/lib/documents/calculations";
import {
  extractFlightMetadata,
  formatFlightDetails,
} from "@/lib/documents/flight-attachment";

interface FlightItinerarySectionProps {
  documentId: string;
  lineItems: LineItemPricingInput[];
  adultsCount: number;
  origin?: string | null;
  destination?: string | null;
  onUpdateLineItems: (items: LineItemPricingInput[]) => void;
  onPersist: (items: LineItemPricingInput[]) => void;
}

export function FlightItinerarySection({
  documentId,
  lineItems,
  adultsCount,
  origin,
  destination,
  onUpdateLineItems,
  onPersist,
}: FlightItinerarySectionProps) {
  const flightItemIndex = lineItems.findIndex(
    (it) => it.item_type === "flight"
  );
  const flightItem = flightItemIndex >= 0 ? lineItems[flightItemIndex] : null;

  // Extract initial metadata
  const meta = extractFlightMetadata(flightItem?.details);

  const [airline, setAirline] = useState<string>(
    meta.airline ||
      (flightItem?.description?.includes("–")
        ? flightItem.description.split("–")[0].trim()
        : flightItem?.description || "Emirates Airlines")
  );
  const [pnr, setPnr] = useState<string>(meta.pnr || "");
  const [routeDescription, setRouteDescription] = useState<string>(
    meta.cleanDetails ||
      `${origin || "Dubai (DXB)"} ⇄ ${destination || "Jeddah (JED)"} • Return Flight • Baggage Included`
  );
  const [departureArrival, setDepartureArrival] = useState<string>(
    meta.departureArrival || ""
  );
  const [screenshotUrl, setScreenshotUrl] = useState<string>(
    meta.screenshotUrl || ""
  );
  const [screenshotName, setScreenshotName] = useState<string>(
    meta.screenshotName || ""
  );
  const [unitPriceAed, setUnitPriceAed] = useState<number>(
    flightItem ? Number(flightItem.unit_price_aed || 0) : 1850
  );
  const [isIncluded, setIsIncluded] = useState<boolean>(
    flightItem?.is_included ?? false
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state if flightItem changes externally
  React.useEffect(() => {
    if (!flightItem) return;
    const m = extractFlightMetadata(flightItem.details);
    if (m.airline) setAirline(m.airline);
    if (m.pnr) setPnr(m.pnr);
    if (m.cleanDetails) setRouteDescription(m.cleanDetails);
    if (m.departureArrival) setDepartureArrival(m.departureArrival);
    if (m.screenshotUrl) setScreenshotUrl(m.screenshotUrl);
    if (m.screenshotName) setScreenshotName(m.screenshotName);
    setUnitPriceAed(Number(flightItem.unit_price_aed || 0));
    setIsIncluded(Boolean(flightItem.is_included));
  }, [flightItem]);

  // Upload handler
  async function handleFileUpload(file: File) {
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(file.type.toLowerCase())) {
      setUploadError("Please upload a PNG, JPG, or JPEG screenshot.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Screenshot size must be 10 MB or less.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentId", documentId);

      const res = await fetch("/api/admin/documents/flight-attachment", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to upload screenshot");
      }

      setScreenshotUrl(data.url);
      setScreenshotName(data.fileName);

      // Auto-save to line items
      applyFlightChanges(
        airline,
        pnr,
        routeDescription,
        departureArrival,
        data.url,
        data.fileName,
        unitPriceAed,
        isIncluded
      );
    } catch (err: any) {
      console.error("[FlightItinerarySection] upload error:", err);
      setUploadError(err?.message || "Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }

  // Remove screenshot handler
  async function handleRemoveScreenshot() {
    const prevUrl = screenshotUrl;
    setScreenshotUrl("");
    setScreenshotName("");

    if (prevUrl) {
      try {
        await fetch("/api/admin/documents/flight-attachment", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: prevUrl }),
        });
      } catch (err) {
        console.warn("Failed to delete remote file:", err);
      }
    }

    applyFlightChanges(
      airline,
      pnr,
      routeDescription,
      departureArrival,
      "",
      "",
      unitPriceAed,
      isIncluded
    );
  }

  // Remove entire flight line item
  function handleRemoveFlight() {
    if (flightItemIndex >= 0) {
      const next = lineItems.filter((_, idx) => idx !== flightItemIndex);
      onUpdateLineItems(next);
      onPersist(next);
    }
  }

  // Build and apply flight item to lineItems
  function applyFlightChanges(
    newAirline: string,
    newPnr: string,
    newRoute: string,
    newTimes: string,
    newUrl: string,
    newName: string,
    newPrice: number,
    newIncluded: boolean
  ) {
    const formattedDetails = formatFlightDetails({
      cleanDetails: newRoute.trim(),
      screenshotUrl: newUrl.trim() || undefined,
      screenshotName: newName.trim() || undefined,
      airline: newAirline.trim() || undefined,
      pnr: newPnr.trim() || undefined,
      departureArrival: newTimes.trim() || undefined,
    });

    const flightTitle = newAirline.trim()
      ? `${newAirline.trim()} – Scheduled Flight`
      : "Scheduled Flight";

    const updatedItem: LineItemPricingInput = {
      id: flightItem?.id,
      item_type: "flight",
      description: flightTitle,
      details: formattedDetails,
      quantity: Math.max(1, adultsCount || 1),
      unit: "ticket",
      unit_price_aed: newIncluded ? 0 : newPrice,
      catalog_unit_price_aed: newPrice,
      is_overridden: true,
      discount_aed: 0,
      is_price_on_request: false,
      is_included: newIncluded,
      display_order: flightItem?.display_order ?? lineItems.length,
    };

    let nextItems: LineItemPricingInput[];
    if (flightItemIndex >= 0) {
      nextItems = [...lineItems];
      nextItems[flightItemIndex] = updatedItem;
    } else {
      nextItems = [...lineItems, updatedItem];
    }

    onUpdateLineItems(nextItems);
    onPersist(nextItems);
  }

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/10 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-xl bg-[#FAF8F5] text-base border border-[#c9983e]/30">
            ✈️
          </span>
          <div>
            <h3 className="font-serif text-base font-bold text-black flex items-center gap-2">
              Flight Itinerary &amp; Screenshot Attachment
            </h3>
            <p className="text-xs text-black/60">
              Attach GDS or airline flight screenshots. They will render cleanly in customer quotations and PDFs.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {flightItem ? (
            <button
              type="button"
              onClick={handleRemoveFlight}
              className="rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 px-2.5 py-1 text-xs font-semibold cursor-pointer"
            >
              Remove Flight
            </button>
          ) : (
            <button
              type="button"
              onClick={() =>
                applyFlightChanges(
                  airline,
                  pnr,
                  routeDescription,
                  departureArrival,
                  screenshotUrl,
                  screenshotName,
                  unitPriceAed,
                  isIncluded
                )
              }
              className="rounded-lg bg-[#b37e28] hover:bg-[#916d28] text-white px-3 py-1 text-xs font-bold cursor-pointer"
            >
              + Add Flight Itinerary
            </button>
          )}
        </div>
      </div>

      {uploadError && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">
          ⚠️ {uploadError}
        </div>
      )}

      {/* Main Grid: Upload box on left/top + Metadata fields */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Screenshot Upload & Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <label className="block text-xs font-semibold text-black">
            Flight Screenshot Attachment (PNG, JPG, JPEG)
          </label>

          {screenshotUrl ? (
            <div className="rounded-xl border border-black/15 bg-neutral-50 p-3 space-y-2.5">
              <div
                className="relative h-48 w-full rounded-lg overflow-hidden border border-black/10 bg-white cursor-pointer group"
                onClick={() => setIsLightboxOpen(true)}
                title="Click to enlarge"
              >
                <Image
                  src={screenshotUrl}
                  alt="Flight Itinerary Screenshot"
                  fill
                  className="object-contain p-1 group-hover:scale-102 transition-transform"
                  unoptimized
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                  🔍 Click to Enlarge
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="truncate text-black/60 max-w-[180px]" title={screenshotName}>
                  📎 {screenshotName || "flight_itinerary.png"}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="rounded-md border border-black/20 bg-white px-2 py-1 text-[11px] font-semibold text-black hover:bg-black/5 cursor-pointer"
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveScreenshot}
                    disabled={isUploading}
                    className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-100 cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) handleFileUpload(file);
              }}
              className={`rounded-xl border-2 border-dashed border-black/20 bg-[#FAF9F6] p-6 text-center hover:bg-white hover:border-[#b37e28] transition-all cursor-pointer ${
                isUploading ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              <div className="mx-auto size-10 rounded-full bg-[#b37e28]/10 text-[#b37e28] flex items-center justify-center text-lg mb-2">
                📸
              </div>
              <p className="text-xs font-bold text-black">
                {isUploading ? "Uploading Screenshot..." : "Upload Flight Itinerary Screenshot"}
              </p>
              <p className="text-[11px] text-black/50 mt-1">
                Drag and drop or click to browse. Max 10 MB (PNG, JPG, JPEG).
              </p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
              e.target.value = "";
            }}
          />

          <p className="text-[11px] text-black/50 leading-relaxed">
            💡 The screenshot preserves its original aspect ratio and fits neatly inside the customer quotation PDF page. If omitted, a clean text summary is shown.
          </p>
        </div>

        {/* Right: Flight Details & Metadata (7 cols) */}
        <div className="lg:col-span-7 space-y-3.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-black mb-1">
                Airline Name
              </label>
              <input
                type="text"
                value={airline}
                onChange={(e) => setAirline(e.target.value)}
                onBlur={() =>
                  applyFlightChanges(
                    airline,
                    pnr,
                    routeDescription,
                    departureArrival,
                    screenshotUrl,
                    screenshotName,
                    unitPriceAed,
                    isIncluded
                  )
                }
                placeholder="e.g. Emirates / Saudia / flydubai / IndiGo"
                className="w-full rounded-xl border border-black/15 p-2.5 text-xs text-black bg-white focus:border-[#b37e28] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-black mb-1">
                PNR / Booking Reference
              </label>
              <input
                type="text"
                value={pnr}
                onChange={(e) => setPnr(e.target.value)}
                onBlur={() =>
                  applyFlightChanges(
                    airline,
                    pnr,
                    routeDescription,
                    departureArrival,
                    screenshotUrl,
                    screenshotName,
                    unitPriceAed,
                    isIncluded
                  )
                }
                placeholder="e.g. EK-847291 / 6E-90214"
                className="w-full rounded-xl border border-black/15 p-2.5 text-xs uppercase font-mono font-bold text-black bg-white focus:border-[#b37e28] focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-black mb-1">
              Flight Routing &amp; Description
            </label>
            <input
              type="text"
              value={routeDescription}
              onChange={(e) => setRouteDescription(e.target.value)}
              onBlur={() =>
                applyFlightChanges(
                  airline,
                  pnr,
                  routeDescription,
                  departureArrival,
                  screenshotUrl,
                  screenshotName,
                  unitPriceAed,
                  isIncluded
                )
              }
              placeholder="e.g. Dubai (DXB) ⇄ Jeddah (JED) • Economy Class with 30kg Baggage"
              className="w-full rounded-xl border border-black/15 p-2.5 text-xs text-black bg-white focus:border-[#b37e28] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold text-black mb-1">
              Departure &amp; Arrival Schedule (Optional)
            </label>
            <input
              type="text"
              value={departureArrival}
              onChange={(e) => setDepartureArrival(e.target.value)}
              onBlur={() =>
                applyFlightChanges(
                  airline,
                  pnr,
                  routeDescription,
                  departureArrival,
                  screenshotUrl,
                  screenshotName,
                  unitPriceAed,
                  isIncluded
                )
              }
              placeholder="e.g. Outbound: 08:30 – 10:45 | Return: 19:15 – 23:20"
              className="w-full rounded-xl border border-black/15 p-2.5 text-xs text-black bg-white focus:border-[#b37e28] focus:outline-hidden"
            />
          </div>

          {/* Pricing Options */}
          <div className="rounded-xl border border-black/10 bg-[#FAF8F5] p-3.5 space-y-2.5">
            <span className="font-semibold text-black block">Flight Pricing Structure</span>

            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="flightPricingMode"
                  checked={isIncluded}
                  onChange={() => {
                    setIsIncluded(true);
                    applyFlightChanges(
                      airline,
                      pnr,
                      routeDescription,
                      departureArrival,
                      screenshotUrl,
                      screenshotName,
                      unitPriceAed,
                      true
                    );
                  }}
                  className="rounded-full text-[#b37e28] focus:ring-[#b37e28]"
                />
                <span className="font-semibold text-black">
                  Included in Package Price (AED 0 separate)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="flightPricingMode"
                  checked={!isIncluded}
                  onChange={() => {
                    setIsIncluded(false);
                    applyFlightChanges(
                      airline,
                      pnr,
                      routeDescription,
                      departureArrival,
                      screenshotUrl,
                      screenshotName,
                      unitPriceAed,
                      false
                    );
                  }}
                  className="rounded-full text-[#b37e28] focus:ring-[#b37e28]"
                />
                <span className="font-semibold text-black">
                  Separate Flight Charge
                </span>
              </label>
            </div>

            {!isIncluded && (
              <div className="pt-2 flex items-center gap-3">
                <div className="w-48">
                  <label className="block text-[11px] text-black/60 mb-0.5">
                    Price per Ticket (AED)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={unitPriceAed}
                    onChange={(e) => setUnitPriceAed(Number(e.target.value) || 0)}
                    onBlur={() =>
                      applyFlightChanges(
                        airline,
                        pnr,
                        routeDescription,
                        departureArrival,
                        screenshotUrl,
                        screenshotName,
                        unitPriceAed,
                        false
                      )
                    }
                    className="w-full rounded-lg border border-black/20 p-1.5 font-mono font-bold text-xs bg-white"
                  />
                </div>
                <div className="text-[11px] text-black/60 pt-4">
                  Total Flights ({adultsCount || 1} Pax):{" "}
                  <strong className="text-black">
                    AED {((adultsCount || 1) * unitPriceAed).toLocaleString()}
                  </strong>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox / Fullscreen Preview Modal */}
      {isLightboxOpen && screenshotUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] w-full rounded-2xl bg-white p-4 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-black/10">
              <span className="font-serif font-bold text-sm text-black">
                {airline} — Flight Itinerary Screenshot
              </span>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="rounded-lg p-1 text-black/60 hover:text-black"
              >
                ✕
              </button>
            </div>
            <div className="relative h-[70vh] w-full mt-3 bg-neutral-100 rounded-xl overflow-hidden">
              <Image
                src={screenshotUrl}
                alt="Enlarged Flight Screenshot"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

