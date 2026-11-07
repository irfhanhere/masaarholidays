"use client";

import React, { useState, useEffect } from "react";
import type { LineItemPricingInput } from "@/lib/documents/calculations";

interface SightseeingZiyaratSectionProps {
  lineItems: LineItemPricingInput[];
  adultsCount: number;
  onUpdateLineItems: (items: LineItemPricingInput[]) => void;
  onPersist: (items: LineItemPricingInput[]) => void;
}

const VEHICLE_OPTIONS = [
  { label: "GMC Yukon / Suburban (Luxury SUV - Up to 7 Pax)", value: "GMC Yukon XL / Suburban" },
  { label: "Hyundai Staria / H1 (Executive Van - Up to 7 Pax)", value: "Hyundai Staria VIP Van" },
  { label: "Toyota HiAce (Comfort Mini-Bus - Up to 11 Pax)", value: "Toyota HiAce Mini-Coach" },
  { label: "Lexus ES / Sedan (Executive Sedan - Up to 3 Pax)", value: "Lexus ES Executive Sedan" },
];

const TIME_SLOTS = [
  "7:00 AM (Morning Tour)",
  "8:00 AM (Morning Tour)",
  "9:00 AM (Morning Tour)",
  "2:00 PM (Afternoon Tour)",
  "3:00 PM (Afternoon Tour)",
  "4:00 PM (Evening Tour)",
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
  const [hasMakkah, setHasMakkah] = useState<boolean>(Boolean(makkahItem));
  const [makkahVehicle, setMakkahVehicle] = useState<string>("GMC Yukon XL / Suburban");
  const [makkahTime, setMakkahTime] = useState<string>("8:00 AM (Morning Tour)");
  const [makkahSites, setMakkahSites] = useState<string>(MAKKAH_DEFAULT_SITES);
  const [makkahPrice, setMakkahPrice] = useState<number>(350);
  const [makkahIncluded, setMakkahIncluded] = useState<boolean>(true);

  // Local state for Madinah
  const [hasMadinah, setHasMadinah] = useState<boolean>(Boolean(madinahItem));
  const [madinahVehicle, setMadinahVehicle] = useState<string>("GMC Yukon XL / Suburban");
  const [madinahTime, setMadinahTime] = useState<string>("8:00 AM (Morning Tour)");
  const [madinahSites, setMadinahSites] = useState<string>(MADINAH_DEFAULT_SITES);
  const [madinahPrice, setMadinahPrice] = useState<number>(350);
  const [madinahIncluded, setMadinahIncluded] = useState<boolean>(true);

  // Sync state from existing items
  useEffect(() => {
    if (makkahItem) {
      setHasMakkah(true);
      setMakkahIncluded(Boolean(makkahItem.is_included || Number(makkahItem.unit_price_aed) === 0));
      if (Number(makkahItem.unit_price_aed) > 0) {
        setMakkahPrice(Number(makkahItem.unit_price_aed));
      }
      const d = makkahItem.details || "";
      const vehMatch = d.match(/Vehicle:\s*([^•|]+)/i);
      if (vehMatch) setMakkahVehicle(vehMatch[1].trim());
      const timeMatch = d.match(/Time:\s*([^•|]+)/i);
      if (timeMatch) setMakkahTime(timeMatch[1].trim());
      const sitesMatch = d.match(/Sites:\s*([^•|]+)/i);
      if (sitesMatch) setMakkahSites(sitesMatch[1].trim());
    } else {
      setHasMakkah(false);
    }

    if (madinahItem) {
      setHasMadinah(true);
      setMadinahIncluded(Boolean(madinahItem.is_included || Number(madinahItem.unit_price_aed) === 0));
      if (Number(madinahItem.unit_price_aed) > 0) {
        setMadinahPrice(Number(madinahItem.unit_price_aed));
      }
      const d = madinahItem.details || "";
      const vehMatch = d.match(/Vehicle:\s*([^•|]+)/i);
      if (vehMatch) setMadinahVehicle(vehMatch[1].trim());
      const timeMatch = d.match(/Time:\s*([^•|]+)/i);
      if (timeMatch) setMadinahTime(timeMatch[1].trim());
      const sitesMatch = d.match(/Sites:\s*([^•|]+)/i);
      if (sitesMatch) setMadinahSites(sitesMatch[1].trim());
    } else {
      setHasMadinah(false);
    }
  }, [makkahItem, madinahItem]);

  // Apply changes to lineItems
  function updateZiyaratLineItems(
    includeMakkah: boolean,
    mVeh: string,
    mTm: string,
    mSts: string,
    mPrc: number,
    mInc: boolean,
    includeMadinah: boolean,
    madVeh: string,
    madTm: string,
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

    if (includeMakkah) {
      const makkahLine: LineItemPricingInput = {
        item_type: "private_trip",
        description: "Makkah Private Ziyarat & Sightseeing",
        details: `City: Makkah • Duration: 2 – 2.5 hrs • Vehicle: ${mVeh} • Time: ${mTm} • Sites: ${mSts} • Hotel Lobby Pickup & Drop-Off`,
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

    if (includeMadinah) {
      const madinahLine: LineItemPricingInput = {
        item_type: "private_trip",
        description: "Madinah Private Ziyarat & Sightseeing",
        details: `City: Madinah • Duration: 2 – 2.5 hrs • Vehicle: ${madVeh} • Time: ${madTm} • Sites: ${madSts} • Hotel Lobby Pickup & Drop-Off`,
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
          <span className="flex size-8 items-center justify-center rounded-xl bg-[#FAF8F5] text-base border border-[#c9983e]/30">
            🕌
          </span>
          <div>
            <h3 className="font-serif text-base font-bold text-black flex items-center gap-2">
              Sightseeing &amp; Private Ziyarat Options
            </h3>
            <p className="text-xs text-black/60">
              Easily attach curated Makkah and Madinah spiritual tours. Pre-populated with authentic site stops &amp; private chauffeur details.
            </p>
          </div>
        </div>
      </div>

      {/* Two Tour Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1. MAKKAH PRIVATE ZIYARAT */}
        <div
          className={`rounded-2xl border p-4.5 transition-all ${
            hasMakkah
              ? "border-[#c9983e] bg-[#FAF8F5]/80 ring-2 ring-[#c9983e]/20"
              : "border-black/10 bg-neutral-50/50 hover:bg-neutral-50"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={hasMakkah}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setHasMakkah(checked);
                  updateZiyaratLineItems(
                    checked,
                    makkahVehicle,
                    makkahTime,
                    makkahSites,
                    makkahPrice,
                    makkahIncluded,
                    hasMadinah,
                    madinahVehicle,
                    madinahTime,
                    madinahSites,
                    madinahPrice,
                    madinahIncluded
                  );
                }}
                className="mt-1 size-4 rounded border-black/30 text-[#b37e28] focus:ring-[#b37e28]"
              />
              <div>
                <span className="font-serif font-bold text-sm text-black block">
                  Makkah Private Ziyarat
                </span>
                <span className="text-[11px] text-black/60 block mt-0.5">
                  2 – 2.5 hrs • Private Vehicle with Chauffeur • Hotel Pickup &amp; Drop-off
                </span>
              </div>
            </label>

            {hasMakkah && (
              <span className="rounded-full bg-[#c9983e]/15 border border-[#c9983e]/30 px-2 py-0.5 text-[10px] font-bold text-[#865d1d] uppercase">
                Active in Quote
              </span>
            )}
          </div>

          {hasMakkah && (
            <div className="mt-4 pt-4 border-t border-black/10 space-y-3 text-xs animate-in fade-in">
              {/* Vehicle & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-black mb-1">
                    Chauffeur Vehicle Type
                  </label>
                  <select
                    value={makkahVehicle}
                    onChange={(e) => {
                      setMakkahVehicle(e.target.value);
                      updateZiyaratLineItems(
                        true,
                        e.target.value,
                        makkahTime,
                        makkahSites,
                        makkahPrice,
                        makkahIncluded,
                        hasMadinah,
                        madinahVehicle,
                        madinahTime,
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
                    Preferred Time Slot
                  </label>
                  <select
                    value={makkahTime}
                    onChange={(e) => {
                      setMakkahTime(e.target.value);
                      updateZiyaratLineItems(
                        true,
                        makkahVehicle,
                        e.target.value,
                        makkahSites,
                        makkahPrice,
                        makkahIncluded,
                        hasMadinah,
                        madinahVehicle,
                        madinahTime,
                        madinahSites,
                        madinahPrice,
                        madinahIncluded
                      );
                    }}
                    className="w-full rounded-lg border border-black/15 bg-white p-2 text-xs text-black"
                  >
                    {TIME_SLOTS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sites Visited */}
              <div>
                <label className="block text-[11px] font-semibold text-black mb-1">
                  Key Spiritual Sites Visited
                </label>
                <textarea
                  rows={2}
                  value={makkahSites}
                  onChange={(e) => setMakkahSites(e.target.value)}
                  onBlur={() =>
                    updateZiyaratLineItems(
                      true,
                      makkahVehicle,
                      makkahTime,
                      makkahSites,
                      makkahPrice,
                      makkahIncluded,
                      hasMadinah,
                      madinahVehicle,
                      madinahTime,
                      madinahSites,
                      madinahPrice,
                      madinahIncluded
                    )
                  }
                  className="w-full rounded-lg border border-black/15 bg-white p-2 text-xs text-black"
                />
              </div>

              {/* Pricing Structure */}
              <div className="rounded-xl border border-black/10 bg-white p-3 space-y-2">
                <span className="font-semibold text-black block text-[11px]">Pricing Option:</span>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="makkahPriceOpt"
                      checked={makkahIncluded}
                      onChange={() => {
                        setMakkahIncluded(true);
                        updateZiyaratLineItems(
                          true,
                          makkahVehicle,
                          makkahTime,
                          makkahSites,
                          makkahPrice,
                          true,
                          hasMadinah,
                          madinahVehicle,
                          madinahTime,
                          madinahSites,
                          madinahPrice,
                          madinahIncluded
                        );
                      }}
                      className="text-[#b37e28]"
                    />
                    <span className="font-semibold text-black">Included in Package (AED 0)</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="makkahPriceOpt"
                      checked={!makkahIncluded}
                      onChange={() => {
                        setMakkahIncluded(false);
                        updateZiyaratLineItems(
                          true,
                          makkahVehicle,
                          makkahTime,
                          makkahSites,
                          makkahPrice,
                          false,
                          hasMadinah,
                          madinahVehicle,
                          madinahTime,
                          madinahSites,
                          madinahPrice,
                          madinahIncluded
                        );
                      }}
                      className="text-[#b37e28]"
                    />
                    <span className="font-semibold text-black">Additional Charge</span>
                  </label>
                </div>

                {!makkahIncluded && (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[11px] text-black/60">Price (AED):</span>
                    <input
                      type="number"
                      min={0}
                      value={makkahPrice}
                      onChange={(e) => setMakkahPrice(Number(e.target.value) || 0)}
                      onBlur={() =>
                        updateZiyaratLineItems(
                          true,
                          makkahVehicle,
                          makkahTime,
                          makkahSites,
                          makkahPrice,
                          false,
                          hasMadinah,
                          madinahVehicle,
                          madinahTime,
                          madinahSites,
                          madinahPrice,
                          madinahIncluded
                        )
                      }
                      className="w-28 rounded border border-black/20 p-1 font-mono font-bold text-xs"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 2. MADINAH PRIVATE ZIYARAT */}
        <div
          className={`rounded-2xl border p-4.5 transition-all ${
            hasMadinah
              ? "border-[#c9983e] bg-[#FAF8F5]/80 ring-2 ring-[#c9983e]/20"
              : "border-black/10 bg-neutral-50/50 hover:bg-neutral-50"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={hasMadinah}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setHasMadinah(checked);
                  updateZiyaratLineItems(
                    hasMakkah,
                    makkahVehicle,
                    makkahTime,
                    makkahSites,
                    makkahPrice,
                    makkahIncluded,
                    checked,
                    madinahVehicle,
                    madinahTime,
                    madinahSites,
                    madinahPrice,
                    madinahIncluded
                  );
                }}
                className="mt-1 size-4 rounded border-black/30 text-[#b37e28] focus:ring-[#b37e28]"
              />
              <div>
                <span className="font-serif font-bold text-sm text-black block">
                  Madinah Private Ziyarat
                </span>
                <span className="text-[11px] text-black/60 block mt-0.5">
                  2 – 2.5 hrs • Private Vehicle with Chauffeur • Hotel Pickup &amp; Drop-off
                </span>
              </div>
            </label>

            {hasMadinah && (
              <span className="rounded-full bg-[#c9983e]/15 border border-[#c9983e]/30 px-2 py-0.5 text-[10px] font-bold text-[#865d1d] uppercase">
                Active in Quote
              </span>
            )}
          </div>

          {hasMadinah && (
            <div className="mt-4 pt-4 border-t border-black/10 space-y-3 text-xs animate-in fade-in">
              {/* Vehicle & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-black mb-1">
                    Chauffeur Vehicle Type
                  </label>
                  <select
                    value={madinahVehicle}
                    onChange={(e) => {
                      setMadinahVehicle(e.target.value);
                      updateZiyaratLineItems(
                        hasMakkah,
                        makkahVehicle,
                        makkahTime,
                        makkahSites,
                        makkahPrice,
                        makkahIncluded,
                        true,
                        e.target.value,
                        madinahTime,
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
                    Preferred Time Slot
                  </label>
                  <select
                    value={madinahTime}
                    onChange={(e) => {
                      setMadinahTime(e.target.value);
                      updateZiyaratLineItems(
                        hasMakkah,
                        makkahVehicle,
                        makkahTime,
                        makkahSites,
                        makkahPrice,
                        makkahIncluded,
                        true,
                        madinahVehicle,
                        e.target.value,
                        madinahSites,
                        madinahPrice,
                        madinahIncluded
                      );
                    }}
                    className="w-full rounded-lg border border-black/15 bg-white p-2 text-xs text-black"
                  >
                    {TIME_SLOTS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sites Visited */}
              <div>
                <label className="block text-[11px] font-semibold text-black mb-1">
                  Key Spiritual Sites Visited
                </label>
                <textarea
                  rows={2}
                  value={madinahSites}
                  onChange={(e) => setMadinahSites(e.target.value)}
                  onBlur={() =>
                    updateZiyaratLineItems(
                      hasMakkah,
                      makkahVehicle,
                      makkahTime,
                      makkahSites,
                      makkahPrice,
                      makkahIncluded,
                      true,
                      madinahVehicle,
                      madinahTime,
                      madinahSites,
                      madinahPrice,
                      madinahIncluded
                    )
                  }
                  className="w-full rounded-lg border border-black/15 bg-white p-2 text-xs text-black"
                />
              </div>

              {/* Pricing Structure */}
              <div className="rounded-xl border border-black/10 bg-white p-3 space-y-2">
                <span className="font-semibold text-black block text-[11px]">Pricing Option:</span>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="madinahPriceOpt"
                      checked={madinahIncluded}
                      onChange={() => {
                        setMadinahIncluded(true);
                        updateZiyaratLineItems(
                          hasMakkah,
                          makkahVehicle,
                          makkahTime,
                          makkahSites,
                          makkahPrice,
                          makkahIncluded,
                          true,
                          madinahVehicle,
                          madinahTime,
                          madinahSites,
                          madinahPrice,
                          true
                        );
                      }}
                      className="text-[#b37e28]"
                    />
                    <span className="font-semibold text-black">Included in Package (AED 0)</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="madinahPriceOpt"
                      checked={!madinahIncluded}
                      onChange={() => {
                        setMadinahIncluded(false);
                        updateZiyaratLineItems(
                          hasMakkah,
                          makkahVehicle,
                          makkahTime,
                          makkahSites,
                          makkahPrice,
                          makkahIncluded,
                          true,
                          madinahVehicle,
                          madinahTime,
                          madinahSites,
                          madinahPrice,
                          false
                        );
                      }}
                      className="text-[#b37e28]"
                    />
                    <span className="font-semibold text-black">Additional Charge</span>
                  </label>
                </div>

                {!madinahIncluded && (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[11px] text-black/60">Price (AED):</span>
                    <input
                      type="number"
                      min={0}
                      value={madinahPrice}
                      onChange={(e) => setMadinahPrice(Number(e.target.value) || 0)}
                      onBlur={() =>
                        updateZiyaratLineItems(
                          hasMakkah,
                          makkahVehicle,
                          makkahTime,
                          makkahSites,
                          makkahPrice,
                          makkahIncluded,
                          true,
                          madinahVehicle,
                          madinahTime,
                          madinahSites,
                          madinahPrice,
                          false
                        )
                      }
                      className="w-28 rounded border border-black/20 p-1 font-mono font-bold text-xs"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

