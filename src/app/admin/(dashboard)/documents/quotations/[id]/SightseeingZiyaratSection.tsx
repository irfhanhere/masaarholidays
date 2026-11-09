"use client";

import React, { useState, useEffect } from "react";
import type { LineItemPricingInput } from "@/lib/documents/calculations";

interface SightseeingZiyaratSectionProps {
  lineItems: LineItemPricingInput[];
  adultsCount: number;
  onUpdateLineItems: (items: LineItemPricingInput[]) => void;
  onPersist: (items: LineItemPricingInput[]) => void;
}

export type ZiyaratArrangement = "none" | "shared" | "private" | "custom";

const VEHICLE_OPTIONS = [
  { label: "GMC Yukon XL / Suburban (Private Luxury SUV - Up to 7 Pax)", value: "GMC Yukon XL / Suburban" },
  { label: "Hyundai Staria VIP Van (Executive Van - Up to 7 Pax)", value: "Hyundai Staria VIP Van" },
  { label: "Toyota HiAce Mini-Coach (Up to 11 Pax)", value: "Toyota HiAce Mini-Coach" },
  { label: "Executive Sedan / Camry (Up to 3 Pax)", value: "Executive Sedan" },
  { label: "Shared Air-Conditioned Coaster / Bus", value: "Shared Tourist Coach" },
  { label: "Custom Vehicle Arrangement", value: "Custom Vehicle Arrangement" },
];

const DURATION_OPTIONS = [
  "2 – 2.5 Hours",
  "3 – 4 Hours (Half Day)",
  "Full Day Tour",
  "Custom Duration",
];

const MAKKAH_DEFAULT_SITES =
  "Jabal Al Nour (Cave Hira), Jabal Thawr, Mina & Muzdalifah (Pass By), Plains of Arafat & Mount of Mercy";
const MADINAH_DEFAULT_SITES =
  "Mount Uhud, Shuhada Uhud Cemetery (Pass By), Mount Rumah, Masjid Quba, Garden Salman Al-Farsi, Bi'r Ghars / Well";

