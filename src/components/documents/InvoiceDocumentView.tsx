import Image from "next/image";
import type { DocumentItemRow, DocumentRow, DocumentTemplateRow } from "@/lib/types/database";
import { PhoneIcon, MailIcon, DomeIcon, PlaneIcon, FamilyIcon, BedIcon, CarIcon, PassportIcon } from "@/components/site/icons";

/**
 * Branded Invoice layout — deliberately a separate component from
 * QuotationDocumentView (ivory letterhead + itemised table + bank/payment
 * details + signature, vs. the Quotation's black hero banner + grouped
 * package cards). Reused by the admin live preview, /doc-render (PDF
 * capture) and any future public invoice link, same one-implementation
 * principle as the quotation view.
 */

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

function GlobeIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.5 4 5.7 4 9s-1.5 6.5-4 9c-2.5-2.5-4-5.7-4-9s1.5-6.5 4-9Z" />
    </svg>
  );
}

const NOTES = [
  "This is a computer generated invoice and does not require a signature.",
  "Payment is due by the mentioned due date.",
  "All services are subject to availability and may be adjusted as per travel regulations.",
  "For any changes or cancellations, please refer to our terms & conditions.",
];

const SERVICES = [
  { label: "Holidays", Icon: PlaneIcon },
  { label: "Umrah", Icon: FamilyIcon },
  { label: "Hotels", Icon: BedIcon },
  { label: "Transfers", Icon: CarIcon },
  { label: "Visa", Icon: PassportIcon },
];

