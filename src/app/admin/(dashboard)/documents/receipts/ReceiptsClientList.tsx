"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, Badge, EmptyRow } from "@/components/admin/ui";
import type { DocumentRow } from "@/lib/types/database";

function statusTone(status: string): "green" | "amber" | "gray" | "blue" | "gold" {
  if (status === "issued") return "green";
  if (status === "sent") return "gold";
  if (status === "cancelled") return "gray";
  return "blue";
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  bank_transfer: "Bank Transfer",
  cash: "Cash",
  card: "Card",
  other: "Other",
};

export function ReceiptsClientList({ receipts }: { receipts: DocumentRow[] }) {
  const [search, setSearch] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<string>("all");

  const filtered = useMemo(() => {
    return receipts.filter((r) => {
      const matchesSearch =
        !search.trim() ||
        r.client_name.toLowerCase().includes(search.toLowerCase()) ||
        r.document_number.toLowerCase().includes(search.toLowerCase()) ||
        (r.transaction_reference && r.transaction_reference.toLowerCase().includes(search.toLowerCase()));

      const matchesMethod = selectedMethod === "all" || r.payment_method === selectedMethod;
      return matchesSearch && matchesMethod;
    });
  }, [receipts, search, selectedMethod]);

  const methods = [
    { label: "All Methods", value: "all" },
    { label: "Bank Transfer", value: "bank_transfer" },
    { label: "Cash", value: "cash" },
    { label: "Card", value: "card" },
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
            placeholder="Search by client or receipt #…"
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
          {methods.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setSelectedMethod(m.value)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                selectedMethod === m.value
                  ? "bg-masaar-black text-white"
                  : "bg-black/5 text-masaar-black/70 hover:bg-black/10"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/10 text-xs uppercase tracking-wide text-masaar-black/50">
              <th className="px-6 py-3 font-medium">Receipt No.</th>
              <th className="px-6 py-3 font-medium">Client</th>
              <th className="px-6 py-3 font-medium">Invoice Ref</th>
              <th className="px-6 py-3 font-medium">Amount</th>
              <th className="px-6 py-3 font-medium">Method</th>
              <th className="px-6 py-3 font-medium">Payment Date</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <EmptyRow colSpan={8}>
                {search || selectedMethod !== "all"
                  ? "No receipts match your search criteria."
                  : "No receipts yet — record a payment against an invoice to generate one."}
              </EmptyRow>
            )}
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-black/5 last:border-0 hover:bg-black/[0.02]">
                <td className="px-6 py-3 font-medium">{r.document_number}</td>
                <td className="px-6 py-3 font-medium text-masaar-black">{r.client_name}</td>
                <td className="px-6 py-3 text-masaar-black/60 text-xs">
                  {r.source_document_id ? (
                    <Link
                      href={`/admin/documents/invoices/${r.source_document_id}`}
                      className="font-medium text-admin-primary hover:underline"
                    >
                      View Invoice →
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-6 py-3 font-semibold text-emerald-800">
                  AED {r.total_aed.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </td>
                <td className="px-6 py-3 text-masaar-black/70">
                  {r.payment_method ? (PAYMENT_METHOD_LABEL[r.payment_method] ?? r.payment_method) : "—"}
                </td>
                <td className="px-6 py-3 text-masaar-black/60">
                  {r.payment_date
                    ? new Date(r.payment_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                    : formatDate(r.created_at)}
                </td>
                <td className="px-6 py-3">
                  <Badge tone={statusTone(r.status)}>{r.status.replace(/_/g, " ")}</Badge>
                </td>
                <td className="px-6 py-3">
                  <Link
                    href={`/admin/documents/receipts/${r.id}`}
                    className="font-medium text-admin-primary hover:underline"
                  >
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-3 border-t border-black/5 bg-[#FAF9F6] text-xs text-masaar-black/50 flex justify-between items-center">
        <span>Showing {filtered.length} of {receipts.length} receipts</span>
        {filtered.length !== receipts.length && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSelectedMethod("all");
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
