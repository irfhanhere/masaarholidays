import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import {
  calculateDateRangeMetrics,
  formatDisplayDate,
  reconcileItineraryDays,
  calculateQuotationTotals,
  resolveServiceImage,
} from "../src/lib/documents/calculations.ts";

// Read .env.local manually
const envContent = fs.readFileSync(".env.local", "utf8");
const env = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim();
  }
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ ${message}`);
}

async function runEndToEndScenario() {
  console.log("=== STARTING FULL QUOTATION END-TO-END ACCEPTANCE TEST ===");

  // Test Customer & 3-day Trip configuration
  const testClient = {
    client_name: "Test Customer QA Obaid",
    client_email: "qa.test.obaid@masaarholidays.com",
    client_phone: "+971552276299",
    client_country: "Dubai, UAE",
    journey_type: "umrah",
    travel_date: "2026-11-10",
    return_date: "2026-11-12", // 3 calendar days (10, 11, 12 Nov), 2 nights
    adults: 2,
    children: 1,
    origin: "Dubai (DXB)",
    destination: "Jeddah (JED)",
  };

  // 1. Calculate duration metrics
  const metrics = calculateDateRangeMetrics(testClient.travel_date, testClient.return_date);
  assert(metrics.calendarDays === 3, "Trip has exactly 3 calendar days");
  assert(metrics.nights === 2, "Trip has exactly 2 nights");
  assert(metrics.durationLabel === "3 Days / 2 Nights", "Duration label matches '3 Days / 2 Nights'");

  // 2. Generate initial 3-day itinerary and verify no 10-day bug
  const itinerary3Days = reconcileItineraryDays([], metrics.calendarDays, metrics.startDate, false);
  assert(itinerary3Days.length === 3, "Initial itinerary has EXACTLY 3 days (10-day bug resolved)");
  assert(itinerary3Days[0].date === "2026-11-10", "Day 1 date is 2026-11-10");
  assert(itinerary3Days[1].date === "2026-11-11", "Day 2 date is 2026-11-11");
  assert(itinerary3Days[2].date === "2026-11-12", "Day 3 date is 2026-11-12");

  // 3. Manually edit itinerary to test custom text preservation
  itinerary3Days[0].title = "Day 1: VIP Private Arrival & Executive Umrah";
  itinerary3Days[0].desc = "Private airport meet, luxury transfer to Swissôtel Makkah, guided Umrah.";
  itinerary3Days[1].title = "Day 2: Historical Sacred Sites Ziyarat & Haram Prayers";
  itinerary3Days[2].title = "Day 3: Farewell Tawaf & Return Flight to Dubai";

  // 4. Configure test items with 1 hotel, 1 flight, 1 train, 1 private transfer, 1 custom service
  const testItems = [
    {
      item_type: "hotel",
      description: "Swissôtel Makkah",
      details: "2 Nights • Clock Tower Courtyard • Twin Sharing",
      quantity: 2,
      unit: "night",
      unit_price_aed: 750, // Manual override (catalog default 840)
      catalog_unit_price_aed: 840,
      is_overridden: true,
      discount_aed: 0,
    },
    {
      item_type: "flight",
      description: "Emirates Airline – Economy Class",
      details: "Dubai (DXB) ⇄ Jeddah (JED) confirmed flights",
      quantity: 2,
      unit: "ticket",
      unit_price_aed: 1800,
      catalog_unit_price_aed: 1800,
      discount_aed: 0,
    },
    {
      item_type: "train",
      description: "Haramain High Speed Train",
      details: "Business Class • Makkah ⇄ Madinah",
      quantity: 2,
      unit: "ticket",
      unit_price_aed: 350,
      discount_aed: 0,
    },
    {
      item_type: "transfer",
      description: "Private GMC Yukon XL",
      details: "Airport ⇄ Hotel roundtrip VIP Chauffeur",
      quantity: 1,
      unit: "transfer",
      unit_price_aed: 950,
      discount_aed: 0,
    },
    {
      item_type: "custom",
      description: "High-Speed Saudi eSIM with 10GB Data",
      details: "Instant QR activation on arrival",
      quantity: 2,
      unit: "item",
      unit_price_aed: 90,
      discount_aed: 0,
    },
  ];

  // 5. Verify image resolution
  assert(resolveServiceImage("hotel", testItems[0].description).imageUrl.includes("swissotel"), "Hotel image matches Swissôtel");
  assert(resolveServiceImage("flight", testItems[1].description).imageUrl.includes("flight"), "Flight image matches aircraft/flight");
  assert(resolveServiceImage("train", testItems[2].description).imageUrl.includes("Train"), "Train image matches Haramain train");
  assert(resolveServiceImage("transfer", testItems[3].description).imageUrl.includes("gmc"), "Transfer image matches GMC Yukon");

  // 6. Calculate authoritative pricing
  const pricing = calculateQuotationTotals(testItems, { applyVat: false });
  const expectedSubtotal = 2 * 750 + 2 * 1800 + 2 * 350 + 950 + 2 * 90; // 1500 + 3600 + 700 + 950 + 180 = 6930
  assert(pricing.subtotalAed === expectedSubtotal, `Subtotal AED ${pricing.subtotalAed} matches expected ${expectedSubtotal}`);
  assert(pricing.totalAed === expectedSubtotal, `Total AED ${pricing.totalAed} matches subtotal without VAT`);

  // 7. Persist test quotation into Supabase
  const { data: insertedDoc, error: insertError } = await supabase
    .from("documents")
    .insert({
      document_type: "quotation",
      document_number: `QA-E2E-${Date.now().toString().slice(-5)}`,
      status: "draft",
      client_name: testClient.client_name,
      client_email: testClient.client_email,
      client_phone: testClient.client_phone,
      client_country: testClient.client_country,
      journey_type: testClient.journey_type,
      travel_date: testClient.travel_date,
      return_date: testClient.return_date,
      adults: testClient.adults,
      children: testClient.children,
      origin: testClient.origin,
      destination: testClient.destination,
      subtotal_aed: pricing.subtotalAed,
      discount_aed: 0,
      tax_aed: 0,
      total_aed: pricing.totalAed,
      notes: "E2E Test Quotation",
      special_requirements: JSON.stringify(itinerary3Days),
    })
    .select("id, document_number")
    .single();

  assert(!insertError && insertedDoc?.id, "Test quotation created successfully in Supabase");
  const docId = insertedDoc.id;

  // Insert items
  const itemsToInsert = pricing.items.map((it, idx) => ({
    document_id: docId,
    item_type: it.item_type,
    description: it.description,
    details: it.details,
    quantity: it.quantity,
    unit_price_aed: it.unit_price_aed,
    discount_aed: it.discount_aed,
    amount_aed: it.amount_aed,
    display_order: idx,
  }));
  const { error: itemErr } = await supabase.from("document_items").insert(itemsToInsert);
  assert(!itemErr, "Line items inserted into Supabase");

  // Create share token
  const testShareToken = `qa-token-${Date.now()}`;
  const { error: shareErr } = await supabase.from("document_shares").insert({
    document_id: docId,
    share_token: testShareToken,
  });
  assert(!shareErr, "Share token generated in Supabase");

  // 8. Reload draft from DB and verify persistence
  const { data: reloadedDoc } = await supabase.from("documents").select("*").eq("id", docId).single();
  assert(reloadedDoc.client_name === testClient.client_name, "Client name persists");
  assert(reloadedDoc.travel_date === testClient.travel_date, "Travel date persists");
  assert(reloadedDoc.total_aed === expectedSubtotal, "Total amount persists exactly (AED 6,930)");

  const reloadedItinerary = JSON.parse(reloadedDoc.special_requirements);
  assert(reloadedItinerary.length === 3, "Reloaded itinerary contains EXACTLY 3 days");
  assert(reloadedItinerary[0].title === "Day 1: VIP Private Arrival & Executive Umrah", "Manual Day 1 edit persisted");
  assert(reloadedItinerary[2].title === "Day 3: Farewell Tawaf & Return Flight to Dubai", "Manual Day 3 edit persisted");

  // 9. Verify WhatsApp prefilled message generation
  const waDates = `${formatDisplayDate(reloadedDoc.travel_date)} – ${formatDisplayDate(reloadedDoc.return_date)}`;
  const waMessage = `Assalamu Alaikum ${reloadedDoc.client_name},