export function SightseeingZiyaratSection({
  lineItems,
  adultsCount,
  onUpdateLineItems,
  onPersist,
}: SightseeingZiyaratSectionProps) {
  // Find existing Makkah & Madinah Ziyarat items
  const makkahIndex = lineItems.findIndex(
    (li) =>
      li.description.toLowerCase().includes("makkah") &&
      (li.description.toLowerCase().includes("ziyarat") ||
        li.description.toLowerCase().includes("sightseeing") ||
        li.item_type === "private_trip")
  );
  const madinahIndex = lineItems.findIndex(
    (li) =>
      li.description.toLowerCase().includes("madinah") &&
      (li.description.toLowerCase().includes("ziyarat") ||
        li.description.toLowerCase().includes("sightseeing") ||
        li.item_type === "private_trip")
  );

  const makkahItem = makkahIndex >= 0 ? lineItems[makkahIndex] : null;
  const madinahItem = madinahIndex >= 0 ? lineItems[madinahIndex] : null;

  // Local state for Makkah
  const [makkahArrangement, setMakkahArrangement] = useState<ZiyaratArrangement>(
    makkahItem
      ? makkahItem.description.toLowerCase().includes("shared")
        ? "shared"
        : makkahItem.description.toLowerCase().includes("custom")
        ? "custom"
        : "private"
      : "none"
  );
  const [makkahVehicle, setMakkahVehicle] = useState<string>("GMC Yukon XL / Suburban");
  const [makkahDuration, setMakkahDuration] = useState<string>("2 – 2.5 Hours");
  const [makkahGuideDetails, setMakkahGuideDetails] = useState<string>("Licensed Bilingual Guide");
  const [makkahSites, setMakkahSites] = useState<string>(MAKKAH_DEFAULT_SITES);
  const [makkahPrice, setMakkahPrice] = useState<number>(350);
  const [makkahIncluded, setMakkahIncluded] = useState<boolean>(true);

  // Local state for Madinah
  const [madinahArrangement, setMadinahArrangement] = useState<ZiyaratArrangement>(
    madinahItem
      ? madinahItem.description.toLowerCase().includes("shared")
        ? "shared"
        : madinahItem.description.toLowerCase().includes("custom")
        ? "custom"
        : "private"
      : "none"
  );
  const [madinahVehicle, setMadinahVehicle] = useState<string>("GMC Yukon XL / Suburban");
  const [madinahDuration, setMadinahDuration] = useState<string>("2 – 2.5 Hours");
  const [madinahGuideDetails, setMadinahGuideDetails] = useState<string>("Licensed Bilingual Guide");
  const [madinahSites, setMadinahSites] = useState<string>(MADINAH_DEFAULT_SITES);
  const [madinahPrice, setMadinahPrice] = useState<number>(350);
  const [madinahIncluded, setMadinahIncluded] = useState<boolean>(true);

  // Parse existing details
  useEffect(() => {
    if (makkahItem) {
      const isShared = makkahItem.description.toLowerCase().includes("shared");
      const isCustom = makkahItem.description.toLowerCase().includes("custom");
      setMakkahArrangement(isShared ? "shared" : isCustom ? "custom" : "private");
      setMakkahIncluded(Boolean(makkahItem.is_included || Number(makkahItem.unit_price_aed) === 0));
      if (Number(makkahItem.unit_price_aed) > 0) {
        setMakkahPrice(Number(makkahItem.unit_price_aed));
      }
      const d = makkahItem.details || "";
      const vehMatch = d.match(/Vehicle:\s*([^•|]+)/i);
      if (vehMatch) setMakkahVehicle(vehMatch[1].trim());
      const durMatch = d.match(/Duration:\s*([^•|]+)/i);
      if (durMatch) setMakkahDuration(durMatch[1].trim());
      const guideMatch = d.match(/Guide:\s*([^•|]+)/i);
      if (guideMatch) setMakkahGuideDetails(guideMatch[1].trim());
      const sitesMatch = d.match(/Sites:\s*([^•|]+)/i);
      if (sitesMatch) setMakkahSites(sitesMatch[1].trim());
    } else {
      setMakkahArrangement("none");
    }

    if (madinahItem) {
      const isShared = madinahItem.description.toLowerCase().includes("shared");
      const isCustom = madinahItem.description.toLowerCase().includes("custom");
      setMadinahArrangement(isShared ? "shared" : isCustom ? "custom" : "private");
      setMadinahIncluded(Boolean(madinahItem.is_included || Number(madinahItem.unit_price_aed) === 0));
      if (Number(madinahItem.unit_price_aed) > 0) {
        setMadinahPrice(Number(madinahItem.unit_price_aed));
      }
      const d = madinahItem.details || "";
      const vehMatch = d.match(/Vehicle:\s*([^•|]+)/i);
      if (vehMatch) setMadinahVehicle(vehMatch[1].trim());
      const durMatch = d.match(/Duration:\s*([^•|]+)/i);
      if (durMatch) setMadinahDuration(durMatch[1].trim());
      const guideMatch = d.match(/Guide:\s*([^•|]+)/i);
      if (guideMatch) setMadinahGuideDetails(guideMatch[1].trim());
      const sitesMatch = d.match(/Sites:\s*([^•|]+)/i);
      if (sitesMatch) setMadinahSites(sitesMatch[1].trim());
    } else {
      setMadinahArrangement("none");
    }
  }, [makkahItem, madinahItem]);

  // Synchronize state back into line items
  function applyZiyaratChanges(
    mArr: ZiyaratArrangement,
    mVeh: string,
    mDur: string,
    mGuide: string,
    mSts: string,
    mPrc: number,
    mInc: boolean,
    madArr: ZiyaratArrangement,
    madVeh: string,
    madDur: string,
    madGuide: string,
    madSts: string,
    madPrc: number,
    madInc: boolean
  ) {
    let current = lineItems.filter(
      (li) =>
        !(
          (li.description.toLowerCase().includes("makkah") &&
            (li.description.toLowerCase().includes("ziyarat") ||
              li.description.toLowerCase().includes("sightseeing"))) ||
          (li.description.toLowerCase().includes("madinah") &&
            (li.description.toLowerCase().includes("ziyarat") ||
              li.description.toLowerCase().includes("sightseeing")))
        )
    );

    if (mArr !== "none") {
      const title =
        mArr === "shared"
          ? "Makkah Shared Group Ziyarat"
          : mArr === "custom"
          ? "Makkah Custom Ziyarat Arrangement"
          : "Makkah Private Ziyarat & Sightseeing";

      const detailsParts: string[] = [
        `City: Makkah`,
        `Arrangement: ${mArr === "shared" ? "Shared Group" : mArr === "custom" ? "Custom" : "Private Chauffeur"}`,
        `Duration: ${mDur}`,
        `Vehicle: ${mVeh}`,
        `Guide: ${mGuide}`,
        `Sites: ${mSts}`,
        `Hotel Lobby Pickup & Drop-Off`,
      ];

      const makkahLine: LineItemPricingInput = {
        item_type: "private_trip",
        description: title,
        details: detailsParts.join(" • "),
        quantity: 1,
        unit: "trip",
        unit_price_aed: mInc ? 0 : mPrc,
        catalog_unit_price_aed: mPrc,
        is_overridden: true,
        discount_aed: 0,
        is_price_on_request: false,
        is_included: mInc,
        display_order: current.length + 1,
      };
      current.push(makkahLine);
    }

    if (madArr !== "none") {
      const title =
        madArr === "shared"
          ? "Madinah Shared Group Ziyarat"
          : madArr === "custom"
          ? "Madinah Custom Ziyarat Arrangement"
          : "Madinah Private Ziyarat & Sightseeing";

      const detailsParts: string[] = [
        `City: Madinah`,
        `Arrangement: ${madArr === "shared" ? "Shared Group" : madArr === "custom" ? "Custom" : "Private Chauffeur"}`,
        `Duration: ${madDur}`,
        `Vehicle: ${madVeh}`,
        `Guide: ${madGuide}`,
        `Sites: ${madSts}`,
        `Hotel Lobby Pickup & Drop-Off`,
      ];

      const madinahLine: LineItemPricingInput = {
        item_type: "private_trip",
        description: title,
        details: detailsParts.join(" • "),
        quantity: 1,
        unit: "trip",
        unit_price_aed: madInc ? 0 : madPrc,
        catalog_unit_price_aed: madPrc,
        is_overridden: true,
        discount_aed: 0,
        is_price_on_request: false,
        is_included: madInc,
        display_order: current.length + 1,
      };
      current.push(madinahLine);
    }

    onUpdateLineItems(current);
    onPersist(current);
  }

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-black/10 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-xl bg-warm-ivory text-base border border-pure-gold/30">
            🕌
          </span>
          <div>
            <h3 className="font-serif text-base font-bold text-black flex items-center gap-2">
              Makkah &amp; Madinah Ziyarah Options
            </h3>
            <p className="text-xs text-black/60">
              Configure confirmed Ziyarah arrangements: Not included, Shared/group, Private, or Custom with vehicle, guide and itinerary details.
            </p>
          </div>
        </div>
      </div>

      {/* Two Tour Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1. MAKKAH ZIYARAH */}
        <div
          className={`rounded-2xl border p-4.5 transition-all ${
            makkahArrangement !== "none"
              ? "border-pure-gold bg-warm-ivory/30 ring-2 ring-pure-gold/20"
              : "border-black/10 bg-neutral-50/50 hover:bg-neutral-50"
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-serif font-bold text-sm text-black block">
                Makkah Ziyarah
              </span>
              {makkahArrangement !== "none" && (
                <span className="rounded-full bg-pure-gold/20 border border-pure-gold/40 px-2.5 py-0.5 text-[10px] font-bold text-[#865d1d] uppercase">
                  {makkahArrangement.toUpperCase()}
                </span>
              )}
            </div>

            {/* Arrangement Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-black mb-1">
                Arrangement Mode
              </label>
              <select
                value={makkahArrangement}
                onChange={(e) => {
                  const val = e.target.value as ZiyaratArrangement;
                  setMakkahArrangement(val);
                  applyZiyaratChanges(
                    val,
                    makkahVehicle,
                    makkahDuration,
                    makkahGuideDetails,
                    makkahSites,
                    makkahPrice,
                    makkahIncluded,
                    madinahArrangement,
                    madinahVehicle,
                    madinahDuration,
                    madinahGuideDetails,
                    madinahSites,
                    madinahPrice,
                    madinahIncluded
                  );
                }}
                className="w-full rounded-xl border border-black/15 bg-white p-2.5 text-xs text-black font-medium focus:border-pure-gold"
              >
                <option value="none">Not included</option>
                <option value="shared">Shared / group arrangement</option>
                <option value="private">Private arrangement</option>
                <option value="custom">Custom arrangement</option>
              </select>
            </div>

            {makkahArrangement !== "none" && (
              <div className="pt-3 border-t border-black/10 space-y-3 text-xs animate-in fade-in">
                {/* Vehicle & Duration */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-black mb-1">
                      Vehicle Details
                    </label>
                    <select
                      value={makkahVehicle}
                      onChange={(e) => {
                        setMakkahVehicle(e.target.value);
                        applyZiyaratChanges(
                          makkahArrangement,
                          e.target.value,
                          makkahDuration,
                          makkahGuideDetails,
                          makkahSites,
                          makkahPrice,
                          makkahIncluded,
                          madinahArrangement,
                          madinahVehicle,
                          madinahDuration,
                          madinahGuideDetails,
                          madinahSites,
                          madinahPrice,
                          madinahIncluded
                        );
                      }}
                      className="w-full rounded-lg border border-black/15 bg-white p-2 text-xs text-black"
                    >
                      {VEHICLE_OPTIONS.map((v) => (
                        <option key={v.value} value={v.value}>{v.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-black mb-1">
                      Tour Duration
                    </label>
                    <select
                      value={makkahDuration}
                      onChange={(e) => {
                        setMakkahDuration(e.target.value);
                        applyZiyaratChanges(
                          makkahArrangement,
                          makkahVehicle,
                          e.target.value,
                          makkahGuideDetails,
                          makkahSites,
                          makkahPrice,
                          makkahIncluded,
                          madinahArrangement,
                          madinahVehicle,
                          madinahDuration,
                          madinahGuideDetails,
                          madinahSites,
                          madinahPrice,
                          madinahIncluded
                        );
                      }}
                      className="w-full rounded-lg border border-black/15 bg-white p-2 text-xs text-black"
                    >
                      {DURATION_OPTIONS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Guide Details */}
                <div>
                  <label className="block text-[11px] font-semibold text-black mb-1">
                    Guide &amp; Chauffeur Details
                  </label>
                  <input
                    type="text"
                    value={makkahGuideDetails}
                    onChange={(e) => {
                      setMakkahGuideDetails(e.target.value);
                      applyZiyaratChanges(
                        makkahArrangement,
                        makkahVehicle,
                        makkahDuration,
                        e.target.value,
                        makkahSites,
                        makkahPrice,
                        makkahIncluded,
                        madinahArrangement,
                        madinahVehicle,
                        madinahDuration,
                        madinahGuideDetails,
                        madinahSites,
                        madinahPrice,
                        madinahIncluded
                      );
                    }}
                    placeholder="e.g. Licensed Bilingual Historical Guide"
                    className="w-full rounded-lg border border-black/15 bg-white p-2 text-xs text-black"
                  />
                </div>

                {/* Itinerary & Key Stops */}
                <div>
                  <label className="block text-[11px] font-semibold text-black mb-1">
                    Confirmed Itinerary &amp; Key Stops
                  </label>
                  <textarea
                    rows={2}
                    value={makkahSites}
                    onChange={(e) => {
                      setMakkahSites(e.target.value);
                      applyZiyaratChanges(
                        makkahArrangement,
                        makkahVehicle,
                        makkahDuration,
                        makkahGuideDetails,
                        e.target.value,
                        makkahPrice,
                        makkahIncluded,
                        madinahArrangement,
                        madinahVehicle,
                        madinahDuration,
                        madinahGuideDetails,
                        madinahSites,
                        madinahPrice,
                        madinahIncluded
                      );
                    }}
                    className="w-full rounded-lg border border-black/15 bg-white p-2 text-xs text-black leading-relaxed"
                  />
                </div>

                {/* Pricing & Inclusion Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-end">
                  <div>
                    <label className="block text-[11px] font-semibold text-black mb-1">
                      Price per Tour (AED)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={makkahPrice}
                      disabled={makkahIncluded}
                      onChange={(e) => {
                        const p = Math.max(0, Number(e.target.value) || 0);
                        setMakkahPrice(p);
                        applyZiyaratChanges(
                          makkahArrangement,
                          makkahVehicle,
                          makkahDuration,
                          makkahGuideDetails,
                          makkahSites,
                          p,
                          makkahIncluded,
                          madinahArrangement,
                          madinahVehicle,
                          madinahDuration,
                          madinahGuideDetails,
                          madinahSites,
                          madinahPrice,
                          madinahIncluded
                        );
                      }}
                      className="w-full rounded-lg border border-black/15 bg-white p-2 text-xs font-mono font-bold text-black disabled:bg-neutral-100"
                    />
                  </div>

                  <div className="pb-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-masaar-black">
                      <input
                        type="checkbox"
                        checked={makkahIncluded}
                        onChange={(e) => {
                          const inc = e.target.checked;
                          setMakkahIncluded(inc);
                          applyZiyaratChanges(
                            makkahArrangement,
                            makkahVehicle,
                            makkahDuration,
                            makkahGuideDetails,
                            makkahSites,
                            makkahPrice,
                            inc,
                            madinahArrangement,
                            madinahVehicle,
                            madinahDuration,
                            madinahGuideDetails,
                            madinahSites,
                            madinahPrice,
                            madinahIncluded
                          );
                        }}
                        className="size-4 rounded border-black/30 text-pure-gold focus:ring-pure-gold"
                      />
                      <span>Included in Base Package</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. MADINAH ZIYARAH */}
        <div
          className={`rounded-2xl border p-4.5 transition-all ${
            madinahArrangement !== "none"
              ? "border-pure-gold bg-warm-ivory/30 ring-2 ring-pure-gold/20"
              : "border-black/10 bg-neutral-50/50 hover:bg-neutral-50"
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-serif font-bold text-sm text-black block">
                Madinah Ziyarah
              </span>
              {madinahArrangement !== "none" && (
                <span className="rounded-full bg-pure-gold/20 border border-pure-gold/40 px-2.5 py-0.5 text-[10px] font-bold text-[#865d1d] uppercase">
                  {madinahArrangement.toUpperCase()}
                </span>
              )}
            </div>

            {/* Arrangement Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-black mb-1">
                Arrangement Mode
              </label>
              <select
                value={madinahArrangement}
                onChange={(e) => {
                  const val = e.target.value as ZiyaratArrangement;
                  setMadinahArrangement(val);
                  applyZiyaratChanges(
                    makkahArrangement,
                    makkahVehicle,
                    makkahDuration,
                    makkahGuideDetails,
                    makkahSites,
                    makkahPrice,
                    makkahIncluded,
                    val,
                    madinahVehicle,
                    madinahDuration,
                    madinahGuideDetails,
                    madinahSites,
                    madinahPrice,
                    madinahIncluded
                  );
                }}
                className="w-full rounded-xl border border-black/15 bg-white p-2.5 text-xs text-black font-medium focus:border-pure-gold"
              >
                <option value="none">Not included</option>
                <option value="shared">Shared / group arrangement</option>
                <option value="private">Private arrangement</option>
                <option value="custom">Custom arrangement</option>
              </select>
            </div>

            {madinahArrangement !== "none" && (
              <div className="pt-3 border-t border-black/10 space-y-3 text-xs animate-in fade-in">
                {/* Vehicle & Duration */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-black mb-1">
                      Vehicle Details
                    </label>
                    <select
                      value={madinahVehicle}
                      onChange={(e) => {
                        setMadinahVehicle(e.target.value);
                        applyZiyaratChanges(
                          makkahArrangement,
                          makkahVehicle,
                          makkahDuration,
                          makkahGuideDetails,
                          makkahSites,
                          makkahPrice,
                          makkahIncluded,
                          madinahArrangement,
                          e.target.value,
                          madinahDuration,
                          madinahGuideDetails,
                          madinahSites,
                          madinahPrice,
                          madinahIncluded
                        );
                      }}
                      className="w-full rounded-lg border border-black/15 bg-white p-2 text-xs text-black"
                    >
                      {VEHICLE_OPTIONS.map((v) => (
                        <option key={v.value} value={v.value}>{v.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-black mb-1">
                      Tour Duration
                    </label>
                    <select
                      value={madinahDuration}
                      onChange={(e) => {
                        setMadinahDuration(e.target.value);
                        applyZiyaratChanges(
                          makkahArrangement,
                          makkahVehicle,
                          makkahDuration,
                          makkahGuideDetails,
                          makkahSites,
                          makkahPrice,
                          makkahIncluded,
                          madinahArrangement,
                          madinahVehicle,
                          e.target.value,
                          madinahGuideDetails,
                          madinahSites,
                          madinahPrice,
                          madinahIncluded
                        );
                      }}
                      className="w-full rounded-lg border border-black/15 bg-white p-2 text-xs text-black"
                    >
                      {DURATION_OPTIONS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Guide Details */}
                <div>
                  <label className="block text-[11px] font-semibold text-black mb-1">
                    Guide &amp; Chauffeur Details
                  </label>
                  <input
                    type="text"
                    value={madinahGuideDetails}
                    onChange={(e) => {
                      setMadinahGuideDetails(e.target.value);
                      applyZiyaratChanges(
                        makkahArrangement,
                        makkahVehicle,
                        makkahDuration,
                        makkahGuideDetails,
                        makkahSites,
                        makkahPrice,
                        makkahIncluded,
                        madinahArrangement,
                        madinahVehicle,
                        madinahDuration,
                        e.target.value,
                        madinahSites,
                        madinahPrice,
                        madinahIncluded
                      );
                    }}
                    placeholder="e.g. Licensed Bilingual Historical Guide"
                    className="w-full rounded-lg border border-black/15 bg-white p-2 text-xs text-black"
                  />
                </div>

                {/* Itinerary & Key Stops */}
                <div>
                  <label className="block text-[11px] font-semibold text-black mb-1">
                    Confirmed Itinerary &amp; Key Stops
                  </label>
                  <textarea
                    rows={2}
                    value={madinahSites}
                    onChange={(e) => {
                      setMadinahSites(e.target.value);
                      applyZiyaratChanges(
                        makkahArrangement,
                        makkahVehicle,
                        makkahDuration,
                        makkahGuideDetails,
                        makkahSites,
                        makkahPrice,
                        makkahIncluded,
                        madinahArrangement,
                        madinahVehicle,
                        madinahDuration,
                        madinahGuideDetails,
                        e.target.value,
                        madinahPrice,
                        madinahIncluded
                      );
                    }}
                    className="w-full rounded-lg border border-black/15 bg-white p-2 text-xs text-black leading-relaxed"
                  />
                </div>

                {/* Pricing & Inclusion Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-end">
                  <div>
                    <label className="block text-[11px] font-semibold text-black mb-1">
                      Price per Tour (AED)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={madinahPrice}
                      disabled={madinahIncluded}
                      onChange={(e) => {
                        const p = Math.max(0, Number(e.target.value) || 0);
                        setMadinahPrice(p);
                        applyZiyaratChanges(
                          makkahArrangement,
                          makkahVehicle,
                          makkahDuration,
                          makkahGuideDetails,
                          makkahSites,
                          makkahPrice,
                          makkahIncluded,
                          madinahArrangement,
                          madinahVehicle,
                          madinahDuration,
                          madinahGuideDetails,
                          madinahSites,
                          p,
                          madinahIncluded
                        );
                      }}
                      className="w-full rounded-lg border border-black/15 bg-white p-2 text-xs font-mono font-bold text-black disabled:bg-neutral-100"
                    />
                  </div>

                  <div className="pb-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-masaar-black">
                      <input
                        type="checkbox"
                        checked={madinahIncluded}
                        onChange={(e) => {
                          const inc = e.target.checked;
                          setMadinahIncluded(inc);
                          applyZiyaratChanges(
                            makkahArrangement,
                            makkahVehicle,
                            makkahDuration,
                            makkahGuideDetails,
                            makkahSites,
                            makkahPrice,
                            makkahIncluded,
                            madinahArrangement,
                            madinahVehicle,
                            madinahDuration,
                            madinahGuideDetails,
                            madinahSites,
                            madinahPrice,
                            inc
                          );
                        }}
                        className="size-4 rounded border-black/30 text-pure-gold focus:ring-pure-gold"
                      />
                      <span>Included in Base Package</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
