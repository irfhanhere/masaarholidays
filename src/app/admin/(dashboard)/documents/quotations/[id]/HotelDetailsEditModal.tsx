"use client";

import React, { useState, useEffect } from "react";
import type { LineItemPricingInput } from "@/lib/documents/calculations";

interface HotelDetailsEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: LineItemPricingInput | null;
  itemIndex: number;
  onSave: (
    index: number,
    updatedItem: LineItemPricingInput,
    updateMasterCatalog?: boolean
  ) => void;
}

const ROOM_CATEGORIES = [
  "Standard Room",
  "Deluxe Room",
  "Deluxe City View",
  "Deluxe Haram View",
  "Deluxe Kaaba View",
  "Junior Suite",
  "Executive Suite (Kaaba View)",
  "Family Suite (2 Bedrooms)",
];

const OCCUPANCY_OPTIONS = [
  "Single (1 Person)",
  "Double / Twin (2 Persons)",
  "Triple (3 Persons)",
  "Quad (4 Persons)",
  "Family Suite (5+ Persons)",
];

const MEAL_PLANS = [
  "Room Only (No Meals Included)",
  "Breakfast Included (International Buffet)",
  "Half Board (Breakfast & Dinner)",
  "Full Board (Breakfast, Lunch & Dinner)",
];

