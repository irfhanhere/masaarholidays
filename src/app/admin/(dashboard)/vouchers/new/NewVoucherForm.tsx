"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, Field, PrimaryButton, SecondaryButton, inputClass } from "@/components/admin/ui";
import { createVoucherAction } from "../actions";

export function NewVoucherForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const defaultBookingRef = searchParams.get("bookingRef") || "";
  const defaultClientName = searchParams.get("clientName") || "";
  const defaultType = searchParams.get("type") || "hotel";

  const [voucherType, setVoucherType] = useState<string>(defaultType);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const res = await createVoucherAction(formData);

    if (!res.success) {
      setError(res.error || "Failed to create voucher");
      setIsSubmitting(false);
      return;
    }

    router.push(`/admin/documents/booking-vouchers/${res.voucherId}`);
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card className="space-y-4">
        <h2 className="text-lg font-bold text-masaar-black">Voucher Classification</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Voucher Type *" htmlFor="voucherType">
            <select
              id="voucherType"
              name="voucherType"
              value={voucherType}
              onChange={(e) => setVoucherType(e.target.value)}
              className={inputClass}
            >
              <option value="hotel">Hotel Accommodation Voucher</option>
              <option value="transfer">Airport / Intercity Ground Transfer Voucher</option>
              <option value="flight">Flight Itinerary & Ticket Information</option>
              <option value="ziyarah">Historical Ziyarah & Sightseeing Tour Voucher</option>
              <option value="service">General Pilgrimage Service Voucher</option>
              <option value="booking_confirmation">Complete Master Booking Confirmation</option>
            </select>
          </Field>

          <Field label="Booking Reference *" htmlFor="bookingReference">
            <input
              id="bookingReference"
              name="bookingReference"
              required
              defaultValue={defaultBookingRef}
              placeholder="e.g. MAS-BKG-2026-0001"
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Lead Guest / Passenger Name *" htmlFor="clientName">
            <input
              id="clientName"
              name="clientName"
              required
              defaultValue={defaultClientName}
              placeholder="Full name as per passport"
              className={inputClass}
            />
          </Field>

          <Field label="Contact Phone / WhatsApp" htmlFor="clientPhone">
            <input
              id="clientPhone"
              name="clientPhone"
              defaultValue="+971 "
              className={inputClass}
            />
          </Field>
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-lg font-bold text-masaar-black">Service & Supplier Details</h2>

        <Field label="Service / Hotel / Carrier Title *" htmlFor="serviceTitle">
          <input
            id="serviceTitle"
            name="serviceTitle"
            required
            defaultValue={
              voucherType === "hotel"
                ? "DoubleTree by Hilton Makkah & Worth Tharawat Hotel Madinah"
                : voucherType === "transfer"
                ? "Private GMC Yukon XL Airport & Intercity Transfer"
                : "Saudia (Saudi Arabian Airlines) Confirmed Itinerary"
            }
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Service / Check-in Date" htmlFor="travelDate">
            <input id="travelDate" name="travelDate" type="date" className={inputClass} />
          </Field>

          <Field label="Service / Check-out Date" htmlFor="returnDate">
            <input id="returnDate" name="returnDate" type="date" className={inputClass} />
          </Field>
        </div>

        <Field label="Supplier Confirmation Number / Airline PNR" htmlFor="supplierConfirmation">
          <input
            id="supplierConfirmation"
            name="supplierConfirmation"
            placeholder="e.g. HLT-982410, PNR: 6X9KLP, TRN-5501"
            className={inputClass}
          />
        </Field>

        <Field label="Room Category / Vehicle Type / Itinerary Details" htmlFor="serviceDetails">
          <textarea
            id="serviceDetails"
            name="serviceDetails"
            rows={3}
            defaultValue={
              voucherType === "hotel"
                ? "DoubleTree by Hilton Makkah (3 Nights) • Worth Tharawat Hotel Madinah (2 Nights) • Quad Room • Daily Breakfast Included"
                : "Private GMC Yukon XL • Jeddah Airport (JED) → Makkah Hotel • Makkah Hotel → Madinah Hotel • Madinah Hotel → Airport"
            }
            className={inputClass}
          />
        </Field>

        <Field label="Special Instructions & Meeting Point" htmlFor="notes">
          <textarea
            id="notes"
            name="notes"
            rows={2}
            placeholder="e.g. Driver will hold Masaar Holidays placard at Terminal 1 Arrival Gate 3. Please show passport at check-in desk."
            className={inputClass}
          />
        </Field>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Link href="/admin/vouchers">
          <SecondaryButton>Cancel</SecondaryButton>
        </Link>
        <PrimaryButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Generating Voucher..." : "Issue Voucher (A4 PDF)"}
        </PrimaryButton>
      </div>
    </form>
  );
}
