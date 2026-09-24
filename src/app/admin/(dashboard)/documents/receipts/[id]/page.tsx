import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDocument, getDocumentTemplates } from "@/lib/data/documents";
import { createAdminClient } from "@/lib/supabase/admin";
import { ReceiptBuilder } from "./ReceiptBuilder";

export const metadata: Metadata = { title: "Receipt | Masaar Admin", robots: { index: false } };

export default async function ReceiptDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const document = await getDocument(id);
  if (!document || document.document_type !== "receipt") notFound();

  const templates = await getDocumentTemplates("receipt");
  const template =
    templates.find((t) => t.id === document.template_id) ??
    templates.find((t) => t.is_default) ??
    templates[0] ??
    null;

  // Resolve the source invoice number for the receipt header display
  let invoiceNumber: string | null = null;
  if (document.source_document_id) {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("documents")
      .select("document_number")
      .eq("id", document.source_document_id)
      .maybeSingle();
    invoiceNumber = data?.document_number ?? null;
  }

  return (
    <ReceiptBuilder
      document={document}
      template={template}
      invoiceNumber={invoiceNumber}
    />
  );
}
