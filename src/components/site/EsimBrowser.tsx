"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
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
  featuredPlanIds,
} from "@/lib/esim-config";
import type { PublicEsimPlan } from "@/lib/data/esim";

interface EsimBrowserProps {
  plans: PublicEsimPlan[];
  initialCountry?: string;
  initialValidity?: string;
  initialData?: string;
}

type DataFilter = "all" | "1-3" | "5-10" | "50" | "unlimited";
type ValidityFilter = "all" | "1-3" | "7" | "15" | "30" | "15+";
type OsTab = "ios" | "android";

function WhatsAppIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

/**
 * Parses high-speed quota from fup_note for unlimited plans.
 * e.g. "Full speed up to 2 GB per day, then up to 1 Mbps" -> "Unlimited · 2 GB/day high-speed"
 */
function parseUnlimitedHeadline(fupNote: string | null | undefined, dataGb: number): string {
  if (fupNote) {
    const match = fupNote.match(/(\d+(?:\.\d+)?\s*(?:GB|MB))\s*(?:per\s*day|\/day)/i);
    if (match?.[1]) {
      const cleanQuota = match[1].replace(/\s+/g, " ").trim();
      return `Unlimited · ${cleanQuota}/day high-speed`;
    }
  }
  if (dataGb && dataGb > 0) {
    return `Unlimited · ${dataGb} GB/day high-speed`;
  }
  return "Unlimited Data";
}

/**
 * Resolves country code to English country name.
 */
