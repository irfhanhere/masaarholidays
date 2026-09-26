"use client";

import { useState } from "react";
import Image from "next/image";

interface CustomPackageBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  journeyType: string;
  adults: number;
  children: number;
  travelDate: string;
  returnDate: string;
  onSavePackage: (packageConfig: {
    tier: string;
    tierPrice: number;
    makkahHotel: string;
    makkahPrice: number;
    madinahHotel: string;
    madinahPrice: number;
    roomType: string;
    roomAdjustment: number;
    vehicle: string;
    vehiclePrice: number;
    flightClass: string;
    flightPrice: number;
    extraServices: Array<{ name: string; price: number }>;
    totalAmount: number;
  }) => Promise<void>;
}

export function CustomPackageBuilderModal({
  isOpen,
  onClose,
  journeyType,
  adults,
  children: _children,
  travelDate: _travelDate,
  returnDate: _returnDate,
  onSavePackage,
}: CustomPackageBuilderModalProps) {
  const isHajj = journeyType === "hajj";

  // Tier selection
  const [selectedTier, setSelectedTier] = useState<"gold" | "platinum" | "vip">("platinum");
  const tierPricing = isHajj
    ? { gold: 14500, platinum: 18750, vip: 24900 }
    : { gold: 6500, platinum: 8500, vip: 12500 };

  // Hotels
  const [selectedMakkah, setSelectedMakkah] = useState("Swissôtel Makkah");
  const makkahHotels = [
    { name: "Swissôtel Makkah", stars: 5, price: isHajj ? 4200 : 2500, distance: "Near Haram" },
    { name: "Fairmont Makkah", stars: 5, price: isHajj ? 4800 : 3200, distance: "Clock Tower" },
    { name: "Raffles Makkah", stars: 5, price: isHajj ? 5500 : 4200, distance: "Direct Haram View" },
  ];

  const [selectedMadinah, setSelectedMadinah] = useState("Anwar Al Madinah");
  const madinahHotels = [
    { name: "Anwar Al Madinah", stars: 5, price: isHajj ? 2800 : 1800, distance: "Near Haram Courtyard" },
    { name: "Madinah Hilton", stars: 5, price: isHajj ? 3200 : 2200, distance: "Facing Prophet's Mosque" },
  ];

  // Room Type
  const [selectedRoom, setSelectedRoom] = useState<"twin" | "triple" | "quad">("twin");
  const roomAdjustments = {
    twin: 0,
    triple: -350,
    quad: -650,
  };

  // Transport
  const [selectedVehicle, setSelectedVehicle] = useState("GMC Yukon");
  const vehicles = [
    { name: "Sedan", price: 500, label: "Per trip" },
    { name: "Staria", price: 750, label: "Per trip" },
    { name: "GMC Yukon", price: 950, label: "Per trip" },
    { name: "Hiace", price: 1200, label: "Per trip" },
  ];

  // Flight Class
  const [flightClass, setFlightClass] = useState<"economy" | "business">("business");
  const flightPricePerPerson = flightClass === "business" ? 4500 : 0;

  // Additional Services
  const [selectedServices, setSelectedServices] = useState<Set<string>>(
    new Set(["private_transfer", "extra_night"])
  );

  const availableServices = [
    { id: "private_transfer", name: "Private Transfer", price: 350 },
    { id: "extra_night", name: "Extra Night in Makkah", price: 750 },
    { id: "ziyarat", name: "Ziyarat in Makkah & Madinah", price: 600 },
    { id: "twin_upgrade", name: "Twin Sharing Upgrade", price: 1200 },
  ];

  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  function toggleService(id: string) {
    setSelectedServices((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Live Pricing Calculation (Exact match CUSTOM PACKAGE BUILDER.png)
  const baseRate = tierPricing[selectedTier];
  const makkahHotelObj = makkahHotels.find((h) => h.name === selectedMakkah) || makkahHotels[0];
  const madinahHotelObj = madinahHotels.find((h) => h.name === selectedMadinah) || madinahHotels[0];
  const vehicleObj = vehicles.find((v) => v.name === selectedVehicle) || vehicles[2];

  const baseTotal = baseRate * adults;
  const makkahTotal = makkahHotelObj.price * adults;
  const madinahTotal = madinahHotelObj.price * adults;
  const roomAdjTotal = roomAdjustments[selectedRoom] * adults;
  const flightTotal = flightPricePerPerson * adults;
  const vehicleTotal = vehicleObj.price;

  let servicesTotal = 0;
  selectedServices.forEach((sId) => {
    const s = availableServices.find((item) => item.id === sId);
    if (s) servicesTotal += s.price;
  });

  const subtotal =
    baseTotal + makkahTotal + madinahTotal + roomAdjTotal + flightTotal + vehicleTotal + servicesTotal;
  const vat = Math.round(subtotal * 0.05 * 100) / 100;
  const grandTotal = Math.round((subtotal + vat) * 100) / 100;

  async function handleConfirm() {
    setIsSaving(true);
    try {
      const extraList: Array<{ name: string; price: number }> = [];
      selectedServices.forEach((sId) => {
        const s = availableServices.find((item) => item.id === sId);
        if (s) extraList.push({ name: s.name, price: s.price });
      });

      await onSavePackage({
        tier: selectedTier.toUpperCase(),
        tierPrice: baseRate,
        makkahHotel: makkahHotelObj.name,
        makkahPrice: makkahHotelObj.price,
        madinahHotel: madinahHotelObj.name,
        madinahPrice: madinahHotelObj.price,
        roomType: selectedRoom.toUpperCase(),
        roomAdjustment: roomAdjustments[selectedRoom],
        vehicle: vehicleObj.name,
        vehiclePrice: vehicleObj.price,
        flightClass: flightClass.toUpperCase(),
        flightPrice: flightPricePerPerson,
        extraServices: extraList,
        totalAmount: grandTotal,
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to update quotation package.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative my-8 w-full max-w-6xl rounded-2xl bg-white shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header Strip matching CUSTOM PACKAGE BUILDER.png */}
        <div className="flex items-center justify-between border-b border-black/10 bg-[#FAF9F6] px-6 py-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#916d28]">
              Documents &amp; Bookings &gt; Quotations &gt; Package Builder
            </span>
            <h2 className="font-serif text-2xl font-bold text-masaar-black">
              {isHajj ? "Hajj 2027 – Package Builder" : "Umrah 2026 – Package Builder"}
            </h2>
            <p className="text-xs text-masaar-black/60">
              Create a customised {isHajj ? "Hajj" : "Umrah"} journey by selecting the package, hotels, transport and additional services.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-black/5 hover:text-masaar-black"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Left 8 Cols: Customization Blocks */}
            <div className="space-y-6 lg:col-span-8">
              {/* Journey Overview Bar */}
              <div className="rounded-xl border border-black/10 bg-[#FAF9F7] p-4 text-xs font-sans">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div>
                    <span className="text-masaar-black/50 font-medium">Journey</span>
                    <p className="font-bold text-masaar-black">{isHajj ? "Hajj 2027 (13 Days)" : "Umrah 2026 (10 Days)"}</p>
                  </div>
                  <div>
                    <span className="text-masaar-black/50 font-medium">Pilgrims</span>
                    <p className="font-bold text-masaar-black">{adults} Adults</p>
                  </div>
                  <div>
                    <span className="text-masaar-black/50 font-medium">Expected Dates</span>
                    <p className="font-bold text-masaar-black">Confirmed on Booking</p>
                  </div>
                  <div>
                    <span className="text-masaar-black/50 font-medium">Route</span>
                    <p className="font-bold text-masaar-black">Jeddah → Makkah → Madinah</p>
                  </div>
                </div>
              </div>

              {/* Block A: Base Package Selection */}
              <div className="rounded-xl border border-black/10 bg-white p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-black/10 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="flex size-6 items-center justify-center rounded-full bg-[#b37e28] text-xs font-bold text-white">
                      A
                    </span>
                    <h3 className="font-serif font-bold text-sm text-masaar-black">
                      Base Package
                    </h3>
                  </div>
                  <span className="text-xs text-[#916d28] font-semibold">Select tier</span>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {/* Gold */}
                  <div
                    onClick={() => setSelectedTier("gold")}
                    className={`cursor-pointer rounded-xl border p-4 transition-all ${
                      selectedTier === "gold"
                        ? "border-[#b37e28] bg-white ring-2 ring-[#b37e28] shadow-sm"
                        : "border-black/10 hover:border-black/25"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-serif font-bold text-sm text-masaar-black">Gold</span>
                      <span className="text-xs text-[#916d28] font-bold">AED {tierPricing.gold.toLocaleString()}</span>
                    </div>
                    <p className="text-[11px] text-masaar-black/50">per person</p>
                    <ul className="mt-2.5 text-[11px] text-masaar-black/70 space-y-1">
                      <li>• Direct Scheduled Flights</li>
                      <li>• Standard 5-Star Accommodations</li>
                      <li>• Dedicated Transport</li>
                    </ul>
                  </div>

                  {/* Platinum */}
                  <div
                    onClick={() => setSelectedTier("platinum")}
                    className={`cursor-pointer rounded-xl border p-4 transition-all ${
                      selectedTier === "platinum"
                        ? "border-[#b37e28] bg-white ring-2 ring-[#b37e28] shadow-sm"
                        : "border-black/10 hover:border-black/25"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-serif font-bold text-sm text-masaar-black">Platinum</span>
                      <span className="text-xs text-[#916d28] font-bold">AED {tierPricing.platinum.toLocaleString()}</span>
                    </div>
                    <p className="text-[11px] text-masaar-black/50">per person</p>
                    <ul className="mt-2.5 text-[11px] text-masaar-black/70 space-y-1">
                      <li>• Direct Scheduled Flights</li>
                      <li>• Clock Tower / Near Haram Courtyard</li>
                      <li>• Kidana / Category A Luxury</li>
                    </ul>
                  </div>

                  {/* VIP */}
                  <div
                    onClick={() => setSelectedTier("vip")}
                    className={`cursor-pointer rounded-xl border p-4 transition-all ${
                      selectedTier === "vip"
                        ? "border-[#b37e28] bg-white ring-2 ring-[#b37e28] shadow-sm"
                        : "border-black/10 hover:border-black/25"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-serif font-bold text-sm text-masaar-black">VIP</span>
                      <span className="text-xs text-[#916d28] font-bold">AED {tierPricing.vip.toLocaleString()}</span>
                    </div>
                    <p className="text-[11px] text-masaar-black/50">per person</p>
                    <ul className="mt-2.5 text-[11px] text-masaar-black/70 space-y-1">
                      <li>• Business Class Flights Included</li>
                      <li>• Direct Kaaba &amp; Rawdah Views</li>
                      <li>• Private GMC Yukon Concierge</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Block B: Hotels During Makkah & Madinah */}
              <div className="rounded-xl border border-black/10 bg-white p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-black/10 pb-2">
                  <span className="flex size-6 items-center justify-center rounded-full bg-[#b37e28] text-xs font-bold text-white">
                    B
                  </span>
                  <h3 className="font-serif font-bold text-sm text-masaar-black">
                    Hotels in Makkah &amp; Madinah
                  </h3>
                </div>

                {/* Makkah Hotels */}
                <div>
                  <span className="text-xs font-bold text-masaar-black">Holy Makkah Hotel:</span>
                  <div className="mt-2 grid gap-3 sm:grid-cols-3">
                    {makkahHotels.map((h) => (
                      <div
                        key={h.name}
                        onClick={() => setSelectedMakkah(h.name)}
                        className={`cursor-pointer rounded-xl border p-3 text-xs transition-all ${
                          selectedMakkah === h.name
                            ? "border-[#b37e28] bg-[#FAF8F5] ring-2 ring-[#b37e28] shadow-xs"
                            : "border-black/10 hover:border-black/20"
                        }`}
                      >
                        <p className="font-bold text-masaar-black">{h.name}</p>
                        <p className="text-[11px] text-masaar-black/60">{h.distance}</p>
                        <p className="mt-1 font-bold text-[#865d1d]">AED {h.price.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Madinah Hotels */}
                <div>
                  <span className="text-xs font-bold text-masaar-black">Madinah Al Munawwarah Hotel:</span>
                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    {madinahHotels.map((h) => (
                      <div
                        key={h.name}
                        onClick={() => setSelectedMadinah(h.name)}
                        className={`cursor-pointer rounded-xl border p-3 text-xs transition-all ${
                          selectedMadinah === h.name
                            ? "border-[#b37e28] bg-[#FAF8F5] ring-2 ring-[#b37e28] shadow-xs"
                            : "border-black/10 hover:border-black/20"
                        }`}
                      >
                        <p className="font-bold text-masaar-black">{h.name}</p>
                        <p className="text-[11px] text-masaar-black/60">{h.distance}</p>
                        <p className="mt-1 font-bold text-[#865d1d]">AED {h.price.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Block C, D, E: Room Type, Transport & Flights */}
              <div className="grid gap-4 sm:grid-cols-3">
                {/* Room Type */}
                <div className="rounded-xl border border-black/10 bg-white p-4 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-masaar-black">
                    <span className="flex size-5 items-center justify-center rounded-full bg-[#b37e28] text-[10px] font-bold text-white">
                      C
                    </span>
                    <span>Room Type</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    {(["twin", "triple", "quad"] as const).map((r) => (
                      <div
                        key={r}
                        onClick={() => setSelectedRoom(r)}
                        className={`cursor-pointer rounded-lg border p-2 flex justify-between items-center ${
                          selectedRoom === r ? "border-[#b37e28] bg-[#FAF8F5] ring-1 ring-[#b37e28]" : "border-black/10"
                        }`}
                      >
                        <span className="capitalize font-semibold text-masaar-black">{r}</span>
                        <span className="text-[11px] text-masaar-black/60">
                          {roomAdjustments[r] === 0 ? "Included" : `${roomAdjustments[r]} AED`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Transport */}
                <div className="rounded-xl border border-black/10 bg-white p-4 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-masaar-black">
                    <span className="flex size-5 items-center justify-center rounded-full bg-[#b37e28] text-[10px] font-bold text-white">
                      D
                    </span>
                    <span>Transport</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    {vehicles.map((v) => (
                      <div
                        key={v.name}
                        onClick={() => setSelectedVehicle(v.name)}
                        className={`cursor-pointer rounded-lg border p-2 flex justify-between items-center ${
                          selectedVehicle === v.name ? "border-[#b37e28] bg-[#FAF8F5] ring-1 ring-[#b37e28]" : "border-black/10"
                        }`}
                      >
                        <span className="font-semibold text-masaar-black">{v.name}</span>
                        <span className="text-[11px] font-bold text-[#865d1d]">AED {v.price}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Flight Class */}
                <div className="rounded-xl border border-black/10 bg-white p-4 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-masaar-black">
                    <span className="flex size-5 items-center justify-center rounded-full bg-[#b37e28] text-[10px] font-bold text-white">
                      E
                    </span>
                    <span>Flight Class</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div
                      onClick={() => setFlightClass("economy")}
                      className={`cursor-pointer rounded-lg border p-2 flex justify-between items-center ${
                        flightClass === "economy" ? "border-[#b37e28] bg-[#FAF8F5] ring-1 ring-[#b37e28]" : "border-black/10"
                      }`}
                    >
                      <span className="font-semibold text-masaar-black">Economy</span>
                      <span className="text-[11px] text-masaar-black/60">Included</span>
                    </div>
                    <div
                      onClick={() => setFlightClass("business")}
                      className={`cursor-pointer rounded-lg border p-2 flex justify-between items-center ${
                        flightClass === "business" ? "border-[#b37e28] bg-[#FAF8F5] ring-1 ring-[#b37e28]" : "border-black/10"
                      }`}
                    >
                      <span className="font-semibold text-masaar-black">Business</span>
                      <span className="text-[11px] font-bold text-[#865d1d]">+ AED 4,500</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Block F: Additional Services */}
              <div className="rounded-xl border border-black/10 bg-white p-5 space-y-3">
                <div className="flex items-center gap-2 border-b border-black/10 pb-2">
                  <span className="flex size-6 items-center justify-center rounded-full bg-[#b37e28] text-xs font-bold text-white">
                    F
                  </span>
                  <h3 className="font-serif font-bold text-sm text-masaar-black">
                    Additional Services
                  </h3>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-2">
                  {availableServices.map((srv) => {
                    const isChecked = selectedServices.has(srv.id);
                    return (
                      <label
                        key={srv.id}
                        className={`flex cursor-pointer items-center justify-between rounded-lg border p-2.5 text-xs transition-colors ${
                          isChecked ? "border-[#b37e28] bg-[#FAF8F5]" : "border-black/10 hover:bg-black/[0.01]"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleService(srv.id)}
                            className="rounded border-black/20 text-[#b37e28] focus:ring-[#b37e28]"
                          />
                          <span className="font-medium text-masaar-black">{srv.name}</span>
                        </div>
                        <span className="font-bold text-[#865d1d]">AED {srv.price}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right 4 Cols: Package Summary (Exact match CUSTOM PACKAGE BUILDER.png) */}
            <div className="lg:col-span-4">
              <div className="sticky top-4 rounded-xl border border-black/10 bg-white p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-black/10 pb-2">
                  <h4 className="font-serif font-bold text-base text-masaar-black">
                    Package Summary
                  </h4>
                  <span className="rounded bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-masaar-black/70">
                    AED
                  </span>
                </div>

                <div className="space-y-2 text-xs font-sans">
                  <div className="flex justify-between text-masaar-black/70">
                    <span>Base Package ({selectedTier})</span>
                    <span className="font-medium text-masaar-black">
                      AED {baseRate.toLocaleString()} × {adults} = {baseTotal.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between text-masaar-black/70">
                    <span>Makkah Hotel ({makkahHotelObj.name})</span>
                    <span className="font-medium text-masaar-black">
                      AED {makkahHotelObj.price.toLocaleString()} × {adults} = {makkahTotal.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between text-masaar-black/70">
                    <span>Madinah Hotel ({madinahHotelObj.name})</span>
                    <span className="font-medium text-masaar-black">
                      AED {madinahHotelObj.price.toLocaleString()} × {adults} = {madinahTotal.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between text-masaar-black/70">
                    <span>Room Type ({selectedRoom})</span>
                    <span className="font-medium text-masaar-black">
                      {roomAdjTotal === 0 ? "Included" : `${roomAdjTotal} AED`}
                    </span>
                  </div>

                  <div className="flex justify-between text-masaar-black/70">
                    <span>Transport ({vehicleObj.name})</span>
                    <span className="font-medium text-masaar-black">AED {vehicleTotal.toLocaleString()}</span>
                  </div>

                  {flightTotal > 0 && (
                    <div className="flex justify-between text-masaar-black/70">
                      <span>Flight ({flightClass})</span>
                      <span className="font-medium text-masaar-black">
                        AED {flightPricePerPerson.toLocaleString()} × {adults} = {flightTotal.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {servicesTotal > 0 && (
                    <div className="flex justify-between text-masaar-black/70">
                      <span>Additional Services</span>
                      <span className="font-medium text-masaar-black">AED {servicesTotal.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="border-t border-black/10 pt-2 space-y-1">
                    <div className="flex justify-between text-masaar-black/60">
                      <span>Subtotal</span>
                      <span>AED {subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-masaar-black/60">
                      <span>VAT (5%)</span>
                      <span>AED {vat.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#b37e28]/30 bg-gradient-to-r from-[#FAF6EE] to-[#F5ECE0] p-3 text-center mt-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#865d1d]">
                      Total Amount
                    </span>
                    <p className="font-serif text-2xl font-bold text-masaar-black">
                      AED {grandTotal.toLocaleString()}
                    </p>
                  </div>
                </div>

                <p className="text-[10px] text-masaar-black/50 italic text-center">
                  Prices are indicative and may vary based on availability and travel dates.
                </p>

                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleConfirm}
                    className="w-full rounded-xl bg-gradient-to-r from-[#b37e28] to-[#96671e] py-3 text-xs font-bold text-white shadow-sm hover:from-[#9c6d1f] hover:to-[#845a17] transition-all disabled:opacity-50"
                  >
                    {isSaving ? "Updating Package…" : "Save & Update Quotation →"}
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full rounded-xl border border-black/15 bg-white py-2 text-xs font-semibold text-masaar-black hover:bg-black/[0.02]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
