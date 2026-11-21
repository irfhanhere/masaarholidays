"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, Field, PrimaryButton, SecondaryButton, inputClass } from "@/components/admin/ui";
import { createCustomerAction } from "../actions";

export function NewCustomerForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const res = await createCustomerAction(formData);

    if (!res.success) {
      setError(res.error || "Failed to create customer.");
      setIsSubmitting(false);
      return;
    }

    router.push(`/admin/customers/${res.customerId}`);
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card className="space-y-4">
        <h2 className="text-lg font-bold text-masaar-black">Primary Customer Details</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full Name *" htmlFor="fullName">
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              placeholder="e.g. Tariq Al Mansoori"
              className={inputClass}
            />
          </Field>

          <Field label="Customer Type" htmlFor="customerType">
            <select id="customerType" name="customerType" defaultValue="individual" className={inputClass}>
              <option value="individual">Individual</option>
              <option value="corporate">Corporate</option>
              <option value="agent">Travel Agent</option>
              <option value="vip">VIP Guest</option>
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Primary Phone *" htmlFor="phone">
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              defaultValue="+971 "
              className={inputClass}
            />
          </Field>

          <Field label="WhatsApp Number" htmlFor="whatsapp">
            <input
              id="whatsapp"
              name="whatsapp"
              type="tel"
              placeholder="+971 50 123 4567"
              className={inputClass}
            />
          </Field>

          <Field label="Email Address" htmlFor="email">
            <input
              id="email"
              name="email"
              type="email"
              placeholder="customer@domain.com"
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Country of Residence" htmlFor="country">
            <input
              id="country"
              name="country"
              type="text"
              defaultValue="United Arab Emirates"
              className={inputClass}
            />
          </Field>

          <Field label="Nationality" htmlFor="nationality">
            <input
              id="nationality"
              name="nationality"
              type="text"
              placeholder="e.g. Emirati, British, Indian, Pakistani"
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Address / Emirate" htmlFor="address">
          <input
            id="address"
            name="address"
            type="text"
            placeholder="e.g. Villa 14, Al Zahia, Sharjah, UAE"
            className={inputClass}
          />
        </Field>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-lg font-bold text-masaar-black">Acquisition & Operations</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Customer Source" htmlFor="customerSource">
            <select id="customerSource" name="customerSource" defaultValue="website" className={inputClass}>
              <option value="website">Website Direct</option>
              <option value="whatsapp">WhatsApp Direct Enquiry</option>
              <option value="referral">Referral / Word of Mouth</option>
              <option value="walk-in">Office Walk-in</option>
              <option value="phone">Inbound Phone Call</option>
              <option value="other">Other Marketing Channel</option>
            </select>
          </Field>
        </div>

        <Field label="Internal Notes & Preferences" htmlFor="internalNotes">
          <textarea
            id="internalNotes"
            name="internalNotes"
            rows={3}
            placeholder="Room preferences, special requirements, dietary requests, mobility assistance, VIP protocol notes..."
            className={inputClass}
          />
        </Field>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Link href="/admin/customers">
          <SecondaryButton>Cancel</SecondaryButton>
        </Link>
        <PrimaryButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Save Customer Profile"}
        </PrimaryButton>
      </div>
    </form>
  );
}
