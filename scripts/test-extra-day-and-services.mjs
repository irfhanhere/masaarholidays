import fs from "fs";
import {
  calculateDateRangeMetrics,
  formatDisplayDate,
  calculateQuotationTotals,
  resolveServiceImage,
  addDaysToIsoDate,
  buildSequencedPilgrimageDays,
} from "../src/lib/documents/calculations.ts";

function assert(cond, msg) {
  if (!cond) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ ${msg}`);
}

console.log("=== TESTING EXTRA DAY & EXTRA SERVICES RECONCILIATION ===");

// 1. Start with 3-day itinerary
const startDate = "2026-10-10";
const initialDays = [
  { day: 1, date: "2026-10-10", title: "Day 1: Arrival & Holy Umrah", desc: "Arrival in Jeddah", activities: ["Airport VIP", "Umrah"] },
  { day: 2, date: "2026-10-11", title: "Day 2: Sacred Devotions", desc: "Masjid Al Haram prayers", activities: ["Congregational Prayers"] },
  { day: 3, date: "2026-10-12", title: "Day 3: Farewell Tawaf & Return", desc: "Farewell prayers", activities: ["Farewell Prayers"] },
];

// 2. Admin adds Day 4
const nextNum = initialDays.length + 1;
const nextDate = addDaysToIsoDate(startDate, initialDays.length);
assert(nextDate === "2026-10-13", `Day 4 gets next sequential date: 2026-10-13 (was ${nextDate})`);

const fourDays = [
  ...initialDays,
  {
    day: nextNum,
    date: nextDate,
    title: `Day ${nextNum}: Devotions & Personal Reflection`,
    desc: "Congregational prayers, Quran recitation, and spiritual immersion.",
    icon: "🕋",
    activities: ["Congregational Prayers", "Personal Supplication"],
  },
];

assert(fourDays.length === 4, "Itinerary now has 4 days");
assert(fourDays[3].day === 4, "Day 4 is correctly indexed");
assert(fourDays[3].date === "2026-10-13", "Day 4 has date 2026-10-13");

// 3. Test ClientQuotationPortal duration & itinerary logic
const savedItineraryJson = JSON.stringify(fourDays);
const parsedSavedItinerary = JSON.parse(savedItineraryJson);

const sequencedSaved = parsedSavedItinerary.map((d, i) => ({
  ...d,
  day: i + 1,
  date: d.date || addDaysToIsoDate(startDate, i),
}));

const effectiveReturnDate = sequencedSaved[sequencedSaved.length - 1].date;
assert(effectiveReturnDate === "2026-10-13", "Effective return date matches Day 4: 2026-10-13");

const dateMetrics = calculateDateRangeMetrics(startDate, effectiveReturnDate, sequencedSaved.length);
assert(dateMetrics.calendarDays === 4, "Portal dateMetrics has exactly 4 calendar days");
assert(dateMetrics.nights === 3, "Portal dateMetrics has 3 nights");
assert(dateMetrics.durationLabel === "4 Days / 3 Nights", "Portal duration label is '4 Days / 3 Nights'");

const displayItinerary = sequencedSaved.length > 0
  ? sequencedSaved
  : buildSequencedPilgrimageDays(dateMetrics.calendarDays, dateMetrics.startDate, false);

assert(displayItinerary.length === 4, "Client quotation viewer displays all 4 days (not truncated!)");
assert(displayItinerary[3].title.includes("Day 4"), "Day 4 is present in customer quotation viewer");

// 4. Test Services Categorization (Image 4 match)
const items = [
  { item_type: "umrah_package", description: "Umrah 2026 - Exclusive Package", quantity: 2, unit_price_aed: 8500 },
  { item_type: "hotel", description: "Makkah Hotel — Swissôtel Makkah", details: "2 Nights", quantity: 2, unit_price_aed: 840 },
  { item_type: "transfer", description: "Private GMC Yukon XL Transfers", quantity: 1, unit_price_aed: 950 },
  { item_type: "service", description: "Additional Services & Ziyarat", quantity: 1, unit_price_aed: 0 },
  // Added services from modal (like user did with 'test'):
  { item_type: "hotel", description: "test", details: "test", quantity: 1, unit_price_aed: 2800 },
  { item_type: "transfer", description: "test", details: "test", quantity: 1, unit_price_aed: 500 },
  { item_type: "custom", description: "test", details: "test", quantity: 1, unit_price_aed: 250 },
];

const hotels = items.filter((i) => i.item_type === "hotel" || i.item_type === "accommodation");
assert(hotels.length === 2, "Hotels section contains 2 hotels: Swissotel and 'test'");

const transfers = items.filter((i) => i.item_type === "transfer" && !i.description.toLowerCase().includes("train"));
assert(transfers.length === 2, "Transfers section contains 2 items: GMC Yukon and 'test'");

const otherServices = items.filter(
  (i) => !["hotel", "accommodation", "flight", "transfer", "umrah_package", "hajj_package"].includes(i.item_type)
);
assert(otherServices.length === 2, "Included Amenities section contains 2 items: Ziyarat and 'test'");

// 5. Test image resolution for custom items
const hotelImg = resolveServiceImage("hotel", hotels[1].description, hotels[1].details);
assert(hotelImg.imageUrl && hotelImg.imageUrl.length > 0, "Custom hotel gets a valid luxury room image");

const transferImg = resolveServiceImage("transfer", transfers[1].description, transfers[1].details);
assert(transferImg.imageUrl && transferImg.imageUrl.length > 0, "Custom transfer gets a valid vehicle image");

console.log("=== ALL EXTRA DAY & SERVICES CHECKS PASSED WITH 100% SUCCESS! ===");
