"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Card, PrimaryButton, SecondaryButton, GoldButton, Badge, Field, inputClass } from "@/components/admin/ui";
import { BookingConfirmationDocumentView } from "@/components/documents/BookingConfirmationDocumentView";
import { GranularVoucherDocumentView, type HotelVoucherData, type TransferVoucherData } from "@/components/documents/GranularVoucherDocumentView";
import { AddItemCard, LineItemRow, money, type LineItemProducts } from "@/components/documents/LineItemsEditor";
import {
  addLineItem,
  deleteDocument,
  deleteLineItem,
  duplicateDocument,
  saveDocumentVersion,
  updateDocumentBasics,
  updateDocumentStatus,
  updateLineItem,
  type LineItemInput,
} from "../../actions";
import type {
  DocumentItemRow,
  DocumentRow,
  DocumentShareRow,
  DocumentTemplateRow,
  DocumentVersionRow,
  BOOKING_VOUCHER_STATUSES,
} from "@/lib/types/database";

const STATUS_LABELS: Record<(typeof BOOKING_VOUCHER_STATUSES)[number] | "confirmed", string> = {
  draft: "Draft",
  confirmed: "Confirmed",
  issued: "Issued",
  sent: "Sent",
  cancelled: "Cancelled",
};

function statusTone(status: string): "green" | "gold" | "gray" | "blue" {
  if (status === "confirmed" || status === "issued") return "green";
  if (status === "sent") return "gold";
  if (status === "cancelled") return "gray";
  return "blue";
}

