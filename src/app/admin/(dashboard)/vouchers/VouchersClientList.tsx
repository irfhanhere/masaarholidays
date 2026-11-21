"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge, PrimaryButton } from "@/components/admin/ui";
import type { DocumentRow } from "@/lib/types/database";

export function VouchersClientList({ initialVouchers }: { initialVouchers: DocumentRow[] }) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const filtered = initialVouchers.filter((v) => {
    let meta: any = {};
    try {
      if (v.special_requirements) meta = JSON.parse(v.special_requirements);
    } catch {}

    const vType = meta.voucherType || "general";
    if (typeFilter !== "all" && vType !== typeFilter) return false;

    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      v.document_number.toLowerCase().includes(q) ||
      v.client_name.toLowerCase().includes(q) ||
      (v.booking_reference && v.booking_reference.toLowerCase().includes(q)) ||
      (v.destination && v.destination.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-black/10 bg-white p-4">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search voucher number, guest name, booking ref..."
            className="w-full max-w-sm rounded-md border border-black/15 px-3 py-2 text-sm outline-none transition focus:border-pure-gold focus:ring-1 focus:ring-pure-gold"
          />

          <div className="flex items-center gap-1">
            {["all", "hotel", "transfer", "flight", "ziyarah", "booking_confirmation"].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`rounded px-2.5 py-1.5 text-xs font-semibold capitalize transition ${
                  typeFilter === t
                    ? "bg-masaar-black text-white"
                    : "bg-black/5 text-masaar-black/70 hover:bg-black/10"
                }`}
              >
                {t.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        <Link href="/admin/vouchers/new">
          <PrimaryButton>+ Issue Travel Voucher</PrimaryButton>
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-black/10 text-left text-sm">
          <thead className="bg-admin-surface text-xs font-semibold uppercase tracking-wider text-masaar-black/60">
            <tr>
              <th className="px-4 py-3">Voucher Ref</th>
              <th className="px-4 py-3">Guest / Passenger</th>
              <th className="px-4 py-3">Booking Ref</th>
              <th className="px-4 py-3">Service / Destination</th>
              <th className="px-4 py-3">Travel Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 text-masaar-black">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-masaar-black/50">
                  No travel vouchers found matching your filter criteria.
                </td>
              </tr>
            ) : (
              filtered.map((v) => (
                <tr key={v.id} className="hover:bg-black/[0.02]">
                  <td className="px-4 py-3 font-mono text-xs font-bold text-pure-gold">
                    {v.document_number}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold">{v.client_name}</div>
                    {v.client_phone && <div className="text-[11px] text-masaar-black/50">{v.client_phone}</div>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-masaar-black/70">
                    {v.booking_reference || "—"}
                  </td>
                  <td className="px-4 py-3 font-medium text-xs">
                    {v.destination || "Pilgrimage Service Voucher"}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {v.travel_date || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone="green">
                      <span className="capitalize">{v.status}</span>
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2 text-xs">
                      <Link
                        href={`/admin/documents/booking-vouchers/${v.id}`}
                        className="font-medium text-admin-primary hover:underline"
                      >
                        Edit
                      </Link>
                      <span className="text-black/20">|</span>
                      <Link
                        href={`/admin/documents/booking-vouchers/${v.id}/pdf`}
                        target="_blank"
                        className="font-semibold text-pure-gold hover:underline"
                      >
                        PDF
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
