import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDocument, getDocumentItems, getDocumentTemplates, getDocumentVersions, getDocumentShares } from "@/lib/data/documents";
import {
  getSelectableHotels,
  getSelectableTransfers,
  getSelectablePrivateTrips,
  getSelectablePackages,
  getSelectableZiyaratOptions,
} from "@/lib/data/document-products";
import { InvoiceBuilder } from "./InvoiceBuilder";

export const metadata: Metadata = { title: "Invoice Builder | Masaar Admin", robots: { index: false } };

export default async function InvoiceBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const document = await getDocument(id);
  if (!document || document.document_type !== "invoice") notFound();

  const [items, templates, versions, shares, hotels, transfers, privateTrips, packages, ziyaratOptions] = await Promise.all([
    getDocumentItems(id),
    getDocumentTemplates("invoice"),
    getDocumentVersions(id),
    getDocumentShares(id),
    getSelectableHotels(),
    getSelectableTransfers(),
    getSelectablePrivateTrips(),
    getSelectablePackages(),
    getSelectableZiyaratOptions(),
  ]);

  const template = templates.find((t) => t.id === document.template_id) ?? templates.find((t) => t.is_default) ?? templates[0] ?? null;

  return (
    <InvoiceBuilder
      document={document}
      items={items}
      template={template}
      versions={versions}
      shares={shares}
      products={{ hotels, transfers, privateTrips, packages, ziyaratOptions }}
    />
  );
}
