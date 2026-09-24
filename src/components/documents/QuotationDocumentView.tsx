import Image from "next/image";
import type { DocumentItemRow, DocumentItemType, DocumentRow, DocumentTemplateRow } from "@/lib/types/database";

/**
 * The single branded rendering of a quotation — reused by the admin
 * Quotation Builder's live preview, the internal /doc-render PDF-capture
 * route, and the public /quote/[token] page. One implementation so the
 * PDF and the client-facing page can never visually drift apart.
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

/** whatsapp_settings/document_templates store the phone in wa.me format (e.g. "971557329320", no "+") — display it human-readable, same grouping as lib/contact.ts#CONTACT.phoneDisplay. */
function formatPhone(raw: string | null | undefined): string {
  if (!raw) return "+971 55 227 6299";
  const digits = raw.replace(/\D/g, "");
  const match = digits.match(/^971(\d{2})(\d{3})(\d{4})$/);
  return match ? `+971 ${match[1]} ${match[2]} ${match[3]}` : `+${digits}`;
}

const GROUP_LABELS: Record<DocumentItemType, string> = {
  umrah_package: "Package Overview",
  hajj_package: "Package Overview",
  hotel: "Accommodation",
  transfer: "Transportation",
  private_trip: "Private Trips & Ziyarat",
  flight: "Flights",
  service: "Additional Services",
  custom: "Additional Items",
};

const GROUP_ORDER: DocumentItemType[] = [
  "umrah_package",
  "hajj_package",
  "hotel",
  "transfer",
  "flight",
  "private_trip",
  "service",
  "custom",
];

function groupItems(items: DocumentItemRow[]) {
  const groups = new Map<string, DocumentItemRow[]>();
  for (const type of GROUP_ORDER) {
    const inGroup = items.filter((i) => i.item_type === type);
    if (inGroup.length > 0) groups.set(GROUP_LABELS[type], inGroup);
  }
  return Array.from(groups.entries());
}

