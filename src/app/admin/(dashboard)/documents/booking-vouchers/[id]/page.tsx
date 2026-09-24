import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getDocument,
  getDocumentItems,
  getDocumentTemplates,
  getDocumentVersions,
  getDocumentShares,
  getReceiptsForInvoice,
} from "@/lib/data/documents";
import {
  getSelectableHotels,
  getSelectableTransfers,
  getSelectablePrivateTrips,
  getSelectablePackages,
  getSelectableZiyaratOptions,
} from "@/lib/data/document-products";
import { createAdminClient } from "@/lib/supabase/admin";
import type { DocumentRow } from "@/lib/types/database";
import { BookingVoucherBuilder } from "./BookingVoucherBuilder";

export const metadata: Metadata = { title: "Booking Confirmation & Vouchers | Masaar Admin", robots: { index: false } };

export default async function BookingVoucherDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;

  const document = await getDocument(id);
  if (!document || document.document_type !== "booking_voucher") notFound();

  const [
    items,
    templates,
    versions,
    shares,
    hotels,
    transfers,
    privateTrips,
    packages,
    ziyaratOptions,
  ] = await Promise.all([
    getDocumentItems(id),
    getDocumentTemplates("booking_voucher"),
    getDocumentVersions(id),
    getDocumentShares(id),
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

  // Resolve related Quotation, Invoice, and Receipts for the sidebar
  const supabase = createAdminClient();
  let quotation: DocumentRow | null = null;
  let invoice: DocumentRow | null = null;
  let receipts: DocumentRow[] = [];

  if (document.source_document_id) {
    const { data: sourceDoc } = await supabase
      .from("documents")
      .select("*")
      .eq("id", document.source_document_id)
      .maybeSingle<DocumentRow>();

    if (sourceDoc?.document_type === "quotation") {
      quotation = sourceDoc;
      // Check if an invoice was also generated from this quotation
      const { data: inv } = await supabase
        .from("documents")
        .select("*")
        .eq("source_document_id", sourceDoc.id)
        .eq("document_type", "invoice")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle<DocumentRow>();
      invoice = inv;
    } else if (sourceDoc?.document_type === "invoice") {
      invoice = sourceDoc;
      if (sourceDoc.source_document_id) {
        const { data: q } = await supabase
          .from("documents")
          .select("*")
          .eq("id", sourceDoc.source_document_id)
          .maybeSingle<DocumentRow>();
        quotation = q;
      }
    }
  }

  if (invoice) {
    receipts = await getReceiptsForInvoice(invoice.id);
  }

  return (
    <BookingVoucherBuilder
      document={document}
      items={items}
      template={template}
      versions={versions}
      shares={shares}
      products={{ hotels, transfers, privateTrips, packages, ziyaratOptions }}
      related={{ quotation, invoice, receipts }}
      initialTab={tab === "vouchers" ? "vouchers" : tab === "edit" ? "edit" : "confirmation"}
    />
  );
}
