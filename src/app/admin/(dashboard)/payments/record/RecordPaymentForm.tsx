"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, Field, PrimaryButton, SecondaryButton, inputClass } from "@/components/admin/ui";
import { recordPaymentAction } from "../actions";

export function RecordPaymentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const bookingId = searchParams.get("bookingId") || "";
  const bookingRef = searchParams.get("bookingRef") || "";
  const invoiceId = searchParams.get("invoiceId") || "";
  const defaultBalance = searchParams.get("balance") || "";
  const defaultClient = searchParams.get("clientName") || "";

  const [amount, setAmount] = useState<string>(defaultBalance || "");
  const [paymentMethod, setPaymentMethod] = useState<string>("bank_transfer");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    if (bookingId) formData.append("bookingId", bookingId);
    if (invoiceId) formData.append("invoiceId", invoiceId);

    const res = await recordPaymentAction(formData);

    if (!res.success || !('receiptId' in res) || !res.receiptId) {
      setError(('error' in res && res.error) || "Failed to record payment.");
      setIsSubmitting(false);
      return;
    }

    router.push(`/admin/documents/receipts/${res.receiptId}`);
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card className="space-y-4">
        <h2 className="text-lg font-bold text-masaar-black">Payment Details</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Target Booking Reference" htmlFor="bookingRef">
            <input
              id="bookingRef"
              name="bookingRef"
              defaultValue={bookingRef}
              placeholder="e.g. MAS-BKG-2026-0001"
              className={inputClass}
            />
          </Field>

          <Field label="Customer / Lead Guest" htmlFor="clientName">
            <input
              id="clientName"
              name="clientName"
              defaultValue={defaultClient}
              placeholder="Guest full name"
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Payment Amount Received (AED) *" htmlFor="amount">
            <input
              id="amount"
              name="amount"
              type="number"
              step="any"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 5000"
              className={inputClass}
            />
          </Field>

          <Field label="Payment Method *" htmlFor="paymentMethod">
            <select
              id="paymentMethod"
              name="paymentMethod"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className={inputClass}
            >
              <option value="bank_transfer">Bank Transfer (Mashreq / Local Bank)</option>
              <option value="cash">Cash Collection (Office / Rep)</option>
              <option value="credit_card">POS Terminal / Card Machine</option>
              <option value="stripe">Stripe Online Gateway</option>
              <option value="tamara">Tamara BNPL (Instalments)</option>
              <option value="cheque">Cheque</option>
              <option value="other">Other Approved Method</option>
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Payment Date" htmlFor="paymentDate">
            <input
              id="paymentDate"
              name="paymentDate"
              type="date"
              defaultValue={new Date().toISOString().split("T")[0]}
              className={inputClass}
            />
          </Field>

          <Field label="Bank Reference / Transaction ID" htmlFor="transactionReference">
            <input
              id="transactionReference"
              name="transactionReference"
              placeholder="e.g. TXN-984210, MASHREQ-0021"
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Received By (Staff Member)" htmlFor="receivedBy">
          <input
            id="receivedBy"
            name="receivedBy"
            defaultValue="Operations Desk"
            className={inputClass}
          />
        </Field>

        <Field label="Notes / Payment Confirmation Notes" htmlFor="notes">
          <textarea
            id="notes"
            name="notes"
            rows={2}
            placeholder="e.g. 50% Advance deposit received via Mashreq bank transfer. Balance due 14 days before departure."
            className={inputClass}
          />
        </Field>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Link href="/admin/payments">
          <SecondaryButton>Cancel</SecondaryButton>
        </Link>
        <PrimaryButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Recording..." : "Record Payment & Issue Receipt"}
        </PrimaryButton>
      </div>
    </form>
  );
}
