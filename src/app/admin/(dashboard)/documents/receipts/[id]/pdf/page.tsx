import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDocument, getDocumentTemplates } from "@/lib/data/documents";
import { signDocumentRenderToken } from "@/lib/documents/render-token";
import { GeneratePdfPanel } from "@/components/documents/GeneratePdfPanel";

export const metadata: Metadata = { title: "Generate Receipt PDF | Masaar Admin", robots: { index: false } };

export default async function GenerateReceiptPdfPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const document = await getDocument(id);
  if (!document || document.document_type !== "receipt") notFound();

  const templates = await getDocumentTemplates("receipt");
  const renderUrl = `/doc-render/${id}?key=${signDocumentRenderToken(id)}`;

  return (
    <GeneratePdfPanel
      documentId={id}
      documentType="receipt"
      documentNumber={document.document_number}
      basePath="/admin/documents/receipts"
      moduleLabel="Receipts"
      templates={templates}
      currentTemplateId={document.template_id}
      renderUrl={renderUrl}
    />
  );
}
