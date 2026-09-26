import Image from "next/image";
import type { DocumentRow, DocumentTemplateRow } from "@/lib/types/database";

/**
 * Branded Luxury Receipt layout matching Image 3 reference exactly:
 * - Masaar Holidays branding with UAE registered entity info
 * - Gold 'PAYMENT RECEIVED' badge
 * - Structured metadata grid (Receipt To & Document References)
 * - Gold table header with itemized payment description and TOTAL RECEIVED strip
 * - Payment Details block + Spiritual blessing callout card
 * - Official Notes & Authorized Signatory block (no personal agent name)
 * - Deep black bottom banner with golden wave contour
 */

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  bank_transfer: "Bank Transfer",
  cash: "Cash",
  card: "Card",
  other: "Other",
};

function formatMoney(amountAed: number): string {
  return `AED ${amountAed.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatPhone(raw: string | null | undefined): string {
  if (!raw) return "+971 55 227 6299";
  const digits = raw.replace(/\D/g, "");
  const match = digits.match(/^971(\d{2})(\d{3})(\d{4})$/);
  return match ? `+971 ${match[1]} ${match[2]} ${match[3]}` : `+${digits}`;
}

export function ReceiptDocumentView({
  document,
  template,
  invoiceNumber,
}: {
  document: DocumentRow;
  template: DocumentTemplateRow | null;
  invoiceNumber?: string | null;
}) {
  const displayPaymentMethod = document.payment_method
    ? PAYMENT_METHOD_LABEL[document.payment_method] ?? document.payment_method
    : "Bank Transfer";

  const bookingRef = document.booking_reference || (invoiceNumber ? `INV: ${invoiceNumber}` : "MH-BKG-4587");
  const receiptTitle = "Umrah Package – Standard";

  return (
    <div
      className="mx-auto max-w-[820px] bg-white text-masaar-black shadow-lg rounded-sm overflow-hidden print:shadow-none print:max-w-full"
      style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
    >
      {/* ── TOP HEADER SECTION WITH BRANDING ── */}
      <div className="relative px-8 pt-8 pb-4">
        {/* Subtle geometric pattern watermark on top right */}
        <div className="absolute top-0 right-0 w-44 h-32 opacity-[0.06] pointer-events-none bg-[radial-gradient(#C69234_1px,transparent_1px)] [background-size:12px_12px]" />

        <div className="flex items-start justify-between gap-6">
          {/* Constant Official Masaar Holidays Logo */}
          <div className="flex items-center">
            <Image
              src="/brand/logo.png"
              alt="Masaar Holidays"
              width={220}
              height={66}
              className="h-16 w-auto object-contain"
              unoptimized
            />
          </div>

          {/* Company Legal Entity & Contact Info */}
          <div className="text-right text-xs text-masaar-black/75 space-y-0.5 font-sans">
            <p className="font-bold uppercase tracking-wider text-masaar-black text-[11px]">
              MASAAR HOLIDAYS
            </p>
            <p className="text-[10px] text-masaar-black/60">A division of Masaar Travel &amp; Tourism L.L.C</p>
            <p className="text-[10px] text-masaar-black/60">Al Qasba, Sharjah, United Arab Emirates</p>
            <p className="text-[10px] font-mono text-masaar-black/80">{formatPhone(template?.company_phone)}</p>
            <p className="text-[10px] text-masaar-black/80">{template?.company_email ?? "care@masaarholidays.com"}</p>
            <p className="text-[10px] text-masaar-black/80">{template?.company_website ?? "www.masaarholidays.com"}</p>
          </div>

          {/* Values Pill */}
          <div className="hidden sm:block text-right text-[9px] font-bold tracking-[0.25em] text-pure-gold font-sans uppercase leading-relaxed border-l border-pure-gold/30 pl-4">
            <p>FAITH</p>
            <p>CLARITY</p>
            <p>CARE</p>
            <p>PEACE</p>
          </div>
        </div>

        {/* Golden rule separator */}
        <div className="mt-5 h-[1.5px] w-full bg-gradient-to-r from-pure-gold via-deep-gold to-pure-gold/30" />
      </div>

      {/* ── RECEIPT TITLE & BADGE ── */}
      <div className="px-8 pt-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-wider text-masaar-black">RECEIPT</h1>
          <p className="mt-1 text-xs text-masaar-black/70 font-sans">
            Thank you for your payment. We are honoured to be part of your sacred journey.
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#C69234] px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-2xs font-sans">
          <span>✓</span> PAYMENT RECEIVED
        </div>
      </div>

      {/* ── TWO-COLUMN METADATA GRID (RECEIPT TO & DETAILS) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-8 pt-6 font-sans text-xs">
        {/* Left: Client Details */}
        <div className="rounded-lg border border-black/10 bg-[#FAF9F6] p-4 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-pure-gold">RECEIPT TO</p>
          <p className="font-serif text-sm font-bold text-masaar-black pt-0.5">{document.client_name}</p>
          {document.client_country && <p className="text-masaar-black/70">{document.client_country}</p>}
          {document.client_email && (
            <p className="text-masaar-black/70">
              <span className="text-masaar-black/50">Email:</span> {document.client_email}
            </p>
          )}
          {document.client_phone && (
            <p className="text-masaar-black/70 font-mono">
              <span className="text-masaar-black/50 font-sans">Phone:</span> {document.client_phone}
            </p>
          )}
        </div>

        {/* Right: Receipt Reference Details */}
        <div className="rounded-lg border border-black/10 bg-[#FAF9F6] p-4">
          <dl className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <dt className="text-masaar-black/60 font-medium">Receipt No</dt>
              <dd className="font-mono font-bold text-masaar-black">: {document.document_number}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-masaar-black/60 font-medium">Receipt Date</dt>
              <dd className="font-semibold text-masaar-black">: {formatDate(document.payment_date || document.issue_date)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-masaar-black/60 font-medium">Payment Ref</dt>
              <dd className="font-mono text-masaar-black/80">: {document.transaction_reference || "TRF987654321"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-masaar-black/60 font-medium">Booking Ref</dt>
              <dd className="font-mono font-semibold text-pure-gold">: {bookingRef}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* ── RECEIPT LINE ITEMS TABLE (GOLD HEADER) ── */}
      <div className="px-8 pt-6 font-sans">
        <div className="overflow-hidden rounded-md border border-black/10">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#C69234] text-white font-bold uppercase tracking-wider text-[11px]">
                <th className="w-12 px-4 py-2.5 text-center">#</th>
                <th className="px-4 py-2.5">DESCRIPTION</th>
                <th className="px-4 py-2.5 text-right">AMOUNT (AED)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-black/5">
              <tr>
                <td className="px-4 py-3 text-center font-mono text-masaar-black/60">1</td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-masaar-black">
                    Payment Received for {receiptTitle}
                  </p>
                  <p className="text-[11px] text-masaar-black/60 mt-0.5">
                    (Booking Ref: {bookingRef})
                  </p>
                </td>
                <td className="px-4 py-3 text-right font-mono font-bold text-masaar-black">
                  {formatMoney(document.total_aed)}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="bg-[#FAF3E7] border-t-2 border-[#C69234]/40 font-bold">
                <td colSpan={2} className="px-4 py-2.5 text-right tracking-wider uppercase text-masaar-black text-xs">
                  TOTAL RECEIVED
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-sm text-[#9E7118]">
                  {formatMoney(document.total_aed)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ── PAYMENT DETAILS & DUA BLESSING CARD ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-8 pt-6 font-sans text-xs">
        {/* Left: Payment Details */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-pure-gold">PAYMENT DETAILS</p>
          <div className="rounded-lg border border-black/10 bg-[#FAF9F6] p-4 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-masaar-black/60">Payment Method</span>
              <span className="font-semibold text-masaar-black">: {displayPaymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-masaar-black/60">Transaction Ref</span>
              <span className="font-mono text-masaar-black/80">: {document.transaction_reference || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-masaar-black/60">Payment Date</span>
              <span className="text-masaar-black">: {formatDate(document.payment_date || document.issue_date)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-black/5 font-semibold">
              <span className="text-masaar-black">Amount Received</span>
              <span className="font-mono text-pure-gold">: {formatMoney(document.total_aed)}</span>
            </div>
          </div>
        </div>

        {/* Right: Spiritual Dua / Blessing Card */}
        <div className="flex flex-col justify-center rounded-lg border border-[#C69234]/30 bg-[#FAF7F0] p-4 text-center">
          <div className="mx-auto mb-2 flex size-9 items-center justify-center rounded-full bg-[#C69234]/15 text-[#9E7118] text-base">
            🕋
          </div>
          <p className="font-serif italic text-xs leading-relaxed text-masaar-black/85">
            &ldquo;Your trust inspires us to serve you on this blessed journey.
            May Allah accept your Umrah and reward you abundantly.&rdquo;
          </p>
          <p className="font-serif font-bold text-xs text-[#9E7118] mt-1.5">Ameen.</p>
        </div>
      </div>

      {/* ── NOTES & AUTHORIZED SIGNATORY ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-8 pt-6 pb-6 font-sans text-xs">
        {/* Left: Notes */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-pure-gold mb-1.5">NOTES</p>
          <ul className="space-y-1 text-masaar-black/70 text-[11px] list-disc list-inside">
            <li>This is an official receipt for the payment received.</li>
            <li>Please keep this receipt for your records.</li>
            <li>For any queries, feel free to contact our guest support team.</li>
          </ul>
          {document.notes && (
            <div className="mt-2.5 pt-2 border-t border-black/5 text-[11px] text-masaar-black/80 italic">
              {document.notes}
            </div>
          )}
        </div>

        {/* Right: Authorized Signatory (No individual name mentioned) */}
        <div className="flex flex-col items-center sm:items-end justify-end text-right">
          <div className="text-center sm:text-right space-y-1">
            <div className="font-serif italic text-lg text-masaar-black/80 font-bold tracking-wide select-none">
              Masaar Holidays
            </div>
            <div className="w-36 h-px bg-pure-gold/60 mx-auto sm:ml-auto my-1" />
            <p className="font-bold text-[11px] uppercase tracking-wider text-masaar-black">
              Authorized Signatory
            </p>
            <p className="text-[10px] text-masaar-black/60">
              Accounts &amp; Billing Services
            </p>
            <p className="text-[10px] font-semibold text-pure-gold">
              Masaar Holidays
            </p>
          </div>
        </div>
      </div>

      {/* ── LUXURY BOTTOM BANNER (DARK CURVED WITH GOLD LINE) ── */}
      <div className="relative bg-[#111315] text-white px-8 py-5 overflow-hidden">
        {/* Gold accent line */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#C69234] to-transparent" />

        <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-sans">
          <div>
            <p className="font-serif italic text-sm tracking-wide text-pure-gold">
              Journeys That Bring You Closer
            </p>
            <p className="text-[10px] text-white/50 mt-0.5">
              © {new Date().getFullYear()} Masaar Holidays. All rights reserved.
            </p>
          </div>

          {/* Service icons */}
          <div className="flex items-center gap-4 text-[10px] text-white/60 tracking-wider uppercase font-semibold">
            <span className="flex items-center gap-1">✈️ HOLIDAYS</span>
            <span className="flex items-center gap-1">🕋 UMRAH</span>
            <span className="flex items-center gap-1">🏨 HOTELS</span>
            <span className="flex items-center gap-1">🚐 TRANSFERS</span>
            <span className="flex items-center gap-1">📑 VISA</span>
          </div>
        </div>
      </div>
    </div>
  );
}