export function BookingVoucherBuilder({
  document,
  items,
  template,
  versions,
  shares,
  products,
  related,
  initialTab = "confirmation",
}: {
  document: DocumentRow;
  items: DocumentItemRow[];
  template: DocumentTemplateRow | null;
  versions: DocumentVersionRow[];
  shares: DocumentShareRow[];
  products: LineItemProducts;
  related: {
    quotation: DocumentRow | null;
    invoice: DocumentRow | null;
    receipts: DocumentRow[];
  };
  initialTab?: "confirmation" | "vouchers" | "edit";
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"confirmation" | "vouchers" | "edit">(initialTab);
  const [voucherType, setVoucherType] = useState<"hotel" | "transfer">("hotel");
  const [isPending, startTransition] = useTransition();
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  // Edit Tab state
  const [clientName, setClientName] = useState(document.client_name);
  const [clientPhone, setClientPhone] = useState(document.client_phone ?? "");
  const [clientEmail, setClientEmail] = useState(document.client_email ?? "");
  const [clientCountry, setClientCountry] = useState(document.client_country ?? "");
  const [travelDate, setTravelDate] = useState(document.travel_date ?? "");
  const [returnDate, setReturnDate] = useState(document.return_date ?? "");
  const [adults, setAdults] = useState(document.adults ?? 2);
  const [childrenCount, setChildrenCount] = useState(document.children ?? 0);
  const [infantsCount, setInfantsCount] = useState(document.infants ?? 0);
  const [destination, setDestination] = useState(document.destination ?? "Makkah & Madinah");
  const [bookingReference, setBookingReference] = useState(document.booking_reference ?? "");
  const [specialRequirements, setSpecialRequirements] = useState(document.special_requirements ?? "");
  const [notes, setNotes] = useState(document.notes ?? "");

  // Find first hotel and transfer for granular voucher defaults
  const firstHotel = items.find((i) => i.item_type === "hotel");
  const firstTransfer = items.find((i) => i.item_type === "transfer");

  // Granular Hotel Voucher state
  const [hotelVoucher, setHotelVoucher] = useState<HotelVoucherData>({
    bookingReference: document.booking_reference || `MH-BKG-${document.document_number.replace(/^BV-/, "")}`,
    guestName: document.client_name,
    hotel: firstHotel?.description || "Swissôtel Makkah",
    city: firstHotel?.description.toLowerCase().includes("madinah") ? "Madinah" : "Makkah",
    checkInDate: document.travel_date || "2026-10-15",
    checkOutDate: document.return_date || "2026-10-20",
    roomType: firstHotel?.details || "Twin Sharing",
    noOfGuests: `${document.adults ?? 2} Adults${document.children ? `, ${document.children} Children` : ""}`,
    confirmationNo: "HOT-" + Math.floor(100000 + Math.random() * 900000),
    hotelImageUrl: "/hotels/swissotel-makkah/swissotel-makkah.webp",
    specialRequests: document.special_requirements || "High floor room preferred. Early check-in subject to availability.",
    voucherNotes: "Please present this voucher at the hotel reception. For any assistance, contact Masaar Holidays.",
  });

  // Granular Transfer Voucher state
  const [transferVoucher, setTransferVoucher] = useState<TransferVoucherData>({
    bookingReference: document.booking_reference || `MH-BKG-${document.document_number.replace(/^BV-/, "")}`,
    guestName: document.client_name,
    vehicleType: firstTransfer?.description || "GMC Yukon / Suburban",
    route: firstTransfer?.details || "Airport – Makkah – Madinah – Airport",
    pickupDateTime: document.travel_date ? `${document.travel_date} 14:00` : "On arrival as per flight schedule",
    dropOffLocation: "Hotel Reception",
    flightNo: "EK-803",
    driverContact: "+966 50 123 4567 (Masaar Transport Desk)",
    confirmationNo: "TRF-" + Math.floor(100000 + Math.random() * 900000),
    vehicleImageUrl: "/vehicles/gmc-yukon-suburban.jpg",
    specialRequests: "VIP private chauffeur, meet & assist on arrival.",
    voucherNotes: "Please present this voucher to your chauffeur. For assistance, call the 24/7 Masaar operations desk.",
  });

  function runRedirectable(fn: () => Promise<void>) {
    startTransition(async () => {
      try {
        await fn();
      } catch (e) {
        if (e && typeof e === "object" && "digest" in e && typeof e.digest === "string" && e.digest.startsWith("NEXT_REDIRECT")) {
          throw e;
        }
        alert(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  }

  function handleSaveBasics() {
    runRedirectable(async () => {
      await updateDocumentBasics(document.id, "booking_voucher", {
        client_name: clientName,
        client_phone: clientPhone || null,
        client_email: clientEmail || null,
        client_country: clientCountry || null,
        travel_date: travelDate || null,
        return_date: returnDate || null,
        adults: adults,
        children: childrenCount,
        infants: infantsCount,
        destination: destination || null,
        booking_reference: bookingReference || null,
        special_requirements: specialRequirements || null,
        notes: notes || null,
      });
      setSavedMessage("Saved booking details.");
      setTimeout(() => setSavedMessage(null), 2500);
      router.refresh();
    });
  }

  function handleStatusChange(status: string) {
    runRedirectable(async () => {
      await updateDocumentStatus(document.id, "booking_voucher", status);
      router.refresh();
    });
  }

  function handleDuplicate() {
    runRedirectable(async () => {
      const res = await duplicateDocument(document.id, "booking_voucher");
      if (res.success && res.id) {
        router.push(`/admin/documents/booking-vouchers/${res.id}`);
      } else {
        alert(res.error || "Failed to duplicate booking voucher");
      }
    });
  }

  function handleDelete() {
    if (!confirm(`Delete booking voucher ${document.document_number}? This cannot be undone.`)) return;
    runRedirectable(async () => {
      const res = await deleteDocument(document.id, "booking_voucher");
      if (res.success) {
        router.push("/admin/documents/booking-vouchers");
      } else {
        alert(res.error || "Failed to delete booking voucher");
      }
    });
  }

  function handleSaveVersion() {
    runRedirectable(async () => {
      await saveDocumentVersion(document.id, "booking_voucher");
      setSavedMessage("Version saved successfully.");
      setTimeout(() => setSavedMessage(null), 2500);
      router.refresh();
    });
  }

  const invoiceAmount = related.invoice ? related.invoice.total_aed : document.total_aed;
  const amountPaid = related.invoice ? related.invoice.amount_paid_aed : document.amount_paid_aed;
  const balance = Math.max(0, invoiceAmount - amountPaid);

  return (
    <div>
      {/* ── TOP HEADER / BREADCRUMB BAR ── */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-xs text-masaar-black/50">
            <Link href="/admin">Dashboard</Link> ›{" "}
            <Link href="/admin/documents">Documents</Link> ›{" "}
            <Link href="/admin/documents/booking-vouchers">Booking Vouchers</Link> ›{" "}
            {document.booking_reference || document.document_number}
          </p>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-masaar-black">
              {document.booking_reference || document.document_number}
            </h1>
            <Badge tone={statusTone(document.status)}>
              {STATUS_LABELS[document.status as keyof typeof STATUS_LABELS] ?? document.status}
            </Badge>
            <span className="text-xs text-masaar-black/50 font-mono">({document.document_number})</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={document.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="rounded-md border border-black/15 bg-white px-3 py-2 text-sm focus:border-admin-primary focus:outline-none"
            disabled={isPending}
          >
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <SecondaryButton onClick={handleDuplicate} disabled={isPending}>
            Duplicate
          </SecondaryButton>

          <Link href={`/admin/documents/booking-vouchers/${document.id}/send`}>
            <SecondaryButton type="button">Send</SecondaryButton>
          </Link>

          <Link href={`/admin/documents/booking-vouchers/${document.id}/pdf`}>
            <GoldButton type="button">Generate PDF</GoldButton>
          </Link>

          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            Delete
          </button>
        </div>
      </div>

      {/* ── TABS NAVIGATION (CONFIRMATION / GRANULAR VOUCHERS / EDIT ITEMS) ── */}
      <div className="mb-6 flex border-b border-black/10 bg-white rounded-t-xl px-4">
        <button
          type="button"
          onClick={() => setActiveTab("confirmation")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3.5 text-sm font-semibold transition-colors ${
            activeTab === "confirmation"
              ? "border-admin-primary text-admin-primary"
              : "border-transparent text-masaar-black/60 hover:text-masaar-black"
          }`}
        >
          <span>📄</span>
          <span>Booking Confirmation</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("vouchers")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3.5 text-sm font-semibold transition-colors ${
            activeTab === "vouchers"
              ? "border-deep-gold text-deep-gold"
              : "border-transparent text-masaar-black/60 hover:text-masaar-black"
          }`}
        >
          <span>🏨</span>
          <span>Generate Vouchers (Hotel &amp; Transfer)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("edit")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3.5 text-sm font-semibold transition-colors ${
            activeTab === "edit"
              ? "border-admin-primary text-admin-primary"
              : "border-transparent text-masaar-black/60 hover:text-masaar-black"
          }`}
        >
          <span>✏️</span>
          <span>Edit Details &amp; Items</span>
        </button>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 1: BOOKING CONFIRMATION                                    */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === "confirmation" && (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Main Document Preview (Left) */}
          <div className="lg:col-span-8">
            <div className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm">
              <div className="border-b border-black/10 bg-[#FAF8F5] px-6 py-3 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-masaar-black/70">
                  Official Confirmation Document
                </span>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="text-xs font-semibold text-admin-primary hover:underline flex items-center gap-1"
                >
                  <span>🖨️</span> Print
                </button>
              </div>
              <div className="p-2 sm:p-6 bg-stone-100">
                <BookingConfirmationDocumentView
                  document={document}
                  items={items}
                  template={template}
                />
              </div>
            </div>
          </div>

          {/* Right Sidebar (Matching BOOKING CONFIRMATION.png) */}
          <div className="space-y-6 lg:col-span-4">
            {/* 1. Booking Status */}
            <Card>
              <h2 className="mb-4 font-semibold text-masaar-black">Booking Status</h2>
              <div className="mb-5 flex items-center gap-3 rounded-xl bg-emerald-50 p-4 border border-emerald-200">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white font-bold">
                  ✓
                </div>
                <div>
                  <p className="text-sm font-bold uppercase tracking-wider text-emerald-900">
                    {document.status === "cancelled" ? "Cancelled" : "Confirmed"}
                  </p>
                  <p className="text-xs text-emerald-700">
                    {document.status === "cancelled"
                      ? "Booking has been cancelled."
                      : "Booking is confirmed. All services are being arranged."}
                  </p>
                </div>
              </div>

              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between border-b border-black/5 pb-2">
                  <dt className="text-xs uppercase tracking-wide text-masaar-black/50">Booking Ref</dt>
                  <dd className="font-mono font-bold text-masaar-black">
                    {document.booking_reference || `MH-BKG-${document.document_number.replace(/^BV-/, "")}`}
                  </dd>
                </div>

                {related.quotation && (
                  <div className="flex items-center justify-between border-b border-black/5 pb-2">
                    <dt className="text-xs uppercase tracking-wide text-masaar-black/50">Quotation Ref</dt>
                    <dd>
                      <Link
                        href={`/admin/documents/quotations/${related.quotation.id}`}
                        className="font-medium text-admin-primary hover:underline text-xs"
                      >
                        {related.quotation.document_number} →
                      </Link>
                    </dd>
                  </div>
                )}

                {related.invoice && (
                  <div className="flex items-center justify-between border-b border-black/5 pb-2">
                    <dt className="text-xs uppercase tracking-wide text-masaar-black/50">Invoice Ref</dt>
                    <dd>
                      <Link
                        href={`/admin/documents/invoices/${related.invoice.id}`}
                        className="font-medium text-admin-primary hover:underline text-xs"
                      >
                        {related.invoice.document_number} →
                      </Link>
                    </dd>
                  </div>
                )}

                <div className="flex items-center justify-between border-b border-black/5 pb-2">
                  <dt className="text-xs uppercase tracking-wide text-masaar-black/50">Amount Paid</dt>
                  <dd className="font-semibold text-emerald-700">AED {money(amountPaid)}</dd>
                </div>

                <div className="flex items-center justify-between border-b border-black/5 pb-2">
                  <dt className="text-xs uppercase tracking-wide text-masaar-black/50">Total Amount</dt>
                  <dd className="font-bold text-masaar-black">AED {money(invoiceAmount)}</dd>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <dt className="text-xs uppercase tracking-wide text-masaar-black/50">Balance</dt>
                  <dd className="font-bold text-deep-gold">AED {money(balance)}</dd>
                </div>
              </dl>
            </Card>

            {/* 2. Actions */}
            <Card>
              <h2 className="mb-4 font-semibold text-masaar-black">Actions</h2>
              <div className="space-y-2.5">
                <Link href={`/admin/documents/booking-vouchers/${document.id}/pdf`} className="block">
                  <GoldButton className="w-full justify-center">
                    <span>📄</span> Download Confirmation PDF
                  </GoldButton>
                </Link>

                <Link href={`/admin/documents/booking-vouchers/${document.id}/send`} className="block">
                  <SecondaryButton className="w-full justify-center">
                    <span>✉️</span> Send via Email
                  </SecondaryButton>
                </Link>

                <Link href={`/admin/documents/booking-vouchers/${document.id}/send?tab=whatsapp`} className="block">
                  <SecondaryButton className="w-full justify-center">
                    <span>💬</span> Send via WhatsApp
                  </SecondaryButton>
                </Link>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="w-full rounded-md border border-black/15 bg-white px-4 py-2.5 text-sm font-semibold text-masaar-black hover:bg-black/5 flex items-center justify-center gap-2"
                >
                  <span>🖨️</span> Print Confirmation
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("vouchers")}
                  className="w-full rounded-md border border-deep-gold/40 bg-warm-ivory px-4 py-2.5 text-sm font-semibold text-deep-gold hover:bg-pure-gold/10 flex items-center justify-center gap-2"
                >
                  <span>🏨</span> Generate Hotel / Transfer Vouchers →
                </button>
              </div>
            </Card>

            {/* 3. Related Documents */}
            <Card>
              <h2 className="mb-3 font-semibold text-masaar-black">Related Documents</h2>
              <ul className="space-y-2 text-sm">
                {related.quotation && (
                  <li>
                    <Link
                      href={`/admin/documents/quotations/${related.quotation.id}`}
                      className="flex items-center justify-between text-admin-primary hover:underline text-xs"
                    >
                      <span className="flex items-center gap-2">
                        <span>📜</span> View Quotation ({related.quotation.document_number})
                      </span>
                      <span>→</span>
                    </Link>
                  </li>
                )}

                {related.invoice && (
                  <li>
                    <Link
                      href={`/admin/documents/invoices/${related.invoice.id}`}
                      className="flex items-center justify-between text-admin-primary hover:underline text-xs"
                    >
                      <span className="flex items-center gap-2">
                        <span>🧾</span> View Invoice ({related.invoice.document_number})
                      </span>
                      <span>→</span>
                    </Link>
                  </li>
                )}

                {related.receipts.length > 0 && (
                  <li>
                    <Link
                      href={`/admin/documents/receipts/${related.receipts[0].id}`}
                      className="flex items-center justify-between text-admin-primary hover:underline text-xs"
                    >
                      <span className="flex items-center gap-2">
                        <span>💳</span> View Receipt ({related.receipts[0].document_number})
                      </span>
                      <span>→</span>
                    </Link>
                  </li>
                )}

                <li>
                  <Link
                    href="/admin/documents"
                    className="flex items-center justify-between text-masaar-black/70 hover:underline text-xs pt-1 border-t border-black/5"
                  >
                    <span>📁 All Documents</span>
                    <span>→</span>
                  </Link>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 2: GENERATE GRANULAR VOUCHERS (HOTEL & TRANSFER)          */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === "vouchers" && (
        <div className="space-y-6">
          {/* Header row */}
          <div>
            <h2 className="text-xl font-bold text-masaar-black">Generate Voucher</h2>
            <p className="text-sm text-masaar-black/60">
              Create hotel or transfer vouchers for this booking. These can be shared with clients, hotels and drivers.
            </p>
          </div>

          {/* Sub-tabs [Hotel Voucher] | [Transfer Voucher] */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setVoucherType("hotel")}
              className={`flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all ${
                voucherType === "hotel"
                  ? "bg-masaar-black text-white shadow-md"
                  : "bg-white border border-black/15 text-masaar-black/70 hover:bg-black/5"
              }`}
            >
              <span>🏨</span> Hotel Voucher
            </button>
            <button
              type="button"
              onClick={() => setVoucherType("transfer")}
              className={`flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all ${
                voucherType === "transfer"
                  ? "bg-masaar-black text-white shadow-md"
                  : "bg-white border border-black/15 text-masaar-black/70 hover:bg-black/5"
              }`}
            >
              <span>🚐</span> Transfer Voucher
            </button>
          </div>

          <div className="grid gap-6 lg:grid-cols-12">
            {/* Form Column (Left, matching inspiration) */}
            <div className="lg:col-span-6">
              <Card>
                <div className="flex items-center gap-2 mb-4 font-semibold text-masaar-black">
                  <span>{voucherType === "hotel" ? "🏨" : "🚐"}</span>
                  <h2>{voucherType === "hotel" ? "Hotel Voucher Details" : "Transfer Voucher Details"}</h2>
                </div>

                {voucherType === "hotel" ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Booking Reference">
                        <input
                          className={inputClass}
                          value={hotelVoucher.bookingReference}
                          onChange={(e) => setHotelVoucher({ ...hotelVoucher, bookingReference: e.target.value })}
                        />
                      </Field>
                      <Field label="Guest Name" required>
                        <input
                          className={inputClass}
                          value={hotelVoucher.guestName}
                          onChange={(e) => setHotelVoucher({ ...hotelVoucher, guestName: e.target.value })}
                        />
                      </Field>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Hotel" required>
                        <input
                          className={inputClass}
                          value={hotelVoucher.hotel}
                          onChange={(e) => setHotelVoucher({ ...hotelVoucher, hotel: e.target.value })}
                          placeholder="e.g. Swissôtel Makkah"
                        />
                      </Field>
                      <Field label="City">
                        <select
                          className={inputClass}
                          value={hotelVoucher.city}
                          onChange={(e) => setHotelVoucher({ ...hotelVoucher, city: e.target.value })}
                        >
                          <option value="Makkah">Makkah</option>
                          <option value="Madinah">Madinah</option>
                          <option value="Jeddah">Jeddah</option>
                        </select>
                      </Field>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Check-in Date" required>
                        <input
                          type="date"
                          className={inputClass}
                          value={hotelVoucher.checkInDate}
                          onChange={(e) => setHotelVoucher({ ...hotelVoucher, checkInDate: e.target.value })}
                        />
                      </Field>
                      <Field label="Check-out Date" required>
                        <input
                          type="date"
                          className={inputClass}
                          value={hotelVoucher.checkOutDate}
                          onChange={(e) => setHotelVoucher({ ...hotelVoucher, checkOutDate: e.target.value })}
                        />
                      </Field>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <Field label="Room Type">
                        <select
                          className={inputClass}
                          value={hotelVoucher.roomType}
                          onChange={(e) => setHotelVoucher({ ...hotelVoucher, roomType: e.target.value })}
                        >
                          <option value="Twin Sharing">Twin Sharing</option>
                          <option value="Double Room">Double Room</option>
                          <option value="Triple Room">Triple Room</option>
                          <option value="Quad Room">Quad Room</option>
                          <option value="Junior Suite">Junior Suite</option>
                          <option value="Executive Suite">Executive Suite</option>
                        </select>
                      </Field>
                      <Field label="No. of Guests">
                        <input
                          className={inputClass}
                          value={hotelVoucher.noOfGuests}
                          onChange={(e) => setHotelVoucher({ ...hotelVoucher, noOfGuests: e.target.value })}
                        />
                      </Field>
                      <Field label="Confirmation No.">
                        <input
                          className={inputClass}
                          value={hotelVoucher.confirmationNo}
                          onChange={(e) => setHotelVoucher({ ...hotelVoucher, confirmationNo: e.target.value })}
                        />
                      </Field>
                    </div>

                    <Field label="Special Requests (Optional)">
                      <textarea
                        rows={2}
                        className={inputClass}
                        value={hotelVoucher.specialRequests || ""}
                        onChange={(e) => setHotelVoucher({ ...hotelVoucher, specialRequests: e.target.value })}
                        placeholder="e.g. High floor room preferred. Early check-in subject to availability."
                      />
                    </Field>

                    <Field label="Voucher Notes (Optional)">
                      <textarea
                        rows={2}
                        className={inputClass}
                        value={hotelVoucher.voucherNotes || ""}
                        onChange={(e) => setHotelVoucher({ ...hotelVoucher, voucherNotes: e.target.value })}
                      />
                    </Field>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Booking Reference">
                        <input
                          className={inputClass}
                          value={transferVoucher.bookingReference}
                          onChange={(e) => setTransferVoucher({ ...transferVoucher, bookingReference: e.target.value })}
                        />
                      </Field>
                      <Field label="Guest Name" required>
                        <input
                          className={inputClass}
                          value={transferVoucher.guestName}
                          onChange={(e) => setTransferVoucher({ ...transferVoucher, guestName: e.target.value })}
                        />
                      </Field>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Vehicle Type" required>
                        <select
                          className={inputClass}
                          value={transferVoucher.vehicleType}
                          onChange={(e) => setTransferVoucher({ ...transferVoucher, vehicleType: e.target.value })}
                        >
                          <option value="GMC Yukon / Suburban">GMC Yukon / Suburban (VIP)</option>
                          <option value="Hyundai Staria">Hyundai Staria (7 Seats)</option>
                          <option value="Toyota HiAce">Toyota HiAce (10-12 Seats)</option>
                          <option value="Toyota Coaster">Toyota Coaster (18-22 Seats)</option>
                          <option value="Luxury Sedan">Luxury Sedan (Camry / Lexus)</option>
                        </select>
                      </Field>
                      <Field label="Confirmation No.">
                        <input
                          className={inputClass}
                          value={transferVoucher.confirmationNo}
                          onChange={(e) => setTransferVoucher({ ...transferVoucher, confirmationNo: e.target.value })}
                        />
                      </Field>
                    </div>

                    <Field label="Route / Transfer Path" required>
                      <input
                        className={inputClass}
                        value={transferVoucher.route}
                        onChange={(e) => setTransferVoucher({ ...transferVoucher, route: e.target.value })}
                        placeholder="e.g. Airport – Makkah – Madinah – Airport"
                      />
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Pickup Date &amp; Time">
                        <input
                          className={inputClass}
                          value={transferVoucher.pickupDateTime}
                          onChange={(e) => setTransferVoucher({ ...transferVoucher, pickupDateTime: e.target.value })}
                        />
                      </Field>
                      <Field label="Flight Number">
                        <input
                          className={inputClass}
                          value={transferVoucher.flightNo || ""}
                          onChange={(e) => setTransferVoucher({ ...transferVoucher, flightNo: e.target.value })}
                          placeholder="e.g. EK-803"
                        />
                      </Field>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Drop-off Location">
                        <input
                          className={inputClass}
                          value={transferVoucher.dropOffLocation || ""}
                          onChange={(e) => setTransferVoucher({ ...transferVoucher, dropOffLocation: e.target.value })}
                        />
                      </Field>
                      <Field label="Driver / Desk Contact">
                        <input
                          className={inputClass}
                          value={transferVoucher.driverContact || ""}
                          onChange={(e) => setTransferVoucher({ ...transferVoucher, driverContact: e.target.value })}
                        />
                      </Field>
                    </div>

                    <Field label="Special Requests (Optional)">
                      <textarea
                        rows={2}
                        className={inputClass}
                        value={transferVoucher.specialRequests || ""}
                        onChange={(e) => setTransferVoucher({ ...transferVoucher, specialRequests: e.target.value })}
                      />
                    </Field>

                    <Field label="Voucher Notes (Optional)">
                      <textarea
                        rows={2}
                        className={inputClass}
                        value={transferVoucher.voucherNotes || ""}
                        onChange={(e) => setTransferVoucher({ ...transferVoucher, voucherNotes: e.target.value })}
                      />
                    </Field>
                  </div>
                )}

                {/* Voucher Action Buttons */}
                <div className="mt-6 flex flex-wrap items-center gap-3 pt-4 border-t border-black/10">
                  <GoldButton
                    type="button"
                    onClick={() => window.print()}
                  >
                    <span>📄</span> Generate {voucherType === "hotel" ? "Hotel" : "Transfer"} Voucher PDF
                  </GoldButton>

                  <Link href={`/admin/documents/booking-vouchers/${document.id}/send`}>
                    <SecondaryButton type="button">
                      <span>✉️</span> Send to Client
                    </SecondaryButton>
                  </Link>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="rounded-md border border-black/15 bg-white px-4 py-2 text-sm font-semibold text-masaar-black hover:bg-black/5"
                  >
                    🖨️ Print
                  </button>
                </div>
              </Card>
            </div>

            {/* Live Voucher Preview Column (Right, matching inspiration) */}
            <div className="lg:col-span-6">
              <div className="sticky top-6">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-masaar-black/70 flex items-center gap-1.5">
                    <span>👁️</span> Voucher Preview
                  </h3>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="text-xs font-semibold text-admin-primary hover:underline"
                  >
                    Preview Full Screen / Print
                  </button>
                </div>

                <div className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm">
                  <GranularVoucherDocumentView
                    type={voucherType}
                    data={voucherType === "hotel" ? hotelVoucher : transferVoucher}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 3: EDIT BOOKING & LINE ITEMS                              */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === "edit" && (
        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-masaar-black">Guest &amp; Travel Basics</h2>
              {savedMessage && <span className="text-xs font-semibold text-emerald-700">{savedMessage}</span>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              <Field label="Client / Guest Name" required>
                <input className={inputClass} value={clientName} onChange={(e) => setClientName(e.target.value)} />
              </Field>

              <Field label="Client Phone">
                <input className={inputClass} value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} />
              </Field>

              <Field label="Client Email">
                <input className={inputClass} value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
              </Field>

              <Field label="Country / City">
                <input className={inputClass} value={clientCountry} onChange={(e) => setClientCountry(e.target.value)} />
              </Field>

              <Field label="Destination">
                <input className={inputClass} value={destination} onChange={(e) => setDestination(e.target.value)} />
              </Field>

              <Field label="Booking Reference">
                <input className={inputClass} value={bookingReference} onChange={(e) => setBookingReference(e.target.value)} />
              </Field>

              <Field label="Departure Date">
                <input type="date" className={inputClass} value={travelDate} onChange={(e) => setTravelDate(e.target.value)} />
              </Field>

              <Field label="Return Date">
                <input type="date" className={inputClass} value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
              </Field>

              <div className="grid grid-cols-3 gap-2">
                <Field label="Adults">
                  <input type="number" min="1" className={inputClass} value={adults} onChange={(e) => setAdults(Number(e.target.value))} />
                </Field>
                <Field label="Children">
                  <input type="number" min="0" className={inputClass} value={childrenCount} onChange={(e) => setChildrenCount(Number(e.target.value))} />
                </Field>
                <Field label="Infants">
                  <input type="number" min="0" className={inputClass} value={infantsCount} onChange={(e) => setInfantsCount(Number(e.target.value))} />
                </Field>
              </div>

              <div className="sm:col-span-2 md:col-span-3">
                <Field label="Special Requirements">
                  <textarea
                    rows={2}
                    className={inputClass}
                    value={specialRequirements}
                    onChange={(e) => setSpecialRequirements(e.target.value)}
                  />
                </Field>
              </div>

              <div className="sm:col-span-2 md:col-span-3">
                <Field label="Internal Notes">
                  <textarea
                    rows={2}
                    className={inputClass}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </Field>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-3 pt-3 border-t border-black/10">
              <PrimaryButton onClick={handleSaveBasics} disabled={isPending}>
                {isPending ? "Saving…" : "Save Booking Basics"}
              </PrimaryButton>
            </div>
          </Card>

          {/* Line items editor */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-masaar-black">Booking Line Items</h2>
                <p className="text-xs text-masaar-black/60">
                  Manage the accommodation, transfers, flights, and included services for this booking.
                </p>
              </div>
              <SecondaryButton onClick={handleSaveVersion} disabled={isPending}>
                Save Version Snapshot
              </SecondaryButton>
            </div>

            <Card className="!p-0">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-black/10 text-xs uppercase tracking-wide text-masaar-black/50">
                    <th className="px-6 py-3 font-medium">Type</th>
                    <th className="px-6 py-3 font-medium">Description</th>
                    <th className="px-6 py-3 font-medium">Qty</th>
                    <th className="px-6 py-3 font-medium">Rate</th>
                    <th className="px-6 py-3 font-medium">Total</th>
                    <th className="px-6 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-xs text-masaar-black/50">
                        No line items yet — add packages, hotels, transfers, or flights below.
                      </td>
                    </tr>
                  )}
                  {items.map((item) => (
                    <LineItemRow
                      key={item.id}
                      item={item}
                      onUpdate={async (id, patch) => {
                        try {
                          const res = await fetch("/api/admin/documents/items", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ itemId: id, documentId: document.id, patch }),
                          }).then((r) => r.json());
                          if (!res.success) alert(res.error || "Failed to update item.");
                          router.refresh();
                        } catch (e: any) {
                          alert(e?.message || "Failed to update item.");
                        }
                      }}
                      onDelete={async (id) => {
                        if (!confirm("Remove this line item?")) return;
                        try {
                          const res = await fetch(
                            `/api/admin/documents/items?itemId=${encodeURIComponent(id)}&documentId=${encodeURIComponent(document.id)}`,
                            { method: "DELETE" }
                          ).then((r) => r.json());
                          if (!res.success) alert(res.error || "Failed to delete item.");
                          router.refresh();
                        } catch (e: any) {
                          alert(e?.message || "Failed to delete item.");
                        }
                      }}
                      disabled={isPending}
                    />
                  ))}
                </tbody>
              </table>
            </Card>

            <AddItemCard
              products={products}
              onAdd={async (input: LineItemInput) => {
                try {
                  const res = await fetch("/api/admin/documents/items", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ documentId: document.id, documentType: "booking_voucher", item: input }),
                  }).then((r) => r.json());
                  if (!res.success) {
                    alert(res.error || "Failed to add item.");
                    return;
                  }
                  router.refresh();
                } catch (e: any) {
                  alert(e?.message || "Failed to add item.");
                }
              }}
              disabled={isPending}
            />
          </div>
        </div>
      )}
    </div>
  );
}