export function InvoiceDocumentView({
  document,
  items,
  template,
}: {
  document: DocumentRow;
  items: DocumentItemRow[];
  template: DocumentTemplateRow | null;
}) {
  return (
    <div className="mx-auto max-w-[820px] bg-warm-ivory text-masaar-black" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
      <div className="px-10 pt-10">
        <div className="flex items-start justify-between gap-6 pb-6">
          <Image src="/brand/logo.png" alt="Masaar Holidays" width={220} height={66} className="h-16 w-auto" unoptimized />

          <div className="text-sm">
            <p className="font-bold uppercase tracking-wide text-masaar-black">Masaar Holidays</p>
            <p className="text-xs text-masaar-black/60">A division of Masaar Travel &amp; Tourism L.L.C</p>
            <p className="text-xs text-masaar-black/60">{template?.company_address ?? "Al Zahia, Sharjah, United Arab Emirates"}</p>
          </div>

          <div className="space-y-1 text-xs text-masaar-black/70">
            <p className="flex items-center gap-2">
              <PhoneIcon className="size-3.5 text-pure-gold" /> {formatPhone(template?.company_phone)}
            </p>
            <p className="flex items-center gap-2">
              <MailIcon className="size-3.5 text-pure-gold" /> {template?.company_email ?? "care@masaarholidays.com"}
            </p>
            <p className="flex items-center gap-2">
              <GlobeIcon className="size-3.5 text-pure-gold" /> {template?.company_website ?? "www.masaarholidays.com"}
            </p>
          </div>

          <div className="whitespace-nowrap text-right text-[10px] font-semibold tracking-[0.3em] text-pure-gold">
            <p>FAITH</p>
            <p>CLARITY</p>
            <p>CARE</p>
            <p>PEACE</p>
          </div>
        </div>
        <div className="h-px w-full bg-pure-gold/50" />
      </div>

      <div className="flex flex-wrap items-start justify-between gap-6 px-10 pt-8">
        <div>
          <h1 className="text-4xl font-bold tracking-wide text-masaar-black">INVOICE</h1>
          <p className="mt-2 text-sm text-masaar-black/60">Thank you for choosing Masaar Holidays.</p>
          <p className="text-sm text-masaar-black/60">We are honoured to be part of your sacred journey.</p>
        </div>
        <dl className="space-y-1 text-sm">
          <div className="flex justify-between gap-6">
            <dt className="text-masaar-black/50">Invoice No</dt>
            <dd className="font-semibold">{document.document_number}</dd>
          </div>
          <div className="flex justify-between gap-6">
            <dt className="text-masaar-black/50">Issue Date</dt>
            <dd className="font-semibold">{formatDate(document.issue_date)}</dd>
          </div>
          <div className="flex justify-between gap-6">
            <dt className="text-masaar-black/50">Due Date</dt>
            <dd className="font-semibold">{formatDate(document.due_date)}</dd>
          </div>
          {document.booking_reference && (
            <div className="flex justify-between gap-6">
              <dt className="text-masaar-black/50">Booking Ref</dt>
              <dd className="font-semibold">{document.booking_reference}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="px-10 pt-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-pure-gold">Bill To</p>
        <p className="mt-1 font-semibold">{document.client_name}</p>
        {document.client_country && <p className="text-sm text-masaar-black/60">{document.client_country}</p>}
        {document.client_email && <p className="text-sm text-masaar-black/60">Email: {document.client_email}</p>}
        {document.client_phone && <p className="text-sm text-masaar-black/60">Phone: {document.client_phone}</p>}
      </div>

      <div className="px-10 pt-6">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="bg-pure-gold/90 text-left text-xs font-semibold uppercase tracking-wide text-white">
              <th className="rounded-l-md px-3 py-2">#</th>
              <th className="px-3 py-2">Description</th>
              <th className="px-3 py-2 text-right">Qty</th>
              <th className="px-3 py-2 text-right">Unit Price (AED)</th>
              <th className="rounded-r-md px-3 py-2 text-right">Amount (AED)</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-sm italic text-masaar-black/40">
                  No items added yet.
                </td>
              </tr>
            )}
            {items.map((item, i) => (
              <tr key={item.id} className={i % 2 === 0 ? "bg-white" : "bg-black/[0.02]"}>
                <td className="px-3 py-3 align-top">{i + 1}</td>
                <td className="px-3 py-3 align-top">
                  <p className="font-semibold">{item.description}</p>
                  {item.details && <p className="text-xs text-masaar-black/50">{item.details}</p>}
                </td>
                <td className="px-3 py-3 text-right align-top">{item.quantity}</td>
                <td className="px-3 py-3 text-right align-top">{item.unit_price_aed.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td className="px-3 py-3 text-right align-top font-semibold">{item.amount_aed.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 gap-8 px-10 pt-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-pure-gold">Payment Details</p>
          {template?.bank_name ? (
            <div className="mt-2 text-sm">
              <p className="font-semibold">Bank Transfer (AED)</p>
              <dl className="mt-1 space-y-0.5 text-xs text-masaar-black/70">
                <div className="flex gap-2">
                  <dt className="w-28 shrink-0 text-masaar-black/50">Bank Name</dt>
                  <dd>: {template.bank_name}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-28 shrink-0 text-masaar-black/50">Account Name</dt>
                  <dd>: {template.bank_account_name}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-28 shrink-0 text-masaar-black/50">Account No.</dt>
                  <dd>: {template.bank_account_number}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-28 shrink-0 text-masaar-black/50">IBAN</dt>
                  <dd>: {template.bank_iban}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-28 shrink-0 text-masaar-black/50">Swift Code</dt>
                  <dd>: {template.bank_swift_code}</dd>
                </div>
              </dl>
            </div>
          ) : (
            <p className="mt-2 text-xs text-masaar-black/40">Payment method: {document.payment_method ?? "Bank Transfer"}</p>
          )}
        </div>

        <div>
          <div className="rounded-md border border-pure-gold/30">
            <div className="flex justify-between px-4 py-2 text-sm">
              <span className="text-masaar-black/60">Subtotal</span>
              <span>{formatMoney(document.subtotal_aed)}</span>
            </div>
            {document.discount_aed > 0 && (
              <div className="flex justify-between px-4 py-2 text-sm">
                <span className="text-masaar-black/60">Discount</span>
                <span>-{formatMoney(document.discount_aed)}</span>
              </div>
            )}
            <div className="flex justify-between px-4 py-2 text-sm">
              <span className="text-masaar-black/60">VAT (5%)</span>
              <span>{formatMoney(document.tax_aed)}</span>
            </div>
            <div className="flex justify-between bg-pure-gold/90 px-4 py-2.5 text-sm font-bold text-white">
              <span>Total Amount</span>
              <span>{formatMoney(document.total_aed)}</span>
            </div>
          </div>

          {template?.blessing_note && (
            <div className="mt-4 flex items-start gap-3 rounded-md bg-black/[0.03] p-4">
              <DomeIcon className="size-6 shrink-0 text-pure-gold" />
              <p className="text-xs italic text-masaar-black/70">{template.blessing_note}</p>
            </div>
          )}
        </div>
      </div>

      <div className="px-10 pt-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-pure-gold">Notes</p>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-masaar-black/60">
          {NOTES.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </div>

      <div className="relative mt-10 h-40 w-full overflow-hidden">
        {template?.footer_image_url && (
          <Image src={template.footer_image_url} alt="" fill unoptimized className="object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-masaar-black/90 via-masaar-black/40 to-transparent" />
        <div className="absolute inset-0 flex items-end justify-between px-10 py-5">
          <p className="text-lg font-semibold leading-tight text-white">
            Journeys
            <br />
            That Bring You Closer
          </p>
          <div className="flex gap-4 text-white">
            {SERVICES.map(({ label, Icon }) => (
              <div key={label} className="flex flex-col items-center gap-1 text-[9px] uppercase tracking-wide">
                <Icon className="size-4" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
