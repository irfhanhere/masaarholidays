"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { respondToQuotation } from "./actions";
import type {
  DocumentItemRow,
  DocumentRow,
  DocumentTemplateRow,
} from "@/lib/types/database";
import {
  calculateDateRangeMetrics,
  formatDisplayDate,
  reconcileItineraryDays,
  calculateQuotationTotals,
  resolveServiceImage,
  type ItineraryDayItem,
} from "@/lib/documents/calculations";
import {
  formatCardWalkTime,
  formatLadiesGateWalkTime,
  formatMensGateWalkTime,
  formatDistance,
} from "@/lib/hotel-format";

const CHANGE_OPTIONS = [
  "Hotel Accommodation",
  "Room Type / Sharing",
  "Private Vehicle / Class",
  "Flight Schedule / Class",
  "Number of Nights / Dates",
  "Add Service (e.g. Train, Visa)",
  "Remove Service",
  "Budget Adjustment",
  "Other Requirements",
];

export function ClientQuotationPortal({
  token,
  document,
  items,
  template,
  whatsappPhone,
  isPrintMode = false,
  hotelsCatalog = [],
}: {
  token: string;
  document: DocumentRow;
  items: DocumentItemRow[];
  template: DocumentTemplateRow | null;
  whatsappPhone: string;
  isPrintMode?: boolean;
  hotelsCatalog?: any[];
}) {
  const [currentStatus, setCurrentStatus] = useState(document.status);
  const [isPending, startTransition] = useTransition();

  // Modals
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false);

  // Modal form states
  const [selectedChanges, setSelectedChanges] = useState<Set<string>>(new Set());
  const [changeMessage, setChangeMessage] = useState("");
  const [declineReason, setDeclineReason] = useState("");
  const [acceptedNotice, setAcceptedNotice] = useState(currentStatus === "accepted");
  const [declinedNotice, setDeclinedNotice] = useState(currentStatus === "rejected");

  const cleanPhone = (whatsappPhone || "971552276299").replace(/\D/g, "");
  const isHajj = document.journey_type === "hajj";
  const journeyTitle = isHajj
    ? `Your Hajj Journey Proposal`
    : `Your Personalised Umrah Journey Proposal`;

  // 1. Authoritative date and duration metrics (single source of truth)
  const dateMetrics = calculateDateRangeMetrics(
    document.travel_date,
    document.return_date,
    4
  );

  // 2. Authoritative pricing calculation
  const pricing = calculateQuotationTotals(
    items.map((it) => ({
      id: it.id,
      item_type: it.item_type,
      description: it.description,
      details: it.details,
      quantity: it.quantity,
      unit_price_aed: it.unit_price_aed,
      discount_aed: it.discount_aed,
      is_price_on_request: it.details?.includes("[price_on_request]") || false,
      is_included: it.unit_price_aed === 0,
    })),
    {
      applyVat: document.tax_aed != null ? Number(document.tax_aed) > 0 : false,
      vatRate: 0.05,
      documentDiscountAed: Number(document.discount_aed) || 0,
      agreedTotalOverride: Number(document.total_aed) || null,
    }
  );

  // 3. Authoritative itinerary reconciliation (exact calendar days match)
  let savedItinerary: ItineraryDayItem[] = [];
  if (document.special_requirements) {
    try {
      const parsed = JSON.parse(document.special_requirements);
      if (Array.isArray(parsed) && parsed.length > 0) {
        savedItinerary = parsed;
      }
    } catch {}
  }
  const displayItinerary = reconcileItineraryDays(
    savedItinerary,
    dateMetrics.calendarDays,
    dateMetrics.startDate,
    isHajj
  );

  // 4. Categorized services
  const hotels = items.filter(
    (i) => i.item_type === "hotel" || (i.item_type as any) === "accommodation"
  );
  const flights = items.filter((i) => i.item_type === "flight");
  const trains = items.filter(
    (i) =>
      (i.item_type as any) === "train" ||
      i.description.toLowerCase().includes("train") ||
      i.description.toLowerCase().includes("haramain")
  );
  const transfers = items.filter(
    (i) =>
      i.item_type === "transfer" &&
      !i.description.toLowerCase().includes("train") &&
      !i.description.toLowerCase().includes("haramain")
  );
  const otherServices = items.filter(
    (i) =>
      !["hotel", "accommodation", "flight", "transfer", "umrah_package", "hajj_package"].includes(
        i.item_type
      ) &&
      !i.description.toLowerCase().includes("train") &&
      !i.description.toLowerCase().includes("haramain")
  );

  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/quote/${token}`
      : `https://masaarholidays.com/quote/${token}`;

  // WhatsApp contact URLs
  const generalWaText = `Assalamu Alaikum Masaar Holidays, I am reviewing Quotation ${document.document_number} for ${document.client_name} (AED ${pricing.totalAed.toLocaleString()}) and would like to speak with a travel advisor.\n\nLink: ${publicUrl}`;
  const generalWaUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(generalWaText)}`;

  const acceptWaText = `Assalamu Alaikum Masaar Holidays,
