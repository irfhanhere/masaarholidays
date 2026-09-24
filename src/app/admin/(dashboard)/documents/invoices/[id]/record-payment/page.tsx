import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDocument, getReceiptsForInvoice } from "@/lib/data/documents";
import { RecordPaymentPanel } from "./RecordPaymentPanel";

export const metadata: Metadata = { title: "Record Payment | Masaar Admin", robots: { index: false } };

export default async function RecordPaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await getDocument(id);
  if (!invoice || invoice.document_type !== "invoice") notFound();

  const receipts = await getReceiptsForInvoice(id);

  return <RecordPaymentPanel invoice={invoice} receipts={receipts} />;
}