export function HotelDetailsEditModal({
  isOpen,
  onClose,
  item,
  itemIndex,
  onSave,
}: HotelDetailsEditModalProps) {
  const [hotelName, setHotelName] = useState("");
  const [alternativeHotelWording, setAlternativeHotelWording] = useState("");
  const [city, setCity] = useState("Makkah");
  const [location, setLocation] = useState("");
  const [roomCategory, setRoomCategory] = useState("Deluxe Room");
  const [roomSharing, setRoomSharing] = useState("Double / Twin (2 Persons)");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [nights, setNights] = useState(1);
  const [mealPlan, setMealPlan] = useState("Room Only (No Meals Included)");
  const [unitPriceAed, setUnitPriceAed] = useState(0);
  const [hotelNotes, setHotelNotes] = useState("");
  const [supplierNotes, setSupplierNotes] = useState("");
  const [updateMasterCatalog, setUpdateMasterCatalog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Parse existing item details when modal opens
  useEffect(() => {
    if (!item) return;

    const desc = item.description || "";
    setUnitPriceAed(Number(item.unit_price_aed) || 0);
    setNights(Math.max(1, Number(item.quantity) || 1));

    const details = item.details || "";
    const lower = `${desc} ${details}`.toLowerCase();

    // City
    if (lower.includes("madinah") || lower.includes("medina")) {
      setCity("Madinah");
    } else if (lower.includes("jeddah")) {
      setCity("Jeddah");
    } else {
      setCity("Makkah");
    }

    // Alternative hotel wording
    const altMatch = details.match(/(?:Alternative|Alt Wording):\s*([^•|]+)/i);
    if (altMatch) {
      setAlternativeHotelWording(altMatch[1].trim());
    } else if (desc.includes("or similar")) {
      setAlternativeHotelWording("or similar");
    } else {
      setAlternativeHotelWording("");
    }

    setHotelName(desc);

    // Location
    const locMatch = details.match(/(?:Location|Area|Proximity):\s*([^•|]+)/i);
    if (locMatch) {
      setLocation(locMatch[1].trim());
    } else if (lower.includes("clock tower")) {
      setLocation("Clock Tower, Steps from Haram (~100m)");
    } else if (lower.includes("steps from haram")) {
      setLocation("Steps from Haram");
    } else if (lower.includes("central area")) {
      setLocation("Central Area North (~50m, flat pathway)");
    } else {
      setLocation("");
    }

    // Room Category
    const catMatch = details.match(/(?:Room|Category):\s*([^•|]+)/i);
    if (catMatch) {
      setRoomCategory(catMatch[1].trim());
    } else if (lower.includes("kaaba view")) {
      setRoomCategory("Deluxe Kaaba View");
    } else if (lower.includes("haram view")) {
      setRoomCategory("Deluxe Haram View");
    } else if (lower.includes("city view")) {
      setRoomCategory("Deluxe City View");
    } else if (lower.includes("suite")) {
      setRoomCategory("Junior Suite");
    } else {
      setRoomCategory("Deluxe Room");
    }

    // Room Sharing / Occupancy
    if (lower.includes("single")) {
      setRoomSharing("Single (1 Person)");
    } else if (lower.includes("triple")) {
      setRoomSharing("Triple (3 Persons)");
    } else if (lower.includes("quad")) {
      setRoomSharing("Quad (4 Persons)");
    } else if (lower.includes("suite") || lower.includes("family")) {
      setRoomSharing("Family Suite (5+ Persons)");
    } else {
      setRoomSharing("Double / Twin (2 Persons)");
    }

    // Meal Plan
    if (lower.includes("full board")) {
      setMealPlan("Full Board (Breakfast, Lunch & Dinner)");
    } else if (lower.includes("half board")) {
      setMealPlan("Half Board (Breakfast & Dinner)");
    } else if (
      (lower.includes("breakfast") || lower.includes("buffet")) &&
      !lower.includes("without breakfast") &&
      !lower.includes("no breakfast") &&
      !lower.includes("room only")
    ) {
      setMealPlan("Breakfast Included (International Buffet)");
    } else {
      setMealPlan("Room Only (No Meals Included)");
    }

    // Dates
    const checkInMatch = details.match(/(?:Check-in|In):\s*(\d{4}-\d{2}-\d{2})/i);
    if (checkInMatch) setCheckIn(checkInMatch[1]);
    const checkOutMatch = details.match(/(?:Check-out|Out):\s*(\d{4}-\d{2}-\d{2})/i);
    if (checkOutMatch) setCheckOut(checkOutMatch[1]);

    // Public Hotel Notes
    const hotelNoteMatch = details.match(/(?:Hotel Notes?|Notes?):\s*([^•|\[]+)/i);
    if (hotelNoteMatch && !hotelNoteMatch[1].toLowerCase().includes("supplier_notes")) {
      setHotelNotes(hotelNoteMatch[1].trim());
    } else {
      setHotelNotes("");
    }

    // Supplier / Internal Notes
    const noteMatch = details.match(/\[supplier_notes:\s*([^\]]+)\]/i);
    if (noteMatch) setSupplierNotes(noteMatch[1].trim());
    else setSupplierNotes("");
  }, [item]);

  // Recalculate nights when check-in or check-out date changes
  function handleDateChange(newIn: string, newOut: string) {
    setCheckIn(newIn);
    setCheckOut(newOut);
    if (newIn && newOut) {
      const d1 = new Date(newIn);
      const d2 = new Date(newOut);
      const diffTime = d2.getTime() - d1.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 0) {
        setNights(diffDays);
      }
    }
  }

  // Quick Preset Handlers
  function applyFeaturedMakkahPreset() {
    setCity("Makkah");
    setHotelName("Makkah Towers / Swissôtel or similar");
    setAlternativeHotelWording("or similar");
    setLocation("Approximately 100 metres from the Haram (approx. 2 minutes' walk)");
    setHotelNotes("5-Star luxury hospitality near King Abdulaziz Gate.");
  }

  function applyFeaturedMadinahPreset() {
    setCity("Madinah");
    setHotelName("Anwar Al Madinah Mövenpick or similar");
    setAlternativeHotelWording("or similar");
    setLocation("Approximately 50 metres from the Haram, with a flat pathway (approx. 1 minute walk)");
    setHotelNotes("5-Star hotel directly facing the Prophet's Mosque courtyard.");
  }

  if (!isOpen || !item) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!item || !hotelName.trim()) return;

    setIsSaving(true);

    // Build clean, structured details string
    const detailsParts: string[] = [];
    detailsParts.push(`City: ${city}`);
    if (alternativeHotelWording.trim()) {
      detailsParts.push(`Alternative: ${alternativeHotelWording.trim()}`);
    }
    if (location.trim()) detailsParts.push(`Area: ${location.trim()}`);
    detailsParts.push(`Room: ${roomCategory.trim()}`);
    detailsParts.push(`Sharing: ${roomSharing}`);
    if (checkIn && checkOut) {
      detailsParts.push(`${nights} Nights (${checkIn} to ${checkOut})`);
    } else {
      detailsParts.push(`${nights} Nights`);
    }
    detailsParts.push(`Meal Plan: ${mealPlan}`);
    if (hotelNotes.trim()) {
      detailsParts.push(`Notes: ${hotelNotes.trim()}`);
    }
    if (supplierNotes.trim()) {
      detailsParts.push(`[supplier_notes: ${supplierNotes.trim()}]`);
    }

    const updatedItem: LineItemPricingInput = {
      ...item,
      item_type: item.item_type || "hotel",
      description: hotelName.trim(),
      details: detailsParts.join(" • "),
      quantity: nights,
      unit: "night",
      unit_price_aed: unitPriceAed,
      is_overridden: true,
    };

    onSave(itemIndex, updatedItem, updateMasterCatalog);
    setIsSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-black/10 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/10 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-warm-ivory text-base border border-pure-gold/30">
              🏨
            </span>
            <div>
              <h3 className="font-serif text-lg font-bold text-black">
                Edit Hotel Details &amp; Room Snapshot
              </h3>
              <p className="text-xs text-black/60">
                Customise hotel name, alternative wording, occupancy, meal plan and nights for this quotation.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-black/50 hover:bg-black/5 hover:text-black transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Featured Package Presets */}
        <div className="mt-4 flex flex-wrap items-center gap-2 p-3 bg-warm-ivory/40 rounded-xl border border-pure-gold/30">
          <span className="text-[10px] font-bold uppercase tracking-wider text-deep-gold">
            Featured Presets:
          </span>
          <button
            type="button"
            onClick={applyFeaturedMakkahPreset}
            className="rounded-lg border border-pure-gold/50 bg-white px-2.5 py-1 text-[11px] font-semibold text-masaar-black hover:bg-pure-gold/15 transition-all cursor-pointer"
          >
            Makkah Towers / Swissôtel or similar
          </button>
          <button
            type="button"
            onClick={applyFeaturedMadinahPreset}
            className="rounded-lg border border-pure-gold/50 bg-white px-2.5 py-1 text-[11px] font-semibold text-masaar-black hover:bg-pure-gold/15 transition-all cursor-pointer"
          >
            Anwar Al Madinah Mövenpick or similar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          {/* Hotel Name & Alternative Wording */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-8">
              <label className="block font-semibold text-black mb-1">
                Hotel Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={hotelName}
                onChange={(e) => setHotelName(e.target.value)}
                placeholder="e.g. Makkah Towers / Swissôtel or similar"
                className="w-full rounded-xl border border-black/15 p-2.5 text-xs text-black bg-white focus:border-pure-gold focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block font-semibold text-black mb-1">
                Alternative Wording
              </label>
              <input
                type="text"
                value={alternativeHotelWording}
                onChange={(e) => setAlternativeHotelWording(e.target.value)}
                placeholder="e.g. or similar"
                className="w-full rounded-xl border border-black/15 p-2.5 text-xs text-black bg-white focus:border-pure-gold focus:outline-hidden"
              />
            </div>
          </div>

          {/* City & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-4">
              <label className="block font-semibold text-black mb-1">
                City / Destination
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-xl border border-black/15 p-2.5 text-xs text-black bg-white focus:border-pure-gold"
              >
                <option value="Makkah">Makkah Al-Mukarramah</option>
                <option value="Madinah">Madinah Al-Munawwarah</option>
                <option value="Jeddah">Jeddah</option>
                <option value="Other">Other Destination</option>
              </select>
            </div>

            <div className="sm:col-span-8">
              <label className="block font-semibold text-black mb-1">
                Location &amp; Walking Distance
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Approximately 100 metres from Haram (~2 mins walk)"
                className="w-full rounded-xl border border-black/15 p-2.5 text-xs text-black bg-white focus:border-pure-gold focus:outline-hidden"
              />
            </div>
          </div>

          {/* Room Type & Occupancy */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-black mb-1">
                Room Type / Category
              </label>
              <select
                value={roomCategory}
                onChange={(e) => setRoomCategory(e.target.value)}
                className="w-full rounded-xl border border-black/15 p-2.5 text-xs text-black bg-white focus:border-pure-gold"
              >
                {ROOM_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-black mb-1">
                Occupancy / Room Sharing
              </label>
              <select
                value={roomSharing}
                onChange={(e) => setRoomSharing(e.target.value)}
                className="w-full rounded-xl border border-black/15 p-2.5 text-xs text-black bg-white focus:border-pure-gold"
              >
                {OCCUPANCY_OPTIONS.map((occ) => (
                  <option key={occ} value={occ}>{occ}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Stay Dates & Nights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-black mb-1">
                Check-in Date
              </label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => handleDateChange(e.target.value, checkOut)}
                className="w-full rounded-xl border border-black/15 p-2 text-xs text-black bg-white focus:border-pure-gold"
              />
            </div>

            <div>
              <label className="block font-semibold text-black mb-1">
                Check-out Date
              </label>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => handleDateChange(checkIn, e.target.value)}
                className="w-full rounded-xl border border-black/15 p-2 text-xs text-black bg-white focus:border-pure-gold"
              />
            </div>

            <div>
              <label className="block font-semibold text-black mb-1">
                Number of Nights
              </label>
              <input
                type="number"
                min={1}
                value={nights}
                onChange={(e) => setNights(Math.max(1, Number(e.target.value) || 1))}
                className="w-full rounded-xl border border-black/15 p-2 text-xs font-bold text-center text-black bg-white focus:border-pure-gold"
              />
            </div>
          </div>

          {/* Meal Plan & Selling Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-black mb-1">
                Meal Plan
              </label>
              <select
                value={mealPlan}
                onChange={(e) => setMealPlan(e.target.value)}
                className="w-full rounded-xl border border-black/15 p-2.5 text-xs text-black bg-white focus:border-pure-gold"
              >
                {MEAL_PLANS.map((mp) => (
                  <option key={mp} value={mp}>{mp}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-black mb-1">
                Selling Price per Night (AED)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 font-bold text-black/50 text-xs">AED</span>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={unitPriceAed}
                  onChange={(e) => setUnitPriceAed(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full rounded-xl border border-black/15 pl-12 pr-3 py-2 text-xs font-mono font-bold text-black bg-white focus:border-pure-gold"
                />
              </div>
              <span className="mt-1 text-[10px] text-black/50 block">
                Total Room Stay: AED {(nights * unitPriceAed).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Hotel Notes (Public) */}
          <div>
            <label className="block font-semibold text-black mb-1">
              Hotel Notes (Visible on PDF &amp; Client Portal)
            </label>
            <input
              type="text"
              value={hotelNotes}
              onChange={(e) => setHotelNotes(e.target.value)}
              placeholder="e.g. Direct Haram view, flat pathway, 24/7 luggage concierge included"
              className="w-full rounded-xl border border-black/15 p-2.5 text-xs text-black bg-white focus:border-pure-gold focus:outline-hidden"
            />
          </div>

          {/* Supplier Cost & Internal Notes (Private) */}
          <div>
            <label className="block font-semibold text-black mb-1 flex items-center justify-between">
              <span>Internal Supplier Notes (Private — Not shown to customer)</span>
              <span className="text-[10px] text-black/40 font-normal">Internal Staff Only</span>
            </label>
            <input
              type="text"
              value={supplierNotes}
              onChange={(e) => setSupplierNotes(e.target.value)}
              placeholder="e.g. Booked via Agoda B2B / Confirm Voucher by Oct 1"
              className="w-full rounded-xl border border-black/15 p-2.5 text-xs text-black bg-white focus:border-pure-gold focus:outline-hidden"
            />
          </div>

          <div className="mt-5 pt-3 border-t border-black/10 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-black/15 bg-white px-4 py-2 text-xs font-semibold text-masaar-black hover:bg-black/5 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-pure-gold text-masaar-black font-bold px-5 py-2 text-xs shadow-md hover:bg-light-gold cursor-pointer"
            >
              {isSaving ? "Saving..." : "Save Hotel Snapshot"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