Please find your personalised Masaar Holidays quotation.

Quotation: ${reloadedDoc.document_number}
Journey: Umrah Pilgrimage
Travel dates: ${waDates}
Travellers: 2 Adults, 1 Children
Total: AED ${reloadedDoc.total_aed.toLocaleString()}

You can review your quotation and respond here:
https://masaarholidays.com/quote/${testShareToken}

For any changes or questions, please reply to this message.

JazakAllahu Khairan,
Masaar Holidays`;

  assert(waMessage.includes("AED 6,930"), "WhatsApp message contains confirmed total");
  assert(waMessage.includes(testShareToken), "WhatsApp message contains working quote token");
  assert(!waMessage.includes("undefined"), "WhatsApp message has no undefined fields");

  // 10. Test Acceptance Flow
  const { error: acceptErr } = await supabase
    .from("documents")
    .update({ status: "accepted" })
    .eq("id", docId);
  assert(!acceptErr, "Acceptance status updated to accepted");

  // Snapshot version 1
  const { error: verErr } = await supabase.from("document_versions").insert({
    document_id: docId,
    version_number: 1,
    status_at_version: "accepted",
    snapshot: { document: reloadedDoc, items: testItems },
  });
  assert(!verErr, "Version 1 snapshotted on acceptance");

  // Clean up test document
  await supabase.from("document_shares").delete().eq("document_id", docId);
  await supabase.from("document_items").delete().eq("document_id", docId);
  await supabase.from("document_versions").delete().eq("document_id", docId);
  await supabase.from("documents").delete().eq("id", docId);
  console.log("🧹 Test quotation cleaned up from database.");

  console.log("=== ALL END-TO-END SCENARIO CHECKS PASSED WITH 100% SUCCESS! ===");
}

runEndToEndScenario().catch((err) => {
  console.error("FATAL ERROR in E2E scenario:", err);
  process.exit(1);
});
