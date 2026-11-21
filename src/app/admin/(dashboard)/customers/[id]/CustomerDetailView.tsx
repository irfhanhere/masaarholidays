"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge, Card, Field, PrimaryButton, SecondaryButton, StatCard, inputClass } from "@/components/admin/ui";
import type { CustomerHistory } from "@/lib/data/customers";
import { addTravellerAction } from "../actions";

export function CustomerDetailView({ history }: { history: CustomerHistory }) {
  const { customer, travellers, quotations, bookings, invoices, receipts, vouchers, totalInvoiced, totalPaid, outstandingBalance } = history;
  const [activeTab, setActiveTab] = useState<"overview" | "travellers" | "quotations" | "bookings" | "financials" | "vouchers">("overview");

  // Add traveller modal / form state
  const [showAddTraveller, setShowAddTraveller] = useState(false);
  const [travellerError, setTravellerError] = useState<string | null>(null);
  const [isAddingTraveller, setIsAddingTraveller] = useState(false);

  async function handleAddTraveller(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsAddingTraveller(true);
    setTravellerError(null);

    const formData = new FormData(e.currentTarget);
    const res = await addTravellerAction(customer.id, formData);

    if (!res.success) {
      setTravellerError(res.error || "Failed to add traveller");
      setIsAddingTraveller(false);
      return;
    }

    setShowAddTraveller(false);
    setIsAddingTraveller(false);
    window.location.reload();
  }

  const quoteUrl = `/admin/quotations/new?customerId=${customer.id}&clientName=${encodeURIComponent(customer.full_name)}&clientPhone=${encodeURIComponent(customer.phone)}&clientEmail=${encodeURIComponent(customer.email || "")}`;

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-black/10 bg-white p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-bold text-pure-gold">{customer.customer_number}</span>
            <Badge tone={customer.customer_type === "vip" ? "gold" : customer.customer_type === "corporate" ? "blue" : "gray"}>
              <span className="capitalize">{customer.customer_type}</span>
            </Badge>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-masaar-black">{customer.full_name}</h1>
          <p className="text-xs text-masaar-black/60">
            {customer.phone} {customer.email ? `• ${customer.email}` : ""} • {customer.country || "UAE"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href={quoteUrl}>
            <PrimaryButton>
              <span>+ Create Quotation</span>
            </PrimaryButton>
          </Link>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Invoiced" value={`AED ${totalInvoiced.toLocaleString()}`} />
        <StatCard label="Total Paid" value={`AED ${totalPaid.toLocaleString()}`} />
        <StatCard
          label="Outstanding Balance"
          value={`AED ${outstandingBalance.toLocaleString()}`}
        />
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-black/10 bg-white px-4">
        {[
          { id: "overview", label: "Overview" },
          { id: "travellers", label: `Travellers (${travellers.length})` },
          { id: "quotations", label: `Quotations (${quotations.length})` },
          { id: "bookings", label: `Bookings (${bookings.length})` },
          { id: "financials", label: `Invoices & Receipts (${invoices.length + receipts.length})` },
          { id: "vouchers", label: `Vouchers (${vouchers.length})` },
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

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card className="space-y-4">
            <h2 className="text-base font-bold text-masaar-black">Contact & Personal Details</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1 border-b border-black/5">
                <span className="text-masaar-black/60">Full Name</span>
                <span className="font-semibold">{customer.full_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-black/5">
                <span className="text-masaar-black/60">Phone</span>
                <span className="font-medium">{customer.phone}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-black/5">
                <span className="text-masaar-black/60">WhatsApp</span>
                <span className="font-medium">{customer.whatsapp || customer.phone}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-black/5">
                <span className="text-masaar-black/60">Email</span>
                <span className="font-medium">{customer.email || "—"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-black/5">
                <span className="text-masaar-black/60">Country</span>
                <span className="font-medium">{customer.country || "United Arab Emirates"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-black/5">
                <span className="text-masaar-black/60">Nationality</span>
                <span className="font-medium">{customer.nationality || "—"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-black/5">
                <span className="text-masaar-black/60">Address</span>
                <span className="font-medium">{customer.address || "—"}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-masaar-black/60">Source</span>
                <span className="font-medium capitalize">{customer.customer_source}</span>
              </div>
            </div>
          </Card>

          <Card className="space-y-4">
            <h2 className="text-base font-bold text-masaar-black">Operations & Notes</h2>
            {customer.internal_notes ? (
              <div className="rounded bg-admin-surface p-3 text-sm text-masaar-black">
                {customer.internal_notes}
              </div>
            ) : (
              <p className="text-sm text-masaar-black/50">No internal notes added yet.</p>
            )}

            <div className="pt-4 border-t border-black/10">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-masaar-black/60 mb-2">
                Quick Activity Summary
              </h3>
              <p className="text-xs text-masaar-black/70">
                Created: {new Date(customer.created_at).toLocaleDateString()}
              </p>
              <p className="text-xs text-masaar-black/70 mt-1">
                Total Quotations Issued: {quotations.length}
              </p>
              <p className="text-xs text-masaar-black/70 mt-1">
                Total Confirmed Bookings: {bookings.length}
              </p>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "travellers" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-masaar-black">Registered Travellers</h2>
            <PrimaryButton onClick={() => setShowAddTraveller(!showAddTraveller)}>
              {showAddTraveller ? "Close Form" : "+ Add Traveller (Passport)"}
            </PrimaryButton>
          </div>

          {showAddTraveller && (
            <Card className="border-pure-gold/40 bg-warm-ivory/20">
              <h3 className="text-sm font-bold text-masaar-black mb-3">Add Traveller (Passport Details)</h3>
              {travellerError && <p className="mb-3 text-xs text-red-600">{travellerError}</p>}
              <form onSubmit={handleAddTraveller} className="space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Field label="Full Name (as per Passport) *" htmlFor="fullName">
                    <input id="fullName" name="fullName" required placeholder="Passport Full Name" className={inputClass} />
                  </Field>
                  <Field label="Date of Birth" htmlFor="dateOfBirth">
                    <input id="dateOfBirth" name="dateOfBirth" type="date" className={inputClass} />
                  </Field>
                  <Field label="Nationality" htmlFor="nationality">
                    <input id="nationality" name="nationality" placeholder="e.g. United Arab Emirates" className={inputClass} />
                  </Field>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Field label="Passport Number" htmlFor="passportNumber">
                    <input id="passportNumber" name="passportNumber" placeholder="e.g. N1234567" className={inputClass} />
                  </Field>
                  <Field label="Passport Expiry Date" htmlFor="passportExpiry">
                    <input id="passportExpiry" name="passportExpiry" type="date" className={inputClass} />
                  </Field>
                  <Field label="Gender" htmlFor="gender">
                    <select id="gender" name="gender" defaultValue="" className={inputClass}>
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </Field>
                </div>
                <Field label="Traveller Notes" htmlFor="notes">
                  <input id="notes" name="notes" placeholder="Dietary restrictions, wheelchair assistance, etc." className={inputClass} />
                </Field>
                <div className="flex justify-end gap-2">
                  <SecondaryButton onClick={() => setShowAddTraveller(false)}>Cancel</SecondaryButton>
                  <PrimaryButton type="submit" disabled={isAddingTraveller}>
                    {isAddingTraveller ? "Saving..." : "Save Traveller"}
                  </PrimaryButton>
                </div>
              </form>
            </Card>
          )}

          <div className="overflow-hidden rounded-lg border border-black/10 bg-white">
            <table className="min-w-full divide-y divide-black/10 text-left text-sm">
              <thead className="bg-admin-surface text-xs font-semibold uppercase tracking-wider text-masaar-black/60">
                <tr>
                  <th className="px-4 py-3">Traveller Name</th>
                  <th className="px-4 py-3">Passport Number</th>
                  <th className="px-4 py-3">Nationality</th>
                  <th className="px-4 py-3">Date of Birth</th>
                  <th className="px-4 py-3">Passport Expiry</th>
                  <th className="px-4 py-3">Gender</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {travellers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-masaar-black/50">
                      No travellers added for this customer yet. Passport details can be added during booking confirmation.
                    </td>
                  </tr>
                ) : (
                  travellers.map((t) => (
                    <tr key={t.id} className="hover:bg-black/[0.02]">
                      <td className="px-4 py-3 font-semibold">{t.full_name}</td>
                      <td className="px-4 py-3 font-mono text-xs">{t.passport_number || "—"}</td>
                      <td className="px-4 py-3 text-xs">{t.nationality || "—"}</td>
                      <td className="px-4 py-3 text-xs">{t.date_of_birth || "—"}</td>
                      <td className="px-4 py-3 text-xs">{t.passport_expiry || "—"}</td>
                      <td className="px-4 py-3 text-xs capitalize">{t.gender || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "quotations" && (
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-masaar-black">Quotations History</h2>
            <Link href={quoteUrl}>
              <PrimaryButton>+ New Quotation</PrimaryButton>
            </Link>
          </div>
          {quotations.length === 0 ? (
            <p className="py-6 text-center text-sm text-masaar-black/50">No quotations found for this customer.</p>
          ) : (
            <div className="divide-y divide-black/10">
              {quotations.map((q) => (
                <div key={q.id} className="flex flex-wrap items-center justify-between py-3">
                  <div>
                    <span className="font-mono text-xs font-semibold text-pure-gold">{q.document_number}</span>
                    <p className="text-sm font-semibold text-masaar-black">{q.destination || "Umrah Journey"}</p>
                    <p className="text-xs text-masaar-black/60">
                      Travel Date: {q.travel_date || "TBD"} • Status: <span className="capitalize">{q.status}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-masaar-black">AED {Number(q.total_aed).toLocaleString()}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Link
                        href={`/admin/documents/quotations/${q.id}`}
                        className="rounded border border-black/15 px-2 py-1 text-xs hover:bg-black/5"
                      >
                        Edit / View
                      </Link>
                      <Link
                        href={`/admin/documents/quotations/${q.id}/pdf`}
                        target="_blank"
                        className="rounded bg-black/5 px-2 py-1 text-xs font-medium hover:bg-black/10"
                      >
                        PDF
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeTab === "bookings" && (
        <Card className="space-y-3">
          <h2 className="text-base font-bold text-masaar-black">Confirmed Bookings</h2>
          {bookings.length === 0 ? (
            <p className="py-6 text-center text-sm text-masaar-black/50">No bookings recorded for this customer yet.</p>
          ) : (
            <div className="divide-y divide-black/10">
              {bookings.map((b) => (
                <div key={b.id} className="flex flex-wrap items-center justify-between py-3">
                  <div>
                    <span className="font-mono text-xs font-semibold text-pure-gold">{b.booking_reference}</span>
                    <p className="text-sm font-semibold text-masaar-black">{b.package_name}</p>
                    <p className="text-xs text-masaar-black/60">
                      Dates: {b.travel_date || "—"} to {b.return_date || "—"} • Travellers: {b.total_travellers}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-masaar-black">AED {Number(b.total_amount).toLocaleString()}</p>
                    <div className="mt-1 flex items-center justify-end gap-2">
                      <Badge tone={b.payment_status === "paid" ? "green" : b.payment_status === "partially_paid" ? "amber" : "gray"}>
                        <span className="capitalize">{b.payment_status}</span>
                      </Badge>
                      <Link
                        href={`/admin/bookings/${b.id}`}
                        className="rounded border border-black/15 px-2 py-1 text-xs font-semibold hover:bg-black/5"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeTab === "financials" && (
        <div className="space-y-6">
          <Card className="space-y-3">
            <h2 className="text-base font-bold text-masaar-black">Invoices</h2>
            {invoices.length === 0 ? (
              <p className="py-4 text-center text-sm text-masaar-black/50">No invoices issued for this customer.</p>
            ) : (
              <div className="divide-y divide-black/10">
                {invoices.map((inv) => (
                  <div key={inv.id} className="flex flex-wrap items-center justify-between py-2">
                    <div>
                      <span className="font-mono text-xs font-semibold text-pure-gold">{inv.document_number}</span>
                      <p className="text-xs text-masaar-black/60">Date: {inv.issue_date || inv.created_at?.split("T")[0]}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">AED {Number(inv.total_aed).toLocaleString()}</p>
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
            <h2 className="text-base font-bold text-masaar-black">Payment Receipts</h2>
            {receipts.length === 0 ? (
              <p className="py-4 text-center text-sm text-masaar-black/50">No payment receipts issued for this customer.</p>
            ) : (
              <div className="divide-y divide-black/10">
                {receipts.map((rc) => (
                  <div key={rc.id} className="flex flex-wrap items-center justify-between py-2">
                    <div>
                      <span className="font-mono text-xs font-semibold text-pure-gold">{rc.document_number}</span>
                      <p className="text-xs text-masaar-black/60">
                        Date: {rc.payment_date || rc.issue_date} • Method: {rc.payment_method || "Bank Transfer"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-700">AED {Number(rc.amount_paid_aed || rc.total_aed).toLocaleString()}</p>
                      <Link href={`/admin/documents/receipts/${rc.id}/pdf`} target="_blank" className="text-xs text-pure-gold hover:underline">
                        View PDF
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
          <h2 className="text-base font-bold text-masaar-black">Travel & Service Vouchers</h2>
          {vouchers.length === 0 ? (
            <p className="py-6 text-center text-sm text-masaar-black/50">No travel vouchers issued for this customer.</p>
          ) : (
            <div className="divide-y divide-black/10">
              {vouchers.map((v) => (
                <div key={v.id} className="flex flex-wrap items-center justify-between py-2">
                  <div>
                    <span className="font-mono text-xs font-semibold text-pure-gold">{v.document_number}</span>
                    <p className="text-sm font-semibold text-masaar-black">{v.destination || "Travel Voucher"}</p>
                    <p className="text-xs text-masaar-black/60">Travel Date: {v.travel_date || "—"}</p>
                  </div>
                  <div className="text-right">
                    <Link
                      href={`/admin/documents/booking-vouchers/${v.id}/pdf`}
                      target="_blank"
                      className="rounded border border-black/15 px-3 py-1.5 text-xs font-semibold hover:bg-black/5"
                    >
                      Download Voucher PDF
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
