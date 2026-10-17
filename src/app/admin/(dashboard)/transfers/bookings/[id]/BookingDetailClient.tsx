"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { TransferBookingRow } from "@/lib/types/database";
import { triggerIssueVoucher, updateTransferBookingStatus } from "../actions";

interface Props {
  booking: TransferBookingRow;
}

export function BookingDetailClient({ booking }: Props) {
  const router = useRouter();
  const [isIssuing, setIsIssuing] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(booking.booking_status);

  const isPaid = booking.payment_status === "paid";
  const hasVoucher = Boolean(booking.voucher_document_id);

  const handleIssueVoucher = async () => {
    setIsIssuing(true);
    try {
      const res = await triggerIssueVoucher(booking.id);
      if (res.success && res.documentId) {
        router.push(`/admin/documents/booking-vouchers/${res.documentId}`);
      } else {
        alert(res.error || "Failed to generate voucher.");
      }
    } catch (e: any) {
      alert(e.message || "An unexpected error occurred.");
    } finally {
      setIsIssuing(false);
    }
  };

  const handleStatusChange = async (newStatus: any) => {
    setStatusUpdating(true);
    try {
      const res = await updateTransferBookingStatus(booking.id, newStatus);
      if (res.success) {
        setCurrentStatus(newStatus);
        router.refresh();
      } else {
        alert(res.error || "Failed to update booking status.");
      }
    } catch (e: any) {
      alert(e.message || "Failed to update status.");
    } finally {
      setStatusUpdating(false);
    }
  };

  const cleanPhone = booking.customer_phone.replace(/[^0-9]/g, "");

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-masaar-black/50">
            <Link href="/admin/transfers/bookings" className="hover:text-deep-gold">
              &larr; Back to Transfer Bookings
            </Link>
          </div>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-masaar-black font-mono">
              {booking.booking_ref}
            </h1>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                isPaid
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {booking.payment_status}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                currentStatus === "confirmed"
                  ? "bg-blue-100 text-blue-800"
                  : currentStatus === "voucher_issued"
                  ? "bg-purple-100 text-purple-800"
                  : currentStatus === "completed"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-black/5 text-masaar-black/70"
              }`}
            >
              Status: {currentStatus.replace("_", " ")}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {!hasVoucher && isPaid && (
            <button
              type="button"
              disabled={isIssuing}
              onClick={handleIssueVoucher}
              className="inline-flex items-center gap-1.5 rounded-lg bg-masaar-black px-4 py-2 text-xs font-semibold text-white hover:bg-deep-gold transition-colors disabled:opacity-50"
            >
              {isIssuing ? "Generating Voucher..." : "Issue Official Voucher"}
            </button>
          )}

          {hasVoucher && (
            <>
              <Link
                href={`/admin/documents/booking-vouchers/${booking.voucher_document_id}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-deep-gold px-4 py-2 text-xs font-semibold text-white hover:bg-deep-gold/90 transition-colors"
              >
                <span>Edit Voucher ({booking.voucher_number || "Doc"})</span>
              </Link>
              <a
                href={`/pdf/download?type=booking_voucher&id=${booking.voucher_document_id}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 bg-white px-3.5 py-2 text-xs font-semibold text-masaar-black hover:bg-black/5 transition-colors"
              >
                Download PDF
              </a>
            </>
          )}

          <a
            href={`/transfers/booking/success?token=${booking.public_token}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 bg-white px-3.5 py-2 text-xs font-semibold text-masaar-black hover:bg-black/5 transition-colors"
          >
            Customer View &rarr;
          </a>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Journey & Passenger Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Journey Information */}
          <div className="rounded-xl border border-black/10 bg-white p-5 shadow-xs">
            <h2 className="text-sm font-bold uppercase tracking-wider text-deep-gold border-b border-black/5 pb-2 mb-4">
              Journey Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-xs">
              <div>
                <span className="block text-masaar-black/50 text-[11px] uppercase font-semibold">Route</span>
                <span className="text-sm font-bold text-masaar-black">{booking.route_name}</span>
              </div>

              <div>
                <span className="block text-masaar-black/50 text-[11px] uppercase font-semibold">Vehicle Selected</span>
                <span className="text-sm font-semibold text-masaar-black">{booking.vehicle_name}</span>
              </div>

              <div>
                <span className="block text-masaar-black/50 text-[11px] uppercase font-semibold">Travel Date</span>
                <span className="text-sm font-bold text-masaar-black">{booking.travel_date}</span>
              </div>

              <div>
                <span className="block text-masaar-black/50 text-[11px] uppercase font-semibold">Estimated Pickup Time</span>
                <span className="text-sm font-bold text-masaar-black">{booking.pickup_time}</span>
              </div>

              <div className="sm:col-span-2">
                <span className="block text-masaar-black/50 text-[11px] uppercase font-semibold">Pickup Location / Meeting Point</span>
                <div className="mt-1 rounded-lg border border-black/10 bg-warm-ivory/30 p-2.5 font-medium text-masaar-black">
                  {booking.pickup_location}
                </div>
              </div>

              <div className="sm:col-span-2">
                <span className="block text-masaar-black/50 text-[11px] uppercase font-semibold">Drop-off Location / Destination</span>
                <div className="mt-1 rounded-lg border border-black/10 bg-warm-ivory/30 p-2.5 font-medium text-masaar-black">
                  {booking.dropoff_location}
                </div>
              </div>

              <div>
                <span className="block text-masaar-black/50 text-[11px] uppercase font-semibold">Passengers</span>
                <span className="font-medium text-masaar-black">{booking.passengers} Guest(s)</span>
              </div>

              <div>
                <span className="block text-masaar-black/50 text-[11px] uppercase font-semibold">Luggage / Suitcases</span>
                <span className="font-medium text-masaar-black">{booking.suitcases || "Standard Luggage"}</span>
              </div>

              <div>
                <span className="block text-masaar-black/50 text-[11px] uppercase font-semibold">Flight Number</span>
                <span className="font-mono font-bold text-masaar-black">
                  {booking.flight_number || "None provided"}
                </span>
              </div>
            </div>

            {booking.special_requests && (
              <div className="mt-4 pt-4 border-t border-black/5">
                <span className="block text-masaar-black/50 text-[11px] uppercase font-semibold mb-1">
                  Special Requests / Driver Instructions
                </span>
                <div className="rounded-lg bg-amber-50 border border-amber-200/60 p-3 text-xs text-amber-950">
                  {booking.special_requests}
                </div>
              </div>
            )}
          </div>

          {/* Lead Passenger & Contact */}
          <div className="rounded-xl border border-black/10 bg-white p-5 shadow-xs">
            <h2 className="text-sm font-bold uppercase tracking-wider text-deep-gold border-b border-black/5 pb-2 mb-4">
              Lead Passenger &amp; Contact Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="block text-masaar-black/50 text-[11px] uppercase font-semibold">Full Name</span>
                <span className="text-sm font-bold text-masaar-black">{booking.customer_name}</span>
              </div>

              <div>
                <span className="block text-masaar-black/50 text-[11px] uppercase font-semibold">Email Address</span>
                <a
                  href={`mailto:${booking.customer_email}`}
                  className="font-medium text-masaar-black hover:text-deep-gold hover:underline"
                >
                  {booking.customer_email}
                </a>
              </div>

              <div>
                <span className="block text-masaar-black/50 text-[11px] uppercase font-semibold">Phone / WhatsApp</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-medium text-masaar-black">{booking.customer_phone}</span>
                  {cleanPhone && (
                    <a
                      href={`https://wa.me/${cleanPhone}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-semibold text-white hover:bg-emerald-700"
                    >
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Payment, Status & Voucher Summary */}
        <div className="space-y-6">
          {/* Status & Quick Updates */}
          <div className="rounded-xl border border-black/10 bg-white p-5 shadow-xs">
            <h2 className="text-sm font-bold uppercase tracking-wider text-deep-gold border-b border-black/5 pb-2 mb-4">
              Booking Control
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-masaar-black/50 mb-1">
                  Update Booking Status
                </label>
                <select
                  disabled={statusUpdating}
                  value={currentStatus}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-xs text-masaar-black focus:border-deep-gold focus:outline-none disabled:opacity-50"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="voucher_issued">Voucher Issued</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="text-[11px] text-masaar-black/50 pt-2 border-t border-black/5">
                Booked On: {new Date(booking.created_at).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Payment & Financials */}
          <div className="rounded-xl border border-black/10 bg-white p-5 shadow-xs">
            <h2 className="text-sm font-bold uppercase tracking-wider text-deep-gold border-b border-black/5 pb-2 mb-4">
              Payment &amp; Financials
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="text-masaar-black/60">Charged Total:</span>
                <span className="text-base font-bold text-masaar-black">
                  {(booking.charged_amount_minor / 100).toFixed(2)} {booking.charge_currency}
                </span>
              </div>

              {booking.charge_currency !== "AED" && (
                <div className="flex justify-between items-center py-1 border-t border-black/5">
                  <span className="text-masaar-black/60">Base Price (AED):</span>
                  <span className="font-semibold text-masaar-black">AED {booking.price_aed}</span>
                </div>
              )}

              <div className="flex justify-between items-center py-1 border-t border-black/5">
                <span className="text-masaar-black/60">Payment Status:</span>
                <span
                  className={`font-bold uppercase tracking-wider text-[11px] ${
                    isPaid ? "text-emerald-700" : "text-amber-700"
                  }`}
                >
                  {booking.payment_status}
                </span>
              </div>

              {booking.stripe_session_id && (
                <div className="pt-2 border-t border-black/5">
                  <span className="block text-[10px] uppercase font-semibold text-masaar-black/40">
                    Stripe Checkout Session
                  </span>
                  <span className="font-mono text-[10px] text-masaar-black/70 break-all">
                    {booking.stripe_session_id}
                  </span>
                </div>
              )}

              {booking.stripe_payment_intent && (
                <div className="pt-2 border-t border-black/5">
                  <span className="block text-[10px] uppercase font-semibold text-masaar-black/40">
                    Stripe Payment Intent
                  </span>
                  <span className="font-mono text-[10px] text-masaar-black/70 break-all">
                    {booking.stripe_payment_intent}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Voucher Summary Card */}
          <div className="rounded-xl border border-black/10 bg-white p-5 shadow-xs">
            <h2 className="text-sm font-bold uppercase tracking-wider text-deep-gold border-b border-black/5 pb-2 mb-4">
              Official Voucher
            </h2>

            {hasVoucher ? (
              <div className="space-y-3 text-xs">
                <div className="rounded-lg bg-emerald-50 border border-emerald-200/60 p-3 text-emerald-950">
                  <div className="text-[11px] font-semibold uppercase text-emerald-700">Voucher Issued</div>
                  <div className="font-mono text-sm font-bold mt-0.5">{booking.voucher_number}</div>
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <Link
                    href={`/admin/documents/booking-vouchers/${booking.voucher_document_id}`}
                    className="w-full text-center rounded-lg bg-masaar-black px-3 py-2 font-semibold text-white hover:bg-deep-gold transition-colors text-xs"
                  >
                    Open Document Builder &rarr;
                  </Link>
                  <a
                    href={`/pdf/download?type=booking_voucher&id=${booking.voucher_document_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full text-center rounded-lg border border-black/15 bg-white px-3 py-2 font-semibold text-masaar-black hover:bg-black/5 transition-colors text-xs"
                  >
                    Download Voucher PDF
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-xs text-masaar-black/60 space-y-3">
                <p>
                  No voucher has been generated for this transfer booking yet.
                </p>
                {isPaid ? (
                  <button
                    type="button"
                    disabled={isIssuing}
                    onClick={handleIssueVoucher}
                    className="w-full rounded-lg bg-masaar-black px-3 py-2 font-semibold text-white hover:bg-deep-gold transition-colors text-xs disabled:opacity-50"
                  >
                    {isIssuing ? "Generating..." : "Generate Voucher Now"}
                  </button>
                ) : (
                  <div className="rounded-lg bg-amber-50 p-2.5 text-[11px] text-amber-900 border border-amber-200/50">
                    Awaiting customer payment confirmation before issuing voucher.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
