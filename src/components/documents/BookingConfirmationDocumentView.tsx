import Image from "next/image";
import type { DocumentItemRow, DocumentRow, DocumentTemplateRow } from "@/lib/types/database";

function formatDate(value: string | null | undefined): string {
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

export function BookingConfirmationDocumentView({
  document,
  items,
  template,
}: {
  document: DocumentRow;
  items: DocumentItemRow[];
  template?: DocumentTemplateRow | null;
}) {
  const hotelItems = items.filter((i) => i.item_type === "hotel");
  const transferItems = items.filter((i) => i.item_type === "transfer");
  const flightItems = items.filter((i) => i.item_type === "flight");
  const packageItems = items.filter((i) => i.item_type === "umrah_package" || i.item_type === "hajj_package");
  const serviceItems = items.filter(
    (i) => i.item_type === "service" || i.item_type === "private_trip" || i.item_type === "custom"
  );

  const makkahHotel = hotelItems.find(
    (h) => h.description.toLowerCase().includes("makkah") || (h.details && h.details.toLowerCase().includes("makkah"))
  ) ?? hotelItems[0];

  const madinahHotel = hotelItems.find(
    (h) =>
      h !== makkahHotel &&
      (h.description.toLowerCase().includes("madinah") || (h.details && h.details.toLowerCase().includes("madinah")))
  ) ?? (hotelItems.length > 1 ? hotelItems[1] : null);

  const mainPackage = packageItems[0];
  const mainTransfer = transferItems[0];
  const mainFlight = flightItems[0];

  const travelDatesFormatted =
    document.travel_date && document.return_date
      ? `${formatDate(document.travel_date)} – ${formatDate(document.return_date)}`
      : document.travel_date
      ? formatDate(document.travel_date)
      : "Dates as per itinerary";

  const travellerParts = [];
  if (document.adults) travellerParts.push(`${document.adults} Adult${document.adults > 1 ? "s" : ""}`);
  if (document.children) travellerParts.push(`${document.children} Child${document.children > 1 ? "ren" : ""}`);
  if (document.infants) travellerParts.push(`${document.infants} Infant${document.infants > 1 ? "s" : ""}`);
  const travellerString = travellerParts.length > 0 ? travellerParts.join(", ") : "Travellers confirmed";

  return (
    <div
      className="mx-auto max-w-[850px] bg-white text-masaar-black shadow-sm print:shadow-none"
      style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
    >
      {/* ── TOP HEADER BANNER ── */}
      <div className="relative overflow-hidden border-b border-black/10 bg-gradient-to-r from-[#FAF8F5] via-[#F4EFE6] to-[#FAF8F5] px-8 py-6">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Image
              src="/brand/logo.png"
              alt="Masaar Holidays"
              width={180}
              height={54}
              className="h-12 w-auto object-contain"
              unoptimized
            />
          </div>

          <div className="hidden border-l border-pure-gold/30 pl-4 text-left text-[10px] font-semibold tracking-[0.25em] text-pure-gold sm:block">
            <p>FAITH</p>
            <p>CLARITY</p>
            <p>CARE</p>
            <p>PEACE</p>
          </div>

          <div className="text-right">
            <p className="text-[11px] font-medium tracking-[0.2em] text-masaar-black/70 uppercase">
              A Journey of Faith
            </p>
            <p className="text-[10px] tracking-[0.18em] text-pure-gold uppercase">
              A Legacy of Service
            </p>
          </div>
        </div>
      </div>

      <div className="p-8 sm:p-10">
        {/* ── TITLE & TOP METADATA ROW ── */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-6 border-b border-black/10 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-masaar-black uppercase">
              Booking Confirmation
            </h1>
            <p className="mt-1 text-sm text-masaar-black/70">
              Thank you for choosing Masaar Holidays. We are honoured to be part of your sacred journey.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider text-masaar-black/50">Booking Ref</p>
              <p className="font-mono text-base font-bold text-masaar-black">
                {document.booking_reference || `MH-BKG-${document.document_number.replace(/^BV-/, "")}`}
              </p>
              <p className="text-xs text-masaar-black/60">{formatDate(document.issue_date || document.created_at)}</p>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 border border-emerald-200">
              <div className="flex size-7 items-center justify-center rounded-full bg-emerald-600 text-white">
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  {document.status === "cancelled" ? "Cancelled" : "Confirmed"}
                </p>
                <p className="text-[10px] text-emerald-700 leading-tight">
                  {document.status === "cancelled" ? "Arrangements cancelled" : "All arrangements in progress"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── 6-BOX DETAILS GRID (MATCHING INSPIRATION) ── */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* 1. Client Details */}
          <div className="rounded-xl border border-black/10 bg-[#FAF9F6] p-5">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-pure-gold/15 text-deep-gold">
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="font-semibold text-masaar-black">Client Details</h2>
            </div>
            <div className="space-y-1 text-sm text-masaar-black/80">
              <p className="font-bold text-masaar-black">{document.client_name}</p>
              <p>{document.client_country || document.origin || "Dubai, UAE"}</p>
              <p className="text-xs text-masaar-black/70">{document.client_phone || "—"}</p>
              <p className="text-xs text-masaar-black/70">{document.client_email || "—"}</p>
            </div>
          </div>

          {/* 2. Journey Details */}
          <div className="rounded-xl border border-black/10 bg-[#FAF9F6] p-5">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-pure-gold/15 text-deep-gold">
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="font-semibold text-masaar-black">Journey Details</h2>
            </div>
            <div className="space-y-1 text-sm text-masaar-black/80">
              <p className="font-bold text-masaar-black">
                {mainPackage ? mainPackage.description : (document.destination ? `${document.destination} Journey` : "Umrah Sacred Journey")}
              </p>
              {mainPackage?.details && (
                <p className="text-xs text-masaar-black/70">{mainPackage.details}</p>
              )}
              <div className="mt-2 pt-2 border-t border-black/5 text-xs space-y-0.5">
                <p>
                  <span className="font-medium text-masaar-black/60">Travel Dates:</span> {travelDatesFormatted}
                </p>
                <p>
                  <span className="font-medium text-masaar-black/60">Travellers:</span> {travellerString}
                </p>
              </div>
            </div>
          </div>

          {/* 3. Accommodation */}
          <div className="rounded-xl border border-black/10 bg-[#FAF9F6] p-5">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-pure-gold/15 text-deep-gold">
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h2 className="font-semibold text-masaar-black">Accommodation</h2>
            </div>
            <div className="space-y-3 text-sm text-masaar-black/80">
              {hotelItems.length === 0 ? (
                <div>
                  <p className="font-bold text-masaar-black">Makkah Hotel</p>
                  <p className="text-xs text-masaar-black/70">5-Star Luxury Hotel — Room Confirmed</p>
                </div>
              ) : (
                <>
                  {makkahHotel && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-pure-gold">Makkah</p>
                      <p className="font-bold text-masaar-black">{makkahHotel.description}</p>
                      <p className="text-xs text-masaar-black/70">
                        {makkahHotel.details || `${makkahHotel.quantity} Night${makkahHotel.quantity > 1 ? "s" : ""} – Confirmed Room`}
                      </p>
                    </div>
                  )}
                  {madinahHotel && (
                    <div className="pt-2 border-t border-black/5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-pure-gold">Madinah</p>
                      <p className="font-bold text-masaar-black">{madinahHotel.description}</p>
                      <p className="text-xs text-masaar-black/70">
                        {madinahHotel.details || `${madinahHotel.quantity} Night${madinahHotel.quantity > 1 ? "s" : ""} – Confirmed Room`}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* 4. Transportation */}
          <div className="rounded-xl border border-black/10 bg-[#FAF9F6] p-5">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-pure-gold/15 text-deep-gold">
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h8m-8 4h8m-6 4h4m-8 6h12a2 2 0 002-2V5a2 2 0 00-2-2H6a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="font-semibold text-masaar-black">Transportation</h2>
            </div>
            <div className="space-y-1.5 text-sm text-masaar-black/80">
              {mainTransfer ? (
                <>
                  <p className="font-bold text-masaar-black">{mainTransfer.description}</p>
                  <p className="text-xs text-masaar-black/70">
                    {mainTransfer.details || "Airport – Makkah – Madinah – Airport (Private Chauffeur)"}
                  </p>
                </>
              ) : (
                <>
                  <p className="font-bold text-masaar-black">Private Chauffeur Transfer</p>
                  <p className="text-xs text-masaar-black/70">GMC Yukon / Luxury Fleet as per confirmed itinerary</p>
                </>
              )}
              <p className="text-[11px] text-masaar-black/60 pt-1">
                Full route coverage with dedicated meet &amp; greet assistance.
              </p>
            </div>
          </div>

          {/* 5. Flights */}
          <div className="rounded-xl border border-black/10 bg-[#FAF9F6] p-5">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-pure-gold/15 text-deep-gold">
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="font-semibold text-masaar-black">Flights</h2>
            </div>
            <div className="space-y-1.5 text-sm text-masaar-black/80">
              {mainFlight ? (
                <>
                  <p className="font-bold text-masaar-black">{mainFlight.description}</p>
                  <p className="text-xs text-masaar-black/70">{mainFlight.details || "Confirmed Flight Schedule"}</p>
                </>
              ) : (
                <>
                  <p className="font-bold text-masaar-black">Commercial Airline Flights</p>
                  <p className="text-xs text-masaar-black/70">DXB – JED – MED – DXB (Direct / One-Stop)</p>
                </>
              )}
              <p className="text-[11px] text-masaar-black/60 pt-1">
                E-tickets issued separately with airline PNR.
              </p>
            </div>
          </div>

          {/* 6. Additional Services */}
          <div className="rounded-xl border border-black/10 bg-[#FAF9F6] p-5">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-pure-gold/15 text-deep-gold">
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="font-semibold text-masaar-black">Additional Services</h2>
            </div>
            <div className="space-y-2 text-xs text-masaar-black/80">
              {serviceItems.length > 0 ? (
                serviceItems.map((svc) => (
                  <div key={svc.id} className="flex items-start gap-2">
                    <span className="mt-0.5 flex size-4 items-center justify-center rounded-full bg-pure-gold/20 text-deep-gold">
                      ✓
                    </span>
                    <span>
                      <strong className="font-semibold text-masaar-black">{svc.description}</strong>
                      {svc.details && <span className="text-masaar-black/65"> — {svc.details}</span>}
                    </span>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 flex size-4 items-center justify-center rounded-full bg-pure-gold/20 text-deep-gold">
                      ✓
                    </span>
                    <span>VIP Meet &amp; Assist at Airport</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 flex size-4 items-center justify-center rounded-full bg-pure-gold/20 text-deep-gold">
                      ✓
                    </span>
                    <span>Historical Ziyarat in Makkah &amp; Madinah</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 flex size-4 items-center justify-center rounded-full bg-pure-gold/20 text-deep-gold">
                      ✓
                    </span>
                    <span>24/7 Dedicated On-Ground Travel Assistance</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 flex size-4 items-center justify-center rounded-full bg-pure-gold/20 text-deep-gold">
                      ✓
                    </span>
                    <span>Complimentary Zamzam Water on Departure</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── QURANIC VERSE CALLOUT BANNER ── */}
        <div className="mt-8 rounded-xl border border-pure-gold/30 bg-gradient-to-r from-[#FAF6EE] via-[#F6EEDD] to-[#FAF6EE] p-6 text-center shadow-xs">
          <p className="text-base sm:text-lg font-serif italic text-masaar-black">
            “And complete the Hajj and Umrah for Allah...”
          </p>
          <p className="mt-1 text-xs tracking-wider text-pure-gold font-semibold uppercase">
            Surah Al-Baqarah (2:196)
          </p>
        </div>

        {/* ── SPECIAL REQUIREMENTS / NOTES ── */}
        {(document.special_requirements || document.notes) && (
          <div className="mt-6 rounded-xl border border-black/10 bg-[#FAF9F6] p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-masaar-black/60 mb-2">
              Important Notes &amp; Special Requests
            </h3>
            <p className="text-xs text-masaar-black/75 whitespace-pre-line leading-relaxed">
              {document.special_requirements || document.notes}
            </p>
          </div>
        )}

        {/* ── BRAND FOOTER BAR ── */}
        <div className="mt-10 border-t border-black/10 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-masaar-black/70">
            <div>
              <p className="font-bold text-masaar-black">Masaar Holidays</p>
              <p className="text-[11px] text-masaar-black/60">A Journey of Faith. A Legacy of Service.</p>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <p className="flex items-center gap-1.5">
                <span className="text-pure-gold">☎</span> {formatPhone(template?.company_phone)}
              </p>
              <p className="flex items-center gap-1.5">
                <span className="text-pure-gold">✉</span> {template?.company_email ?? "care@masaarholidays.com"}
              </p>
              <p className="flex items-center gap-1.5">
                <span className="text-pure-gold">🌐</span> {template?.company_website ?? "www.masaarholidays.com"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
