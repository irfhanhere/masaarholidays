/**
 * Single Authoritative Calculation & Date/Duration/Itinerary Engine
 * Masaar Holidays Quotation System
 *
 * Rules:
 * 1. Timezone-safe date arithmetic (UTC-based day calculation from YYYY-MM-DD strings).
 * 2. Itinerary calendar days match travel dates and duration exactly (e.g. 3-day trip produces exactly 3 itinerary days).
 * 3. Decimal-safe pricing arithmetic shared across Admin Builder, Saved DB State, Customer Viewer, Acceptance Flow, and WhatsApp.
 * 4. Explicit "Price on request" and "Included / Complimentary" states.
 * 5. Accurate category image resolution.
 */

export interface DateRangeMetrics {
  startDate: string;
  endDate: string;
  calendarDays: number;
  nights: number;
  durationLabel: string;
  dates: string[];
}

/**
 * Safely parse YYYY-MM-DD string into year, month (1-based), day.
 * Avoids any timezone offsets caused by `new Date("YYYY-MM-DD")` in local environments.
 */
export function parseDateParts(dateStr?: string | null): { year: number; month: number; day: number } | null {
  if (!dateStr || typeof dateStr !== "string") return null;
  const match = dateStr.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!match) return null;
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) return null;
  return { year, month, day };
}

/**
 * Format year, month (1-based), day back to YYYY-MM-DD string.
 */
export function formatIsoDate(year: number, month: number, day: number): string {
  const y = String(year).padStart(4, "0");
  const m = String(month).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Add N calendar days to a YYYY-MM-DD string safely.
 */
export function addDaysToIsoDate(dateStr: string, daysToAdd: number): string {
  const parts = parseDateParts(dateStr);
  if (!parts) return dateStr;
  const utcDate = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  utcDate.setUTCDate(utcDate.getUTCDate() + daysToAdd);
  return formatIsoDate(utcDate.getUTCFullYear(), utcDate.getUTCMonth() + 1, utcDate.getUTCDate());
}

/**
 * Calculate the exact difference in days between two YYYY-MM-DD strings.
 */
export function daysBetween(startStr: string, endStr: string): number {
  const p1 = parseDateParts(startStr);
  const p2 = parseDateParts(endStr);
  if (!p1 || !p2) return 0;
  const t1 = Date.UTC(p1.year, p1.month - 1, p1.day);
  const t2 = Date.UTC(p2.year, p2.month - 1, p2.day);
  return Math.round((t2 - t1) / (1000 * 60 * 60 * 24));
}

/**
 * Calculate duration metrics from travel dates.
 * Calendar days = daysBetween + 1 (inclusive of start and end date).
 * Nights = calendarDays - 1 (or 0 if same day).
 */
export function calculateDateRangeMetrics(
  startStr?: string | null,
  endStr?: string | null,
  fallbackDays = 4
): DateRangeMetrics {
  const s = startStr?.trim() || "";
  let e = endStr?.trim() || "";

  if (!s) {
    const today = new Date();
    const defaultStart = formatIsoDate(today.getUTCFullYear(), today.getUTCMonth() + 1, today.getUTCDate());
    const defaultEnd = addDaysToIsoDate(defaultStart, Math.max(1, fallbackDays - 1));
    const dates: string[] = [];
    for (let i = 0; i < fallbackDays; i++) {
      dates.push(addDaysToIsoDate(defaultStart, i));
    }
    return {
      startDate: defaultStart,
      endDate: defaultEnd,
      calendarDays: fallbackDays,
      nights: Math.max(0, fallbackDays - 1),
      durationLabel: `${fallbackDays} Days / ${Math.max(0, fallbackDays - 1)} Nights`,
      dates,
    };
  }

  // If start is provided but no return date, default to fallback
  if (!e) {
    e = addDaysToIsoDate(s, Math.max(0, fallbackDays - 1));
  }

  let diff = daysBetween(s, e);
  if (diff < 0) {
    // If return date is earlier than start date, normalize
    e = s;
    diff = 0;
  }

  const calendarDays = diff + 1;
  const nights = Math.max(0, diff);
  const durationLabel = `${calendarDays} Days / ${nights} Nights`;

  const dates: string[] = [];
  for (let i = 0; i < calendarDays; i++) {
    dates.push(addDaysToIsoDate(s, i));
  }

  return {
    startDate: s,
    endDate: e,
    calendarDays,
    nights,
    durationLabel,
    dates,
  };
}

/**
 * Formats a YYYY-MM-DD date string into human-readable editorial date:
 * e.g. "12 Oct 2026" or "Monday, 12 Oct 2026"
 */
export function formatDisplayDate(dateStr?: string | null, includeWeekday = false): string {
  const parts = parseDateParts(dateStr);
  if (!parts) return dateStr || "Date to be confirmed";
  const d = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
    ...(includeWeekday ? { weekday: "short" } : {}),
  };
  return new Intl.DateTimeFormat("en-GB", options).format(d);
}

