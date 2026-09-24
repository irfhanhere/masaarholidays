import type { DocumentItemRow, DocumentRow, DocumentTemplateRow } from "@/lib/types/database";
import { QuotationDocumentView } from "./QuotationDocumentView";
import { InvoiceDocumentView } from "./InvoiceDocumentView";
import { ReceiptDocumentView } from "./ReceiptDocumentView";
import { BookingConfirmationDocumentView } from "./BookingConfirmationDocumentView";

/**
 * Single dispatch point picking the right branded layout by document_type
 * — every render surface (admin live preview, /doc-render PDF capture,
 * the public /quote/[token] page) goes through this instead of each
 * re-implementing the same switch. `sourceDocumentNumber` is
 * receipt-only (the invoice it was paid against); every other type
 * ignores it.
 */
export function DocumentView({
  document,
  items,
  template,
  sourceDocumentNumber,
}: {
  document: DocumentRow;
  items: DocumentItemRow[];
  template: DocumentTemplateRow | null;
  sourceDocumentNumber?: string | null;
}) {
  switch (document.document_type) {
    case "invoice":
      return <InvoiceDocumentView document={document} items={items} template={template} />;
    case "receipt":
      return <ReceiptDocumentView document={document} template={template} invoiceNumber={sourceDocumentNumber} />;
    case "booking_voucher":
      return <BookingConfirmationDocumentView document={document} items={items} template={template} />;
    case "quotation":
    default:
      return <QuotationDocumentView document={document} items={items} template={template} />;
  }
}
