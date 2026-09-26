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
}: {
  token: string;
  document: DocumentRow;
  items: DocumentItemRow[];
  template: DocumentTemplateRow | null;
  whatsappPhone: string;
}) {
  const [currentStatus, setCurrentStatus] = useState(document.status);
  const [isPending, startTransition] = useTransition();

  // Change Request Modal State (Exact match EDITING QUOTATION.png Step 3)
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedChanges, setSelectedChanges] = useState<Set<string>>(new Set());
  const [changeMessage, setChangeMessage] = useState("");
  const [requestSent, setRequestSent] = useState(false);
  const [acceptedNotice, setAcceptedNotice] = useState(currentStatus === "accepted");

  function handleAccept() {
    startTransition(async () => {
      const next = await respondToQuotation(token, "accept");
      setCurrentStatus(next);
      setAcceptedNotice(true);
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

    startTransition(async () => {
      const next = await respondToQuotation(token, "request_changes", {
        categories: Array.from(selectedChanges),
        message: changeMessage.trim(),
      });
      setCurrentStatus(next);
      setIsRequestModalOpen(false);
      setRequestSent(true);
    });
  }

  // Calculate days/nights
  const startDate = document.travel_date ? new Date(document.travel_date) : null;
  const endDate = document.return_date ? new Date(document.return_date) : null;
  const durationDays =
    startDate && endDate
      ? Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)))
      : 10;

  function formatDate(d: Date | null) {
    if (!d || Number.isNaN(d.getTime())) return "Pending Confirmation";
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  const travelDatesFormatted =
    startDate && endDate
      ? `${formatDate(startDate)} – ${formatDate(endDate)} (${durationDays} Days)`
      : "Travel dates to be confirmed";

  const isHajj = document.journey_type === "hajj";
  const journeyTitle = isHajj ? "Your Hajj 2027 Journey" : "Your Umrah 2026 Journey";
  const packageBadge = isHajj ? "HAJJ 2027" : "UMRAH 2026";

  // Parse items
  const packageItem = items.find((i) =>
    ["umrah_package", "hajj_package"].includes(i.item_type)
  );
  const hotels = items.filter((i) => i.item_type === "hotel");
  const transport = items.find((i) => i.item_type === "transfer");
  const flight = items.find((i) => i.item_type === "flight");
  const meals = items.find((i) => i.description.toLowerCase().includes("meal"));
  const additional = items.filter(
    (i) => !["umrah_package", "hajj_package", "hotel", "transfer", "flight"].includes(i.item_type)
  );

  const whatsappMessage = `Assalamu Alaikum, I am reviewing my Masaar quotation ${document.document_number} (AED ${Number(document.total_aed).toLocaleString()}) and would like to speak with a travel advisor.`;
  const whatsappHref = `https://wa.me/${whatsappPhone.replace(/\D/g, "")}?text=${encodeURIComponent(whatsappMessage)}`;
  const pdfDownloadUrl = `/quote/${token}/pdf`;

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-masaar-black font-sans selection:bg-[#c9983e]/20 selection:text-masaar-black">
      {/* 1. Luxury Navbar matching CLIENT QUOTATION PAGE.png */}
      <header className="border-b border-black/10 bg-white/95 backdrop-blur-md sticky top-0 z-30">
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

          <div className="flex items-center gap-3 text-xs">
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
          <div className="space-y-6 lg:col-span-8">
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
                    {packageItem?.description || (isHajj ? "13-Day Platinum Hajj" : "10-Day Platinum Umrah")}
                  </h3>
                  <p className="text-xs text-masaar-black/70 leading-relaxed font-sans">
                    {packageItem?.details ||
                      "An exclusive and comfortable pilgrimage experience with premium 5-star accommodation, direct scheduled flights, private vehicle transfers, and dedicated concierge support throughout your sacred journey."}
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
                  <p className="text-[11px] font-bold mt-1 text-masaar-black">Kidana / Clock Tower</p>
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

            {/* Module 2: Accommodation (Makkah & Madinah Hotels) */}
            <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-black/10 pb-3">
                <span className="text-xl">🏨</span>
                <h2 className="font-serif text-lg font-bold text-masaar-black">
                  Accommodation
                </h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Makkah Hotel Card */}
                <div className="overflow-hidden rounded-xl border border-black/10 bg-[#FAF9F7]">
                  <div className="relative aspect-video w-full overflow-hidden">
                    <Image
                      src="/Assets/PRIVATE-TRIP-MAKKAH-CARD.png"
                      alt="Makkah Hotel"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <div className="absolute top-2 left-2 rounded-md bg-black/75 px-2 py-0.5 text-[10px] font-bold text-white">
                      Holy Makkah
                    </div>
                  </div>
                  <div className="p-4 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-serif font-bold text-sm text-masaar-black">
                        Swissôtel Makkah
                      </h4>
                      <span className="text-xs text-[#D4AF37]">★★★★★</span>
                    </div>
                    <p className="text-xs text-masaar-black/60 flex items-center gap-1.5">
                      <span>📍 Near Haram Courtyard</span>
                      <span>•</span>
                      <span>5 Nights</span>
                    </p>
                    <p className="text-[11px] text-masaar-black/50 pt-1 border-t border-black/5">
                      Deluxe Twin/Quad Room with daily luxury buffet breakfast included.
                    </p>
                  </div>
                </div>

                {/* Madinah Hotel Card */}
                <div className="overflow-hidden rounded-xl border border-black/10 bg-[#FAF9F7]">
                  <div className="relative aspect-video w-full overflow-hidden">
                    <Image
                      src="/Assets/PRIVATE-TRIP-MADINAH-CARD.png"
                      alt="Madinah Hotel"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <div className="absolute top-2 left-2 rounded-md bg-black/75 px-2 py-0.5 text-[10px] font-bold text-white">
                      Madinah Al Munawwarah
                    </div>
                  </div>
                  <div className="p-4 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-serif font-bold text-sm text-masaar-black">
                        Anwar Al Madinah Mövenpick
                      </h4>
                      <span className="text-xs text-[#D4AF37]">★★★★★</span>
                    </div>
                    <p className="text-xs text-masaar-black/60 flex items-center gap-1.5">
                      <span>📍 Steps from Prophet&apos;s Mosque</span>
                      <span>•</span>
                      <span>5 Nights</span>
                    </p>
                    <p className="text-[11px] text-masaar-black/50 pt-1 border-t border-black/5">
                      Direct Haram steps courtyard with daily buffet breakfast included.
                    </p>
                  </div>
                </div>
              </div>
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
                <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-black/10 md:col-span-5">
                  <Image
                    src="/Assets/PRIVATE-TRIP-TRANSPORT.png"
                    alt="GMC Yukon XL"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="md:col-span-7 space-y-2">
                  <h4 className="font-serif text-base font-bold text-masaar-black">
                    Private GMC Yukon XL
                  </h4>
                  <p className="text-xs text-masaar-black/60 leading-relaxed font-sans">
                    Premium airport transfers and intercity travel with chauffeur throughout your journey.
                  </p>
                  <ul className="text-xs space-y-1.5 pt-2 border-t border-black/5 font-sans">
                    <li className="flex items-center gap-2">
                      <span className="text-[#b37e28]">✓</span>
                      <span>Jeddah International Airport → Holy Makkah Hotel</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-[#b37e28]">✓</span>
                      <span>Makkah Hotel → Madinah Al Munawwarah</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-[#b37e28]">✓</span>
                      <span>Madinah Hotel → Madinah Airport (MED)</span>
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
                    Emirates — Business Class
                  </h5>
                  <p className="text-xs text-masaar-black/60 mt-1">
                    Dubai (DXB) → Jeddah (JED) • Madinah (MED) → Dubai (DXB)
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
                    3 Course Gourmet Meals
                  </h5>
                  <p className="text-xs text-masaar-black/60 mt-1">
                    Daily breakfast, lunch and dinner included in 5-star hotel dining rooms.
                  </p>
                </div>
              </div>
            </div>

            {/* Module 5: Itinerary Highlights Timeline */}
            <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-black/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📋</span>
                  <h3 className="font-serif text-lg font-bold text-masaar-black">
                    Itinerary Highlights
                  </h3>
                </div>
                <span className="text-xs font-semibold text-[#865d1d]">
                  Complete Pilgrimage Timeline
                </span>
              </div>

              {/* Visual timeline */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 text-center">
                <div className="rounded-xl border border-black/10 bg-[#FAF9F7] p-3 space-y-1">
                  <span className="text-xl">✈️</span>
                  <p className="font-bold text-xs text-masaar-black">Day 1</p>
                  <p className="text-[11px] text-masaar-black/60">Arrival in Jeddah &amp; Umrah</p>
                </div>
                <div className="rounded-xl border border-black/10 bg-[#FAF9F7] p-3 space-y-1">
                  <span className="text-xl">🕋</span>
                  <p className="font-bold text-xs text-masaar-black">Days 2–5</p>
                  <p className="text-[11px] text-masaar-black/60">Holy Makkah &amp; Ziyarat</p>
                </div>
                <div className="rounded-xl border border-black/10 bg-[#FAF9F7] p-3 space-y-1">
                  <span className="text-xl">🚅</span>
                  <p className="font-bold text-xs text-masaar-black">Day 6</p>
                  <p className="text-[11px] text-masaar-black/60">High-Speed Train to Madinah</p>
                </div>
                <div className="rounded-xl border border-black/10 bg-[#FAF9F7] p-3 space-y-1">
                  <span className="text-xl">🕌</span>
                  <p className="font-bold text-xs text-masaar-black">Days 7–9</p>
                  <p className="text-[11px] text-masaar-black/60">Prophet&apos;s Mosque &amp; Rawdah</p>
                </div>
                <div className="rounded-xl border border-black/10 bg-[#FAF9F7] p-3 space-y-1">
                  <span className="text-xl">✈️</span>
                  <p className="font-bold text-xs text-masaar-black">Day 10</p>
                  <p className="text-[11px] text-masaar-black/60">Departure &amp; Farewell</p>
                </div>
              </div>
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
                      {isHajj ? "Hajj 2027 – Platinum" : "Umrah 2026 – Platinum"}
                    </span>
                  </div>

                  <div className="flex justify-between text-masaar-black/70">
                    <span>Travel Dates</span>
                    <span className="font-semibold text-masaar-black">{travelDatesFormatted}</span>
                  </div>

                  <div className="flex justify-between text-masaar-black/70">
                    <span>Travellers</span>
                    <span className="font-semibold text-masaar-black">
                      {document.adults} Adults, {document.children || 0} Children
                    </span>
                  </div>

                  <div className="flex justify-between text-masaar-black/70">
                    <span>Makkah Hotel</span>
                    <span className="font-semibold text-masaar-black">Swissôtel Makkah (5 Nights)</span>
                  </div>

                  <div className="flex justify-between text-masaar-black/70">
                    <span>Madinah Hotel</span>
                    <span className="font-semibold text-masaar-black">Anwar Al Madinah (5 Nights)</span>
                  </div>

                  <div className="flex justify-between text-masaar-black/70">
                    <span>Room Type</span>
                    <span className="font-semibold text-masaar-black">Twin Sharing</span>
                  </div>

                  <div className="flex justify-between text-masaar-black/70">
                    <span>Transport</span>
                    <span className="font-semibold text-masaar-black">Private GMC Yukon XL</span>
                  </div>

                  <div className="flex justify-between text-masaar-black/70">
                    <span>Flights</span>
                    <span className="font-semibold text-masaar-black">Emirates – Business Class</span>
                  </div>
                </div>

                {/* Total Box */}
                <div className="rounded-xl border border-[#b37e28]/30 bg-gradient-to-r from-[#FAF6EE] to-[#F5ECE0] p-4 text-center">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#865d1d]">
                    Total Amount
                  </span>
                  <p className="mt-1 font-serif text-3xl font-bold text-masaar-black">
                    AED {Number(document.total_aed ?? 0).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-masaar-black/50 mt-0.5">
                    Includes all 5★ taxes, VAT and services
                  </p>
                </div>

                {/* Primary CTAs */}
                <div className="space-y-2.5 pt-2">
                  <button
                    type="button"
                    onClick={handleAccept}
                    disabled={isPending || currentStatus === "accepted"}
                    className="w-full rounded-xl bg-gradient-to-r from-[#b37e28] to-[#96671e] py-3.5 text-xs font-bold text-white shadow-sm hover:from-[#9c6d1f] hover:to-[#845a17] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span>✓</span>
                    <span>{currentStatus === "accepted" ? "Quotation Accepted" : "Accept Quotation →"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsRequestModalOpen(true)}
                    className="w-full rounded-xl border border-black/20 bg-white py-2.5 text-xs font-semibold text-masaar-black hover:bg-black/[0.02] transition-colors flex items-center justify-center gap-2"
                  >
                    <span>✏️</span>
                    <span>Request Changes</span>
                  </button>

                  <a
                    href={pdfDownloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full rounded-xl border border-black/10 bg-[#FAF9F7] py-2.5 text-xs font-semibold text-masaar-black hover:bg-black/5 transition-colors flex items-center justify-center gap-2"
                  >
                    <span>📥</span>
                    <span>Download PDF</span>
                  </a>

                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full rounded-xl border border-[#25D366]/30 bg-[#25D366]/10 py-2.5 text-xs font-bold text-[#1b7e3e] hover:bg-[#25D366]/20 transition-colors flex items-center justify-center gap-2"
                  >
                    <span>💬</span>
                    <span>Ask on WhatsApp</span>
                  </a>
                </div>

                {/* Security Badge */}
                <div className="rounded-lg bg-neutral-50 p-2.5 text-center text-[10px] text-masaar-black/50 flex items-center justify-center gap-1.5 border border-black/5">
                  <span>🔒</span>
                  <span>This is a secure link shared by Masaar Holidays. Your information is safe with us.</span>
                </div>

                {/* Spiritual Brand Card */}
                <div className="rounded-2xl border border-[#b37e28]/20 bg-gradient-to-b from-[#fbf8f2] to-white p-5 text-center space-y-1">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-black/10 pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-masaar-black">
                  Request Changes
                </h3>
                <p className="text-xs text-masaar-black/50 mt-0.5">
                  Quotation {document.document_number}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsRequestModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="rounded-xl bg-[#fbf6ec] border border-[#b37e28]/30 p-3 text-xs text-[#845c19] flex items-start gap-2">
              <span>ℹ️</span>
              <span>Let us know what you would like to change. Our team will review your request and send you a revised quotation.</span>
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
                        className="rounded border-black/20 text-[#b37e28] focus:ring-[#b37e28]"
                      />
                      <span className="font-medium text-masaar-black">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-masaar-black mb-1">
                  Additional message (optional)
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
                  className="rounded-xl border border-black/15 px-4 py-2.5 text-xs font-semibold text-masaar-black hover:bg-black/[0.02]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-xl bg-gradient-to-r from-[#b37e28] to-[#96671e] px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:from-[#9c6d1f] hover:to-[#845a17] transition-all disabled:opacity-50"
                >
                  {isPending ? "Submitting…" : "Submit Change Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Branded Footer */}
      <footer className="border-t border-black/10 bg-[#161412] text-white py-12 mt-16">
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
