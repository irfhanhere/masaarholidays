"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Field, inputClass, PrimaryButton, SecondaryButton, Card } from "@/components/admin/ui";
import { createManualReceipt, type CreateManualReceiptInput } from "../../actions";
import type { DocumentRow } from "@/lib/types/database";

export function NewReceiptForm({ invoices }: { invoices: DocumentRow[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<"invoice" | "standalone">(
    invoices.length > 0 ? "invoice" : "standalone"
  );
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(invoices[0]?.id || "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const selectedInvoice = invoices.find((inv) => inv.id === selectedInvoiceId);
  const balanceDue = selectedInvoice
    ? Math.max(0, selectedInvoice.total_aed - selectedInvoice.amount_paid_aed)
    : 0;

  function handleSubmit(formData: FormData) {
    setError(null);
    const amountVal = Number(formData.get("amount"));
    if (!(amountVal > 0)) {
      setError("Payment amount must be greater than zero.");
      return;
    }

    const clientName =
      mode === "invoice" && selectedInvoice
        ? selectedInvoice.client_name
        : String(formData.get("client_name") ?? "").trim();

    if (!clientName) {
      setError("Client name is required.");
      return;
    }

    const input: CreateManualReceiptInput = {
      client_name: clientName,
      client_phone:
        mode === "invoice" && selectedInvoice
          ? selectedInvoice.client_phone || undefined
          : String(formData.get("client_phone") ?? "").trim() || undefined,
      client_email:
        mode === "invoice" && selectedInvoice
          ? selectedInvoice.client_email || undefined
          : String(formData.get("client_email") ?? "").trim() || undefined,
      client_country:
        mode === "invoice" && selectedInvoice
          ? selectedInvoice.client_country || undefined
          : String(formData.get("client_country") ?? "").trim() || undefined,
      amount: amountVal,
      payment_method: String(formData.get("payment_method") ?? "bank_transfer") as any,
      payment_date: String(formData.get("payment_date") ?? new Date().toISOString().slice(0, 10)),
      transaction_reference: String(formData.get("transaction_reference") ?? "").trim() || undefined,
      booking_reference:
        mode === "invoice" && selectedInvoice
          ? selectedInvoice.booking_reference || undefined
          : String(formData.get("booking_reference") ?? "").trim() || undefined,
      source_document_id: mode === "invoice" ? selectedInvoiceId : undefined,
      notes: String(formData.get("notes") ?? "").trim() || undefined,
    };

    startTransition(async () => {
      try {
        const res = await createManualReceipt(input);
        if (res && !res.success) {
          setError(res.error || "Failed to create receipt.");
          return;
        }
        if (res?.id) {
          router.push(`/admin/documents/receipts/${res.id}`);
        }
      } catch (err: any) {
        setError(err instanceof Error ? err.message : "Failed to create receipt.");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Tab toggle */}
      <div className="flex border-b border-black/10">
        <button
          type="button"
          onClick={() => setMode("invoice")}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
            mode === "invoice"
              ? "border-admin-primary text-admin-primary"
              : "border-transparent text-masaar-black/60 hover:text-masaar-black"
          }`}
        >
          Record Against Invoice
        </button>
        <button
          type="button"
          onClick={() => setMode("standalone")}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
            mode === "standalone"
              ? "border-admin-primary text-admin-primary"
              : "border-transparent text-masaar-black/60 hover:text-masaar-black"
          }`}
        >
          Issue Standalone Receipt
        </button>
      </div>

      <form action={handleSubmit}>
        <Card>
          {mode === "invoice" ? (
            <div className="space-y-4">
              <h2 className="font-semibold text-masaar-black">Select Invoice</h2>

              <Field label="Choose Invoice" required>
                <select
                  value={selectedInvoiceId}
                  onChange={(e) => setSelectedInvoiceId(e.target.value)}
                  className={inputClass}
                  disabled={isPending}
                >
                  {invoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.document_number} — {inv.client_name} (Total: AED {inv.total_aed.toLocaleString()} | Due: AED {(inv.total_aed - inv.amount_paid_aed).toLocaleString()})
                    </option>
                  ))}
                  {invoices.length === 0 && (
                    <option value="">No invoices found — use standalone receipt</option>
                  )}
                </select>
              </Field>

              {selectedInvoice && (
                <div className="rounded-xl border border-black/10 bg-[#FAF9F6] p-4 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-masaar-black/60">Client:</span>
                    <span className="font-bold text-masaar-black">{selectedInvoice.client_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-masaar-black/60">Invoice Total:</span>
                    <span>AED {selectedInvoice.total_aed.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-masaar-black/60">Already Paid:</span>
                    <span className="text-emerald-700">AED {selectedInvoice.amount_paid_aed.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-black/10 font-bold">
                    <span className="text-deep-gold">Current Balance Due:</span>
                    <span className="text-deep-gold">AED {balanceDue.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 mb-4">
              <h2 className="font-semibold text-masaar-black">Client Information</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Client Name" required>
                  <input name="client_name" required className={inputClass} placeholder="e.g. Ahmed Khan" />
                </Field>
                <Field label="Phone Number">
                  <input name="client_phone" className={inputClass} placeholder="+971 50 123 4567" />
                </Field>
                <Field label="Email Address">
                  <input name="client_email" type="email" className={inputClass} placeholder="client@email.com" />
                </Field>
                <Field label="Country / City">
                  <input name="client_country" className={inputClass} placeholder="Dubai, UAE" />
                </Field>
              </div>
            </div>
          )}

          {/* Payment information fields */}
          <div className="mt-5 pt-4 border-t border-black/10 space-y-4">
            <h2 className="font-semibold text-masaar-black">Payment Details</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Amount Received (AED)" required>
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  defaultValue={mode === "invoice" && balanceDue > 0 ? balanceDue : ""}
                  className={inputClass}
                  placeholder="e.g. 5000"
                />
              </Field>

              <Field label="Payment Method" required>
                <select name="payment_method" className={inputClass} defaultValue="bank_transfer">
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="other">Other</option>
                </select>
              </Field>

              <Field label="Payment Date" required>
                <input
                  name="payment_date"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  className={inputClass}
                />
              </Field>

              <Field label="Transaction Reference (Optional)">
                <input
                  name="transaction_reference"
                  className={inputClass}
                  placeholder="e.g. TRF-987654321 / Cheque #"
                />
              </Field>

              {mode === "standalone" && (
                <Field label="Booking Reference (Optional)">
                  <input name="booking_reference" className={inputClass} placeholder="MH-BKG-XXXX" />
                </Field>
              )}

              <div className="sm:col-span-2">
                <Field label="Notes (Optional)">
                  <textarea
                    name="notes"
                    rows={2}
                    className={inputClass}
                    placeholder="e.g. Full settlement received via Emirates NBD transfer"
                  />
                </Field>
              </div>
            </div>
          </div>

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

          <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-black/10">
            <SecondaryButton type="button" onClick={() => window.history.back()}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={isPending}>
              {isPending ? "Issuing Receipt…" : "Issue Receipt →"}
            </PrimaryButton>
          </div>
        </Card>
      </form>
    </div>
  );
}
