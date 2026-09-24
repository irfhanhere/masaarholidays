"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, Badge, EmptyRow } from "@/components/admin/ui";
import type { DocumentRow } from "@/lib/types/database";

function statusTone(status: string): "green" | "amber" | "gray" | "blue" | "gold" {
  if (status === "paid") return "green";
  if (["sent", "partially_paid", "issued"].includes(status)) return "gold";
  if (status === "cancelled") return "gray";
  return "blue";
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function InvoicesClientList({ invoices }: { invoices: DocumentRow[] }) {
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesSearch =
        !search.trim() ||
        inv.client_name.toLowerCase().includes(search.toLowerCase()) ||
        inv.document_number.toLowerCase().includes(search.toLowerCase()) ||
        (inv.booking_reference && inv.booking_reference.toLowerCase().includes(search.toLowerCase()));

      const matchesStatus = selectedStatus === "all" || inv.status === selectedStatus;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, search, selectedStatus]);

  const statuses = [
    { label: "All", value: "all" },
    { label: "Paid", value: "paid" },
    { label: "Partially Paid", value: "partially_paid" },
    { label: "Issued", value: "issued" },
    { label: "Draft", value: "draft" },
    { label: "Cancelled", value: "cancelled" },
  ];

  return (
    <Card className="!p-0">
      {/* ── SEARCH & FILTER BAR ── */}
      <div className="border-b border-black/10 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative max-w-sm w-full">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-masaar-black/40">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search by client or invoice #…"
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

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/10 text-xs uppercase tracking-wide text-masaar-black/50">
              <th className="px-6 py-3 font-medium">Invoice No.</th>
              <th className="px-6 py-3 font-medium">Client</th>
              <th className="px-6 py-3 font-medium">Total</th>
              <th className="px-6 py-3 font-medium">Paid</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Date</th>
              <th className="px-6 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <EmptyRow colSpan={7}>
                {search || selectedStatus !== "all"
                  ? "No invoices match your search criteria."
                  : "No invoices yet — create one manually or from an accepted quotation."}
              </EmptyRow>
            )}
            {filtered.map((inv) => (
              <tr key={inv.id} className="border-b border-black/5 last:border-0 hover:bg-black/[0.02]">
                <td className="px-6 py-3 font-medium">{inv.document_number}</td>
                <td className="px-6 py-3 font-medium text-masaar-black">{inv.client_name}</td>
                <td className="px-6 py-3 font-semibold">AED {inv.total_aed.toLocaleString()}</td>
                <td className="px-6 py-3 text-emerald-700">AED {inv.amount_paid_aed.toLocaleString()}</td>
                <td className="px-6 py-3">
                  <Badge tone={statusTone(inv.status)}>{inv.status.replace(/_/g, " ")}</Badge>
                </td>
                <td className="px-6 py-3 text-masaar-black/60">{formatDate(inv.created_at)}</td>
                <td className="px-6 py-3 space-x-3">
                  <Link href={`/admin/documents/invoices/${inv.id}`} className="font-medium text-admin-primary hover:underline">
                    Open
                  </Link>
                  {inv.status !== "paid" && (
                    <Link
                      href={`/admin/documents/invoices/${inv.id}/record-payment`}
                      className="font-medium text-emerald-700 hover:underline"
                    >
                      Record Payment
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-3 border-t border-black/5 bg-[#FAF9F6] text-xs text-masaar-black/50 flex justify-between items-center">
        <span>Showing {filtered.length} of {invoices.length} invoices</span>
        {filtered.length !== invoices.length && (
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
