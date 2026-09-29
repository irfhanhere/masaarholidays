"use client";

import { useState, useTransition, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { respondToQuotation } from "./actions";
import { formatDeterministicDate } from "@/lib/date-utils";
import type {
  DocumentItemRow,
  DocumentRow,
  DocumentTemplateRow,
} from "@/lib/types/database";
import { getHotelImage, getTransportImage } from "@/lib/documents/images";
import { generateItineraryForDays, type ItineraryDay } from "@/lib/documents/itinerary";

const CHANGE_OPTIONS = [
  "Hotel",
  "Room type",
  "Vehicle",
  "Flight",
  "Number of nights",
  "Add service",
  "Remove service",
  "Other",
];

export function ClientQuotationPortal({
  token,
  document,
  items,
  template,
  whatsappPhone,
  isPrintMode = false,
}: {
  token: string;
  document: DocumentRow;
  items: DocumentItemRow[];
  template: DocumentTemplateRow | null;
  whatsappPhone: string;
  isPrintMode?: boolean;
}) {
  const [currentStatus, setCurrentStatus] = useState(document.status);
  const [isPending, startTransition] = useTransition();

  // Change Request Modal State (Exact match EDITING QUOTATION.png Step 3)
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedChanges, setSelectedChanges] = useState<Set<string>>(new Set());
  const [changeMessage, setChangeMessage] = useState("");
  const [requestSent, setRequestSent] = useState(false);
  const [acceptedNotice, setAcceptedNotice] = useState(currentStatus === "accepted");
  const [showAcceptCelebration, setShowAcceptCelebration] = useState(false);

  const cleanPhone = (whatsappPhone || "971552276299").replace(/\D/g, "");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("print") === "true" || isPrintMode) {
        const timer = setTimeout(() => {
          window.print();
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [isPrintMode]);

  function handleAccept() {
    startTransition(async () => {
      try {
        const next = await respondToQuotation(token, "accept");
        setCurrentStatus(next);
      } catch (err) {
        console.error("Accept quotation error:", err);
      }
      setAcceptedNotice(true);
      setShowAcceptCelebration(true);
    });
  }

  const acceptWaText = `Assalamu Alaikum Masaar Holidays,
I am pleased to confirm that I have accepted Quotation ${document.document_number} for ${document.client_name} (Total: AED ${Number(document.total_aed || 9240).toLocaleString()}).

Please proceed with booking confirmation, official invoice, and payment schedule.
Quotation link: ${typeof window !== "undefined" ? window.location.origin : "https://masaarholidays.com"}/quote/${token}

JazakAllahu Khairan!`;
  const acceptWaUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(acceptWaText)}`;

  function toggleChangeOption(opt: string) {
    setSelectedChanges((prev) => {
      const next = new Set(prev);
      if (next.has(opt)) next.delete(opt);
      else next.add(opt);
      return next;
    });
  }

  function handleSubmitChangeRequest(e: React.FormEvent) {
    e.preventDefault();
    if (selectedChanges.size === 0 && !changeMessage.trim()) {
      alert("Please select at least one change category or write a message.");
      return;
    }

    const categoriesArray = Array.from(selectedChanges);
    const catsText = categoriesArray.length > 0 ? categoriesArray.join(", ") : "General adjustments";

    const waText = `Assalamu Alaikum Masaar Holidays,
I am reviewing Quotation ${document.document_number} for ${document.client_name} (AED ${Number(document.total_aed || 9240).toLocaleString()}).

I would like to request changes to my itinerary:
• Categories: ${catsText}
${changeMessage.trim() ? `• Specific Details: ${changeMessage.trim()}\n` : ""}• View Quotation: ${typeof window !== "undefined" ? window.location.origin : "https://masaarholidays.com"}/quote/${token}

Please let me know once the revised quotation is ready. JazakAllahu Khairan!`;

    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waText)}`;

    startTransition(async () => {
      try {
        const next = await respondToQuotation(token, "request_changes", {
          categories: categoriesArray,
          message: changeMessage.trim(),
        });
        setCurrentStatus(next);
      } catch (err) {
        console.error("Failed to submit change request:", err);
      }
      setIsRequestModalOpen(false);
      setRequestSent(true);

      // Immediately launch WhatsApp with the structured message
      if (typeof window !== "undefined") {
        window.open(waUrl, "_blank");
      }
    });
  }

  // Calculate days/nights dynamically
  const durationFromNotes = document.notes?.match(/Duration:\s*([^\n\r]+)/i)?.[1]?.trim();
  const calculatedDays =
    document.travel_date && document.return_date
      ? Math.max(
          1,
          Math.round(
            (new Date(document.return_date).getTime() - new Date(document.travel_date).getTime()) /
              (1000 * 3600 * 24)
          ) + 1
        )
      : 4;

  const durationDays = calculatedDays;
  const durationLabel = durationFromNotes || `${durationDays} Days / ${Math.max(1, durationDays - 1)} Nights`;

  const travelDatesFormatted =
    document.travel_date && document.return_date
      ? `${formatDeterministicDate(document.travel_date)} – ${formatDeterministicDate(document.return_date)} (${durationLabel})`
      : "Travel dates to be confirmed";

  const isHajj = document.journey_type === "hajj";
  const journeyTitle = isHajj ? "Your Hajj 2027 Journey" : "Your Umrah 2026 Journey";
  const packageBadge = isHajj ? "HAJJ 2027" : "UMRAH 2026";

  // Parse items dynamically
  const packageItem = items.find((i) =>
    ["umrah_package", "hajj_package"].includes(i.item_type)
  );
  const hotels = items.filter((i) => i.item_type === "hotel" || (i.item_type as any) === "accommodation");
  const transport = items.find((i) => i.item_type === "transfer");
  const flight = items.find((i) => i.item_type === "flight");
  const meals = items.find((i) => (i.item_type as any) === "meals" || i.description.toLowerCase().includes("meal"));
  const additional = items.filter(
    (i) => !["umrah_package", "hajj_package", "hotel", "accommodation", "transfer", "flight"].includes(i.item_type) && !i.description.toLowerCase().includes("meal")
  );

  const hotelAndTransportTotal = items
    .filter((i) => ["hotel", "accommodation", "transfer"].includes(i.item_type))
    .reduce((sum, i) => sum + Number(i.amount_aed ?? i.quantity * i.unit_price_aed), 0);

  const flightTotal = items
    .filter((i) => i.item_type === "flight")
    .reduce((sum, i) => sum + Number(i.amount_aed ?? i.quantity * i.unit_price_aed), 0);

  const additionalTotal = additional.reduce(
    (sum, i) => sum + Number(i.amount_aed ?? i.quantity * i.unit_price_aed),
    0
  );

  const mealsTotal = items
    .filter((i) => (i.item_type as any) === "meals" || i.description.toLowerCase().includes("meal"))
    .reduce((sum, i) => sum + Number(i.amount_aed ?? i.quantity * i.unit_price_aed), 0);

  const packageItemsTotal = items
    .filter((i) => ["umrah_package", "hajj_package"].includes(i.item_type))
    .reduce((sum, i) => sum + Number(i.amount_aed ?? i.quantity * i.unit_price_aed), 0);

  const allItemsSum = items.reduce((sum, i) => sum + Number(i.amount_aed ?? i.quantity * i.unit_price_aed), 0);

  // Ensure subtotal reflects all items (Hotel, Transport, Flights, Add-ons, Meals)
  const packageSubtotal = allItemsSum > 0 ? Math.max(allItemsSum, Number(document.subtotal_aed || 0)) : Number(document.subtotal_aed || 8800);

  // VAT: Respect document.tax_aed. If tax_aed is 0, no VAT is added.
  const hasVat = document.tax_aed !== null && document.tax_aed !== undefined
    ? Number(document.tax_aed) > 0
    : false;
  const vatAmount = hasVat ? Number(document.tax_aed || Math.round(packageSubtotal * 0.05)) : 0;
  const discountAmount = Number(document.discount_aed || 0);
  const finalPrice = Math.round((packageSubtotal + vatAmount - discountAmount) * 100) / 100;

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

  // If not explicitly removed, auto-generate matching the exact duration
  if (!isItineraryExplicitlyRemoved && activeItinerary.length === 0) {
    activeItinerary = generateItineraryForDays(durationDays, isHajj);
  }

  const whatsappMessage = `Assalamu Alaikum Masaar Holidays, I am reviewing Quotation ${document.document_number} for ${document.client_name} (AED ${Number(finalPrice).toLocaleString()}) and would like to speak with a travel advisor.`;
  const whatsappHref = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappMessage)}`;
  const pdfDownloadUrl = `/quote/${token}/pdf`;

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-masaar-black font-sans selection:bg-[#c9983e]/20 selection:text-masaar-black">
      {/* Print and Screen Stylesheet */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            @page {
              size: A4 portrait;
              margin: 10mm 12mm;
            }
            html, body {
              background: #ffffff !important;
              margin: 0 !important;
              padding: 0 !important;
              color: #1A1816 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            .print\\:hidden, .no-print {
              display: none !important;
            }
            header {
              position: static !important;
              box-shadow: none !important;
              border-bottom: 1px solid rgba(0,0,0,0.15) !important;
              padding-top: 6px !important;
              padding-bottom: 6px !important;
            }
            main {
              padding-top: 10px !important;
              padding-bottom: 10px !important;
            }
            .break-inside-avoid, [data-pdf-card] {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            .shadow-xs, .shadow-sm, .shadow-md, .shadow-xl {
              box-shadow: none !important;
            }
            .border-black\\/10, .border-black\\/15, .border-black\\/20 {
              border-color: #e5e7eb !important;
            }
          }
        `,
      }} />

      {/* 1. Luxury Navbar matching CLIENT QUOTATION PAGE.png */}
      <header className="border-b border-black/10 bg-white/95 backdrop-blur-md sticky top-0 z-30 print:static print:bg-white print:border-b print:py-2">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-36">
              <Image
                src="/Assets/logo-main.png"
                alt="Masaar Holidays"
                fill
                priority
                className="object-contain object-left"
              />
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 font-serif text-[11px] font-bold uppercase tracking-[0.25em] text-[#865d1d]">
            <span>FAITH</span>
            <span>•</span>
            <span>CLARITY</span>
            <span>•</span>
            <span>CARE</span>
            <span>•</span>
            <span>PEACE</span>
          </div>

          <div className="flex items-center gap-3 text-xs print:hidden">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-full border border-[#b37e28]/40 bg-light-gold/20 px-3.5 py-1.5 font-bold text-[#865d1d] hover:bg-light-gold/40 transition-colors cursor-pointer"
            >
              <span>📥</span>
              <span>Download PDF</span>
            </button>

            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-full border border-black/10 bg-[#FAF9F6] px-3.5 py-1.5 font-semibold text-masaar-black hover:bg-black/5 transition-colors"
            >
              <span className="text-[#25D366] text-sm">💬</span>
              <span className="hidden sm:inline text-masaar-black/60">Need Help?</span>
              <span className="font-bold">+971 55 227 6299</span>
            </a>
          </div>
        </div>
      </header>

      {/* 2. Hero Section with Kaaba sunset banner matching CLIENT QUOTATION PAGE.png */}
      <section className="relative overflow-hidden bg-masaar-black text-white">
        <div className="absolute inset-0 opacity-40 mix-blend-luminosity">
          <Image
            src="/Assets/banner-image.png"
            alt="Makkah Clock Tower & Masjid Al Haram"
            fill
            priority
            className="object-cover object-center"
            unoptimized
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-masaar-black via-masaar-black/60 to-transparent" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 text-center">
          <p className="font-serif text-xs font-bold tracking-[0.3em] uppercase text-[#D4AF37]">
            — YOUR JOURNEY AWAITS
          </p>
          <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            {journeyTitle}
          </h1>
          <p className="mt-3 text-sm text-white/80 max-w-xl mx-auto font-sans leading-relaxed">
            A sacred journey, thoughtfully curated for you.
          </p>

          {/* 4 Pillars */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 sm:gap-10">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-xs">
                🕋
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-white/90">FAITH</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-xs">
                👥
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-white/90">CLARITY</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-xs">
                ✈️
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-white/90">CARE</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-xs">
                🕊️
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-white/90">PEACE</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Client & Trip Info Strip */}
      <section className="border-b border-black/10 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 items-center">
            {/* Prepared for */}
            <div className="flex items-center gap-3 border-b sm:border-b-0 sm:border-r border-black/10 pb-3 sm:pb-0 sm:pr-4">
              <span className="text-xl">👤</span>
              <div>
                <span className="text-[10px] uppercase font-bold text-masaar-black/50">Prepared for</span>
                <p className="font-bold text-sm text-masaar-black">{document.client_name}</p>
                <p className="text-[11px] text-masaar-black/60">{document.client_country || "Dubai, UAE"}</p>
              </div>
            </div>

            {/* Travel Dates */}
            <div className="flex items-center gap-3 border-b sm:border-b-0 sm:border-r border-black/10 pb-3 sm:pb-0 sm:pr-4">
              <span className="text-xl">📅</span>
              <div>
                <span className="text-[10px] uppercase font-bold text-masaar-black/50">Travel Dates</span>
                <p className="font-bold text-sm text-masaar-black">{travelDatesFormatted}</p>
              </div>
            </div>

            {/* Travellers */}
            <div className="flex items-center gap-3 border-b sm:border-b-0 sm:border-r border-black/10 pb-3 sm:pb-0 sm:pr-4">
              <span className="text-xl">👥</span>
              <div>
                <span className="text-[10px] uppercase font-bold text-masaar-black/50">Travellers</span>
                <p className="font-bold text-sm text-masaar-black">
                  {document.adults} Adults, {document.children || 0} Children
                </p>
              </div>
            </div>

            {/* Blessing Card */}
            <div className="text-right sm:pl-4">
              <p className="font-serif italic text-xs text-[#865d1d]">
                &ldquo;May your journey be accepted and filled with ease.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Acceptance / Revision alerts */}
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        {acceptedNotice && (
          <div className="rounded-2xl border border-green-300 bg-green-50 p-4 text-green-900 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✓</span>
              <div>
                <p className="font-bold text-sm">Quotation Accepted! JazakAllahu Khairan.</p>
                <p className="text-xs text-green-800">
                  Our dedicated concierge team is now preparing your booking confirmation, official invoice, and travel documents.
                </p>
              </div>
            </div>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-green-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-green-800"
            >
              Chat on WhatsApp →
            </a>
          </div>
        )}

        {requestSent && (
          <div className="rounded-2xl border border-[#b37e28]/40 bg-[#fbf6ec] p-4 text-[#845c19] shadow-sm flex items-center gap-3">
            <span className="text-2xl">✉️</span>
            <div>
              <p className="font-bold text-sm">Your change request has been submitted!</p>
              <p className="text-xs text-[#845c19]/80">
                Our advisors will review your selected options and prepare a revised quotation for you shortly.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 4. Main Two-Column Layout (Left Modules | Right Sticky Summary) */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Left Column: Modules (8 Cols) */}
          <div className="space-y-6 lg:col-span-8 [&>div]:break-inside-avoid">
            {/* Module 1: Package Overview */}
            <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-black/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📦</span>
                  <h2 className="font-serif text-lg font-bold text-masaar-black">
                    Package Overview
                  </h2>
                </div>
                <span className="rounded-full bg-[#fbf6ec] border border-[#b37e28]/30 px-3 py-1 text-xs font-bold text-[#865d1d]">
                  {packageBadge}
                </span>
              </div>

              <div className="grid gap-5 md:grid-cols-12 items-center">
                <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-black/10 md:col-span-5">
                  <Image
                    src="/Assets/hajj-banner.png"
                    alt="Package"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="md:col-span-7 space-y-2">
                  <h3 className="font-serif text-xl font-bold text-masaar-black">
                    {packageItem?.description || `${durationLabel} Tailored ${isHajj ? "Hajj" : "Umrah"} Journey`}
                  </h3>
                  <p className="text-xs text-masaar-black/70 leading-relaxed font-sans">
                    {packageItem?.details ||
                      "A tailored, peaceful pilgrimage experience with 5★ luxury accommodation, private vehicle airport transfers, scheduled direct flights, and dedicated team support."}
                  </p>
                </div>
              </div>

              {/* Amenity Icons Row */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 border-t border-black/10 pt-4 text-center">
                <div className="p-2 rounded-lg bg-neutral-50 border border-black/5">
                  <span className="text-lg">✈️</span>
                  <p className="text-[11px] font-bold mt-1 text-masaar-black">Direct Flights</p>
                </div>
                <div className="p-2 rounded-lg bg-neutral-50 border border-black/5">
                  <span className="text-lg">⛰️</span>
                  <p className="text-[11px] font-bold mt-1 text-masaar-black">Sacred Sites</p>
                </div>
                <div className="p-2 rounded-lg bg-neutral-50 border border-black/5">
                  <span className="text-lg">🏢</span>
                  <p className="text-[11px] font-bold mt-1 text-masaar-black">Haram Proximity</p>
                </div>
                <div className="p-2 rounded-lg bg-neutral-50 border border-black/5">
                  <span className="text-lg">⛺</span>
                  <p className="text-[11px] font-bold mt-1 text-masaar-black">5★ Hospitality</p>
                </div>
                <div className="p-2 rounded-lg bg-neutral-50 border border-black/5">
                  <span className="text-lg">👥</span>
                  <p className="text-[11px] font-bold mt-1 text-masaar-black">Dedicated Team</p>
                </div>
              </div>
            </div>

            {/* Module 2: Accommodation (Dynamic based on selected hotels) */}
            <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-black/10 pb-3">
                <span className="text-xl">🏨</span>
                <h2 className="font-serif text-lg font-bold text-masaar-black">
                  Accommodation
                </h2>
              </div>

              {hotels.length > 0 ? (
                <div className={`grid gap-4 ${hotels.length > 1 ? "sm:grid-cols-2" : "grid-cols-1"}`}>
                  {hotels.map((h, idx) => {
                    const isMakkah = h.description.toLowerCase().includes("makkah");
                    const isMadinah = h.description.toLowerCase().includes("madinah");
                    const tag = isMakkah ? "Holy Makkah" : isMadinah ? "Madinah Al Munawwarah" : "Hotel Accommodation";
                    const img = getHotelImage(h.description, isMakkah ? "Makkah" : isMadinah ? "Madinah" : undefined);
                    return (
                      <div key={h.id || idx} className="overflow-hidden rounded-xl border border-black/10 bg-[#FAF9F7]">
                        <div className="relative aspect-video w-full overflow-hidden">
                          <Image
                            src={img}
                            alt={h.description}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                          <div className="absolute top-2 left-2 rounded-md bg-black/75 px-2 py-0.5 text-[10px] font-bold text-white">
                            {tag}
                          </div>
                        </div>
                        <div className="p-4 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <h4 className="font-serif font-bold text-sm text-masaar-black">
                              {h.description}
                            </h4>
                            <span className="text-xs text-[#D4AF37]">★★★★★</span>
                          </div>
                          <p className="text-xs text-masaar-black/60 flex items-center gap-1.5">
                            <span>📍 Prime Location</span>
                            <span>•</span>
                            <span>{h.quantity} Nights</span>
                          </p>
                          <p className="text-[11px] text-masaar-black/70 pt-1 border-t border-black/5">
                            {h.details || "Luxury room with daily buffet breakfast included."}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-black/10 bg-[#FAF9F7] p-4 text-xs text-masaar-black/60 italic">
                  Hotel accommodation to be selected.
                </div>
              )}
            </div>

            {/* Module 3: Transportation */}
            <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-black/10 pb-3">
                <span className="text-xl">🚗</span>
                <h2 className="font-serif text-lg font-bold text-masaar-black">
                  Transportation
                </h2>
              </div>

              <div className="grid gap-5 md:grid-cols-12 items-center">
                <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-black/10 md:col-span-5 bg-neutral-100">
                  <Image
                    src={getTransportImage(transport?.description, transport?.details)}
                    alt={transport?.description || "Private Transfer"}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="md:col-span-7 space-y-2">
                  <h4 className="font-serif text-base font-bold text-masaar-black">
                    {transport?.description || "Private Chauffeured Airport Transfers"}
                  </h4>
                  <p className="text-xs text-masaar-black/60 leading-relaxed font-sans">
                    {transport?.details || "Dedicated private air-conditioned vehicle with professional chauffeur and meet & assist service."}
                  </p>
                  <ul className="text-xs space-y-1.5 pt-2 border-t border-black/5 font-sans">
                    <li className="flex items-center gap-2">
                      <span className="text-[#b37e28]">✓</span>
                      <span>Dedicated air-conditioned private vehicle with professional driver</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-[#b37e28]">✓</span>
                      <span>Airport meet &amp; greet assistance and seamless luggage handling</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Module 4: 2-Column Flights & Meals */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Flights Card */}
              <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2 border-b border-black/10 pb-2">
                  <span className="text-lg">✈️</span>
                  <h4 className="font-serif font-bold text-sm text-masaar-black">
                    Flights
                  </h4>
                </div>
                <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-black/10">
                  <Image
                    src="/Assets/image-flight.jpg"
                    alt="Flight"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div>
                  <h5 className="font-serif font-bold text-sm text-masaar-black">
                    {flight?.description || "Direct Scheduled Return Flights"}
                  </h5>
                  <p className="text-xs text-masaar-black/60 mt-1 whitespace-pre-line">
                    {flight?.details || "Direct scheduled flights with luggage allowance included."}
                  </p>
                </div>
              </div>

              {/* Meals Card */}
              <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2 border-b border-black/10 pb-2">
                  <span className="text-lg">🍽️</span>
                  <h4 className="font-serif font-bold text-sm text-masaar-black">
                    Meals
                  </h4>
                </div>
                <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-black/10 bg-neutral-100 flex items-center justify-center">
                  <Image
                    src="/Assets/image-meal.jpg"
                    alt="Meals"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div>
                  <h5 className="font-serif font-bold text-sm text-masaar-black">
                    {meals?.description || "Luxury Buffet Breakfast Included"}
                  </h5>
                  <p className="text-xs text-masaar-black/60 mt-1">
                    {meals?.details || "Daily international luxury buffet breakfast served fresh in the 5★ hotel dining hall."}
                  </p>
                </div>
              </div>
            </div>

            {/* Module 5: Itinerary Highlights Timeline (Dynamic) */}
            {!isItineraryExplicitlyRemoved && activeItinerary.length > 0 && (
              <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-black/10 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📋</span>
                    <h3 className="font-serif text-lg font-bold text-masaar-black">
                      Itinerary Highlights
                    </h3>
                  </div>
                  <span className="text-xs font-semibold text-[#865d1d]">
                    {activeItinerary.length} Days Itinerary ({durationLabel})
                  </span>
                </div>

                {/* Visual timeline dynamically rendered across all days */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-center">
                  {activeItinerary.map((m, idx) => {
                    const defaultIcon =
                      idx === 0
                        ? "✈️"
                        : idx === activeItinerary.length - 1
                        ? "✈️"
                        : m.title.toLowerCase().includes("train")
                        ? "🚄"
                        : m.title.toLowerCase().includes("madinah") || m.title.toLowerCase().includes("rawdah")
                        ? "🕌"
                        : "🕋";
                    const icon = m.icon || defaultIcon;
                    return (
                      <div key={idx} className="rounded-xl border border-black/10 bg-[#FAF9F7] p-3 space-y-1.5 flex flex-col justify-start">
                        <span className="text-xl">{icon}</span>
                        <p className="font-bold text-xs text-masaar-black line-clamp-1">{m.title || `Day ${m.day || idx + 1}`}</p>
                        <p className="text-[11px] text-masaar-black/60 line-clamp-2 leading-snug">{m.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Module 6: Additional Services & Add-ons */}
            <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-black/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">✨</span>
                  <h3 className="font-serif text-lg font-bold text-masaar-black">
                    Additional Services &amp; Add-ons
                  </h3>
                </div>
                <span className="text-xs font-semibold text-[#865d1d]">
                  {additional.length} Inclusions Configured
                </span>
              </div>

              {additional.length === 0 ? (
                <div className="space-y-2 text-xs text-masaar-black/70">
                  <div className="flex items-center gap-2">
                    <span className="text-[#b37e28]">✓</span>
                    <span>Haramain High-Speed Train ticket (Makkah → Madinah)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#b37e28]">✓</span>
                    <span>Guided Historical Ziyarat in Makkah Mukarramah &amp; Madinah Munawwarah</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#b37e28]">✓</span>
                    <span>Saudi Electronic Tourist / Umrah Visa with mandatory KSA medical insurance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#b37e28]">✓</span>
                    <span>24/7 Dedicated On-Ground Concierge &amp; Pilgrimage Support</span>
                  </div>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {additional.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-black/10 bg-[#FAF9F7] p-3.5 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#865d1d]">
                            {item.item_type.replace(/_/g, " ")}
                          </span>
                          {item.amount_aed ? (
                            <span className="text-xs font-bold text-masaar-black">
                              AED {Number(item.amount_aed).toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-green-700 bg-green-100/80 px-2 py-0.5 rounded">
                              INCLUDED
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-xs text-masaar-black mt-1">
                          {item.description}
                        </h4>
                        {item.details && (
                          <p className="text-[11px] text-masaar-black/60 mt-1 line-clamp-2">
                            {item.details}
                          </p>
                        )}
                      </div>
                      <div className="mt-2.5 pt-2 border-t border-black/5 flex items-center justify-between text-[11px] text-masaar-black/50">
                        <span>Quantity: {item.quantity || 1}</span>
                        <span className="text-green-700 font-semibold">✓ Confirmed Inclusion</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Sticky Quotation Summary & CTAs (4 Cols) */}
          <div className="lg:col-span-4">
            <div className="sticky top-20 space-y-4">
              <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-md space-y-5">
                {/* Header */}
                <div className="flex items-center gap-2 border-b border-black/10 pb-3">
                  <span className="text-lg">📄</span>
                  <h3 className="font-serif text-lg font-bold text-masaar-black">
                    Quotation Summary
                  </h3>
                </div>

                {/* Breakdown List */}
                <div className="space-y-3 text-xs font-sans">
                  <div className="flex justify-between text-masaar-black/70">
                    <span>Package</span>
                    <span className="font-semibold text-masaar-black">
                      {packageItem?.description || (isHajj ? "Hajj 2027 – Platinum" : "Umrah 2026 – Platinum")}
                    </span>
                  </div>

                  <div className="flex justify-between text-masaar-black/70">
                    <span>Travel Dates</span>
                    <span className="font-semibold text-masaar-black">{travelDatesFormatted}</span>
                  </div>

                  <div className="flex justify-between text-masaar-black/70">
                    <span>Travellers</span>
                    <span className="font-semibold text-masaar-black">
                      {document.adults} Adults{document.children ? `, ${document.children} Children` : ""}
                    </span>
                  </div>

                  {hotels.length > 0 ? (
                    hotels.map((h, i) => (
                      <div key={h.id || i} className="flex justify-between text-masaar-black/70">
                        <span>{hotels.length > 1 ? `Hotel #${i + 1}` : "Hotel"}</span>
                        <span className="font-semibold text-masaar-black text-right max-w-[180px] truncate">{h.description}</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex justify-between text-masaar-black/70">
                      <span>Hotel</span>
                      <span className="font-semibold text-masaar-black">To be confirmed</span>
                    </div>
                  )}

                  <div className="flex justify-between text-masaar-black/70">
                    <span>Room Type</span>
                    <span className="font-semibold text-masaar-black">
                      {document.notes?.includes("QUAD")
                        ? "QUAD"
                        : document.notes?.includes("TRIPLE")
                        ? "TRIPLE"
                        : "TWIN/DOUBLE"}
                    </span>
                  </div>

                  <div className="flex justify-between text-masaar-black/70">
                    <span>Transport</span>
                    <span className="font-semibold text-masaar-black text-right max-w-[180px] truncate">
                      {transport?.description || "Private Airport Transfers"}
                    </span>
                  </div>

                  <div className="flex justify-between text-masaar-black/70">
                    <span>Flights</span>
                    <span className="font-semibold text-masaar-black text-right max-w-[180px] truncate">
                      {flight?.description || "Scheduled Direct Flights"}
                    </span>
                  </div>

                  {additional.length > 0 && (
                    <div className="flex justify-between text-masaar-black/70 border-t border-black/5 pt-2">
                      <span>Add-ons &amp; Services</span>
                      <span className="font-bold text-[#865d1d]">{additional.length} Inclusions</span>
                    </div>
                  )}
                </div>

                {/* Total Box matching user's exact specification */}
                <div className="rounded-xl border border-[#b37e28]/40 bg-gradient-to-br from-[#FAF6EE] to-[#F5ECE0] p-4 space-y-2.5 text-xs shadow-xs">
                  <div className="flex justify-between items-center text-masaar-black font-semibold border-b border-black/10 pb-2">
                    <span className="text-xs uppercase tracking-wider font-bold text-masaar-black/80">Total Package Price</span>
                    <span className="font-bold text-base text-masaar-black">AED {Number(packageSubtotal).toLocaleString()}</span>
                  </div>

                  {/* Component items sub-breakdown */}
                  <div className="space-y-1.5 text-[11px] text-masaar-black/75 pb-1">
                    {hotelAndTransportTotal > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-1.5">
                          <span className="text-[#b37e28]">✓</span> Hotel &amp; Transport
                        </span>
                        <span className="font-semibold text-masaar-black">AED {Number(hotelAndTransportTotal).toLocaleString()}</span>
                      </div>
                    )}
                    {flightTotal > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-1.5">
                          <span className="text-[#b37e28]">✓</span> Flights ({flight?.quantity || document.adults} Pax)
                        </span>
                        <span className="font-semibold text-masaar-black">AED {Number(flightTotal).toLocaleString()}</span>
                      </div>
                    )}
                    {additionalTotal > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-1.5">
                          <span className="text-[#b37e28]">✓</span> Add-ons &amp; Services ({additional.length} {additional.length === 1 ? "Inclusion" : "Inclusions"})
                        </span>
                        <span className="font-semibold text-masaar-black">AED {Number(additionalTotal).toLocaleString()}</span>
                      </div>
                    )}
                    {mealsTotal > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-1.5">
                          <span className="text-[#b37e28]">✓</span> Dining &amp; Meals ({meals?.quantity || document.adults} Pax)
                        </span>
                        <span className="font-semibold text-masaar-black">AED {Number(mealsTotal).toLocaleString()}</span>
                      </div>
                    )}
                    {packageItemsTotal > 0 && hotelAndTransportTotal === 0 && (
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-1.5">
                          <span className="text-[#b37e28]">✓</span> Package Inclusions
                        </span>
                        <span className="font-semibold text-masaar-black">AED {Number(packageItemsTotal).toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center border-t border-black/10 pt-2 font-bold text-masaar-black text-xs">
                    <span>{hasVat ? "VAT (5%)" : "VAT (0% / Tax Inclusive)"}</span>
                    <span>AED {Number(vatAmount).toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center border-t-2 border-[#b37e28] pt-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#865d1d]">
                      Final Price
                    </span>
                    <span className="font-serif text-2xl font-bold text-masaar-black">
                      AED {Number(finalPrice).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Primary CTAs */}
                <div className="space-y-2.5 pt-2 print:hidden">
                  <button
                    type="button"
                    onClick={handleAccept}
                    disabled={isPending || currentStatus === "accepted"}
                    className="w-full rounded-xl bg-gradient-to-r from-[#b37e28] to-[#96671e] py-3.5 text-xs font-bold text-white shadow-sm hover:from-[#9c6d1f] hover:to-[#845a17] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    <span>✓</span>
                    <span>{currentStatus === "accepted" ? "Quotation Accepted" : "Accept Quotation →"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsRequestModalOpen(true)}
                    className="w-full rounded-xl border border-black/20 bg-white py-2.5 text-xs font-semibold text-masaar-black hover:bg-black/[0.02] transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>✏️</span>
                    <span>Request Changes (via WhatsApp)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="w-full rounded-xl border border-black/10 bg-[#FAF9F7] py-2.5 text-xs font-semibold text-masaar-black hover:bg-black/5 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>📥</span>
                    <span>Download PDF / Print</span>
                  </button>

                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full rounded-xl border border-[#25D366]/40 bg-[#25D366]/10 py-2.5 text-xs font-bold text-[#1b7e3e] hover:bg-[#25D366]/20 transition-colors flex items-center justify-center gap-2"
                  >
                    <span>💬</span>
                    <span>Ask Questions on WhatsApp</span>
                  </a>
                </div>

                {/* Security Badge */}
                <div className="rounded-lg bg-neutral-50 p-2.5 text-center text-[10px] text-masaar-black/50 flex items-center justify-center gap-1.5 border border-black/5 print:hidden">
                  <span>🔒</span>
                  <span>This is a secure link shared by Masaar Holidays. Your information is safe with us.</span>
                </div>

                {/* Spiritual Brand Card */}
                <div className="rounded-2xl border border-[#b37e28]/20 bg-gradient-to-b from-[#fbf8f2] to-white p-5 text-center space-y-1 break-inside-avoid">
                  <span className="text-2xl">🤲</span>
                  <p className="font-serif italic text-xs font-bold text-masaar-black">
                    &ldquo;Not just a journey. A higher purpose.&rdquo;
                  </p>
                  <p className="text-[10px] uppercase tracking-widest text-[#865d1d] font-bold">
                    Masaar Holidays
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 5. Interactive Request Changes Modal (Exact match EDITING QUOTATION.png Step 3) */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs no-print">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-black/10 pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-masaar-black">
                  Request Changes
                </h3>
                <p className="text-xs text-masaar-black/50 mt-0.5">
                  Quotation {document.document_number} • Direct WhatsApp Assistance
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsRequestModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="rounded-xl bg-[#fbf6ec] border border-[#b37e28]/30 p-3 text-xs text-[#845c19] flex items-start gap-2">
              <span>ℹ️</span>
              <span>Select what you would like changed. Your request will be recorded and sent directly to our travel concierge on WhatsApp for prompt revision.</span>
            </div>

            <form onSubmit={handleSubmitChangeRequest} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-masaar-black mb-2">
                  What would you like to change?
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {CHANGE_OPTIONS.map((opt) => (
                    <label
                      key={opt}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-black/10 p-2.5 hover:bg-black/[0.02]"
                    >
                      <input
                        type="checkbox"
                        checked={selectedChanges.has(opt)}
                        onChange={() => toggleChangeOption(opt)}
                        className="rounded border-black/20 text-[#b37e28] focus:ring-[#b37e28] cursor-pointer"
                      />
                      <span className="font-medium text-masaar-black">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-masaar-black mb-1">
                  Additional message / notes (optional)
                </label>
                <textarea
                  rows={4}
                  value={changeMessage}
                  onChange={(e) => setChangeMessage(e.target.value)}
                  placeholder="e.g. I would prefer a hotel closer to Haram. Also, please check if a room with Kaaba view is available."
                  className="w-full rounded-xl border border-black/15 p-3 text-xs focus:border-[#b37e28] focus:outline-hidden focus:ring-1 focus:ring-[#b37e28]"
                />
                <div className="text-right text-[10px] text-masaar-black/40 mt-1">
                  {changeMessage.length}/500
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-black/10">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="rounded-xl border border-black/15 px-4 py-2.5 text-xs font-semibold text-masaar-black hover:bg-black/[0.02] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-xl bg-gradient-to-r from-[#b37e28] to-[#96671e] px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:from-[#9c6d1f] hover:to-[#845a17] transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <span>💬</span>
                  <span>{isPending ? "Submitting…" : "Submit & Send via WhatsApp"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Accept Quotation Celebration Modal */}
      {showAcceptCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs no-print">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">
              🎉
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#b37e28]">
                ALHAMDULILLAH • QUOTATION ACCEPTED
              </span>
              <h3 className="font-serif text-xl font-bold text-masaar-black mt-1">
                JazakAllahu Khairan!
              </h3>
              <p className="text-xs text-masaar-black/70 mt-1 leading-relaxed">
                Thank you, <strong>{document.client_name}</strong>. Your acceptance of Quotation <strong>{document.document_number}</strong> (AED {Number(document.total_aed || 9240).toLocaleString()}) has been confirmed.
              </p>
            </div>

            <div className="rounded-xl border border-[#b37e28]/30 bg-[#fbf6ec] p-3 text-xs text-[#845c19] text-left space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <span>🛎️</span> Next Steps with Concierge:
              </p>
              <p className="text-[11px] text-[#845c19]/90">
                Our reservations desk has locked in your package. Send a confirmation message to our travel team on WhatsApp to finalize traveler passports, payment schedule, and official vouchers.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <a
                href={acceptWaUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full rounded-xl bg-[#25D366] hover:bg-[#20ba5a] py-3 text-xs font-bold text-white shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span className="text-sm">💬</span>
                <span>Confirm on WhatsApp Now</span>
              </a>

              <button
                type="button"
                onClick={() => setShowAcceptCelebration(false)}
                className="w-full rounded-xl border border-black/15 py-2.5 text-xs font-semibold text-masaar-black hover:bg-black/5 cursor-pointer"
              >
                Close &amp; View Itinerary
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print-only Luxury Footer */}
      <div className="hidden print:block text-center py-6 text-xs text-masaar-black/70 border-t border-black/15 mt-8 break-inside-avoid">
        <p className="font-serif text-sm font-bold text-masaar-black">Masaar Holidays LLC</p>
        <p className="text-[11px] mt-1 text-masaar-black/60">
          Dubai, United Arab Emirates • Contact: +971 55 227 6299 • care@masaarholidays.com • www.masaarholidays.com
        </p>
        <p className="font-serif italic text-[11px] text-[#865d1d] mt-2">
          &ldquo;Not just a journey. A higher purpose. Faith • Clarity • Care • Peace.&rdquo;
        </p>
      </div>

      {/* 6. Branded Footer (Web only) */}
      <footer className="border-t border-black/10 bg-[#161412] text-white py-12 mt-16 print:hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-white/10">
            <div className="relative h-10 w-36">
              <Image
                src="/Assets/logo-reverse.png"
                alt="Masaar Holidays"
                fill
                className="object-contain object-left"
              />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-white/70">
              <Link href="/umrah" className="hover:text-white">Umrah</Link>
              <Link href="/hajj" className="hover:text-white">Hajj</Link>
              <Link href="/hotels" className="hover:text-white">Hotels</Link>
              <Link href="/transfers" className="hover:text-white">Transfers</Link>
              <Link href="/visa" className="hover:text-white">Visa</Link>
            </div>

            <div className="text-xs text-white/60 space-y-1 text-center md:text-right">
              <p>📞 +971 55 227 6299</p>
              <p>✉️ care@masaarholidays.com</p>
            </div>
          </div>

          <div className="pt-6 text-center text-xs text-white/40 font-serif italic">
            © 2026 Masaar Holidays. All rights reserved. Faith • Clarity • Care • Peace.
          </div>
        </div>
      </footer>
    </div>
  );
}
