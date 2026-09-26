"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Card,
  Field,
  inputClass,
  Badge,
} from "@/components/admin/ui";
import {
  addLineItem,
  deleteDocument,
  deleteLineItem,
  duplicateDocument,
  saveDocumentVersion,
  updateDocumentBasics,
  updateDocumentStatus,
  createDocumentFromSource,
} from "../../actions";
import type {
  DocumentItemRow,
  DocumentRow,
  DocumentShareRow,
  DocumentTemplateRow,
  DocumentVersionRow,
  DocumentItemType,
} from "@/lib/types/database";
import { CustomPackageBuilderModal } from "./CustomPackageBuilderModal";
import { ShareQuotationModal } from "@/components/documents/ShareQuotationModal";

const STATUS_OPTS = [
  { id: "draft", label: "Draft", tone: "blue" },
  { id: "sent", label: "Awaiting Client", tone: "gold" },
  { id: "viewed", label: "Viewed by Client", tone: "gold" },
  { id: "revision_requested", label: "Revision Requested", tone: "amber" },
  { id: "accepted", label: "Accepted", tone: "green" },
  { id: "rejected", label: "Declined", tone: "gray" },
  { id: "expired", label: "Expired", tone: "gray" },
] as const;

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
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);

  // Editable basics
  const [docNumber, setDocNumber] = useState(document.document_number);
  const [clientName, setClientName] = useState(document.client_name);
  const [clientPhone, setClientPhone] = useState(document.client_phone ?? "");
  const [clientEmail, setClientEmail] = useState(document.client_email ?? "");
  const [clientCountry, setClientCountry] = useState(document.client_country ?? "Dubai, UAE");
  const [journeyType, setJourneyType] = useState(document.journey_type ?? "umrah");
  const [travelDate, setTravelDate] = useState(document.travel_date ?? "");
  const [returnDate, setReturnDate] = useState(document.return_date ?? "");
  const [adults, setAdults] = useState<number>(document.adults ?? 2);
  const [children, setChildren] = useState<number>(document.children ?? 0);
  const [infants, setInfants] = useState<number>(document.infants ?? 0);
  const [origin, setOrigin] = useState(document.origin ?? "Dubai (DXB)");
  const [destination, setDestination] = useState(document.destination ?? "Jeddah (JED)");
  const [validUntil, setValidUntil] = useState(document.valid_until ?? "");
  const [status, setStatus] = useState(document.status ?? "draft");
  const [notes, setNotes] = useState(document.notes ?? "");
  const [terms, setTerms] = useState(document.terms ?? "");

  // Add Item / Section Modal
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemType, setNewItemType] = useState<DocumentItemType>("custom");
  const [newDesc, setNewDesc] = useState("");
  const [newDetails, setNewDetails] = useState("");
  const [newQty, setNewQty] = useState(1);
  const [newPrice, setNewPrice] = useState(0);

  // Client Details Modal
  const [isEditingClient, setIsEditingClient] = useState(false);

  // Share Quotation Modal
  const [showShareModal, setShowShareModal] = useState(false);

  // Share Token & Public URL
  const shareToken = activeShareToken || shares[0]?.share_token || document.id;
  const publicShareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/quote/${shareToken}`
    : `https://masaarholidays.com/quote/${shareToken}`;

  // Itinerary state
  const defaultItineraryList = [
    { day: 1, title: "Day 1: Departure & Arrival in Holy Makkah", desc: "Jeddah Airport arrival, private GMC transfer to Makkah hotel, check-in, guided Umrah at Masjid Al Haram." },
    { day: 2, title: "Days 2–5: Makkah Mukarramah & Sacred Sites Ziyarat", desc: "Daily prayers at Haram. Guided private Ziyarat to Cave Hira, Mount Thawr, Mina and Arafat with experienced guide." },
    { day: 3, title: "Day 6: High Speed Train to Madinah Munawwarah", desc: "Haramain High-Speed Train business-class transit, hotel check-in, initial Salam at the Prophet’s Mosque." },
    { day: 4, title: "Days 7–9: Madinah Munawwarah & Rawdah Visit", desc: "Guaranteed permit assistance for Rawdah Sharif. Ziyarat to Masjid Quba, Mount Uhud and Seven Mosques." },
    { day: 5, title: "Day 10: Farewell & Return Flight", desc: "Farewell prayer at Prophet’s Mosque, private transfer to Madinah Airport (MED) and return flight." },
  ];

  const initialItinerary = (() => {
    if (document.special_requirements) {
      try {
        const parsed = JSON.parse(document.special_requirements);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return defaultItineraryList;
  })();

  const [itineraryDays, setItineraryDays] = useState(initialItinerary);
  const [isEditingItinerary, setIsEditingItinerary] = useState(false);
  const [newDayTitle, setNewDayTitle] = useState("");
  const [newDayDesc, setNewDayDesc] = useState("");

  function handleSaveItinerary(newDays: typeof itineraryDays) {
    setItineraryDays(newDays);
    setIsEditingItinerary(false);
    run(async () => {
      await updateDocumentBasics(document.id, "quotation", {
        special_requirements: JSON.stringify(newDays),
      });
      router.refresh();
    });
  }

  function handleAddItineraryDay() {
    if (!newDayTitle.trim()) return;
    const nextDayNum = itineraryDays.length + 1;
    const updated = [
      ...itineraryDays,
      { day: nextDayNum, title: newDayTitle.trim(), desc: newDayDesc.trim() || "Activities as per confirmed schedule." }
    ];
    setNewDayTitle("");
    setNewDayDesc("");
    handleSaveItinerary(updated);
  }

  function handleRemoveItineraryDay(idx: number) {
    const updated = itineraryDays.filter((_, i) => i !== idx).map((d: any, i: number) => ({ ...d, day: i + 1 }));
    handleSaveItinerary(updated);
  }

  function run(fn: () => Promise<void>) {
    startTransition(async () => {
      try {
        await fn();
      } catch (err: any) {
        if (err && typeof err === "object" && "digest" in err && typeof err.digest === "string" && err.digest.startsWith("NEXT_REDIRECT")) {
          throw err;
        }
        alert(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  function handleSaveBasics() {
    run(async () => {
      await updateDocumentBasics(document.id, "quotation", {
        document_number: docNumber.trim(),
        client_name: clientName.trim(),
        client_phone: clientPhone || null,
        client_email: clientEmail || null,
        client_country: clientCountry || null,
        journey_type: journeyType as any,
        travel_date: travelDate || null,
        return_date: returnDate || null,
        adults,
        children,
        infants,
        origin,
        destination,
        valid_until: validUntil || null,
        status,
        notes: notes || null,
        terms: terms || null,
      });

      const nextVer = await saveDocumentVersion(document.id, "quotation");
      setSavedMessage(`Saved — Version ${nextVer}`);
      router.refresh();
      setTimeout(() => setSavedMessage(null), 3500);
    });
  }

  function handleStatusChange(nextStatus: string) {
    setStatus(nextStatus);
    run(async () => {
      await updateDocumentStatus(document.id, "quotation", nextStatus);
      router.refresh();
    });
  }

  function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newDesc.trim()) return;

    run(async () => {
      await addLineItem(document.id, "quotation", {
        item_type: newItemType,
        description: newDesc.trim(),
        details: newDetails.trim() || null,
        quantity: newQty,
        unit_price_aed: newPrice,
      });
      setIsAddingItem(false);
      setNewDesc("");
      setNewDetails("");
      setNewQty(1);
      setNewPrice(0);
      router.refresh();
    });
  }

  function handleDeleteItem(itemId: string) {
    if (!confirm("Remove this section/item from the quotation?")) return;
    run(async () => {
      await deleteLineItem(itemId, document.id, "quotation");
      router.refresh();
    });
  }

  function handleConvertToInvoice() {
    if (!confirm("Convert this quotation into an official Invoice? All passenger details and priced items will be copied.")) return;
    run(async () => {
      const res = await createDocumentFromSource(document.id, "invoice");
      if (res.success && res.id) {
        router.push(`/admin/documents/invoices/${res.id}`);
      } else {
        alert(res.error || "Failed to convert to invoice.");
      }
    });
  }

  function handleConvertToVoucher() {
    if (!confirm("Generate a confirmed Booking Voucher from this quotation?")) return;
    run(async () => {
      const res = await createDocumentFromSource(document.id, "booking_voucher");
      if (res.success && res.id) {
        router.push(`/admin/documents/booking-vouchers/${res.id}`);
      } else {
        alert(res.error || "Failed to generate booking voucher.");
      }
    });
  }

  async function handleSavePackageFromModal(config: {
    tier: string;
    tierPrice: number;
    makkahHotel: string;
    makkahPrice: number;
    madinahHotel: string;
    madinahPrice: number;
    roomType: string;
    roomAdjustment: number;
    vehicle: string;
    vehiclePrice: number;
    flightClass: string;
    flightPrice: number;
    extraServices: Array<{ name: string; price: number }>;
    totalAmount: number;
  }) {
    run(async () => {
      await addLineItem(document.id, "quotation", {
        item_type: journeyType === "hajj" ? "hajj_package" : "umrah_package",
        description: `${journeyType === "hajj" ? "Hajj 2027" : "Umrah 2026"} – ${config.tier} Package`,
        details: `${config.tier} Tier • ${config.roomType} Room Sharing • Includes direct flights & 5★ luxury hospitality`,
        quantity: adults,
        unit_price_aed: config.tierPrice,
      });

      if (config.makkahHotel) {
        await addLineItem(document.id, "quotation", {
          item_type: "hotel",
          description: `Makkah Hotel — ${config.makkahHotel}`,
          details: `5 Nights • Near Haram Courtyard • 5★ Luxury Buffet Breakfast Included`,
          quantity: 5,
          unit_price_aed: Math.round(config.makkahPrice / 5),
        });
      }

      if (config.madinahHotel) {
        await addLineItem(document.id, "quotation", {
          item_type: "hotel",
          description: `Madinah Hotel — ${config.madinahHotel}`,
          details: `5 Nights • Steps from Prophet's Mosque • 5★ Luxury Buffet Breakfast Included`,
          quantity: 5,
          unit_price_aed: Math.round(config.madinahPrice / 5),
        });
      }

      if (config.vehicle) {
        await addLineItem(document.id, "quotation", {
          item_type: "transfer",
          description: `Private ${config.vehicle}`,
          details: `Jeddah Airport → Makkah Hotel • Makkah → Madinah Hotel • Madinah → Airport`,
          quantity: 1,
          unit_price_aed: config.vehiclePrice,
        });
      }

      if (config.flightPrice > 0) {
        await addLineItem(document.id, "quotation", {
          item_type: "flight",
          description: `Emirates – Business Class Upgrade`,
          details: `Dubai (DXB) ↔ Jeddah/Madinah scheduled luxury cabin`,
          quantity: adults,
          unit_price_aed: config.flightPrice,
        });
      }

      for (const s of config.extraServices) {
        await addLineItem(document.id, "quotation", {
          item_type: "service",
          description: s.name,
          details: "Pilgrim additional inclusion",
          quantity: 1,
          unit_price_aed: s.price,
        });
      }

      router.refresh();
    });
  }

  function handleDuplicate() {
    run(async () => {
      const res = await duplicateDocument(document.id, "quotation");
      if (res.success && res.id) {
        router.push(`/admin/documents/quotations/${res.id}`);
      } else {
        alert(res.error || "Failed to duplicate quotation.");
      }
    });
  }

  function handleDeleteDoc() {
    if (!confirm(`Delete quotation ${document.document_number}? This action cannot be undone.`)) return;
    run(async () => {
      const res = await deleteDocument(document.id, "quotation");
      if (res.success) {
        router.push("/admin/documents/quotations");
      } else {
        alert(res.error || "Failed to delete quotation.");
      }
    });
  }

  function handleCopyShareLink() {
    if (!publicShareUrl) return;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(publicShareUrl);
      } else if (typeof window !== "undefined") {
        const textarea = window.document.createElement("textarea");
        textarea.value = publicShareUrl;
        window.document.body.appendChild(textarea);
        textarea.select();
        window.document.execCommand("copy");
        window.document.body.removeChild(textarea);
      }
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3500);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  }

  // Pre-configured Section Presets
  function openAddSectionWithPreset(presetType: DocumentItemType, defaultDesc: string, defaultDetails?: string, defaultPrice?: number) {
    setNewItemType(presetType);
    setNewDesc(defaultDesc);
    setNewDetails(defaultDetails || "");
    setNewQty(1);
    setNewPrice(defaultPrice || 0);
    setIsAddingItem(true);
  }

  // Group line items
  const packageItems = items.filter((i) => ["umrah_package", "hajj_package"].includes(i.item_type));
  const hotelItems = items.filter((i) => i.item_type === "hotel");
  const transferItems = items.filter((i) => i.item_type === "transfer");
  const flightItems = items.filter((i) => i.item_type === "flight");
  const mealItems = items.filter((i) => i.description.toLowerCase().includes("meal") || i.description.toLowerCase().includes("breakfast"));
  const otherItems = items.filter(
    (i) =>
      !packageItems.includes(i) &&
      !hotelItems.includes(i) &&
      !transferItems.includes(i) &&
      !flightItems.includes(i) &&
      !mealItems.includes(i)
  );

  return (
    <div className="space-y-6">
      {/* Top Header Bar matching QUOTATION BUILDER.png */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <nav className="text-xs text-masaar-black/50">
            <Link href="/admin/documents" className="hover:text-masaar-black">
              Documents &amp; Bookings
            </Link>
            <span className="mx-2">&gt;</span>
            <Link href="/admin/documents/quotations" className="hover:text-masaar-black">
              Quotations
            </Link>
            <span className="mx-2">&gt;</span>
            <span className="font-semibold text-masaar-black">{docNumber}</span>
          </nav>
          <h1 className="mt-1 font-serif text-2xl font-bold text-masaar-black sm:text-3xl">
            Quotation Builder
          </h1>
          <p className="mt-0.5 text-xs text-masaar-black/60">
            Add, edit and arrange sections to create a personalised quotation for your client.
          </p>
        </div>

        {/* Top Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {shareToken && (
            <>
              <Link
                href={`/quote/${shareToken}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 bg-white px-3.5 py-2 text-xs font-semibold text-masaar-black shadow-xs hover:bg-black/[0.03]"
              >
                <span>👁️</span> Preview
              </Link>

              <button
                type="button"
                onClick={() => setShowShareModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#b37e28] bg-light-gold/20 px-3.5 py-2 text-xs font-bold text-[#b37e28] shadow-xs hover:bg-light-gold/40 cursor-pointer"
              >
                <span>🔗</span> Share Link
              </button>
            </>
          )}

          <button
            type="button"
            onClick={handleSaveBasics}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 bg-white px-3.5 py-2 text-xs font-semibold text-masaar-black shadow-xs hover:bg-black/[0.03] disabled:opacity-60"
          >
            <span>💾</span> Save as Draft
          </button>

          <Link
            href={`/admin/documents/quotations/${document.id}/pdf`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#b37e28] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#96671e]"
          >
            <span>📄</span> Generate PDF ▾
          </Link>

          <div className="relative inline-block text-left">
            <select
              aria-label="More quotation options"
              value=""
              onChange={(e) => {
                const action = e.target.value;
                if (action === "invoice") handleConvertToInvoice();
                if (action === "voucher") handleConvertToVoucher();
                if (action === "duplicate") handleDuplicate();
                if (action === "send") router.push(`/admin/documents/quotations/${document.id}/send`);
                if (action === "versions") router.push(`/admin/documents/quotations/${document.id}/versions`);
                if (action === "delete") handleDeleteDoc();
              }}
              className="rounded-lg border border-black/15 bg-white px-3 py-2 text-xs font-semibold text-masaar-black shadow-xs hover:bg-black/[0.03]"
            >
              <option value="" disabled>⚙️ Options…</option>
              <option value="send">✉️ Send to Client (Email / WhatsApp)</option>
              <option value="versions">📜 Version History ({versions.length || 1})</option>
              <option value="invoice">💳 Convert to Invoice</option>
              <option value="voucher">🎫 Generate Booking Voucher</option>
              <option value="duplicate">📑 Duplicate Quotation</option>
              <option value="delete">🗑️ Delete Quotation</option>
            </select>
          </div>
        </div>
      </div>

      {savedMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-semibold text-green-700">
          ✓ {savedMessage}
        </div>
      )}

      {/* Main 3-Column Grid matching QUOTATION BUILDER.png */}
      <div className="grid gap-6 xl:grid-cols-12">
        {/* Left Column: Sections Stack (6 Cols) */}
        <div className="space-y-4 xl:col-span-6">
          {/* Quotation Details Header Strip Card */}
          <Card className="!p-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5 text-xs">
              <div>
                <span className="uppercase text-masaar-black/40 font-medium">Quotation No</span>
                <input
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  className="mt-1 block w-full rounded border border-black/15 bg-white px-2 py-1 font-semibold text-masaar-black"
                />
              </div>

              <div>
                <span className="uppercase text-masaar-black/40 font-medium">Version</span>
                <div className="mt-1 flex items-center gap-1 font-semibold text-masaar-black">
                  <span>v{versions[0]?.version_number ?? 1}</span>
                  <Link
                    href={`/admin/documents/quotations/${document.id}/versions`}
                    className="ml-1 text-[10px] text-admin-primary underline"
                  >
                    History
                  </Link>
                </div>
              </div>

              <div>
                <span className="uppercase text-masaar-black/40 font-medium">Date</span>
                <span className="mt-1 block font-medium text-masaar-black">
                  {new Date(document.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>

              <div>
                <span className="uppercase text-masaar-black/40 font-medium">Valid Until</span>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="mt-1 block w-full rounded border border-black/15 bg-white px-2 py-1 text-xs text-masaar-black"
                />
              </div>

              <div>
                <span className="uppercase text-masaar-black/40 font-medium">Status</span>
                <select
                  value={status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="mt-1 block w-full rounded border border-black/15 bg-white px-2 py-1 font-medium text-masaar-black"
                >
                  {STATUS_OPTS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* 1. Client Details Section */}
          <Card className="!p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-black/30 font-bold">⋮⋮</span>
                <div className="flex size-9 items-center justify-center rounded-lg bg-light-gold/20 text-base">
                  👤
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-admin-primary">
                      Client Details
                    </span>
                  </div>
                  <h3 className="font-semibold text-masaar-black text-sm">{clientName}</h3>
                  <p className="text-xs text-masaar-black/60">
                    {clientCountry} {clientPhone ? `| ${clientPhone}` : ""} {clientEmail ? `| ${clientEmail}` : ""}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-masaar-black/60">
                  {adults} Adults, {children} Children
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingClient(!isEditingClient)}
                  className="rounded-md border border-black/15 bg-white px-2.5 py-1 text-xs font-semibold text-masaar-black hover:bg-black/[0.02]"
                >
                  {isEditingClient ? "Done" : "Edit"}
                </button>
              </div>
            </div>

            {isEditingClient && (
              <div className="mt-4 border-t border-black/10 pt-4 grid gap-3 sm:grid-cols-2 text-xs">
                <Field label="Client Name">
                  <input
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Country / City">
                  <input
                    value={clientCountry}
                    onChange={(e) => setClientCountry(e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Phone">
                  <input
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Email">
                  <input
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>
            )}
          </Card>

          {/* 2. Package Details Section */}
          <Card className="!p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <span className="text-black/30 font-bold mt-2">⋮⋮</span>
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-light-gold/20 text-base">
                  📦
                </div>
                <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-black/10">
                  <Image
                    src="/Assets/BANNER IMAGE.png"
                    alt="Package"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-admin-primary">
                    Package
                  </span>
                  <h3 className="font-semibold text-masaar-black text-sm">
                    {packageItems[0]?.description || `${document.journey_type === "hajj" ? "Hajj 2027" : "Custom Umrah"} — Platinum Tier`}
                  </h3>
                  <p className="text-xs text-masaar-black/60">
                    {packageItems[0]?.details || "10 Days | Makkah & Madinah Luxury Experience with complete inclusions."}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="font-bold text-masaar-black text-sm">
                  {packageItems[0] ? `AED ${Number(packageItems[0].amount_aed).toLocaleString()}` : "Included"}
                </p>
                <button
                  type="button"
                  onClick={() => setIsPackageModalOpen(true)}
                  className="rounded-md border border-black/15 bg-white px-2.5 py-1 text-xs font-semibold text-masaar-black hover:bg-black/[0.02]"
                >
                  Edit
                </button>
              </div>
            </div>
          </Card>

          {/* 3. Itinerary Section */}
          <Card className="!p-4">
            <div className="flex items-start justify-between border-b border-black/10 pb-3">
              <div className="flex items-center gap-3">
                <span className="text-black/30 font-bold">⋮⋮</span>
                <div className="flex size-9 items-center justify-center rounded-lg bg-light-gold/20 text-base">
                  📋
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-admin-primary">
                    Itinerary
                  </span>
                  <h3 className="font-semibold text-masaar-black text-sm">
                    Complete Day-by-Day Journey Schedule
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded bg-light-gold/20 px-2 py-0.5 text-[10px] font-bold text-deep-gold">
                  {itineraryDays.length} Milestones
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingItinerary(true)}
                  className="rounded border border-black/15 bg-white px-2.5 py-1 text-xs font-semibold text-admin-primary hover:bg-light-gold/10"
                >
                  ✎ Edit Itinerary
                </button>
              </div>
            </div>

            <div className="mt-3 divide-y divide-black/5 text-xs">
              {itineraryDays.map((item: any, idx: number) => (
                <div key={idx} className="py-2.5 flex items-start gap-3 group">
                  <span className="flex size-5 items-center justify-center rounded-full bg-admin-primary text-[10px] font-bold text-white shrink-0 mt-0.5">
                    {item.day || idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-masaar-black">{item.title}</p>
                    <p className="text-masaar-black/60 text-[11px] mt-0.5">{item.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveItineraryDay(idx)}
                    className="opacity-0 group-hover:opacity-100 text-[11px] text-red-500 hover:underline shrink-0"
                    title="Remove day"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsEditingItinerary(true)}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-admin-primary/40 py-2 text-xs font-semibold text-admin-primary hover:bg-light-gold/10"
            >
              <span>+</span> Add Milestone or Custom Day
            </button>
          </Card>

          {/* 4. Accommodation Section */}
          <Card className="!p-4">
            <div className="flex items-start justify-between border-b border-black/10 pb-3">
              <div className="flex items-center gap-3">
                <span className="text-black/30 font-bold">⋮⋮</span>
                <div className="flex size-9 items-center justify-center rounded-lg bg-light-gold/20 text-base">
                  🏨
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-admin-primary">
                    Accommodation
                  </span>
                  <h3 className="font-semibold text-masaar-black text-sm">
                    Makkah &amp; Madinah 5★ Hotels
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  openAddSectionWithPreset(
                    "hotel",
                    "Swissôtel Makkah (5★ Clock Tower)",
                    "5 Nights • Quad/Twin sharing • Buffet breakfast included • Near Haram",
                    2800
                  )
                }
                className="text-xs text-admin-primary font-semibold hover:underline"
              >
                + Add Hotel
              </button>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2 text-xs">
              <div className="flex items-center gap-3 rounded-lg border border-black/10 p-2.5">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-black/10">
                  <Image
                    src="/hotels/swissotel-makkah/hero.jpg"
                    alt="Swissôtel Makkah"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-masaar-black">Swissôtel Makkah</p>
                  <p className="text-[11px] text-masaar-black/60">5 Nights • Near Haram • 5★</p>
                  <p className="text-[10px] text-pure-gold font-bold">★★★★★</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-black/10 p-2.5">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-black/10">
                  <Image
                    src="/hotels/anwar-al-madinah-movenpick/hero.jpg"
                    alt="Anwar Al Madinah"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-masaar-black">Anwar Al Madinah Mövenpick</p>
                  <p className="text-[11px] text-masaar-black/60">4 Nights • Courtyard Access • 5★</p>
                  <p className="text-[10px] text-pure-gold font-bold">★★★★★</p>
                </div>
              </div>
            </div>
          </Card>

          {/* 5. Transportation Section */}
          <Card className="!p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <span className="text-black/30 font-bold mt-2">⋮⋮</span>
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-light-gold/20 text-base">
                  🚗
                </div>
                <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-black/10">
                  <Image
                    src="/vehicles/gmc-yukon-suburban.jpg"
                    alt="GMC Yukon"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-admin-primary">
                    Transportation
                  </span>
                  <h3 className="font-semibold text-masaar-black text-sm">
                    Private GMC Yukon XL / Chauffeur
                  </h3>
                  <p className="text-xs text-masaar-black/60">
                    Jeddah Airport → Makkah Hotel → Madinah Hotel → Madinah Airport
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    openAddSectionWithPreset(
                      "transfer",
                      "Private GMC Yukon XL — Airport & Intercity Transfer",
                      "Full private intercity transfers with personal chauffeur.",
                      950
                    )
                  }
                  className="text-xs text-admin-primary font-semibold hover:underline"
                >
                  Configure
                </button>
              </div>
            </div>
          </Card>

          {/* 6. Flights Section */}
          <Card className="!p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <span className="text-black/30 font-bold mt-2">⋮⋮</span>
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-light-gold/20 text-base">
                  ✈️
                </div>
                <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-black/10">
                  <Image
                    src="/Assets/IMAGE 6 FLIGHT.jpg"
                    alt="Flight"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-admin-primary">
                    Flights
                  </span>
                  <h3 className="font-semibold text-masaar-black text-sm">
                    Emirates — Return Business / Economy
                  </h3>
                  <p className="text-xs text-masaar-black/60">
                    Dubai (DXB) → Jeddah (JED) | Madinah (MED) → Dubai (DXB)
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    openAddSectionWithPreset(
                      "flight",
                      "Emirates Airlines Return Flight",
                      "Dubai (DXB) ⇄ Jeddah (JED) • 25kg checked baggage included",
                      1850
                    )
                  }
                  className="text-xs text-admin-primary font-semibold hover:underline"
                >
                  Configure
                </button>
              </div>
            </div>
          </Card>

          {/* 7. Meals Section */}
          <Card className="!p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <span className="text-black/30 font-bold mt-2">⋮⋮</span>
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-light-gold/20 text-base">
                  🍽️
                </div>
                <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-black/10">
                  <Image
                    src="/Assets/IMAGE 4.jpg"
                    alt="Meals"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-admin-primary">
                    Meals
                  </span>
                  <h3 className="font-semibold text-masaar-black text-sm">
                    Daily 3-Course Meals &amp; Dining
                  </h3>
                  <p className="text-xs text-masaar-black/60">
                    Daily buffet breakfast and curated Arabic/Continental dining at hotel restaurants.
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    openAddSectionWithPreset(
                      "service",
                      "Daily 3-Course Meals & Dining",
                      "Daily breakfast and dinner at 5-star hotel buffet.",
                      450
                    )
                  }
                  className="text-xs text-admin-primary font-semibold hover:underline"
                >
                  Configure
                </button>
              </div>
            </div>
          </Card>

          {/* 8. Additional Services & Add-ons */}
          <Card className="!p-4">
            <div className="flex items-start justify-between border-b border-black/10 pb-3">
              <div className="flex items-center gap-3">
                <span className="text-black/30 font-bold">⋮⋮</span>
                <div className="flex size-9 items-center justify-center rounded-lg bg-light-gold/20 text-base">
                  ✨
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-admin-primary">
                    Additional Services &amp; Private Trips
                  </span>
                  <h3 className="font-semibold text-masaar-black text-sm">
                    High Speed Train, Ziyarat, Visa &amp; VIP Assistance
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  openAddSectionWithPreset(
                    "service",
                    "Saudi Electronic Tourist / Umrah Visa",
                    "1-year multiple entry visa with medical insurance coverage across KSA.",
                    550
                  )
                }
                className="text-xs text-admin-primary font-semibold hover:underline"
              >
                + Add Service
              </button>
            </div>

            <div className="mt-3 space-y-1.5 text-xs text-masaar-black/80">
              <div className="flex items-center gap-2">
                <span className="text-admin-primary font-bold">✓</span>
                <span>Haramain High Speed Rail ticket (Makkah → Madinah)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-admin-primary font-bold">✓</span>
                <span>Guided Historical Ziyarat in Makkah Mukarramah &amp; Madinah Munawwarah</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-admin-primary font-bold">✓</span>
                <span>Saudi Electronic Tourist / Umrah Visa with mandatory KSA medical insurance</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-admin-primary font-bold">✓</span>
                <span>24/7 Dedicated On-Ground Concierge &amp; Pilgrimage Support</span>
              </div>
            </div>
          </Card>

          {/* 9. Configured Custom Line Items (if any) */}
          {items.map((item, idx) => (
            <Card key={item.id} className="!p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-admin-primary">
                    {item.item_type.replace(/_/g, " ")} #{idx + 1}
                  </span>
                  <h4 className="font-semibold text-masaar-black text-sm">{item.description}</h4>
                  {item.details && <p className="text-xs text-masaar-black/60">{item.details}</p>}
                </div>
                <div className="text-right">
                  <p className="font-bold text-masaar-black text-sm">
                    AED {Number(item.amount_aed ?? 0).toLocaleString()}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item.id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </Card>
          ))}

          {/* 10. Thank You & Blessing Section */}
          <div className="rounded-xl border-2 border-pure-gold/30 bg-warm-ivory/50 p-5 text-center">
            <span className="text-2xl">🤲</span>
            <h4 className="mt-1 font-serif text-lg font-bold text-masaar-black">
              Thank You for Choosing Masaar Holidays
            </h4>
            <p className="font-serif italic text-xs text-masaar-black/70">
              “Faith guides the way. We take care of the rest.”
            </p>
            <p className="text-[11px] text-masaar-black/60 mt-1 max-w-md mx-auto">
              This official closing card and blessing note will appear at the conclusion of the quotation and PDF.
            </p>
          </div>

          {/* Add Custom Item Button */}
          <button
            type="button"
            onClick={() => {
              setNewItemType("custom");
              setNewDesc("");
              setNewDetails("");
              setNewQty(1);
              setNewPrice(0);
              setIsAddingItem(true);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-light-gold/50 bg-light-gold/5 p-4 text-xs font-bold text-admin-primary transition-all hover:border-light-gold hover:bg-light-gold/10"
          >
            <span>+</span> Add Custom Section or Custom Line Item
          </button>
        </div>

        {/* Center Column: Add Section Palette (3 Cols) matching QUOTATION BUILDER.png */}
        <div className="space-y-4 xl:col-span-3">
          <Card className="!p-4 sticky top-6">
            <div className="border-b border-black/10 pb-3">
              <h3 className="font-serif text-base font-bold text-masaar-black">
                Add Section
              </h3>
              <p className="text-xs text-masaar-black/60 mt-0.5">
                Click or drag to add a section to your quotation.
              </p>
            </div>

            <div className="mt-3 space-y-2 text-xs">
              {[
                { id: "client", label: "Client Details", icon: "👤", action: () => setIsEditingClient(true) },
                { id: "package", label: "Package", icon: "📦", action: () => setIsPackageModalOpen(true) },
                { id: "accommodation", label: "Accommodation", icon: "🏨", action: () => openAddSectionWithPreset("hotel", "Swissôtel Makkah — 5 Nights", "Near Haram, buffet breakfast included", 4200) },
                { id: "transportation", label: "Transportation", icon: "🚗", action: () => openAddSectionWithPreset("transfer", "Private GMC Yukon XL", "Airport & intercity transfers", 950) },
                { id: "flights", label: "Flights", icon: "✈️", action: () => openAddSectionWithPreset("flight", "Emirates – Business Class", "Direct scheduled return flights", 4500) },
                { id: "meals", label: "Meals", icon: "🍽️", action: () => openAddSectionWithPreset("custom", "3 Course Meals", "Daily buffet breakfast, lunch and dinner", 1200) },
                { id: "additional", label: "Additional Services", icon: "➕", action: () => openAddSectionWithPreset("service", "Ziyarat & Historical Tour", "Guided private tour of holy sites in Makkah & Madinah", 600) },
                { id: "itinerary", label: "Itinerary", icon: "📋", action: () => setIsEditingItinerary(true) },
                { id: "visa", label: "Visa Services", icon: "🛂", action: () => openAddSectionWithPreset("service", "Saudi Electronic Tourist / Umrah Visa", "Full processing with health insurance included", 750) },
                { id: "insurance", label: "Travel Insurance", icon: "🛡️", action: () => openAddSectionWithPreset("service", "Comprehensive Pilgrimage Travel Insurance", "Medical coverage, trip cancellation and luggage protection", 350) },
                { id: "terms", label: "Terms & Conditions", icon: "📜", action: () => {
                  setTerms(terms || "Standard payment schedule: 50% upon confirmation, balance 14 days prior to departure. Free cancellation up to 30 days prior.");
                  alert("Terms & Conditions added to quotation notes.");
                }},
                { id: "custom", label: "Custom Section", icon: "🧩", action: () => openAddSectionWithPreset("custom", "Custom Service / Inclusions", "Tailored pilgrim service as discussed", 500) },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.action}
                  className="flex w-full items-center justify-between rounded-xl border border-black/10 bg-white p-3 text-left font-semibold text-masaar-black shadow-xs hover:border-[#b37e28] hover:bg-[#FAF8F5] transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{item.icon}</span>
                    <span className="text-xs group-hover:text-[#916d28] transition-colors">{item.label}</span>
                  </div>
                  <span className="text-black/30 font-bold group-hover:text-[#916d28]">⋮⋮</span>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Preview & Summary (3 Cols) matching QUOTATION BUILDER.png */}
        <div className="space-y-4 xl:col-span-3">
          {/* Mini Quotation Preview Card */}
          <div className="overflow-hidden rounded-2xl border border-black/10 bg-gradient-to-b from-[#201D1A] to-[#12100E] text-white p-4 shadow-md relative">
            <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
              <span className="text-[10px] font-bold tracking-widest uppercase text-[#D4AF37]">
                Quotation Preview
              </span>
              {shareToken && (
                <Link
                  href={`/quote/${shareToken}`}
                  target="_blank"
                  className="text-white/60 hover:text-white text-xs font-semibold"
                >
                  Preview ↗
                </Link>
              )}
            </div>
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-white/10 my-3">
              <Image
                src="/Assets/BANNER IMAGE.png"
                alt="Preview"
                fill
                className="object-cover"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent flex flex-col justify-end p-4 text-center">
                <p className="font-serif italic text-xs text-[#D4AF37]">
                  Tailored Journeys for a Higher Purpose
                </p>
                <h4 className="font-serif text-sm font-bold text-white mt-1 uppercase">
                  {journeyType === "hajj" ? "HAJJ 2027 PLATINUM PACKAGE" : "UMRAH 2026 PLATINUM PACKAGE"}
                </h4>
                <p className="text-[9px] tracking-widest text-white/70 uppercase mt-1">
                  FAITH • CLARITY • CARE • PEACE
                </p>
              </div>
            </div>
          </div>

          {/* Quotation Summary Card */}
          <Card className="sticky top-6">
            <div className="border-b border-black/10 pb-3">
              <h3 className="font-serif text-base font-bold text-masaar-black">
                Summary
              </h3>
            </div>

            <div className="mt-3 space-y-2.5 text-xs font-sans">
              <div className="flex justify-between text-masaar-black/70">
                <span>Total (AED)</span>
                <span className="font-bold text-masaar-black">
                  {Number(document.total_aed ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-masaar-black/70">
                <span>Paid</span>
                <span className="font-medium text-masaar-black">
                  {Number(document.amount_paid_aed ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between border-t border-black/10 pt-2 font-bold text-masaar-black">
                <span>Balance</span>
                <span>
                  {Number((document.total_aed ?? 0) - (document.amount_paid_aed ?? 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Action Buttons matching QUOTATION BUILDER.png */}
            <div className="mt-4 space-y-2">
              {shareToken && (
                <Link
                  href={`/quote/${shareToken}`}
                  target="_blank"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#b37e28] to-[#96671e] py-3 text-xs font-bold text-white shadow-sm hover:from-[#9c6d1f] hover:to-[#845a17] transition-all"
                >
                  <span>👁️</span> View Full Preview
                </Link>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Link
                  href={`/admin/documents/quotations/${document.id}/pdf`}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-black/15 bg-white py-2 text-[11px] font-semibold text-masaar-black shadow-xs hover:bg-black/[0.02]"
                >
                  <span>📄</span> Download PDF
                </Link>

                <Link
                  href={`/admin/documents/quotations/${document.id}/send`}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-black/15 bg-white py-2 text-[11px] font-semibold text-masaar-black shadow-xs hover:bg-black/[0.02]"
                >
                  <span>✉️</span> Send via Email
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setShowShareModal(true)}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-black/15 bg-white py-2 text-[11px] font-semibold text-masaar-black shadow-xs hover:bg-black/[0.02] cursor-pointer"
                >
                  <span>💬</span> WhatsApp
                </button>

                <button
                  type="button"
                  onClick={() => setShowShareModal(true)}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-[#b37e28] bg-light-gold/20 py-2 text-[11px] font-bold text-[#b37e28] shadow-xs hover:bg-light-gold/30 cursor-pointer"
                >
                  <span>🔗</span> Share Link
                </button>
              </div>
            </div>

            {/* Auto-save indicator */}
            <div className="mt-4 rounded-xl bg-green-50 p-2.5 text-center text-[11px] font-medium text-green-800 border border-green-200/50">
              <p>✓ Quotation is saved automatically</p>
              <p className="text-[10px] text-green-700/70 mt-0.5">Last updated: Just now</p>
            </div>
          </Card>
        </div>
      </div>

      {/* Add Item Modal */}
      {isAddingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="font-serif text-lg font-bold text-masaar-black">
              Add Section / Line Item
            </h3>
            <p className="mt-1 text-xs text-masaar-black/60">
              Specify item details, quantity, and unit price in AED.
            </p>

            <form onSubmit={handleAddItem} className="mt-4 space-y-3 text-xs">
              <Field label="Section Type">
                <select
                  value={newItemType}
                  onChange={(e) => setNewItemType(e.target.value as any)}
                  className={inputClass}
                >
                  <option value="umrah_package">Umrah Package</option>
                  <option value="hajj_package">Hajj Package</option>
                  <option value="hotel">Accommodation (Hotel)</option>
                  <option value="transfer">Transportation &amp; Transfer</option>
                  <option value="flight">Flight</option>
                  <option value="service">Additional Service / Visa</option>
                  <option value="private_trip">Private Trip &amp; Ziyarat</option>
                  <option value="custom">Custom Line Item</option>
                </select>
              </Field>

              <Field label="Title / Description" required>
                <input
                  required
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="e.g. Swissôtel Makkah — 5 Nights"
                  className={inputClass}
                />
              </Field>

              <Field label="Details / Inclusions">
                <textarea
                  rows={3}
                  value={newDetails}
                  onChange={(e) => setNewDetails(e.target.value)}
                  placeholder="e.g. Twin room sharing, breakfast included, near Haram"
                  className={inputClass}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Quantity">
                  <input
                    type="number"
                    min="1"
                    value={newQty}
                    onChange={(e) => setNewQty(Number(e.target.value))}
                    className={inputClass}
                  />
                </Field>

                <Field label="Unit Price (AED)">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    className={inputClass}
                  />
                </Field>
              </div>

              <div className="mt-6 flex justify-end gap-2 border-t border-black/10 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddingItem(false)}
                  className="rounded-lg border border-black/15 px-4 py-2 text-xs font-semibold text-masaar-black hover:bg-black/[0.02]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-admin-primary px-4 py-2 text-xs font-bold text-white hover:bg-admin-primary-dark"
                >
                  Add to Quotation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Itinerary Modal */}
      {isEditingItinerary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-black/10 pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-masaar-black">
                  Manage Journey Itinerary
                </h3>
                <p className="text-xs text-masaar-black/60 mt-0.5">
                  Customise milestone titles, descriptions, and add new days.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingItinerary(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {itineraryDays.map((d: any, idx: number) => (
                <div key={idx} className="rounded-lg border border-black/10 p-3 bg-neutral-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-admin-primary">
                      Milestone #{idx + 1} (Day {d.day || idx + 1})
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItineraryDay(idx)}
                      className="text-[11px] text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                  <input
                    value={d.title}
                    onChange={(e) => {
                      const updated = [...itineraryDays];
                      updated[idx] = { ...updated[idx], title: e.target.value };
                      setItineraryDays(updated);
                    }}
                    placeholder="e.g. Day 1: Arrival & Umrah Performance"
                    className={inputClass}
                  />
                  <textarea
                    rows={2}
                    value={d.desc}
                    onChange={(e) => {
                      const updated = [...itineraryDays];
                      updated[idx] = { ...updated[idx], desc: e.target.value };
                      setItineraryDays(updated);
                    }}
                    placeholder="Activities, transfer details, ziyarat..."
                    className={inputClass}
                  />
                </div>
              ))}
            </div>

            {/* Add New Day Form */}
            <div className="mt-4 rounded-xl border border-dashed border-admin-primary/40 bg-light-gold/5 p-3.5 space-y-2">
              <span className="text-xs font-bold text-admin-primary">+ Add New Day / Milestone</span>
              <input
                value={newDayTitle}
                onChange={(e) => setNewDayTitle(e.target.value)}
                placeholder="Day title (e.g. Day 11: Extra Ziyarat in Taif)"
                className={inputClass}
              />
              <textarea
                rows={2}
                value={newDayDesc}
                onChange={(e) => setNewDayDesc(e.target.value)}
                placeholder="Day details and activities..."
                className={inputClass}
              />
              <button
                type="button"
                onClick={handleAddItineraryDay}
                disabled={!newDayTitle.trim()}
                className="rounded-lg bg-light-gold px-3 py-1.5 text-xs font-bold text-masaar-black disabled:opacity-50"
              >
                + Add Day to Schedule
              </button>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-black/10 pt-4">
              <button
                type="button"
                onClick={() => setIsEditingItinerary(false)}
                className="rounded-lg border border-black/15 px-4 py-2 text-xs font-semibold text-masaar-black hover:bg-black/[0.02]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveItinerary(itineraryDays)}
                className="rounded-lg bg-admin-primary px-4 py-2 text-xs font-bold text-white hover:bg-admin-primary-dark"
              >
                Save Itinerary Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Package Builder Modal matching CUSTOM PACKAGE BUILDER.png */}
      <CustomPackageBuilderModal
        isOpen={isPackageModalOpen}
        onClose={() => setIsPackageModalOpen(false)}
        journeyType={journeyType}
        adults={adults}
        children={children}
        travelDate={travelDate}
        returnDate={returnDate}
        onSavePackage={handleSavePackageFromModal}
      />

      {/* Share with Passenger Modal */}
      <ShareQuotationModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        document={{
          ...document,
          total_aed: document.total_aed,
          client_name: clientName,
          client_phone: clientPhone,
          client_email: clientEmail,
          journey_type: journeyType,
          document_number: docNumber,
        }}
        shareToken={shareToken || document.id}
      />
    </div>
  );
}
