import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDocument, getDocumentVersions, ensureDocumentShare } from "@/lib/data/documents";
import { QuotationVersionHistory } from "./QuotationVersionHistory";

export const metadata: Metadata = {
  title: "Quotation Version History | Masaar Admin",
  robots: { index: false },
};

export default async function QuotationVersionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const document = await getDocument(id);
  if (!document || document.document_type !== "quotation") notFound();

  const [versions, share] = await Promise.all([
    getDocumentVersions(id),
    ensureDocumentShare(id),
  ]);

  return (
    <QuotationVersionHistory
      document={document}
      versions={versions}
      shareToken={share?.share_token}
    />
  );
}
