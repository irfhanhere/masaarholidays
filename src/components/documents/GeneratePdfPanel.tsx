"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { PageHeader, Card, PrimaryButton, SecondaryButton } from "@/components/admin/ui";
import { ShareQuotationModal } from "@/components/documents/ShareQuotationModal";
import type { DocumentRow, DocumentTemplateRow, DocumentType } from "@/lib/types/database";

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

/** Shared Generate PDF screen — template picker + live PDF preview — used by every document type's /[id]/pdf route. */
export function GeneratePdfPanel({
  document,
  documentId,
  documentType,
  documentNumber,
  basePath,
  moduleLabel,
  templates,
  currentTemplateId,
  renderUrl,
  shareToken,
}: {
  document?: DocumentRow;
  documentId: string;
  documentType: DocumentType;
  documentNumber: string;
  basePath: string;
  moduleLabel: string;
  templates: DocumentTemplateRow[];
  currentTemplateId: string | null;
  renderUrl: string;
  shareToken?: string;
}) {
  // Only display the clean, branded standard/premium template (filtering out buggy minimal/classic per user request)
  const filteredTemplates = templates.filter(
    (t) => t.layout !== "minimal" && t.layout !== "classic"
  );
  const displayTemplates = filteredTemplates.length > 0 ? filteredTemplates : templates;

  const [selectedTemplateId, setSelectedTemplateId] = useState(
    currentTemplateId ?? displayTemplates[0]?.id ?? ""
  );
  const [isPending, startTransition] = useTransition();
  const [iframeKey, setIframeKey] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);

  function selectTemplate(id: string) {
    setSelectedTemplateId(id);
    startTransition(async () => {
      try {
        await fetch(`/api/admin/documents/${documentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ template_id: id }),
        });
        setIframeKey((k) => k + 1);
      } catch (err) {
        console.error("Failed to update template:", err);
      }
    });
  }

  const printUrl = `${renderUrl}&print=true`;
  const downloadRouteUrl = `${basePath}/${documentId}/pdf/download`;

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
          <div className="flex items-center gap-2">
            {document && (
              <button
                type="button"
                onClick={() => setShowShareModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 bg-white px-3.5 py-2 text-xs font-semibold text-masaar-black shadow-xs hover:bg-black/[0.03] cursor-pointer"
              >
                <span>🔗</span> Share with Client
              </button>
            )}
            <Link href={`${basePath}/${documentId}`}>
              <SecondaryButton>← Back to {TYPE_LABEL[documentType]}</SecondaryButton>
            </Link>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-6">
          <Card>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-masaar-black/60">Template Style</h2>
            <div className="space-y-2">
              {displayTemplates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => selectTemplate(t.id)}
                  disabled={isPending}
                  className={`w-full rounded-md border p-3 text-left text-sm transition-colors cursor-pointer ${
                    selectedTemplateId === t.id
                      ? "border-admin-primary bg-admin-surface ring-1 ring-admin-primary"
                      : "border-black/15 hover:bg-admin-surface"
                  }`}
                >
                  <p className="font-semibold text-masaar-black">{t.name}</p>
                  <p className="text-xs capitalize text-masaar-black/50">Masaar Branded Layout</p>
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

          <div className="space-y-2.5">
            <a
              href={printUrl}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-md bg-admin-primary px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-admin-primary-dark shadow-xs cursor-pointer"
            >
              <span>🖨️</span> Print / Save as PDF
            </a>

            <a
              href={downloadRouteUrl}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-md border border-black/15 bg-white px-4 py-2.5 text-sm font-semibold text-masaar-black transition-colors hover:bg-admin-surface shadow-xs cursor-pointer"
            >
              <span>📥</span> Direct Download (.pdf)
            </a>

            <a
              href={renderUrl}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-md border border-black/15 bg-white px-4 py-2.5 text-sm font-semibold text-masaar-black transition-colors hover:bg-admin-surface shadow-xs cursor-pointer"
            >
              <span>👁️</span> Preview Full PDF
            </a>

            {document && (
              <button
                type="button"
                onClick={() => setShowShareModal(true)}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-black/15 bg-warm-ivory/60 py-2.5 text-xs font-semibold text-masaar-black shadow-xs hover:bg-light-gold/20 transition-all cursor-pointer"
              >
                <span>🔗</span> Share Link with Client
              </button>
            )}
          </div>
        </div>

        <Card className="!p-0">
          <div className="border-b border-black/10 bg-admin-surface px-4 py-2 text-xs font-semibold uppercase tracking-wide text-masaar-black/60">
            Live PDF Preview
          </div>
          <iframe key={iframeKey} src={renderUrl} className="h-[80vh] w-full" title={`${TYPE_LABEL[documentType]} PDF preview`} />
        </Card>
      </div>

      {document && (
        <ShareQuotationModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          document={document}
          shareToken={shareToken || documentId}
        />
      )}
    </div>
  );
}
