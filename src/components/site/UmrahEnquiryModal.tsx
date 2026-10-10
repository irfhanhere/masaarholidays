"use client";

import { useState, useEffect, useId } from "react";
import Image from "next/image";
import { ExternalImage } from "./ExternalImage";
import {
  VERIFIED_VEHICLE_CATALOG,
  VERIFIED_ROUTE_CATALOG,
  ROUTE_VEHICLE_RATES,
} from "@/lib/data/transfers-catalog";
import { WhatsAppGlyph } from "./WhatsAppButton";

export interface PackageEnquiryInfo {
  name: string;
  tier?: string;
  destination: string;
  duration: string;
  hotelName: string;
  hotelRating?: string;
  boardBasis?: string;
  shuttleInfo?: string;
  imageUrl?: string | null;
  shortDescription?: string;
  packageType?: "umrah" | "hajj";
  makkahHotelName?: string;
  madinahHotelName?: string;
  makkahHotelImage?: string;
  madinahHotelImage?: string;
  maktabCategory?: string;
  hajjArrangement?: string;
  startingPriceAed?: number;
  inclusions?: string[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  packageInfo: PackageEnquiryInfo;
  initialAddon?: string;
}

const WHATSAPP_NUMBER = "971557329320"; // Official Masaar Holidays UAE contact number

type ServiceStatus = "none" | "choose_now" | "add_later";

const DEFAULT_MAKKAH_HOTELS = [
  {
    name: "VOCO Makkah",
    stars: "5-Star",
    location: "Near Haram · 24/7 Dedicated Shuttle",
    image: "/hotels/voco-makkah/thumb.webp",
  },
  {
    name: "Raffles Makkah Palace",
    stars: "5-Star Luxury",
    location: "Direct Haram Courtyard Access",
    image: "/hotels/raffles-makkah-palace/thumb.webp",
  },
  {
    name: "Swissotel Makkah",
    stars: "5-Star",
    location: "Clock Tower Complex",
    image: "/hotels/swissotel-makkah/hero.jpg",
  },
  {
    name: "Hilton Suites Makkah",
    stars: "5-Star",
    location: "Jabal Omar · Short Walking Distance",
    image: "/hotels/hilton-suites-makkah/hero.jpg",
  },
  {
    name: "Conrad Jabal Omar",
    stars: "5-Star Luxury",
    location: "Jabal Omar Development",
    image: "/hotels/conrad-jabal-omar/hero.jpg",
  },
  {
    name: "InterContinental Dar Al Tawhid",
    stars: "5-Star",
    location: "Direct Courtyard Access",
    image: "/hotels/intercontinental-dar-al-tawhid/thumb.webp",
  },
];

const DEFAULT_MADINAH_HOTELS = [
  {
    name: "Zowar International Madinah",
    stars: "4-Star",
    location: "Central Area · Near Prophet's Mosque",
    image: "/hotels/crowne-plaza-madinah/thumb.webp",
  },
  {
    name: "Crowne Plaza Madinah",
    stars: "5-Star",
    location: "Walking Distance to Haram",
    image: "/hotels/crowne-plaza-madinah/thumb.webp",
  },
  {
    name: "InterContinental Dar Al Hijra",
    stars: "5-Star",
    location: "Northern Central Area",
    image: "/hotels/intercontinental-dar-al-hijra-madinah/thumb.webp",
  },
  {
    name: "Sofitel Shahd Al Madinah",
    stars: "5-Star Luxury",
    location: "Steps from King Fahd Gate",
    image: "/hotels/sofitel-shahd-al-madinah/hero.jpg",
  },
  {
    name: "Pullman Zamzam Madina",
    stars: "5-Star",
    location: "Facing Prophet's Mosque Courtyard",
    image: "/hotels/pullman-zamzam-madina/hero.jpg",
  },
  {
    name: "Madinah Hilton",
    stars: "5-Star",
    location: "Direct Courtyard Access",
    image: "/hotels/madinah-hilton/hero.jpg",
  },
];

const ESIM_PLANS = [
  { id: "sa-5gb-15d", name: "Saudi Arabia 5 GB · 15 Days", price: "USD 12 (AED 44)" },
  { id: "sa-10gb-30d", name: "Saudi Arabia 10 GB · 30 Days", price: "USD 18 (AED 66)" },
  { id: "sa-unlim-7d", name: "Saudi Arabia Unlimited · 7 Days", price: "USD 22 (AED 81)" },
  { id: "sa-unlim-15d", name: "Saudi Arabia Unlimited · 15 Days", price: "USD 35 (AED 129)" },
  { id: "sa-unlim-30d", name: "Saudi Arabia Unlimited · 30 Days", price: "USD 55 (AED 202)" },
  { id: "ae-5gb-15d", name: "UAE 5 GB · 15 Days", price: "USD 14 (AED 51)" },
  { id: "assistance-only", name: "eSIM Setup Assistance Required", price: "Complimentary" },
];

const VISA_OPTIONS = [
  { id: "tourist-multiple-1y", name: "1-Year Saudi Tourist / Umrah Visa (Multiple Entry)", price: "AED 650 / person" },
  { id: "electronic-umrah", name: "Electronic Umrah Visa (Official Single Entry)", price: "AED 650 / person" },
  { id: "saudi-tourist-evisa", name: "Saudi Tourist eVisa Assistance", price: "AED 550 / person" },
  { id: "uae-transit-visit", name: "UAE Transit & Stopover Visa Assistance", price: "On Request" },
];

export function UmrahEnquiryModal({
  isOpen,
  onClose,
  packageInfo,
  initialAddon,
}: Props) {
  const isHajj = packageInfo.packageType === "hajj" || packageInfo.destination?.toLowerCase().includes("hajj");
  const modalId = useId();

  // Step 1: Configure, Step 2: Review & Enquire
  const [step, setStep] = useState<1 | 2>(1);

  // 1. Occupancy selection
  const [occupancy, setOccupancy] = useState<"Double" | "Triple" | "Quad">("Quad");

  // 2. Services states: 'none' | 'choose_now' | 'add_later'
  const [hotelStatus, setHotelStatus] = useState<ServiceStatus>("none");
  const [hotelCity, setHotelCity] = useState<"both" | "makkah" | "madinah">("both");
  const [selectedMakkahHotel, setSelectedMakkahHotel] = useState<string>(
    packageInfo.makkahHotelName || packageInfo.hotelName || "VOCO Makkah"
  );
  const [selectedMadinahHotel, setSelectedMadinahHotel] = useState<string>(
    packageInfo.madinahHotelName || "Zowar International Madinah"
  );
  const [roomPreference, setRoomPreference] = useState<string>("Standard Room");

  const [transferStatus, setTransferStatus] = useState<ServiceStatus>("none");
  const [transferRouteSlug, setTransferRouteSlug] = useState<string>("jeddah-airport-to-makkah-hotel");
  const [transferVehicleSlug, setTransferVehicleSlug] = useState<string>("toyota-camry");
  const [transferDate, setTransferDate] = useState<string>("");
  const [transferTime, setTransferTime] = useState<string>("");

  const [visaStatus, setVisaStatus] = useState<ServiceStatus>("none");
  const [visaType, setVisaType] = useState<string>("1-Year Saudi Tourist / Umrah Visa (Multiple Entry)");
  const [visaTravellers, setVisaTravellers] = useState<number>(2);

  const [esimStatus, setEsimStatus] = useState<ServiceStatus>("none");
  const [esimPlan, setEsimPlan] = useState<string>("Saudi Arabia 10 GB · 30 Days");
  const [esimTravellers, setEsimTravellers] = useState<number>(1);

  const [flightStatus, setFlightStatus] = useState<ServiceStatus>("none");
  const [flightOrigin, setFlightOrigin] = useState<string>("Dubai (DXB)");
  const [flightDestination, setFlightDestination] = useState<string>("Jeddah (JED)");
  const [flightDepartDate, setFlightDepartDate] = useState<string>("");
  const [flightReturnDate, setFlightReturnDate] = useState<string>("");
  const [flightCabin, setFlightCabin] = useState<string>("Economy");

  // Ziyarat
  const [ziyaratMakkahStatus, setZiyaratMakkahStatus] = useState<ServiceStatus>("none");
  const [ziyaratMakkahVehicle, setZiyaratMakkahVehicle] = useState<string>("toyota-camry");

  const [ziyaratMadinahStatus, setZiyaratMadinahStatus] = useState<ServiceStatus>("none");
  const [ziyaratMadinahVehicle, setZiyaratMadinahVehicle] = useState<string>("toyota-camry");

  // Notes
  const [notes, setNotes] = useState<string>("");

  // Handle initialAddon if passed
  useEffect(() => {
    if (!initialAddon) return;
    const lower = initialAddon.toLowerCase();
    if (lower.includes("visa")) setVisaStatus("choose_now");
    if (lower.includes("transfer")) setTransferStatus("choose_now");
    if (lower.includes("flight")) setFlightStatus("choose_now");
    if (lower.includes("esim")) setEsimStatus("choose_now");
    if (lower.includes("makkah") && (lower.includes("ziyarat") || lower.includes("sightseeing"))) {
      setZiyaratMakkahStatus("choose_now");
    }
    if (lower.includes("madinah") && (lower.includes("ziyarat") || lower.includes("sightseeing"))) {
      setZiyaratMadinahStatus("choose_now");
    }
  }, [initialAddon]);

  // Lock scroll on background body
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setStep(1); // Reset to step 1 when reopened
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Selected Transfer Vehicle lookup
  const selectedVehicleObj =
    VERIFIED_VEHICLE_CATALOG.find((v) => v.slug === transferVehicleSlug) ||
    VERIFIED_VEHICLE_CATALOG[0];

  const selectedRouteObj =
    VERIFIED_ROUTE_CATALOG[transferRouteSlug] ||
    Object.values(VERIFIED_ROUTE_CATALOG)[0];

  const routeRates = ROUTE_VEHICLE_RATES[transferRouteSlug];
  const vehiclePriceAed = routeRates ? routeRates[selectedVehicleObj.name] : null;

  // Build clean WhatsApp message reflecting only selected items and distinguishing Decide Later
  const buildWhatsAppMessage = () => {
    const lines: string[] = [];
    lines.push("Assalamu Alaikum Masaar Holidays,");
    lines.push("");
    lines.push(`I would like to enquire about:`);
    lines.push(`Package: ${packageInfo.name}${packageInfo.tier ? ` (${packageInfo.tier})` : ""}`);
    lines.push(`Duration: ${packageInfo.duration}`);
    lines.push(`Destination: ${packageInfo.destination}`);
    lines.push(`Occupancy: ${occupancy} (${occupancy === "Double" ? "2" : occupancy === "Triple" ? "3" : "4"} People per room)`);

    const services: string[] = [];

    // Hotels
    if (hotelStatus === "choose_now") {
      const cityText =
        hotelCity === "both"
          ? `Makkah: ${selectedMakkahHotel} & Madinah: ${selectedMadinahHotel}`
          : hotelCity === "makkah"
          ? `Makkah: ${selectedMakkahHotel}`
          : `Madinah: ${selectedMadinahHotel}`;
      services.push(`• Hotels: Configured — ${cityText} (${roomPreference})`);
    } else if (hotelStatus === "add_later") {
      services.push(`• Hotels: Decide Later (Assistance requested)`);
    }

    // Transfers
    if (transferStatus === "choose_now") {
      let tDetails = `• Private Transfers: Configured — ${selectedRouteObj.route_name} with ${selectedVehicleObj.name}`;
      if (transferDate) tDetails += ` on ${transferDate}`;
      if (transferTime) tDetails += ` at ${transferTime}`;
      if (vehiclePriceAed != null) tDetails += ` (Configured Price: AED ${vehiclePriceAed})`;
      services.push(tDetails);
    } else if (transferStatus === "add_later") {
      services.push(`• Private Transfers: Decide Later`);
    }

    // Visa
    if (visaStatus === "choose_now") {
      services.push(`• Visa Assistance: Configured — ${visaType} for ${visaTravellers} applicant(s)`);
    } else if (visaStatus === "add_later") {
      services.push(`• Visa Assistance: Decide Later`);
    }

    // eSIM
    if (esimStatus === "choose_now") {
      services.push(`• eSIM: Configured — ${esimPlan} (${esimTravellers} device/profile)`);
    } else if (esimStatus === "add_later") {
      services.push(`• eSIM: Decide Later`);
    }

    // Flights
    if (flightStatus === "choose_now") {
      let fDetails = `• Flights: Configured — ${flightOrigin} → ${flightDestination} (${flightCabin})`;
      if (flightDepartDate) fDetails += `, Depart: ${flightDepartDate}`;
      if (flightReturnDate) fDetails += `, Return: ${flightReturnDate}`;
      services.push(fDetails);
    } else if (flightStatus === "add_later") {
      services.push(`• Flights: Decide Later`);
    }

    // Ziyarat
    if (ziyaratMakkahStatus === "choose_now") {
      const v = VERIFIED_VEHICLE_CATALOG.find((veh) => veh.slug === ziyaratMakkahVehicle);
      services.push(`• Private Makkah Experience: Configured (${v ? v.name : "Private Vehicle"})`);
    } else if (ziyaratMakkahStatus === "add_later") {
      services.push(`• Private Makkah Experience: Decide Later`);
    }

    if (ziyaratMadinahStatus === "choose_now") {
      const v = VERIFIED_VEHICLE_CATALOG.find((veh) => veh.slug === ziyaratMadinahVehicle);
      services.push(`• Private Madinah Sightseeing: Configured (${v ? v.name : "Private Vehicle"})`);
    } else if (ziyaratMadinahStatus === "add_later") {
      services.push(`• Private Madinah Sightseeing: Decide Later`);
    }

    if (services.length > 0) {
      lines.push("");
      lines.push("Additional Services:");
      lines.push(...services);
    }

    if (notes.trim()) {
      lines.push("");
      lines.push("Additional Notes:");
      lines.push(notes.trim());
    }

    lines.push("");
    lines.push("Please share availability and confirmed pricing details.");
    lines.push("JazakAllah Khair.");

    return lines.join("\n");
  };

  const whatsappMessage = buildWhatsAppMessage();
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`;

  // Default hotel image fallback
  const heroImage =
    packageInfo.imageUrl ||
    (isHajj ? "/brand/banners/hajj.webp" : "/brand/banners/umrah.webp");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${modalId}-title`}
    >
      <div className="relative flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl md:flex-row max-h-[92vh] border border-black/10 my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute right-4 top-4 z-20 flex size-9 items-center justify-center rounded-full bg-black/5 text-[#0A0A08]/70 hover:bg-black/10 hover:text-[#0A0A08] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227]"
          aria-label="Close enquiry modal"
        >
          ✕
        </button>

