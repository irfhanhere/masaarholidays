"use client";

import { useMemo, useState } from "react";
import { getAllSupplierRates } from "@/lib/data/supplier-rates";
import type { HotelRow } from "@/lib/types/database";

interface Props {
  hotels: HotelRow[];
  isOpen: boolean;
  onClose: () => void;
}

export function SupplierRatesModal({ hotels, isOpen, onClose }: Props) {
  const [search, setSearch] = useState("");
  const [selectedDoc, setSelectedDoc] = useState("all");
  const rates = useMemo(() => getAllSupplierRates(), []);

  const hotelMap = useMemo(() => {
    const map = new Map<string, HotelRow>();
    hotels.forEach((h) => map.set(h.id, h));
    return map;
  }, [hotels]);

  const filteredRates = useMemo(() => {
    return rates.filter((r) => {
      const hotel = hotelMap.get(r.hotel_id);
      const hotelName = hotel?.name || "";
      const matchesSearch =
        search === "" ||
        hotelName.toLowerCase().includes(search.toLowerCase()) ||
        r.room_type.toLowerCase().includes(search.toLowerCase()) ||
        r.period_label.toLowerCase().includes(search.toLowerCase());

      const matchesDoc =
        selectedDoc === "all" ||
        (selectedDoc === "makkah" && r.source_document.toLowerCase().includes("makkah")) ||
        (selectedDoc === "madinah" && r.source_document.toLowerCase().includes("madinah"));

      return matchesSearch && matchesDoc;
    });
  }, [rates, hotelMap, search, selectedDoc]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-masaar-black/70 p-4"
    >
      <div className="flex h-[90vh] w-full max-w-6xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 bg-warm-ivory/50 px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📊</span>
              <h2 className="text-lg font-bold text-masaar-black">Supplier Rate Sheets (Asfar Al Safwah)</h2>
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                🔒 B2B Rates (SAR)
              </span>
            </div>
            <p className="mt-1 text-xs text-masaar-black/60">
              Complete supplier wholesale pricing catalog. Isolated from retail pages. Showing {filteredRates.length} of {rates.length} rates.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg border border-black/10 bg-white text-masaar-black/70 hover:bg-black/5"
          >
            ✕
          </button>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3 border-b border-black/10 bg-white p-4">
          <div className="relative flex-1 min-w-[220px]">
            <span className="absolute left-3 top-2.5 text-xs text-masaar-black/40">🔍</span>
            <input
              type="text"
              placeholder="Search by hotel name, room type, or season..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-black/15 bg-white py-2 pl-8 pr-3 text-xs text-masaar-black placeholder:text-masaar-black/40 focus:border-[#C9A227] focus:outline-none"
            />
          </div>

          <div className="w-56">
            <select
              value={selectedDoc}
              onChange={(e) => setSelectedDoc(e.target.value)}
              className="w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-xs text-masaar-black focus:border-[#C9A227] focus:outline-none"
            >
              <option value="all">All Documents (Makkah &amp; Madinah)</option>
              <option value="makkah">Makkah Hotel Rates.pdf (28 pages)</option>
              <option value="madinah">Madinah Hotel Rates 2026-2027.pdf (20 pages)</option>
            </select>
          </div>

          {(search || selectedDoc !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSelectedDoc("all");
              }}
              className="rounded-lg border border-black/10 bg-warm-ivory px-3 py-2 text-xs font-semibold text-masaar-black hover:bg-black/5"
            >
              Clear
            </button>
          )}
        </div>

        {/* Table container */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 z-10 border-b border-black/10 bg-warm-ivory font-bold uppercase text-masaar-black/70 shadow-2xs">
              <tr>
                <th className="px-4 py-3">Hotel &amp; City</th>
                <th className="px-4 py-3">Room Type</th>
                <th className="px-4 py-3">Period</th>
                <th className="px-4 py-3">Board Basis</th>
                <th className="px-4 py-3 text-right">Weekday (Sat–Wed)</th>
                <th className="px-4 py-3 text-right">Weekend (Thu–Fri)</th>
                <th className="px-4 py-3 text-right">Extra Bed</th>
                <th className="px-4 py-3">Sheet Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {filteredRates.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-masaar-black/50">
                    No supplier rates matched your search criteria.
                  </td>
                </tr>
              ) : (
                filteredRates.map((r, idx) => {
                  const hotel = hotelMap.get(r.hotel_id);
                  const isMakkah = r.source_document.toLowerCase().includes("makkah");

                  return (
                    <tr key={r.id || idx} className="hover:bg-warm-ivory/20">
                      <td className="px-4 py-3 font-medium text-masaar-black">
                        <div className="font-bold text-masaar-black">{hotel?.name || "Unknown Hotel"}</div>
                        <div className="flex items-center gap-1.5 text-[10px] text-masaar-black/50">
                          <span
                            className={`rounded px-1.5 py-0.2 font-semibold ${
                              isMakkah ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {isMakkah ? "Makkah" : "Madinah"}
                          </span>
                          <span>•</span>
                          <span>{hotel?.category || "Standard"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-masaar-black">{r.room_type}</div>
                        <div className="text-[11px] text-masaar-black/50">
                          {r.occupancy && <span>{r.occupancy}</span>}
                          {r.occupancy && r.view_type && <span> • </span>}
                          {r.view_type && <span>{r.view_type}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-medium text-masaar-black">{r.period_label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded bg-black/5 px-2 py-0.5 font-medium text-masaar-black">
                          {r.board_basis}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-masaar-black">
                        {r.weekday_rate ? `SAR ${Number(r.weekday_rate).toLocaleString()}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-masaar-black">
                        {r.weekend_rate ? `SAR ${Number(r.weekend_rate).toLocaleString()}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-masaar-black/80">
                        {r.extra_bed_rate ? `SAR ${Number(r.extra_bed_rate).toLocaleString()}` : "—"}
                      </td>
                      <td className="px-4 py-3 max-w-[200px]">
                        <div className="flex items-center gap-1 text-[11px] font-medium text-masaar-black/70">
                          <span className="truncate">{r.source_document}</span>
                          <span className="text-[#C9A227] font-bold">p.{r.source_page}</span>
                        </div>
                        {r.meal_supplement && (
                          <div className="mt-0.5 text-[10px] text-masaar-black/50 truncate" title={r.meal_supplement}>
                            {r.meal_supplement}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-black/10 bg-warm-ivory/30 px-6 py-3 text-xs text-masaar-black/60">
          <span>
            Showing {filteredRates.length} of {rates.length} supplier rate rows.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-black/15 bg-white px-4 py-1.5 font-semibold text-masaar-black hover:bg-warm-ivory"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
