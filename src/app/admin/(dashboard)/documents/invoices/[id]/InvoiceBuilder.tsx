"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Card, PrimaryButton, SecondaryButton, GoldButton, Badge, Field, inputClass } from "@/components/admin/ui";
import { InvoiceDocumentView } from "@/components/documents/InvoiceDocumentView";
import { AddItemCard, LineItemRow, money, type LineItemProducts } from "@/components/documents/LineItemsEditor";
import {
  addLineItem,
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
  INVOICE_STATUSES,
} from "@/lib/types/database";

const STATUS_LABELS: Record<(typeof INVOICE_STATUSES)[number], string> = {
  draft: "Draft",
  issued: "Issued",
  sent: "Sent",
  partially_paid: "Partially Paid",
  paid: "Paid",
  cancelled: "Cancelled",
};

function statusTone(status: string): "green" | "amber" | "gray" | "blue" | "gold" {
  if (status === "paid") return "green";
  if (["sent", "issued", "partially_paid"].includes(status)) return "gold";
  if (status === "cancelled") return "gray";
  return "blue";
}

export function InvoiceBuilder({
  document,
  items,
  template,
  versions,
  shares,
  products,
}: {
  document: DocumentRow;
  items: DocumentItemRow[];
  template: DocumentTemplateRow | null;
  versions: DocumentVersionRow[];
  shares: DocumentShareRow[];
  products: LineItemProducts;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const [invoiceNumber, setInvoiceNumber] = useState(document.document_number);
  const [clientName, setClientName] = useState(document.client_name);
  const [clientPhone, setClientPhone] = useState(document.client_phone ?? "");
  const [clientEmail, setClientEmail] = useState(document.client_email ?? "");
  const [dueDate, setDueDate] = useState(document.due_date ?? "");
  const [bookingReference, setBookingReference] = useState(document.booking_reference ?? "");
  const [notes, setNotes] = useState(document.notes ?? "");
  const [terms, setTerms] = useState(document.terms ?? "");

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

  function handleSaveDraft() {
    if (!invoiceNumber.trim()) {
      alert("Invoice Number can't be empty.");
      return;
    }
    runRedirectable(async () => {
      await updateDocumentBasics(document.id, "invoice", {
        document_number: invoiceNumber.trim(),
        client_name: clientName,
        client_phone: clientPhone || null,
        client_email: clientEmail || null,
        due_date: dueDate || null,
        booking_reference: bookingReference || null,
        notes: notes || null,
        terms: terms || null,
      });
      const v = await saveDocumentVersion(document.id, "invoice");
      setSavedMessage(`Saved — Version ${v}`);
      router.refresh();
      setTimeout(() => setSavedMessage(null), 3000);
    });
  }

  function handleStatusChange(status: string) {
    runRedirectable(async () => {
      await updateDocumentStatus(document.id, "invoice", status);
      router.refresh();
    });
  }

  function handleDuplicate() {
    runRedirectable(async () => {
      await duplicateDocument(document.id, "invoice");
    });
  }

  function handleAddItem(item: LineItemInput) {
    runRedirectable(async () => {
      await addLineItem(document.id, "invoice", item);
      router.refresh();
    });
  }

  function handleUpdateItem(itemId: string, patch: Partial<LineItemInput>) {
    runRedirectable(async () => {
      await updateLineItem(itemId, document.id, "invoice", patch);
      router.refresh();
    });
  }

  function handleDeleteItem(itemId: string) {
    if (!confirm("Remove this line item?")) return;
    runRedirectable(async () => {
      await deleteLineItem(itemId, document.id, "invoice");
      router.refresh();
    });
  }

  const activeShare = shares.find((s) => !s.expires_at || new Date(s.expires_at) > new Date());
  const balanceDue = document.total_aed - document.amount_paid_aed;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-xs text-masaar-black/50">
            <Link href="/admin">Dashboard</Link> › <Link href="/admin/documents">Documents</Link> ›{" "}
            <Link href="/admin/documents/invoices">Invoices</Link> › {document.document_number}
          </p>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-masaar-black">{document.document_number}</h1>
            <Badge tone={statusTone(document.status)}>{STATUS_LABELS[document.status as keyof typeof STATUS_LABELS] ?? document.status}</Badge>
          </div>
          {savedMessage && <p className="mt-1 text-sm text-green-700">{savedMessage}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={document.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className={inputClass + " w-auto"}
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
          <Link href={`/admin/documents-preview/${document.id}`} target="_blank">
            <SecondaryButton type="button">Preview Full Screen</SecondaryButton>
          </Link>
          <Link href={`/admin/documents/invoices/${document.id}/send`}>
            <SecondaryButton type="button">Send</SecondaryButton>
          </Link>
          <Link href={`/admin/documents/invoices/${document.id}/record-payment`}>
            <SecondaryButton type="button">💳 Record Payment</SecondaryButton>
          </Link>
          <Link href={`/admin/documents/invoices/${document.id}/pdf`}>
            <GoldButton type="button">Generate PDF</GoldButton>
          </Link>
          <PrimaryButton onClick={handleSaveDraft} disabled={isPending}>
            {isPending ? "Saving…" : "Save Draft"}
          </PrimaryButton>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* LEFT: editable panel */}
        <div className="space-y-6">
          <Card>
            <h2 className="mb-4 font-semibold text-masaar-black">Client &amp; Invoice Details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Invoice Number" required hint="Must stay unique across all documents.">
                <input className={inputClass} value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
              </Field>
              <Field label="Client Name" required>
                <input className={inputClass} value={clientName} onChange={(e) => setClientName(e.target.value)} />
              </Field>
              <Field label="Phone">
                <input className={inputClass} value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} />
              </Field>
              <Field label="Email">
                <input className={inputClass} value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
              </Field>
              <Field label="Booking Reference">
                <input className={inputClass} value={bookingReference} onChange={(e) => setBookingReference(e.target.value)} placeholder="MH-BKG-4587" />
              </Field>
              <Field label="Due Date">
                <input type="date" className={inputClass} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </Field>
            </div>
          </Card>

          <AddItemCard products={products} onAdd={handleAddItem} disabled={isPending} />

          <Card>
            <h2 className="mb-4 font-semibold text-masaar-black">Line Items</h2>
            {items.length === 0 && <p className="text-sm text-masaar-black/50">No line items yet — add a hotel, transfer, package or custom item above.</p>}
            <div className="space-y-3">
              {items.map((item) => (
                <LineItemRow key={item.id} item={item} onUpdate={handleUpdateItem} onDelete={handleDeleteItem} disabled={isPending} />
              ))}
            </div>
            <div className="mt-4 space-y-1 border-t border-black/10 pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-masaar-black/60">Subtotal</span>
                <span>AED {money(document.subtotal_aed)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-masaar-black/60">Discount</span>
                <span>-AED {money(document.discount_aed)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-masaar-black/60">VAT (5%)</span>
                <span>AED {money(document.tax_aed)}</span>
              </div>
              <div className="flex justify-between text-base font-bold">
                <span>Total</span>
                <span>AED {money(document.total_aed)}</span>
              </div>
              <div className="flex justify-between text-masaar-black/60">
                <span>Amount Paid</span>
                <span>AED {money(document.amount_paid_aed)}</span>
              </div>
              <div className="flex justify-between font-semibold text-deep-gold">
                <span>Balance Due</span>
                <span>AED {money(balanceDue)}</span>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="mb-4 font-semibold text-masaar-black">Notes &amp; Terms</h2>
            <Field label="Notes">
              <textarea rows={3} className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Field>
            <Field label="Terms &amp; Conditions" className="mt-4">
              <textarea rows={3} className={inputClass} value={terms} onChange={(e) => setTerms(e.target.value)} />
            </Field>
          </Card>

          {activeShare && (
            <Card>
              <h2 className="mb-2 font-semibold text-masaar-black">Secure Client Link</h2>
              <p className="break-all rounded bg-admin-surface px-3 py-2 text-xs text-masaar-black/70">
                {`${typeof window !== "undefined" ? window.location.origin : ""}/quote/${activeShare.share_token}`}
              </p>
            </Card>
          )}

          {versions.length > 0 && (
            <Card>
              <h2 className="mb-3 font-semibold text-masaar-black">Version History</h2>
              <ul className="space-y-1 text-sm">
                {versions.map((v) => (
                  <li key={v.id} className="flex items-center justify-between text-masaar-black/70">
                    <span>
                      Version {v.version_number} — {STATUS_LABELS[v.status_at_version as keyof typeof STATUS_LABELS] ?? v.status_at_version}
                    </span>
                    <span className="text-xs text-masaar-black/40">{new Date(v.created_at).toLocaleString("en-GB")}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        {/* RIGHT: live preview */}
        <div>
          <div className="sticky top-6 overflow-hidden rounded-lg border border-black/10 shadow-sm">
            <div className="border-b border-black/10 bg-admin-surface px-4 py-2 text-xs font-semibold uppercase tracking-wide text-masaar-black/60">
              Live Preview
            </div>
            <div className="max-h-[80vh] overflow-y-auto">
              <InvoiceDocumentView
                document={{
                  ...document,
                  document_number: invoiceNumber,
                  client_name: clientName,
                  client_phone: clientPhone,
                  client_email: clientEmail,
                  due_date: dueDate || null,
                  booking_reference: bookingReference || null,
                  notes: notes || null,
                  terms: terms || null,
                }}
                items={items}
                template={template}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
