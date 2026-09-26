import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDocument, getDocumentItems, getDocumentTemplates, ensureDocumentShare } from "@/lib/data/documents";
import { GenerateQuotationPdf } from "./GenerateQuotationPdf";

export const metadata: Metadata = {
  title: "Generate Quotation PDF | Masaar Admin",
  robots: { index: false },
};

export default async function GenerateQuotationPdfPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const rawParams = await params;
  const id = decodeURIComponent(rawParams.id).trim().replace(/\s+/g, "-");

  const document = await getDocument(id);
  if (!document || document.document_type !== "quotation") notFound();

  const [items, templates, share] = await Promise.all([
    getDocumentItems(id),
    getDocumentTemplates("quotation"),
    ensureDocumentShare(id),
  ]);

  const template =
    templates.find((t) => t.id === document.template_id) ??
    templates.find((t) => t.is_default) ??
    templates[0] ??
    null;

  return (
    <GenerateQuotationPdf
      document={document}
      items={items}
      template={template}
      shareToken={share?.share_token}
    />
  );
}
