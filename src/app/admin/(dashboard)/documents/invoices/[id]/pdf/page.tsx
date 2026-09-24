import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDocument, getDocumentTemplates } from "@/lib/data/documents";
import { signDocumentRenderToken } from "@/lib/documents/render-token";
import { GeneratePdfPanel } from "@/components/documents/GeneratePdfPanel";

export const metadata: Metadata = { title: "Generate Invoice PDF | Masaar Admin", robots: { index: false } };

export default async function GenerateInvoicePdfPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const document = await getDocument(id);
  if (!document) notFound();

  const templates = await getDocumentTemplates("invoice");
  const renderUrl = `/doc-render/${id}?key=${signDocumentRenderToken(id)}`;

  return (
    <GeneratePdfPanel
      documentId={id}
      documentType="invoice"
      documentNumber={document.document_number}
      basePath="/admin/documents/invoices"
      moduleLabel="Invoices"
      templates={templates}
      currentTemplateId={document.template_id}
      renderUrl={renderUrl}
    />
  );
}
