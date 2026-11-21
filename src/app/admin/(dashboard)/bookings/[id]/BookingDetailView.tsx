"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge, Card, Field, PrimaryButton, SecondaryButton, StatCard, inputClass } from "@/components/admin/ui";
import type { BookingDetail } from "@/lib/data/bookings";
import { updateBookingStatusAction, addSupplierCostAction } from "../actions";

export function BookingDetailView({ detail }: { detail: BookingDetail }) {
  const { booking, customer, travellers, quotation, invoices, receipts, vouchers, supplierCosts, activityLogs } = detail;
  const [activeTab, setActiveTab] = useState<"overview" | "customer" | "arrangements" | "financials" | "vouchers" | "costs">("overview");

  // Booking status update state
  const [bookingStatus, setBookingStatus] = useState(booking.booking_status);
  const [paymentStatus, setPaymentStatus] = useState(booking.payment_status);
  const [assignedStaff, setAssignedStaff] = useState(booking.assigned_staff || "Operations Team");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);

  async function handleUpdateStatus() {
    setIsUpdating(true);
    setUpdateMsg(null);
    const res = await updateBookingStatusAction(booking.id, {
      booking_status: bookingStatus,
      payment_status: paymentStatus,
      assigned_staff: assignedStaff,
    });
    if (res.success) {
      setUpdateMsg("Status updated successfully.");
    }
    setIsUpdating(false);
  }

  // Supplier cost inline form
  const [showCostForm, setShowCostForm] = useState(false);
  const [costDescription, setCostDescription] = useState("");
  const [estCost, setEstCost] = useState(0);
  const [actCost, setActCost] = useState(0);

  async function handleAddCost(e: React.FormEvent) {
    e.preventDefault();
    await addSupplierCostAction({
      bookingId: booking.id,
      serviceDescription: costDescription,
      estimatedCost: estCost,
      actualCost: actCost,
    });
    setShowCostForm(false);
    window.location.reload();
  }

  const invoiceUrl = `/admin/documents/invoices/new?bookingRef=${encodeURIComponent(booking.booking_reference)}&clientName=${encodeURIComponent(booking.customer_name || "")}&clientPhone=${encodeURIComponent(booking.customer_phone || "")}`;
  const receiptUrl = `/admin/payments/record?bookingId=${booking.id}&bookingRef=${encodeURIComponent(booking.booking_reference)}&clientName=${encodeURIComponent(booking.customer_name || "")}&total=${booking.total_amount}&balance=${booking.balance_due}`;
  const voucherUrl = `/admin/vouchers/new?bookingId=${booking.id}&bookingRef=${encodeURIComponent(booking.booking_reference)}&clientName=${encodeURIComponent(booking.customer_name || "")}`;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-black/10 bg-white p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-bold text-pure-gold">{booking.booking_reference}</span>
            <Badge tone={booking.booking_status === "confirmed" ? "green" : booking.booking_status === "completed" ? "blue" : "gray"}>
              <span className="capitalize">{booking.booking_status.replace("_", " ")}</span>
            </Badge>
            <Badge tone={booking.payment_status === "paid" ? "green" : booking.payment_status === "partially_paid" ? "amber" : "gray"}>
              <span className="capitalize">{booking.payment_status.replace("_", " ")}</span>
            </Badge>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-masaar-black">{booking.package_name}</h1>
          <p className="text-xs text-masaar-black/60">
            Guest: {booking.customer_name} • {booking.total_travellers} Travellers • Travel: {booking.travel_date || "TBD"} to {booking.return_date || "TBD"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href={invoiceUrl}>
            <SecondaryButton>+ Issue Invoice</SecondaryButton>
          </Link>
          <Link href={receiptUrl}>
            <PrimaryButton>Record Payment</PrimaryButton>
          </Link>
          <Link href={voucherUrl}>
            <SecondaryButton>Issue Voucher</SecondaryButton>
          </Link>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Booking Price" value={`AED ${Number(booking.total_amount).toLocaleString()}`} />
        <StatCard label="Amount Collected" value={`AED ${Number(booking.paid_amount).toLocaleString()}`} />
        <StatCard
          label="Balance Due"
          value={`AED ${Number(booking.balance_due).toLocaleString()}`}
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-black/10 bg-white px-4">
        {[
          { id: "overview", label: "Overview & Status" },
          { id: "customer", label: `Guest & Travellers (${travellers.length})` },
          { id: "arrangements", label: "Hotels & Services" },
          { id: "financials", label: `Invoices & Receipts (${invoices.length + receipts.length})` },
          { id: "vouchers", label: `Vouchers (${vouchers.length})` },
          { id: "costs", label: `Supplier Costs (${supplierCosts.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`border-b-2 px-4 py-3 text-sm font-semibold transition ${
              activeTab === tab.id
                ? "border-pure-gold text-masaar-black"
                : "border-transparent text-masaar-black/60 hover:text-masaar-black"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card className="space-y-4">
            <h2 className="text-base font-bold text-masaar-black">Booking Operational Controls</h2>
            {updateMsg && <p className="text-xs text-green-700 font-semibold">{updateMsg}</p>}

            <Field label="Booking Status" htmlFor="bookingStatus">
              <select
                id="bookingStatus"
                value={bookingStatus}
                onChange={(e) => setBookingStatus(e.target.value as any)}
                className={inputClass}
              >
                <option value="enquiry">Enquiry</option>
                <option value="quotation_sent">Quotation Sent</option>
                <option value="awaiting_confirmation">Awaiting Confirmation</option>
                <option value="confirmed">Confirmed</option>
                <option value="in_progress">In Progress</option>
                <option value="documents_pending">Documents Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </Field>

            <Field label="Payment Status (Gateway / Authoritative)" htmlFor="paymentStatus">
              <select
                id="paymentStatus"
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as any)}
                className={inputClass}
              >
                <option value="unpaid">Unpaid</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="paid">Fully Paid</option>
                <option value="refunded">Refunded</option>
                <option value="partially_refunded">Partially Refunded</option>
              </select>
            </Field>

            <Field label="Assigned Operations Officer" htmlFor="assignedStaff">
              <input
                id="assignedStaff"
                type="text"
                value={assignedStaff}
                onChange={(e) => setAssignedStaff(e.target.value)}
                className={inputClass}
              />
            </Field>

            <div className="pt-2">
              <PrimaryButton onClick={handleUpdateStatus} disabled={isUpdating}>
                {isUpdating ? "Updating..." : "Save Status Changes"}
              </PrimaryButton>
            </div>
          </Card>

          <Card className="space-y-4">
            <h2 className="text-base font-bold text-masaar-black">Journey Specification</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1 border-b border-black/5">
                <span className="text-masaar-black/60">Origin / Departure City</span>
                <span className="font-semibold">{booking.departure_city}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-black/5">
                <span className="text-masaar-black/60">Destination</span>
                <span className="font-semibold">{booking.destination}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-black/5">
                <span className="text-masaar-black/60">Travel Date</span>
                <span className="font-medium">{booking.travel_date || "To be confirmed"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-black/5">
                <span className="text-masaar-black/60">Return Date</span>
                <span className="font-medium">{booking.return_date || "To be confirmed"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-black/5">
                <span className="text-masaar-black/60">Adults / Children / Infants</span>
                <span className="font-medium">{booking.adults} Adults, {booking.children} Children, {booking.infants} Infants</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-masaar-black/60">Source Quotation</span>
                {quotation ? (
                  <Link href={`/admin/documents/quotations/${quotation.id}`} className="font-mono text-pure-gold hover:underline">
                    {quotation.document_number}
                  </Link>
                ) : (
                  <span>Direct Booking</span>
                )}
              </div>
            </div>

            {booking.internal_notes && (
              <div className="mt-3 rounded bg-admin-surface p-3 text-xs text-masaar-black/80">
                <p className="font-semibold mb-1">Internal Notes:</p>
                {booking.internal_notes}
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === "customer" && (
        <div className="space-y-6">
          <Card className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-masaar-black">Lead Guest Contact Details</h2>
              {customer?.id && (
                <Link href={`/admin/customers/${customer.id}`} className="text-xs font-semibold text-pure-gold hover:underline">
                  View Full Profile ›
                </Link>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-sm">
              <div>
                <p className="text-xs text-masaar-black/60">Full Name</p>
                <p className="font-semibold">{booking.customer_name || customer?.full_name}</p>
              </div>
              <div>
                <p className="text-xs text-masaar-black/60">Phone</p>
                <p className="font-semibold">{booking.customer_phone || customer?.phone}</p>
              </div>
              <div>
                <p className="text-xs text-masaar-black/60">Email</p>
                <p className="font-semibold">{booking.customer_email || customer?.email || "—"}</p>
              </div>
            </div>
          </Card>

          <Card className="space-y-3">
            <h2 className="text-base font-bold text-masaar-black">Passenger Roster (Passport Records)</h2>
            <div className="overflow-hidden rounded border border-black/10">
              <table className="min-w-full divide-y divide-black/10 text-left text-sm">
                <thead className="bg-admin-surface text-xs font-semibold uppercase tracking-wider text-masaar-black/60">
                  <tr>
                    <th className="px-4 py-2.5">Passenger Name</th>
                    <th className="px-4 py-2.5">Passport Number</th>
                    <th className="px-4 py-2.5">Nationality</th>
                    <th className="px-4 py-2.5">Date of Birth</th>
                    <th className="px-4 py-2.5">Expiry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {travellers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-masaar-black/50">
                        No passport details logged for this party yet. Add in Customer Profile or during flight ticketing.
                      </td>
                    </tr>
                  ) : (
                    travellers.map((t) => (
                      <tr key={t.id}>
                        <td className="px-4 py-2.5 font-semibold">{t.full_name}</td>
                        <td className="px-4 py-2.5 font-mono text-xs">{t.passport_number || "—"}</td>
                        <td className="px-4 py-2.5 text-xs">{t.nationality || "—"}</td>
                        <td className="px-4 py-2.5 text-xs">{t.date_of_birth || "—"}</td>
                        <td className="px-4 py-2.5 text-xs">{t.passport_expiry || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "arrangements" && (
        <Card className="space-y-4">
          <h2 className="text-base font-bold text-masaar-black">Hotels & Services Inclusions</h2>
          {booking.hotel_arrangements?.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-masaar-black/60">Hotel Accommodations</h3>
              {booking.hotel_arrangements.map((h: any, i: number) => (
                <div key={i} className="rounded border border-black/10 p-3 bg-admin-surface">
                  <p className="font-semibold text-sm">{h.description}</p>
                  <p className="text-xs text-masaar-black/70">{h.details}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-masaar-black/60">Hotel details linked from package snapshot: DoubleTree by Hilton Makkah & Worth Tharawat Hotel Madinah.</p>
          )}

          {booking.flight_arrangements?.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-black/10">
              <h3 className="text-xs font-bold uppercase tracking-wider text-masaar-black/60">Flight Arrangements</h3>
              {booking.flight_arrangements.map((f: any, i: number) => (
                <div key={i} className="rounded border border-black/10 p-3 bg-admin-surface">
                  <p className="font-semibold text-sm">{f.description}</p>
                  <p className="text-xs text-masaar-black/70">{f.details}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeTab === "financials" && (
        <div className="space-y-6">
          <Card className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-masaar-black">Invoices Issued</h2>
              <Link href={invoiceUrl}>
                <PrimaryButton>+ Create New Invoice</PrimaryButton>
              </Link>
            </div>
            {invoices.length === 0 ? (
              <p className="py-4 text-center text-sm text-masaar-black/50">No invoices issued for this booking yet.</p>
            ) : (
              <div className="divide-y divide-black/10">
                {invoices.map((inv) => (
                  <div key={inv.id} className="flex flex-wrap items-center justify-between py-2">
                    <div>
                      <span className="font-mono text-xs font-semibold text-pure-gold">{inv.document_number}</span>
                      <p className="text-xs text-masaar-black/60">Due: {inv.due_date || "—"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">AED {Number(inv.total_aed).toLocaleString()}</p>
                      <Badge tone={inv.status === "paid" ? "green" : inv.status === "partially_paid" ? "amber" : "gray"}>
                        <span className="capitalize">{inv.status}</span>
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-masaar-black">Recorded Payment Receipts</h2>
              <Link href={receiptUrl}>
                <SecondaryButton>Record Payment</SecondaryButton>
              </Link>
            </div>
            {receipts.length === 0 ? (
              <p className="py-4 text-center text-sm text-masaar-black/50">No payments recorded for this booking yet.</p>
            ) : (
              <div className="divide-y divide-black/10">
                {receipts.map((rc) => (
                  <div key={rc.id} className="flex flex-wrap items-center justify-between py-2">
                    <div>
                      <span className="font-mono text-xs font-semibold text-pure-gold">{rc.document_number}</span>
                      <p className="text-xs text-masaar-black/60">
                        Date: {rc.payment_date || rc.issue_date} • {rc.payment_method}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-700">AED {Number(rc.amount_paid_aed || rc.total_aed).toLocaleString()}</p>
                      <Link href={`/admin/documents/receipts/${rc.id}/pdf`} target="_blank" className="text-xs text-pure-gold hover:underline">
                        Receipt PDF
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === "vouchers" && (
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-masaar-black">Travel Vouchers</h2>
            <Link href={voucherUrl}>
              <PrimaryButton>+ Issue Voucher</PrimaryButton>
            </Link>
          </div>
          {vouchers.length === 0 ? (
            <p className="py-6 text-center text-sm text-masaar-black/50">No vouchers generated for this booking yet.</p>
          ) : (
            <div className="divide-y divide-black/10">
              {vouchers.map((v) => (
                <div key={v.id} className="flex flex-wrap items-center justify-between py-2">
                  <div>
                    <span className="font-mono text-xs font-semibold text-pure-gold">{v.document_number}</span>
                    <p className="text-sm font-semibold text-masaar-black">{v.destination || "Travel Voucher"}</p>
                  </div>
                  <div>
                    <Link
                      href={`/admin/documents/booking-vouchers/${v.id}/pdf`}
                      target="_blank"
                      className="rounded border border-black/15 px-3 py-1.5 text-xs font-semibold hover:bg-black/5"
                    >
                      Download PDF
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeTab === "costs" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-masaar-black">Supplier Cost Ledger & Profitability</h2>
            <PrimaryButton onClick={() => setShowCostForm(!showCostForm)}>
              {showCostForm ? "Close Form" : "+ Add Supplier Cost"}
            </PrimaryButton>
          </div>

          {showCostForm && (
            <Card className="border-pure-gold/30 bg-warm-ivory/20">
              <form onSubmit={handleAddCost} className="space-y-3">
                <Field label="Service / Supplier Description *" htmlFor="costDesc">
                  <input
                    id="costDesc"
                    required
                    value={costDescription}
                    onChange={(e) => setCostDescription(e.target.value)}
                    placeholder="e.g. DoubleTree Makkah 3N Contract Rate, Saudia DXB-JED flight"
                    className={inputClass}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Estimated Cost (AED)" htmlFor="estCost">
                    <input
                      id="estCost"
                      type="number"
                      value={estCost}
                      onChange={(e) => setEstCost(Number(e.target.value))}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Actual Cost (AED)" htmlFor="actCost">
                    <input
                      id="actCost"
                      type="number"
                      value={actCost}
                      onChange={(e) => setActCost(Number(e.target.value))}
                      className={inputClass}
                    />
                  </Field>
                </div>
                <div className="flex justify-end gap-2">
                  <SecondaryButton onClick={() => setShowCostForm(false)}>Cancel</SecondaryButton>
                  <PrimaryButton type="submit">Record Cost</PrimaryButton>
                </div>
              </form>
            </Card>
          )}

          <div className="overflow-hidden rounded border border-black/10 bg-white">
            <table className="min-w-full divide-y divide-black/10 text-left text-sm">
              <thead className="bg-admin-surface text-xs font-semibold uppercase tracking-wider text-masaar-black/60">
                <tr>
                  <th className="px-4 py-2.5">Service Description</th>
                  <th className="px-4 py-2.5">Estimated Cost</th>
                  <th className="px-4 py-2.5">Actual Cost</th>
                  <th className="px-4 py-2.5">Currency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {supplierCosts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-masaar-black/50">
                      No supplier costs itemized for this booking yet.
                    </td>
                  </tr>
                ) : (
                  supplierCosts.map((c) => (
                    <tr key={c.id}>
                      <td className="px-4 py-2.5 font-medium">{c.service_description}</td>
                      <td className="px-4 py-2.5 text-xs">AED {Number(c.estimated_cost).toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-xs font-semibold">AED {Number(c.actual_cost).toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-xs">{c.currency}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
