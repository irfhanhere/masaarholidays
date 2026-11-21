"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge, PrimaryButton } from "@/components/admin/ui";
import type { BookingRow } from "@/lib/data/bookings";

export function BookingsClientList({ initialBookings }: { initialBookings: BookingRow[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  const filtered = initialBookings.filter((b) => {
    if (statusFilter !== "all" && b.booking_status !== statusFilter) return false;
    if (paymentFilter !== "all" && b.payment_status !== paymentFilter) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      b.booking_reference.toLowerCase().includes(q) ||
      (b.customer_name && b.customer_name.toLowerCase().includes(q)) ||
      b.package_name.toLowerCase().includes(q)
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
            placeholder="Search booking ref, customer, or package..."
            className="w-full max-w-sm rounded-md border border-black/15 px-3 py-2 text-sm outline-none transition focus:border-pure-gold focus:ring-1 focus:ring-pure-gold"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-black/15 px-3 py-2 text-xs font-semibold outline-none"
          >
            <option value="all">All Booking Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="in_progress">In Progress</option>
            <option value="documents_pending">Documents Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="rounded-md border border-black/15 px-3 py-2 text-xs font-semibold outline-none"
          >
            <option value="all">All Payment Statuses</option>
            <option value="paid">Fully Paid</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="unpaid">Unpaid</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        <Link href="/admin/quotations">
          <PrimaryButton>
            <span>+ Convert From Quotation</span>
          </PrimaryButton>
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-black/10 text-left text-sm">
          <thead className="bg-admin-surface text-xs font-semibold uppercase tracking-wider text-masaar-black/60">
            <tr>
              <th className="px-4 py-3">Booking Ref</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Package / Service</th>
              <th className="px-4 py-3">Travel Dates</th>
              <th className="px-4 py-3">Pax</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-right">Balance</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 text-masaar-black">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-masaar-black/50">
                  No bookings found matching the selected criteria.
                </td>
              </tr>
            ) : (
              filtered.map((b) => (
                <tr key={b.id} className="hover:bg-black/[0.02]">
                  <td className="px-4 py-3 font-mono text-xs font-bold text-pure-gold">
                    <Link href={`/admin/bookings/${b.id}`} className="hover:underline">
                      {b.booking_reference}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold">{b.customer_name || "Guest"}</div>
                    {b.customer_phone && <div className="text-[11px] text-masaar-black/60">{b.customer_phone}</div>}
                  </td>
                  <td className="px-4 py-3 font-medium text-xs max-w-xs truncate">
                    {b.package_name}
                  </td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap">
                    <div>{b.travel_date || "TBD"}</div>
                    {b.return_date && <div className="text-[11px] text-masaar-black/50">to {b.return_date}</div>}
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold">
                    {b.total_travellers}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={b.booking_status === "confirmed" ? "green" : b.booking_status === "completed" ? "blue" : "gray"}>
                      <span className="capitalize">{b.booking_status.replace("_", " ")}</span>
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={b.payment_status === "paid" ? "green" : b.payment_status === "partially_paid" ? "amber" : "gray"}>
                      <span className="capitalize">{b.payment_status.replace("_", " ")}</span>
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-xs whitespace-nowrap">
                    AED {Number(b.total_amount).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-xs whitespace-nowrap">
                    {b.balance_due > 0 ? (
                      <span className="font-semibold text-amber-700">AED {Number(b.balance_due).toLocaleString()}</span>
                    ) : (
                      <span className="text-green-700 font-semibold">Paid</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/admin/bookings/${b.id}`}
                        className="rounded border border-black/15 px-2 py-1 text-xs font-semibold hover:bg-black/5"
                      >
                        Manage
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
