"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, Badge, EmptyRow } from "@/components/admin/ui";
import type { DocumentRow } from "@/lib/types/database";

function statusTone(status: string): "green" | "gold" | "gray" | "blue" {
  if (status === "confirmed" || status === "issued") return "green";
  if (status === "sent") return "gold";
  if (status === "cancelled") return "gray";
  return "blue";
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function BookingVouchersClientList({ vouchers }: { vouchers: DocumentRow[] }) {
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const filtered = useMemo(() => {
    return vouchers.filter((doc) => {
      const matchesSearch =
        !search.trim() ||
        doc.client_name.toLowerCase().includes(search.toLowerCase()) ||
        doc.document_number.toLowerCase().includes(search.toLowerCase()) ||
        (doc.booking_reference && doc.booking_reference.toLowerCase().includes(search.toLowerCase())) ||
        (doc.destination && doc.destination.toLowerCase().includes(search.toLowerCase()));

      const matchesStatus =
        selectedStatus === "all" ||
        (selectedStatus === "confirmed" && (doc.status === "confirmed" || doc.status === "issued")) ||
        doc.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [vouchers, search, selectedStatus]);

  const statuses = [
    { label: "All", value: "all" },
    { label: "Confirmed", value: "confirmed" },
    { label: "Draft", value: "draft" },
    { label: "Sent", value: "sent" },
    { label: "Cancelled", value: "cancelled" },
  ];

  return (
    <Card className="!p-0">
      {/* ── SEARCH & FILTER CONTROLS BAR ── */}
      <div className="border-b border-black/10 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative max-w-sm w-full">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-masaar-black/40">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search by client, ref, or voucher #…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-black/15 bg-white py-1.5 pl-9 pr-3 text-sm focus:border-admin-primary focus:outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-masaar-black/40 hover:text-masaar-black"
            >
              ✕
            </button>
          )}
        </div>

        {/* Status filter pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {statuses.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setSelectedStatus(s.value)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                selectedStatus === s.value
                  ? "bg-masaar-black text-white"
                  : "bg-black/5 text-masaar-black/70 hover:bg-black/10"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── TABLE ── */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/10 text-xs uppercase tracking-wide text-masaar-black/50">
              <th className="px-6 py-3 font-medium">Document No.</th>
              <th className="px-6 py-3 font-medium">Booking Ref</th>
              <th className="px-6 py-3 font-medium">Client</th>
              <th className="px-6 py-3 font-medium">Journey / Destination</th>
              <th className="px-6 py-3 font-medium">Travel Dates</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <EmptyRow colSpan={7}>
                {search || selectedStatus !== "all"
                  ? "No booking vouchers match your search and filter criteria."
                  : "No booking vouchers yet. Create a new one or convert an accepted quotation into a booking confirmation."}
              </EmptyRow>
            )}
            {filtered.map((doc: DocumentRow) => (
              <tr key={doc.id} className="border-b border-black/5 last:border-0 hover:bg-black/[0.02]">
                <td className="px-6 py-3.5 font-medium">{doc.document_number}</td>
                <td className="px-6 py-3.5 font-mono text-xs font-bold text-admin-primary">
                  {doc.booking_reference || `MH-BKG-${doc.document_number.replace(/^BV-/, "")}`}
                </td>
                <td className="px-6 py-3.5">
                  <div className="font-medium text-masaar-black">{doc.client_name}</div>
                  {doc.client_phone && <div className="text-xs text-masaar-black/50">{doc.client_phone}</div>}
                </td>
                <td className="px-6 py-3.5 text-masaar-black/75">
                  {doc.destination || "Makkah & Madinah"}
                </td>
                <td className="px-6 py-3.5 text-xs text-masaar-black/65">
                  {doc.travel_date ? (
                    doc.return_date ? (
                      `${formatDate(doc.travel_date)} – ${formatDate(doc.return_date)}`
                    ) : (
                      formatDate(doc.travel_date)
                    )
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-6 py-3.5">
                  <Badge tone={statusTone(doc.status)}>{doc.status.replace(/_/g, " ")}</Badge>
                </td>
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/admin/documents/booking-vouchers/${doc.id}`}
                      className="font-medium text-admin-primary hover:underline"
                    >
                      Open
                    </Link>
                    <span className="text-black/20">|</span>
                    <Link
                      href={`/admin/documents/booking-vouchers/${doc.id}?tab=vouchers`}
                      className="text-xs font-medium text-deep-gold hover:underline"
                    >
                      Vouchers →
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-3 border-t border-black/5 bg-[#FAF9F6] text-xs text-masaar-black/50 flex justify-between items-center">
        <span>Showing {filtered.length} of {vouchers.length} bookings</span>
        {filtered.length !== vouchers.length && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSelectedStatus("all");
            }}
            className="text-admin-primary hover:underline font-medium"
          >
            Clear filters
          </button>
        )}
      </div>
    </Card>
  );
}
