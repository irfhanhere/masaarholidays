"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, Badge, SecondaryButton, GoldButton, PrimaryButton } from "@/components/admin/ui";
import { ReceiptDocumentView } from "@/components/documents/ReceiptDocumentView";
import {
  deleteDocument,
  duplicateDocument,
  sendDocumentEmailAction,
  updateDocumentStatus,
} from "@/app/admin/(dashboard)/documents/actions";
import type {
  DocumentRow,
  DocumentTemplateRow,
  RECEIPT_STATUSES,
} from "@/lib/types/database";

const STATUS_LABELS: Record<(typeof RECEIPT_STATUSES)[number], string> = {
  draft: "Draft",
  issued: "Issued",
  sent: "Sent",
  cancelled: "Cancelled",
};

function statusTone(status: string): "green" | "gold" | "gray" | "blue" {
  if (status === "issued") return "green";
  if (status === "sent") return "gold";
  if (status === "cancelled") return "gray";
  return "blue";
}

function money(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  bank_transfer: "Bank Transfer",
  cash: "Cash",
  card: "Card",
  other: "Other",
};

export function ReceiptBuilder({
  document,
  template,
  invoiceNumber,
}: {
  document: DocumentRow;
  template: DocumentTemplateRow | null;
  invoiceNumber: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function run(fn: () => Promise<void>) {
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

  function handleStatusChange(status: string) {
    run(async () => {
      await updateDocumentStatus(document.id, "receipt", status);
      router.refresh();
    });
  }

  function handleDuplicate() {
    run(async () => {
      await duplicateDocument(document.id, "receipt");
    });
  }

  function handleDelete() {
    if (!confirm(`Delete receipt ${document.document_number}? This cannot be undone.`)) return;
    run(async () => {
      await deleteDocument(document.id, "receipt");
      router.push("/admin/documents/receipts");
    });
  }

  return (
    <div>
      {/* Page header row */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-xs text-masaar-black/50">
            <Link href="/admin">Dashboard</Link> ›{" "}
            <Link href="/admin/documents">Documents</Link> ›{" "}
            <Link href="/admin/documents/receipts">Receipts</Link> ›{" "}
            {document.document_number}
          </p>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-masaar-black">{document.document_number}</h1>
            <Badge tone={statusTone(document.status)}>
              {STATUS_LABELS[document.status as keyof typeof STATUS_LABELS] ?? document.status}
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={document.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="rounded-md border border-black/15 px-3 py-2 text-sm focus:border-admin-primary focus:outline-none"
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

          <Link href={`/admin/documents/receipts/${document.id}/send`}>
            <SecondaryButton type="button">Send</SecondaryButton>
          </Link>

          <Link href={`/admin/documents/receipts/${document.id}/pdf`}>
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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* LEFT — receipt details + back-links */}
        <div className="space-y-6">
          <Card>
            <h2 className="mb-4 font-semibold text-masaar-black">Payment Details</h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-masaar-black/50">Client</dt>
                <dd className="mt-0.5 font-semibold">{document.client_name}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-masaar-black/50">Amount Received</dt>
                <dd className="mt-0.5 font-bold text-deep-gold">AED {money(document.total_aed)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-masaar-black/50">Payment Method</dt>
                <dd className="mt-0.5">
                  {document.payment_method
                    ? PAYMENT_METHOD_LABEL[document.payment_method] ?? document.payment_method
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-masaar-black/50">Payment Date</dt>
                <dd className="mt-0.5">
                  {document.payment_date
                    ? new Date(document.payment_date).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </dd>
              </div>
              {document.transaction_reference && (
                <div className="col-span-2">
                  <dt className="text-xs uppercase tracking-wide text-masaar-black/50">Transaction Reference</dt>
                  <dd className="mt-0.5 font-mono text-sm">{document.transaction_reference}</dd>
                </div>
              )}
              {invoiceNumber && (
                <div className="col-span-2">
                  <dt className="text-xs uppercase tracking-wide text-masaar-black/50">Against Invoice</dt>
                  <dd className="mt-0.5">
                    <Link
                      href={`/admin/documents/invoices/${document.source_document_id}`}
                      className="font-medium text-admin-primary hover:underline"
                    >
                      {invoiceNumber} →
                    </Link>
                  </dd>
                </div>
              )}
              {document.booking_reference && (
                <div className="col-span-2">
                  <dt className="text-xs uppercase tracking-wide text-masaar-black/50">Booking Reference</dt>
                  <dd className="mt-0.5">{document.booking_reference}</dd>
                </div>
              )}
            </dl>
          </Card>

          {document.notes && (
            <Card>
              <h2 className="mb-2 font-semibold text-masaar-black">Notes</h2>
              <p className="whitespace-pre-line text-sm text-masaar-black/70">{document.notes}</p>
            </Card>
          )}

          <Card>
            <h2 className="mb-3 font-semibold text-masaar-black">Actions</h2>
            <div className="flex flex-wrap gap-2">
              <Link href={`/admin/documents/receipts/${document.id}/pdf`}>
                <GoldButton type="button">Generate PDF</GoldButton>
              </Link>
              <Link href={`/admin/documents/receipts/${document.id}/send`}>
                <SecondaryButton type="button">Send to Client</SecondaryButton>
              </Link>
              {document.source_document_id && (
                <Link href={`/admin/documents/invoices/${document.source_document_id}/record-payment`}>
                  <PrimaryButton type="button">Record Another Payment</PrimaryButton>
                </Link>
              )}
            </div>
          </Card>
        </div>

        {/* RIGHT — live document preview */}
        <div>
          <div className="sticky top-6 overflow-hidden rounded-lg border border-black/10 shadow-sm">
            <div className="border-b border-black/10 bg-admin-surface px-4 py-2 text-xs font-semibold uppercase tracking-wide text-masaar-black/60">
              Receipt Preview
            </div>
            <div className="max-h-[80vh] overflow-y-auto">
              <ReceiptDocumentView
                document={document}
                template={template}
                invoiceNumber={invoiceNumber}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
