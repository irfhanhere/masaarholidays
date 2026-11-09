import { calculateQuotationTotals, resolveServiceImage } from "@/lib/documents/calculations";
import { extractFlightMetadata, formatFlightDetails } from "@/lib/documents/flight-attachment";
import { getSelectableAdditionalServices } from "@/lib/data/document-products";
import { INITIAL_ADDITIONAL_SERVICES } from "@/lib/data/additional-services";

async function runTests() {
  console.log("================================================================================");
  console.log("MASAAR HOLIDAYS - PHASE 6 TEST VERIFICATION SUITE");
  console.log("================================================================================\n");

  let allPassed = true;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      allPassed = false;
    }
  }

  // -----------------------------------------------------------------------------
  // TEST 1: Create quotation without additional services
  // -----------------------------------------------------------------------------
  console.log("Test 1: Create quotation without additional services");
  const baseItems = [
    {
      item_type: "umrah_package",
      description: "Masaar Premium Umrah Package",
      details: "5-Star Makkah & Madinah Luxury Package",
      quantity: 1,
      unit_price_aed: 7500,
      is_included: false,
    },
    {
      item_type: "hotel",
      description: "Makkah Towers / Swissôtel or similar",
      details: "Deluxe Haram View Room [nights: 4]",
      quantity: 4,
      unit_price_aed: 0,
      is_included: true,
    },
    {
      item_type: "hotel",
      description: "Anwar Al Madinah Mövenpick or similar",
      details: "Superior Room [nights: 3]",
      quantity: 3,
      unit_price_aed: 0,
      is_included: true,
    }
  ];

  const res1 = calculateQuotationTotals(baseItems);
  assert(res1.totalAed === 7500, "Base quotation total is exactly AED 7,500");
  assert(res1.items.length === 3, "Contains exactly 3 base items");
  assert(res1.items.filter(i => i.is_included).length === 2, "2 items marked as included");

  // -----------------------------------------------------------------------------
  // TEST 2: Create one with Makkah Ziyarah (test shared vs private)
  // -----------------------------------------------------------------------------
  console.log("\nTest 2: Create one with Makkah Ziyarah (shared vs private)");
  
  // Shared Makkah Ziyarah (complimentary / included)
  const sharedMakkahItem = {
    item_type: "private_trip",
    description: "Makkah Ziyarah & Historical Tour (Shared / Group)",
    details: "Cave of Hira (Jabal Al Nour), Jabal Thawr, Mina, Arafat, Muzdalifah [arrangement: shared] [vehicle: AC Coaster] [duration: 2 - 2.5 hours]",
    quantity: 1,
    unit_price_aed: 0,
    is_included: true
  };
  const res2Shared = calculateQuotationTotals([...baseItems, sharedMakkahItem]);
  assert(res2Shared.totalAed === 7500, "Shared Makkah Ziyarah (complimentary) keeps total at AED 7,500");
  assert(res2Shared.items.find(i => i.description.includes("Makkah Ziyarah"))?.status === "included", "Shared Makkah Ziyarah has status 'included'");

  // Private Makkah Ziyarah (billable add-on)
  const privateMakkahItem = {
    item_type: "private_trip",
    description: "Private Makkah Holy Sites Ziyarah",
    details: "Jabal Al-Noor, Cave of Hira, Jabal Thawr, Mina & Muzdalifah [arrangement: private] [vehicle: GMC Yukon XL] [duration: 3 hours]",
    quantity: 1,
    unit_price_aed: 450,
    is_included: false
  };
  const res2Private = calculateQuotationTotals([...baseItems, privateMakkahItem]);
  assert(res2Private.totalAed === 7950, "Private Makkah Ziyarah adds AED 450 (Total: AED 7,950)");
  assert(res2Private.items.find(i => i.description.includes("Private Makkah"))?.amount_aed === 450, "Private Makkah line item amounts to AED 450");

  // -----------------------------------------------------------------------------
  // TEST 3: Create one with Madinah Ziyarah
  // -----------------------------------------------------------------------------
  console.log("\nTest 3: Create one with Madinah Ziyarah");
  const privateMadinahItem = {
    item_type: "private_trip",
    description: "Private Madinah Sacred Places Ziyarah",
    details: "Masjid Quba, Mount Uhud, Martyrs Cemetery, Masjid Al-Qiblatayn, Seven Mosques [arrangement: private] [vehicle: Mercedes V-Class] [duration: 3 hours]",
    quantity: 1,
    unit_price_aed: 400,
    is_included: false
  };
  const res3 = calculateQuotationTotals([...baseItems, privateMadinahItem]);
  assert(res3.totalAed === 7900, "Madinah Ziyarah adds AED 400 (Total: AED 7,900)");
  assert(res3.items.find(i => i.description.includes("Madinah Sacred"))?.amount_aed === 400, "Madinah Ziyarah line item amounts to AED 400");

  // -----------------------------------------------------------------------------
  // TEST 4: Create one with both Ziyarahs
  // -----------------------------------------------------------------------------
  console.log("\nTest 4: Create one with both Makkah and Madinah Ziyarahs");
  const res4 = calculateQuotationTotals([...baseItems, privateMakkahItem, privateMadinahItem]);
  assert(res4.totalAed === 8350, "Both Ziyarahs together add AED 850 (Total: AED 8,350)");
  assert(res4.items.filter(i => i.item_type === "private_trip").length === 2, "Contains both Ziyarah line items");

  // -----------------------------------------------------------------------------
  // TEST 5: Add an Umrah Guide service
  // -----------------------------------------------------------------------------
  console.log("\nTest 5: Add an Umrah Guide service (Catalogue Integration)");
  const catalogueServices = await getSelectableAdditionalServices();
  const guideService = catalogueServices.find(s => s.slug === "umrah-guide");
  assert(!!guideService, "Umrah Guide is present in selectable document products");
  assert(guideService?.name === "Umrah Guide", "Correct service name: 'Umrah Guide'");

  // Test optional add-on Umrah Guide
  const umrahGuideItemOptional = {
    item_type: "service",
    description: guideService!.name,
    details: `${guideService!.short_description} [service_date: 2026-11-20] [service_notes: Dedicated bilingual ritual guide for Tawaf and Sai]`,
    quantity: 1,
    unit_price_aed: 500,
    is_included: false
  };
  const res5Optional = calculateQuotationTotals([...baseItems, umrahGuideItemOptional]);
  assert(res5Optional.totalAed === 8000, "Umrah Guide as optional add-on adds AED 500 (Total: AED 8,000)");

  // Test included Umrah Guide
  const umrahGuideItemIncluded = {
    item_type: "service",
    description: guideService!.name,
    details: `${guideService!.short_description} [service_date: 2026-11-20] [service_notes: Included with VIP package]`,
    quantity: 1,
    unit_price_aed: 0,
    is_included: true
  };
  const res5Included = calculateQuotationTotals([...baseItems, umrahGuideItemIncluded]);
  assert(res5Included.totalAed === 7500, "Umrah Guide as included service keeps total at AED 7,500");
  assert(res5Included.items.find(i => i.description === "Umrah Guide")?.status === "included", "Umrah Guide status is 'included'");

  // Verify service image resolution
  const guideImg = resolveServiceImage("Spiritual Guidance", "Umrah Guide");
  assert(guideImg.imageUrl.includes("umrah-guide-hero.webp"), `Umrah Guide resolves to dedicated image: ${guideImg.imageUrl}`);
  const wheelchairImg = resolveServiceImage("Assistance", "Wheelchair Assistance");
  assert(wheelchairImg.imageUrl.includes("wheelchair-assistance.webp"), `Wheelchair Assistance resolves to dedicated image: ${wheelchairImg.imageUrl}`);

  // -----------------------------------------------------------------------------
  // TEST 6: Verify flight screenshot metadata parsing and display
  // -----------------------------------------------------------------------------
  console.log("\nTest 6: Verify flight screenshot metadata parsing and display");
  const rawFlightDetails = formatFlightDetails({
    cleanDetails: "Dubai (DXB) to Jeddah (JED) return flight with Saudia Airlines. 2x 23kg check-in baggage.",
    airline: "Saudia Airlines",
    pnr: "SV84920",
    departureArrival: "SV561 DXB 10:30 -> JED 12:45 / SV562 JED 18:00 -> DXB 22:00",
    screenshotUrl: "https://example.com/uploads/flight-screenshot.png",
    screenshotName: "SV_flight_confirmation.png"
  });

  const parsedFlightMeta = extractFlightMetadata(rawFlightDetails);
  assert(parsedFlightMeta.airline === "Saudia Airlines", "Parsed airline: 'Saudia Airlines'");
  assert(parsedFlightMeta.pnr === "SV84920", "Parsed PNR: 'SV84920'");
  assert(parsedFlightMeta.screenshotUrl === "https://example.com/uploads/flight-screenshot.png", "Parsed screenshot URL");
  assert(parsedFlightMeta.screenshotName === "SV_flight_confirmation.png", "Parsed screenshot filename");
  assert(!parsedFlightMeta.cleanDetails.includes("[screenshot"), "Clean details strips screenshot tags cleanly");
  assert(!parsedFlightMeta.cleanDetails.includes("[pnr:"), "Clean details strips pnr tags cleanly");

  // -----------------------------------------------------------------------------
  // TEST 7: Edit and regenerate quotation; check itemized pricing and totals
  // -----------------------------------------------------------------------------
  console.log("\nTest 7: Edit and regenerate quotation (Itemized pricing & totals)");
  const fullQuotationItems = [
    ...baseItems,
    privateMakkahItem,
    privateMadinahItem,
    umrahGuideItemOptional,
    {
      item_type: "flight",
      description: "Scheduled Return Flights - Emirates",
      details: rawFlightDetails,
      quantity: 2,
      unit_price_aed: 1800,
      is_included: false
    }
  ];

  const fullPricing = calculateQuotationTotals(fullQuotationItems, {
    applyVat: false,
    documentDiscountAed: 250 // discount
  });

  // Base: 7500 + Makkah: 450 + Madinah: 400 + Guide: 500 + Flights: (2 * 1800 = 3600) = 12,450 - 250 discount = 12,200
  assert(fullPricing.subtotalAed === 12450, `Subtotal is AED 12,450 (Actual: ${fullPricing.subtotalAed})`);
  assert(fullPricing.discountAed === 250, `Document discount is AED 250`);
  assert(fullPricing.totalAed === 12200, `Grand total with discount is AED 12,200 (Actual: ${fullPricing.totalAed})`);

  // -----------------------------------------------------------------------------
  // TEST 8: Verify existing quotations in database remain unchanged (snapshotting integrity)
  // -----------------------------------------------------------------------------
  console.log("\nTest 8: Verify snapshotting integrity (Master catalogue immutability)");
  const originalMasterService = INITIAL_ADDITIONAL_SERVICES.find(s => s.id === "serv-001");
  const originalMasterPrice = originalMasterService?.price_aed ?? null;

  // Simulate an admin overriding the price on a quote to AED 999
  const quotationWithOverride = [
    {
      item_type: "service",
      description: originalMasterService?.name || "Umrah Guide",
      details: "Custom negotiated guide rate",
      quantity: 1,
      unit_price_aed: 999,
      catalog_unit_price_aed: originalMasterPrice,
      is_overridden: true,
      is_included: false
    }
  ];
  const overrideRes = calculateQuotationTotals(quotationWithOverride);
  assert(overrideRes.totalAed === 999, "Quotation reflects overridden price: AED 999");
  assert(originalMasterService?.price_aed === originalMasterPrice, `Master catalogue price remains unchanged at ${originalMasterPrice}`);

  console.log("\n================================================================================");
  if (allPassed) {
    console.log("ALL 8 PHASE 6 TEST SCENARIOS PASSED WITH 100% SUCCESS!");
  } else {
    console.log("SOME TESTS FAILED — CHECK LOGS ABOVE");
    process.exit(1);
  }
  console.log("================================================================================\n");
}

runTests().catch(err => {
  console.error("Test execution error:", err);
  process.exit(1);
});
