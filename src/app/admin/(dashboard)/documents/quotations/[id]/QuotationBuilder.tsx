"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card, Field, inputClass, Badge } from "@/components/admin/ui";
import {
  saveQuotationPricing,
  updateDocumentBasics,
  updateDocumentStatus,
  saveDocumentVersion,
  createDocumentFromSource,
} from "../../actions";
import type {
  DocumentItemRow,
  DocumentRow,
  DocumentShareRow,
  DocumentTemplateRow,
  DocumentVersionRow,
  DocumentItemType,
  DocumentJourneyType,
} from "@/lib/types/database";
import {
  calculateDateRangeMetrics,
  formatDisplayDate,
  reconcileItineraryDays,
  calculateQuotationTotals,
  resolveServiceImage,
  type ItineraryDayItem,
  type LineItemPricingInput,
} from "@/lib/documents/calculations";
import { ShareQuotationModal } from "@/components/documents/ShareQuotationModal";
import { ClientQuotationPortal } from "@/app/quote/[token]/ClientQuotationPortal";

const JOURNEY_TYPES: Array<{
  id: DocumentJourneyType;
  label: string;
  icon: string;
}> = [
  { id: "umrah", label: "Umrah", icon: "🕋" },
  { id: "hajj", label: "Hajj", icon: "⛰️" },
  { id: "hotel", label: "Hotel", icon: "🏨" },
  { id: "transfer", label: "Transfer", icon: "🚗" },
  { id: "private_trip", label: "Private Trip", icon: "📍" },
  { id: "custom", label: "Custom Journey", icon: "💼" },
];

const UNIT_OPTIONS = [
  "person",
  "room",
  "night",
  "vehicle",
  "transfer",
  "trip",
  "ticket",
  "item",
  "package",
  "custom",
];

