import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getDocument,
  getDocumentItems,
  getDocumentTemplates,
  getDocumentVersions,
  getDocumentShares,
  ensureDocumentShare,
} from "@/lib/data/documents";
import {
  getSelectableHotels,
  getSelectableTransfers,
  getSelectablePrivateTrips,
  getSelectablePackages,
  getSelectableZiyaratOptions,
} from "@/lib/data/document-products";
import { QuotationBuilder } from "./QuotationBuilder";

export const metadata: Metadata = {
  title: "Quotation Builder | Masaar Admin",
  robots: { index: false },
};

export default async function QuotationBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const rawParams = await params;
  const id = decodeURIComponent(rawParams.id).trim().replace(/\s+/g, "-");

  const document = await getDocument(id);
  if (!document || document.document_type !== "quotation") notFound();

  const [
    items,
    templates,
    versions,
    shares,
    activeShare,
    hotels,
    transfers,
    privateTrips,
    packages,
    ziyaratOptions,
  ] = await Promise.all([
    getDocumentItems(id),
    getDocumentTemplates("quotation"),
    getDocumentVersions(id),
    getDocumentShares(id),
    ensureDocumentShare(id),
    getSelectableHotels(),
    getSelectableTransfers(),
    getSelectablePrivateTrips(),
    getSelectablePackages(),
    getSelectableZiyaratOptions(),
  ]);

  const template =
    templates.find((t) => t.id === document.template_id) ??
    templates.find((t) => t.is_default) ??
    templates[0] ??
    null;

  return (
    <QuotationBuilder
      document={document}
      items={items}
      template={template}
      versions={versions}
      shares={shares}
      activeShareToken={activeShare?.share_token}
      products={{ hotels, transfers, privateTrips, packages, ziyaratOptions }}
    />
  );
}
