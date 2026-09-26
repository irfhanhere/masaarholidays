"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { PageHeader, Card, PrimaryButton, SecondaryButton } from "@/components/admin/ui";
import { updateDocumentBasics } from "@/app/admin/(dashboard)/documents/actions";
import type { DocumentTemplateRow, DocumentType } from "@/lib/types/database";

const SECTIONS = [
  "Cover Page",
  "Client Details",
  "Package Overview / Line Items",
  "Accommodation",
  "Transportation",
  "Flights",
  "Additional Services",
  "Pricing Summary",
  "Terms & Conditions",
  "Contact Information",
];

const TYPE_LABEL: Record<DocumentType, string> = {
  quotation: "Quotation",
  invoice: "Invoice",
  receipt: "Receipt",
  booking_voucher: "Booking Voucher",
};

/** Shared Generate PDF screen — template picker + live PDF preview — used by every document type's /[id]/pdf route. `basePath` is e.g. "/admin/documents/invoices". */
export function GeneratePdfPanel({
  documentId,
  documentType,
  documentNumber,
  basePath,
  moduleLabel,
  templates,
  currentTemplateId,
  renderUrl,
}: {
  documentId: string;
  documentType: DocumentType;
  documentNumber: string;
  basePath: string;
  moduleLabel: string;
  templates: DocumentTemplateRow[];
  currentTemplateId: string | null;
  renderUrl: string;
}) {
  const [selectedTemplateId, setSelectedTemplateId] = useState(currentTemplateId ?? templates[0]?.id ?? "");
  const [isPending, startTransition] = useTransition();
  const [iframeKey, setIframeKey] = useState(0);

  function selectTemplate(id: string) {
    setSelectedTemplateId(id);
    startTransition(async () => {
      await updateDocumentBasics(documentId, documentType, { template_id: id });
      setIframeKey((k) => k + 1);
    });
  }

  return (
    <div>
      <PageHeader
        title={`Generate ${TYPE_LABEL[documentType]} PDF`}
        description={`Create a professional branded PDF for ${documentNumber}.`}
        breadcrumb={[
          { label: "Dashboard", href: "/admin" },
          { label: "Documents", href: "/admin/documents" },
          { label: moduleLabel, href: basePath },
          { label: documentNumber, href: `${basePath}/${documentId}` },
          { label: "Generate PDF" },
        ]}
        actions={
          <Link href={`${basePath}/${documentId}`}>
            <SecondaryButton>← Back to {TYPE_LABEL[documentType]}</SecondaryButton>
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-6">
          <Card>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-masaar-black/60">Template Style</h2>
            <div className="space-y-2">
              {templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => selectTemplate(t.id)}
                  disabled={isPending}
                  className={`w-full rounded-md border p-3 text-left text-sm transition-colors ${
                    selectedTemplateId === t.id ? "border-admin-primary bg-admin-surface" : "border-black/15 hover:bg-admin-surface"
                  }`}
                >
                  <p className="font-semibold text-masaar-black">{t.name}</p>
                  <p className="text-xs capitalize text-masaar-black/50">{t.layout}</p>
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-masaar-black/60">Include Sections</h2>
            <ul className="space-y-2 text-sm">
              {SECTIONS.map((s) => (
                <li key={s} className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="accent-admin-primary" disabled />
                  <span className="text-masaar-black/80">{s}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-masaar-black/40">
              Sections with no data (e.g. Flights on a Transfer-only quotation) are automatically left out of the generated PDF.
            </p>
          </Card>

          <button
            type="button"
            onClick={() => {
              const printUrl = `${renderUrl}&print=true`;
              window.open(printUrl, "_blank");
            }}
            className="flex w-full cursor-pointer"
          >
            <PrimaryButton className="w-full justify-center">🖨️ Print / Save as PDF</PrimaryButton>
          </button>
          <a href={`${basePath}/${documentId}/pdf/download`} className="flex">
            <SecondaryButton className="w-full justify-center">Direct Download (.pdf)</SecondaryButton>
          </a>
          <a href={renderUrl} target="_blank" rel="noreferrer" className="flex">
            <SecondaryButton className="w-full justify-center">Preview Full PDF</SecondaryButton>
          </a>
        </div>

        <Card className="!p-0">
          <div className="border-b border-black/10 bg-admin-surface px-4 py-2 text-xs font-semibold uppercase tracking-wide text-masaar-black/60">
            Live PDF Preview
          </div>
          <iframe key={iframeKey} src={renderUrl} className="h-[80vh] w-full" title={`${TYPE_LABEL[documentType]} PDF preview`} />
        </Card>
      </div>
    </div>
  );
}
