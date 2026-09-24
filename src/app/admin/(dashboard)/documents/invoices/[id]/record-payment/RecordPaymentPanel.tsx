"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, Card, PrimaryButton, SecondaryButton, GoldButton, Badge, Field, inputClass } from "@/components/admin/ui";
import { recordPayment, type RecordPaymentInput } from "@/app/admin/(dashboard)/documents/actions";
import type { DocumentRow } from "@/lib/types/database";

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  bank_transfer: "Bank Transfer",
  cash: "Cash",
  card: "Card",
  other: "Other",
};

function money(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function statusTone(status: string): "green" | "gold" | "gray" | "blue" {
  if (status === "paid") return "green";
  if (status === "partially_paid") return "gold";
  if (status === "cancelled") return "gray";
  return "blue";
}

export function RecordPaymentPanel({
  invoice,
  receipts,
}: {
  invoice: DocumentRow;
  receipts: DocumentRow[];
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const balanceDue = Math.round((Number(invoice.total_aed ?? 0) - Number(invoice.amount_paid_aed ?? 0)) * 100) / 100;
  const isFullyPaid = balanceDue <= 0;

  // Form state — pre-fill amount to the exact balance due
  const [amount, setAmount] = useState(isFullyPaid ? "" : String(balanceDue));
  const [method, setMethod] = useState<"bank_transfer" | "cash" | "card" | "other">("bank_transfer");
  const [reference, setReference] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) {
      setResult({ type: "error", text: "Please enter a valid payment amount greater than zero." });
      return;
    }
    setResult(null);

    const input: RecordPaymentInput = {
      amount: parsed,
      payment_method: method,
      transaction_reference: reference.trim() || undefined,
      payment_date: paymentDate,
      notes: notes.trim() || undefined,
    };

    setIsPending(true);
    try {
      const res = await recordPayment(invoice.id, input);
      if (!res.success) {
        setResult({ type: "error", text: res.error || "Failed to record payment." });
        return;
      }
      setResult({
        type: "success",
        text: `Payment of AED ${money(parsed)} recorded. Receipt ${res.receiptNumber || ""} generated.`,
      });
      setTimeout(() => {
        if (res.receiptId) {
          router.push(`/admin/documents/receipts/${res.receiptId}`);
        } else {
          router.push(`/admin/documents/invoices/${invoice.id}`);
        }
      }, 1200);
    } catch (err: any) {
      setResult({ type: "error", text: err instanceof Error ? err.message : "Something went wrong." });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Record Payment"
        description={`Record a payment against invoice ${invoice.document_number} — a receipt is generated automatically.`}
        breadcrumb={[
          { label: "Dashboard", href: "/admin" },
          { label: "Documents", href: "/admin/documents" },
          { label: "Invoices", href: "/admin/documents/invoices" },
          { label: invoice.document_number, href: `/admin/documents/invoices/${invoice.id}` },
          { label: "Record Payment" },
        ]}
        actions={
          <Link href={`/admin/documents/invoices/${invoice.id}`}>
            <SecondaryButton>← Back to Invoice</SecondaryButton>
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* LEFT — payment form */}
        <div className="space-y-6">
          {/* Invoice summary strip */}
          <Card>
            <h2 className="mb-4 font-semibold text-masaar-black">Invoice Summary</h2>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-masaar-black/50">Client</p>
                <p className="mt-0.5 font-semibold">{invoice.client_name}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-masaar-black/50">Invoice Total</p>
                <p className="mt-0.5 font-semibold">AED {money(invoice.total_aed)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-masaar-black/50">Amount Paid</p>
                <p className="mt-0.5 font-semibold text-green-700">AED {money(invoice.amount_paid_aed)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-masaar-black/50">Balance Due</p>
                <p className={`mt-0.5 font-bold ${isFullyPaid ? "text-green-700" : "text-deep-gold"}`}>
                  {isFullyPaid ? "Fully Paid" : `AED ${money(balanceDue)}`}
                </p>
              </div>
            </div>
            {invoice.status && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-masaar-black/50">Status:</span>
                <Badge tone={statusTone(invoice.status)}>{invoice.status.replace(/_/g, " ")}</Badge>
              </div>
            )}
          </Card>

          {isFullyPaid ? (
            <Card>
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-green-50 text-green-600 text-2xl">✓</div>
                <p className="font-semibold text-masaar-black">This invoice is fully paid.</p>
                <p className="text-sm text-masaar-black/60">
                  No further payments are due. You can still record an additional payment if a correction is needed.
                </p>
                <button
                  type="button"
                  className="mt-1 text-sm font-medium text-admin-primary hover:underline"
                  onClick={() => setAmount("")}
                >
                  Record another payment anyway
                </button>
              </div>
            </Card>
          ) : (
            <Card>
              <h2 className="mb-4 font-semibold text-masaar-black">Payment Details</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Amount (AED)" required>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      className={inputClass}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder={`e.g. ${money(balanceDue)}`}
                      disabled={isPending}
                      required
                    />
                  </Field>

                  <Field label="Payment Date" required>
                    <input
                      type="date"
                      className={inputClass}
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      disabled={isPending}
                      required
                    />
                  </Field>

                  <Field label="Payment Method" required>
                    <select
                      className={inputClass}
                      value={method}
                      onChange={(e) => setMethod(e.target.value as typeof method)}
                      disabled={isPending}
                    >
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="card">Card</option>
                      <option value="cash">Cash</option>
                      <option value="other">Other</option>
                    </select>
                  </Field>

                  <Field label="Transaction Reference" hint="Bank ref, receipt no, cheque no, etc.">
                    <input
                      type="text"
                      className={inputClass}
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      placeholder="e.g. TXN-123456"
                      disabled={isPending}
                    />
                  </Field>
                </div>

                <Field label="Internal Notes" hint="Optional — not shown on the receipt.">
                  <textarea
                    rows={3}
                    className={inputClass}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any internal notes about this payment…"
                    disabled={isPending}
                  />
                </Field>

                {result && (
                  <div
                    className={`rounded-md px-4 py-3 text-sm font-medium ${
                      result.type === "success"
                        ? "bg-green-50 text-green-800"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {result.text}
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <GoldButton type="submit" disabled={isPending}>
                    {isPending ? "Recording…" : "Record Payment & Generate Receipt"}
                  </GoldButton>
                  <Link href={`/admin/documents/invoices/${invoice.id}`}>
                    <SecondaryButton type="button" disabled={isPending}>
                      Cancel
                    </SecondaryButton>
                  </Link>
                </div>
              </form>
            </Card>
          )}
        </div>

        {/* RIGHT — payment history */}
        <div>
          <Card className="!p-0">
            <div className="border-b border-black/10 px-5 py-4">
              <h2 className="font-semibold text-masaar-black">Payment History</h2>
              <p className="mt-0.5 text-xs text-masaar-black/50">
                {receipts.length === 0 ? "No payments recorded yet." : `${receipts.length} payment${receipts.length > 1 ? "s" : ""} recorded`}
              </p>
            </div>

            {receipts.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-masaar-black/40">
                No payments yet — this will be the first.
              </div>
            ) : (
              <ul className="divide-y divide-black/5">
                {receipts.map((r) => (
                  <li key={r.id} className="flex items-start justify-between gap-4 px-5 py-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-masaar-black">{r.document_number}</p>
                      <p className="text-xs text-masaar-black/50">
                        {r.payment_method ? PAYMENT_METHOD_LABEL[r.payment_method] ?? r.payment_method : ""}
                        {r.transaction_reference && ` · ${r.transaction_reference}`}
                      </p>
                      <p className="mt-0.5 text-xs text-masaar-black/40">{formatDate(r.payment_date)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <p className="text-sm font-bold text-masaar-black">AED {money(r.total_aed)}</p>
                      <Link
                        href={`/admin/documents/receipts/${r.id}`}
                        className="text-xs font-medium text-admin-primary hover:underline"
                      >
                        View →
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {receipts.length > 0 && (
              <div className="border-t border-black/10 bg-admin-surface/50 px-5 py-3">
                <div className="flex justify-between text-sm">
                  <span className="text-masaar-black/60">Total Collected</span>
                  <span className="font-semibold">AED {money(invoice.amount_paid_aed)}</span>
                </div>
                <div className="mt-1 flex justify-between text-sm">
                  <span className="text-masaar-black/60">Balance Remaining</span>
                  <span className={`font-bold ${isFullyPaid ? "text-green-700" : "text-deep-gold"}`}>
                    {isFullyPaid ? "AED 0.00" : `AED ${money(balanceDue)}`}
                  </span>
                </div>
              </div>
            )}
          </Card>

          {receipts.length > 0 && (
            <div className="mt-4">
              <Link href="/admin/documents/receipts">
                <PrimaryButton className="w-full">View All Receipts →</PrimaryButton>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
