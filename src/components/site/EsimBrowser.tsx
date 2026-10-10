"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Container } from "./Container";
import { CrossLinkServices } from "./CrossLinkServices";
import { useCurrency } from "./CurrencyProvider";
import { formatEsimPrice } from "@/lib/currency";
import { buildWhatsAppLink } from "@/lib/contact";
import {
  ESIM_DESTINATIONS,
  getEnabledDestinations,
  getFeaturedDestinations,
  getDestinationByIso,
  type EsimDestination,
} from "@/lib/esim-config";
import type { PublicEsimPlan } from "@/lib/data/esim";

interface EsimBrowserProps {
  plans: PublicEsimPlan[];
  initialCountry?: string;
}

type DataFilter = "all" | "1-3" | "5-10" | "50" | "unlimited";
type ValidityFilter = "all" | "1-7" | "15" | "30";

function WhatsAppIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export function EsimBrowser({ plans, initialCountry = "SA" }: EsimBrowserProps) {
  const router = useRouter();
  const { currency, rates } = useCurrency();

  const enabledDestinations = useMemo(() => getEnabledDestinations(), []);
  const featuredDestinations = useMemo(() => getFeaturedDestinations(), []);

  // Filter other enabled destinations that have at least one active plan
  const otherDestinationsWithPlans = useMemo(() => {
    return enabledDestinations.filter(
      (d) => !d.featured && plans.some((p) => p.country_iso === d.iso)
    );
  }, [enabledDestinations, plans]);

  // Determine initial valid ISO or fall back to "SA"
  const resolvedInitialIso = useMemo(() => {
    const raw = (initialCountry || "").toUpperCase().trim();
    const matched = enabledDestinations.find((d) => d.iso === raw);
    return matched ? matched.iso : "SA";
  }, [initialCountry, enabledDestinations]);

  const [selectedCountry, setSelectedCountry] = useState<string>(resolvedInitialIso);

  // Search filter for the "More destinations" dropdown
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Client-side plan filters
  const [dataFilter, setDataFilter] = useState<DataFilter>("all");
  const [validityFilter, setValidityFilter] = useState<ValidityFilter>("all");
  const [openTooltipId, setOpenTooltipId] = useState<string | null>(null);

  // Sync with browser URL / history
  useEffect(() => {
    const readUrlCountry = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const c = params.get("country")?.toUpperCase()?.trim();
        if (c && enabledDestinations.some((d) => d.iso === c)) {
          setSelectedCountry(c);
        } else if (!c) {
          setSelectedCountry("SA");
        }
      } catch {
        // ignore in non-browser environments
      }
    };

    readUrlCountry();
    window.addEventListener("popstate", readUrlCountry);
    return () => window.removeEventListener("popstate", readUrlCountry);
  }, [enabledDestinations]);

  // Close dropdown on outside click or Esc
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
      searchInputRef.current?.focus();
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [dropdownOpen]);

  // Destination changer
  const handleCountryChange = (countryIso: string) => {
    const valid = enabledDestinations.find((d) => d.iso === countryIso.toUpperCase());
    const finalIso = valid ? valid.iso : "SA";
    setSelectedCountry(finalIso);
    setDropdownOpen(false);
    setDropdownSearch("");

    try {
      const url = new URL(window.location.href);
      url.searchParams.set("country", finalIso);
      window.history.replaceState({}, "", url.toString());
    } catch {
      router.replace(`?country=${finalIso}`, { scroll: false });
    }
  };

  const currentDestination =
    getDestinationByIso(selectedCountry) || getDestinationByIso("SA") || ESIM_DESTINATIONS[0];
  const isOtherSelected = !currentDestination.featured;

  // Filtered dropdown items
  const filteredDropdownDestinations = useMemo(() => {
    if (!dropdownSearch.trim()) return otherDestinationsWithPlans;
    const query = dropdownSearch.toLowerCase().trim();
    return otherDestinationsWithPlans.filter(
      (d) => d.name.toLowerCase().includes(query) || d.iso.toLowerCase().includes(query)
    );
  }, [otherDestinationsWithPlans, dropdownSearch]);

  // Filter and sort plans for selected country
  const { fixedPlans, unlimitedPlans } = useMemo(() => {
    const fixed: PublicEsimPlan[] = [];
    const unlimited: PublicEsimPlan[] = [];

    for (const plan of plans) {
      if (plan.country_iso !== selectedCountry) {
        continue;
      }

      // Data Size Filter
      if (dataFilter === "1-3") {
        if (plan.is_unlimited || plan.data_gb < 1 || plan.data_gb > 3) continue;
      } else if (dataFilter === "5-10") {
        if (plan.is_unlimited || plan.data_gb < 5 || plan.data_gb > 10) continue;
      } else if (dataFilter === "50") {
        if (plan.is_unlimited || plan.data_gb < 50) continue;
      } else if (dataFilter === "unlimited") {
        if (!plan.is_unlimited) continue;
      }

      // Validity Filter
      if (validityFilter === "1-7") {
        if (plan.validity_days < 1 || plan.validity_days > 7) continue;
      } else if (validityFilter === "15") {
        if (plan.validity_days !== 15) continue;
      } else if (validityFilter === "30") {
        if (plan.validity_days !== 30) continue;
      }

      if (plan.is_unlimited) {
        unlimited.push(plan);
      } else {
        fixed.push(plan);
      }
    }

    const sortFn = (a: PublicEsimPlan, b: PublicEsimPlan) => {
      if (a.validity_days !== b.validity_days) {
        return a.validity_days - b.validity_days;
      }
      return a.sale_price_usd - b.sale_price_usd;
    };

    fixed.sort(sortFn);
    unlimited.sort(sortFn);

    return { fixedPlans: fixed, unlimitedPlans: unlimited };
  }, [plans, selectedCountry, dataFilter, validityFilter]);

  const totalFilteredCount = fixedPlans.length + unlimitedPlans.length;
  const hasActiveFilters = dataFilter !== "all" || validityFilter !== "all";

  const resetFilters = () => {
    setDataFilter("all");
    setValidityFilter("all");
  };

  // Helper to generate the exact WhatsApp prefilled order link
  const getWhatsAppOrderUrl = (plan: PublicEsimPlan) => {
    const destination = currentDestination.name;
    const dataText = plan.is_unlimited ? "Unlimited Data" : `${plan.data_gb} GB`;
    const validityText = `${plan.validity_days}`;
    const priceText = formatEsimPrice(plan.sale_price_usd, currency, rates);
    const planIdText = plan.plan_id;

    const message = `Hi Masaar, I'd like to order this eSIM: ${destination} · ${dataText} · ${validityText} days · ${priceText} (Plan ${planIdText}). My phone: ____`;
    return buildWhatsAppLink(message);
  };

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const toggleFaq = (index: number) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

  const FAQS = [
    {
      q: "How do I order and receive my eSIM?",
      a: "Select your desired destination and plan, then tap 'Order on WhatsApp'. Our team in Dubai will confirm your order details, assist with secure payment, and send your activation QR code and installation guide directly to your WhatsApp.",
    },
    {
      q: "When should I install my eSIM?",
      a: `We recommend installing your eSIM before you travel while connected to home Wi-Fi. Your validity does not begin when you order or install the profile — it only starts counting down when your phone first connects to a supported local network in ${currentDestination.name} after you land.`,
    },
    {
      q: "Can I share my data using Personal Hotspot?",
      a: "Yes, all our prepaid travel data plans support personal hotspot and internet tethering so you can share your connection with family members and companion devices.",
    },
    {
      q: "What is the refund policy?",
      a: "Refundable only until the eSIM is installed. Because digital eSIM profiles are provisioned and activated through telecommunication networks, once an eSIM profile is downloaded and installed on a device, it cannot be refunded or cancelled.",
    },
    {
      q: "Are phone calls and SMS included?",
      a: "These are high-speed, data-only travel eSIMs. Traditional analog cellular calls and SMS numbers are not included, but you can make unlimited calls and messages through WhatsApp, FaceTime, Zoom, and Botim with your active data.",
    },
  ];

  return (
    <div className="w-full bg-[#FAF7F2]">
      {/* ──────────────── 1. HERO SECTION ──────────────── */}
      <section className="relative overflow-hidden border-b border-black/10 bg-[#FAF7F2] py-16 sm:py-20 lg:py-24">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#C9A227]/40 bg-[#C9A227]/10 px-4 py-1 text-xs font-bold tracking-widest uppercase text-[#8F6407]">
              Masaar Connect · Travel eSIM
            </div>

            {/* Headline */}
            <h1
              style={{ textWrap: "balance" }}
              className="mt-5 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-[#0A0A08] sm:text-6xl sm:leading-[1.12]"
            >
              Stay Connected Throughout{" "}
              <span className="text-[#C9A227]">Your Journey</span>
            </h1>

            {/* Subtext */}
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#0A0A08]/75 sm:text-lg">
              Prepaid travel eSIM for Saudi Arabia, UAE and more. High-speed 4G/5G data coverage with
              zero roaming charges. Order via WhatsApp, install before you fly.
            </p>

            {/* Feature Badges */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-[#0A0A08]">
                <WhatsAppIcon className="size-3.5 text-[#25D366]" />
                QR sent by our team on WhatsApp
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-[#0A0A08]">
                <svg className="size-3.5 text-[#C9A227]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
                </svg>
                5G & 4G Coverage
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-[#0A0A08]">
                <svg className="size-3.5 text-[#C9A227]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                </svg>
                Hotspot Supported
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-[#0A0A08]">
                <svg className="size-3.5 text-[#C9A227]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                Activates on Arrival
              </span>
            </div>
          </div>
        </Container>
      </section>

      {/* ──────────────── 2. DESTINATION TABS & BROWSER ──────────────── */}
      <section className="py-12 sm:py-16">
        <Container>
          {/* Destination Selector Tabs & Searchable Select */}
          <div className="flex flex-col items-start justify-between gap-6 border-b border-black/10 pb-8 lg:flex-row lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#8F6407]">
                Select Destination
              </p>
              <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-[#0A0A08] sm:text-3xl">
                Choose Your Destination
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Featured Destination Tabs */}
              <div
                role="tablist"
                aria-label="Featured destinations"
                className="inline-flex rounded-xl bg-black/5 p-1.5"
              >
                {featuredDestinations.map((dest) => {
                  const isSelected = selectedCountry === dest.iso;
                  const count = plans.filter((p) => p.country_iso === dest.iso).length;
                  return (
                    <button
                      key={dest.iso}
                      type="button"
                      role="tab"
                      id={`tab-${dest.iso.toLowerCase()}`}
                      aria-controls="panel-plans"
                      aria-selected={isSelected}
                      onClick={() => handleCountryChange(dest.iso)}
                      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227] ${
                        isSelected
                          ? "bg-[#0A0A08] text-white shadow-sm"
                          : "text-[#0A0A08]/70 hover:text-[#0A0A08]"
                      }`}
                    >
                      <span className="text-base" aria-hidden="true">{dest.flag}</span>
                      <span>{dest.name}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : "bg-black/10 text-[#0A0A08]/60"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Accessible Searchable "More destinations" Select Dropdown */}
              {otherDestinationsWithPlans.length > 0 && (
                <div ref={dropdownRef} className="relative">
                  <button
                    type="button"
                    aria-haspopup="listbox"
                    aria-expanded={dropdownOpen}
                    onClick={() => setDropdownOpen((prev) => !prev)}
                    className={`inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227] ${
                      isOtherSelected
                        ? "border-[#C9A227] bg-[#0A0A08] text-white shadow-sm"
                        : "border-black/15 bg-white text-[#0A0A08]/80 hover:border-black/30 hover:bg-black/5"
                    }`}
                  >
                    {isOtherSelected ? (
                      <>
                        <span className="text-base" aria-hidden="true">{currentDestination.flag}</span>
                        <span>{currentDestination.name}</span>
                        <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs text-white">
                          {plans.filter((p) => p.country_iso === currentDestination.iso).length}
                        </span>
                      </>
                    ) : (
                      <span>More destinations</span>
                    )}
                    <svg
                      className={`size-4 text-current transition-transform duration-200 ${
                        dropdownOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>

                  {/* Popover list */}
                  {dropdownOpen && (
                    <div
                      role="listbox"
                      aria-label="More destinations"
                      className="absolute right-0 top-full z-30 mt-2 w-72 rounded-2xl border border-black/10 bg-white p-3 shadow-xl"
                    >
                      {/* Search input */}
                      <div className="relative mb-2">
                        <input
                          ref={searchInputRef}
                          type="text"
                          value={dropdownSearch}
                          onChange={(e) => setDropdownSearch(e.target.value)}
                          placeholder="Search destination..."
                          className="w-full rounded-lg border border-black/15 bg-[#FAF7F2] px-3 py-2 text-xs font-medium text-[#0A0A08] placeholder:text-[#0A0A08]/40 focus:border-[#C9A227] focus:outline-none focus:ring-1 focus:ring-[#C9A227]"
                        />
                      </div>

                      {/* Destination options */}
                      <div className="max-h-60 overflow-y-auto space-y-1">
                        {filteredDropdownDestinations.length === 0 ? (
                          <p className="p-3 text-center text-xs text-[#0A0A08]/50">
                            No matching destination found.
                          </p>
                        ) : (
                          filteredDropdownDestinations.map((dest) => {
                            const count = plans.filter((p) => p.country_iso === dest.iso).length;
                            const isSelected = selectedCountry === dest.iso;
                            return (
                              <button
                                key={dest.iso}
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                onClick={() => handleCountryChange(dest.iso)}
                                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold transition ${
                                  isSelected
                                    ? "bg-[#C9A227]/20 text-[#8F6407]"
                                    : "text-[#0A0A08] hover:bg-black/5"
                                }`}
                              >
                                <span className="flex items-center gap-2">
                                  <span className="text-sm" aria-hidden="true">{dest.flag}</span>
                                  <span>{dest.name}</span>
                                </span>
                                <span className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] text-[#0A0A08]/60">
                                  {count} {count === 1 ? "plan" : "plans"}
                                </span>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Validity Activation Note Banner */}
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-[#C9A227]/30 bg-[#C9A227]/10 p-4 text-[#8F6407]">
            <svg
              className="mt-0.5 size-5 shrink-0 text-[#C9A227]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <circle cx="12" cy="12" r="10" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-4m0-4h.01" />
            </svg>
            <p className="text-xs sm:text-sm font-medium leading-relaxed">
              <strong className="font-semibold text-[#0A0A08]">
                Good to know:
              </strong>{" "}
              Validity starts when you first connect to a network, not when you buy. You can
              install your profile today, and your days will only count down once you land in{" "}
              <strong className="font-bold text-[#0A0A08]">{currentDestination.name}</strong>.
            </p>
          </div>

          {/* Filter Bar */}
          <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-black/10 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Data Size Filter */}
              <div className="flex items-center gap-2">
                <label
                  htmlFor="filter-data"
                  className="text-xs font-semibold text-[#0A0A08]/70 uppercase tracking-wider"
                >
                  Data Size:
                </label>
                <select
                  id="filter-data"
                  value={dataFilter}
                  onChange={(e) => setDataFilter(e.target.value as DataFilter)}
                  className="rounded-lg border border-black/15 bg-[#FAF7F2] px-3 py-1.5 text-xs font-semibold text-[#0A0A08] transition focus:border-[#C9A227] focus:outline-none focus:ring-1 focus:ring-[#C9A227]"
                >
                  <option value="all">All Sizes</option>
                  <option value="1-3">1 GB - 3 GB</option>
                  <option value="5-10">5 GB - 10 GB</option>
                  <option value="50">50 GB</option>
                  <option value="unlimited">Unlimited Data</option>
                </select>
              </div>

              {/* Validity Filter */}
              <div className="flex items-center gap-2">
                <label
                  htmlFor="filter-validity"
                  className="text-xs font-semibold text-[#0A0A08]/70 uppercase tracking-wider"
                >
                  Validity:
                </label>
                <select
                  id="filter-validity"
                  value={validityFilter}
                  onChange={(e) => setValidityFilter(e.target.value as ValidityFilter)}
                  className="rounded-lg border border-black/15 bg-[#FAF7F2] px-3 py-1.5 text-xs font-semibold text-[#0A0A08] transition focus:border-[#C9A227] focus:outline-none focus:ring-1 focus:ring-[#C9A227]"
                >
                  <option value="all">All Durations</option>
                  <option value="1-7">1 - 7 Days</option>
                  <option value="15">15 Days</option>
                  <option value="30">30 Days</option>
                </select>
              </div>

              {/* Reset button */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs font-semibold text-[#8F6407] hover:underline"
                >
                  Reset filters
                </button>
              )}
            </div>

            {/* Results count indicator */}
            <div className="text-xs font-medium text-[#0A0A08]/60">
              Showing{" "}
              <strong className="text-[#0A0A08]">
                {totalFilteredCount}
              </strong>{" "}
              {totalFilteredCount === 1 ? "plan" : "plans"} for{" "}
              <strong className="text-[#0A0A08]">{currentDestination.name}</strong>
              {totalFilteredCount > 0 && (
                <span className="text-[#0A0A08]/50">
                  {" "}({fixedPlans.length} fixed, {unlimitedPlans.length} unlimited)
                </span>
              )}
            </div>
          </div>

          {/* ──────────────── 3. PLAN CARDS GRID ──────────────── */}
          <div
            id="panel-plans"
            role="tabpanel"
            aria-labelledby={`tab-${selectedCountry.toLowerCase()}`}
            className="mt-8"
          >
            {totalFilteredCount === 0 ? (
              <div className="rounded-2xl border border-black/10 bg-white p-12 text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#FAF7F2] text-[#8F6407]">
                  <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                </div>
                <h3 className="mt-4 font-[family-name:var(--font-display)] text-xl font-bold text-[#0A0A08]">
                  No Plans Match Your Filter
                </h3>
                <p className="mt-2 text-sm text-[#0A0A08]/60">
                  Try adjusting or resetting your data size and validity filters to see all available packages for {currentDestination.name}.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-4 inline-flex items-center justify-center rounded-xl bg-[#C9A227] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#0A0A08] transition hover:bg-[#A87F12] hover:text-white"
                >
                  Show All Plans
                </button>
              </div>
            ) : (
              <div className="space-y-12">
                {/* Group 1: Fixed-GB Data Plans */}
                {fixedPlans.length > 0 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-black/10 pb-3">
                      <div>
                        <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-[#0A0A08] sm:text-2xl">
                          Standard Data Plans
                        </h3>
                        <p className="mt-0.5 text-xs text-[#0A0A08]/60">
                          Preloaded fixed-data packages with high-speed 4G/5G connectivity.
                        </p>
                      </div>
                      <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-[#0A0A08]/70">
                        {fixedPlans.length} {fixedPlans.length === 1 ? "plan" : "plans"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {fixedPlans.map((plan) => {
                        const operators =
                          plan.carriers?.[0]?.operatorList?.map((op) => op.operatorName).join(", ") ||
                          (selectedCountry === "SA"
                            ? "STC, Mobily, Zain"
                            : selectedCountry === "AE"
                            ? "du, e&"
                            : "Local 4G/5G Partners");

                        return (
                          <div
                            key={plan.plan_id}
                            className="group relative flex flex-col justify-between rounded-2xl border border-black/10 bg-white p-6 shadow-sm transition hover:border-[#C9A227] hover:shadow-md"
                          >
                            <div>
                              {/* Top Meta Strip: Network & Hotspot Badges */}
                              <div className="flex items-center justify-between gap-2">
                                <span className="inline-flex items-center gap-1 rounded-md bg-black/5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#0A0A08]/80">
                                  <span className="size-1.5 rounded-full bg-emerald-500" />
                                  {plan.network_type || "4G / 5G"}
                                </span>

                                <div className="flex items-center gap-1.5">
                                  {plan.supports_hotspot && (
                                    <span
                                      title="Personal hotspot supported"
                                      className="inline-flex items-center gap-1 rounded-md bg-[#C9A227]/15 px-2 py-0.5 text-[11px] font-semibold text-[#8F6407]"
                                    >
                                      <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
                                      </svg>
                                      Hotspot
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Plan Capacity & Subtitle Name */}
                              <div className="mt-4">
                                <div className="flex items-baseline justify-between">
                                  <h3 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-[#0A0A08]">
                                    {plan.data_gb} GB
                                  </h3>
                                  <span className="text-sm font-semibold text-[#0A0A08]/60">
                                    {plan.validity_days} {plan.validity_days === 1 ? "Day" : "Days"}
                                  </span>
                                </div>
                                <p className="mt-1 text-xs font-medium text-[#0A0A08]/60">
                                  {plan.name}
                                </p>
                              </div>

                              {/* Key Features List */}
                              <div className="mt-6 space-y-2 border-t border-black/5 pt-4 text-xs text-[#0A0A08]/75">
                                <div className="flex items-center gap-2">
                                  <svg className="size-3.5 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                  </svg>
                                  <span>Local Networks: <strong className="text-[#0A0A08]">{operators}</strong></span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <svg className="size-3.5 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                  </svg>
                                  <span>Valid for {plan.validity_days} days upon arrival</span>
                                </div>
                              </div>
                            </div>

                            {/* Card Footer: Price & WhatsApp Order Button */}
                            <div className="mt-8 border-t border-black/5 pt-5">
                              <div className="mb-4">
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#0A0A08]/50">
                                  Price
                                </span>
                                <div className="font-[family-name:var(--font-display)] text-2xl font-bold text-[#0A0A08]">
                                  {formatEsimPrice(plan.sale_price_usd, currency, rates)}
                                </div>
                              </div>

                              <a
                                href={getWhatsAppOrderUrl(plan)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#C9A227] px-4 py-3 text-sm font-bold text-[#0A0A08] transition hover:bg-[#A87F12] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227]"
                              >
                                <WhatsAppIcon className="size-4.5" />
                                Order on WhatsApp
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Group 2: Unlimited Data Plans */}
                {unlimitedPlans.length > 0 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-black/10 pb-3">
                      <div>
                        <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-[#0A0A08] sm:text-2xl">
                          Unlimited Data Plans
                        </h3>
                        <p className="mt-0.5 text-xs text-[#0A0A08]/60">
                          Continuous data with dedicated daily high-speed quotas.
                        </p>
                      </div>
                      <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-[#0A0A08]/70">
                        {unlimitedPlans.length} {unlimitedPlans.length === 1 ? "plan" : "plans"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {unlimitedPlans.map((plan) => {
                        const isTooltipOpen = openTooltipId === plan.plan_id;
                        const operators =
                          plan.carriers?.[0]?.operatorList?.map((op) => op.operatorName).join(", ") ||
                          (selectedCountry === "SA"
                            ? "STC, Mobily, Zain"
                            : selectedCountry === "AE"
                            ? "du, e&"
                            : "Local 4G/5G Partners");

                        return (
                          <div
                            key={plan.plan_id}
                            className="group relative flex flex-col justify-between rounded-2xl border border-black/10 bg-white p-6 shadow-sm transition hover:border-[#C9A227] hover:shadow-md"
                          >
                            <div>
                              {/* Top Meta Strip: Network & Hotspot Badges */}
                              <div className="flex items-center justify-between gap-2">
                                <span className="inline-flex items-center gap-1 rounded-md bg-black/5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#0A0A08]/80">
                                  <span className="size-1.5 rounded-full bg-emerald-500" />
                                  {plan.network_type || "4G / 5G"}
                                </span>

                                <div className="flex items-center gap-1.5">
                                  {plan.supports_hotspot && (
                                    <span
                                      title="Personal hotspot supported"
                                      className="inline-flex items-center gap-1 rounded-md bg-[#C9A227]/15 px-2 py-0.5 text-[11px] font-semibold text-[#8F6407]"
                                    >
                                      <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
                                      </svg>
                                      Hotspot
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Plan Capacity & Subtitle Name */}
                              <div className="mt-4">
                                <div className="flex items-baseline justify-between">
                                  <h3 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-[#0A0A08]">
                                    Unlimited
                                  </h3>
                                  <span className="text-sm font-semibold text-[#0A0A08]/60">
                                    {plan.validity_days} {plan.validity_days === 1 ? "Day" : "Days"}
                                  </span>
                                </div>
                                <p className="mt-1 text-xs font-medium text-[#0A0A08]/60">
                                  {plan.name}
                                </p>
                              </div>

                              {/* Visible Real Difference Line (Daily High-Speed Quota) */}
                              <div className="mt-3 flex items-start gap-2 rounded-lg border border-[#C9A227]/30 bg-[#C9A227]/10 px-3 py-2 text-xs font-semibold text-[#8F6407]">
                                <svg className="mt-0.5 size-3.5 shrink-0 text-[#C9A227]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
                                </svg>
                                <span className="leading-snug">
                                  {plan.fup_note || "Daily high-speed quota applies, then unlimited at reduced speed"}
                                </span>
                              </div>

                              {/* Unlimited Fair Use Policy Tooltip */}
                              <div className="relative mt-2.5">
                                <div className="flex items-center gap-1.5 text-xs text-[#8F6407]">
                                  <span className="font-medium text-[#0A0A08]/70">Fair use policy</span>
                                  <button
                                    type="button"
                                    aria-label="View fair use policy details"
                                    onClick={() => setOpenTooltipId(isTooltipOpen ? null : plan.plan_id)}
                                    onMouseEnter={() => setOpenTooltipId(plan.plan_id)}
                                    onMouseLeave={() => setOpenTooltipId(null)}
                                    className="inline-flex size-4 items-center justify-center rounded-full bg-[#C9A227]/20 text-[#8F6407] hover:bg-[#C9A227]/30 focus:outline-none"
                                  >
                                    <svg className="size-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                                    </svg>
                                  </button>
                                </div>

                                {isTooltipOpen && (
                                  <div
                                    role="tooltip"
                                    className="absolute left-0 top-full z-20 mt-1.5 w-64 rounded-xl border border-black/10 bg-[#0A0A08] p-3 text-xs leading-relaxed text-white shadow-xl"
                                  >
                                    {plan.fup_note || "Full speed data resets daily, then standard unlimited speed applies until next cycle."}
                                  </div>
                                )}
                              </div>

                              {/* Key Features List */}
                              <div className="mt-6 space-y-2 border-t border-black/5 pt-4 text-xs text-[#0A0A08]/75">
                                <div className="flex items-center gap-2">
                                  <svg className="size-3.5 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                  </svg>
                                  <span>Local Networks: <strong className="text-[#0A0A08]">{operators}</strong></span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <svg className="size-3.5 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                  </svg>
                                  <span>Valid for {plan.validity_days} days upon arrival</span>
                                </div>
                              </div>
                            </div>

                            {/* Card Footer: Price & WhatsApp Order Button */}
                            <div className="mt-8 border-t border-black/5 pt-5">
                              <div className="mb-4">
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#0A0A08]/50">
                                  Price
                                </span>
                                <div className="font-[family-name:var(--font-display)] text-2xl font-bold text-[#0A0A08]">
                                  {formatEsimPrice(plan.sale_price_usd, currency, rates)}
                                </div>
                              </div>

                              <a
                                href={getWhatsAppOrderUrl(plan)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#C9A227] px-4 py-3 text-sm font-bold text-[#0A0A08] transition hover:bg-[#A87F12] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227]"
                              >
                                <WhatsAppIcon className="size-4.5" />
                                Order on WhatsApp
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Container>
      </section>

      {/* ──────────────── 4. HOW IT WORKS ──────────────── */}
      <section className="border-t border-black/10 bg-white py-16 sm:py-20">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-[#8F6407]">
              Simple 3-Step Setup
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold text-[#0A0A08] sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-3 text-sm text-[#0A0A08]/70 sm:text-base">
              Get connected in under two minutes without queues, airport kiosks, or SIM pins.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Step 1 */}
            <div className="relative rounded-2xl border border-black/10 bg-[#FAF7F2] p-6 sm:p-8">
              <span className="font-[family-name:var(--font-display)] text-4xl font-bold text-[#C9A227]">
                01
              </span>
              <h3 className="mt-3 font-[family-name:var(--font-display)] text-xl font-bold text-[#0A0A08]">
                Choose Your Plan
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#0A0A08]/70">
                Select your destination (Saudi Arabia, UAE or more), choose your data allowance and trip duration, and tap Order on WhatsApp.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative rounded-2xl border border-black/10 bg-[#FAF7F2] p-6 sm:p-8">
              <span className="font-[family-name:var(--font-display)] text-4xl font-bold text-[#C9A227]">
                02
              </span>
              <h3 className="mt-3 font-[family-name:var(--font-display)] text-xl font-bold text-[#0A0A08]">
                WhatsApp Confirmation & QR
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#0A0A08]/70">
                Confirm on WhatsApp, pay securely, and receive your QR code with straightforward step-by-step instructions from our team.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative rounded-2xl border border-black/10 bg-[#FAF7F2] p-6 sm:p-8">
              <span className="font-[family-name:var(--font-display)] text-4xl font-bold text-[#C9A227]">
                03
              </span>
              <h3 className="mt-3 font-[family-name:var(--font-display)] text-xl font-bold text-[#0A0A08]">
                Scan & Connect on Arrival
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#0A0A08]/70">
                Scan the QR code in your phone settings while on home Wi-Fi before departure. When your flight lands, your data connects automatically.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* ──────────────── 5. DEVICE COMPATIBILITY NOTE ──────────────── */}
      <section className="border-t border-black/10 bg-[#FAF7F2] py-16 sm:py-20">
        <Container>
          <div className="mx-auto max-w-3xl rounded-3xl border border-black/10 bg-white p-6 sm:p-10 shadow-sm">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#C9A227]/15 text-[#8F6407]">
                <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                </svg>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#8F6407]">
                  Before You Purchase
                </p>
                <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-[#0A0A08] sm:text-3xl">
                  Check Device Compatibility
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-[#0A0A08]/75 sm:text-base">
                  To use an eSIM, your smartphone must support eSIM technology and must be network-unlocked (carrier-free, not locked to a specific mobile provider contract).
                </p>

                <div className="mt-5 rounded-xl border border-black/10 bg-[#FAF7F2] p-4 text-xs sm:text-sm text-[#0A0A08]/80 space-y-2">
                  <p className="font-semibold text-[#0A0A08]">
                    How to verify eSIM hardware support on your phone:
                  </p>
                  <ol className="list-decimal pl-5 space-y-1.5 leading-relaxed">
                    <li>Open your smartphone&apos;s Phone app (dialer keypad).</li>
                    <li>
                      Dial <code className="rounded bg-black/10 px-1.5 py-0.5 font-mono font-bold text-[#0A0A08]">*#06#</code>.
                    </li>
                    <li>
                      Look for an <strong className="text-[#0A0A08]">EID</strong> (Embedded Identity Document) number or barcode on your screen.
                    </li>
                    <li>
                      If an EID number is displayed, your device hardware supports eSIM. Also confirm in phone settings that Carrier Lock shows &quot;No SIM restrictions&quot;.
                    </li>
                  </ol>
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs text-[#8F6407]">
                  <svg className="size-4 shrink-0 text-[#C9A227]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                  </svg>
                  <span>
                    <strong>Important refund note:</strong> Refundable only until the eSIM is installed on a device.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ──────────────── 6. EXPLORE MORE ──────────────── */}
      <CrossLinkServices exclude="esim" />

      {/* ──────────────── 7. FREQUENTLY ASKED QUESTIONS ──────────────── */}
      <section className="border-t border-black/10 bg-white py-16 sm:py-24">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            {/* Flanked gold lines */}
            <div className="flex items-center justify-center gap-3">
              <span className="h-px w-10 bg-[#C9A227]/60" />
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#8F6407]">
                Clear Answers
              </p>
              <span className="h-px w-10 bg-[#C9A227]/60" />
            </div>

            <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold text-[#0A0A08] sm:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[#0A0A08]/70 sm:text-base">
              Everything you need to know about using a travel eSIM for Saudi Arabia, UAE and international destinations.
            </p>
          </div>

          <div className="mx-auto mt-12 max-w-3xl divide-y divide-black/10">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={idx} className="transition-colors">
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    aria-expanded={isOpen}
                    className="group flex w-full items-center justify-between gap-4 py-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227]"
                  >
                    <span className="text-base font-semibold text-[#0A0A08] transition-colors group-hover:text-[#A87F12] sm:text-lg">
                      {faq.q}
                    </span>
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full text-[#A87F12] transition-transform duration-200">
                      {isOpen ? (
                        <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                        </svg>
                      ) : (
                        <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                      )}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="pb-6 pr-6 text-sm leading-relaxed text-[#0A0A08]/75 sm:text-base">
                      <p>{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* WhatsApp Support Assistance Strip */}
          <div className="mx-auto mt-16 max-w-2xl rounded-2xl border border-black/10 bg-[#FAF7F2] p-6 text-center sm:p-8">
            <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-[#0A0A08]">
              Need Help Choosing a Plan?
            </h3>
            <p className="mt-2 text-xs text-[#0A0A08]/70 sm:text-sm">
              Our pilgrimage consultants in Dubai are available on WhatsApp to answer your questions and assist with eSIM setup.
            </p>
            <div className="mt-5">
              <a
                href={buildWhatsAppLink(
                  `Assalamu Alaikum, I have a question about travel eSIM for ${currentDestination.name}.`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-6 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-[#20bd5a]"
              >
                <WhatsAppIcon className="size-4" />
                Chat on WhatsApp
              </a>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
