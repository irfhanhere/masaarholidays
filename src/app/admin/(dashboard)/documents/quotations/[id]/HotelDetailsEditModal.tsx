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

export function HotelDetailsEditModal({
  isOpen,
  onClose,
  item,
  itemIndex,
  onSave,
}: HotelDetailsEditModalProps) {
  const [hotelName, setHotelName] = useState("");
  const [city, setCity] = useState("Makkah");
  const [location, setLocation] = useState("");
  const [roomCategory, setRoomCategory] = useState("Deluxe Room");
  const [roomSharing, setRoomSharing] = useState("Double / Twin (2 Persons)");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [nights, setNights] = useState(1);
  const [mealPlan, setMealPlan] = useState("Room Only (No Meals Included)");
  const [unitPriceAed, setUnitPriceAed] = useState(0);
  const [supplierNotes, setSupplierNotes] = useState("");
  const [updateMasterCatalog, setUpdateMasterCatalog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Parse existing item details when modal opens
  useEffect(() => {
    if (!item) return;

    setHotelName(item.description || "");
    setUnitPriceAed(Number(item.unit_price_aed) || 0);
    setNights(Math.max(1, Number(item.quantity) || 1));

    const details = item.details || "";
    const lower = details.toLowerCase();

    // City
    if (lower.includes("madinah") || lower.includes("medina")) {
      setCity("Madinah");
    } else if (lower.includes("jeddah")) {
      setCity("Jeddah");
    } else {
      setCity("Makkah");
    }

    // Location
    const locMatch = details.match(/(?:Location|Area|Proximity):\s*([^•|]+)/i);
    if (locMatch) {
      setLocation(locMatch[1].trim());
    } else if (lower.includes("clock tower")) {
      setLocation("Clock Tower, Steps from Haram");
    } else if (lower.includes("jabal omar")) {
      setLocation("Jabal Omar, Steps from Haram");
    } else if (lower.includes("steps from haram")) {
      setLocation("Steps from Haram");
    } else if (lower.includes("central area")) {
      setLocation("Central Area North");
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
      setRoomCategory("Standard Room");
    }

    // Room Sharing
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
      setMealPlan("Breakfast Included");
    } else {
      setMealPlan("Room Only (No Meals Included)");
    }

    // Dates
    const checkInMatch = details.match(/(?:Check-in|In):\s*(\d{4}-\d{2}-\d{2})/i);
    if (checkInMatch) setCheckIn(checkInMatch[1]);
    const checkOutMatch = details.match(/(?:Check-out|Out):\s*(\d{4}-\d{2}-\d{2})/i);
    if (checkOutMatch) setCheckOut(checkOutMatch[1]);

    // Supplier / Internal Notes
    const noteMatch = details.match(/(?:Supplier|Internal Note|Note):\s*([^•|]+)/i);
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

  if (!isOpen || !item) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!item || !hotelName.trim()) return;

    setIsSaving(true);

    // Build clean, structured details string
    const detailsParts: string[] = [];
    detailsParts.push(`City: ${city}`);
    if (location.trim()) detailsParts.push(`Area: ${location.trim()}`);
    detailsParts.push(`Room: ${roomCategory.trim()}`);
    detailsParts.push(`Sharing: ${roomSharing}`);
    if (checkIn && checkOut) {
      detailsParts.push(`${nights} Nights (${checkIn} to ${checkOut})`);
    } else {
      detailsParts.push(`${nights} Nights`);
    }
    detailsParts.push(`Meal Plan: ${mealPlan}`);
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
            <span className="flex size-8 items-center justify-center rounded-xl bg-[#FAF8F5] text-base border border-[#c9983e]/30">
              🏨
            </span>
            <div>
              <h3 className="font-serif text-lg font-bold text-black">
                Edit Hotel Details &amp; Room Snapshot
              </h3>
              <p className="text-xs text-black/60">
                Customise hotel, room category, meal plan and nights for this specific quotation.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-black/50 hover:bg-black/5 hover:text-black transition-all"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          {/* Hotel Name & City */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-black mb-1">
                Hotel Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={hotelName}
                onChange={(e) => setHotelName(e.target.value)}
                placeholder="e.g. Makkah Clock Royal Tower, A Fairmont Hotel"
                className="w-full rounded-xl border border-black/15 p-2.5 text-xs text-black bg-white focus:border-[#b37e28] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-black mb-1">
                City / Destination
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-xl border border-black/15 p-2.5 text-xs text-black bg-white focus:border-[#b37e28]"
              >
                <option value="Makkah">Makkah</option>
                <option value="Madinah">Madinah</option>
                <option value="Jeddah">Jeddah</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Location / Area */}
          <div>
            <label className="block font-semibold text-black mb-1">
              Location / Proximity to Haram
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Steps from Haram, Clock Tower / Abraj Al Bait"
              className="w-full rounded-xl border border-black/15 p-2.5 text-xs text-black bg-white focus:border-[#b37e28] focus:outline-hidden"
            />
          </div>

          {/* Room Category & Sharing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-black mb-1">
                Room Category / View
              </label>
              <input
                type="text"
                value={roomCategory}
                onChange={(e) => setRoomCategory(e.target.value)}
                placeholder="e.g. Deluxe Kaaba View / Deluxe Haram View"
                className="w-full rounded-xl border border-black/15 p-2.5 text-xs text-black bg-white focus:border-[#b37e28] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-black mb-1">
                Room Sharing / Occupancy
              </label>
              <select
                value={roomSharing}
                onChange={(e) => setRoomSharing(e.target.value)}
                className="w-full rounded-xl border border-black/15 p-2.5 text-xs text-black bg-white focus:border-[#b37e28]"
              >
                <option value="Single (1 Person)">Single (1 Person)</option>
                <option value="Double / Twin (2 Persons)">Double / Twin (2 Persons)</option>
                <option value="Triple (3 Persons)">Triple (3 Persons)</option>
                <option value="Quad (4 Persons)">Quad (4 Persons)</option>
                <option value="Family Suite (5+ Persons)">Family Suite (5+ Persons)</option>
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
                className="w-full rounded-xl border border-black/15 p-2 text-xs text-black bg-white focus:border-[#b37e28]"
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
                className="w-full rounded-xl border border-black/15 p-2 text-xs text-black bg-white focus:border-[#b37e28]"
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
                className="w-full rounded-xl border border-black/15 p-2 text-xs font-bold text-center text-black bg-white focus:border-[#b37e28]"
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
                className="w-full rounded-xl border border-black/15 p-2.5 text-xs text-black bg-white focus:border-[#b37e28]"
              >
                <option value="Room Only (No Meals Included)">Room Only (No Meals Included)</option>
                <option value="Breakfast Included">Breakfast Included (Buffet)</option>
                <option value="Half Board (Breakfast & Dinner)">Half Board (Breakfast &amp; Dinner)</option>
                <option value="Full Board (Breakfast, Lunch & Dinner)">Full Board (Breakfast, Lunch &amp; Dinner)</option>
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
                  className="w-full rounded-xl border border-black/15 pl-12 pr-3 py-2 text-xs font-mono font-bold text-black bg-white focus:border-[#b37e28]"
                />
              </div>
              <span className="mt-1 text-[10px] text-black/50 block">
                Total Room Stay: AED {(nights * unitPriceAed).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Supplier Cost & Internal Notes */}
          <div>
            <label className="block font-semibold text-black mb-1 flex items-center justify-between">
              <span>Internal Supplier Notes (Private - Not shown in customer PDF)</span>
              <span className="text-[10px] text-black/40 font-normal">Internal Staff Only</span>
            </label>
            <input
              type="text"
              value={supplierNotes}
              onChange={(e) => setSupplierNotes(e.target.value)}
              placeholder="e.g. Net supplier rate SAR 950/night booked via Dakkah Travel"
              className="w-full rounded-xl border border-black/15 p-2 text-xs text-black/80 bg-neutral-50 focus:bg-white focus:border-[#b37e28]"
            />
          </div>

          {/* Master catalogue update option */}
          <div className="rounded-xl border border-black/10 bg-[#FAF8F5] p-3">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={updateMasterCatalog}
                onChange={(e) => setUpdateMasterCatalog(e.target.checked)}
                className="mt-0.5 rounded border-black/30 text-[#b37e28] focus:ring-[#b37e28]"
              />
              <div>
                <span className="font-semibold text-black block">
                  Also save these updates as default to the master hotel catalogue
                </span>
                <span className="text-[11px] text-black/60 block">
                  When unchecked, changes strictly update this specific quotation without altering historical quotations.
                </span>
              </div>
            </label>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-black/10">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-black/15 bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-black/5 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-gradient-to-r from-[#b37e28] to-[#916d28] px-5 py-2 text-xs font-bold text-white shadow-xs hover:from-[#9c6d1f] hover:to-[#7d5c1f] transition-all disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Hotel Details"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
