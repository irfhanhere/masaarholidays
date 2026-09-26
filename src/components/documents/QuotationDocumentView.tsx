import Image from "next/image";
import type { DocumentItemRow, DocumentRow, DocumentTemplateRow } from "@/lib/types/database";

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

export const PDF_PAGE_SECTIONS = [
  { id: "cover", label: "Cover Page" },
  { id: "client_details", label: "Client Details" },
  { id: "package_overview", label: "Package Overview" },
  { id: "accommodation", label: "Accommodation" },
  { id: "transportation", label: "Transportation" },
  { id: "flights", label: "Flights" },
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

  // Parse itinerary
  let activeItinerary: Array<{ day: number | string; title: string; desc: string }> = [];
  if (document.special_requirements) {
    try {
      const parsed = JSON.parse(document.special_requirements);
      if (Array.isArray(parsed) && parsed.length > 0) activeItinerary = parsed;
    } catch {}
  }
  if (activeItinerary.length === 0) {
    activeItinerary = [
      {
        day: 1,
        title: "Day 1: Departure & Arrival in Holy Makkah",
        desc: "Arrival at King Abdulaziz International Airport (JED). VIP meet & assist by Masaar coordinator, private GMC transfer to Makkah hotel, check-in, and performing holy Umrah with guided scholar support.",
      },
      {
        day: 2,
        title: "Days 2–5: Makkah Mukarramah & Sacred Sites Ziyarat",
        desc: "Daily prayers and worship in Masjid Al Haram. Dedicated historical Ziyarat tour visiting Jabal Al Noor (Cave Hira), Mount Thawr, Mina and Arafat with experienced scholar guidance.",
      },
      {
        day: 3,
        title: "Day 6: Haramain High Speed Rail to Madinah Al Munawwarah",
        desc: "Smooth check-out from Makkah hotel. Boarding the luxurious Haramain High-Speed Train to Madinah Al Munawwarah. Private transfer to Madinah hotel, followed by Salam at the Prophet’s Mosque.",
      },
      {
        day: 4,
        title: "Days 7–9: Madinah Munawwarah & Rawdah Sharif",
        desc: "Prayers in the Prophet’s Mosque (peace be upon him) and guaranteed permit assistance for Rawdah Sharif. Ziyarat tour covering Masjid Quba, Mount Uhud and the Seven Mosques.",
      },
      {
        day: 5,
        title: "Day 10: Farewell & Return Journey",
        desc: "Farewell prayers at Masjid An-Nabawi, private airport transfer to Prince Mohammad Bin Abdulaziz International Airport (MED), and safe return flight with accepted pilgrimage.",
      },
    ];
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
                  src="/Assets/banner-image.png"
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
                        {document.travel_date && document.return_date ? "10 Days / 9 Nights" : "Flexible Duration"}
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
                        Masaar Signature Tier
                      </span>
                      <h2 className="mt-2 font-serif text-2xl font-bold text-masaar-black">
                        {document.journey_type ? document.journey_type.toUpperCase() : "UMRAH"} 2026 — Platinum Package
                      </h2>
                      <p className="mt-1 text-masaar-black/60">
                        10 Days / 9 Nights | Direct Flights, 5-Star Luxury Hotels, Private GMC Transfers &amp; Ziyarat
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-black/40">Starting From</span>
                      <p className="font-serif text-2xl font-bold text-[#b37e28]">{formatMoney(document.total_aed || 17000)}</p>
                      <span className="text-[10px] text-black/50">All taxes &amp; VAT included</span>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-4 gap-3 text-center">
                    <div className="rounded-lg bg-white p-3 border border-black/5 shadow-2xs">
                      <span className="text-xl">✈️</span>
                      <p className="mt-1 font-bold text-masaar-black">Direct Flights</p>
                      <p className="text-[10px] text-black/50">Return baggage included</p>
                    </div>
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
          return (
            <div key="accommodation" className="masaar-pdf-page p-10">
              {renderPageHeader("5★ Luxury Accommodations")}

              <div className="space-y-5 flex-1 text-xs">
                {/* Makkah Hotel Card */}
                <div className="rounded-xl border border-black/10 bg-white shadow-xs overflow-hidden">
                  <div className="grid grid-cols-3">
                    <div className="relative h-44 w-full bg-neutral-200">
                      <Image
                        src="/Assets/PRIVATE-TRIP-MAKKAH-CARD.png"
                        alt="Swissôtel Makkah"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="col-span-2 p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase text-[#8c6d23]">Holy Makkah — 5 Nights</span>
                          <span className="text-xs text-amber-500 font-bold">★★★★★ 5 Star</span>
                        </div>
                        <h3 className="font-serif text-base font-bold text-masaar-black mt-1">Swissôtel Makkah (Clock Tower)</h3>
                        <p className="text-[11px] text-masaar-black/60 mt-0.5">Abraj Al Bait Complex • 0m to Haram Courtyard</p>
                        
                        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-masaar-black/80">
                          <div>• <strong>Room:</strong> Deluxe Twin / Kaaba View</div>
                          <div>• <strong>Meals:</strong> Daily International Buffet</div>
                          <div>• <strong>Check-in:</strong> Direct VIP Desk</div>
                          <div>• <strong>Elevators:</strong> Direct Haram Access</div>
                        </div>
                      </div>
                      <p className="text-[10px] text-masaar-black/50 mt-2 border-t border-black/5 pt-1.5">
                        Private prayer halls with Haram audio feed; 24-hour concierge assistance.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Madinah Hotel Card */}
                <div className="rounded-xl border border-black/10 bg-white shadow-xs overflow-hidden">
                  <div className="grid grid-cols-3">
                    <div className="relative h-44 w-full bg-neutral-200">
                      <Image
                        src="/Assets/PRIVATE-TRIP-MADINAH-CARD.png"
                        alt="Anwar Al Madinah Mövenpick"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="col-span-2 p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase text-[#8c6d23]">Madinah Al Munawwarah — 4 Nights</span>
                          <span className="text-xs text-amber-500 font-bold">★★★★★ 5 Star</span>
                        </div>
                        <h3 className="font-serif text-base font-bold text-masaar-black mt-1">Anwar Al Madinah Mövenpick</h3>
                        <p className="text-[11px] text-masaar-black/60 mt-0.5">Northern Courtyard • Direct Piazza Entry to Prophet’s Mosque</p>
                        
                        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-masaar-black/80">
                          <div>• <strong>Room:</strong> Superior Room (Twin Bed)</div>
                          <div>• <strong>Meals:</strong> Daily International Breakfast</div>
                          <div>• <strong>Proximity:</strong> 2-min walk to Ladies&apos; Gate</div>
                          <div>• <strong>Amenities:</strong> High-speed Wi-Fi, 24/7 Room Service</div>
                        </div>
                      </div>
                      <p className="text-[10px] text-masaar-black/50 mt-2 border-t border-black/5 pt-1.5">
                        Unmatched convenience for Tahajjud prayers and Rawdah visiting gates.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {renderPageFooter(pageNum)}
            </div>
          );
        }

        // 5. TRANSPORTATION
        if (sec.id === "transportation") {
          return (
            <div key="transportation" className="masaar-pdf-page p-10">
              {renderPageHeader("Private Transfers & Transportation")}

              <div className="space-y-6 flex-1 text-xs">
                <div className="rounded-xl border border-black/10 bg-white shadow-xs overflow-hidden">
                  <div className="relative h-48 w-full bg-neutral-100">
                    <Image
                      src="/Assets/PRIVATE-TRIP-TRANSPORT.png"
                      alt="GMC Yukon XL Luxury Fleet"
                      fill
                      className="object-cover object-center"
                      unoptimized
                    />
                    <div className="absolute bottom-2 left-4 rounded-md bg-black/70 px-3 py-1 text-[11px] font-bold text-white">
                      Private Chauffeur Fleet: GMC Yukon XL / VIP Staria
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
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
                          Full baggage handling from airport arrival belt straight to your hotel room.
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-black/10 pt-3">
                      <h4 className="font-serif font-bold text-masaar-black mb-2">Included Vehicle Routes:</h4>
                      <ol className="space-y-1.5 text-masaar-black/80 list-decimal list-inside">
                        <li>King Abdulaziz Airport (JED) → Holy Makkah Hotel</li>
                        <li>Historical Makkah Sacred Sites Ziyarat (Cave Hira, Mount Thawr, Mina, Arafat)</li>
                        <li>Makkah Hotel → Haramain Train Station</li>
                        <li>Madinah Train Station → Madinah Hotel</li>
                        <li>Madinah Historical Sites Ziyarat (Masjid Quba, Mount Uhud, Seven Mosques)</li>
                        <li>Madinah Hotel → Prince Mohammad Airport (MED)</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>

              {renderPageFooter(pageNum)}
            </div>
          );
        }

        // 6. FLIGHTS
        if (sec.id === "flights") {
          return (
            <div key="flights" className="masaar-pdf-page p-10">
              {renderPageHeader("Flights & Dining Arrangements")}

              <div className="space-y-6 flex-1 text-xs">
                <div className="rounded-xl border border-black/10 bg-white shadow-xs overflow-hidden">
                  <div className="relative h-44 w-full bg-neutral-100">
                    <Image
                      src="/Assets/image-flight.jpg"
                      alt="Luxury Airline"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between border-b border-black/10 pb-3">
                      <div>
                        <h3 className="font-serif text-base font-bold text-masaar-black">Emirates Airlines / Saudia</h3>
                        <p className="text-[11px] text-masaar-black/60">Direct Non-Stop Flights (Dubai DXB ⇄ Jeddah JED / Madinah MED)</p>
                      </div>
                      <span className="rounded bg-light-gold/30 px-2.5 py-1 text-[10px] font-bold text-admin-primary uppercase">
                        Direct Routing
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                      <div className="rounded-lg bg-[#FAF8F5] p-2.5">
                        <span className="text-[10px] uppercase font-bold text-black/50">Checked Baggage</span>
                        <p className="font-bold text-masaar-black mt-0.5">30 KG per person</p>
                      </div>
                      <div className="rounded-lg bg-[#FAF8F5] p-2.5">
                        <span className="text-[10px] uppercase font-bold text-black/50">Cabin Baggage</span>
                        <p className="font-bold text-masaar-black mt-0.5">7 KG + Personal item</p>
                      </div>
                      <div className="rounded-lg bg-[#FAF8F5] p-2.5">
                        <span className="text-[10px] uppercase font-bold text-black/50">Zamzam Allowance</span>
                        <p className="font-bold text-masaar-black mt-0.5">5 Litres complimentary</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-black/10 bg-[#FAF8F5] p-5">
                  <h3 className="font-serif text-sm font-bold text-masaar-black mb-2">Dining &amp; Board Inclusions</h3>
                  <p className="text-masaar-black/80 leading-relaxed">
                    Daily five-star international buffet breakfast included across all hotels with gourmet halal live cooking stations. Complimentary bottled water and coffee service provided daily in private vehicles and rooms. Optional half-board / full-board catering upgrades available upon request.
                  </p>
                </div>
              </div>

              {renderPageFooter(pageNum)}
            </div>
          );
        }

        // 7. ITINERARY
        if (sec.id === "itinerary") {
          return (
            <div key="itinerary" className="masaar-pdf-page p-10">
              {renderPageHeader("Day-by-Day Sacred Itinerary")}

              <div className="space-y-4 flex-1 text-xs">
                {activeItinerary.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg border border-black/10 bg-[#FAF8F5] p-3.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#b37e28] text-white text-[11px] font-bold">
                      {i + 1}
                    </span>
                    <div>
                      <h4 className="font-serif font-bold text-masaar-black text-sm">{item.title}</h4>
                      <p className="mt-1 text-masaar-black/75 leading-relaxed text-[11px]">{item.desc}</p>
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
                    <div className="flex items-center gap-2">✓ Daily International Breakfast Buffets</div>
                    <div className="flex items-center gap-2">✓ Private GMC Yukon XL Transfers</div>
                    <div className="flex items-center gap-2">✓ Direct Flight Return Tickets</div>
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
                    <div className="flex items-center gap-2">✗ Personal room service, telephone and laundry expenses</div>
                    <div className="flex items-center gap-2">✗ Lunch and dinners outside of the specified breakfast board</div>
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
                        items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="p-3">
                              <span className="font-semibold text-masaar-black">{item.description}</span>
                              {item.details && <p className="text-[10px] text-black/50 mt-0.5">{item.details}</p>}
                            </td>
                            <td className="p-3 text-center">{item.quantity}</td>
                            <td className="p-3 text-right">{formatMoney(item.unit_price_aed)}</td>
                            <td className="p-3 text-right font-semibold">
                              {formatMoney((item.quantity || 1) * (item.unit_price_aed || 0) - (item.discount_aed || 0))}
                            </td>
                          </tr>
                        ))
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
                      <span>{formatMoney(document.subtotal_aed || document.total_aed || 17000)}</span>
                    </div>
                    {document.discount_aed > 0 && (
                      <div className="flex justify-between text-green-700">
                        <span>Discount:</span>
                        <span>- {formatMoney(document.discount_aed)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-black/70">
                      <span>VAT (5% Inclusive):</span>
                      <span>{formatMoney(document.tax_aed || 0)}</span>
                    </div>
                    <div className="border-t border-black/10 pt-2 flex justify-between font-serif text-base font-bold text-masaar-black">
                      <span>Total Amount:</span>
                      <span className="text-[#b37e28]">{formatMoney(document.total_aed || 17000)}</span>
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
                  src="/Assets/banner-image.png"
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
