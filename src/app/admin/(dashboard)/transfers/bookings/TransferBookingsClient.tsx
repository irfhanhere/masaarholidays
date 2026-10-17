"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { TransferBookingRow } from "@/lib/types/database";
import { triggerIssueVoucher } from "./actions";

interface Props {
  bookings: TransferBookingRow[];
}

export function TransferBookingsClient({ bookings }: Props) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [issuingId, setIssuingId] = useState<string | null>(null);

  // Quick Metrics
  const metrics = useMemo(() => {
    const total = bookings.length;
    const paid = bookings.filter((b) => b.payment_status === "paid").length;
    const vouchersIssued = bookings.filter((b) => !!b.voucher_document_id).length;
    const totalRevenueAed = bookings
      .filter((b) => b.payment_status === "paid")
      .reduce((sum, b) => sum + Number(b.price_aed || 0), 0);

    return { total, paid, vouchersIssued, totalRevenueAed };
  }, [bookings]);

  // Filtering
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchesSearch =
        b.booking_ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.customer_phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.route_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.vehicle_name.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === "paid") return b.payment_status === "paid";
      if (statusFilter === "pending") return b.payment_status === "pending";
      if (statusFilter === "voucher_issued") return !!b.voucher_document_id;
      if (statusFilter === "confirmed") return b.booking_status === "confirmed";

      return true;
    });
  }, [bookings, searchTerm, statusFilter]);

  const handleIssueVoucher = async (bookingId: string) => {
    setIssuingId(bookingId);
    try {
      const res = await triggerIssueVoucher(bookingId);
      if (res.success && res.documentId) {
        router.push(`/admin/documents/booking-vouchers/${res.documentId}`);
      } else {
        alert(res.error || "Failed to generate voucher.");
      }
    } catch (e: any) {
      alert(e.message || "An unexpected error occurred.");
    } finally {
      setIssuingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-masaar-black">Transfer Bookings</h1>
          <p className="mt-1 text-xs text-masaar-black/60">
            Monitor online chauffeur bookings, verify payments, and generate official customer vouchers.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-black/10 bg-white p-4 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-masaar-black/50">Total Bookings</div>
          <div className="mt-2 text-2xl font-bold text-masaar-black">{metrics.total}</div>
        </div>

        <div className="rounded-xl border border-black/10 bg-white p-4 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">Paid Bookings</div>
          <div className="mt-2 text-2xl font-bold text-emerald-700">{metrics.paid}</div>
        </div>

        <div className="rounded-xl border border-black/10 bg-white p-4 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-masaar-black/50">Vouchers Issued</div>
          <div className="mt-2 text-2xl font-bold text-masaar-black">{metrics.vouchersIssued}</div>
        </div>

        <div className="rounded-xl border border-black/10 bg-white p-4 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-deep-gold">Total Revenue (AED)</div>
          <div className="mt-2 text-2xl font-bold text-deep-gold">
            AED {metrics.totalRevenueAed.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Filters Card */}
      <div className="flex flex-col sm:flex-row gap-3 rounded-xl border border-black/10 bg-white p-4 shadow-xs">
        <div className="flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by customer name, reference, phone, email, or route..."
            className="w-full rounded-lg border border-black/15 bg-white px-3.5 py-2 text-xs text-masaar-black placeholder:text-masaar-black/40 focus:border-deep-gold focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-black/15 bg-white px-3 py-2 text-xs text-masaar-black focus:border-deep-gold focus:outline-none"
          >
            <option value="all">All Bookings</option>
            <option value="paid">Paid Only</option>
            <option value="confirmed">Confirmed</option>
            <option value="voucher_issued">Voucher Issued</option>
            <option value="pending">Pending Payment</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-masaar-black border-collapse">
            <thead className="border-b border-black/10 bg-warm-ivory/50 font-semibold uppercase tracking-wider text-[11px] text-masaar-black/70">
              <tr>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Route &amp; Vehicle</th>
                <th className="px-4 py-3">Travel Date</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Voucher</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-masaar-black/50">
                    No transfer bookings found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => {
                  const isPaid = b.payment_status === "paid";
                  const hasVoucher = Boolean(b.voucher_document_id);

                  return (
                    <tr key={b.id} className="hover:bg-warm-ivory/20 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-masaar-black whitespace-nowrap">
                        <Link
                          href={`/admin/transfers/bookings/${b.id}`}
                          className="hover:text-deep-gold hover:underline"
                        >
                          {b.booking_ref}
                        </Link>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-semibold text-masaar-black">{b.customer_name}</div>
                        <div className="text-[11px] text-masaar-black/60">{b.customer_phone}</div>
                        <div className="text-[10px] text-masaar-black/40">{b.customer_email}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium text-masaar-black line-clamp-1">{b.route_name}</div>
                        <div className="text-[11px] text-masaar-black/60">
                          {b.vehicle_name} &bull; {b.passengers} Pax
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-medium text-masaar-black">{b.travel_date}</div>
                        <div className="text-[11px] text-masaar-black/60">{b.pickup_time}</div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap font-medium">
                        <div>
                          {(b.charged_amount_minor / 100).toFixed(2)} {b.charge_currency}
                        </div>
                        {b.charge_currency !== "AED" && (
                          <div className="text-[10px] text-masaar-black/50">AED {b.price_aed}</div>
                        )}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            isPaid
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {b.payment_status}
                        </span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {hasVoucher ? (
                          <Link
                            href={`/admin/documents/booking-vouchers/${b.voucher_document_id}`}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:underline"
                          >
                            <span>&#10003; {b.voucher_number || "Voucher Issued"}</span>
                          </Link>
                        ) : (
                          <span className="text-[11px] text-masaar-black/40">Not Issued</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right whitespace-nowrap space-x-2">
                        {!hasVoucher && isPaid && (
                          <button
                            type="button"
                            disabled={issuingId === b.id}
                            onClick={() => handleIssueVoucher(b.id)}
                            className="rounded-md bg-masaar-black px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-deep-gold transition-colors disabled:opacity-50"
                          >
                            {issuingId === b.id ? "Issuing..." : "Issue Voucher"}
                          </button>
                        )}

                        <Link
                          href={`/admin/transfers/bookings/${b.id}`}
                          className="rounded-md border border-black/10 px-2.5 py-1 text-[11px] font-semibold text-masaar-black hover:bg-black/5 transition-colors"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
