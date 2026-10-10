import {
  parseDateParts,
  daysBetween,
  addDaysToIsoDate,
  calculateDateRangeMetrics,
  formatDisplayDate,
  reconcileItineraryDays,
  calculateQuotationTotals,
  resolveServiceImage,
} from "../src/lib/documents/calculations.ts";

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ ${message}`);
}

console.log("=== RUNNING CALCULATIONS & DATE INTEGRITY TESTS ===");

// 1. Date parsing and boundary checks
const parts = parseDateParts("2026-10-12");
assert(parts.year === 2026 && parts.month === 10 && parts.day === 12, "parseDateParts extracts exact Y-M-D");

const nextDay = addDaysToIsoDate("2026-10-31", 1);
assert(nextDay === "2026-11-01", "Month boundary transition: Oct 31 -> Nov 01");

const leapDay = addDaysToIsoDate("2028-02-28", 1);
assert(leapDay === "2028-02-29", "Leap year test: Feb 28 2028 -> Feb 29 2028");

const diff = daysBetween("2026-10-12", "2026-10-15");
assert(diff === 3, "daysBetween returns exact 3 days diff");

// 2. 3-day trip duration test (DEFECT 1 reproduction & fix)
const metrics3Day = calculateDateRangeMetrics("2026-10-12", "2026-10-14");
assert(metrics3Day.calendarDays === 3, "3-day trip has exactly 3 calendar days");
assert(metrics3Day.nights === 2, "3-day trip has exactly 2 nights");
assert(metrics3Day.durationLabel === "3 Days / 2 Nights", "Duration label matches '3 Days / 2 Nights'");
assert(metrics3Day.dates.length === 3, "Produces exact 3 date items");
assert(metrics3Day.dates[0] === "2026-10-12", "Day 1 is 2026-10-12");
assert(metrics3Day.dates[1] === "2026-10-13", "Day 2 is 2026-10-13");
assert(metrics3Day.dates[2] === "2026-10-14", "Day 3 is 2026-10-14");

// 3. Itinerary builder test (DEFECT 1: 3-day trip showing 10 days)
const itinerary3Day = reconcileItineraryDays([], 3, "2026-10-12", false);
assert(itinerary3Day.length === 3, "3-day quotation itinerary produces EXACTLY 3 days (not 10)");
assert(itinerary3Day[0].day === 1 && itinerary3Day[0].date === "2026-10-12", "Itinerary day 1 date is valid");
assert(itinerary3Day[2].day === 3 && itinerary3Day[2].date === "2026-10-14", "Itinerary day 3 date is valid");

// 4. Manual edit preservation when reconciling duration
const manualDays = [
  { day: 1, date: "2026-10-12", title: "Day 1: Arrival & Private VIP Lounge", desc: "Custom arrival notes." },
  { day: 2, date: "2026-10-13", title: "Day 2: Special Rawdah Appointment", desc: "Specific Rawdah permit slot." },
];
const reconciled4Day = reconcileItineraryDays(manualDays, 4, "2026-10-12", false);
assert(reconciled4Day.length === 4, "Reconciled itinerary expands to 4 days");
assert(reconciled4Day[0].title === "Day 1: Arrival & Private VIP Lounge", "Preserves manual Day 1 title");
assert(reconciled4Day[1].desc === "Specific Rawdah permit slot.", "Preserves manual Day 2 description");
assert(reconciled4Day[3].day === 4 && reconciled4Day[3].date === "2026-10-15", "Day 4 added with correct sequenced date");

// 5. Authoritative Pricing Tests (DEFECT 3 & 4 & 10)
const items = [
  {
    item_type: "hotel",
    description: "Swissôtel Makkah",
    quantity: 3,
    unit: "night",
    unit_price_aed: 750, // Catalog default might be 840, staff agreed 750
    catalog_unit_price_aed: 840,
    is_overridden: true,
  },
  {
    item_type: "transfer",
    description: "Private GMC Yukon",
    quantity: 1,
    unit: "transfer",
    unit_price_aed: 950,
  },
  {
    item_type: "flight",
    description: "Special Chartered Flight",
    quantity: 2,
    unit: "ticket",
    unit_price_aed: 0,
    is_price_on_request: true, // Awaiting price from supplier
  },
  {
    item_type: "service",
    description: "VIP Assistance",
    quantity: 1,
    unit_price_aed: 0,
    is_included: true, // Complimentary
  },
];

const pricingSummary = calculateQuotationTotals(items, { applyVat: false });
assert(pricingSummary.subtotalAed === 3 * 750 + 950, "Subtotal calculated accurately (2250 + 950 = 3200)");
assert(pricingSummary.hasPriceOnRequest === true, "Identifies price-on-request items without treating as 0 price confirmation");
assert(pricingSummary.unpricedCount === 1, "Unpriced count is 1");
assert(pricingSummary.totalAed === 3200, "Grand total matches 3200 AED with no VAT");

// Overridden agreed total
const manualAgreedPricing = calculateQuotationTotals(items, { agreedTotalOverride: 3000 });
assert(manualAgreedPricing.totalAed === 3000, "Allows staff to set agreed total (3000 AED) without being overwritten");

// 6. Category Image Resolution Test (DEFECT 6)
const flightImg = resolveServiceImage("flight", "Emirates Business Class");
assert(flightImg.imageUrl.includes("flight"), "Flight service receives aircraft/flight image, never Kaaba or train");

const trainImg = resolveServiceImage("train", "Haramain High Speed Train");
assert(trainImg.imageUrl.includes("Train"), "Train receives Haramain train image, never car or hotel");

const transferImg = resolveServiceImage("transfer", "GMC Yukon XL VIP Transfer");
assert(transferImg.imageUrl.includes("gmc") || transferImg.imageUrl.includes("suburban"), "SUV transfer receives GMC Yukon image");

console.log("=== ALL CALCULATIONS & INTEGRITY TESTS PASSED SUCCESSFULLY! ===");
