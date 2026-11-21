"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, Field, PrimaryButton, SecondaryButton, inputClass } from "@/components/admin/ui";
import { createSupplierAction } from "../actions";

export function NewSupplierForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const res = await createSupplierAction(formData);

    if (!res.success) {
      setError(res.error || "Failed to create supplier");
      setIsSubmitting(false);
      return;
    }

    router.push("/admin/suppliers");
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card className="space-y-4">
        <h2 className="text-lg font-bold text-masaar-black">Supplier Profile</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Supplier Company Name *" htmlFor="name">
            <input id="name" name="name" required placeholder="e.g. Swissôtel Makkah" className={inputClass} />
          </Field>

          <Field label="Category *" htmlFor="category">
            <select id="category" name="category" defaultValue="hotel" className={inputClass}>
              <option value="hotel">Hotel Accommodation</option>
              <option value="airline">Airline Carrier</option>
              <option value="transport">Ground Transport & Fleet</option>
              <option value="visa">Visa Authority / Service Partner</option>
              <option value="esim">eSIM & Telecom Provider</option>
              <option value="tour">Tour & Ziyarah Operator</option>
              <option value="other">Other Travel Supplier</option>
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Contact Person" htmlFor="contactPerson">
            <input id="contactPerson" name="contactPerson" placeholder="Account Manager / Dispatch" className={inputClass} />
          </Field>

          <Field label="Phone / Dispatch" htmlFor="phone">
            <input id="phone" name="phone" placeholder="+966 50 123 4567" className={inputClass} />
          </Field>

          <Field label="Email Address" htmlFor="email">
            <input id="email" name="email" type="email" placeholder="reservations@supplier.com" className={inputClass} />
          </Field>
        </div>

        <Field label="Physical Address / Office Location" htmlFor="address">
          <input id="address" name="address" placeholder="e.g. Jabal Omar, Makkah, Saudi Arabia" className={inputClass} />
        </Field>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-lg font-bold text-masaar-black">Financial Terms & Commercial Contract</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Billing Currency" htmlFor="currency">
            <select id="currency" name="currency" defaultValue="AED" className={inputClass}>
              <option value="AED">AED (UAE Dirham)</option>
              <option value="SAR">SAR (Saudi Riyal)</option>
              <option value="USD">USD (US Dollar)</option>
            </select>
          </Field>

          <Field label="Payment Terms" htmlFor="paymentTerms">
            <input id="paymentTerms" name="paymentTerms" placeholder="e.g. 14 Days Net, Advance Deposit" className={inputClass} />
          </Field>

          <Field label="Supplier Reference / Contract ID" htmlFor="supplierReference">
            <input id="supplierReference" name="supplierReference" placeholder="e.g. CONTR-2026-MAK" className={inputClass} />
          </Field>
        </div>

        <Field label="Internal Operational Notes" htmlFor="internalNotes">
          <textarea id="internalNotes" name="internalNotes" rows={3} placeholder="Bank details, booking portals, cancellation cut-off policies..." className={inputClass} />
        </Field>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Link href="/admin/suppliers">
          <SecondaryButton>Cancel</SecondaryButton>
        </Link>
        <PrimaryButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Supplier"}
        </PrimaryButton>
      </div>
    </form>
  );
}