// ─────────────────────────────────────────────────────────────────────────────
// ITINERARY BUILDER & RECONCILIATION
// ─────────────────────────────────────────────────────────────────────────────

export interface ItineraryDayItem {
  day: number;
  date: string;
  title: string;
  desc: string;
  icon?: string;
  activities?: string[];
  image_url?: string;
  timing?: string;
  notes?: string;
}

/**
 * Sequence realistic, authentic pilgrimage itinerary days for any arbitrary duration (1 to 30 days).
 */
export function buildSequencedPilgrimageDays(
  totalDays: number,
  startDate: string,
  isHajj = false
): ItineraryDayItem[] {
  const days = Math.max(1, totalDays);
  const result: ItineraryDayItem[] = [];

  for (let d = 1; d <= days; d++) {
    const date = addDaysToIsoDate(startDate, d - 1);

    if (isHajj) {
      if (d === 1) {
        result.push({
          day: d,
          date,
          title: "Arrival in Jeddah & VIP Transfer to Makkah",
          desc: "Meet & assist upon arrival at King Abdulaziz International Airport (JED). Private transfer to luxury hotel in Makkah, check-in, orientation seminar, and performing Umrah.",
          icon: "✈️",
          activities: ["Airport VIP Meet & Assist", "Private Transfer to Makkah", "Hotel Check-in & Orientation", "Performing Umrah at Masjid Al Haram"],
          image_url: "/hotels/intercontinental-dar-al-tawhid/hero.webp",
        });
      } else if (d === days) {
        result.push({
          day: d,
          date,
          title: "Tawaf Al-Wada & Safe Departure",
          desc: "Final prayers and farewell circumambulation (Tawaf Al-Wada) at the Holy Kaaba. Private transfer to airport for safe return flight.",
          icon: "✈️",
          activities: ["Tawaf Al-Wada", "Hotel Check-out", "Private Airport Transfer", "Return Flight"],
          image_url: "/Assets/AIRPORT TRANSFER.jpg",
        });
      } else if (d === 2) {
        result.push({
          day: d,
          date,
          title: "Yawm At-Tarwiyah — Transition to Mina Tents",
          desc: "Transition to VIP air-conditioned Mina tents in Ihram. Congregational prayers and spiritual preparation for Wuquf Arafat.",
          icon: "⛺",
          activities: ["Departure to Mina", "Settling in VIP Tents", "Qasr Prayers & Du'as", "Scholarly Hajj Guidance"],
        });
      } else if (d === 3) {
        result.push({
          day: d,
          date,
          title: "The Blessed Day of Arafat & Muzdalifah",
          desc: "The pinnacle of Hajj: Standing at Mount of Mercy (Jabal Ar-Rahmah) in Arafat from Dhuhr till Maghrib. Journey to Muzdalifah for overnight under the open sky.",
          icon: "🤲",
          activities: ["Wuquf in Arafat", "Khutbah & Du'as", "Transition to Muzdalifah", "Overnight Reflection & Pebbles Collection"],
        });
      } else if (d === 4) {
        result.push({
          day: d,
          date,
          title: "Yawm An-Nahr (Eid Day) — Jamarat & Tawaf Ifadah",
          desc: "Stoning of Jamarat Al-Aqaba, Qurbani sacrifice, Halq/Taqseer (exiting Ihram), and performing Tawaf Al-Ifadah & Sa'i at Masjid Al Haram.",
          icon: "🕋",
          activities: ["Ramy Al-Jamarat Al-Aqaba", "Qurbani Confirmation", "Halq / Haircut", "Tawaf Al-Ifadah & Sa'i"],
          image_url: "/hotels/swissotel-makkah/hero.jpg",
        });
      } else {
        result.push({
          day: d,
          date,
          title: `Ayyam At-Tashreeq — Days of Remembrance (Day ${d})`,
          desc: "Days of Tashreeq in Mina: Stoning all three Jamarat (Sughra, Wusta, Kubra) after Zawal, devotions, dhikr, and fellowship.",
          icon: "🕋",
          activities: ["Afternoon Jamarat Stoning", "Congregational Prayers", "Spiritual Reflections", "Scholarly Sessions"],
        });
      }
    } else {
      // UMRAH / CUSTOM PILGRIMAGE
      if (days === 1) {
        result.push({
          day: 1,
          date,
          title: "Arrival, Holy Umrah & Devotions",
          desc: "Arrival at Jeddah / Madinah, private transfer to hotel, check-in, and performing Holy Umrah at Masjid Al Haram.",
          icon: "🕋",
          activities: ["Arrival & Private Transfer", "Hotel Check-in", "Performing Holy Umrah", "Haram Devotions"],
          image_url: "/hotels/swissotel-makkah/hero.jpg",
        });
      } else if (d === 1) {
        result.push({
          day: 1,
          date,
          title: "Day 1: Arrival & Holy Umrah",
          desc: "Arrival at King Abdulaziz International Airport (JED), meet & assist, private transfer to luxury hotel in Makkah, check-in, and performing Holy Umrah at Masjid Al Haram.",
          icon: "✈️",
          activities: ["Airport VIP Meet & Assist", "Private Chauffeur Transfer to Makkah", "Hotel Check-in", "Guided Umrah at Masjid Al Haram"],
          image_url: "/hotels/intercontinental-dar-al-tawhid/hero.webp",
        });
      } else if (d === days) {
        result.push({
          day: d,
          date,
          title: `Day ${days}: Farewell Tawaf & Return Journey`,
          desc: "Final prayers and Tawaf Al-Wada at the Holy Kaaba. Hotel check-out and private transfer to airport for safe journey home.",
          icon: "✈️",
          activities: ["Farewell Prayers / Tawaf Al-Wada", "Hotel Check-out & Luggage Assistance", "Private Airport Transfer", "Return Flight"],
          image_url: "/Assets/AIRPORT TRANSFER.jpg",
        });
      } else if (days <= 3 && d === 2) {
        result.push({
          day: 2,
          date,
          title: "Day 2: Sacred Devotions & Guided Ziyarat",
          desc: "Congregational prayers at Masjid Al Haram followed by a private guided tour of sacred historical landmarks (Jabal Al-Noor, Cave of Hira, Jabal Thawr).",
          icon: "📍",
          activities: ["Fajr at Masjid Al Haram", "Private Guided Makkah Ziyarat", "Jabal Al-Noor & Jabal Thawr", "Tahajjud in Holy Courtyard"],
          image_url: "/trips/private-trip-makkah-card.webp",
        });
      } else if (d === 2) {
        result.push({
          day: 2,
          date,
          title: "Day 2: Holy Makkah Devotions & Haram Prayers",
          desc: "A day dedicated to congregational prayers, Quran recitation, and spiritual immersion in the serene courtyard of Masjid Al Haram.",
          icon: "🕋",
          activities: ["Five Daily Congregational Prayers", "Quran Recitation in Mataf", "Zamzam Well Devotions", "Evening Spiritual Gathering"],
          image_url: "/hotels/swissotel-al-maqam/hero.jpg",
        });
      } else if (d === 3) {
        result.push({
          day: 3,
          date,
          title: "Day 3: Guided Historical Ziyarat in Makkah",
          desc: "Private guided historical journey visiting Jabal Al-Noor (Cave of Hira), Jabal Thawr, Mina, Arafat (Jabal Ar-Rahmah), and Muzdalifah.",
          icon: "📍",
          activities: ["Private Chauffeur Pickup", "Cave of Hira & Jabal Thawr", "Plains of Arafat & Jabal Ar-Rahmah", "Mina & Muzdalifah Landmarks"],
          image_url: "/trips/private-trip-makkah-card.webp",
        });
      } else if (d === Math.ceil(days / 2)) {
        result.push({
          day: d,
          date,
          title: `Day ${d}: Journey to Madinah via Haramain High Speed Train`,
          desc: "Hotel check-out in Makkah, transfer to Haramain Train Station, first-class rail journey across the Hijaz desert to the Radiant City of Madinah Al-Munawwarah. Check-in and Salam at the Prophet's Mosque.",
          icon: "🚆",
          activities: ["Makkah Station Transfer", "Haramain High Speed Train", "Madinah Hotel Check-in", "Salam at Al-Masjid An-Nabawi & Rawdah"],
          image_url: "/trips/Makkah  Madinah ↔ Train Station.webp",
        });
      } else if (d === Math.ceil(days / 2) + 1) {
        result.push({
          day: d,
          date,
          title: `Day ${d}: Radiant Madinah Prayers & Ar-Rawdah Ash-Sharifah`,
          desc: "Blessed prayers at Al-Masjid An-Nabawi. Scheduled visit to Ar-Rawdah Ash-Sharifah with peace and contemplation.",
          icon: "🕌",
          activities: ["Fajr at Prophet's Mosque", "Ar-Rawdah Ash-Sharifah Entry", "Jannat Al-Baqi Visit", "Spiritual Reflection"],
          image_url: "/hotels/al-manakha-rotana-madinah/hero.jpg",
        });
      } else if (d === Math.ceil(days / 2) + 2) {
        result.push({
          day: d,
          date,
          title: `Day ${d}: Guided Historical Ziyarat in Madinah`,
          desc: "Private tour visiting Masjid Quba (first mosque in Islam), Mount Uhud & the Martyrs' Cemetery, and Masjid Al-Qiblatayn.",
          icon: "📍",
          activities: ["Masjid Quba Tahiyyatul Masjid", "Mount Uhud & Shuhada Uhud", "Masjid Al-Qiblatayn", "Seven Mosques (Khandaq)"],
          image_url: "/trips/private-trip-madinah-card.webp",
        });
      } else {
        result.push({
          day: d,
          date,
          title: `Day ${d}: Personal Worship & Spiritual Reflection`,
          desc: "Personal devotion, reflection, Quran recitation, and spending quiet moments in the holy sanctuary.",
          icon: "🤲",
          activities: ["Congregational Prayers", "Personal Supplications", "Islamic Heritage Lectures", "Evening Courtyard Walk"],
        });
      }
    }
  }

  return result;
}

