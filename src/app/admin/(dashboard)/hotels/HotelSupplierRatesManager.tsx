"use client";

import { useMemo, useState } from "react";
import { getSupplierRatesForHotel } from "@/lib/data/supplier-rates";

interface Props {
  hotelId: string;
  hotelName: string;
}

export function HotelSupplierRatesManager({ hotelId, hotelName }: Props) {
  const rates = useMemo(() => getSupplierRatesForHotel(hotelId), [hotelId]);
  const [selectedSeason, setSelectedSeason] = useState<string>("all");

  const seasons = useMemo(() => {
    const set = new Set<string>();
    rates.forEach((r) => {
      if (r.period_label) set.add(r.period_label);
    });
    return Array.from(set);
  }, [rates]);

  const filteredRates = useMemo(() => {
    if (selectedSeason === "all") return rates;
    return rates.filter((r) => r.period_label === selectedSeason);
  }, [rates, selectedSeason]);

  return (
    <div className="rounded-xl border border-black/10 bg-white shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="border-b border-black/10 bg-warm-ivory/40 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg">📊</span>
            <h2 className="font-semibold text-masaar-black text-base">Supplier Rate Sheets (Asfar Al Safwah)</h2>
            <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
              🔒 B2B Confidential (SAR)
            </span>
          </div>
          <p className="mt-1 text-xs text-masaar-black/60">
            Wholesale contractor rates for {hotelName}. Native SAR pricing isolated from public retail pages.
          </p>
        </div>

        {seasons.length > 1 && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-masaar-black/70">Filter Period:</label>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="rounded-lg border border-black/15 bg-white px-2.5 py-1 text-xs text-masaar-black focus:border-[#C9A227] focus:outline-none"
            >
              <option value="all">All Periods ({rates.length} rates)</option>
              {seasons.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Isolation notice banner */}
      <div className="bg-[#FAF5E8] border-b border-[#F0E6CF] px-4 py-2.5 flex items-center gap-2 text-xs text-[#8C6B1A]">
        <span className="font-bold">Notice:</span>
        <span>
          These net rates are strictly internal for quotation calculation. No automated public markup or currency conversion is applied.
        </span>
      </div>

      {/* Content */}
      {rates.length === 0 ? (
        <div className="p-8 text-center text-xs text-masaar-black/50">
          <p className="font-medium">No direct supplier rate sheet on file for this property.</p>
          <p className="mt-1 text-masaar-black/40">
            This hotel may be contracted on request or sourced through an alternate supplier partner.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-black/10 bg-warm-ivory/30 font-bold uppercase text-masaar-black/60">
              <tr>
                <th className="px-4 py-3">Room Type</th>
                <th className="px-4 py-3">Period</th>
                <th className="px-4 py-3">Board Basis</th>
                <th className="px-4 py-3 text-right">Weekday (Sat–Wed)</th>
                <th className="px-4 py-3 text-right">Weekend (Thu–Fri)</th>
                <th className="px-4 py-3 text-right">Extra Bed</th>
                <th className="px-4 py-3">Source &amp; Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {filteredRates.map((r, idx) => {
                const weekdayFormatted = r.weekday_rate ? `SAR ${Number(r.weekday_rate).toLocaleString()}` : "—";
                const weekendFormatted = r.weekend_rate ? `SAR ${Number(r.weekend_rate).toLocaleString()}` : "—";
                const extraBedFormatted = r.extra_bed_rate ? `SAR ${Number(r.extra_bed_rate).toLocaleString()}` : "—";

                return (
                  <tr key={r.id || idx} className="hover:bg-warm-ivory/15">
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
                      {r.valid_from && r.valid_to && (
                        <div className="text-[10px] text-masaar-black/40">
                          {r.valid_from} to {r.valid_to}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded bg-black/5 px-2 py-0.5 font-medium text-masaar-black">
                        {r.board_basis}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-masaar-black">
                      {weekdayFormatted}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-masaar-black">
                      {weekendFormatted}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-masaar-black/80">
                      {extraBedFormatted}
                    </td>
                    <td className="px-4 py-3 max-w-[280px]">
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-masaar-black/70">
                        <span>📄 {r.source_document}</span>
                        <span className="text-[#C9A227] font-bold">p.{r.source_page}</span>
                      </div>
                      {r.meal_supplement && (
                        <div className="mt-0.5 text-[10px] text-masaar-black/60 truncate" title={r.meal_supplement}>
                          {r.meal_supplement}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
