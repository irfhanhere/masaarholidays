import Image from "next/image";
import type { DocumentItemRow, DocumentRow, DocumentTemplateRow } from "@/lib/types/database";
import { getHotelImage, getTransportImage } from "@/lib/documents/images";
import { generateItineraryForDays, type ItineraryDay } from "@/lib/documents/itinerary";
import { resolveHotelMealPlan } from "@/lib/documents/calculations";
import { extractFlightMetadata } from "@/lib/documents/flight-attachment";

function formatMoney(amountAed: number | null | undefined): string {
  return `AED ${Number(amountAed ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

import { formatDeterministicDate } from "@/lib/date-utils";

function formatDate(value: string | null): string {
  return formatDeterministicDate(value);
}

function formatPhone(raw: string | null | undefined): string {
  if (!raw) return "+971 55 227 6299";
  const digits = raw.replace(/\D/g, "");
  const match = digits.match(/^971(\d{2})(\d{3})(\d{4})$/);
  return match ? `+971 ${match[1]} ${match[2]} ${match[3]}` : `+${digits}`;
}

export const PDF_PAGE_SECTIONS = [
  { id: "cover", label: "Cover Page" },
  { id: "client_details", label: "Client Details" },
  { id: "package_overview", label: "Package Overview" },
  { id: "accommodation", label: "Accommodation" },
  { id: "transportation", label: "Transportation" },
  { id: "ziyarat", label: "Sightseeing & Ziyarat" },
  { id: "flights", label: "Flights" },
  { id: "services", label: "Additional Services" },
  { id: "itinerary", label: "Itinerary" },
  { id: "inclusions", label: "Inclusions" },
  { id: "exclusions", label: "Exclusions" },
  { id: "pricing", label: "Pricing & Breakdown" },
  { id: "terms", label: "Terms & Conditions" },
  { id: "thankyou", label: "Thank You Page" },
];

export function QuotationDocumentView({
  document,
  items,
  template,
  selectedPageId,
  enabledSections,
  customCoverMessage,
  showLogo = true,
  showFooter = true,
  showPageNumbers = true,
}: {
  document: DocumentRow;
  items: DocumentItemRow[];
  template?: DocumentTemplateRow | null;
  selectedPageId?: string | null;
  enabledSections?: Set<string> | string[];
  customCoverMessage?: string;
  showLogo?: boolean;
  showFooter?: boolean;
  showPageNumbers?: boolean;
}) {
  const layout = template?.layout ?? "premium";
  const isMinimal = layout === "minimal";
  const isClassic = layout === "classic";

  const enabledSet = enabledSections instanceof Set
    ? enabledSections
    : new Set(enabledSections ?? PDF_PAGE_SECTIONS.map((s) => s.id));

  const travellers = [
    document.adults ? `${document.adults} Adult${document.adults > 1 ? "s" : ""}` : null,
    document.children ? `${document.children} Child${document.children > 1 ? "ren" : ""}` : null,
    document.infants ? `${document.infants} Infant${document.infants > 1 ? "s" : ""}` : null,
  ]
    .filter(Boolean)
    .join(", ") || "2 Adults";

  // Calculate duration label and days count from travel and return dates
  let calculatedDurationDays = 4;
  const durationLabel = (() => {
    if (document.travel_date && document.return_date) {
      try {
        const start = new Date(document.travel_date);
        const end = new Date(document.return_date);
        const diffMs = end.getTime() - start.getTime();
        if (diffMs > 0) {
          const nights = Math.round(diffMs / (1000 * 60 * 60 * 24));
          const days = nights + 1;
          calculatedDurationDays = days;
          return `${days} Days / ${nights} Nights`;
        }
      } catch {}
    }
    return "Flexible Duration";
  })();

  const isHajj = document.journey_type === "hajj";
  const packageItem = items.find((i) => ["umrah_package", "hajj_package"].includes(i.item_type));
  const hotelItems = items.filter((i) => i.item_type === "hotel" || (i.item_type as any) === "accommodation");
  const transferItems = items.filter((i) => i.item_type === "transfer");
  const flightItems = items.filter((i) => i.item_type === "flight");

  // Parse itinerary — stored in special_requirements as JSON array with {day, title, desc} shape.
  let activeItinerary: ItineraryDay[] = [];
  let isItineraryExplicitlyRemoved = false;
  if (document.special_requirements) {
    try {
      const parsed = JSON.parse(document.special_requirements);
      if (Array.isArray(parsed)) {
        if (parsed.length > 0 && parsed[0]?.title !== undefined) {
          activeItinerary = parsed;
        } else if (parsed.length === 0) {
          isItineraryExplicitlyRemoved = true;
        }
      }
    } catch {}
  }
  if (!isItineraryExplicitlyRemoved && activeItinerary.length === 0) {
    activeItinerary = generateItineraryForDays(calculatedDurationDays, isHajj);
  }

  // Filter sections to render
  const sectionsToRender = PDF_PAGE_SECTIONS.filter((sec) => {
    if (!enabledSet.has(sec.id)) return false;
    if (selectedPageId && selectedPageId !== "all" && selectedPageId !== sec.id) return false;
    return true;
  });

  const totalPages = enabledSet.size || 12;

  // Reusable Page Header
  const renderPageHeader = (pageTitle: string) => (
    <div className="flex items-center justify-between border-b border-[#d4af37]/30 pb-3 mb-6">
      <div className="flex items-center gap-3">
        {showLogo && (
          <Image
            src="/brand/logo.png"
            alt="Masaar Holidays"
            width={120}
            height={36}
            className="h-7 w-auto"
            unoptimized
          />
        )}
        <div className="h-4 w-[1px] bg-black/15" />
        <span className="font-serif text-xs font-semibold text-[#8c6d23] uppercase tracking-wider">
          {pageTitle}
        </span>
      </div>
      <div className="flex items-center gap-2 text-[9px] font-bold tracking-[0.2em] text-[#b37e28]">
        <span>FAITH</span>
        <span>•</span>
        <span>CLARITY</span>
        <span>•</span>
        <span>CARE</span>
        <span>•</span>
        <span>PEACE</span>
      </div>
    </div>
  );

  // Reusable Page Footer
  const renderPageFooter = (pageNum: number) => (
    showFooter && (
      <div className="mt-auto pt-4 border-t border-black/10 flex items-center justify-between text-[10px] text-masaar-black/50">
        <div>
          <span className="font-semibold text-masaar-black/80">Masaar Holidays</span> • A Journey of Faith. A Legacy of Service.
        </div>
        <div className="flex items-center gap-4">
          <span>+971 55 227 6299 • masaarholidays.com</span>
          {showPageNumbers && (
            <span className="font-bold text-masaar-black">Page {pageNum} of {totalPages}</span>
          )}
        </div>
      </div>
    )
  );

  return (
    <div className="masaar-pdf-container mx-auto">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          *, *::before, *::after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body, html {
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .masaar-pdf-container {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .masaar-pdf-page {
            width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            overflow: hidden !important;
            box-sizing: border-box !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
        .masaar-pdf-page {
          width: 794px;
          height: 1123px;
          min-height: 1123px;
          max-height: 1123px;
          background: #ffffff;
          box-sizing: border-box;
          position: relative;
          display: flex;
          flex-direction: column;
          box-shadow: 0 4px 25px rgba(0, 0, 0, 0.08);
          margin-bottom: 24px;
          overflow: hidden;
          font-family: Georgia, 'Times New Roman', serif;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      `}</style>

      {/* Render selected or all pages */}
      {sectionsToRender.map((sec, idx) => {
        const pageNum = PDF_PAGE_SECTIONS.findIndex((s) => s.id === sec.id) + 1;

        // 1. COVER PAGE (Matches QUOTATION PDF.png exactly!)
        if (sec.id === "cover") {
          return (
            <div key="cover" className="masaar-pdf-page p-0 bg-[#0e0d0c] text-white">
              {/* Top luxury white band */}
              <div className="bg-[#FAF8F5] px-10 py-6 text-masaar-black">
                <div className="flex items-center justify-between">
                  <Image
                    src="/brand/logo.png"
                    alt="Masaar Holidays"
                    width={180}
                    height={54}
                    className="h-10 w-auto"
                    unoptimized
                  />
                  <div className="flex items-center gap-3 text-[10px] font-bold tracking-[0.25em] text-[#b37e28]">
                    <span>FAITH</span>
                    <span className="text-black/20">|</span>
                    <span>CLARITY</span>
                    <span className="text-black/20">|</span>
                    <span>CARE</span>
                    <span className="text-black/20">|</span>
                    <span>PEACE</span>
                  </div>
                </div>

                <div className="mt-8 text-center">
                  <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#b37e28]">
                    PERSONALISED QUOTATION
                  </span>
                  <h1 className="mt-2 font-serif text-4xl font-bold tracking-tight text-masaar-black">
                    Your {document.journey_type ? document.journey_type.toUpperCase() : "UMRAH 2026"} Journey
                  </h1>
                  <p className="mt-2 text-xs italic text-masaar-black/70">
                    {customCoverMessage || "A sacred journey, thoughtfully curated for you."}
                  </p>
                </div>
              </div>

              {/* Central Kaaba Banner Image */}
              <div className="relative flex-1 w-full overflow-hidden bg-black">
                <Image
                  src="/trips/banner-image.webp"
                  alt="Holy Kaaba Makkah"
                  fill
                  className="object-cover object-center"
                  priority
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0e0d0c] via-black/30 to-transparent" />
              </div>

              {/* Bottom Dark Luxury Footer Strip with Pax Info */}
              <div className="bg-[#0e0d0c] px-10 pt-4 pb-8 border-t border-[#d4af37]/30">
                <div className="grid grid-cols-3 gap-6 rounded-xl border border-[#d4af37]/25 bg-black/40 p-4 backdrop-blur-xs text-xs text-neutral-200">
                  <div className="flex items-start gap-3">
                    <span className="text-lg text-[#d4af37]">👤</span>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-neutral-400">Prepared for</span>
                      <p className="font-serif font-bold text-white text-sm">{document.client_name}</p>
                      <p className="text-[11px] text-neutral-400">{document.client_country || "Dubai, UAE"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 border-l border-white/10 pl-4">
                    <span className="text-lg text-[#d4af37]">📅</span>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-neutral-400">Travel Dates</span>
                      <p className="font-serif font-bold text-white text-sm">
                        {document.travel_date ? formatDate(document.travel_date) : "Flexible"}
                        {document.return_date ? ` – ${formatDate(document.return_date)}` : ""}
                      </p>
                      <p className="text-[11px] text-neutral-400">
                        {durationLabel}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 border-l border-white/10 pl-4">
                    <span className="text-lg text-[#d4af37]">👥</span>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-neutral-400">Travellers</span>
                      <p className="font-serif font-bold text-white text-sm">{travellers}</p>
                      <p className="text-[11px] text-[#d4af37]">Quote No: {document.document_number}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between text-[11px] text-neutral-400 pt-3 border-t border-white/10">
                  <div>
                    <span className="font-serif font-bold text-white">Masaar Holidays</span>
                    <span className="mx-2 text-white/30">•</span>
                    <span>A Journey of Faith. A Legacy of Service.</span>
                  </div>
                  <span className="text-[#d4af37] font-semibold">www.masaarholidays.com</span>
                </div>
              </div>
            </div>
          );
        }

        // 2. CLIENT DETAILS
        if (sec.id === "client_details") {
          return (
            <div key="client_details" className="masaar-pdf-page p-10">
              {renderPageHeader("Client Profile & Requirements")}
              
              <div className="space-y-6 flex-1 text-xs">
                <div className="rounded-xl border border-black/10 bg-[#FAF8F5] p-5">
                  <h3 className="font-serif text-base font-bold text-masaar-black border-b border-black/10 pb-2">
                    Primary Passenger Information
                  </h3>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-black/50">Full Name</span>
                      <p className="font-semibold text-masaar-black text-sm">{document.client_name}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-black/50">Contact Phone / WhatsApp</span>
                      <p className="font-semibold text-masaar-black text-sm">{formatPhone(document.client_phone)}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-black/50">Email Address</span>
                      <p className="font-semibold text-masaar-black">{document.client_email || "care@masaarholidays.com"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-black/50">Residence / Country</span>
                      <p className="font-semibold text-masaar-black">{document.client_country || "United Arab Emirates"}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-black/10 bg-[#FAF8F5] p-5">
                  <h3 className="font-serif text-base font-bold text-masaar-black border-b border-black/10 pb-2">
                    Pilgrimage Journey Specifications
                  </h3>
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-black/50">Journey Category</span>
                      <p className="font-semibold capitalize text-masaar-black text-sm">{document.journey_type ?? "Umrah"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-black/50">Origin City</span>
                      <p className="font-semibold text-masaar-black text-sm">{document.origin || "Dubai (DXB)"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-black/50">Destination</span>
                      <p className="font-semibold text-masaar-black text-sm">{document.destination || "Jeddah (JED) / Madinah (MED)"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-black/50">Departure Date</span>
                      <p className="font-semibold text-masaar-black">{formatDate(document.travel_date)}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-black/50">Return Date</span>
                      <p className="font-semibold text-masaar-black">{formatDate(document.return_date)}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-black/50">Total Travellers</span>
                      <p className="font-semibold text-masaar-black">{travellers}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-[#d4af37]/30 bg-white p-5 shadow-xs">
                  <h3 className="font-serif text-sm font-bold text-[#8c6d23] border-b border-[#d4af37]/20 pb-2">
                    Special Inclusions &amp; Dietary Requests
                  </h3>
                  <p className="mt-3 text-masaar-black/80 leading-relaxed">
                    {document.notes || "VIP private airport coordination, high-floor Kaaba view rooms requested, scholar guidance for first-time Umrah pilgrims, and wheelchair assistance upon arrival."}
                  </p>
                </div>
              </div>

              {renderPageFooter(pageNum)}
            </div>
          );
        }

        // 3. PACKAGE OVERVIEW
        if (sec.id === "package_overview") {
          return (
            <div key="package_overview" className="masaar-pdf-page p-10">
              {renderPageHeader("Curated Package Overview")}

              <div className="space-y-6 flex-1 text-xs">
                <div className="rounded-xl border border-[#d4af37]/40 bg-gradient-to-br from-[#FAF8F5] to-white p-6 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="rounded-full bg-[#b37e28]/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8c6d23]">
                        Masaar {document.journey_type === "hajj" ? "Hajj" : "Umrah"} Package
                      </span>
                      <h2 className="mt-2 font-serif text-2xl font-bold text-masaar-black">
                        {document.journey_type ? document.journey_type.toUpperCase() : "UMRAH"} — Premium Package
                      </h2>
                      <p className="mt-1 text-masaar-black/60">
                        {durationLabel}{hotelItems.length > 0 ? " | Luxury Hotel Stays" : ""}{transferItems.length > 0 ? " | Private Transfers" : ""}{flightItems.length > 0 ? " | Scheduled Flights" : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-black/40">Starting From</span>
                      <p className="font-serif text-2xl font-bold text-[#b37e28]">{formatMoney(document.total_aed || 17000)}</p>
                      <span className="text-[10px] text-black/50">All taxes &amp; VAT included</span>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-4 gap-3 text-center">
                    {flightItems.length > 0 ? (
                      <div className="rounded-lg bg-white p-3 border border-black/5 shadow-2xs">
                        <span className="text-xl">✈️</span>
                        <p className="mt-1 font-bold text-masaar-black">Direct Flights</p>
                        <p className="text-[10px] text-black/50">Return baggage included</p>
                      </div>
                    ) : (
                      <div className="rounded-lg bg-white p-3 border border-black/5 shadow-2xs">
                        <span className="text-xl">🕋</span>
                        <p className="mt-1 font-bold text-masaar-black">Land Package</p>
                        <p className="text-[10px] text-black/50">Ground services included</p>
                      </div>
                    )}
                    <div className="rounded-lg bg-white p-3 border border-black/5 shadow-2xs">
                      <span className="text-xl">⭐</span>
                      <p className="mt-1 font-bold text-masaar-black">5★ Hotels</p>
                      <p className="text-[10px] text-black/50">Steps from Haram</p>
                    </div>
                    <div className="rounded-lg bg-white p-3 border border-black/5 shadow-2xs">
                      <span className="text-xl">🚗</span>
                      <p className="mt-1 font-bold text-masaar-black">Private Transfers</p>
                      <p className="text-[10px] text-black/50">Luxury GMC / Chauffeur</p>
                    </div>
                    <div className="rounded-lg bg-white p-3 border border-black/5 shadow-2xs">
                      <span className="text-xl">🤝</span>
                      <p className="mt-1 font-bold text-masaar-black">Dedicated Care</p>
                      <p className="text-[10px] text-black/50">24/7 Pilgrimage Team</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-black/10 bg-[#FAF8F5] p-5">
                  <h3 className="font-serif text-sm font-bold text-masaar-black mb-3">Key Journey Highlights</h3>
                  <ul className="space-y-2.5 text-masaar-black/80">
                    <li className="flex items-start gap-2">
                      <span className="text-[#b37e28] font-bold">✓</span>
                      <span><strong>Frontline Haram Proximity:</strong> Stay in the Clock Tower complex with direct elevator access to the Haram Piazza.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#b37e28] font-bold">✓</span>
                      <span><strong>Seamless Chauffeur Transit:</strong> Private GMC Yukon XL handling all transfers between Jeddah, Makkah and Madinah.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#b37e28] font-bold">✓</span>
                      <span><strong>High-Speed Haramain Train:</strong> Business Class panoramic rail experience crossing the desert between the Holy Cities in 2 hours.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#b37e28] font-bold">✓</span>
                      <span><strong>Rawdah Sharif Guaranteed Permits:</strong> Pre-scheduled appointment facilitation for men and women without app hassle.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {renderPageFooter(pageNum)}
            </div>
          );
        }

        // 4. ACCOMMODATION
        if (sec.id === "accommodation") {
          // Hide section entirely if no hotel items added
          if (hotelItems.length === 0) return null;
          return (
            <div key="accommodation" className="masaar-pdf-page p-10">
              {renderPageHeader("5★ Luxury Accommodations")}

              <div className="space-y-5 flex-1 text-xs">
                {hotelItems.length > 0 ? (
                  hotelItems.map((h, idx) => {
                    const isMakkah = h.description.toLowerCase().includes("makkah");
                    const isMadinah = h.description.toLowerCase().includes("madinah");
                    const tag = isMakkah ? "Holy Makkah" : isMadinah ? "Madinah Al Munawwarah" : "Hotel Accommodation";
                    const img = getHotelImage(h.description, isMakkah ? "Makkah" : isMadinah ? "Madinah" : undefined);
                    return (
                      <div key={h.id || idx} className="rounded-xl border border-black/10 bg-white shadow-xs overflow-hidden">
                        <div className="grid grid-cols-3">
                          <div className="relative h-44 w-full bg-neutral-200">
                            <Image
                              src={img}
                              alt={h.description}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                          <div className="col-span-2 p-4 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase text-[#8c6d23]">{tag} — {h.quantity} Nights</span>
                                <span className="text-xs text-amber-500 font-bold">★★★★★ 5 Star</span>
                              </div>
                              <h3 className="font-serif text-base font-bold text-masaar-black mt-1">{h.description}</h3>
                              <p className="text-[11px] text-masaar-black/70 mt-1 whitespace-pre-line">{h.details || "Confirmed 5-Star luxury accommodations."}</p>
                            </div>
                            <div className="text-[10px] text-masaar-black/60 mt-2 border-t border-black/5 pt-1.5 flex items-center justify-between">
                              <span>Meal Plan: <strong>{resolveHotelMealPlan(h.details, h.description)}</strong></span>
                              <span>24-Hour Concierge &amp; Reception</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-xl border border-black/10 bg-white p-6 text-xs text-masaar-black/60 italic">
                    Accommodation details to be confirmed upon reservation.
                  </div>
                )}
              </div>

              {renderPageFooter(pageNum)}
            </div>
          );
        }

        // 5. TRANSPORTATION
        if (sec.id === "transportation") {
          // Hide section entirely if no transfer items added
          if (transferItems.length === 0) return null;
          return (
            <div key="transportation" className="masaar-pdf-page p-10">
              {renderPageHeader("Private Transfers & Transportation")}

              <div className="space-y-6 flex-1 text-xs">
                <div className="rounded-xl border border-black/10 bg-white shadow-xs overflow-hidden">
                  <div className="relative h-48 w-full bg-neutral-100">
                    <Image
                      src={getTransportImage(transferItems[0]?.description, transferItems[0]?.details)}
                      alt={transferItems[0]?.description || "Private Chauffeur Fleet"}
                      fill
                      className="object-cover object-center"
                      unoptimized
                    />
                    <div className="absolute bottom-2 left-4 rounded-md bg-black/70 px-3 py-1 text-[11px] font-bold text-white">
                      {transferItems[0]?.description || "Private Chauffeur Fleet"}
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    <div className="rounded-lg bg-[#FAF8F5] p-3 border border-black/5">
                      <span className="font-bold text-masaar-black">{transferItems[0]?.description || "Private Chauffeur Transfer"}</span>
                      <p className="text-[11px] text-masaar-black/70 mt-1 whitespace-pre-line">
                        {transferItems[0]?.details || "Dedicated private air-conditioned vehicle throughout your pilgrimage with meet & assist service."}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-lg bg-[#FAF8F5] p-3 border border-black/5">
                        <span className="font-bold text-masaar-black">Door-to-Door Chauffeur</span>
                        <p className="text-[11px] text-masaar-black/70 mt-1">
                          Dedicated private luxury vehicle throughout the pilgrimage. No waiting, no taxi negotiations.
                        </p>
                      </div>
                      <div className="rounded-lg bg-[#FAF8F5] p-3 border border-black/5">
                        <span className="font-bold text-masaar-black">Luggage Concierge</span>
                        <p className="text-[11px] text-masaar-black/70 mt-1">
                          Full baggage handling from airport arrival straight to your hotel room.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {renderPageFooter(pageNum)}
            </div>
          );
        }

        // 5b. SIGHTSEEING & PRIVATE ZIYARAT
        if (sec.id === "ziyarat") {
          const ziyaratItems = items.filter(
            (i) =>
              i.item_type === "private_trip" ||
              i.description.toLowerCase().includes("ziyarat") ||
              i.description.toLowerCase().includes("sightseeing")
          );

          if (ziyaratItems.length === 0) return null;

          return (
            <div key="ziyarat" className="masaar-pdf-page p-10">
              {renderPageHeader("Private Ziyarat & Cultural Sightseeing")}

              <div className="space-y-5 flex-1 text-xs">
                {ziyaratItems.map((zi, zIdx) => {
                  const isMakkah = zi.description.toLowerCase().includes("makkah");
                  const cardImg = isMakkah
                    ? "/trips/private-trip-makkah-card.webp"
                    : "/trips/private-trip-madinah-card.webp";
                  const isInc = (zi as any).is_included || Number(zi.unit_price_aed || 0) === 0;

                  return (
                    <div
                      key={zIdx}
                      className="rounded-xl border border-black/10 bg-white shadow-xs overflow-hidden"
                    >
                      <div className="flex flex-col sm:flex-row">
                        <div className="relative h-36 sm:h-auto sm:w-52 shrink-0 bg-neutral-100">
                          <Image
                            src={cardImg}
                            alt={zi.description}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                          <div className="absolute top-2 left-2 rounded bg-black/80 px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
                            {isMakkah ? "Makkah Al-Mukarramah" : "Madinah Al-Munawwarah"}
                          </div>
                        </div>

                        <div className="p-4 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-2 border-b border-black/10 pb-2">
                              <div>
                                <h3 className="font-serif text-base font-bold text-masaar-black">
                                  {zi.description}
                                </h3>
                                <p className="text-[11px] text-masaar-black/70 mt-0.5">
                                  2 – 2.5 hrs • Dedicated Chauffeur • Hotel Lobby Pickup &amp; Return
                                </p>
                              </div>
                              <span
                                className={`rounded px-2.5 py-1 text-[10px] font-bold uppercase shrink-0 ${
                                  isInc
                                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                    : "bg-light-gold/30 text-admin-primary"
                                }`}
                              >
                                {isInc ? "✓ Included in Package" : `AED ${Number(zi.unit_price_aed).toLocaleString()}`}
                              </span>
                            </div>

                            <div className="mt-2 text-[11px] text-masaar-black/80 leading-relaxed">
                              {zi.details}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="rounded-xl border border-black/10 bg-[#FAF8F5] p-4 text-[11px] text-masaar-black/80 leading-relaxed">
                  <span className="font-bold text-masaar-black block mb-1">
                    Spiritual Guided Pilgrimage Sightseeing
                  </span>
                  Private sightseeing journeys are conducted in modern air-conditioned private vehicles with experienced chauffeurs. The itinerary is paced comfortably to permit reflection, prayer, and historical understanding at sacred landmarks.
                </div>
              </div>

              {renderPageFooter(pageNum)}
            </div>
          );
        }

        // 6. FLIGHTS
        if (sec.id === "flights") {
          // Hide section entirely if no flight items added
          if (flightItems.length === 0) return null;
          const flightItem = flightItems[0];
          const flightMeta = extractFlightMetadata(flightItem?.details);

          return (
            <div key="flights" className="masaar-pdf-page p-10">
              {renderPageHeader("Flights & Dining Arrangements")}

              <div className="space-y-6 flex-1 text-xs">
                <div className="rounded-xl border border-black/10 bg-white shadow-xs overflow-hidden">
                  {flightMeta.screenshotUrl ? (
                    <div className="relative w-full max-h-[380px] min-h-[160px] bg-neutral-50 flex items-center justify-center p-3 border-b border-black/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={flightMeta.screenshotUrl}
                        alt={flightItem?.description || "Flight Itinerary Screenshot"}
                        className="max-h-[350px] w-auto max-w-full object-contain rounded-md shadow-2xs"
                      />
                    </div>
                  ) : (
                    <div className="relative h-44 w-full bg-neutral-100">
                      <Image
                        src="/Assets/image-flight.jpg"
                        alt={flightItem?.description || "Scheduled Flight"}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  )}

                  <div className="p-5">
                    <div className="flex items-start justify-between border-b border-black/10 pb-3 gap-3">
                      <div>
                        {flightMeta.airline && (
                          <span className="text-[10px] font-mono font-bold text-admin-primary uppercase tracking-wider block">
                            {flightMeta.airline}
                          </span>
                        )}
                        <h3 className="font-serif text-base font-bold text-masaar-black mt-0.5">
                          {flightItem?.description || "Scheduled Direct Flights"}
                        </h3>
                        {flightMeta.pnr && (
                          <p className="text-xs font-mono font-bold text-black mt-1">
                            Booking Reference / PNR: <span className="text-deep-gold">{flightMeta.pnr}</span>
                          </p>
                        )}
                        {flightMeta.departureArrival && (
                          <p className="text-xs text-masaar-black/70 mt-0.5">
                            Flight Schedule: {flightMeta.departureArrival}
                          </p>
                        )}
                        <p className="text-[11px] text-masaar-black/70 whitespace-pre-line mt-1.5 leading-relaxed">
                          {flightMeta.cleanDetails || flightItem?.details || "Direct scheduled return flights with luggage allowance included."}
                        </p>
                      </div>
                      <span className="rounded bg-light-gold/30 px-2.5 py-1 text-[10px] font-bold text-admin-primary uppercase shrink-0">
                        Scheduled Flights
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-black/10 bg-[#FAF8F5] p-5">
                  <h3 className="font-serif text-sm font-bold text-masaar-black mb-2">Dining &amp; Board Inclusions</h3>
                  <p className="text-masaar-black/80 leading-relaxed">
                    {(() => {
                      const resolvedMeal = hotelItems.map((h) => resolveHotelMealPlan(h.details, h.description)).find((m) => m !== "Room Only (No Meals Included)") || "Room Only (No Meals Included)";
                      if (resolvedMeal === "Room Only (No Meals Included)") {
                        return "Accommodations are arranged on a Room Only basis (meals and catering arranged separately or upon request). Complimentary bottled water and coffee service provided daily in rooms. Gourmet buffet catering upgrades available upon request.";
                      }
                      return `Accommodations include ${resolvedMeal} across reserved hotels with gourmet halal live cooking stations. Complimentary bottled water and coffee service provided daily in private vehicles and rooms.`;
                    })()}
                  </p>
                </div>
              </div>

              {renderPageFooter(pageNum)}
            </div>
          );
        }

        // 6b. ADDITIONAL SERVICES & ADD-ONS
        if (sec.id === "services") {
          const additionalServiceItems = items.filter(
            (i) =>
              (i.item_type === "service" || i.item_type === "custom") &&
              !i.description.toLowerCase().includes("flight") &&
              !i.description.toLowerCase().includes("airline") &&
              !i.description.toLowerCase().includes("ziyarat") &&
              !i.description.toLowerCase().includes("sightseeing") &&
              !i.description.toLowerCase().includes("visa")
          );

          if (additionalServiceItems.length === 0) return null;

          return (
            <div key="services" className="masaar-pdf-page p-10">
              {renderPageHeader("Additional Pilgrimage Services")}

              <div className="space-y-4 flex-1 text-xs">
                <div className="grid grid-cols-1 gap-3.5">
                  {additionalServiceItems.map((srv, sIdx) => {
                    const isInc = (srv as any).is_included || Number(srv.unit_price_aed || 0) === 0;
                    const details = srv.details || "";
                    const dateMatch = details.match(/\[service_date:\s*([^\]]+)\]/i);
                    const notesMatch = details.match(/\[service_notes:\s*([^\]]+)\]/i);
                    const cleanDetails = details
                      .replace(/\[service_date:[^\]]+\]/gi, "")
                      .replace(/\[service_notes:[^\]]+\]/gi, "")
                      .replace(/•?\s*\[price_[^\]]+\]/g, "")
                      .trim();

                    return (
                      <div
                        key={sIdx}
                        className="rounded-xl border border-black/10 bg-white p-4 shadow-2xs"
                      >
                        <div className="flex items-start justify-between border-b border-black/10 pb-2.5 gap-2">
                          <div>
                            <h3 className="font-serif text-sm font-bold text-masaar-black">
                              {srv.description}
                            </h3>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-masaar-black/60 mt-0.5">
                              <span>Quantity: <strong>{srv.quantity || 1}</strong></span>
                              {dateMatch && <span>Date: <strong>{dateMatch[1]}</strong></span>}
                              {notesMatch && <span>Notes: <strong>{notesMatch[1]}</strong></span>}
                            </div>
                          </div>
                          <span
                            className={`rounded px-2.5 py-1 text-[10px] font-bold uppercase shrink-0 ${
                              isInc
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : "bg-pure-gold/20 text-[#865d1d] border border-pure-gold/40"
                            }`}
                          >
                            {isInc
                              ? "✓ Included in Package"
                              : `Optional: AED ${Number(srv.unit_price_aed).toLocaleString()}`}
                          </span>
                        </div>
                        {cleanDetails && (
                          <p className="mt-2 text-[11px] text-masaar-black/75 leading-relaxed">
                            {cleanDetails}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-xl border border-black/10 bg-[#FAF8F5] p-4 text-[11px] text-masaar-black/80 leading-relaxed">
                  <span className="font-bold text-masaar-black block mb-1">
                    Dedicated Ground Concierge Coordination
                  </span>
                  Optional and included pilgrimage services are coordinated by Masaar Holidays licensed ground specialists in Saudi Arabia. Meeting times, assistance points, and logistical arrangements are confirmed with your dedicated pilgrimage advisor.
                </div>
              </div>

              {renderPageFooter(pageNum)}
            </div>
          );
        }

        // 7. ITINERARY
        if (sec.id === "itinerary") {
          if (isItineraryExplicitlyRemoved || activeItinerary.length === 0) return null;
          const isMultiCol = activeItinerary.length > 5;
          return (
            <div key="itinerary" className="masaar-pdf-page p-10">
              {renderPageHeader("Day-by-Day Sacred Itinerary")}

              <div className={isMultiCol ? "grid grid-cols-2 gap-2.5 flex-1 text-xs" : "space-y-3 flex-1 text-xs"}>
                {activeItinerary.map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5 rounded-lg border border-black/10 bg-[#FAF8F5] p-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#b37e28] text-white text-[10px] font-bold">
                      {item.day || i + 1}
                    </span>
                    <div className="min-w-0">
                      <h4 className="font-serif font-bold text-masaar-black text-xs truncate">{item.title}</h4>
                      <p className="mt-0.5 text-masaar-black/75 leading-tight text-[10px] line-clamp-2">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {renderPageFooter(pageNum)}
            </div>
          );
        }

        // 8. INCLUSIONS
        if (sec.id === "inclusions") {
          return (
            <div key="inclusions" className="masaar-pdf-page p-10">
              {renderPageHeader("Comprehensive Inclusions")}

              <div className="space-y-4 flex-1 text-xs">
                <div className="rounded-xl border border-green-200 bg-green-50/50 p-5">
                  <h3 className="font-serif text-sm font-bold text-green-900 mb-3">Included in Your Sacred Package</h3>
                  <div className="grid grid-cols-2 gap-3 text-green-950">
                    <div className="flex items-center gap-2">✓ 5★ Accommodations in Makkah &amp; Madinah</div>
                    {(() => {
                      const resolvedMeal = hotelItems.map((h) => resolveHotelMealPlan(h.details, h.description)).find((m) => m !== "Room Only (No Meals Included)") || "Room Only (No Meals Included)";
                      return (
                        <div className="flex items-center gap-2">✓ Meal Plan: {resolvedMeal}</div>
                      );
                    })()}
                    <div className="flex items-center gap-2">✓ Private GMC Yukon XL Transfers</div>
                    {flightItems.length > 0 ? (
                      <div className="flex items-center gap-2">✓ Direct Flight Return Tickets</div>
                    ) : (
                      <div className="flex items-center gap-2">✓ Comprehensive Ground Services</div>
                    )}
                    <div className="flex items-center gap-2">✓ Guided Makkah Ziyarat Excursions</div>
                    <div className="flex items-center gap-2">✓ Guided Madinah Ziyarat Excursions</div>
                    <div className="flex items-center gap-2">✓ Rawdah Sharif Permit Assistance</div>
                    <div className="flex items-center gap-2">✓ VIP Airport Meet &amp; Greet Service</div>
                    <div className="flex items-center gap-2">✓ Haramain Bullet Train Business Tickets</div>
                    <div className="flex items-center gap-2">✓ 24/7 Dedicated Ground Support Team</div>
                    <div className="flex items-center gap-2">✓ 5 Litres Packed Zamzam Water</div>
                    <div className="flex items-center gap-2">✓ Saudi Umrah Tourist Visa Processing</div>
                  </div>
                </div>
              </div>

              {renderPageFooter(pageNum)}
            </div>
          );
        }

        // 9. EXCLUSIONS
        if (sec.id === "exclusions") {
          return (
            <div key="exclusions" className="masaar-pdf-page p-10">
              {renderPageHeader("Package Exclusions")}

              <div className="space-y-4 flex-1 text-xs">
                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5">
                  <h3 className="font-serif text-sm font-bold text-amber-900 mb-3">Items Not Included</h3>
                  <div className="space-y-2.5 text-amber-950">
                    {flightItems.length === 0 && (
                      <div className="flex items-center gap-2 font-semibold">✗ Airline flight tickets (land package only — airfare arranged separately)</div>
                    )}
                    <div className="flex items-center gap-2">✗ Personal room service, telephone and laundry expenses</div>
                    {(() => {
                      const resolvedMeal = hotelItems.map((h) => resolveHotelMealPlan(h.details, h.description)).find((m) => m !== "Room Only (No Meals Included)") || "Room Only (No Meals Included)";
                      if (resolvedMeal === "Room Only (No Meals Included)") {
                        return (
                          <div className="flex items-center gap-2 font-semibold">✗ Meals &amp; catering (Package is Room Only — all meals arranged separately)</div>
                        );
                      }
                      return (
                        <div className="flex items-center gap-2">✗ Meals outside of specified board ({resolvedMeal})</div>
                      );
                    })()}
                    <div className="flex items-center gap-2">✗ Excess baggage fees levied by airlines beyond 30 KG</div>
                    <div className="flex items-center gap-2">✗ Discretionary tips and gratuities to drivers and local guides</div>
                    <div className="flex items-center gap-2">✗ Personal medical expenses and unstated travel insurance</div>
                    <div className="flex items-center gap-2">✗ Any optional helicopter tours or unlisted excursions</div>
                  </div>
                </div>
              </div>

              {renderPageFooter(pageNum)}
            </div>
          );
        }

        // 10. PRICING & BREAKDOWN
        if (sec.id === "pricing") {
          const itemsSum = items.reduce((s, i) => s + ((i.quantity || 1) * (i.unit_price_aed || 0) - (i.discount_aed || 0)), 0);
          const pdfSubtotal = itemsSum > 0 ? Math.max(itemsSum, Number(document.subtotal_aed || 0)) : Number(document.subtotal_aed || document.total_aed || 17000);
          const pdfHasVat = Number(document.tax_aed) > 0;
          const pdfTax = pdfHasVat ? Number(document.tax_aed || Math.round(pdfSubtotal * 0.05)) : 0;
          const pdfDiscount = Number(document.discount_aed || 0);
          const pdfTotal = Math.round((pdfSubtotal + pdfTax - pdfDiscount) * 100) / 100;

          return (
            <div key="pricing" className="masaar-pdf-page p-10">
              {renderPageHeader("Quotation Pricing & Summary")}

              <div className="space-y-6 flex-1 text-xs">
                {/* Table */}
                <div className="rounded-xl border border-black/10 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAF8F5] border-b border-black/10 text-masaar-black">
                      <tr>
                        <th className="p-3 font-serif font-bold">Item Description</th>
                        <th className="p-3 text-center font-serif font-bold">Qty</th>
                        <th className="p-3 text-right font-serif font-bold">Rate (AED)</th>
                        <th className="p-3 text-right font-serif font-bold">Total (AED)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {items.length > 0 ? (
                        items.map((item, idx) => {
                          const isInc = Boolean((item as any).is_included || Number(item.unit_price_aed) === 0);
                          const cleanText = (item.details || "")
                            .replace(/\[screenshot(?:_url)?:[^\]]+\]/gi, "")
                            .replace(/\[service_date:[^\]]+\]/gi, "")
                            .replace(/\[service_notes:[^\]]+\]/gi, "")
                            .replace(/\[supplier_notes:[^\]]+\]/gi, "")
                            .replace(/•?\s*\[price_[^\]]+\]/g, "")
                            .trim();

                          return (
                            <tr key={idx}>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-masaar-black">{item.description}</span>
                                  <span
                                    className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider ${
                                      isInc
                                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                        : "bg-pure-gold/20 text-[#865d1d] border border-pure-gold/30"
                                    }`}
                                  >
                                    {isInc ? "Included" : "Optional Add-on"}
                                  </span>
                                </div>
                                {cleanText && <p className="text-[10px] text-black/50 mt-0.5">{cleanText}</p>}
                              </td>
                              <td className="p-3 text-center">{item.quantity}</td>
                              <td className="p-3 text-right">
                                {isInc ? "Included" : formatMoney(item.unit_price_aed)}
                              </td>
                              <td className="p-3 text-right font-semibold">
                                {isInc ? "AED 0.00" : formatMoney((item.quantity || 1) * (item.unit_price_aed || 0) - (item.discount_aed || 0))}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td className="p-3">
                            <span className="font-semibold text-masaar-black">Platinum Umrah 2026 Package</span>
                            <p className="text-[10px] text-black/50">Swissôtel Makkah + Anwar Al Madinah + GMC Yukon XL</p>
                          </td>
                          <td className="p-3 text-center">1</td>
                          <td className="p-3 text-right">{formatMoney(document.total_aed || 17000)}</td>
                          <td className="p-3 text-right font-semibold">{formatMoney(document.total_aed || 17000)}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Calculation Summary */}
                <div className="flex justify-end">
                  <div className="w-72 rounded-xl border border-black/10 bg-[#FAF8F5] p-4 space-y-2">
                    <div className="flex justify-between text-black/70">
                      <span>Subtotal:</span>
                      <span>{formatMoney(pdfSubtotal)}</span>
                    </div>
                    {pdfDiscount > 0 && (
                      <div className="flex justify-between text-green-700">
                        <span>Discount:</span>
                        <span>- {formatMoney(pdfDiscount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-black/70">
                      <span>{pdfHasVat ? "VAT (5%):" : "VAT (0% Inclusive):"}</span>
                      <span>{formatMoney(pdfTax)}</span>
                    </div>
                    <div className="border-t border-black/10 pt-2 flex justify-between font-serif text-base font-bold text-masaar-black">
                      <span>Total Amount:</span>
                      <span className="text-[#b37e28]">{formatMoney(pdfTotal)}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-black/10 bg-white p-4 text-[11px] text-black/70 space-y-1">
                  <p><strong>Payment Schedule:</strong> 50% deposit required upon confirmation. Remaining 50% due 14 days prior to travel.</p>
                  <p><strong>Bank Wire Transfer:</strong> Masaar Holidays LLC • Emirates NBD Bank PJSC • IBAN: AE00000000000000000000</p>
                </div>
              </div>

              {renderPageFooter(pageNum)}
            </div>
          );
        }

        // 11. TERMS & CONDITIONS
        if (sec.id === "terms") {
          return (
            <div key="terms" className="masaar-pdf-page px-10 py-7">
              {renderPageHeader("Terms & Conditions")}

              <div className="space-y-3 flex-1 text-xs text-masaar-black/80 leading-relaxed">
                <div>
                  <h4 className="font-serif font-bold text-masaar-black">1. Validity &amp; Confirmation</h4>
                  <p className="mt-0.5 text-[11px]">
                    This quotation is valid for 7 days from the date of issue. Hotel room availability and airfare rates are dynamic and will be secured upon receipt of the deposit.
                  </p>
                </div>
                <div>
                  <h4 className="font-serif font-bold text-masaar-black">2. Cancellation &amp; Refund Policy</h4>
                  <p className="mt-0.5 text-[11px]">
                    Cancellations made 21 days or more prior to travel are eligible for a partial refund minus airline and non-refundable hotel penalties. Cancellations within 14 days are strictly non-refundable.
                  </p>
                </div>
                <div>
                  <h4 className="font-serif font-bold text-masaar-black">3. Visa &amp; Passport Regulations</h4>
                  <p className="mt-0.5 text-[11px]">
                    All pilgrims must hold passports valid for a minimum of 6 months from the date of entry into the Kingdom of Saudi Arabia. Saudi Umrah / Tourist visas are issued in compliance with Ministry of Hajj &amp; Umrah regulations.
                  </p>
                </div>
                <div>
                  <h4 className="font-serif font-bold text-masaar-black">4. Force Majeure</h4>
                  <p className="mt-0.5 text-[11px]">
                    Masaar Holidays is not liable for itinerary disruptions, flight schedule changes, or gate closures resulting from regulatory updates by the Saudi authorities or weather conditions.
                  </p>
                </div>
              </div>

              {renderPageFooter(pageNum)}
            </div>
          );
        }

        // 12. THANK YOU & CONTACT (Matches QUOTATION PDF.png thumbnail 12)
        if (sec.id === "thankyou") {
          return (
            <div
              key="thankyou"
              className="masaar-pdf-page relative text-white flex flex-col justify-between"
              style={{
                backgroundColor: "#12100e",
                WebkitPrintColorAdjust: "exact",
                printColorAdjust: "exact",
              }}
            >
              {/* Dark Kaaba Background Image for rich print depth */}
              <div className="absolute inset-0 z-0 overflow-hidden opacity-30">
                <Image
                  src="/trips/banner-image.webp"
                  alt="Holy Kaaba Makkah"
                  fill
                  className="object-cover object-center"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#12100e] via-[#12100e]/70 to-[#12100e]" />
              </div>

              {/* Top Banner with Reverse Logo */}
              <div className="relative z-10 p-10 text-center border-b border-[#d4af37]/30 bg-black/40 backdrop-blur-xs">
                <div className="flex items-center justify-between">
                  <Image
                    src="/brand/logo-reverse.png"
                    alt="Masaar Holidays"
                    width={180}
                    height={54}
                    className="h-10 w-auto"
                    unoptimized
                  />
                  <div className="flex items-center gap-3 text-[10px] font-bold tracking-[0.25em] text-[#d4af37]">
                    <span>FAITH</span>
                    <span className="text-white/30">•</span>
                    <span>CLARITY</span>
                    <span className="text-white/30">•</span>
                    <span>CARE</span>
                    <span className="text-white/30">•</span>
                    <span>PEACE</span>
                  </div>
                </div>

                <div className="mt-8">
                  <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#d4af37]">
                    A SACRED PILGRIMAGE EXPERIENCE
                  </span>
                  <h2 className="mt-2 font-serif text-3xl font-bold text-white tracking-wide">
                    Thank You for Choosing Masaar Holidays
                  </h2>
                  <p className="mt-2 text-xs italic text-neutral-300">
                    A Journey of Faith. A Legacy of Service.
                  </p>
                </div>
              </div>

              {/* Central Blessing & Du'a Card with Gold Border */}
              <div className="relative z-10 px-10 py-6 max-w-xl mx-auto text-center">
                <div className="rounded-2xl border border-[#d4af37]/40 bg-black/60 p-8 shadow-xl backdrop-blur-xs">
                  <div className="flex justify-center text-3xl text-[#d4af37]">
                    <span>🤲</span>
                  </div>
                  <h3 className="mt-3 font-serif text-lg font-bold text-[#d4af37]">
                    A Pilgrim&apos;s Du&apos;a
                  </h3>
                  <p className="mt-3 font-serif text-base text-neutral-200 italic leading-relaxed">
                    &ldquo;May Allah accept your pilgrimage, forgive your shortcomings, bless your footsteps in the holy cities, and grant you and your family lasting tranquility in this life and the hereafter.&rdquo;
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#d4af37]/80">
                    <span>✦</span>
                    <span className="text-[10px] uppercase tracking-widest">Umrah Maqboolah &amp; Mabrurah</span>
                    <span>✦</span>
                  </div>
                </div>
              </div>

              {/* Bottom Concierge & Contact Strip */}
              <div className="relative z-10 bg-black/80 px-10 py-7 border-t border-[#d4af37]/30 text-xs backdrop-blur-xs">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="rounded-xl border border-[#d4af37]/30 bg-white/5 p-3">
                    <span className="text-[#d4af37] font-bold block text-xs">📞 Dedicated Concierge</span>
                    <span className="text-white font-semibold mt-1 block">+971 55 227 6299</span>
                    <span className="text-[10px] text-neutral-400">Available 24/7 in Holy Lands</span>
                  </div>

                  <div className="rounded-xl border border-[#d4af37]/30 bg-white/5 p-3">
                    <span className="text-[#d4af37] font-bold block text-xs">✉️ Email Support</span>
                    <span className="text-white font-semibold mt-1 block">care@masaarholidays.com</span>
                    <span className="text-[10px] text-neutral-400">Direct Inquiries &amp; Changes</span>
                  </div>

                  <div className="rounded-xl border border-[#d4af37]/30 bg-white/5 p-3">
                    <span className="text-[#d4af37] font-bold block text-xs">🌐 Client Portal</span>
                    <span className="text-[#d4af37] font-semibold mt-1 block">masaarholidays.com</span>
                    <span className="text-[10px] text-neutral-400">Review, Accept &amp; Request</span>
                  </div>
                </div>

                <div className="mt-5 text-center text-[10px] text-neutral-400 border-t border-white/10 pt-3">
                  <span>Masaar Holidays LLC • Dubai, United Arab Emirates • License No: 1234567</span>
                </div>
              </div>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
