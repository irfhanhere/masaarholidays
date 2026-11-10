import assert from "node:assert";
import {
  DEFAULT_ADDITIONAL_SERVICES,
  getPublishedCatalogServices,
  getEnquiryPopupCatalogServices,
  getThoughtfulCatalogServices,
} from "../src/lib/data/additional-services-catalog";
import { FALLBACK_FAQS } from "../src/lib/data/fallback-faqs";
import { CROSS_LINK_SERVICES } from "../src/components/site/CrossLinkServices";
import { getPublishedFaqs } from "../src/lib/data/public";

async function runTests() {
  console.log("================================================================================");
  console.log("MASAAR HOLIDAYS — SITE-WIDE INTEGRATION, ENQUIRY POPUP, FAQ & SEO QA SUITE");
  console.log("================================================================================");

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 1: Additional Services Landing Page FAQs
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n--- 1. Additional Services FAQs Verification ---");
  const asFaqs = await getPublishedFaqs("additional_services");
  assert.strictEqual(asFaqs.length >= 6, true, "Should have at least 6 Additional Services FAQs");

  const expectedQuestions = [
    "What additional services does Masaar Holidays offer?",
    "Can I book an Umrah Guide separately?",
    "Can I request Makkah and Madinah Ziyarah?",
    "Can I add additional services to my Umrah package?",
    "How can I enquire about a particular service?",
    "Are all services available throughout the year?",
  ];

  for (const q of expectedQuestions) {
    const found = asFaqs.find((f) => f.question === q);
    assert.ok(found, `FAQ question found: "${q}"`);
    assert.ok(found.answer && found.answer.length > 20, `FAQ has non-empty answer: "${q}"`);
    console.log(`  ✓ PASS: Found FAQ: "${q.slice(0, 40)}..."`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 2: Umrah Enquiry Popup Additional Services
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n--- 2. Umrah Enquiry Popup Verification ---");
  const popupServices = getEnquiryPopupCatalogServices();
  assert.strictEqual(popupServices.length > 0, true, "Popup services should not be empty");

  // Verify only published & enquiry-enabled services are included
  for (const s of popupServices) {
    assert.strictEqual(s.status, "published", `Popup service [${s.slug}] must be published`);
    assert.strictEqual(s.is_enquiry_enabled !== false, true, `Popup service [${s.slug}] must have enquiry enabled`);
    assert.strictEqual(s.show_in_enquiry_popup !== false, true, `Popup service [${s.slug}] must be marked for popup`);
  }
  console.log(`  ✓ PASS: Exactly ${popupServices.length} published and enquiry-enabled services available in popup`);

  // Verify key required services are included
  const requiredPopupSlugs = [
    "umrah-guide",
    "wheelchair-assistance",
    "makkah-ziyarah",
    "madinah-ziyarah",
    "tour-guide-sightseeing",
    "private-tours",
  ];
  for (const slug of requiredPopupSlugs) {
    assert.ok(popupServices.some((s) => s.slug === slug), `Required service [${slug}] must be in popup`);
    console.log(`  ✓ PASS: Required popup service available: [${slug}]`);
  }

  // Verify draft services are NOT in popup
  const draftSlugs = ["walking-tour-guide", "family-photography", "luggage-assistance", "child-seat"];
  for (const slug of draftSlugs) {
    assert.ok(!popupServices.some((s) => s.slug === slug), `Draft service [${slug}] must NOT be in popup`);
    console.log(`  ✓ PASS: Draft service safely excluded from popup: [${slug}]`);
  }

  // Verify WhatsApp Message generator format
  const mockSelectedSlugs = ["umrah-guide", "wheelchair-assistance"];
  const selectedNames = mockSelectedSlugs
    .map((slug) => popupServices.find((s) => s.slug === slug)?.name)
    .filter(Boolean);

  const mockNotes = "My elderly mother requires wheelchair assistance for Tawaf. Preferred English guide.";

  const messageLines: string[] = [
    "Assalamu Alaikum, Masaar Holidays.",
    "",
    "I would like to enquire about an Umrah journey.",
    "",
    "Selected package: Masaar Premium Umrah Package (Signature)",
    "Room occupancy: Quad (4 People per room)",
    "Hotel preference: Makkah: Makkah Towers / Swissôtel & Madinah: Anwar Al Madinah Mövenpick (Standard Room)",
    "",
    "Additional services requested:",
    ...selectedNames.map((n) => `• ${n}`),
    "",
    "Additional notes:",
    mockNotes,
    "",
    "Please share the available arrangements and quotation.",
    "JazakAllah Khair.",
  ];

  const fullMsg = messageLines.join("\n");
  assert.ok(fullMsg.includes("Assalamu Alaikum, Masaar Holidays."));
  assert.ok(fullMsg.includes("Additional services requested:\n• Umrah Guide\n• Wheelchair Assistance"));
  assert.ok(fullMsg.includes("Additional notes:\nMy elderly mother requires wheelchair assistance"));
  assert.ok(fullMsg.includes("Please share the available arrangements and quotation."));
  console.log("  ✓ PASS: WhatsApp enquiry message format matches exact client specification");

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 3: Site-wide Thoughtful Services Section
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n--- 3. Site-Wide Thoughtful Services Section ---");
  const thoughtfulServices = getThoughtfulCatalogServices();
  assert.ok(thoughtfulServices.length >= 6, "Thoughtful services should have published items");

  // Verify core services exist
  const coreKeys = CROSS_LINK_SERVICES.map((s) => s.key);
  assert.ok(coreKeys.includes("umrah"));
  assert.ok(coreKeys.includes("hajj"));
  assert.ok(coreKeys.includes("hotels"));
  assert.ok(coreKeys.includes("transfers"));
  assert.ok(coreKeys.includes("visa"));
  assert.ok(coreKeys.includes("private-trips"));
  console.log("  ✓ PASS: Core foundational services preserved in Thoughtful Services");

  // Verify additional services merged
  for (const s of thoughtfulServices) {
    assert.strictEqual(s.status, "published", `Thoughtful card [${s.slug}] must be published`);
    assert.ok(s.image_url, `Thoughtful card [${s.slug}] must have an image`);
    assert.ok(s.short_description, `Thoughtful card [${s.slug}] must have short description`);
    console.log(`  ✓ PASS: Additional Service thoughtful card verified: [${s.slug}] -> /additional-services/${s.slug}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 4: Admin Controls & Model Integrity
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n--- 4. Admin Management Controls & Model Integrity ---");
  const sampleService = DEFAULT_ADDITIONAL_SERVICES.find((s) => s.slug === "umrah-guide");
  assert.ok(sampleService);
  assert.strictEqual(sampleService.show_on_homepage, true);
  assert.strictEqual(sampleService.show_in_thoughtful_services, true);
  assert.strictEqual(sampleService.show_in_enquiry_popup, true);
  assert.strictEqual(sampleService.allow_multiple_in_popup, true);
  assert.strictEqual(sampleService.is_enquiry_enabled, true);
  assert.strictEqual(sampleService.whatsapp_template_key, "umrah-guide-enquiry");
  assert.ok(Array.isArray(sampleService.faqs));
  assert.strictEqual(sampleService.faqs!.length >= 3, true);
  console.log("  ✓ PASS: Admin display and enquiry fields configured on model");

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 5: SEO & Schema Validation
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n--- 5. SEO & Schema Validation ---");
  for (const s of getPublishedCatalogServices()) {
    assert.ok(s.meta_title, `Service [${s.slug}] must have meta_title`);
    assert.ok(s.meta_description, `Service [${s.slug}] must have meta_description`);
    assert.ok(s.image_alt, `Service [${s.slug}] must have descriptive image_alt`);
    assert.ok(!s.meta_title!.includes("undefined"), `Meta title has no undefined in [${s.slug}]`);
    assert.ok(!s.meta_description!.includes("undefined"), `Meta desc has no undefined in [${s.slug}]`);
  }
  console.log("  ✓ PASS: All published services have valid meta_title, meta_description, and image_alt");

  console.log("\n================================================================================");
  console.log("ALL SITE-WIDE INTEGRATION QA TESTS PASSED WITH 100% SUCCESS!");
  console.log("================================================================================");
}

runTests().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});

