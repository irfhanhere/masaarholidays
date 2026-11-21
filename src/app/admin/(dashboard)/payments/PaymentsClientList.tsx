"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge, PrimaryButton } from "@/components/admin/ui";
import type { PaymentRecord } from "@/lib/data/payments";

export function PaymentsClientList({ initialPayments }: { initialPayments: PaymentRecord[] }) {
  const [query, setQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");

  const filtered = initialPayments.filter((p) => {
    if (methodFilter !== "all" && p.payment_method !== methodFilter) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      p.payment_number.toLowerCase().includes(q) ||
      (p.customer_name && p.customer_name.toLowerCase().includes(q)) ||
      (p.booking_reference && p.booking_reference.toLowerCase().includes(q)) ||
      (p.transaction_reference && p.transaction_reference.toLowerCase().includes(q))
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
            placeholder="Search payment number, guest, booking ref, transaction ID..."
            className="w-full max-w-sm rounded-md border border-black/15 px-3 py-2 text-sm outline-none transition focus:border-pure-gold focus:ring-1 focus:ring-pure-gold"
          />

          <div className="flex items-center gap-1">
            {["all", "bank_transfer", "cash", "credit_card", "stripe", "tamara"].map((m) => (
              <button
                key={m}
                onClick={() => setMethodFilter(m)}
                className={`rounded px-2.5 py-1.5 text-xs font-semibold capitalize transition ${
                  methodFilter === m
                    ? "bg-masaar-black text-white"
                    : "bg-black/5 text-masaar-black/70 hover:bg-black/10"
                }`}
              >
                {m.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        <Link href="/admin/payments/record">
          <PrimaryButton>+ Record Payment</PrimaryButton>
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-black/10 text-left text-sm">
          <thead className="bg-admin-surface text-xs font-semibold uppercase tracking-wider text-masaar-black/60">
            <tr>
              <th className="px-4 py-3">Receipt / Ref</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Booking Reference</th>
              <th className="px-4 py-3">Payment Date</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Transaction ID</th>
              <th className="px-4 py-3 text-right">Amount Received</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 text-masaar-black">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-masaar-black/50">
                  No payment records found.
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="hover:bg-black/[0.02]">
                  <td className="px-4 py-3 font-mono text-xs font-bold text-pure-gold">
                    {p.payment_number}
                  </td>
                  <td className="px-4 py-3 font-semibold">{p.customer_name || "Guest"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-masaar-black/70">
                    {p.booking_reference || "—"}
                  </td>
                  <td className="px-4 py-3 text-xs">{p.payment_date}</td>
                  <td className="px-4 py-3">
                    <Badge tone="gray">
                      <span className="capitalize">{p.payment_method.replace("_", " ")}</span>
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-masaar-black/60">
                    {p.transaction_reference || "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-green-700">
                    AED {Number(p.amount).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {p.receipt_id && (
                      <Link
                        href={`/admin/documents/receipts/${p.receipt_id}/pdf`}
                        target="_blank"
                        className="rounded border border-black/15 px-2.5 py-1 text-xs font-semibold text-pure-gold hover:bg-black/5"
                      >
                        Receipt PDF
                      </Link>
                    )}
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