export function QuotationDocumentView({
  document,
  items,
  template,
}: {
  document: DocumentRow;
  items: DocumentItemRow[];
  template: DocumentTemplateRow | null;
}) {
  const layout = template?.layout ?? "premium";
  const travellers = [
    document.adults ? `${document.adults} Adult${document.adults > 1 ? "s" : ""}` : null,
    document.children ? `${document.children} Child${document.children > 1 ? "ren" : ""}` : null,
  ]
    .filter(Boolean)
    .join(", ") || "—";

  const grouped = groupItems(items);
  const isMinimal = layout === "minimal";
  const isClassic = layout === "classic";

  return (
    <div className="mx-auto max-w-[820px] bg-white text-masaar-black" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
      <header
        className={`flex items-center justify-between px-10 py-8 ${
          isMinimal ? "border-b border-black/10" : "bg-masaar-black text-white"
        }`}
      >
        <div className="flex items-center gap-3">
          <Image src="/brand/logo.png" alt="Masaar Holidays" width={160} height={48} className="h-10 w-auto" unoptimized />
        </div>
        {!isMinimal && (
          <div className="text-right text-[10px] font-semibold tracking-[0.3em] text-pure-gold">
            <p>FAITH</p>
            <p>CLARITY</p>
            <p>CARE</p>
            <p>PEACE</p>
          </div>
        )}
      </header>

      {!isClassic && !isMinimal && (
        <div className="relative h-56 w-full overflow-hidden bg-masaar-black">
          <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 to-black/10 px-10 pb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-pure-gold">
              {document.document_type === "quotation" ? "Personalised Quotation" : document.document_type}
            </p>
            <h1 className="mt-2 text-3xl font-bold text-white">Your {document.journey_type ?? "Masaar"} Journey</h1>
          </div>
        </div>
      )}

      <div className={`flex flex-wrap items-center justify-between gap-4 border-b border-black/10 px-10 py-4 text-sm ${isMinimal ? "" : "bg-warm-ivory"}`}>
        <div>
          <p className="text-xs uppercase tracking-wide text-masaar-black/50">Prepared for</p>
          <p className="font-semibold">{document.client_name}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-masaar-black/50">Travel Dates</p>
          <p className="font-semibold">
            {formatDate(document.travel_date)} {document.return_date ? `– ${formatDate(document.return_date)}` : ""}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-masaar-black/50">Travellers</p>
          <p className="font-semibold">{travellers}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-masaar-black/50">{document.document_type === "quotation" ? "Quotation No." : "Document No."}</p>
          <p className="font-semibold">{document.document_number}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8 px-10 py-8">
        <div className="col-span-2 space-y-8">
          {grouped.length === 0 && (
            <p className="text-sm italic text-masaar-black/50">No items added yet.</p>
          )}
          {grouped.map(([label, groupItems]) => (
            <section key={label}>
              <h2 className="border-b border-pure-gold/40 pb-2 text-sm font-semibold uppercase tracking-wide text-masaar-black">{label}</h2>
              <div className="mt-3 space-y-3">
                {groupItems.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-4 text-sm">
                    <div>
                      <p className="font-semibold">{item.description}</p>
                      {item.details && <p className="text-masaar-black/60">{item.details}</p>}
                    </div>
                    <p className="shrink-0 whitespace-nowrap font-medium">{formatMoney(item.amount_aed)}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}

          {document.special_requirements && (
            <section>
              <h2 className="border-b border-pure-gold/40 pb-2 text-sm font-semibold uppercase tracking-wide">Special Requirements</h2>
              <p className="mt-3 text-sm text-masaar-black/70">{document.special_requirements}</p>
            </section>
          )}

          {document.notes && (
            <section>
              <h2 className="border-b border-pure-gold/40 pb-2 text-sm font-semibold uppercase tracking-wide">Notes</h2>
              <p className="mt-3 whitespace-pre-line text-sm text-masaar-black/70">{document.notes}</p>
            </section>
          )}

          {document.terms && (
            <section>
              <h2 className="border-b border-pure-gold/40 pb-2 text-sm font-semibold uppercase tracking-wide">Terms &amp; Conditions</h2>
              <p className="mt-3 whitespace-pre-line text-xs text-masaar-black/60">{document.terms}</p>
            </section>
          )}
        </div>

        <aside className="col-span-1">
          <div className="rounded-lg bg-masaar-black p-5 text-white">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-pure-gold">Summary</h3>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-white/60">Subtotal</dt>
                <dd>{formatMoney(document.subtotal_aed)}</dd>
              </div>
              {document.discount_aed > 0 && (
                <div className="flex justify-between">
                  <dt className="text-white/60">Discount</dt>
                  <dd>-{formatMoney(document.discount_aed)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-white/60">VAT (5%)</dt>
                <dd>{formatMoney(document.tax_aed)}</dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-white/15 pt-2 text-base font-bold text-pure-gold">
                <dt>Total</dt>
                <dd>{formatMoney(document.total_aed)}</dd>
              </div>
              {document.amount_paid_aed > 0 && (
                <>
                  <div className="flex justify-between">
                    <dt className="text-white/60">Paid</dt>
                    <dd>{formatMoney(document.amount_paid_aed)}</dd>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <dt>Balance Due</dt>
                    <dd>{formatMoney(document.total_aed - document.amount_paid_aed)}</dd>
                  </div>
                </>
              )}
            </dl>
          </div>
          {document.valid_until && (
            <p className="mt-3 text-center text-xs text-masaar-black/50">Valid until {formatDate(document.valid_until)}</p>
          )}
        </aside>
      </div>

      <footer className="border-t border-black/10 bg-warm-ivory px-10 py-6 text-center text-xs text-masaar-black/60">
        <p className="font-semibold text-masaar-black">Masaar Holidays</p>
        <p className="mt-1">
          {formatPhone(template?.company_phone)} · {template?.company_email ?? "care@masaarholidays.com"} ·{" "}
          {template?.company_website ?? "www.masaarholidays.com"}
        </p>
      </footer>
    </div>
  );
}