function getCountryNameFromIso(code: string | null | undefined): string {
  if (!code) return "";
  try {
    const dn = new Intl.DisplayNames(["en"], { type: "region" });
    return dn.of(code.toUpperCase()) || code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
}

export function EsimBrowser({
  plans,
  initialCountry = "SA",
  initialValidity,
  initialData,
}: EsimBrowserProps) {
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

  // Client-side plan filters with initial props support
  const [dataFilter, setDataFilter] = useState<DataFilter>(
    (initialData as DataFilter) || "all"
  );
  const [validityFilter, setValidityFilter] = useState<ValidityFilter>(
    (initialValidity as ValidityFilter) || "all"
  );

  // Tooltips & Tabs state
  const [openTooltipId, setOpenTooltipId] = useState<string | null>(null);
  const [openIpTooltipId, setOpenIpTooltipId] = useState<string | null>(null);
  const [activeOsTab, setActiveOsTab] = useState<OsTab>("ios");

  // Sync with browser URL / history
  useEffect(() => {
    const readUrlState = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const c = params.get("country")?.toUpperCase()?.trim();
        if (c && enabledDestinations.some((d) => d.iso === c)) {
          setSelectedCountry(c);
        } else if (!c) {
          setSelectedCountry("SA");
        }

        const v = params.get("validity")?.trim();
        if (v && ["all", "1-3", "7", "15", "30", "15+"].includes(v)) {
          setValidityFilter(v as ValidityFilter);
        }

        const d = params.get("data")?.trim();
        if (d && ["all", "1-3", "5-10", "50", "unlimited"].includes(d)) {
          setDataFilter(d as DataFilter);
        }
      } catch {
        // ignore in non-browser environments
      }
    };

    readUrlState();
    window.addEventListener("popstate", readUrlState);
    return () => window.removeEventListener("popstate", readUrlState);
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

  // URL state synchronizer
  const updateUrlParams = (newCountry?: string, newValidity?: string, newData?: string) => {
    try {
      const url = new URL(window.location.href);
      if (newCountry !== undefined) {
        if (newCountry && newCountry !== "SA") {
          url.searchParams.set("country", newCountry);
        } else {
          url.searchParams.delete("country");
        }
      }
      if (newValidity !== undefined) {
        if (newValidity && newValidity !== "all") {
          url.searchParams.set("validity", newValidity);
        } else {
          url.searchParams.delete("validity");
        }
      }
      if (newData !== undefined) {
        if (newData && newData !== "all") {
          url.searchParams.set("data", newData);
        } else {
          url.searchParams.delete("data");
        }
      }
      window.history.replaceState({}, "", url.toString());
    } catch {
      // non-blocking fallback
    }
  };

  // Destination changer
  const handleCountryChange = (countryIso: string) => {
    const valid = enabledDestinations.find((d) => d.iso === countryIso.toUpperCase());
    const finalIso = valid ? valid.iso : "SA";
    setSelectedCountry(finalIso);
    setDropdownOpen(false);
    setDropdownSearch("");
    updateUrlParams(finalIso, validityFilter, dataFilter);
  };

  const handleValidityChange = (val: ValidityFilter) => {
    setValidityFilter(val);
    updateUrlParams(selectedCountry, val, dataFilter);
  };

  const handleDataChange = (val: DataFilter) => {
    setDataFilter(val);
    updateUrlParams(selectedCountry, validityFilter, val);
  };

  const handleTripHelperSelect = (val: ValidityFilter) => {
    handleValidityChange(val);
    const plansEl = document.getElementById("plans");
    if (plansEl) {
      plansEl.scrollIntoView({ behavior: "smooth" });
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
      if (validityFilter === "1-3") {
        if (plan.validity_days < 1 || plan.validity_days > 3) continue;
      } else if (validityFilter === "7") {
        if (plan.validity_days !== 7) continue;
      } else if (validityFilter === "15") {
        if (plan.validity_days !== 15) continue;
      } else if (validityFilter === "30") {
        if (plan.validity_days !== 30) continue;
      } else if (validityFilter === "15+") {
        if (plan.validity_days < 15) continue;
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
    handleDataChange("all");
    handleValidityChange("all");
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
      a: "Refundable only until the eSIM is installed on a device. Because digital eSIM profiles are provisioned and activated through telecommunication networks, once an eSIM profile is downloaded and installed on a smartphone, it cannot be refunded or cancelled.",
    },
    {
      q: "Are phone calls and SMS included?",
      a: "These are high-speed, data-only travel eSIMs. Traditional analog cellular calls and SMS numbers are not included, but you can make unlimited calls and messages through WhatsApp, FaceTime, Zoom, and VoIP apps over your active data connection.",
    },
    {
      q: "Will my banking apps or streaming work?",
      a: "Because travel eSIM data routes through international partner networks (as shown on each plan's 'Data exits via' detail), certain regional banking apps or local streaming services may detect an overseas IP location. While standard browsing, navigation, social media, and communication apps work normally, access to specific location-restricted banking or media platforms is not guaranteed.",
    },
    {
      q: "Do I need to be in Saudi Arabia to install?",
      a: "No, you do not need to be in Saudi Arabia to install the eSIM. We recommend installing it while connected to your home Wi-Fi before traveling. Your plan's validity will not begin until your device makes its first connection to a supported network after arriving at your destination.",
    },
    {
      q: "Can I keep my normal number for calls?",
      a: "Yes. Your primary physical SIM card or existing mobile line remains active alongside your travel eSIM. You can continue receiving calls, SMS messages, and bank security verification codes on your original phone number, while using the travel eSIM exclusively for mobile internet data.",
    },
    {
      q: "What if my phone isn't compatible?",
      a: "You can quickly check whether your phone hardware supports eSIM by dialing *#06# on your device keypad; if an EID number appears on your screen, your phone has eSIM hardware. Also check your phone settings to confirm the device is carrier-unlocked ('No SIM restrictions'). If you have any doubts about compatibility, feel free to ask our team on WhatsApp before ordering and we will gladly check for you.",
    },
  ];

  // FAQPage JSON-LD Structured Data
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };

  return (
    <div className="w-full bg-[#FAF7F2]">
      {/* FAQPage JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* ──────────────── 1. HERO SECTION ──────────────── */}
      <section className="relative overflow-hidden border-b border-black/10 bg-[#FAF7F2] py-14 sm:py-20 lg:py-24">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#C9A227]/40 bg-[#C9A227]/10 px-4 py-1 text-xs font-bold tracking-widest uppercase text-[#8F6407]">
              Masaar Connect · Travel eSIM
            </div>

            {/* Headline - Single H1 on page */}
            <h1
              style={{ textWrap: "balance" }}
              className="mt-5 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-[#0A0A08] sm:text-5xl lg:text-6xl sm:leading-[1.12]"
            >
              Saudi Arabia eSIM for{" "}
              <span className="text-[#C9A227]">Umrah and Hajj</span> Travellers
            </h1>

            {/* Subtext */}
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#0A0A08]/75 sm:text-lg">
              Prepaid travel data with zero roaming charges. High-speed 4G/5G mobile connectivity across
              Saudi Arabia and the GCC. Order on WhatsApp, install before you fly.
            </p>

            {/* Feature Badges */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-[#0A0A08]">
                <WhatsAppIcon className="size-3.5 text-[#25D366]" />
                QR sent by our team on WhatsApp
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-[#0A0A08]">
                <svg className="size-3.5 text-[#C9A227]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
                </svg>
                5G & 4G Local Coverage
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-[#0A0A08]">
                <svg className="size-3.5 text-[#C9A227]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                </svg>
                Hotspot Supported
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-[#0A0A08]">
                <svg className="size-3.5 text-[#C9A227]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                Activates on Arrival
              </span>
            </div>
          </div>
        </Container>
      </section>

      {/* ──────────────── 2a. WHAT'S INCLUDED / WHAT'S NOT ──────────────── */}
      <section className="border-b border-black/10 bg-white py-14 sm:py-16">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-[#8F6407]">
              Transparent Coverage
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-[#0A0A08] sm:text-3xl">
              What&apos;s Included & What&apos;s Not
            </h2>
            <p className="mt-2 text-sm text-[#0A0A08]/70">
              Clear, upfront details so you know exactly what to expect from your travel eSIM plan.
            </p>
          </div>

          <div className="mx-auto mt-10 grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Column 1: Included */}
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-50/40 p-6 sm:p-8">
              <div className="flex items-center gap-2.5 border-b border-emerald-500/15 pb-4">
                <span className="flex size-7 items-center justify-center rounded-full bg-emerald-600 text-white">
                  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </span>
                <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-emerald-950 sm:text-xl">
                  What&apos;s Included
                </h3>
              </div>

              <ul className="mt-5 space-y-4 text-xs sm:text-sm text-emerald-950/85">
                <li className="flex items-start gap-3">
                  <svg className="mt-0.5 size-4 shrink-0 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  <div>
                    <strong className="font-semibold text-emerald-950">Data on local networks:</strong> High-speed 4G/5G mobile internet connectivity through local carrier partner infrastructure.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-0.5 size-4 shrink-0 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  <div>
                    <strong className="font-semibold text-emerald-950">QR delivered on WhatsApp:</strong> Your activation QR code profile and installation guide sent directly to your WhatsApp by our team.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-0.5 size-4 shrink-0 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  <div>
                    <strong className="font-semibold text-emerald-950">Personal hotspot sharing:</strong> Mobile hotspot tethering is supported on all data plans to share connection with companion devices.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-0.5 size-4 shrink-0 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  <div>
                    <strong className="font-semibold text-emerald-950">Validity starts on connection:</strong> Your plan days only start counting down when you connect to a supported network at your destination.
                  </div>
                </li>
              </ul>
            </div>

            {/* Column 2: Not Included */}
            <div className="rounded-2xl border border-black/10 bg-[#FAF7F2] p-6 sm:p-8">
              <div className="flex items-center gap-2.5 border-b border-black/10 pb-4">
                <span className="flex size-7 items-center justify-center rounded-full bg-black/10 text-[#0A0A08]/70">
                  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </span>
                <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-[#0A0A08] sm:text-xl">
                  What&apos;s Not Included
                </h3>
              </div>

              <ul className="mt-5 space-y-4 text-xs sm:text-sm text-[#0A0A08]/75">
                <li className="flex items-start gap-3">
                  <svg className="mt-0.5 size-4 shrink-0 text-red-500/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                  <div>
                    <strong className="font-semibold text-[#0A0A08]">No phone number:</strong> These are dedicated data-only plans; no local cellular telephone number is assigned.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-0.5 size-4 shrink-0 text-red-500/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                  <div>
                    <strong className="font-semibold text-[#0A0A08]">No calls or SMS:</strong> Traditional cellular calls and SMS texts are not supported (WhatsApp, FaceTime, and VoIP apps work over data).
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-0.5 size-4 shrink-0 text-red-500/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                  <div>
                    <strong className="font-semibold text-[#0A0A08]">No top-ups at launch:</strong> Plans cannot be topped up; if additional data is needed, a new eSIM profile can be purchased.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-0.5 size-4 shrink-0 text-red-500/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                  <div>
                    <strong className="font-semibold text-[#0A0A08]">No refunds after installation:</strong> Digital profiles are refundable only until installed on a smartphone device.
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </Container>
      </section>

      {/* ──────────────── 2b. TRIP DURATION HELPER ──────────────── */}
      <section className="border-b border-black/10 bg-[#FAF7F2] py-14 sm:py-16">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-[#8F6407]">
              Trip Duration Helper
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-[#0A0A08] sm:text-3xl">
              Which Plan Fits Your Trip?
            </h2>
            <p className="mt-2 text-sm text-[#0A0A08]/70">
              Select your expected trip duration to quickly filter matching packages below.
            </p>
          </div>

          <div className="mx-auto mt-10 grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
            {/* Card 1: 1-3 Days */}
            <div className="relative flex flex-col justify-between rounded-2xl border border-black/10 bg-white p-6 shadow-sm transition hover:border-[#C9A227] hover:shadow-md">
              <div>
                <span className="inline-block rounded-md bg-black/5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#0A0A08]/80">
                  1 – 3 Days
                </span>
                <h3 className="mt-3 font-[family-name:var(--font-display)] text-lg font-bold text-[#0A0A08]">
                  Short Stay
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-[#0A0A08]/70">
                  Ideal for quick airport layovers, business stopovers, or brief weekend visits.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleTripHelperSelect("1-3")}
                className="mt-6 inline-flex items-center justify-center gap-1.5 rounded-xl border border-black/15 bg-[#FAF7F2] px-3.5 py-2.5 text-xs font-bold text-[#0A0A08] transition hover:border-[#C9A227] hover:bg-[#C9A227] hover:text-[#0A0A08] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227]"
              >
                View 1–3 Day Plans
                <span aria-hidden="true">&rarr;</span>
              </button>
            </div>

            {/* Card 2: 7 Days (Popular) */}
            <div className="relative flex flex-col justify-between rounded-2xl border-2 border-[#C9A227] bg-white p-6 shadow-md">
              <div className="absolute -top-3 right-4 rounded-full bg-[#C9A227] px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#0A0A08] shadow-sm">
                Most Popular
              </div>
              <div>
                <span className="inline-block rounded-md bg-[#C9A227]/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#8F6407]">
                  7 Days
                </span>
                <h3 className="mt-3 font-[family-name:var(--font-display)] text-lg font-bold text-[#0A0A08]">
                  A Typical Umrah Week
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-[#0A0A08]/70">
                  Standard one-week pilgrimage duration for Makkah and Madinah hotel stays.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleTripHelperSelect("7")}
                className="mt-6 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#C9A227] px-3.5 py-2.5 text-xs font-bold text-[#0A0A08] transition hover:bg-[#A87F12] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227]"
              >
                View 7-Day Plans
                <span aria-hidden="true">&rarr;</span>
              </button>
            </div>

            {/* Card 3: 2+ Weeks */}
            <div className="relative flex flex-col justify-between rounded-2xl border border-black/10 bg-white p-6 shadow-sm transition hover:border-[#C9A227] hover:shadow-md">
              <div>
                <span className="inline-block rounded-md bg-black/5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#0A0A08]/80">
                  15 – 30 Days
                </span>
                <h3 className="mt-3 font-[family-name:var(--font-display)] text-lg font-bold text-[#0A0A08]">
                  2+ Weeks
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-[#0A0A08]/70">
                  Designed for extended pilgrimages, multi-week travel itineraries, and long stays.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleTripHelperSelect("15+")}
                className="mt-6 inline-flex items-center justify-center gap-1.5 rounded-xl border border-black/15 bg-[#FAF7F2] px-3.5 py-2.5 text-xs font-bold text-[#0A0A08] transition hover:border-[#C9A227] hover:bg-[#C9A227] hover:text-[#0A0A08] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227]"
              >
                View 15–30 Day Plans
                <span aria-hidden="true">&rarr;</span>
              </button>
            </div>
          </div>
        </Container>
      </section>

      {/* ──────────────── 2. DESTINATION TABS & BROWSER GRID ──────────────── */}
      <section id="plans" className="scroll-mt-8 py-12 sm:py-16">
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
                      aria-hidden="true"
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
              aria-hidden="true"
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
                  className="text-xs font-semibold uppercase tracking-wider text-[#0A0A08]/70"
                >
                  Data Size:
                </label>
                <select
                  id="filter-data"
                  value={dataFilter}
                  onChange={(e) => handleDataChange(e.target.value as DataFilter)}
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
                  className="text-xs font-semibold uppercase tracking-wider text-[#0A0A08]/70"
                >
                  Validity:
                </label>
                <select
                  id="filter-validity"
                  value={validityFilter}
                  onChange={(e) => handleValidityChange(e.target.value as ValidityFilter)}
                  className="rounded-lg border border-black/15 bg-[#FAF7F2] px-3 py-1.5 text-xs font-semibold text-[#0A0A08] transition focus:border-[#C9A227] focus:outline-none focus:ring-1 focus:ring-[#C9A227]"
                >
                  <option value="all">All Durations</option>
                  <option value="1-3">1 - 3 Days</option>
                  <option value="7">7 Days (1 Week)</option>
                  <option value="15">15 Days</option>
                  <option value="30">30 Days</option>
                  <option value="15+">15 - 30 Days (2+ Weeks)</option>
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

          {/* ──────────────── PLAN CARDS GRID ──────────────── */}
          <div
            id="panel-plans"
            role="tabpanel"
            aria-labelledby={`tab-${selectedCountry.toLowerCase()}`}
            className="mt-8"
          >
            {totalFilteredCount === 0 ? (
              <div className="rounded-2xl border border-black/10 bg-white p-12 text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#FAF7F2] text-[#8F6407]">
                  <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
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
                        const isPopular = featuredPlanIds.includes(plan.plan_id);
                        const isIpTooltipOpen = openIpTooltipId === plan.plan_id;
                        const operators =
                          plan.carriers?.[0]?.operatorList?.map((op) => op.operatorName).filter(Boolean).join(", ") ||
                          "Local Partner Networks";

                        return (
                          <div
                            key={plan.plan_id}
                            className={`group relative flex flex-col justify-between rounded-2xl border bg-white p-6 shadow-sm transition hover:shadow-md ${
                              isPopular ? "border-[#C9A227] ring-1 ring-[#C9A227]/40" : "border-black/10 hover:border-[#C9A227]"
                            }`}
                          >
                            <div>
                              {/* Top Meta Strip: Network, Hotspot & Popular Badges */}
                              <div className="flex items-center justify-between gap-2">
                                <span className="inline-flex items-center gap-1 rounded-md bg-black/5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#0A0A08]/80">
                                  <span className="size-1.5 rounded-full bg-emerald-500" />
                                  {plan.network_type || "4G / 5G"}
                                </span>

                                <div className="flex items-center gap-1.5">
                                  {isPopular && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-[#C9A227] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#0A0A08] shadow-xs">
                                      Popular
                                    </span>
                                  )}
                                  {plan.supports_hotspot && (
                                    <span
                                      title="Personal hotspot supported"
                                      className="inline-flex items-center gap-1 rounded-md bg-[#C9A227]/15 px-2 py-0.5 text-[11px] font-semibold text-[#8F6407]"
                                    >
                                      <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
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
                                  <h4 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-[#0A0A08]">
                                    {plan.data_gb} GB
                                  </h4>
                                  <span className="text-sm font-semibold text-[#0A0A08]/60">
                                    {plan.validity_days} {plan.validity_days === 1 ? "Day" : "Days"}
                                  </span>
                                </div>
                                <p className="mt-1 text-xs font-medium text-[#0A0A08]/60">
                                  {plan.name}
                                </p>
                              </div>

                              {/* IP Export detail line if not null */}
                              {plan.ip_export && (
                                <div className="relative mt-3 flex items-center gap-1.5 text-xs text-[#0A0A08]/70">
                                  <span>
                                    Data exits via:{" "}
                                    <strong className="text-[#0A0A08]">
                                      {getCountryNameFromIso(plan.ip_export)}
                                    </strong>
                                  </span>
                                  <button
                                    type="button"
                                    aria-label="View data exit country notice"
                                    onClick={() => setOpenIpTooltipId(isIpTooltipOpen ? null : plan.plan_id)}
                                    onMouseEnter={() => setOpenIpTooltipId(plan.plan_id)}
                                    onMouseLeave={() => setOpenIpTooltipId(null)}
                                    className="inline-flex size-4 items-center justify-center rounded-full bg-black/5 text-[#0A0A08]/60 hover:bg-black/10 focus:outline-none"
                                  >
                                    <svg className="size-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                                    </svg>
                                  </button>
                                  {isIpTooltipOpen && (
                                    <div
                                      role="tooltip"
                                      className="absolute left-0 bottom-full z-20 mb-2 w-64 rounded-xl border border-black/10 bg-[#0A0A08] p-3 text-xs leading-relaxed text-white shadow-xl"
                                    >
                                      Websites and apps may treat you as being in this country.
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Key Features List */}
                              <div className="mt-5 space-y-2 border-t border-black/5 pt-4 text-xs text-[#0A0A08]/75">
                                <div className="flex items-center gap-2">
                                  <svg className="size-3.5 shrink-0 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                  </svg>
                                  <span>Local Networks: <strong className="text-[#0A0A08]">{operators}</strong></span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <svg className="size-3.5 shrink-0 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
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
                        const isPopular = featuredPlanIds.includes(plan.plan_id);
                        const isTooltipOpen = openTooltipId === plan.plan_id;
                        const isIpTooltipOpen = openIpTooltipId === plan.plan_id;
                        const operators =
                          plan.carriers?.[0]?.operatorList?.map((op) => op.operatorName).filter(Boolean).join(", ") ||
                          "Local Partner Networks";

                        return (
                          <div
                            key={plan.plan_id}
                            className={`group relative flex flex-col justify-between rounded-2xl border bg-white p-6 shadow-sm transition hover:shadow-md ${
                              isPopular ? "border-[#C9A227] ring-1 ring-[#C9A227]/40" : "border-black/10 hover:border-[#C9A227]"
                            }`}
                          >
                            <div>
                              {/* Top Meta Strip: Network, Hotspot & Popular Badges */}
                              <div className="flex items-center justify-between gap-2">
                                <span className="inline-flex items-center gap-1 rounded-md bg-black/5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#0A0A08]/80">
                                  <span className="size-1.5 rounded-full bg-emerald-500" />
                                  {plan.network_type || "4G / 5G"}
                                </span>

                                <div className="flex items-center gap-1.5">
                                  {isPopular && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-[#C9A227] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#0A0A08] shadow-xs">
                                      Popular
                                    </span>
                                  )}
                                  {plan.supports_hotspot && (
                                    <span
                                      title="Personal hotspot supported"
                                      className="inline-flex items-center gap-1 rounded-md bg-[#C9A227]/15 px-2 py-0.5 text-[11px] font-semibold text-[#8F6407]"
                                    >
                                      <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
                                      </svg>
                                      Hotspot
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Headline Detail: High-speed quota parsed from fup_note */}
                              <div className="mt-4">
                                <div className="flex items-baseline justify-between gap-2">
                                  <h4 className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-[#0A0A08] sm:text-2xl">
                                    {parseUnlimitedHeadline(plan.fup_note, plan.data_gb)}
                                  </h4>
                                  <span className="shrink-0 text-sm font-semibold text-[#0A0A08]/60">
                                    {plan.validity_days} {plan.validity_days === 1 ? "Day" : "Days"}
                                  </span>
                                </div>
                                <p className="mt-1 text-xs font-medium text-[#0A0A08]/60">
                                  {plan.name}
                                </p>
                              </div>

                              {/* Daily Quota Summary Box */}
                              <div className="mt-3 flex items-start gap-2 rounded-lg border border-[#C9A227]/30 bg-[#C9A227]/10 px-3 py-2 text-xs font-semibold text-[#8F6407]">
                                <svg className="mt-0.5 size-3.5 shrink-0 text-[#C9A227]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
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
                                    <svg className="size-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} aria-hidden="true">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                                    </svg>
                                  </button>
                                </div>

                                {isTooltipOpen && (
                                  <div
                                    role="tooltip"
                                    className="absolute left-0 bottom-full z-20 mb-2 w-64 rounded-xl border border-black/10 bg-[#0A0A08] p-3 text-xs leading-relaxed text-white shadow-xl"
                                  >
                                    {plan.fup_note || "Full speed data resets daily, then standard unlimited speed applies until next cycle."}
                                  </div>
                                )}
                              </div>

                              {/* IP Export detail line if not null */}
                              {plan.ip_export && (
                                <div className="relative mt-2 flex items-center gap-1.5 text-xs text-[#0A0A08]/70">
                                  <span>
                                    Data exits via:{" "}
                                    <strong className="text-[#0A0A08]">
                                      {getCountryNameFromIso(plan.ip_export)}
                                    </strong>
                                  </span>
                                  <button
                                    type="button"
                                    aria-label="View data exit country notice"
                                    onClick={() => setOpenIpTooltipId(isIpTooltipOpen ? null : plan.plan_id)}
                                    onMouseEnter={() => setOpenIpTooltipId(plan.plan_id)}
                                    onMouseLeave={() => setOpenIpTooltipId(null)}
                                    className="inline-flex size-4 items-center justify-center rounded-full bg-black/5 text-[#0A0A08]/60 hover:bg-black/10 focus:outline-none"
                                  >
                                    <svg className="size-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                                    </svg>
                                  </button>
                                  {isIpTooltipOpen && (
                                    <div
                                      role="tooltip"
                                      className="absolute left-0 bottom-full z-20 mb-2 w-64 rounded-xl border border-black/10 bg-[#0A0A08] p-3 text-xs leading-relaxed text-white shadow-xl"
                                    >
                                      Websites and apps may treat you as being in this country.
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Key Features List */}
                              <div className="mt-5 space-y-2 border-t border-black/5 pt-4 text-xs text-[#0A0A08]/75">
                                <div className="flex items-center gap-2">
                                  <svg className="size-3.5 shrink-0 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                  </svg>
                                  <span>Local Networks: <strong className="text-[#0A0A08]">{operators}</strong></span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <svg className="size-3.5 shrink-0 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
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

      {/* ──────────────── 2c. COMPARISON TABLE ──────────────── */}
      <section className="border-t border-black/10 bg-white py-16 sm:py-20">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-[#8F6407]">
              Side-by-Side Comparison
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-[#0A0A08] sm:text-3xl">
              eSIM vs Roaming vs Airport SIM
            </h2>
            <p className="mt-2 text-sm text-[#0A0A08]/70">
              How prepaid digital travel eSIMs compare to traditional mobile roaming and physical airport kiosks.
            </p>
          </div>

          <div className="mt-10 overflow-x-auto rounded-2xl border border-black/10 bg-white shadow-sm">
            <table className="w-full min-w-[640px] text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-black/10 bg-[#FAF7F2]">
                  <th scope="col" className="p-4 font-semibold text-[#0A0A08]/70 sm:p-5">
                    Comparison Feature
                  </th>
                  <th scope="col" className="bg-[#C9A227]/10 p-4 font-bold text-[#8F6407] sm:p-5">
                    Masaar Travel eSIM
                  </th>
                  <th scope="col" className="p-4 font-semibold text-[#0A0A08]/70 sm:p-5">
                    International Roaming
                  </th>
                  <th scope="col" className="p-4 font-semibold text-[#0A0A08]/70 sm:p-5">
                    Airport Physical SIM
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 text-[#0A0A08]/80">
                <tr>
                  <td className="p-4 font-semibold text-[#0A0A08] sm:p-5">
                    Setup before you fly
                  </td>
                  <td className="bg-[#C9A227]/5 p-4 font-medium text-emerald-800 sm:p-5">
                    ✓ Yes — install on Wi-Fi at home, ready upon arrival
                  </td>
                  <td className="p-4 sm:p-5">
                    Requires activating roaming bundles with home carrier
                  </td>
                  <td className="p-4 sm:p-5">
                    No — must queue at airport counters after landing
                  </td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-[#0A0A08] sm:p-5">
                    Physical SIM card swap
                  </td>
                  <td className="bg-[#C9A227]/5 p-4 font-medium text-emerald-800 sm:p-5">
                    ✓ None — 100% digital download via QR code
                  </td>
                  <td className="p-4 sm:p-5">
                    None — uses your existing home SIM card
                  </td>
                  <td className="p-4 sm:p-5">
                    Must eject home SIM and safely store small plastic chip
                  </td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-[#0A0A08] sm:p-5">
                    Keep normal number active
                  </td>
                  <td className="bg-[#C9A227]/5 p-4 font-medium text-emerald-800 sm:p-5">
                    ✓ Yes — primary SIM stays active for calls, SMS & bank OTPs
                  </td>
                  <td className="p-4 sm:p-5">
                    Yes — but calls/SMS may incur high roaming charges
                  </td>
                  <td className="p-4 sm:p-5">
                    No — home SIM removed; cannot receive personal SMS or bank OTPs
                  </td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-[#0A0A08] sm:p-5">
                    Cost clarity
                  </td>
                  <td className="bg-[#C9A227]/5 p-4 font-medium text-emerald-800 sm:p-5">
                    ✓ Fixed prepaid price — zero unexpected bill surprises
                  </td>
                  <td className="p-4 sm:p-5">
                    Unpredictable rates; accidental background data can be costly
                  </td>
                  <td className="p-4 sm:p-5">
                    Airport counter pricing varies by vendor and exchange rate
                  </td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-[#0A0A08] sm:p-5">
                    Hotspot tethering
                  </td>
                  <td className="bg-[#C9A227]/5 p-4 font-medium text-emerald-800 sm:p-5">
                    ✓ Supported — share data with family devices
                  </td>
                  <td className="p-4 sm:p-5">
                    Often restricted or throttled by home telecom plans
                  </td>
                  <td className="p-4 sm:p-5">
                    Subject to specific airport package terms
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Container>
      </section>

      {/* ──────────────── 2d. INSTALL IN 4 STEPS ──────────────── */}
      <section className="border-t border-black/10 bg-[#FAF7F2] py-16 sm:py-20">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-[#8F6407]">
              Quick Setup
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-[#0A0A08] sm:text-3xl">
              Install in 4 Simple Steps
            </h2>
            <p className="mt-2 text-sm text-[#0A0A08]/70">
              Install while connected to home or hotel Wi-Fi before traveling. Your data activates automatically upon landing.
            </p>

            {/* Platform Selector Tabs */}
            <div className="mt-8 inline-flex rounded-xl bg-black/5 p-1.5" role="tablist" aria-label="Device OS instructions">
              <button
                type="button"
                role="tab"
                id="tab-ios"
                aria-selected={activeOsTab === "ios"}
                aria-controls="panel-installation"
                onClick={() => setActiveOsTab("ios")}
                className={`rounded-lg px-5 py-2 text-xs font-bold uppercase tracking-wider transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227] ${
                  activeOsTab === "ios"
                    ? "bg-[#0A0A08] text-white shadow-sm"
                    : "text-[#0A0A08]/70 hover:text-[#0A0A08]"
                }`}
              >
                Apple iPhone (iOS)
              </button>
              <button
                type="button"
                role="tab"
                id="tab-android"
                aria-selected={activeOsTab === "android"}
                aria-controls="panel-installation"
                onClick={() => setActiveOsTab("android")}
                className={`rounded-lg px-5 py-2 text-xs font-bold uppercase tracking-wider transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227] ${
                  activeOsTab === "android"
                    ? "bg-[#0A0A08] text-white shadow-sm"
                    : "text-[#0A0A08]/70 hover:text-[#0A0A08]"
                }`}
              >
                Android (Samsung, Pixel, etc.)
              </button>
            </div>
          </div>

          <div id="panel-installation" role="tabpanel" aria-labelledby={`tab-${activeOsTab}`} className="mx-auto mt-10 max-w-4xl">
            {/* Step cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {activeOsTab === "ios" ? (
                <>
                  {/* Step 1 */}
                  <div className="rounded-2xl border border-black/10 bg-white p-5 sm:p-6 shadow-xs">
                    <span className="font-[family-name:var(--font-display)] text-3xl font-bold text-[#C9A227]">01</span>
                    <h3 className="mt-2 text-base font-bold text-[#0A0A08]">Connect to Wi-Fi</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#0A0A08]/70">
                      Connect your iPhone to a stable home or hotel Wi-Fi network before departing.
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div className="rounded-2xl border border-black/10 bg-white p-5 sm:p-6 shadow-xs">
                    <span className="font-[family-name:var(--font-display)] text-3xl font-bold text-[#C9A227]">02</span>
                    <h3 className="mt-2 text-base font-bold text-[#0A0A08]">Open Mobile Service</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#0A0A08]/70">
                      Go to <strong className="text-[#0A0A08]">Settings &gt; Mobile Service</strong> (or Cellular) and tap <strong className="text-[#0A0A08]">Add eSIM</strong>.
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div className="rounded-2xl border border-black/10 bg-white p-5 sm:p-6 shadow-xs">
                    <span className="font-[family-name:var(--font-display)] text-3xl font-bold text-[#C9A227]">03</span>
                    <h3 className="mt-2 text-base font-bold text-[#0A0A08]">Scan QR Code</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#0A0A08]/70">
                      Tap <strong className="text-[#0A0A08]">Use QR Code</strong> and scan the QR code received on WhatsApp from our team.
                    </p>
                  </div>

                  {/* Step 4 */}
                  <div className="rounded-2xl border border-black/10 bg-white p-5 sm:p-6 shadow-xs">
                    <span className="font-[family-name:var(--font-display)] text-3xl font-bold text-[#C9A227]">04</span>
                    <h3 className="mt-2 text-base font-bold text-[#0A0A08]">Enable on Arrival</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#0A0A08]/70">
                      Upon arrival, select the eSIM line for cellular data and ensure <strong className="text-[#0A0A08]">Data Roaming</strong> is ON.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  {/* Step 1 */}
                  <div className="rounded-2xl border border-black/10 bg-white p-5 sm:p-6 shadow-xs">
                    <span className="font-[family-name:var(--font-display)] text-3xl font-bold text-[#C9A227]">01</span>
                    <h3 className="mt-2 text-base font-bold text-[#0A0A08]">Connect to Wi-Fi</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#0A0A08]/70">
                      Connect your Android smartphone to a stable Wi-Fi network before setting up.
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div className="rounded-2xl border border-black/10 bg-white p-5 sm:p-6 shadow-xs">
                    <span className="font-[family-name:var(--font-display)] text-3xl font-bold text-[#C9A227]">02</span>
                    <h3 className="mt-2 text-base font-bold text-[#0A0A08]">Navigate to SIMs</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#0A0A08]/70">
                      Go to <strong className="text-[#0A0A08]">Settings &gt; Network & internet &gt; SIMs</strong> and tap <strong className="text-[#0A0A08]">Add eSIM</strong>.
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div className="rounded-2xl border border-black/10 bg-white p-5 sm:p-6 shadow-xs">
                    <span className="font-[family-name:var(--font-display)] text-3xl font-bold text-[#C9A227]">03</span>
                    <h3 className="mt-2 text-base font-bold text-[#0A0A08]">Scan QR Code</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#0A0A08]/70">
                      Point camera at the WhatsApp QR code, or enter the activation code manually.
                    </p>
                  </div>

                  {/* Step 4 */}
                  <div className="rounded-2xl border border-black/10 bg-white p-5 sm:p-6 shadow-xs">
                    <span className="font-[family-name:var(--font-display)] text-3xl font-bold text-[#C9A227]">04</span>
                    <h3 className="mt-2 text-base font-bold text-[#0A0A08]">Enable on Arrival</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#0A0A08]/70">
                      On landing, switch mobile data to the eSIM and turn <strong className="text-[#0A0A08]">Data Roaming</strong> ON for this line.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Checklist & Notice Box */}
            <div className="mt-8 rounded-2xl border border-black/10 bg-white p-5 text-xs text-[#0A0A08]/80 sm:p-6 space-y-2">
              <p className="font-semibold text-[#0A0A08]">
                Installation Checklist:
              </p>
              <ul className="list-disc pl-5 space-y-1 leading-relaxed">
                <li>Install on Wi-Fi prior to boarding your flight.</li>
                <li>Keep the QR code and LPA activation code safe in your WhatsApp conversation.</li>
                <li>Turn on Data Roaming specifically for the eSIM line when you land.</li>
                <li>
                  <em className="text-[#0A0A08]/60">Note: Exact menu names and navigation paths vary by phone brand and OS version.</em>
                </li>
              </ul>
            </div>
          </div>
        </Container>
      </section>

      {/* ──────────────── 2e. HOW ORDERING WORKS 4-STEP TIMELINE ──────────────── */}
      <section className="border-t border-black/10 bg-white py-16 sm:py-20">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-[#8F6407]">
              Simple Process
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-[#0A0A08] sm:text-3xl">
              How Ordering Works
            </h2>
            <p className="mt-2 text-sm text-[#0A0A08]/70">
              Personalized support on WhatsApp from start to finish.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Step 1 */}
            <div className="rounded-2xl border border-black/10 bg-[#FAF7F2] p-5 sm:p-6">
              <span className="font-[family-name:var(--font-display)] text-3xl font-bold text-[#C9A227]">01</span>
              <h3 className="mt-2 text-base font-bold text-[#0A0A08]">Pick Plan</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-[#0A0A08]/70">
                Choose your travel destination and preferred data quota from our transparent catalogue.
              </p>
            </div>

            {/* Step 2 */}
            <div className="rounded-2xl border border-black/10 bg-[#FAF7F2] p-5 sm:p-6">
              <span className="font-[family-name:var(--font-display)] text-3xl font-bold text-[#C9A227]">02</span>
              <h3 className="mt-2 text-base font-bold text-[#0A0A08]">Tap Order on WhatsApp</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-[#0A0A08]/70">
                Click Order to open a pre-filled WhatsApp message with your selected plan details.
              </p>
            </div>

            {/* Step 3 */}
            <div className="rounded-2xl border border-black/10 bg-[#FAF7F2] p-5 sm:p-6">
              <span className="font-[family-name:var(--font-display)] text-3xl font-bold text-[#C9A227]">03</span>
              <h3 className="mt-2 text-base font-bold text-[#0A0A08]">Confirm & Pay with Team</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-[#0A0A08]/70">
                Our reservation specialist confirms your details and sends a secure payment link.
              </p>
            </div>

            {/* Step 4 */}
            <div className="rounded-2xl border border-black/10 bg-[#FAF7F2] p-5 sm:p-6">
              <span className="font-[family-name:var(--font-display)] text-3xl font-bold text-[#C9A227]">04</span>
              <h3 className="mt-2 text-base font-bold text-[#0A0A08]">Receive QR & Install Guide</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-[#0A0A08]/70">
                Receive your eSIM QR code and straightforward step-by-step installation instructions directly on WhatsApp.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* ──────────────── 2f. TRUST & SUPPORT STRIP ──────────────── */}
      <section className="border-t border-black/10 bg-[#FAF7F2] py-10 sm:py-12">
        <Container>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {/* Trust Item 1 */}
            <div className="flex items-center gap-3.5 rounded-2xl border border-black/10 bg-white p-5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#25D366]/15 text-[#25D366]">
                <WhatsAppIcon className="size-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0A0A08]">WhatsApp Support</h3>
                <p className="text-xs text-[#0A0A08]/70">Direct assistance from our reservation team</p>
              </div>
            </div>

            {/* Trust Item 2 */}
            <div className="flex items-center gap-3.5 rounded-2xl border border-black/10 bg-white p-5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#C9A227]/15 text-[#8F6407]">
                <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0A0A08]">UAE-Based Team</h3>
                <p className="text-xs text-[#0A0A08]/70">Dubai licensed pilgrimage & travel agency</p>
              </div>
            </div>

            {/* Trust Item 3 */}
            <div className="flex items-center gap-3.5 rounded-2xl border border-black/10 bg-white p-5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#C9A227]/15 text-[#8F6407]">
                <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0A0A08]">Plain-Language Terms</h3>
                <Link
                  href="/terms-conditions"
                  className="text-xs font-semibold text-[#8F6407] hover:underline"
                >
                  View Terms &amp; Refund Policy &rarr;
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ──────────────── 5. DEVICE COMPATIBILITY NOTE ──────────────── */}
      <section className="border-t border-black/10 bg-white py-16 sm:py-20">
        <Container>
          <div className="mx-auto max-w-3xl rounded-3xl border border-black/10 bg-[#FAF7F2] p-6 sm:p-10 shadow-xs">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#C9A227]/15 text-[#8F6407]">
                <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
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
                  To use an eSIM, your smartphone must support eSIM hardware and must be network-unlocked (carrier-free, not locked to a specific mobile provider contract).
                </p>

                <div className="mt-5 rounded-xl border border-black/10 bg-white p-4 text-xs sm:text-sm text-[#0A0A08]/80 space-y-2">
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
                  <svg className="size-4 shrink-0 text-[#C9A227]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
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
                        <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                        </svg>
                      ) : (
                        <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} aria-hidden="true">
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
                className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-6 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-xs transition hover:bg-[#20bd5a]"
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