export function QuotationBuilder({
  document,
  items,
  template,
  versions,
  shares,
  activeShareToken,
  products,
}: {
  document: DocumentRow;
  items: DocumentItemRow[];
  template: DocumentTemplateRow | null;
  versions: DocumentVersionRow[];
  shares: DocumentShareRow[];
  activeShareToken?: string;
  products: any;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // 1. Client & Travel Details State (Q01)
  const [clientName, setClientName] = useState(document.client_name || "");
  const [clientPhone, setClientPhone] = useState(document.client_phone || "");
  const [clientEmail, setClientEmail] = useState(document.client_email || "");
  const [clientCountry, setClientCountry] = useState(document.client_country || "Dubai, UAE");
  const [journeyType, setJourneyType] = useState<DocumentJourneyType>(document.journey_type || "umrah");
  const [travelDate, setTravelDate] = useState(document.travel_date || "2026-10-12");
  const [returnDate, setReturnDate] = useState(document.return_date || "2026-10-15");
  const [adults, setAdults] = useState<number>(document.adults || 2);
  const [children, setChildren] = useState<number>(document.children || 0);
  const [infants, setInfants] = useState<number>(document.infants || 0);
  const [origin, setOrigin] = useState(document.origin || "Dubai (DXB)");
  const [destination, setDestination] = useState(document.destination || "Jeddah (JED)");
  const [customerRequirement, setCustomerRequirement] = useState(document.special_requirements && !document.special_requirements.startsWith("[") ? document.special_requirements : "");
  const [notes, setNotes] = useState(document.notes || "");

  const parsedScope = (() => {
    if (document.notes?.includes("Makkah only") || document.notes?.includes("Makkah Only")) return "makkah_only";
    if (document.notes?.includes("Madinah only") || document.notes?.includes("Madinah Only")) return "madinah_only";
    return "both";
  })();
  const [packageScope, setPackageScope] = useState<"both" | "makkah_only" | "madinah_only">(parsedScope);
  const [roomType, setRoomType] = useState<"TWIN/DOUBLE" | "TRIPLE" | "QUAD">("TWIN/DOUBLE");

  // Date and duration calculations (single source of truth)
  const dateMetrics = calculateDateRangeMetrics(travelDate, returnDate, 4);

  // 2. Itinerary State (Q02)
  const initialItinerary = useMemo(() => {
    if (document.special_requirements) {
      try {
        const parsed = JSON.parse(document.special_requirements);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return reconcileItineraryDays([], dateMetrics.calendarDays, dateMetrics.startDate, journeyType === "hajj");
  }, [document.special_requirements, dateMetrics.calendarDays, dateMetrics.startDate, journeyType]);

  const [itineraryDays, setItineraryDays] = useState<ItineraryDayItem[]>(initialItinerary);

  // Sync itinerary when dates change if user clicks sync
  function handleSyncItineraryWithDates() {
    const synced = reconcileItineraryDays(itineraryDays, dateMetrics.calendarDays, dateMetrics.startDate, journeyType === "hajj");
    setItineraryDays(synced);
    handlePersistItinerary(synced);
  }

  // 3. Line Items & Pricing State (Q03)
  const [lineItems, setLineItems] = useState<LineItemPricingInput[]>(() => {
    return items.map((it) => ({
      id: it.id,
      item_type: it.item_type,
      description: it.description,
      details: it.details,
      quantity: it.quantity,
      unit: "item",
      unit_price_aed: it.unit_price_aed,
      catalog_unit_price_aed: it.unit_price_aed,
      is_overridden: it.details?.includes("[price_overridden]") || false,
      discount_aed: it.discount_aed,
      tax_rate: 0,
      is_price_on_request: it.details?.includes("[price_on_request]") || false,
      is_included: it.unit_price_aed === 0,
      display_order: it.display_order,
    }));
  });

  const [applyVat, setApplyVat] = useState(document.tax_aed != null ? Number(document.tax_aed) > 0 : false);
  const [vatRate, setVatRate] = useState(0.05);
  const [documentDiscount, setDocumentDiscount] = useState<number>(Number(document.discount_aed) || 0);
  const [manualAdjustment, setManualAdjustment] = useState<number>(0);
  const [manualAdjustmentReason, setManualAdjustmentReason] = useState("");
  const [agreedTotalOverride, setAgreedTotalOverride] = useState<number | null>(
    Number(document.total_aed) > 0 ? Number(document.total_aed) : null
  );

  // Authoritative Pricing Calculation
  const pricingSummary = useMemo(() => {
    return calculateQuotationTotals(lineItems, {
      applyVat,
      vatRate,
      documentDiscountAed: documentDiscount,
      manualAdjustmentAed: manualAdjustment,
      manualAdjustmentReason,
      agreedTotalOverride,
    });
  }, [lineItems, applyVat, vatRate, documentDiscount, manualAdjustment, manualAdjustmentReason, agreedTotalOverride]);

  // Share Token & Public URL
  const shareToken = activeShareToken || shares[0]?.share_token || document.id;
  const publicShareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/quote/${shareToken}`
      : `https://masaarholidays.com/quote/${shareToken}`;

  const [showShareModal, setShowShareModal] = useState(false);

  // Service Adding Dialog State (Q02)
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [selectedServiceCategory, setSelectedServiceCategory] = useState<string>("hotel");
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceDetails, setNewServiceDetails] = useState("");
  const [newServiceQty, setNewServiceQty] = useState(1);
  const [newServiceUnit, setNewServiceUnit] = useState("item");
  const [newServicePrice, setNewServicePrice] = useState(0);

  // Flash message timeout
  useEffect(() => {
    if (saveSuccessMsg) {
      const t = setTimeout(() => setSaveSuccessMsg(null), 3000);
      return () => clearTimeout(t);
    }
  }, [saveSuccessMsg]);

  // Save Step 1 (Basics)
  function handleSaveBasics(nextStep?: 1 | 2 | 3 | 4 | 5) {
    startTransition(async () => {
      try {
        const notesArr = [
          customerRequirement ? `Customer Requirement: ${customerRequirement}` : "",
          `Package Scope: ${packageScope === "makkah_only" ? "Makkah only" : packageScope === "madinah_only" ? "Madinah only" : "Makkah & Madinah"}`,
          `Duration: ${dateMetrics.durationLabel}`,
          `Room Type: ${roomType}`,
          notes ? `Notes: ${notes}` : "",
        ].filter(Boolean);

        const res = await updateDocumentBasics(document.id, "quotation", {
          client_name: clientName.trim(),
          client_phone: clientPhone.trim() || null,
          client_email: clientEmail.trim() || null,
          client_country: clientCountry.trim() || null,
          journey_type: journeyType,
          travel_date: travelDate || null,
          return_date: returnDate || null,
          adults,
          children,
          infants,
          origin,
          destination,
          notes: notesArr.join("\n"),
          special_requirements: JSON.stringify(itineraryDays),
        });

        if (res.success) {
          setSaveSuccessMsg("Client and travel details saved successfully.");
          if (nextStep) setActiveStep(nextStep);
          router.refresh();
        } else {
          alert(res.error || "Failed to save client details.");
        }
      } catch (err: any) {
        alert(err.message || "Failed to save.");
      }
    });
  }

  // Save Step 2 (Itinerary)
  function handlePersistItinerary(updatedDays: ItineraryDayItem[]) {
    startTransition(async () => {
      try {
        await updateDocumentBasics(document.id, "quotation", {
          special_requirements: JSON.stringify(updatedDays),
        });
        setSaveSuccessMsg("Itinerary updated successfully.");
        router.refresh();
      } catch (e: any) {
        console.error("Itinerary save error:", e);
      }
    });
  }

  // Save Step 3 (Pricing)
  function handleSavePricing(nextStep?: 1 | 2 | 3 | 4 | 5) {
    startTransition(async () => {
      try {
        const res = await saveQuotationPricing(document.id, {
          items: lineItems.map((li) => ({
            id: li.id,
            item_type: li.item_type as DocumentItemType,
            description: li.description,
            details: li.details,
            quantity: li.quantity,
            unit: li.unit,
            unit_price_aed: li.unit_price_aed,
            catalog_unit_price_aed: li.catalog_unit_price_aed,
            is_overridden: li.is_overridden,
            discount_aed: li.discount_aed,
            is_price_on_request: li.is_price_on_request,
            is_included: li.is_included,
            display_order: li.display_order,
          })),
          applyVat,
          vatRate,
          documentDiscountAed: documentDiscount,
          manualAdjustmentAed: manualAdjustment,
          manualAdjustmentReason,
          agreedTotalOverride,
        });

        if (res.success) {
          setSaveSuccessMsg("Quotation pricing saved successfully.");
          await saveDocumentVersion(document.id, "quotation");
          if (nextStep) setActiveStep(nextStep);
          router.refresh();
        } else {
          alert(res.error || "Failed to save pricing.");
        }
      } catch (e: any) {
        alert(e.message || "Error saving pricing.");
      }
    });
  }

  // Itinerary Controls
  function handleMoveDay(index: number, direction: "up" | "down") {
    if ((direction === "up" && index === 0) || (direction === "down" && index === itineraryDays.length - 1)) return;
    const target = direction === "up" ? index - 1 : index + 1;
    const copy = [...itineraryDays];
    const temp = copy[index];
    copy[index] = copy[target];
    copy[target] = temp;
    // Re-index days
    const reindexed = copy.map((d, i) => ({
      ...d,
      day: i + 1,
      date: dateMetrics.dates[i] || d.date,
    }));
    setItineraryDays(reindexed);
    handlePersistItinerary(reindexed);
  }

  function handleEditDayTitle(index: number, title: string) {
    const copy = [...itineraryDays];
    copy[index] = { ...copy[index], title };
    setItineraryDays(copy);
  }

  function handleEditDayDesc(index: number, desc: string) {
    const copy = [...itineraryDays];
    copy[index] = { ...copy[index], desc };
    setItineraryDays(copy);
  }

  function handleRemoveDay(index: number) {
    if (!confirm(`Are you sure you want to remove Day ${index + 1}?`)) return;
    const filtered = itineraryDays.filter((_, i) => i !== index).map((d, i) => ({
      ...d,
      day: i + 1,
      date: dateMetrics.dates[i] || d.date,
    }));
    setItineraryDays(filtered);
    handlePersistItinerary(filtered);
  }

  function handleAddDay() {
    const nextNum = itineraryDays.length + 1;
    const nextDate = dateMetrics.dates[itineraryDays.length] || dateMetrics.endDate;
    const updated = [
      ...itineraryDays,
      {
        day: nextNum,
        date: nextDate,
        title: `Day ${nextNum}: Devotions & Personal Reflection`,
        desc: "Congregational prayers, Quran recitation, and spiritual immersion.",
        icon: "🕋",
        activities: ["Congregational Prayers", "Personal Supplication"],
      },
    ];
    setItineraryDays(updated);
    handlePersistItinerary(updated);
  }

  // Line Item Pricing Controls
  function handleUpdateLineItem(index: number, patch: Partial<LineItemPricingInput>) {
    setLineItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...patch };
      return copy;
    });
  }

  function handleDeleteLineItem(index: number) {
    if (!confirm("Remove this service item from the quotation?")) return;
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  }

  function handleAddServiceSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newServiceName.trim()) return;

    const newItem: LineItemPricingInput = {
      item_type: selectedServiceCategory,
      description: newServiceName.trim(),
      details: newServiceDetails.trim() || null,
      quantity: newServiceQty,
      unit: newServiceUnit,
      unit_price_aed: newServicePrice,
      catalog_unit_price_aed: newServicePrice,
      is_overridden: false,
      discount_aed: 0,
      is_price_on_request: false,
      is_included: newServicePrice === 0,
      display_order: lineItems.length,
    };

    setLineItems((prev) => [...prev, newItem]);
    setIsAddServiceModalOpen(false);
    setNewServiceName("");
    setNewServiceDetails("");
    setNewServiceQty(1);
    setNewServicePrice(0);
    setSaveSuccessMsg("Service added to quotation items.");
  }

  return (
    <div className="space-y-6">
      {/* 1. Breadcrumbs & Quotation Status Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-black/10 pb-4">
        <div>
          <nav className="text-xs text-black/50 flex items-center gap-1.5">
            <Link href="/admin/documents" className="hover:text-black">Documents</Link>
            <span>&gt;</span>
            <Link href="/admin/documents/quotations" className="hover:text-black">Quotations</Link>
            <span>&gt;</span>
            <span className="font-semibold text-black">{document.document_number}</span>
          </nav>
          <div className="flex items-center gap-3 mt-1.5">
            <h1 className="font-serif text-2xl font-bold text-black sm:text-3xl">
              Quotation Builder
            </h1>
            <span className="rounded-full bg-[#FAF8F5] border border-[#c9983e]/40 px-3 py-0.5 text-xs font-mono font-semibold text-[#865d1d]">
              {document.document_number}
            </span>
          </div>
          <p className="text-xs text-black/60 mt-0.5">
            Client: <strong>{clientName}</strong> • {dateMetrics.durationLabel} • Created {formatDisplayDate(document.created_at)}
          </p>
        </div>

        {/* Global Action Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {saveSuccessMsg && (
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg animate-in fade-in">
              ✓ {saveSuccessMsg}
            </span>
          )}

          <Link
            href={`/quote/${shareToken}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 bg-white px-3.5 py-2 text-xs font-semibold text-black hover:bg-black/5 shadow-2xs"
          >
            <span>👁️</span> Client Portal ↗
          </Link>

          <button
            type="button"
            onClick={() => setShowShareModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#b37e28] text-white px-3.5 py-2 text-xs font-bold hover:bg-[#916d28] shadow-2xs cursor-pointer"
          >
            <span>🔗</span> Share Quotation
          </button>
        </div>
      </div>

      {/* 2. FIVE CONNECTED SCREENS STEPPER TABS (Exact match reference flow) */}
      <div className="flex items-center border border-black/10 rounded-2xl bg-white shadow-xs p-1.5 overflow-x-auto text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveStep(1)}
          className={`flex-1 min-w-[170px] py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeStep === 1
              ? "bg-[#1A1816] text-white shadow-xs"
              : "text-black/70 hover:bg-black/5"
          }`}
        >
          <span className={`size-5 rounded-full flex items-center justify-center text-[10px] font-bold ${activeStep === 1 ? "bg-[#c9983e] text-white" : "bg-black/10 text-black"}`}>
            1
          </span>
          <span>Client &amp; Trip Details</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveStep(2)}
          className={`flex-1 min-w-[170px] py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeStep === 2
              ? "bg-[#1A1816] text-white shadow-xs"
              : "text-black/70 hover:bg-black/5"
          }`}
        >
          <span className={`size-5 rounded-full flex items-center justify-center text-[10px] font-bold ${activeStep === 2 ? "bg-[#c9983e] text-white" : "bg-black/10 text-black"}`}>
            2
          </span>
          <span>Build the Journey</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveStep(3)}
          className={`flex-1 min-w-[170px] py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeStep === 3
              ? "bg-[#1A1816] text-white shadow-xs"
              : "text-black/70 hover:bg-black/5"
          }`}
        >
          <span className={`size-5 rounded-full flex items-center justify-center text-[10px] font-bold ${activeStep === 3 ? "bg-[#c9983e] text-white" : "bg-black/10 text-black"}`}>
            3
          </span>
          <span>Flexible Pricing</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveStep(4)}
          className={`flex-1 min-w-[170px] py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeStep === 4
              ? "bg-[#1A1816] text-white shadow-xs"
              : "text-black/70 hover:bg-black/5"
          }`}
        >
          <span className={`size-5 rounded-full flex items-center justify-center text-[10px] font-bold ${activeStep === 4 ? "bg-[#c9983e] text-white" : "bg-black/10 text-black"}`}>
            4
          </span>
          <span>Customer Viewer</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveStep(5)}
          className={`flex-1 min-w-[170px] py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeStep === 5
              ? "bg-[#1A1816] text-white shadow-xs"
              : "text-black/70 hover:bg-black/5"
          }`}
        >
          <span className={`size-5 rounded-full flex items-center justify-center text-[10px] font-bold ${activeStep === 5 ? "bg-[#c9983e] text-white" : "bg-black/10 text-black"}`}>
            5
          </span>
          <span>Share with Client</span>
        </button>
      </div>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* STEP 1: CLIENT & TRIP DETAILS (Q01) */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeStep === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
          <div className="lg:col-span-2 space-y-6">
            {/* Client Card */}
            <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-xs space-y-4">
              <h3 className="font-serif text-lg font-bold text-black border-b border-black/10 pb-3 flex items-center gap-2">
                <span>👤</span> Client Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-semibold block mb-1 text-black/70">Client Name *</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full rounded-lg border border-black/15 p-2.5 text-xs text-black"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-black/70">WhatsApp / Phone</label>
                  <input
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full rounded-lg border border-black/15 p-2.5 text-xs text-black"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-black/70">Email Address</label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full rounded-lg border border-black/15 p-2.5 text-xs text-black"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-black/70">Origin Country / City</label>
                  <input
                    type="text"
                    value={clientCountry}
                    onChange={(e) => setClientCountry(e.target.value)}
                    className="w-full rounded-lg border border-black/15 p-2.5 text-xs text-black"
                  />
                </div>
              </div>
            </div>

            {/* Journey Type */}
            <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-xs space-y-4">
              <h3 className="font-serif text-lg font-bold text-black border-b border-black/10 pb-3 flex items-center gap-2">
                <span>📍</span> Journey Type
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {JOURNEY_TYPES.map((jt) => (
                  <button
                    key={jt.id}
                    type="button"
                    onClick={() => setJourneyType(jt.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      journeyType === jt.id
                        ? "border-[#b37e28] bg-[#FAF8F5] ring-2 ring-[#b37e28]/20"
                        : "border-black/10 hover:bg-black/[0.02]"
                    }`}
                  >
                    <span className="text-xl block">{jt.icon}</span>
                    <span className="font-bold text-xs text-black block mt-1">{jt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Travel Details & Dynamic Duration */}
            <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-black/10 pb-3">
                <h3 className="font-serif text-lg font-bold text-black flex items-center gap-2">
                  <span>🗓️</span> Travel Dates &amp; Scope
                </h3>
                <span className="rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1 text-xs font-bold font-mono">
                  {dateMetrics.durationLabel}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-semibold block mb-1 text-black/70">Start Date</label>
                  <input
                    type="date"
                    value={travelDate}
                    onChange={(e) => setTravelDate(e.target.value)}
                    className="w-full rounded-lg border border-black/15 p-2.5 text-xs text-black font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-black/70">Return Date</label>
                  <input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full rounded-lg border border-black/15 p-2.5 text-xs text-black font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-black/70">Origin City / Airport</label>
                  <input
                    type="text"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="w-full rounded-lg border border-black/15 p-2.5 text-xs text-black"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-black/70">Destination</label>
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full rounded-lg border border-black/15 p-2.5 text-xs text-black"
                  />
                </div>
              </div>

              {/* Travellers */}
              <div className="pt-2 border-t border-black/10">
                <label className="font-semibold block mb-2 text-xs text-black/70">Number of Travellers</label>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="rounded-xl border border-black/10 p-3 bg-neutral-50 flex items-center justify-between">
                    <span>Adults</span>
                    <input
                      type="number"
                      min={1}
                      value={adults}
                      onChange={(e) => setAdults(Number(e.target.value) || 1)}
                      className="w-16 rounded border border-black/15 p-1 text-center font-bold"
                    />
                  </div>
                  <div className="rounded-xl border border-black/10 p-3 bg-neutral-50 flex items-center justify-between">
                    <span>Children</span>
                    <input
                      type="number"
                      min={0}
                      value={children}
                      onChange={(e) => setChildren(Number(e.target.value) || 0)}
                      className="w-16 rounded border border-black/15 p-1 text-center font-bold"
                    />
                  </div>
                  <div className="rounded-xl border border-black/10 p-3 bg-neutral-50 flex items-center justify-between">
                    <span>Infants</span>
                    <input
                      type="number"
                      min={0}
                      value={infants}
                      onChange={(e) => setInfants(Number(e.target.value) || 0)}
                      className="w-16 rounded border border-black/15 p-1 text-center font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Room type & Scope */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
                <div>
                  <label className="font-semibold block mb-1 text-black/70">Destination Scope</label>
                  <select
                    value={packageScope}
                    onChange={(e: any) => setPackageScope(e.target.value)}
                    className="w-full rounded-lg border border-black/15 p-2.5 text-xs text-black bg-white"
                  >
                    <option value="both">Makkah &amp; Madinah</option>
                    <option value="makkah_only">Makkah Only</option>
                    <option value="madinah_only">Madinah Only</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-black/70">Room Sharing Basis</label>
                  <select
                    value={roomType}
                    onChange={(e: any) => setRoomType(e.target.value)}
                    className="w-full rounded-lg border border-black/15 p-2.5 text-xs text-black bg-white"
                  >
                    <option value="TWIN/DOUBLE">Twin / Double Sharing</option>
                    <option value="TRIPLE">Triple Sharing</option>
                    <option value="QUAD">Quad Sharing</option>
                  </select>
                </div>
              </div>

              {/* Customer Notes */}
              <div className="text-xs pt-2">
                <label className="font-semibold block mb-1 text-black/70">Special Requests / Requirements</label>
                <textarea
                  rows={2}
                  value={customerRequirement}
                  onChange={(e) => setCustomerRequirement(e.target.value)}
                  placeholder="e.g. Kaaba view requested, elderly assistance needed"
                  className="w-full rounded-lg border border-black/15 p-2.5 text-xs text-black"
                />
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Live Summary */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-xs space-y-4 sticky top-24">
              <h3 className="font-serif text-base font-bold text-black border-b border-black/10 pb-3 flex items-center gap-2">
                <span>📋</span> Live Journey Summary
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-black/60">Client:</span>
                  <span className="font-bold text-black">{clientName || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black/60">Journey:</span>
                  <span className="font-bold capitalize text-black">{journeyType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black/60">Duration:</span>
                  <span className="font-bold text-[#865d1d]">{dateMetrics.durationLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black/60">Travel Dates:</span>
                  <span className="font-semibold text-black">{formatDisplayDate(travelDate)} – {formatDisplayDate(returnDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black/60">Travellers:</span>
                  <span className="font-semibold text-black">{adults} Adults{children ? `, ${children} Ch` : ""}{infants ? `, ${infants} Inf` : ""}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black/60">Scope:</span>
                  <span className="font-semibold text-black">{packageScope === "both" ? "Makkah & Madinah" : packageScope === "makkah_only" ? "Makkah Only" : "Madinah Only"}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-black/10 space-y-2">
                <button
                  type="button"
                  onClick={() => handleSaveBasics(2)}
                  disabled={isPending}
                  className="w-full rounded-xl bg-gradient-to-r from-[#b37e28] to-[#916d28] py-3 text-xs font-bold text-white shadow-xs hover:from-[#9c6d1f] hover:to-[#7d5c1f] transition-all cursor-pointer disabled:opacity-50"
                >
                  {isPending ? "Saving…" : "Save & Continue to Journey →"}
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveBasics()}
                  disabled={isPending}
                  className="w-full rounded-xl border border-black/15 bg-white py-2.5 text-xs font-semibold text-black hover:bg-black/5 cursor-pointer"
                >
                  Save as Draft
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* STEP 2: BUILD THE JOURNEY (Q02) */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeStep === 2 && (
        <div className="space-y-6 animate-in fade-in">
          {/* Top Duration Match Banner */}
          <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-serif font-bold text-sm text-black">
                {clientName} • {journeyType.toUpperCase()}
              </span>
              <p className="text-xs text-black/60">
                {formatDisplayDate(travelDate)} – {formatDisplayDate(returnDate)} ({dateMetrics.durationLabel})
              </p>
            </div>

            <div className="flex items-center gap-2">
              {itineraryDays.length === dateMetrics.calendarDays ? (
                <span className="rounded-full bg-emerald-50 border border-emerald-300 px-3.5 py-1 text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                  <span>✓</span> Itinerary Matches Duration ({dateMetrics.calendarDays} Days)
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-amber-50 border border-amber-300 px-3 py-1 text-xs font-bold text-amber-800">
                    ⚠️ Mismatch: {itineraryDays.length} days listed vs {dateMetrics.calendarDays} trip days
                  </span>
                  <button
                    type="button"
                    onClick={handleSyncItineraryWithDates}
                    className="rounded-lg bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 text-xs font-bold cursor-pointer"
                  >
                    Sync with Dates
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Day-by-Day Itinerary Builder (2 Cols) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-lg font-bold text-black">
                    Day-by-Day Itinerary
                  </h3>
                  <p className="text-xs text-black/60">
                    Add, edit, reorder and personalize every day of the client&apos;s journey.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddDay}
                  className="rounded-xl border border-black/15 bg-white px-3.5 py-1.5 text-xs font-semibold hover:bg-black/5 cursor-pointer flex items-center gap-1"
                >
                  <span>+</span> Add Day
                </button>
              </div>

              <div className="space-y-3">
                {itineraryDays.map((dItem, idx) => (
                  <div
                    key={dItem.day}
                    className="rounded-2xl border border-black/10 bg-white p-4 shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex size-7 items-center justify-center rounded-lg bg-[#FAF8F5] text-xs font-bold text-[#865d1d] border border-[#c9983e]/30">
                          {dItem.day}
                        </span>
                        <div>
                          <span className="font-mono text-[10px] text-black/50 block">
                            {formatDisplayDate(dItem.date, true)}
                          </span>
                          <input
                            type="text"
                            value={dItem.title}
                            onChange={(e) => handleEditDayTitle(idx, e.target.value)}
                            className="font-serif font-bold text-sm text-black border-b border-transparent hover:border-black/20 focus:border-[#b37e28] focus:outline-hidden w-full max-w-md bg-transparent"
                          />
                        </div>
                      </div>

                      {/* Day Action Buttons */}
                      <div className="flex items-center gap-1 text-xs text-black/60">
                        <button
                          type="button"
                          onClick={() => handleMoveDay(idx, "up")}
                          disabled={idx === 0}
                          className="p-1 hover:bg-black/5 rounded disabled:opacity-30 cursor-pointer"
                          title="Move Day Up"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveDay(idx, "down")}
                          disabled={idx === itineraryDays.length - 1}
                          className="p-1 hover:bg-black/5 rounded disabled:opacity-30 cursor-pointer"
                          title="Move Day Down"
                        >
                          ▼
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveDay(idx)}
                          className="p-1 hover:bg-red-50 text-red-600 rounded cursor-pointer ml-1"
                          title="Remove Day"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    <textarea
                      rows={2}
                      value={dItem.desc}
                      onChange={(e) => handleEditDayDesc(idx, e.target.value)}
                      placeholder="Day activities and spiritual description..."
                      className="w-full rounded-xl border border-black/10 p-2.5 text-xs text-black/80 bg-[#FAF9F6] focus:bg-white focus:border-[#b37e28] focus:outline-hidden"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Service Catalog & Add Section (1 Col) */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-black/10 pb-3">
                  <h3 className="font-serif text-base font-bold text-black flex items-center gap-2">
                    <span>🧳</span> Service Catalogue
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsAddServiceModalOpen(true)}
                    className="rounded-lg bg-[#b37e28] text-white px-2.5 py-1 text-xs font-bold hover:bg-[#916d28] cursor-pointer"
                  >
                    + Add Service
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <span className="text-[10px] uppercase font-bold text-black/50 block">Added Services ({lineItems.length}):</span>
                  {lineItems.map((li, idx) => {
                    const imgRes = resolveServiceImage(li.item_type, li.description, li.details);
                    return (
                      <div
                        key={idx}
                        className="rounded-xl border border-black/10 p-3 bg-neutral-50 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative size-10 rounded-lg overflow-hidden shrink-0 bg-neutral-200">
                            <Image
                              src={imgRes.imageUrl}
                              alt={imgRes.altText}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                          <div className="min-w-0">
                            <h5 className="font-bold text-black truncate">{li.description}</h5>
                            <span className="text-[10px] text-black/50 block">
                              {li.quantity} {li.unit || "unit"} • AED {Number(li.unit_price_aed || 0).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteLineItem(idx)}
                          className="text-red-500 hover:text-red-700 text-xs p-1 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Step 2 Navigation */}
                <div className="pt-3 border-t border-black/10 space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      handlePersistItinerary(itineraryDays);
                      setActiveStep(3);
                    }}
                    className="w-full rounded-xl bg-gradient-to-r from-[#b37e28] to-[#916d28] py-3 text-xs font-bold text-white shadow-xs hover:from-[#9c6d1f] hover:to-[#7d5c1f] transition-all cursor-pointer"
                  >
                    Save &amp; Continue to Pricing →
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveStep(1)}
                    className="w-full rounded-xl border border-black/15 bg-white py-2 text-xs font-semibold text-black hover:bg-black/5 cursor-pointer"
                  >
                    ← Back to Client Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* STEP 3: FLEXIBLE PRICING & SUMMARY (Q03 — Exact match reference) */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeStep === 3 && (
        <div className="space-y-6 animate-in fade-in">
          {/* Header alert */}
          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-serif text-lg font-bold text-black">
                Flexible Pricing &amp; Commercial Summary
              </h3>
              <p className="text-xs text-black/60">
                Catalogue prices are defaults. Staff can enter agreed client prices or mark items as &ldquo;Price on request&rdquo;.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddServiceModalOpen(true)}
              className="rounded-xl bg-[#b37e28] text-white px-4 py-2 text-xs font-bold hover:bg-[#916d28] shadow-2xs cursor-pointer"
            >
              + Add Line Item
            </button>
          </div>

          {/* Pricing Table (Matches FLEXIBLE PRICING & SUMMARY.png) */}
          <div className="overflow-x-auto rounded-2xl border border-black/10 bg-white shadow-xs">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-black/10 bg-neutral-50 uppercase text-[10px] tracking-wider text-black/60 font-bold">
                  <th className="py-3 px-4">Service Description</th>
                  <th className="py-3 px-3 w-20">Qty</th>
                  <th className="py-3 px-3 w-28">Unit</th>
                  <th className="py-3 px-3 w-32">Unit Price (AED)</th>
                  <th className="py-3 px-3 w-28">Discount</th>
                  <th className="py-3 px-3 w-28">Line Total</th>
                  <th className="py-3 px-3 w-36">Status</th>
                  <th className="py-3 px-3 text-right w-16">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {pricingSummary.items.map((it, idx) => (
                  <tr key={it.id || idx} className="hover:bg-black/[0.01]">
                    <td className="py-3 px-4">
                      <div className="font-bold text-black">{it.description}</div>
                      {it.details && (
                        <div className="text-[11px] text-black/60 mt-0.5">
                          {it.details.replace(/•?\s*\[price_[^\]]+\]/g, "").trim()}
                        </div>
                      )}
                      {it.is_overridden && (
                        <span className="inline-block mt-1 text-[9px] uppercase font-bold bg-[#FAF8F5] text-[#865d1d] border border-[#c9983e]/30 px-2 py-0.5 rounded">
                          Overridden Price
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <input
                        type="number"
                        min={1}
                        value={it.quantity}
                        onChange={(e) => handleUpdateLineItem(idx, { quantity: Number(e.target.value) || 1 })}
                        className="w-16 rounded border border-black/15 p-1 font-bold text-center"
                      />
                    </td>

                    <td className="py-3 px-3">
                      <select
                        value={it.unit}
                        onChange={(e) => handleUpdateLineItem(idx, { unit: e.target.value })}
                        className="w-full rounded border border-black/15 p-1 capitalize bg-white"
                      >
                        {UNIT_OPTIONS.map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </td>

                    <td className="py-3 px-3">
                      <input
                        type="number"
                        min={0}
                        step="any"
                        disabled={it.status === "price_on_request"}
                        value={it.unit_price_aed}
                        onChange={(e) =>
                          handleUpdateLineItem(idx, {
                            unit_price_aed: Number(e.target.value) || 0,
                            is_overridden: true,
                          })
                        }
                        className="w-full rounded border border-black/15 p-1 font-mono font-bold disabled:opacity-40"
                      />
                    </td>

                    <td className="py-3 px-3">
                      <input
                        type="number"
                        min={0}
                        step="any"
                        disabled={it.status === "price_on_request"}
                        value={it.discount_aed}
                        onChange={(e) => handleUpdateLineItem(idx, { discount_aed: Number(e.target.value) || 0 })}
                        className="w-full rounded border border-black/15 p-1 font-mono disabled:opacity-40"
                      />
                    </td>

                    <td className="py-3 px-3 font-mono font-bold text-black">
                      {it.status === "price_on_request"
                        ? "—"
                        : it.status === "included"
                        ? "Included"
                        : `AED ${it.amount_aed.toLocaleString()}`}
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        {it.status === "price_on_request" ? (
                          <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-bold">
                            Price on Req
                          </span>
                        ) : it.status === "included" ? (
                          <span className="rounded-full bg-neutral-100 text-neutral-700 px-2 py-0.5 text-[10px] font-bold">
                            Included
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                            Priced
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateLineItem(idx, {
                              is_price_on_request: !it.is_price_on_request,
                            })
                          }
                          className="text-[10px] text-blue-600 hover:underline"
                          title="Toggle Price on Request"
                        >
                          {it.is_price_on_request ? "Set Price" : "Unprice"}
                        </button>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteLineItem(idx)}
                        className="text-red-500 hover:text-red-700 p-1 cursor-pointer font-bold"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pricing Adjustments & Summary Box */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Category breakdown (1 col) */}
            <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-xs text-xs space-y-3">
              <h4 className="font-serif font-bold text-black border-b border-black/10 pb-2">
                Category Breakdown
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-black/70">
                  <span>Hotels / Accommodation:</span>
                  <span className="font-semibold text-black">AED {pricingSummary.categories.accommodationAed.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-black/70">
                  <span>Transfers &amp; Cabs:</span>
                  <span className="font-semibold text-black">AED {pricingSummary.categories.transfersAed.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-black/70">
                  <span>Flights:</span>
                  <span className="font-semibold text-black">AED {pricingSummary.categories.flightsAed.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-black/70">
                  <span>Packages:</span>
                  <span className="font-semibold text-black">AED {pricingSummary.categories.packagesAed.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-black/70">
                  <span>Other Services &amp; Ziyarat:</span>
                  <span className="font-semibold text-black">AED {pricingSummary.categories.otherServicesAed.toLocaleString()}</span>
                </div>
              </div>

              {/* Staff margin inspector (CONFIDENTIAL) */}
              <div className="rounded-xl bg-[#FAF8F5] border border-[#c9983e]/30 p-3 mt-4 text-[11px] text-[#865d1d] space-y-1">
                <span className="font-bold block">🔒 Staff Cost Inspector (Private):</span>
                <p>Selling Price: AED {pricingSummary.totalAed.toLocaleString()}</p>
                <p className="text-black/50 text-[10px]">Cost and margins remain strictly internal and never appear on customer portal.</p>
              </div>
            </div>

            {/* Adjustments & Taxes (1 col) */}
            <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-xs text-xs space-y-3">
              <h4 className="font-serif font-bold text-black border-b border-black/10 pb-2">
                Taxes &amp; Manual Adjustments
              </h4>

              <div>
                <label className="font-semibold block mb-1 text-black/70">Document Discount (AED)</label>
                <input
                  type="number"
                  min={0}
                  value={documentDiscount}
                  onChange={(e) => setDocumentDiscount(Number(e.target.value) || 0)}
                  className="w-full rounded-lg border border-black/15 p-2 font-mono text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <div>
                  <span className="font-semibold block text-black">Apply VAT ({Math.round(vatRate * 100)}%)</span>
                  <span className="text-[10px] text-black/50">Toggle tax inclusion</span>
                </div>
                <input
                  type="checkbox"
                  checked={applyVat}
                  onChange={(e) => setApplyVat(e.target.checked)}
                  className="rounded border-black/20 text-[#b37e28] size-4 cursor-pointer"
                />
              </div>

              <div className="pt-2">
                <label className="font-semibold block mb-1 text-black/70">Manual Agreed Total Override (AED)</label>
                <input
                  type="number"
                  min={0}
                  placeholder="Leave empty to use calculated total"
                  value={agreedTotalOverride != null ? agreedTotalOverride : ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAgreedTotalOverride(val === "" ? null : Number(val));
                  }}
                  className="w-full rounded-lg border border-black/15 p-2 font-mono font-bold text-xs"
                />
                <span className="text-[10px] text-black/50 mt-1 block">
                  Allows entering client-agreed lump sum without altering line items.
                </span>
              </div>
            </div>

            {/* Grand Total & Next Steps (1 col) */}
            <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-xs text-xs space-y-4">
              <h4 className="font-serif font-bold text-black border-b border-black/10 pb-2">
                Commercial Summary
              </h4>

              <div className="space-y-2 border-b border-black/10 pb-3">
                <div className="flex justify-between text-black/70">
                  <span>Subtotal:</span>
                  <span className="font-mono font-bold text-black">AED {pricingSummary.subtotalAed.toLocaleString()}</span>
                </div>
                {pricingSummary.discountAed > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount:</span>
                    <span className="font-mono font-bold">- AED {pricingSummary.discountAed.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-black/70">
                  <span>VAT ({pricingSummary.taxRatePercent}%):</span>
                  <span className="font-mono font-bold text-black">AED {pricingSummary.taxAed.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-black/10">
                  <span className="font-bold text-sm text-[#865d1d]">Grand Total:</span>
                  <span className="font-serif text-2xl font-bold text-black">
                    AED {pricingSummary.totalAed.toLocaleString()}
                  </span>
                </div>
              </div>

              {pricingSummary.hasPriceOnRequest && (
                <div className="rounded-lg bg-amber-50 border border-amber-300 p-2.5 text-[11px] text-amber-900">
                  ⚠️ Note: {pricingSummary.unpricedCount} service(s) marked &ldquo;Price on request&rdquo;.
                </div>
              )}

              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => handleSavePricing(4)}
                  disabled={isPending}
                  className="w-full rounded-xl bg-gradient-to-r from-[#b37e28] to-[#916d28] py-3 text-xs font-bold text-white shadow-xs hover:from-[#9c6d1f] hover:to-[#7d5c1f] transition-all cursor-pointer disabled:opacity-50"
                >
                  {isPending ? "Saving…" : "Save & Preview Customer Quote →"}
                </button>
                <button
                  type="button"
                  onClick={() => handleSavePricing()}
                  disabled={isPending}
                  className="w-full rounded-xl border border-black/15 bg-white py-2 text-xs font-semibold text-black hover:bg-black/5 cursor-pointer"
                >
                  Save Pricing as Draft
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* STEP 4: CUSTOMER QUOTATION VIEWER (Q04) */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeStep === 4 && (
        <div className="space-y-4 animate-in fade-in">
          <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg font-bold text-black">
                Customer Quotation Viewer
              </h3>
              <p className="text-xs text-black/60">
                Live preview of the refined Masaar Holidays digital brochure proposal.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/quote/${shareToken}`}
                target="_blank"
                className="rounded-xl bg-[#b37e28] text-white px-4 py-2 text-xs font-bold hover:bg-[#916d28] shadow-2xs"
              >
                Open in Full Tab ↗
              </Link>
              <button
                type="button"
                onClick={() => setActiveStep(5)}
                className="rounded-xl border border-black/15 bg-white px-4 py-2 text-xs font-semibold hover:bg-black/5"
              >
                Continue to Share →
              </button>
            </div>
          </div>

          {/* Embedded Customer Quotation Portal */}
          <div className="rounded-3xl border border-black/15 overflow-hidden shadow-xl bg-[#FDFBF7]">
            <ClientQuotationPortal
              token={shareToken}
              document={{
                ...document,
                client_name: clientName,
                client_phone: clientPhone,
                client_email: clientEmail,
                journey_type: journeyType,
                travel_date: travelDate,
                return_date: returnDate,
                adults,
                children,
                infants,
                subtotal_aed: pricingSummary.subtotalAed,
                discount_aed: pricingSummary.discountAed,
                tax_aed: pricingSummary.taxAed,
                total_aed: pricingSummary.totalAed,
                special_requirements: JSON.stringify(itineraryDays),
              }}
              items={pricingSummary.items as any}
              template={template}
              whatsappPhone="971552276299"
              hotelsCatalog={products?.hotels || []}
            />
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* STEP 5: SHARE QUOTATION WITH CLIENT (Q05) */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeStep === 5 && (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in">
          <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-md space-y-6">
            <div className="border-b border-black/10 pb-4">
              <h3 className="font-serif text-xl font-bold text-black flex items-center gap-2">
                <span>🔗</span> Share Quotation with {clientName}
              </h3>
              <p className="text-xs text-black/60 mt-1">
                Quotation: <strong>{document.document_number}</strong> • Total: AED {pricingSummary.totalAed.toLocaleString()}
              </p>
            </div>

            {/* Direct Link Section */}
            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-black/70 uppercase text-[10px] tracking-wider">
                Direct Customer Quotation Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={publicShareUrl}
                  className="flex-1 rounded-lg border border-black/15 bg-neutral-50 p-2.5 font-mono text-xs select-all"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(publicShareUrl);
                    setSaveSuccessMsg("Link copied to clipboard!");
                  }}
                  className="rounded-lg bg-[#b37e28] text-white px-4 py-2.5 font-bold hover:bg-[#916d28] cursor-pointer"
                >
                  Copy Link
                </button>
              </div>
            </div>

            {/* WhatsApp Section */}
            <div className="border-t border-black/10 pt-4 space-y-3 text-xs">
              <label className="font-bold text-black/70 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                <span className="text-[#25D366]">💬</span> Dispatch via WhatsApp
              </label>

              <div>
                <span className="text-black/60 block mb-1">Customer Phone Number:</span>
                <input
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="+971 55 227 6299"
                  className="w-full rounded-lg border border-black/15 p-2.5 text-xs"
                />
              </div>

              <div>
                <span className="text-black/60 block mb-1">Formatted WhatsApp Message Preview:</span>
                <textarea
                  rows={8}
                  readOnly
                  value={`Assalamu Alaikum ${clientName || "Valued Guest"},

Please find your personalised Masaar Holidays quotation.

Quotation: ${document.document_number}
Journey: ${journeyType.toUpperCase()}
Travel dates: ${formatDisplayDate(travelDate)} – ${formatDisplayDate(returnDate)}
Travellers: ${adults} Adults${children ? `, ${children} Children` : ""}
Total: AED ${pricingSummary.totalAed.toLocaleString()}

You can review your quotation and respond here:
${publicShareUrl}

For any changes or questions, please reply to this message.

JazakAllahu Khairan,
Masaar Holidays`}
                  className="w-full rounded-xl border border-black/15 p-3 text-xs font-mono bg-[#FAF9F6] text-black leading-relaxed"
                />
              </div>

              <a
                href={`https://wa.me/${clientPhone.replace(/\D/g, "")}?text=${encodeURIComponent(`Assalamu Alaikum ${clientName || "Valued Guest"},

Please find your personalised Masaar Holidays quotation.

Quotation: ${document.document_number}
Journey: ${journeyType.toUpperCase()}
Travel dates: ${formatDisplayDate(travelDate)} – ${formatDisplayDate(returnDate)}
Travellers: ${adults} Adults${children ? `, ${children} Children` : ""}
Total: AED ${pricingSummary.totalAed.toLocaleString()}

You can review your quotation and respond here:
${publicShareUrl}

For any changes or questions, please reply to this message.

JazakAllahu Khairan,
Masaar Holidays`)}`}
                target="_blank"
                rel="noreferrer"
                className="w-full rounded-xl bg-[#25D366] hover:bg-[#20ba59] py-3 text-xs font-bold text-white flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <span>💬</span> Open in WhatsApp
              </a>
            </div>

            {/* Version History */}
            <div className="border-t border-black/10 pt-4 space-y-2 text-xs">
              <span className="font-bold text-black/70 block">Quotation Version History:</span>
              <div className="space-y-1.5">
                {versions.length === 0 ? (
                  <p className="text-black/40 text-[11px]">Version 1 (Initial Draft)</p>
                ) : (
                  versions.map((v) => (
                    <div key={v.id} className="flex justify-between items-center bg-neutral-50 p-2 rounded-lg border border-black/5 text-[11px]">
                      <span>Version {v.version_number} • Status: <strong className="capitalize">{v.status_at_version}</strong></span>
                      <span className="text-black/40">{formatDisplayDate(v.created_at)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* ADD SERVICE MODAL (Q02) */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {isAddServiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-black/10 pb-3">
              <h3 className="font-serif text-lg font-bold text-black">
                Add Service to Journey
              </h3>
              <button
                type="button"
                onClick={() => setIsAddServiceModalOpen(false)}
                className="text-black/40 hover:text-black font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddServiceSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold block mb-1 text-black/70">Category</label>
                <select
                  value={selectedServiceCategory}
                  onChange={(e) => {
                    const cat = e.target.value;
                    setSelectedServiceCategory(cat);
                    if (cat === "hotel") setNewServiceUnit("night");
                    else if (cat === "flight") setNewServiceUnit("ticket");
                    else if (cat === "transfer") setNewServiceUnit("transfer");
                    else setNewServiceUnit("item");
                  }}
                  className="w-full rounded-lg border border-black/15 p-2.5 text-xs bg-white text-black"
                >
                  <option value="hotel">Accommodation / Hotel</option>
                  <option value="flight">Flight</option>
                  <option value="train">Haramain High Speed Train</option>
                  <option value="transfer">Private Transfer / Chauffeur</option>
                  <option value="private_trip">Private Trip / Ziyarat</option>
                  <option value="visa">Visa Service</option>
                  <option value="esim">eSIM &amp; Connectivity</option>
                  <option value="meals">Meals &amp; Catering</option>
                  <option value="service">Guide &amp; Dedicated Assistance</option>
                  <option value="custom">Custom Service</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-black/70">Service Name / Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Swissôtel Makkah / GMC Yukon Airport Transfer"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  className="w-full rounded-lg border border-black/15 p-2.5 text-xs text-black"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-black/70">Details / Specifications</label>
                <input
                  type="text"
                  placeholder="e.g. 5★ Luxury Kaaba view • Breakfast Included"
                  value={newServiceDetails}
                  onChange={(e) => setNewServiceDetails(e.target.value)}
                  className="w-full rounded-lg border border-black/15 p-2.5 text-xs text-black"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-black/70">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={newServiceQty}
                    onChange={(e) => setNewServiceQty(Number(e.target.value) || 1)}
                    className="w-full rounded-lg border border-black/15 p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-black/70">Unit</label>
                  <input
                    type="text"
                    value={newServiceUnit}
                    onChange={(e) => setNewServiceUnit(e.target.value)}
                    className="w-full rounded-lg border border-black/15 p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-black/70">Unit Price (AED)</label>
                  <input
                    type="number"
                    min={0}
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(Number(e.target.value) || 0)}
                    className="w-full rounded-lg border border-black/15 p-2 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/10">
                <button
                  type="button"
                  onClick={() => setIsAddServiceModalOpen(false)}
                  className="rounded-xl border border-black/15 px-4 py-2 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#b37e28] text-white px-5 py-2 font-bold hover:bg-[#916d28]"
                >
                  Add Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Quotation Modal Component */}
      <ShareQuotationModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        document={document}
        shareToken={shareToken}
      />
    </div>
  );
}