I am pleased to confirm that I have accepted Quotation ${document.document_number} for ${document.client_name} (Total: AED ${pricing.totalAed.toLocaleString()}).

Please proceed with booking confirmation, official invoice, and payment schedule.
Quotation link: ${publicUrl}

JazakAllahu Khairan!`;
  const acceptWaUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(acceptWaText)}`;

  function handleAcceptConfirm() {
    startTransition(async () => {
      try {
        const next = await respondToQuotation(token, "accept");
        setCurrentStatus(next);
      } catch (err) {
        console.error("Accept quotation error:", err);
      }
      setIsAcceptModalOpen(false);
      setAcceptedNotice(true);
    });
  }

  function handleDeclineConfirm() {
    startTransition(async () => {
      try {
        const next = await respondToQuotation(token, "decline", { declineReason });
        setCurrentStatus(next);
      } catch (err) {
        console.error("Decline quotation error:", err);
      }
      setIsDeclineModalOpen(false);
      setDeclinedNotice(true);
    });
  }

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
I am reviewing Quotation ${document.document_number} for ${document.client_name} (AED ${pricing.totalAed.toLocaleString()}).

I would like to request changes to my journey:
• Categories: ${catsText}
${changeMessage.trim() ? `• Specific Details: ${changeMessage.trim()}\n` : ""}• View Quotation: ${publicUrl}

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

      if (typeof window !== "undefined") {
        window.open(waUrl, "_blank");
      }
    });
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1A1816] font-sans selection:bg-[#c9983e]/20 selection:text-[#1A1816]">
      {/* 1. Header with approved Masaar Logo & Contact */}
      <header className="border-b border-black/10 bg-white/95 backdrop-blur-md sticky top-0 z-30">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="relative block h-9 w-32 sm:h-10 sm:w-36">
              <Image
                src="/brand/logo.png"
                alt="Masaar Holidays"
                fill
                priority
                className="object-contain object-left"
              />
            </Link>
          </div>

          <div className="hidden lg:flex items-center gap-6 font-serif text-[11px] font-bold uppercase tracking-[0.25em] text-[#865d1d]">
            <span>FAITH</span>
            <span>•</span>
            <span>CLARITY</span>
            <span>•</span>
            <span>CARE</span>
            <span>•</span>
            <span>PEACE</span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="rounded-full bg-[#FAF8F5] border border-[#c9983e]/30 px-3 py-1 font-mono text-[11px] font-semibold text-[#865d1d]">
              Ref: {document.document_number}
            </div>

            <a
              href={generalWaUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-full border border-[#25D366]/40 bg-[#25D366]/10 px-3.5 py-1.5 font-bold text-[#1b7e3e] hover:bg-[#25D366]/20 transition-colors"
            >
              <span className="text-sm">💬</span>
              <span className="hidden sm:inline">Concierge WhatsApp</span>
            </a>
          </div>
        </div>
      </header>

      {/* 2. Hero Digital Brochure Banner (Matching Mr. Obaid Shaikh reference) */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#181614] to-[#25221E] text-white">
        <div className="absolute inset-0 opacity-25 mix-blend-luminosity">
          <Image
            src="/trips/destination-image.webp"
            alt="Makkah & Madinah Holy Sanctuaries"
            fill
            priority
            className="object-cover object-center"
            unoptimized
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#181614] via-[#181614]/70 to-transparent" />

        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#c9983e]/20 border border-[#c9983e]/40 px-3.5 py-1 text-xs font-serif font-bold uppercase tracking-[0.2em] text-[#E0C070]">
                <span>🕋</span>
                <span>MASAAR BESPOKE PILGRIMAGE PROPOSAL</span>
              </div>
              <h1 className="mt-4 font-serif text-3xl font-bold tracking-tight text-white sm:text-5xl">
                {journeyTitle}
              </h1>
              <p className="mt-2 text-base text-white/80 font-sans leading-relaxed">
                Prepared exclusively for <strong className="text-white font-semibold">{document.client_name}</strong>
              </p>
            </div>

            {/* Status indicator */}
            <div className="shrink-0 flex flex-col items-start md:items-end gap-2">
              <span className="text-[11px] uppercase font-bold tracking-wider text-white/50">Quotation Status</span>
              {currentStatus === "accepted" ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 px-4 py-1.5 text-xs font-bold text-emerald-300">
                  <span>✓</span> Accepted &amp; Confirmed
                </span>
              ) : currentStatus === "rejected" ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 border border-red-400/40 px-4 py-1.5 text-xs font-bold text-red-300">
                  <span>✕</span> Declined
                </span>
              ) : currentStatus === "revision_requested" ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 px-4 py-1.5 text-xs font-bold text-amber-300">
                  <span>✏️</span> Revision Requested
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#c9983e]/20 border border-[#c9983e]/40 px-4 py-1.5 text-xs font-bold text-[#E0C070]">
                  <span>⏳</span> Awaiting Client Review
                </span>
              )}
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-2xl bg-white/5 border border-white/10 p-4 backdrop-blur-xs text-xs">
            <div>
              <span className="text-white/50 block text-[10px] uppercase font-bold tracking-wider">Travel Dates</span>
              <span className="font-semibold text-white mt-0.5 block">
                {formatDisplayDate(dateMetrics.startDate)} – {formatDisplayDate(dateMetrics.endDate)}
              </span>
            </div>
            <div>
              <span className="text-white/50 block text-[10px] uppercase font-bold tracking-wider">Duration</span>
              <span className="font-semibold text-[#E0C070] mt-0.5 block">
                {dateMetrics.durationLabel}
              </span>
            </div>
            <div>
              <span className="text-white/50 block text-[10px] uppercase font-bold tracking-wider">Travellers</span>
              <span className="font-semibold text-white mt-0.5 block">
                {document.adults || 2} Adults
                {document.children ? `, ${document.children} Children` : ""}
                {document.infants ? `, ${document.infants} Infants` : ""}
              </span>
            </div>
            <div>
              <span className="text-white/50 block text-[10px] uppercase font-bold tracking-wider">Route</span>
              <span className="font-semibold text-white mt-0.5 block truncate">
                {document.origin || "Dubai"} → {document.destination || "Jeddah / Madinah"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Main Content: Proposal Details + Pricing Sidebar */}
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          {/* LEFT 2 COLUMNS: Itinerary, Accommodation, Transport, Services */}
          <div className="space-y-12 lg:col-span-2">

            {/* Status alerts */}
            {acceptedNotice && (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50 p-5 text-emerald-950 flex items-start gap-3">
                <span className="text-2xl">🎉</span>
                <div className="text-xs">
                  <h4 className="font-bold text-sm text-emerald-900">Alhamdulillah! Quotation Accepted</h4>
                  <p className="mt-1 text-emerald-800 leading-relaxed">
                    Thank you, {document.client_name}. Your quotation has been accepted. Our concierge desk will contact you to finalize bookings and payment.
                  </p>
                  <a
                    href={acceptWaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3.5 py-1.5 font-bold text-white text-xs hover:bg-[#20ba59] transition-colors"
                  >
                    <span>💬</span> Message Concierge on WhatsApp
                  </a>
                </div>
              </div>
            )}

            {declinedNotice && (
              <div className="rounded-2xl border border-neutral-300 bg-neutral-100 p-5 text-neutral-800 flex items-start gap-3">
                <span className="text-2xl">ℹ️</span>
                <div className="text-xs">
                  <h4 className="font-bold text-sm text-neutral-900">Quotation Declined</h4>
                  <p className="mt-1 text-neutral-700 leading-relaxed">
                    This quotation has been marked as declined. If you would like to explore alternative dates, hotels, or packages, feel free to contact us anytime.
                  </p>
                </div>
              </div>
            )}

            {/* SECTION A: ACCOMMODATION (When included) */}
            {hotels.length > 0 && (
              <section className="space-y-4">
                <div className="border-b border-black/10 pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-[#1A1816]">
                      Hotel Accommodations
                    </h2>
                    <p className="text-xs text-[#1A1816]/60 mt-0.5">
                      Hand-picked luxury hotels located steps from the Holy Harams.
                    </p>
                  </div>
                  <span className="rounded-full bg-[#FAF8F5] border border-[#c9983e]/30 px-3 py-1 font-serif text-[11px] font-bold text-[#865d1d]">
                    5★ Verified Luxury
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {hotels.map((hotel, idx) => {
                    const imgRes = resolveServiceImage("hotel", hotel.description, hotel.details);
                    return (
                      <div
                        key={hotel.id || idx}
                        className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-xs hover:shadow-md transition-shadow flex flex-col"
                      >
                        <div className="relative h-48 w-full bg-neutral-100">
                          <Image
                            src={imgRes.imageUrl}
                            alt={imgRes.altText}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                          <div className="absolute top-3 left-3 rounded-full bg-black/60 backdrop-blur-xs px-3 py-1 text-[10px] font-bold text-white uppercase tracking-wider">
                            {hotel.description.toLowerCase().includes("madinah") ? "Madinah Al-Munawwarah" : "Holy Makkah"}
                          </div>
                        </div>

                        <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                          <div>
                            <div className="flex items-center gap-1 text-[#c9983e] text-xs">
                              ★★★★★ <span className="text-[10px] text-[#1A1816]/50 font-sans ml-1">5-Star Luxury</span>
                            </div>
                            <h3 className="font-serif text-lg font-bold text-[#1A1816] mt-1">
                              {hotel.description}
                            </h3>
                            {hotel.details && (
                              <p className="text-xs text-[#1A1816]/70 mt-1 leading-relaxed">
                                {hotel.details.replace(/•?\s*\[price_[^\]]+\]/g, "").trim()}
                              </p>
                            )}
                          </div>

                          <div className="rounded-xl bg-[#FAF8F5] border border-black/5 p-3 text-xs space-y-1">
                            <div className="flex justify-between text-[#1A1816]/70">
                              <span>Stay Duration:</span>
                              <span className="font-semibold text-[#1A1816]">{hotel.quantity} Nights</span>
                            </div>
                            <div className="flex justify-between text-[#1A1816]/70">
                              <span>Meal Plan:</span>
                              <span className="font-semibold text-[#1A1816]">Daily Gourmet Buffet</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* SECTION B: DAY-BY-DAY ITINERARY (Exact duration match) */}
            <section className="space-y-4">
              <div className="border-b border-black/10 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-[#1A1816]">
                    Your Day-by-Day Journey
                  </h2>
                  <p className="text-xs text-[#1A1816]/60 mt-0.5">
                    Carefully sequenced schedule tailored exactly to your {dateMetrics.calendarDays}-day duration.
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 border border-emerald-300 px-3 py-1 text-[11px] font-bold text-emerald-800">
                  ✓ {dateMetrics.calendarDays} Days Sequenced
                </span>
              </div>

              <div className="space-y-4">
                {displayItinerary.map((dayItem) => {
                  return (
                    <div
                      key={dayItem.day}
                      className="rounded-2xl border border-black/10 bg-white p-5 shadow-xs transition-shadow hover:shadow-md"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex items-start gap-3.5">
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#FAF8F5] border border-[#c9983e]/30 text-lg">
                            {dayItem.icon || "🕋"}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-serif text-xs font-bold uppercase tracking-wider text-[#865d1d]">
                                Day {dayItem.day}
                              </span>
                              <span className="text-[#1A1816]/30">•</span>
                              <span className="text-xs font-medium text-[#1A1816]/60">
                                {formatDisplayDate(dayItem.date, true)}
                              </span>
                            </div>
                            <h3 className="font-serif text-base font-bold text-[#1A1816] mt-0.5">
                              {dayItem.title}
                            </h3>
                          </div>
                        </div>
                      </div>

                      <p className="mt-3 text-xs text-[#1A1816]/80 leading-relaxed font-sans pl-0 sm:pl-[54px]">
                        {dayItem.desc}
                      </p>

                      {dayItem.activities && dayItem.activities.length > 0 && (
                        <div className="mt-3.5 flex flex-wrap gap-1.5 pl-0 sm:pl-[54px]">
                          {dayItem.activities.map((act, aIdx) => (
                            <span
                              key={aIdx}
                              className="rounded-lg bg-[#FAF8F5] border border-black/5 px-2.5 py-1 text-[11px] font-medium text-[#1A1816]/80"
                            >
                              ✓ {act}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* SECTION C: TRANSPORTATION & TRAVEL SERVICES */}
            {(transfers.length > 0 || trains.length > 0 || flights.length > 0) && (
              <section className="space-y-4">
                <div className="border-b border-black/10 pb-3">
                  <h2 className="font-serif text-2xl font-bold text-[#1A1816]">
                    Transportation &amp; Travel Services
                  </h2>
                  <p className="text-xs text-[#1A1816]/60 mt-0.5">
                    Seamless transit with private chauffeurs, flights, and high-speed rail.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Flights */}
                  {flights.map((f, idx) => {
                    const imgRes = resolveServiceImage("flight", f.description, f.details);
                    return (
                      <div
                        key={f.id || idx}
                        className="rounded-2xl border border-black/10 bg-white p-5 shadow-xs flex items-start gap-4"
                      >
                        <div className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-neutral-100">
                          <Image
                            src={imgRes.imageUrl}
                            alt={imgRes.altText}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <div className="text-xs flex-1">
                          <span className="font-mono text-[10px] font-bold text-[#865d1d] uppercase tracking-wider">
                            Flight Booking
                          </span>
                          <h4 className="font-serif text-sm font-bold text-[#1A1816] mt-0.5">
                            {f.description}
                          </h4>
                          {f.details && (
                            <p className="text-[#1A1816]/70 mt-1 leading-relaxed">
                              {f.details.replace(/•?\s*\[price_[^\]]+\]/g, "").trim()}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Haramain High-Speed Train */}
                  {trains.map((tr, idx) => {
                    const imgRes = resolveServiceImage("train", tr.description, tr.details);
                    return (
                      <div
                        key={tr.id || idx}
                        className="rounded-2xl border border-black/10 bg-white p-5 shadow-xs flex items-start gap-4"
                      >
                        <div className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-neutral-100">
                          <Image
                            src={imgRes.imageUrl}
                            alt={imgRes.altText}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <div className="text-xs flex-1">
                          <span className="font-mono text-[10px] font-bold text-[#865d1d] uppercase tracking-wider">
                            High-Speed Rail
                          </span>
                          <h4 className="font-serif text-sm font-bold text-[#1A1816] mt-0.5">
                            {tr.description}
                          </h4>
                          {tr.details && (
                            <p className="text-[#1A1816]/70 mt-1 leading-relaxed">
                              {tr.details.replace(/•?\s*\[price_[^\]]+\]/g, "").trim()}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Private Transfers & Chauffeur */}
                  {transfers.map((tr, idx) => {
                    const imgRes = resolveServiceImage("transfer", tr.description, tr.details);
                    return (
                      <div
                        key={tr.id || idx}
                        className="rounded-2xl border border-black/10 bg-white p-5 shadow-xs flex items-start gap-4"
                      >
                        <div className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-neutral-100">
                          <Image
                            src={imgRes.imageUrl}
                            alt={imgRes.altText}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <div className="text-xs flex-1">
                          <span className="font-mono text-[10px] font-bold text-[#865d1d] uppercase tracking-wider">
                            Private Chauffeur
                          </span>
                          <h4 className="font-serif text-sm font-bold text-[#1A1816] mt-0.5">
                            {tr.description}
                          </h4>
                          {tr.details && (
                            <p className="text-[#1A1816]/70 mt-1 leading-relaxed">
                              {tr.details.replace(/•?\s*\[price_[^\]]+\]/g, "").trim()}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* SECTION D: ADDITIONAL INCLUDED SERVICES & ADD-ONS */}
            {otherServices.length > 0 && (
              <section className="space-y-4">
                <div className="border-b border-black/10 pb-3">
                  <h2 className="font-serif text-2xl font-bold text-[#1A1816]">
                    Included Amenities &amp; Highlights
                  </h2>
                  <p className="text-xs text-[#1A1816]/60 mt-0.5">
                    Additional arrangements configured for your comfort and spiritual enrichment.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {otherServices.map((srv, idx) => {
                    const imgRes = resolveServiceImage(srv.item_type, srv.description, srv.details);
                    return (
                      <div
                        key={srv.id || idx}
                        className="rounded-xl border border-black/10 bg-white p-4 text-xs flex items-center gap-3"
                      >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#FAF8F5] text-base">
                          {srv.description.toLowerCase().includes("visa")
                            ? "🛂"
                            : srv.description.toLowerCase().includes("meal")
                            ? "🍽️"
                            : srv.description.toLowerCase().includes("ziyarat")
                            ? "📍"
                            : srv.description.toLowerCase().includes("esim")
                            ? "📶"
                            : "✨"}
                        </span>
                        <div>
                          <h4 className="font-bold text-[#1A1816]">{srv.description}</h4>
                          {srv.details && (
                            <p className="text-[#1A1816]/60 text-[11px] mt-0.5">
                              {srv.details.replace(/•?\s*\[price_[^\]]+\]/g, "").trim()}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* SECTION E: MASAAR PROMISE */}
            <div className="rounded-2xl border border-[#c9983e]/30 bg-gradient-to-r from-[#FAF8F5] via-white to-[#F6F1E8] p-6 text-xs text-[#1A1816]">
              <div className="flex items-center gap-2 font-serif text-xs font-bold uppercase tracking-[0.2em] text-[#865d1d]">
                <span>🕊️</span>
                <span>THE MASAAR HOLIDAYS COMMITMENT</span>
              </div>
              <p className="mt-2 text-sm font-serif italic text-[#1A1816]/90 leading-relaxed">
                &ldquo;We treat your sacred pilgrimage not as a transaction, but as a sacred trust. From your first greeting in Jeddah to your farewell Tawaf, our team remains by your side.&rdquo;
              </p>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center border-t border-black/10 pt-4">
                <div>
                  <span className="block font-bold text-[#865d1d]">FAITH</span>
                  <span className="text-[10px] text-[#1A1816]/60">Spiritual guidance</span>
                </div>
                <div>
                  <span className="block font-bold text-[#865d1d]">CLARITY</span>
                  <span className="text-[10px] text-[#1A1816]/60">Transparent pricing</span>
                </div>
                <div>
                  <span className="block font-bold text-[#865d1d]">CARE</span>
                  <span className="text-[10px] text-[#1A1816]/60">24/7 Concierge</span>
                </div>
                <div>
                  <span className="block font-bold text-[#865d1d]">PEACE</span>
                  <span className="text-[10px] text-[#1A1816]/60">Complete serenity</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: STICKY PRICING & ACTIONS CARD */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Pricing Card */}
              <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-lg">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#865d1d]">
                  Package Investment
                </span>
                <div className="mt-2 flex items-baseline justify-between border-b border-black/10 pb-4">
                  <div>
                    <span className="text-xs text-[#1A1816]/60">Total Package Price</span>
                    <div className="font-serif text-3xl font-bold text-[#1A1816]">
                      AED {pricing.totalAed.toLocaleString()}
                    </div>
                  </div>
                  {pricing.hasPriceOnRequest && (
                    <span className="rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                      Partial Quote
                    </span>
                  )}
                </div>

                {/* Price Breakdown */}
                <div className="space-y-2 py-4 text-xs border-b border-black/10">
                  <div className="flex justify-between text-[#1A1816]/70">
                    <span>Services Subtotal:</span>
                    <span className="font-semibold text-[#1A1816]">AED {pricing.subtotalAed.toLocaleString()}</span>
                  </div>

                  {pricing.discountAed > 0 && (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Discount / Special Offer:</span>
                      <span>- AED {pricing.discountAed.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-[#1A1816]/70">
                    <span>VAT ({pricing.taxRatePercent}%):</span>
                    <span className="font-semibold text-[#1A1816]">
                      {pricing.taxAed > 0 ? `AED ${pricing.taxAed.toLocaleString()}` : "Included / 0%"}
                    </span>
                  </div>

                  {pricing.hasPriceOnRequest && (
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-[11px] text-amber-900 mt-2">
                      ⚠️ Note: Some custom services are marked <strong>Price on request</strong> and will be confirmed prior to final invoice.
                    </div>
                  )}
                </div>

                {/* 3 REQUIRED ACTIONS (Accept, Request Changes, Decline) — NO PDF DOWNLOAD! */}
                <div className="pt-4 space-y-3">
                  {currentStatus !== "accepted" && currentStatus !== "rejected" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsAcceptModalOpen(true)}
                        disabled={isPending}
                        className="w-full rounded-xl bg-gradient-to-r from-[#b37e28] to-[#916d28] hover:from-[#9c6d1f] hover:to-[#7d5c1f] py-3.5 text-xs font-bold text-white shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <span>✓</span>
                        <span>Accept Quotation</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsRequestModalOpen(true)}
                        disabled={isPending}
                        className="w-full rounded-xl border border-black/15 bg-white hover:bg-black/[0.02] py-2.5 text-xs font-semibold text-[#1A1816] transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>💬</span>
                        <span>Request Changes via WhatsApp</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsDeclineModalOpen(true)}
                        disabled={isPending}
                        className="w-full text-center text-xs text-[#1A1816]/50 hover:text-red-600 transition-colors py-1 cursor-pointer"
                      >
                        Decline this proposal
                      </button>
                    </>
                  ) : currentStatus === "accepted" ? (
                    <div className="space-y-2 text-center">
                      <div className="rounded-xl bg-emerald-50 border border-emerald-300 py-3 text-xs font-bold text-emerald-800">
                        ✓ Quotation Accepted by You
                      </div>
                      <a
                        href={acceptWaUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="block w-full rounded-xl bg-[#25D366] hover:bg-[#20ba59] py-3 text-xs font-bold text-white transition-colors"
                      >
                        💬 Confirm Details on WhatsApp
                      </a>
                    </div>
                  ) : (
                    <div className="space-y-2 text-center">
                      <div className="rounded-xl bg-neutral-100 border border-neutral-300 py-3 text-xs font-semibold text-neutral-700">
                        Quotation Declined
                      </div>
                      <a
                        href={generalWaUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="block w-full rounded-xl border border-black/15 bg-white py-2.5 text-xs font-semibold text-[#1A1816]"
                      >
                        💬 Speak with Concierge
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Concierge Assistance Card */}
              <div className="rounded-2xl border border-black/5 bg-[#FAF8F5] p-5 text-xs space-y-2 text-center">
                <span className="text-xl">🛎️</span>
                <h4 className="font-serif font-bold text-[#1A1816]">Have Questions Before Deciding?</h4>
                <p className="text-[#1A1816]/60 text-[11px] leading-relaxed">
                  Our private travel team is here to assist with visa guidance, room selection, and customized itineraries.
                </p>
                <a
                  href={generalWaUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-[#865d1d] hover:underline"
                >
                  <span>Chat with Masaar Advisor ↗</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL 1: ACCEPT CONFIRMATION MODAL */}
      {isAcceptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-black/10 pb-3">
              <h3 className="font-serif text-lg font-bold text-[#1A1816]">
                Confirm Acceptance
              </h3>
              <button
                type="button"
                onClick={() => setIsAcceptModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#1A1816]/80 leading-relaxed">
              Are you sure you want to accept Quotation <strong>{document.document_number}</strong> for <strong>{document.client_name}</strong> (Total: AED {pricing.totalAed.toLocaleString()})?
            </p>

            <div className="rounded-xl bg-[#FAF8F5] border border-[#c9983e]/30 p-3 text-xs text-[#865d1d] space-y-1">
              <p className="font-bold">Next Steps:</p>
              <p className="text-[11px]">
                Upon acceptance, your proposal will be locked and sent to our reservations desk. Our concierge will follow up to finalize traveller documents and booking confirmation.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-black/10">
              <button
                type="button"
                onClick={() => setIsAcceptModalOpen(false)}
                className="rounded-xl border border-black/15 px-4 py-2 text-xs font-semibold text-[#1A1816]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAcceptConfirm}
                disabled={isPending}
                className="rounded-xl bg-gradient-to-r from-[#b37e28] to-[#916d28] px-5 py-2 text-xs font-bold text-white shadow-sm disabled:opacity-50"
              >
                {isPending ? "Confirming…" : "Yes, Accept Quotation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: REQUEST CHANGES MODAL */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-black/10 pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#1A1816]">
                  Request Changes
                </h3>
                <p className="text-xs text-[#1A1816]/50 mt-0.5">
                  Quotation {document.document_number} • Direct WhatsApp Assistance
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsRequestModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitChangeRequest} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#1A1816] mb-2">
                  What would you like adjusted?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CHANGE_OPTIONS.map((opt) => (
                    <label
                      key={opt}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-black/10 p-2.5 hover:bg-black/[0.02]"
                    >
                      <input
                        type="checkbox"
                        checked={selectedChanges.has(opt)}
                        onChange={() => toggleChangeOption(opt)}
                        className="rounded border-black/20 text-[#b37e28] focus:ring-[#b37e28]"
                      />
                      <span className="font-medium text-[#1A1816]">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#1A1816] mb-1">
                  Specific Requests or Notes (optional)
                </label>
                <textarea
                  rows={3}
                  value={changeMessage}
                  onChange={(e) => setChangeMessage(e.target.value)}
                  placeholder="e.g. Please provide options for Fairmont Makkah and a business class flight quote."
                  className="w-full rounded-xl border border-black/15 p-3 text-xs focus:border-[#b37e28] focus:outline-hidden focus:ring-1 focus:ring-[#b37e28]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-black/10">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="rounded-xl border border-black/15 px-4 py-2 text-xs font-semibold text-[#1A1816]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-xl bg-gradient-to-r from-[#b37e28] to-[#916d28] px-5 py-2 text-xs font-bold text-white shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  <span>💬</span>
                  <span>{isPending ? "Submitting…" : "Send to WhatsApp Concierge"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DECLINE QUOTATION MODAL */}
      {isDeclineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-black/10 pb-3">
              <h3 className="font-serif text-lg font-bold text-[#1A1816]">
                Decline Quotation
              </h3>
              <button
                type="button"
                onClick={() => setIsDeclineModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#1A1816]/80 leading-relaxed">
              Are you sure you wish to decline Quotation <strong>{document.document_number}</strong>? We would appreciate any feedback so we can better serve you.
            </p>

            <div>
              <label className="block font-bold text-[#1A1816] text-xs mb-1">
                Reason for declining (optional):
              </label>
              <textarea
                rows={3}
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="e.g. Trip postponed / Found alternative dates"
                className="w-full rounded-xl border border-black/15 p-2.5 text-xs focus:border-[#b37e28] focus:outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-black/10">
              <button
                type="button"
                onClick={() => setIsDeclineModalOpen(false)}
                className="rounded-xl border border-black/15 px-4 py-2 text-xs font-semibold text-[#1A1816]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeclineConfirm}
                disabled={isPending}
                className="rounded-xl bg-red-600 hover:bg-red-700 px-5 py-2 text-xs font-bold text-white shadow-sm disabled:opacity-50"
              >
                {isPending ? "Declining…" : "Confirm Decline"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-black/10 bg-[#161412] text-white py-10 mt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/60">
          <div className="relative h-8 w-28">
            <Image
              src="/brand/logo.png"
              alt="Masaar Holidays"
              fill
              className="object-contain object-left invert"
            />
          </div>
          <div className="font-serif italic text-white/70">
            &ldquo;Faith • Clarity • Care • Peace&rdquo;
          </div>
          <div>
            © 2026 Masaar Holidays LLC. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
