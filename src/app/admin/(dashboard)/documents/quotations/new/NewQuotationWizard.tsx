"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card, Field, inputClass } from "@/components/admin/ui";
import type { DocumentJourneyType } from "@/lib/types/database";

interface EnquirySeed {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  country?: string | null;
  enquiry_type?: string | null;
  travel_date?: string | null;
  passengers?: number | null;
  origin?: string | null;
  destination?: string | null;
}

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

const ORIGIN_OPTIONS = [
  "Dubai (DXB)",
  "Abu Dhabi (AUH)",
  "Sharjah (SHJ)",
  "London Heathrow (LHR)",
  "Manchester (MAN)",
  "New York (JFK)",
  "Toronto (YYZ)",
  "Muscat (MCT)",
  "Doha (DOH)",
  "Bahrain (BAH)",
  "Kuwait (KWI)",
  "Other / Direct",
];

const DESTINATION_OPTIONS = [
  "Jeddah (JED)",
  "Madinah (MED)",
  "Riyadh (RUH)",
  "Taif (TIF)",
  "Makkah (Direct Transfer)",
];

export function NewQuotationWizard({
  enquiries = [],
  seedEnquiryId,
}: {
  enquiries: EnquirySeed[];
  seedEnquiryId?: string;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Client selection / creation mode
  const seeded = enquiries.find((e) => e.id === seedEnquiryId);
  const [clientMode, setClientMode] = useState<"existing" | "new">(
    seeded ? "existing" : "existing"
  );
  const [selectedEnquiry, setSelectedEnquiry] = useState<EnquirySeed | null>(
    seeded || null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // Client Details
  const [clientName, setClientName] = useState(seeded?.name || "");
  const [clientEmail, setClientEmail] = useState(seeded?.email || "");
  const [clientPhone, setClientPhone] = useState(seeded?.phone || "");
  const [clientCountry, setClientCountry] = useState(
    seeded?.country || "Dubai, UAE"
  );

  // 2. Journey Type
  const [journeyType, setJourneyType] = useState<DocumentJourneyType>(
    (seeded?.enquiry_type?.toLowerCase() as DocumentJourneyType) || "umrah"
  );

  // 3. Travel Details
  const [travelDate, setTravelDate] = useState(seeded?.travel_date || "2026-10-10");
  const [returnDate, setReturnDate] = useState("2026-10-20");
  const [adults, setAdults] = useState<number>(seeded?.passengers || 2);
  const [children, setChildren] = useState<number>(0);
  const [infants, setInfants] = useState<number>(0);
  const [origin, setOrigin] = useState("Dubai (DXB)");
  const [destination, setDestination] = useState("Jeddah (JED)");

  // Filter existing enquiries for search
  const filteredEnquiries = enquiries.filter((e) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.name.toLowerCase().includes(q) ||
      (e.email && e.email.toLowerCase().includes(q)) ||
      (e.phone && e.phone.toLowerCase().includes(q))
    );
  });

  function handleSelectEnquiry(enq: EnquirySeed) {
    setSelectedEnquiry(enq);
    setClientName(enq.name);
    setClientEmail(enq.email || "");
    setClientPhone(enq.phone || "");
    if (enq.country) setClientCountry(enq.country);
    if (enq.travel_date) setTravelDate(enq.travel_date);
    if (enq.passengers) setAdults(enq.passengers);
    if (enq.enquiry_type) {
      const match = JOURNEY_TYPES.find(
        (j) => j.id === enq.enquiry_type?.toLowerCase()
      );
      if (match) setJourneyType(match.id);
    }
    setShowSearchDropdown(false);
  }

  function handleClearClient() {
    setSelectedEnquiry(null);
    setClientName("");
    setClientEmail("");
    setClientPhone("");
  }

  // Format date range for summary
  function formatDateRange() {
    if (!travelDate) return "Dates to be confirmed";
    const d1 = new Date(travelDate);
    const d2 = returnDate ? new Date(returnDate) : null;
    const d1Formatted = d1.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    if (!d2 || Number.isNaN(d2.getTime())) return d1Formatted;
    const d2Formatted = d2.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    return `${d1Formatted} – ${d2Formatted}`;
  }

  // Get Avatar Initials
  function getInitials(name: string) {
    if (!name.trim()) return "MQ";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  // Submission handler
  async function handleSubmit(asDraft = false) {
    setError(null);
    if (!clientName.trim()) {
      setError("Please select or enter a client name.");
      return;
    }

    setIsPending(true);
    try {
      // Build sensible default sections matching QUOTATION BUILDER.png
      const defaultItems: Array<{
        item_type: any;
        description: string;
        details?: string | null;
        quantity: number;
        unit_price_aed: number;
        display_order: number;
      }> = [];

      let order = 0;
      if (journeyType === "hajj") {
        defaultItems.push({
          item_type: "hajj_package",
          description: "Hajj 2027 – Platinum Package",
          details: "13 Days | Makkah – Madinah – Mina – Arafat – Muzdalifah",
          quantity: adults,
          unit_price_aed: 18750,
          display_order: order++,
        });
        defaultItems.push({
          item_type: "hotel",
          description: "Makkah Hotel — Swissôtel Makkah",
          details: "5 Nights | Near Haram | 5★ Luxury Kaaba view",
          quantity: 5,
          unit_price_aed: 840,
          display_order: order++,
        });
        defaultItems.push({
          item_type: "hotel",
          description: "Madinah Hotel — Anwar Al Madinah Mövenpick",
          details: "5 Nights | Near Haram | 5★ Prophet's Mosque view",
          quantity: 5,
          unit_price_aed: 560,
          display_order: order++,
        });
        defaultItems.push({
          item_type: "transfer",
          description: "Private GMC Yukon XL",
          details: "Jeddah Airport → Makkah Hotel • Makkah → Madinah Hotel",
          quantity: 1,
          unit_price_aed: 950,
          display_order: order++,
        });
        defaultItems.push({
          item_type: "flight",
          description: "Emirates – Business Class",
          details: "Dubai (DXB) → Jeddah (JED) • Madinah (MED) → Dubai (DXB)",
          quantity: adults,
          unit_price_aed: 4500,
          display_order: order++,
        });
        defaultItems.push({
          item_type: "custom",
          description: "3 Course Meals",
          details: "Daily breakfast, lunch and dinner included",
          quantity: adults,
          unit_price_aed: 0,
          display_order: order++,
        });
        defaultItems.push({
          item_type: "service",
          description: "Additional Services",
          details: "Haramain High Speed Train • Ziyarat in Makkah & Madinah • Dedicated Tour Guide",
          quantity: 1,
          unit_price_aed: 0,
          display_order: order++,
        });
      } else {
        // Default Umrah Package
        defaultItems.push({
          item_type: "umrah_package",
          description: "Umrah 2026 – Platinum Package",
          details: "10 Days / 9 Nights | Direct Flights, 5-Star Luxury Hotels, Private GMC Transfers & Ziyarat",
          quantity: adults,
          unit_price_aed: 8500,
          display_order: order++,
        });
        defaultItems.push({
          item_type: "hotel",
          description: "Makkah Hotel — Swissôtel Makkah",
          details: "5 Nights | Clock Tower / Near Haram Courtyard | 5★ Luxury Buffet",
          quantity: 5,
          unit_price_aed: 840,
          display_order: order++,
        });
        defaultItems.push({
          item_type: "hotel",
          description: "Madinah Hotel — Anwar Al Madinah Mövenpick",
          details: "4 Nights | Steps from Prophet's Mosque | 5★ Luxury Buffet",
          quantity: 4,
          unit_price_aed: 650,
          display_order: order++,
        });
        defaultItems.push({
          item_type: "transfer",
          description: "Private GMC Yukon XL Transfers",
          details: "Airport Jeddah → Makkah Hotel • Makkah → Madinah • Madinah → Airport",
          quantity: 1,
          unit_price_aed: 950,
          display_order: order++,
        });
        defaultItems.push({
          item_type: "service",
          description: "Additional Services & Ziyarat",
          details: "Haramain High Speed Train (Business) • Makkah & Madinah Historical Ziyarat • Saudi Tourist E-Visa",
          quantity: 1,
          unit_price_aed: 0,
          display_order: order++,
        });
      }

      const payload = {
        client_name: clientName.trim(),
        client_email: clientEmail.trim() || undefined,
        client_phone: clientPhone.trim() || undefined,
        client_country: clientCountry.trim() || "Dubai, UAE",
        journey_type: journeyType,
        travel_date: travelDate || undefined,
        return_date: returnDate || undefined,
        adults,
        children,
        infants,
        origin,
        destination,
        future_crm_enquiry_id: selectedEnquiry?.id || undefined,
        items: defaultItems,
      };

      // Use API route instead of Server Action — works reliably on
      // Hostinger self-hosted Node.js where SA cookie propagation differs.
      const res = await fetch("/api/admin/documents/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then((r) => r.json()) as { success: boolean; id?: string; error?: string };
      if (res.success && res.id) {
        if (asDraft) {
          router.push("/admin/documents/quotations");
        } else {
          router.push(`/admin/documents/quotations/${res.id}`);
        }
      } else {
        setError(res.error || "Failed to create quotation. Please try again.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Breadcrumbs */}
      <nav className="text-xs text-masaar-black/50">
        <Link href="/admin/documents" className="hover:text-masaar-black">
          Documents &amp; Bookings
        </Link>
        <span className="mx-2">&gt;</span>
        <Link href="/admin/documents/quotations" className="hover:text-masaar-black">
          Quotations
        </Link>
        <span className="mx-2">&gt;</span>
        <span className="font-semibold text-masaar-black">Create Quotation</span>
      </nav>

      {/* 2. Top Header Banner with Faith / Clarity / Care / Peace (Exact match QUOTATION MAKER.png) */}
      <div className="relative overflow-hidden rounded-2xl border border-black/10 bg-gradient-to-r from-[#FAF8F5] via-white to-[#F6F1E8] p-6 shadow-xs sm:p-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="max-w-xl">
            <h1 className="font-serif text-3xl font-bold tracking-tight text-masaar-black sm:text-4xl">
              Create Quotation
            </h1>
            <p className="mt-2 text-sm text-masaar-black/70 leading-relaxed font-sans">
              Build a personalised journey for your client. Select a client, choose the journey type,
              add travel details and continue.
            </p>
          </div>

          {/* Right Brand Badge */}
          <div className="hidden shrink-0 border-l border-black/10 pl-8 md:block">
            <div className="space-y-1 font-serif text-[11px] font-bold uppercase tracking-[0.25em] text-[#916d28]">
              <div>FAITH</div>
              <div>CLARITY</div>
              <div>CARE</div>
              <div>PEACE</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. 4-Step Progress Bar (Exact match QUOTATION MAKER.png) */}
      <div className="py-2">
        <div className="flex items-center justify-between max-w-4xl mx-auto px-4">
          {/* Step 1: Active */}
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-full bg-[#a37021] text-xs font-bold text-white shadow-xs">
              1
            </div>
            <span className="text-xs font-bold text-masaar-black hidden sm:inline">
              Client &amp; Trip Details
            </span>
          </div>

          <div className="h-0.5 flex-1 bg-black/15 mx-3 sm:mx-6" />

          {/* Step 2 */}
          <div className="flex items-center gap-3 opacity-60">
            <div className="flex size-8 items-center justify-center rounded-full bg-black/10 text-xs font-semibold text-masaar-black">
              2
            </div>
            <span className="text-xs font-medium text-masaar-black hidden sm:inline">
              Itinerary &amp; Services
            </span>
          </div>

          <div className="h-0.5 flex-1 bg-black/15 mx-3 sm:mx-6" />

          {/* Step 3 */}
          <div className="flex items-center gap-3 opacity-60">
            <div className="flex size-8 items-center justify-center rounded-full bg-black/10 text-xs font-semibold text-masaar-black">
              3
            </div>
            <span className="text-xs font-medium text-masaar-black hidden sm:inline">
              Pricing &amp; Summary
            </span>
          </div>

          <div className="h-0.5 flex-1 bg-black/15 mx-3 sm:mx-6" />

          {/* Step 4 */}
          <div className="flex items-center gap-3 opacity-60">
            <div className="flex size-8 items-center justify-center rounded-full bg-black/10 text-xs font-semibold text-masaar-black">
              4
            </div>
            <span className="text-xs font-medium text-masaar-black hidden sm:inline">
              Review &amp; Generate
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
          ⚠️ {error}
        </div>
      )}

      {/* 4. Main Two-Column Layout (Form on Left | Sticky Summary on Right) */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Form: 3 Cards */}
        <div className="space-y-6 lg:col-span-8">
          {/* Card 1: Client */}
          <Card className="!p-6 space-y-5">
            <div className="flex items-center gap-3">
              <span className="text-xl">👤</span>
              <div>
                <h2 className="font-serif text-lg font-bold text-masaar-black">
                  1. Client
                </h2>
                <p className="text-xs text-masaar-black/60">
                  Select an existing client or create a new one.
                </p>
              </div>
            </div>

            {/* Toggle Tabs */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setClientMode("existing")}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-bold transition-all ${
                  clientMode === "existing"
                    ? "border-[#b37e28] bg-[#fbf6ec] text-[#865917] shadow-xs ring-1 ring-[#b37e28]/40"
                    : "border-black/15 bg-white text-masaar-black/70 hover:bg-black/[0.02]"
                }`}
              >
                <span>👤</span> Select Existing Client
              </button>
              <button
                type="button"
                onClick={() => {
                  setClientMode("new");
                  handleClearClient();
                }}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-bold transition-all ${
                  clientMode === "new"
                    ? "border-[#b37e28] bg-[#fbf6ec] text-[#865917] shadow-xs ring-1 ring-[#b37e28]/40"
                    : "border-black/15 bg-white text-masaar-black/70 hover:bg-black/[0.02]"
                }`}
              >
                <span>+👤</span> Create New Client
              </button>
            </div>

            {/* Existing Client Search & Selected Card */}
            {clientMode === "existing" ? (
              <div className="space-y-3">
                {selectedEnquiry || clientName ? (
                  /* Selected Client Card */
                  <div className="relative flex items-center justify-between rounded-xl border border-black/15 bg-[#FAF9F7] p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#f0e4cf] text-sm font-bold text-[#845c19]">
                        {getInitials(clientName)}
                      </div>
                      <div>
                        <h4 className="font-serif font-bold text-sm text-masaar-black">
                          {clientName}
                        </h4>
                        <p className="text-xs text-masaar-black/60 mt-0.5">
                          {clientEmail || "No email"} {clientPhone ? `| ${clientPhone}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-xs text-masaar-black/50 hidden sm:inline">
                        {clientCountry}
                      </span>
                      <button
                        type="button"
                        onClick={handleClearClient}
                        title="Remove selected client"
                        className="rounded-full p-1 text-masaar-black/40 hover:bg-black/5 hover:text-masaar-black text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Search Input */
                  <div className="relative">
                    <div className="relative">
                      <input
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setShowSearchDropdown(true);
                        }}
                        onFocus={() => setShowSearchDropdown(true)}
                        placeholder="🔍 Search by name, email or phone..."
                        className={inputClass}
                      />
                    </div>

                    {showSearchDropdown && (
                      <div className="absolute left-0 right-0 z-20 mt-1 max-h-56 overflow-y-auto rounded-xl border border-black/15 bg-white p-1.5 shadow-xl">
                        {filteredEnquiries.length === 0 ? (
                          <div className="p-3 text-center text-xs text-masaar-black/50">
                            No clients or enquiries found. You can switch to &ldquo;Create New Client&rdquo;.
                          </div>
                        ) : (
                          filteredEnquiries.map((enq) => (
                            <button
                              key={enq.id}
                              type="button"
                              onClick={() => handleSelectEnquiry(enq)}
                              className="w-full text-left rounded-lg p-2.5 hover:bg-black/[0.04] transition-colors flex items-center justify-between"
                            >
                              <div>
                                <p className="font-semibold text-xs text-masaar-black">{enq.name}</p>
                                <p className="text-[11px] text-masaar-black/50">{enq.email || enq.phone || "No contact info"}</p>
                              </div>
                              <span className="text-[11px] text-[#916d28] font-medium uppercase">
                                {enq.enquiry_type || "Enquiry"}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Create New Client Inputs */
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full Name" required>
                  <input
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. Mr. Ahmed Khan"
                    className={inputClass}
                  />
                </Field>
                <Field label="Country / City">
                  <input
                    value={clientCountry}
                    onChange={(e) => setClientCountry(e.target.value)}
                    placeholder="e.g. Dubai, UAE"
                    className={inputClass}
                  />
                </Field>
                <Field label="Phone Number">
                  <input
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="e.g. +971 50 123 4567"
                    className={inputClass}
                  />
                </Field>
                <Field label="Email Address">
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="e.g. ahmed.khan@email.com"
                    className={inputClass}
                  />
                </Field>
              </div>
            )}
          </Card>

          {/* Card 2: Journey Type (Exact match QUOTATION MAKER.png) */}
          <Card className="!p-6 space-y-5">
            <div className="flex items-center gap-3">
              <span className="text-xl">✈️</span>
              <div>
                <h2 className="font-serif text-lg font-bold text-masaar-black">
                  2. Journey Type
                </h2>
                <p className="text-xs text-masaar-black/60">
                  Select the type of journey for this quotation.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
              {JOURNEY_TYPES.map((jt) => {
                const isSelected = journeyType === jt.id;
                return (
                  <button
                    key={jt.id}
                    type="button"
                    onClick={() => setJourneyType(jt.id)}
                    className={`relative flex flex-col items-center justify-center rounded-2xl border p-4 text-center transition-all ${
                      isSelected
                        ? "border-[#b37e28] bg-white shadow-md ring-2 ring-[#b37e28]"
                        : "border-black/10 bg-white hover:border-black/25 hover:bg-black/[0.01]"
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-2 right-2 flex size-4 items-center justify-center rounded-full bg-[#b37e28] text-[9px] font-bold text-white">
                        ✓
                      </span>
                    )}
                    <span className="text-2xl mb-1.5">{jt.icon}</span>
                    <span className="text-xs font-bold text-masaar-black">
                      {jt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Card 3: Travel Details (Exact match QUOTATION MAKER.png) */}
          <Card className="!p-6 space-y-5">
            <div className="flex items-center gap-3">
              <span className="text-xl">📅</span>
              <div>
                <h2 className="font-serif text-lg font-bold text-masaar-black">
                  3. Travel Details
                </h2>
                <p className="text-xs text-masaar-black/60">
                  Enter the main travel details for this quotation.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Travel Date" required>
                <input
                  type="date"
                  required
                  value={travelDate}
                  onChange={(e) => setTravelDate(e.target.value)}
                  className={inputClass}
                />
              </Field>

              <Field label="Return Date">
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className={inputClass}
                />
              </Field>

              <Field label="Adults" required>
                <select
                  value={adults}
                  onChange={(e) => setAdults(Number(e.target.value))}
                  className={inputClass}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 30].map((n) => (
                    <option key={n} value={n}>
                      {n} Adult{n > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Children">
                <select
                  value={children}
                  onChange={(e) => setChildren(Number(e.target.value))}
                  className={inputClass}
                >
                  {[0, 1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
                    <option key={n} value={n}>
                      {n} Child{n !== 1 ? "ren" : ""}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Infants">
                <select
                  value={infants}
                  onChange={(e) => setInfants(Number(e.target.value))}
                  className={inputClass}
                >
                  {[0, 1, 2, 3, 4].map((n) => (
                    <option key={n} value={n}>
                      {n} Infant{n !== 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Origin" required>
                <select
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className={inputClass}
                >
                  {ORIGIN_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="sm:col-span-2 lg:col-span-3">
                <Field label="Destination" required>
                  <select
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className={inputClass}
                  >
                    {DESTINATION_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Sticky Column: Quotation Summary (Exact match QUOTATION MAKER.png) */}
        <div className="lg:col-span-4">
          <div className="sticky top-6 space-y-4">
            <Card className="!p-6 space-y-5 border-black/10">
              {/* Header */}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">📄</span>
                  <h3 className="font-serif text-lg font-bold text-masaar-black">
                    Quotation Summary
                  </h3>
                </div>
                <p className="text-xs text-masaar-black/60 mt-0.5">
                  The details you add will appear here.
                </p>
              </div>

              {/* Summary Rows */}
              <div className="space-y-3.5 border-t border-black/10 pt-4 text-xs font-sans">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-masaar-black/60">
                    <span>👤</span>
                    <span>Client</span>
                  </div>
                  <span className="font-semibold text-masaar-black text-right">
                    {clientName || "—"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-masaar-black/60">
                    <span>🕋</span>
                    <span>Journey Type</span>
                  </div>
                  <span className="font-semibold text-masaar-black capitalize text-right">
                    {journeyType.replace("_", " ")}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-masaar-black/60">
                    <span>📅</span>
                    <span>Travel Dates</span>
                  </div>
                  <span className="font-semibold text-masaar-black text-right">
                    {formatDateRange()}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-masaar-black/60">
                    <span>👥</span>
                    <span>Travellers</span>
                  </div>
                  <span className="font-semibold text-masaar-black text-right">
                    {adults} Adults, {children} Children, {infants} Infants
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-masaar-black/60">
                    <span>📍</span>
                    <span>Route</span>
                  </div>
                  <span className="font-semibold text-masaar-black text-right">
                    {origin} → {destination}
                  </span>
                </div>
              </div>

              {/* Next Step Placeholder box */}
              <div className="rounded-2xl border border-dashed border-black/15 bg-warm-ivory/60 p-6 text-center space-y-2">
                <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-white text-lg shadow-xs">
                  📄
                </div>
                <p className="text-xs text-masaar-black/60 max-w-xs mx-auto leading-relaxed">
                  Add itinerary, hotels, flights, transfers and other services in the next step.
                </p>
              </div>

              {/* Spiritual Banner Quote */}
              <div className="text-center pt-2">
                <p className="font-serif italic text-xs text-masaar-black/75">
                  &ldquo;Thoughtful journeys create peaceful pilgrims.&rdquo;
                </p>
                <div className="mx-auto mt-2 h-0.5 w-12 bg-[#b37e28]/50" />
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  disabled={isPending || !clientName.trim()}
                  onClick={() => handleSubmit(false)}
                  className="w-full rounded-xl bg-gradient-to-r from-[#b37e28] to-[#96671e] py-3 text-xs font-bold text-white shadow-sm hover:from-[#9c6d1f] hover:to-[#845a17] transition-all disabled:opacity-50"
                >
                  {isPending ? "Creating Quotation..." : "Save & Continue →"}
                </button>

                <button
                  type="button"
                  disabled={isPending || !clientName.trim()}
                  onClick={() => handleSubmit(true)}
                  className="w-full rounded-xl border border-black/15 bg-white py-2.5 text-xs font-semibold text-masaar-black hover:bg-black/[0.02] transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <span>💾</span> Save as Draft
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