        {/* ──────────────── LEFT PANEL: SELECTED PACKAGE ──────────────── */}
        <div className="w-full md:w-5/12 bg-[#FAF7F2] p-6 sm:p-7 flex flex-col justify-between border-b md:border-b-0 md:border-r border-black/10 overflow-y-auto">
          <div className="space-y-4">
            {/* Top Photo */}
            <div className="relative h-44 w-full overflow-hidden rounded-xl bg-[#0A0A08]">
              <Image
                src={heroImage}
                alt={`${packageInfo.name} preview`}
                fill
                sizes="(max-width: 768px) 100vw, 420px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              {packageInfo.tier && (
                <div className="absolute bottom-3 left-3">
                  <span className="rounded-md bg-[#0A0A08]/80 backdrop-blur-sm px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#C9A227] border border-[#C9A227]/40">
                    {packageInfo.tier}
                  </span>
                </div>
              )}
            </div>

            {/* Header info */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#8F6407]">
                Selected Package
              </p>
              <h2
                id={`${modalId}-title`}
                className="font-[family-name:var(--font-display)] text-2xl font-bold text-[#0A0A08] mt-0.5"
              >
                {packageInfo.name}
              </h2>
              <p className="text-xs text-[#0A0A08]/65 mt-0.5 font-medium">
                {packageInfo.destination} · {packageInfo.duration}
              </p>
            </div>

            {/* Description */}
            <p className="text-xs leading-relaxed text-[#0A0A08]/70">
              {packageInfo.shortDescription ||
                "A thoughtfully planned pilgrimage journey with comfortable accommodation, verified private transfers, and dedicated support throughout."}
            </p>

            {/* Inclusions / Hotels Section */}
            {!isHajj ? (
              <div className="space-y-3 pt-2 border-t border-black/10">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#8F6407]">
                  Hotels Included
                </p>

                {/* Makkah Hotel Card */}
                <div className="flex items-center gap-3 rounded-xl border border-black/10 bg-white p-2.5 shadow-2xs">
                  <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-warm-ivory">
                    <Image
                      src={packageInfo.makkahHotelImage || "/hotels/voco-makkah/thumb.webp"}
                      alt={packageInfo.makkahHotelName || packageInfo.hotelName || "Makkah Hotel"}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-[#0A0A08] truncate">
                      {packageInfo.makkahHotelName || packageInfo.hotelName || "VOCO Makkah"}
                    </h4>
                    <p className="text-[11px] text-[#8F6407] font-medium flex items-center gap-1">
                      <span>📍 Makkah</span>
                      <span className="text-[10px] text-[#0A0A08]/50">· 5-Star · Near Haram</span>
                    </p>
                  </div>
                </div>

                {/* Madinah Hotel Card */}
                <div className="flex items-center gap-3 rounded-xl border border-black/10 bg-white p-2.5 shadow-2xs">
                  <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-warm-ivory">
                    <Image
                      src={packageInfo.madinahHotelImage || "/hotels/crowne-plaza-madinah/thumb.webp"}
                      alt={packageInfo.madinahHotelName || "Madinah Hotel"}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-[#0A0A08] truncate">
                      {packageInfo.madinahHotelName || "Zowar International Madinah"}
                    </h4>
                    <p className="text-[11px] text-[#8F6407] font-medium flex items-center gap-1">
                      <span>📍 Madinah</span>
                      <span className="text-[10px] text-[#0A0A08]/50">· Central Area</span>
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Hajj Key Inclusions */
              <div className="space-y-2.5 pt-2 border-t border-black/10 text-xs text-[#0A0A08]/80">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#8F6407]">
                  Hajj Arrangements
                </p>
                <div className="flex items-start gap-2.5">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-[#C9A227]/20 text-xs">
                    🏨
                  </span>
                  <div>
                    <strong className="text-[#0A0A08]">Accommodation:</strong>{" "}
                    {packageInfo.hotelName || "Premium hotels in Makkah & Madinah"}
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-[#C9A227]/20 text-xs">
                    ⛺
                  </span>
                  <div>
                    <strong className="text-[#0A0A08]">Mina & Arafat:</strong>{" "}
                    {packageInfo.maktabCategory || "Category A Air-Conditioned Camps"}
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-[#C9A227]/20 text-xs">
                    🚌
                  </span>
                  <div>
                    <strong className="text-[#0A0A08]">Transfers:</strong> All major intercity & ritual transfers included
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-[#C9A227]/20 text-xs">
                    👥
                  </span>
                  <div>
                    <strong className="text-[#0A0A08]">Dedicated Support:</strong> Multilingual scholars & guidance team
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Brand Mark Footer */}
          <div className="mt-6 pt-4 border-t border-black/10 flex items-center justify-between text-[#8F6407]">
            <span className="font-[family-name:var(--font-display)] text-sm font-bold tracking-widest text-[#0A0A08]">
              MASAAR
            </span>
            <span className="text-[10px] tracking-wide text-[#0A0A08]/60">
              Faith · Clarity · Care · Peace
            </span>
          </div>
        </div>

        {/* ──────────────── RIGHT PANEL: ENQUIRY CONFIGURATION ──────────────── */}
        <div className="w-full md:w-7/12 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto">
          {/* ──────────────── SCREEN 1: CONFIGURE ──────────────── */}
          {step === 1 ? (
            <div className="space-y-6">
              {/* Top Step Strip */}
              <div className="border-b border-black/10 pb-4">
                <div className="flex items-center justify-between text-xs font-semibold text-[#8F6407]">
                  <span>Step 1 of 2 — Configure Preferences</span>
                  <div className="h-1.5 w-24 rounded-full bg-black/10 overflow-hidden">
                    <div className="h-full w-1/2 bg-[#C9A227] rounded-full" />
                  </div>
                </div>
                <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-[#0A0A08]">
                  Enquire on WhatsApp
                </h3>
                <p className="mt-0.5 text-xs text-[#0A0A08]/65">
                  Choose your preferences and we&apos;ll prepare the best options for your journey.
                </p>
              </div>

              {/* 1. OCCUPANCY */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="flex size-5 items-center justify-center rounded-full bg-[#C9A227] text-[#0A0A08] text-[11px] font-bold">
                    1
                  </span>
                  <h4 className="text-sm font-bold text-[#0A0A08]">Occupancy</h4>
                  <span className="text-xs text-[#0A0A08]/50">— Select room capacity</span>
                </div>

                <div className="grid grid-cols-3 gap-2.5 pt-1">
                  {(["Double", "Triple", "Quad"] as const).map((type) => {
                    const isSelected = occupancy === type;
                    const icons = type === "Double" ? "👥" : type === "Triple" ? "👥👤" : "👥👥";
                    const pax = type === "Double" ? "2 People" : type === "Triple" ? "3 People" : "4 People";
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setOccupancy(type)}
                        className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition-all ${
                          isSelected
                            ? "border-[#C9A227] bg-[#C9A227]/15 ring-2 ring-[#C9A227]"
                            : "border-black/15 bg-white hover:bg-[#FAF7F2]"
                        }`}
                      >
                        <span className="text-xs font-bold text-[#0A0A08]">{type}</span>
                        <span className="mt-1 text-sm">{icons}</span>
                        <span className="text-[10px] text-[#0A0A08]/60 mt-0.5">{pax}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. ADDITIONAL SERVICES */}
              <div className="space-y-3 border-t border-black/10 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex size-5 items-center justify-center rounded-full bg-[#C9A227] text-[#0A0A08] text-[11px] font-bold">
                      2
                    </span>
                    <h4 className="text-sm font-bold text-[#0A0A08]">Additional Services</h4>
                    <span className="text-xs text-[#0A0A08]/50">— Choose now or add later</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* SERVICE 1: HOTELS */}
                  <div className="rounded-xl border border-black/10 bg-[#FAF7F2]/50 p-3.5 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 items-center justify-center rounded-lg bg-white text-base shadow-2xs">
                          🏨
                        </span>
                        <div>
                          <h5 className="text-xs font-bold text-[#0A0A08]">Hotels</h5>
                          <p className="text-[11px] text-[#0A0A08]/60">Select hotel preferences</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setHotelStatus(hotelStatus === "choose_now" ? "none" : "choose_now")}
                          className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                            hotelStatus === "choose_now"
                              ? "bg-[#C9A227] text-[#0A0A08]"
                              : "border border-black/15 bg-white text-[#0A0A08] hover:border-[#C9A227]"
                          }`}
                        >
                          {hotelStatus === "choose_now" ? "Configuring ✓" : "Choose Now"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setHotelStatus(hotelStatus === "add_later" ? "none" : "add_later")}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                            hotelStatus === "add_later"
                              ? "bg-[#0A0A08] text-white"
                              : "border border-black/15 bg-white text-[#0A0A08]/70 hover:bg-black/5"
                          }`}
                        >
                          {hotelStatus === "add_later" ? "Decide Later ✓" : "Add Later"}
                        </button>
                      </div>
                    </div>

                    {/* EXPANDABLE HOTEL CONFIG */}
                    {hotelStatus === "choose_now" && (
                      <div className="mt-3.5 pt-3.5 border-t border-black/10 space-y-3 bg-white p-3 rounded-lg">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="block text-[11px] font-bold text-[#0A0A08]/70 uppercase tracking-wider mb-1">
                              City Focus
                            </label>
                            <select
                              value={hotelCity}
                              onChange={(e) => setHotelCity(e.target.value as any)}
                              className="w-full rounded-lg border border-black/15 bg-[#FAF7F2] p-2 text-xs text-[#0A0A08] focus:border-[#C9A227] focus:outline-none"
                            >
                              <option value="both">Both Makkah & Madinah</option>
                              <option value="makkah">Makkah Only</option>
                              <option value="madinah">Madinah Only</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-[#0A0A08]/70 uppercase tracking-wider mb-1">
                              Room Type Preference
                            </label>
                            <select
                              value={roomPreference}
                              onChange={(e) => setRoomPreference(e.target.value)}
                              className="w-full rounded-lg border border-black/15 bg-[#FAF7F2] p-2 text-xs text-[#0A0A08] focus:border-[#C9A227] focus:outline-none"
                            >
                              <option value="Standard Room">Standard Room</option>
                              <option value="Haram / Kaaba View">Haram / Kaaba View</option>
                              <option value="Executive Suite">Executive Suite</option>
                              <option value="Two-Bedroom Family Suite">Two-Bedroom Family Suite</option>
                            </select>
                          </div>
                        </div>

                        {(hotelCity === "both" || hotelCity === "makkah") && (
                          <div>
                            <label className="block text-[11px] font-bold text-[#0A0A08]/70 uppercase tracking-wider mb-1">
                              Makkah Hotel
                            </label>
                            <select
                              value={selectedMakkahHotel}
                              onChange={(e) => setSelectedMakkahHotel(e.target.value)}
                              className="w-full rounded-lg border border-black/15 bg-[#FAF7F2] p-2 text-xs text-[#0A0A08] focus:border-[#C9A227] focus:outline-none"
                            >
                              {DEFAULT_MAKKAH_HOTELS.map((h) => (
                                <option key={h.name} value={h.name}>
                                  {h.name} ({h.stars} · {h.location})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {(hotelCity === "both" || hotelCity === "madinah") && (
                          <div>
                            <label className="block text-[11px] font-bold text-[#0A0A08]/70 uppercase tracking-wider mb-1">
                              Madinah Hotel
                            </label>
                            <select
                              value={selectedMadinahHotel}
                              onChange={(e) => setSelectedMadinahHotel(e.target.value)}
                              className="w-full rounded-lg border border-black/15 bg-[#FAF7F2] p-2 text-xs text-[#0A0A08] focus:border-[#C9A227] focus:outline-none"
                            >
                              {DEFAULT_MADINAH_HOTELS.map((h) => (
                                <option key={h.name} value={h.name}>
                                  {h.name} ({h.stars} · {h.location})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* SERVICE 2: PRIVATE TRANSFERS */}
                  <div className="rounded-xl border border-black/10 bg-[#FAF7F2]/50 p-3.5 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 items-center justify-center rounded-lg bg-white text-base shadow-2xs">
                          🚗
                        </span>
                        <div>
                          <h5 className="text-xs font-bold text-[#0A0A08]">Private Transfers</h5>
                          <p className="text-[11px] text-[#0A0A08]/60">Select route and vehicle</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setTransferStatus(transferStatus === "choose_now" ? "none" : "choose_now")}
                          className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                            transferStatus === "choose_now"
                              ? "bg-[#C9A227] text-[#0A0A08]"
                              : "border border-black/15 bg-white text-[#0A0A08] hover:border-[#C9A227]"
                          }`}
                        >
                          {transferStatus === "choose_now" ? "Configuring ✓" : "Choose Now"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setTransferStatus(transferStatus === "add_later" ? "none" : "add_later")}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                            transferStatus === "add_later"
                              ? "bg-[#0A0A08] text-white"
                              : "border border-black/15 bg-white text-[#0A0A08]/70 hover:bg-black/5"
                          }`}
                        >
                          {transferStatus === "add_later" ? "Decide Later ✓" : "Add Later"}
                        </button>
                      </div>
                    </div>

                    {/* EXPANDABLE TRANSFERS CONFIG */}
                    {transferStatus === "choose_now" && (
                      <div className="mt-3.5 pt-3.5 border-t border-black/10 space-y-3 bg-white p-3 rounded-lg text-xs">
                        <div>
                          <label className="block text-[11px] font-bold text-[#0A0A08]/70 uppercase tracking-wider mb-1">
                            Transfer Route
                          </label>
                          <select
                            value={transferRouteSlug}
                            onChange={(e) => setTransferRouteSlug(e.target.value)}
                            className="w-full rounded-lg border border-black/15 bg-[#FAF7F2] p-2 text-xs text-[#0A0A08] focus:border-[#C9A227] focus:outline-none"
                          >
                            {Object.entries(VERIFIED_ROUTE_CATALOG).map(([slug, meta]) => (
                              <option key={slug} value={slug}>
                                {meta.route_name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-[#0A0A08]/70 uppercase tracking-wider mb-1">
                            Vehicle Type
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {VERIFIED_VEHICLE_CATALOG.map((veh) => {
                              const isVehSelected = veh.slug === transferVehicleSlug;
                              const price = routeRates ? routeRates[veh.name] : null;
                              return (
                                <button
                                  key={veh.slug}
                                  type="button"
                                  onClick={() => setTransferVehicleSlug(veh.slug)}
                                  className={`flex items-center gap-2.5 rounded-lg border p-2 text-left transition ${
                                    isVehSelected
                                      ? "border-[#C9A227] bg-[#C9A227]/10 ring-1 ring-[#C9A227]"
                                      : "border-black/10 bg-[#FAF7F2] hover:bg-white"
                                  }`}
                                >
                                  <div className="relative size-10 shrink-0 rounded overflow-hidden bg-white">
                                    <Image
                                      src={veh.image_url}
                                      alt={`${veh.name} private transfer vehicle`}
                                      fill
                                      sizes="40px"
                                      className="object-cover"
                                    />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="font-bold text-[11px] text-[#0A0A08] truncate">{veh.name}</p>
                                    <p className="text-[10px] text-[#0A0A08]/60">
                                      {veh.passenger_capacity} Pax · {veh.luggage_capacity} Bags
                                    </p>
                                    <p className="text-[10px] font-bold text-[#8F6407]">
                                      {price != null ? `AED ${price}` : "Price on request"}
                                    </p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-[#0A0A08]/70 uppercase tracking-wider mb-1">
                              Journey Date
                            </label>
                            <input
                              type="date"
                              value={transferDate}
                              onChange={(e) => setTransferDate(e.target.value)}
                              className="w-full rounded-lg border border-black/15 bg-[#FAF7F2] p-2 text-xs text-[#0A0A08] focus:border-[#C9A227] focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-[#0A0A08]/70 uppercase tracking-wider mb-1">
                              Pickup Time
                            </label>
                            <input
                              type="time"
                              value={transferTime}
                              onChange={(e) => setTransferTime(e.target.value)}
                              className="w-full rounded-lg border border-black/15 bg-[#FAF7F2] p-2 text-xs text-[#0A0A08] focus:border-[#C9A227] focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* SERVICE 3: VISA ASSISTANCE */}
                  <div className="rounded-xl border border-black/10 bg-[#FAF7F2]/50 p-3.5 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 items-center justify-center rounded-lg bg-white text-base shadow-2xs">
                          🛂
                        </span>
                        <div>
                          <h5 className="text-xs font-bold text-[#0A0A08]">Visa Assistance</h5>
                          <p className="text-[11px] text-[#0A0A08]/60">We&apos;ll guide you with document filing</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setVisaStatus(visaStatus === "choose_now" ? "none" : "choose_now")}
                          className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                            visaStatus === "choose_now"
                              ? "bg-[#C9A227] text-[#0A0A08]"
                              : "border border-black/15 bg-white text-[#0A0A08] hover:border-[#C9A227]"
                          }`}
                        >
                          {visaStatus === "choose_now" ? "Configuring ✓" : "Choose Now"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setVisaStatus(visaStatus === "add_later" ? "none" : "add_later")}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                            visaStatus === "add_later"
                              ? "bg-[#0A0A08] text-white"
                              : "border border-black/15 bg-white text-[#0A0A08]/70 hover:bg-black/5"
                          }`}
                        >
                          {visaStatus === "add_later" ? "Decide Later ✓" : "Add Later"}
                        </button>
                      </div>
                    </div>

                    {/* EXPANDABLE VISA CONFIG */}
                    {visaStatus === "choose_now" && (
                      <div className="mt-3.5 pt-3.5 border-t border-black/10 space-y-3 bg-white p-3 rounded-lg text-xs">
                        <div>
                          <label className="block text-[11px] font-bold text-[#0A0A08]/70 uppercase tracking-wider mb-1">
                            Visa Option
                          </label>
                          <select
                            value={visaType}
                            onChange={(e) => setVisaType(e.target.value)}
                            className="w-full rounded-lg border border-black/15 bg-[#FAF7F2] p-2 text-xs text-[#0A0A08] focus:border-[#C9A227] focus:outline-none"
                          >
                            {VISA_OPTIONS.map((v) => (
                              <option key={v.id} value={v.name}>
                                {v.name} ({v.price})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-[#0A0A08]/70 uppercase tracking-wider mb-1">
                            Number of Applicants
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={10}
                            value={visaTravellers}
                            onChange={(e) => setVisaTravellers(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full rounded-lg border border-black/15 bg-[#FAF7F2] p-2 text-xs text-[#0A0A08] focus:border-[#C9A227] focus:outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* SERVICE 4: eSIM */}
                  <div className="rounded-xl border border-black/10 bg-[#FAF7F2]/50 p-3.5 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 items-center justify-center rounded-lg bg-white text-base shadow-2xs">
                          📱
                        </span>
                        <div>
                          <h5 className="text-xs font-bold text-[#0A0A08]">eSIM</h5>
                          <p className="text-[11px] text-[#0A0A08]/60">Stay connected with 4G/5G data</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEsimStatus(esimStatus === "choose_now" ? "none" : "choose_now")}
                          className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                            esimStatus === "choose_now"
                              ? "bg-[#C9A227] text-[#0A0A08]"
                              : "border border-black/15 bg-white text-[#0A0A08] hover:border-[#C9A227]"
                          }`}
                        >
                          {esimStatus === "choose_now" ? "Configuring ✓" : "Choose Now"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEsimStatus(esimStatus === "add_later" ? "none" : "add_later")}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                            esimStatus === "add_later"
                              ? "bg-[#0A0A08] text-white"
                              : "border border-black/15 bg-white text-[#0A0A08]/70 hover:bg-black/5"
                          }`}
                        >
                          {esimStatus === "add_later" ? "Decide Later ✓" : "Add Later"}
                        </button>
                      </div>
                    </div>

                    {/* EXPANDABLE eSIM CONFIG */}
                    {esimStatus === "choose_now" && (
                      <div className="mt-3.5 pt-3.5 border-t border-black/10 space-y-3 bg-white p-3 rounded-lg text-xs">
                        <div>
                          <label className="block text-[11px] font-bold text-[#0A0A08]/70 uppercase tracking-wider mb-1">
                            Prepaid Data Plan
                          </label>
                          <select
                            value={esimPlan}
                            onChange={(e) => setEsimPlan(e.target.value)}
                            className="w-full rounded-lg border border-black/15 bg-[#FAF7F2] p-2 text-xs text-[#0A0A08] focus:border-[#C9A227] focus:outline-none"
                          >
                            {ESIM_PLANS.map((p) => (
                              <option key={p.id} value={p.name}>
                                {p.name} — {p.price}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-[#0A0A08]/70 uppercase tracking-wider mb-1">
                            Number of Profiles / Travellers
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={6}
                            value={esimTravellers}
                            onChange={(e) => setEsimTravellers(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full rounded-lg border border-black/15 bg-[#FAF7F2] p-2 text-xs text-[#0A0A08] focus:border-[#C9A227] focus:outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* SERVICE 5: FLIGHTS */}
                  <div className="rounded-xl border border-black/10 bg-[#FAF7F2]/50 p-3.5 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 items-center justify-center rounded-lg bg-white text-base shadow-2xs">
                          ✈️
                        </span>
                        <div>
                          <h5 className="text-xs font-bold text-[#0A0A08]">Flights</h5>
                          <p className="text-[11px] text-[#0A0A08]/60">Share flight routing details</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setFlightStatus(flightStatus === "choose_now" ? "none" : "choose_now")}
                          className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                            flightStatus === "choose_now"
                              ? "bg-[#C9A227] text-[#0A0A08]"
                              : "border border-black/15 bg-white text-[#0A0A08] hover:border-[#C9A227]"
                          }`}
                        >
                          {flightStatus === "choose_now" ? "Configuring ✓" : "Choose Now"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setFlightStatus(flightStatus === "add_later" ? "none" : "add_later")}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                            flightStatus === "add_later"
                              ? "bg-[#0A0A08] text-white"
                              : "border border-black/15 bg-white text-[#0A0A08]/70 hover:bg-black/5"
                          }`}
                        >
                          {flightStatus === "add_later" ? "Decide Later ✓" : "Add Later"}
                        </button>
                      </div>
                    </div>

                    {/* EXPANDABLE FLIGHTS CONFIG */}
                    {flightStatus === "choose_now" && (
                      <div className="mt-3.5 pt-3.5 border-t border-black/10 space-y-3 bg-white p-3 rounded-lg text-xs">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-[#0A0A08]/70 uppercase tracking-wider mb-1">
                              From (Origin)
                            </label>
                            <input
                              type="text"
                              value={flightOrigin}
                              onChange={(e) => setFlightOrigin(e.target.value)}
                              placeholder="e.g. Dubai DXB"
                              className="w-full rounded-lg border border-black/15 bg-[#FAF7F2] p-2 text-xs text-[#0A0A08] focus:border-[#C9A227] focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-[#0A0A08]/70 uppercase tracking-wider mb-1">
                              To (Destination)
                            </label>
                            <input
                              type="text"
                              value={flightDestination}
                              onChange={(e) => setFlightDestination(e.target.value)}
                              placeholder="e.g. Jeddah JED"
                              className="w-full rounded-lg border border-black/15 bg-[#FAF7F2] p-2 text-xs text-[#0A0A08] focus:border-[#C9A227] focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[11px] font-bold text-[#0A0A08]/70 uppercase tracking-wider mb-1">
                              Depart Date
                            </label>
                            <input
                              type="date"
                              value={flightDepartDate}
                              onChange={(e) => setFlightDepartDate(e.target.value)}
                              className="w-full rounded-lg border border-black/15 bg-[#FAF7F2] p-2 text-xs text-[#0A0A08] focus:border-[#C9A227] focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-[#0A0A08]/70 uppercase tracking-wider mb-1">
                              Return Date
                            </label>
                            <input
                              type="date"
                              value={flightReturnDate}
                              onChange={(e) => setFlightReturnDate(e.target.value)}
                              className="w-full rounded-lg border border-black/15 bg-[#FAF7F2] p-2 text-xs text-[#0A0A08] focus:border-[#C9A227] focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-[#0A0A08]/70 uppercase tracking-wider mb-1">
                              Cabin
                            </label>
                            <select
                              value={flightCabin}
                              onChange={(e) => setFlightCabin(e.target.value)}
                              className="w-full rounded-lg border border-black/15 bg-[#FAF7F2] p-2 text-xs text-[#0A0A08] focus:border-[#C9A227] focus:outline-none"
                            >
                              <option value="Economy">Economy</option>
                              <option value="Premium Economy">Prem. Economy</option>
                              <option value="Business Class">Business Class</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* SERVICE 6: PRIVATE ZIYARAT / SIGHTSEEING */}
                  <div className="rounded-xl border border-black/10 bg-[#FAF7F2]/50 p-3.5 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 items-center justify-center rounded-lg bg-white text-base shadow-2xs">
                          🕌
                        </span>
                        <div>
                          <h5 className="text-xs font-bold text-[#0A0A08]">Private Makkah Experience</h5>
                          <p className="text-[11px] text-[#0A0A08]/60">Guided historical ziyarat</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setZiyaratMakkahStatus(ziyaratMakkahStatus === "choose_now" ? "none" : "choose_now")}
                          className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                            ziyaratMakkahStatus === "choose_now"
                              ? "bg-[#C9A227] text-[#0A0A08]"
                              : "border border-black/15 bg-white text-[#0A0A08] hover:border-[#C9A227]"
                          }`}
                        >
                          {ziyaratMakkahStatus === "choose_now" ? "Configuring ✓" : "Choose Now"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setZiyaratMakkahStatus(ziyaratMakkahStatus === "add_later" ? "none" : "add_later")}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                            ziyaratMakkahStatus === "add_later"
                              ? "bg-[#0A0A08] text-white"
                              : "border border-black/15 bg-white text-[#0A0A08]/70 hover:bg-black/5"
                          }`}
                        >
                          {ziyaratMakkahStatus === "add_later" ? "Decide Later ✓" : "Add Later"}
                        </button>
                      </div>
                    </div>

                    {ziyaratMakkahStatus === "choose_now" && (
                      <div className="mt-3.5 pt-3.5 border-t border-black/10 space-y-2 bg-white p-3 rounded-lg text-xs">
                        <label className="block text-[11px] font-bold text-[#0A0A08]/70 uppercase tracking-wider">
                          Vehicle for Makkah Ziyarat
                        </label>
                        <select
                          value={ziyaratMakkahVehicle}
                          onChange={(e) => setZiyaratMakkahVehicle(e.target.value)}
                          className="w-full rounded-lg border border-black/15 bg-[#FAF7F2] p-2 text-xs text-[#0A0A08] focus:border-[#C9A227] focus:outline-none"
                        >
                          {VERIFIED_VEHICLE_CATALOG.map((v) => (
                            <option key={v.slug} value={v.slug}>
                              {v.name} ({v.passenger_capacity} Passengers)
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* SERVICE 7: PRIVATE MADINAH SIGHTSEEING */}
                  <div className="rounded-xl border border-black/10 bg-[#FAF7F2]/50 p-3.5 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 items-center justify-center rounded-lg bg-white text-base shadow-2xs">
                          🕌
                        </span>
                        <div>
                          <h5 className="text-xs font-bold text-[#0A0A08]">Private Madinah Sightseeing</h5>
                          <p className="text-[11px] text-[#0A0A08]/60">Mount Uhud, Quba & landmarks</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setZiyaratMadinahStatus(ziyaratMadinahStatus === "choose_now" ? "none" : "choose_now")}
                          className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                            ziyaratMadinahStatus === "choose_now"
                              ? "bg-[#C9A227] text-[#0A0A08]"
                              : "border border-black/15 bg-white text-[#0A0A08] hover:border-[#C9A227]"
                          }`}
                        >
                          {ziyaratMadinahStatus === "choose_now" ? "Configuring ✓" : "Choose Now"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setZiyaratMadinahStatus(ziyaratMadinahStatus === "add_later" ? "none" : "add_later")}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                            ziyaratMadinahStatus === "add_later"
                              ? "bg-[#0A0A08] text-white"
                              : "border border-black/15 bg-white text-[#0A0A08]/70 hover:bg-black/5"
                          }`}
                        >
                          {ziyaratMadinahStatus === "add_later" ? "Decide Later ✓" : "Add Later"}
                        </button>
                      </div>
                    </div>

                    {ziyaratMadinahStatus === "choose_now" && (
                      <div className="mt-3.5 pt-3.5 border-t border-black/10 space-y-2 bg-white p-3 rounded-lg text-xs">
                        <label className="block text-[11px] font-bold text-[#0A0A08]/70 uppercase tracking-wider">
                          Vehicle for Madinah Ziyarat
                        </label>
                        <select
                          value={ziyaratMadinahVehicle}
                          onChange={(e) => setZiyaratMadinahVehicle(e.target.value)}
                          className="w-full rounded-lg border border-black/15 bg-[#FAF7F2] p-2 text-xs text-[#0A0A08] focus:border-[#C9A227] focus:outline-none"
                        >
                          {VERIFIED_VEHICLE_CATALOG.map((v) => (
                            <option key={v.slug} value={v.slug}>
                              {v.name} ({v.passenger_capacity} Passengers)
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. ADDITIONAL NOTES */}
              <div className="space-y-2 border-t border-black/10 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex size-5 items-center justify-center rounded-full bg-[#C9A227] text-[#0A0A08] text-[11px] font-bold">
                      3
                    </span>
                    <h4 className="text-sm font-bold text-[#0A0A08]">Additional Notes</h4>
                    <span className="text-xs text-[#0A0A08]/50">(optional)</span>
                  </div>
                  <span
                    className={`text-[11px] ${
                      notes.length > 480 ? "text-red-600 font-bold" : "text-[#0A0A08]/50"
                    }`}
                  >
                    {notes.length}/500
                  </span>
                </div>

                <textarea
                  rows={3}
                  maxLength={500}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Share any special requests, elderly or child assistance needs, or preferred dates..."
                  className="w-full rounded-xl border border-black/15 bg-[#FAF7F2] p-3 text-xs leading-relaxed text-[#0A0A08] placeholder:text-[#0A0A08]/40 focus:border-[#C9A227] focus:bg-white focus:outline-none"
                />
              </div>

              {/* Action Button: Continue to Review */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#C9A227] px-6 py-3.5 text-sm font-bold text-[#0A0A08] shadow-sm transition hover:bg-[#A87F12] hover:text-white"
                >
                  <WhatsAppGlyph />
                  <span>Continue to Review →</span>
                </button>
                <p className="mt-2 text-center text-[11px] text-[#0A0A08]/50">
                  🔒 Your information is secure and will be shared via WhatsApp.
                </p>
              </div>
            </div>
          ) : (
            /* ──────────────── SCREEN 2: REVIEW & ENQUIRE ──────────────── */
            <div className="space-y-6">
              {/* Top Step Strip */}
              <div className="border-b border-black/10 pb-4">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8F6407] hover:underline"
                  >
                    <span>←</span>
                    <span>Back to Edit</span>
                  </button>
                  <span className="text-xs font-semibold text-[#8F6407]">
                    2 of 2 — Review &amp; Enquire
                  </span>
                </div>
                <h3 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-bold text-[#0A0A08]">
                  Your Selections
                </h3>
                <p className="mt-0.5 text-xs text-[#0A0A08]/65">
                  Review your preferences before sending your enquiry on WhatsApp.
                </p>
              </div>

              {/* Review Sections */}
              <div className="space-y-4">
                {/* 1. OCCUPANCY REVIEW */}
                <div className="flex items-center justify-between rounded-xl border border-black/10 bg-[#FAF7F2] p-3.5">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-white text-base shadow-2xs">
                      👥
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-[#0A0A08]">Occupancy</h4>
                      <p className="text-[11px] text-[#0A0A08]/70">
                        {occupancy} ({occupancy === "Double" ? "2" : occupancy === "Triple" ? "3" : "4"} People per room)
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs font-bold text-[#8F6407] hover:underline"
                  >
                    Edit
                  </button>
                </div>

                {/* 2. HOTELS REVIEW */}
                {hotelStatus !== "none" && (
                  <div className="rounded-xl border border-black/10 bg-[#FAF7F2] p-3.5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">🏨</span>
                        <h4 className="text-xs font-bold text-[#0A0A08]">Hotels</h4>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                            hotelStatus === "choose_now"
                              ? "bg-[#C9A227]/20 text-[#8F6407]"
                              : "bg-black/10 text-[#0A0A08]/60"
                          }`}
                        >
                          {hotelStatus === "choose_now" ? "Configured" : "Decide Later"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="text-xs font-bold text-[#8F6407] hover:underline"
                      >
                        Edit
                      </button>
                    </div>

                    {hotelStatus === "choose_now" ? (
                      <div className="space-y-1.5 text-xs text-[#0A0A08]/80 pl-6">
                        {(hotelCity === "both" || hotelCity === "makkah") && (
                          <p>• <strong>Makkah:</strong> {selectedMakkahHotel}</p>
                        )}
                        {(hotelCity === "both" || hotelCity === "madinah") && (
                          <p>• <strong>Madinah:</strong> {selectedMadinahHotel}</p>
                        )}
                        <p className="text-[11px] text-[#0A0A08]/60">Preference: {roomPreference}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-[#0A0A08]/60 pl-6">
                        Hotel preferences will be discussed and finalized with your Masaar advisor.
                      </p>
                    )}
                  </div>
                )}

                {/* 3. TRANSFERS REVIEW */}
                {transferStatus !== "none" && (
                  <div className="rounded-xl border border-black/10 bg-[#FAF7F2] p-3.5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">🚗</span>
                        <h4 className="text-xs font-bold text-[#0A0A08]">Private Transfers</h4>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                            transferStatus === "choose_now"
                              ? "bg-[#C9A227]/20 text-[#8F6407]"
                              : "bg-black/10 text-[#0A0A08]/60"
                          }`}
                        >
                          {transferStatus === "choose_now" ? "Configured" : "Decide Later"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="text-xs font-bold text-[#8F6407] hover:underline"
                      >
                        Edit
                      </button>
                    </div>

                    {transferStatus === "choose_now" ? (
                      <div className="flex items-center gap-3 pl-6">
                        <div className="relative size-12 shrink-0 rounded overflow-hidden bg-white border border-black/10">
                          <Image
                            src={selectedVehicleObj.image_url}
                            alt={`${selectedVehicleObj.name} private transfer vehicle`}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        </div>
                        <div className="text-xs text-[#0A0A08]/80">
                          <p className="font-bold text-[#0A0A08]">{selectedRouteObj.route_name}</p>
                          <p className="text-[11px] text-[#0A0A08]/60">
                            {selectedVehicleObj.name} · {selectedVehicleObj.passenger_capacity} Passengers · {selectedVehicleObj.luggage_capacity} Luggage
                          </p>
                          {vehiclePriceAed != null ? (
                            <p className="text-[11px] font-bold text-[#8F6407]">AED {vehiclePriceAed}</p>
                          ) : (
                            <p className="text-[11px] text-[#8F6407]">Price on request</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-[#0A0A08]/60 pl-6">
                        Private chauffeur route and vehicle will be coordinated later.
                      </p>
                    )}
                  </div>
                )}

                {/* 4. VISA REVIEW */}
                {visaStatus !== "none" && (
                  <div className="flex items-center justify-between rounded-xl border border-black/10 bg-[#FAF7F2] p-3.5">
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 items-center justify-center rounded-lg bg-white text-base shadow-2xs">
                        🛂
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-[#0A0A08]">Visa Assistance</h4>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                              visaStatus === "choose_now"
                                ? "bg-[#C9A227]/20 text-[#8F6407]"
                                : "bg-black/10 text-[#0A0A08]/60"
                            }`}
                          >
                            {visaStatus === "choose_now" ? "Configured" : "Decide Later"}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#0A0A08]/70">
                          {visaStatus === "choose_now"
                            ? `${visaType} · ${visaTravellers} applicant(s)`
                            : "Guidance requested for later step"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-xs font-bold text-[#8F6407] hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                )}

                {/* 5. eSIM REVIEW */}
                {esimStatus !== "none" && (
                  <div className="flex items-center justify-between rounded-xl border border-black/10 bg-[#FAF7F2] p-3.5">
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 items-center justify-center rounded-lg bg-white text-base shadow-2xs">
                        📱
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-[#0A0A08]">eSIM</h4>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                              esimStatus === "choose_now"
                                ? "bg-[#C9A227]/20 text-[#8F6407]"
                                : "bg-black/10 text-[#0A0A08]/60"
                            }`}
                          >
                            {esimStatus === "choose_now" ? "Configured" : "Decide Later"}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#0A0A08]/70">
                          {esimStatus === "choose_now"
                            ? `${esimPlan} · ${esimTravellers} device(s)`
                            : "eSIM setup assistance requested"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-xs font-bold text-[#8F6407] hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                )}

                {/* 6. FLIGHTS REVIEW */}
                {flightStatus !== "none" && (
                  <div className="flex items-center justify-between rounded-xl border border-black/10 bg-[#FAF7F2] p-3.5">
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 items-center justify-center rounded-lg bg-white text-base shadow-2xs">
                        ✈️
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-[#0A0A08]">Flights</h4>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                              flightStatus === "choose_now"
                                ? "bg-[#C9A227]/20 text-[#8F6407]"
                                : "bg-black/10 text-[#0A0A08]/60"
                            }`}
                          >
                            {flightStatus === "choose_now" ? "Configured" : "Decide Later"}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#0A0A08]/70">
                          {flightStatus === "choose_now"
                            ? `${flightOrigin} → ${flightDestination} (${flightCabin})`
                            : "Flight itinerary assistance requested"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-xs font-bold text-[#8F6407] hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                )}

                {/* 7. ZIYARAT REVIEW */}
                {(ziyaratMakkahStatus !== "none" || ziyaratMadinahStatus !== "none") && (
                  <div className="rounded-xl border border-black/10 bg-[#FAF7F2] p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">🕌</span>
                        <h4 className="text-xs font-bold text-[#0A0A08]">Private Tours / Ziyarat</h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="text-xs font-bold text-[#8F6407] hover:underline"
                      >
                        Edit
                      </button>
                    </div>
                    <div className="text-xs text-[#0A0A08]/80 pl-6 space-y-1">
                      {ziyaratMakkahStatus !== "none" && (
                        <p>
                          • <strong>Private Makkah Experience:</strong>{" "}
                          {ziyaratMakkahStatus === "choose_now" ? "Configured" : "Decide Later"}
                        </p>
                      )}
                      {ziyaratMadinahStatus !== "none" && (
                        <p>
                          • <strong>Private Madinah Sightseeing:</strong>{" "}
                          {ziyaratMadinahStatus === "choose_now" ? "Configured" : "Decide Later"}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* NOTES REVIEW */}
                {notes.trim() && (
                  <div className="rounded-xl border border-black/10 bg-[#FAF7F2] p-3.5">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-xs font-bold text-[#0A0A08]">Additional Notes</h4>
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="text-xs font-bold text-[#8F6407] hover:underline"
                      >
                        Edit
                      </button>
                    </div>
                    <p className="text-xs text-[#0A0A08]/70 italic leading-relaxed">
                      &ldquo;{notes.trim()}&rdquo;
                    </p>
                  </div>
                )}
              </div>

              {/* Action Button: Send Enquiry on WhatsApp */}
              <div className="pt-4 border-t border-black/10">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-wa-link={whatsappUrl}
                  data-wa-text={whatsappMessage}
                  className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#25D366] px-6 py-4 text-sm font-bold text-white shadow-md transition hover:bg-[#20bd5a]"
                >
                  <WhatsAppGlyph />
                  <span>Send Enquiry on WhatsApp →</span>
                </a>
                <p className="mt-2 text-center text-[11px] text-[#0A0A08]/50">
                  🔒 Your configured choices will be included in your WhatsApp message.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { UmrahEnquiryModal as PackageEnquiryModal };
