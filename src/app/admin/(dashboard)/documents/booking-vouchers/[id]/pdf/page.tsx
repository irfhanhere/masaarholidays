import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDocument, getDocumentTemplates } from "@/lib/data/documents";
import { signDocumentRenderToken } from "@/lib/documents/render-token";
import { GeneratePdfPanel } from "@/components/documents/GeneratePdfPanel";

export const metadata: Metadata = { title: "Generate Booking Voucher PDF | Masaar Admin", robots: { index: false } };

export default async function GenerateBookingVoucherPdfPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const document = await getDocument(id);
  if (!document || document.document_type !== "booking_voucher") notFound();

  const templates = await getDocumentTemplates("booking_voucher");
  const renderUrl = `/doc-render/${id}?key=${signDocumentRenderToken(id)}`;

  return (
    <GeneratePdfPanel
      documentId={id}
      documentType="booking_voucher"
      documentNumber={document.document_number}
      basePath="/admin/documents/booking-vouchers"
      moduleLabel="Booking Vouchers"
      templates={templates}
      currentTemplateId={document.template_id}
      renderUrl={renderUrl}
    />
  );
}