/**
 * Reconcile an existing user-edited itinerary with new travel dates and duration.
 * PRESERVES manual titles, descriptions, and custom activities for existing days.
 * Ensures the output array has EXACTLY `targetDays` elements matching the dates sequence.
 */
export function reconcileItineraryDays(
  existingDays: ItineraryDayItem[] | null | undefined,
  targetDays: number,
  startDate: string,
  isHajj = false
): ItineraryDayItem[] {
  const count = Math.max(1, targetDays);
  const defaultSequence = buildSequencedPilgrimageDays(count, startDate, isHajj);

  if (!existingDays || !Array.isArray(existingDays) || existingDays.length === 0) {
    return defaultSequence;
  }

  const result: ItineraryDayItem[] = [];

  for (let i = 0; i < count; i++) {
    const dayNum = i + 1;
    const date = addDaysToIsoDate(startDate, i);
    const existing = existingDays[i];

    if (existing && existing.title && existing.title.trim()) {
      // Preserve user's manual title & description, but update day number & date
      result.push({
        ...existing,
        day: dayNum,
        date,
        // If the title started with "Day X:", update the day number to match current sequence
        title: existing.title.replace(/^Day\s*\d+\s*:\s*/i, `Day ${dayNum}: `),
        desc: existing.desc || "Activities as per confirmed schedule.",
      });
    } else {
      // Use sequenced fallback for newly added days
      const fallback = defaultSequence[i] || {
        day: dayNum,
        date,
        title: `Day ${dayNum}: Sacred Devotions & Personal Worship`,
        desc: "Personal devotions and congregational prayers at the Holy Mosque.",
        icon: "🕋",
      };
      result.push({
        ...fallback,
        day: dayNum,
        date,
      });
    }
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTHORITATIVE PRICING ENGINE
// ─────────────────────────────────────────────────────────────────────────────

export type PriceBasis =
  | "person"
  | "room"
  | "night"
  | "vehicle"
  | "transfer"
  | "trip"
  | "ticket"
  | "item"
  | "package"
  | "custom";

export interface LineItemPricingInput {
  id?: string;
  item_type: string;
  description: string;
  details?: string | null;
  quantity: number;
  unit?: string;
  price_basis?: PriceBasis;
  unit_price_aed: number;
  catalog_unit_price_aed?: number | null;
  is_overridden?: boolean;
  discount_aed?: number;
  tax_rate?: number; // e.g. 0.05
  is_price_on_request?: boolean;
  is_included?: boolean;
  display_order?: number;
}

export interface CalculatedLineItem {
  id?: string;
  item_type: string;
  description: string;
  details?: string | null;
  quantity: number;
  unit: string;
  unit_price_aed: number;
  catalog_unit_price_aed?: number | null;
  is_overridden: boolean;
  discount_aed: number;
  tax_rate: number;
  tax_aed: number;
  amount_aed: number;
  status: "priced" | "price_on_request" | "included";
  is_price_on_request: boolean;
  is_included: boolean;
  display_order: number;
}

export interface QuotationPricingSummary {
  items: CalculatedLineItem[];
  subtotalAed: number;
  discountAed: number;
  taxableBaseAed: number;
  taxAed: number;
  taxRatePercent: number;
  manualAdjustmentAed: number;
  manualAdjustmentReason?: string;
  totalAed: number;
  hasPriceOnRequest: boolean;
  unpricedCount: number;
  categories: {
    packagesAed: number;
    accommodationAed: number;
    transfersAed: number;
    flightsAed: number;
    otherServicesAed: number;
  };
}

/**
 * Authoritatively calculates line items and grand totals.
 * Handles rounding consistently to 2 decimal places.
 */
export function calculateQuotationTotals(
  items: LineItemPricingInput[],
  options: {
    applyVat?: boolean;
    vatRate?: number; // default 0.05 (5%)
    documentDiscountAed?: number;
    manualAdjustmentAed?: number;
    manualAdjustmentReason?: string;
    agreedTotalOverride?: number | null;
  } = {}
): QuotationPricingSummary {
  const applyVat = options.applyVat ?? false;
  const vatRate = options.vatRate ?? 0.05;
  const docDiscount = Math.max(0, Number(options.documentDiscountAed) || 0);
  const manualAdjustment = Number(options.manualAdjustmentAed) || 0;

  let subtotal = 0;
  let lineDiscounts = 0;
  let hasPriceOnRequest = false;
  let unpricedCount = 0;

  const categories = {
    packagesAed: 0,
    accommodationAed: 0,
    transfersAed: 0,
    flightsAed: 0,
    otherServicesAed: 0,
  };

  const calculatedItems: CalculatedLineItem[] = (items || []).map((item, idx) => {
    const qty = Math.max(1, Number(item.quantity) || 1);
    const unitPrice = Math.max(0, Number(item.unit_price_aed) || 0);
    const catalogPrice = item.catalog_unit_price_aed != null ? Number(item.catalog_unit_price_aed) : null;
    const isOverridden = Boolean(item.is_overridden || (catalogPrice != null && Math.abs(unitPrice - catalogPrice) > 0.01));
    const itemDiscount = Math.max(0, Number(item.discount_aed) || 0);

    let status: "priced" | "price_on_request" | "included" = "priced";
    let amount = 0;

    if (item.is_price_on_request) {
      status = "price_on_request";
      hasPriceOnRequest = true;
      unpricedCount++;
      amount = 0;
    } else if (item.is_included || unitPrice === 0) {
      status = "included";
      amount = 0;
    } else {
      status = "priced";
      amount = Math.max(0, Math.round((qty * unitPrice - itemDiscount) * 100) / 100);
      subtotal += qty * unitPrice;
      lineDiscounts += itemDiscount;
    }

    // Category breakdown
    const type = (item.item_type || "").toLowerCase();
    if (type.includes("package")) {
      categories.packagesAed += amount;
    } else if (type === "hotel" || type === "accommodation") {
      categories.accommodationAed += amount;
    } else if (type === "transfer" || type.includes("transport") || type.includes("cab")) {
      categories.transfersAed += amount;
    } else if (type === "flight") {
      categories.flightsAed += amount;
    } else {
      categories.otherServicesAed += amount;
    }

    return {
      id: item.id,
      item_type: item.item_type || "custom",
      description: item.description,
      details: item.details || null,
      quantity: qty,
      unit: item.unit || "item",
      unit_price_aed: unitPrice,
      catalog_unit_price_aed: catalogPrice,
      is_overridden: isOverridden,
      discount_aed: itemDiscount,
      tax_rate: item.tax_rate ?? (applyVat ? vatRate : 0),
      tax_aed: 0,
      amount_aed: amount,
      status,
      is_price_on_request: status === "price_on_request",
      is_included: status === "included",
      display_order: item.display_order ?? idx,
    };
  });

  const totalDiscount = Math.round((lineDiscounts + docDiscount) * 100) / 100;
  const taxableBase = Math.max(0, Math.round((subtotal - totalDiscount) * 100) / 100);
  const taxAed = applyVat ? Math.round(taxableBase * vatRate * 100) / 100 : 0;

  let grandTotal = Math.max(0, Math.round((taxableBase + taxAed + manualAdjustment) * 100) / 100);

  // If a manual agreed total override was explicitly entered by staff, honor it
  if (options.agreedTotalOverride != null && options.agreedTotalOverride >= 0) {
    grandTotal = Math.round(Number(options.agreedTotalOverride) * 100) / 100;
  }

  return {
    items: calculatedItems,
    subtotalAed: Math.round(subtotal * 100) / 100,
    discountAed: totalDiscount,
    taxableBaseAed: taxableBase,
    taxAed,
    taxRatePercent: applyVat ? Math.round(vatRate * 100) : 0,
    manualAdjustmentAed: manualAdjustment,
    manualAdjustmentReason: options.manualAdjustmentReason,
    totalAed: grandTotal,
    hasPriceOnRequest,
    unpricedCount,
    categories,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ACCURATE CATEGORY IMAGE RESOLUTION
// ─────────────────────────────────────────────────────────────────────────────

export interface CategoryImageResult {
  imageUrl: string;
  altText: string;
  badgeLabel: string;
}

/**
 * Resolves verified service category images.
 * Never displays Kaaba for flights, trains or cars.
 */
export function resolveServiceImage(
  category: string,
  title?: string | null,
  details?: string | null,
  customImageUrl?: string | null
): CategoryImageResult {
  if (customImageUrl && customImageUrl.trim()) {
    return {
      imageUrl: customImageUrl.trim(),
      altText: title || "Service image",
      badgeLabel: category.toUpperCase(),
    };
  }

  const cat = (category || "").toLowerCase();
  const text = `${title || ""} ${details || ""}`.toLowerCase();

  // 1. FLIGHTS
  if (cat.includes("flight") || text.includes("airline") || text.includes("emirates") || text.includes("saudia") || text.includes("flydubai")) {
    return {
      imageUrl: "/Assets/image-flight.jpg",
      altText: title || "Flight Journey",
      badgeLabel: "FLIGHT",
    };
  }

  // 2. TRAINS (Haramain High Speed)
  if (cat.includes("train") || text.includes("haramain") || text.includes("railway") || text.includes("station")) {
    return {
      imageUrl: "/trips/Makkah  Madinah ↔ Train Station.webp",
      altText: title || "Haramain High Speed Train",
      badgeLabel: "TRAIN",
    };
  }

  // 3. PRIVATE TRANSFERS & CABS
  if (cat.includes("transfer") || cat.includes("cab") || text.includes("gmc") || text.includes("yukon") || text.includes("sedan") || text.includes("staria")) {
    if (text.includes("gmc") || text.includes("yukon") || text.includes("suv") || text.includes("suburban")) {
      return {
        imageUrl: "/vehicles/gmc-yukon-suburban.webp",
        altText: title || "Private GMC Yukon XL",
        badgeLabel: "PRIVATE SUV",
      };
    }
    if (text.includes("staria") || text.includes("van") || text.includes("hiace") || text.includes("minivan")) {
      return {
        imageUrl: "/vehicles/staria.jpg",
        altText: title || "Private Luxury Van",
        badgeLabel: "LUXURY VAN",
      };
    }
    return {
      imageUrl: "/vehicles/sedan.jpg",
      altText: title || "Private Chauffeur Sedan",
      badgeLabel: "PRIVATE TRANSFER",
    };
  }

  // 4. ACCOMMODATION / HOTELS
  if (cat.includes("hotel") || cat.includes("accommodation")) {
    if (text.includes("tawhid") || text.includes("tawheed") || text.includes("intercontinental dar al tawhid")) {
      return {
        imageUrl: "/hotels/intercontinental-dar-al-tawhid/hero.webp",
        altText: title || "Dar Al Tawhid Intercontinental Makkah",
        badgeLabel: "5★ LUXURY HOTEL",
      };
    }
    if (text.includes("maqam")) {
      return {
        imageUrl: "/hotels/swissotel-al-maqam/hero.jpg",
        altText: title || "Swissôtel Al Maqam Makkah",
        badgeLabel: "5★ LUXURY HOTEL",
      };
    }
    if (text.includes("swiss")) {
      return {
        imageUrl: "/hotels/swissotel-makkah/hero.jpg",
        altText: title || "Swissôtel Makkah",
        badgeLabel: "5★ LUXURY HOTEL",
      };
    }
    if (text.includes("movenpick") || text.includes("anwar")) {
      return {
        imageUrl: "/hotels/anwar-al-madinah-movenpick/hero.jpg",
        altText: title || "Anwar Al Madinah Mövenpick",
        badgeLabel: "5★ LUXURY HOTEL",
      };
    }
    if (text.includes("rotana") || text.includes("manakha")) {
      return {
        imageUrl: "/hotels/al-manakha-rotana-madinah/hero.jpg",
        altText: title || "Al Manakha Rotana Madinah",
        badgeLabel: "5★ LUXURY HOTEL",
      };
    }
    if (text.includes("fairmont") || text.includes("clock")) {
      return {
        imageUrl: "/hotels/makkah-clock-royal-tower/hero.jpg",
        altText: title || "Makkah Clock Royal Tower Fairmont",
        badgeLabel: "5★ LUXURY HOTEL",
      };
    }
    if (text.includes("conrad")) {
      return {
        imageUrl: "/hotels/conrad-jabal-omar/hero.jpg",
        altText: title || "Conrad Jabal Omar Makkah",
        badgeLabel: "5★ LUXURY HOTEL",
      };
    }
    if (text.includes("madinah") || text.includes("medina")) {
      return {
        imageUrl: "/hotels/al-manakha-rotana-madinah/rooms/standard.jpg",
        altText: title || "Luxury Madinah Hotel",
        badgeLabel: "5★ HOTEL",
      };
    }
    return {
      imageUrl: "/hotels/conrad-jabal-omar/rooms/executive.jpg",
      altText: title || "Luxury Hotel Accommodation",
      badgeLabel: "5★ HOTEL",
    };
  }

  // 5. PRIVATE TRIPS & ZIYARAT
  if (cat.includes("ziyarat") || cat.includes("private_trip") || cat.includes("tour")) {
    if (text.includes("madinah") || text.includes("uhud") || text.includes("quba")) {
      return {
        imageUrl: "/trips/private-trip-madinah-card.webp",
        altText: title || "Historical Ziyarat in Madinah",
        badgeLabel: "ZIYARAT",
      };
    }
    return {
      imageUrl: "/trips/private-trip-makkah-card.webp",
      altText: title || "Historical Ziyarat in Makkah",
      badgeLabel: "ZIYARAT",
    };
  }

  // 6. VISA SERVICES
  if (cat.includes("visa")) {
    return {
      imageUrl: "/trips/visa-assistance-card-home.webp",
      altText: title || "Saudi Visa Processing",
      badgeLabel: "VISA SERVICE",
    };
  }

  // 7. MEALS & CATERING
  if (cat.includes("meal") || text.includes("buffet") || text.includes("breakfast") || text.includes("catering")) {
    return {
      imageUrl: "/Assets/image-meal.jpg",
      altText: title || "Gourmet Catering & Dining",
      badgeLabel: "MEALS",
    };
  }

  // 8. ESIM & CONNECTIVITY
  if (cat.includes("esim") || text.includes("data") || text.includes("sim")) {
    return {
      imageUrl: "/trips/destination-image.webp",
      altText: title || "High-Speed eSIM Connectivity",
      badgeLabel: "ESIM",
    };
  }

  // Default fallback
  return {
    imageUrl: "/Assets/hotel-hero.webp",
    altText: title || "Masaar Service",
    badgeLabel: "SERVICE",
  };
}
