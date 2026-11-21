import fs from "node:fs";
import path from "node:path";

// Load environment variables from .env.local
const envContent = fs.readFileSync(path.resolve(".env.local"), "utf8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const idx = trimmed.indexOf("=");
  if (idx !== -1) {
    const k = trimmed.slice(0, idx).trim();
    const v = trimmed.slice(idx + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
}

const { createClient } = await import("@supabase/supabase-js");
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runQaTests() {
  console.log("==================================================================");
  console.log(" MASAAR HOLIDAYS — ADMIN CMS & CONTENT MANAGEMENT QA SUITE");
  console.log("==================================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, detail = "") {
    if (condition) {
      console.log(`✓ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`✗ [FAIL] ${testName} ${detail ? "— " + detail : ""}`);
      failed++;
    }
  }

  // --- TEST 1: Best Selling Package Record Exists & Has Expected Shape ---
  console.log("\n▶ TEST 1: Authoritative Best Selling Package Database Record");
  const { data: pkg, error: pkgErr } = await supabase
    .from("premium_umrah_packages")
    .select("*")
    .eq("slug", "masaar-best-selling-umrah")
    .single();

  assert(!pkgErr && pkg !== null, "Package 'masaar-best-selling-umrah' exists in database", pkgErr?.message);
  assert(pkg?.id === "1aa5d09c-0779-4c09-a677-51bfa3f5dd32", "Package ID matches expected UUID: 1aa5d09c-0779-4c09-a677-51bfa3f5dd32");
  assert(pkg?.status === "published", "Package status is 'published'");
  assert(pkg?.show_on_homepage === true, "show_on_homepage is true");
  assert(pkg?.show_on_umrah_page === true, "show_on_umrah_page is true");
  assert(Array.isArray(pkg?.pricing) && pkg.pricing.length === 5, "Package has exactly 5 room pricing tiers");

  // Check specific room prices
  const quadPrice = pkg?.pricing?.find((p) => p.room_type === "Quad Room")?.price_aed;
  const triplePrice = pkg?.pricing?.find((p) => p.room_type === "Triple Room")?.price_aed;
  const doublePrice = pkg?.pricing?.find((p) => p.room_type === "Double Room")?.price_aed;
  const singlePrice = pkg?.pricing?.find((p) => p.room_type === "Single Room")?.price_aed;
  const childPrice = pkg?.pricing?.find((p) => p.room_type === "Child with Bed")?.price_aed;

  assert(quadPrice === 3900, "Quad Room price is AED 3,900");
  assert(triplePrice === 4100, "Triple Room price is AED 4,100");
  assert(doublePrice === 4500, "Double Room price is AED 4,500");
  assert(singlePrice === 6400, "Single Room price is AED 6,400");
  assert(childPrice === 2700, "Child with Bed price is AED 2,700");

  // Check hotels
  assert(pkg?.hotels?.length === 2, "Package contains exactly 2 hotels (Makkah & Madinah)");
  const makkahHotel = pkg?.hotels?.find((h) => h.city === "Makkah")?.hotel_name;
  const madinahHotel = pkg?.hotels?.find((h) => h.city === "Madinah")?.hotel_name;
  assert(makkahHotel === "DoubleTree by Hilton Makkah", "Makkah hotel is DoubleTree by Hilton Makkah");
  assert(madinahHotel === "Worth Tharawat Hotel", "Madinah hotel is Worth Tharawat Hotel");

  // Check inclusions (9 items)
  assert(pkg?.inclusions?.length === 9, "Package has all 9 confirmed inclusions");

  // --- TEST 2: Package Mutation & Controlled Rollback Test ---
  console.log("\n▶ TEST 2: Package Mutation & Immediate Data Rollback");
  const testNote = "Automated QA Test Note " + Date.now();
  const originalShortDesc = pkg.short_description;

  // 2a. Update test field
  const { data: updateData, error: updateErr } = await supabase
    .from("premium_umrah_packages")
    .update({ short_description: testNote })
    .eq("id", pkg.id)
    .select("short_description")
    .single();

  assert(!updateErr && updateData?.short_description === testNote, "Successfully mutated test field on package record");

  // 2b. Restore original field
  const { data: restoreData, error: restoreErr } = await supabase
    .from("premium_umrah_packages")
    .update({ short_description: originalShortDesc })
    .eq("id", pkg.id)
    .select("short_description")
    .single();

  assert(!restoreErr && restoreData?.short_description === originalShortDesc, "Successfully restored original package field value");

  // --- TEST 3: Homepage CMS Settings Persistence ---
  console.log("\n▶ TEST 3: Homepage CMS Persistence");
  const testCms = {
    tamara_enabled: true,
    tamara_heading: "Flexible Payments with Tamara",
    tamara_subtitle: "Enjoy a convenient payment experience with Tamara. Choose Tamara at checkout when available.",
    featured_package_slug: "masaar-premium-umrah",
    best_selling_slug: "masaar-best-selling-umrah",
    explore_more_enabled: true,
    explore_more_heading: "Explore More Umrah Packages",
    explore_more_button_url: "/umrah",
  };

  const { error: cmsErr } = await supabase.from("legal_pages").upsert({
    key: "cms_homepage_settings",
    title: "CMS Homepage Settings",
    content: JSON.stringify(testCms),
    updated_at: new Date().toISOString(),
  });

  assert(!cmsErr, "Successfully persisted Homepage CMS settings in Supabase");

  const { data: cmsRead } = await supabase
    .from("legal_pages")
    .select("content")
    .eq("key", "cms_homepage_settings")
    .single();

  const parsedCms = JSON.parse(cmsRead?.content || "{}");
  assert(parsedCms.tamara_heading === "Flexible Payments with Tamara", "Retrieved Tamara heading matches persisted setting");
  assert(parsedCms.explore_more_button_url === "/umrah", "Retrieved button URL is /umrah");

  // --- TEST 4: Payment Display Settings Persistence ---
  console.log("\n▶ TEST 4: Payment Display Settings Persistence");
  const testPaymentSettings = {
    tabby_promo_enabled: false,
    tabby_enquiry_message: "Interested in paying with Tabby? Contact our team on WhatsApp for assistance. Tabby payment integration is currently being updated.",
    tabby_whatsapp_number: "971557329320",
    tamara_promo_enabled: true,
    tamara_heading: "Flexible Payments with Tamara",
    tamara_description: "Enjoy a convenient payment experience with Tamara. Choose Tamara at checkout when available.",
  };

  const { error: payErr } = await supabase.from("legal_pages").upsert({
    key: "cms_payment_display_settings",
    title: "CMS Payment Display Settings",
    content: JSON.stringify(testPaymentSettings),
    updated_at: new Date().toISOString(),
  });

  assert(!payErr, "Successfully persisted Payment Display settings in Supabase");

  const { data: payRead } = await supabase
    .from("legal_pages")
    .select("content")
    .eq("key", "cms_payment_display_settings")
    .single();

  const parsedPay = JSON.parse(payRead?.content || "{}");
  assert(parsedPay.tabby_promo_enabled === false, "Tabby promotional display is disabled by default");
  assert(parsedPay.tamara_promo_enabled === true, "Tamara promotional display is enabled");
  assert(parsedPay.tabby_whatsapp_number === "971557329320", "Tabby WhatsApp contact matches validated business number");

  // --- TEST 5: Security & Audit Logging Verification ---
  console.log("\n▶ TEST 5: Admin Audit Log System");
  const { data: auditLogs, error: auditErr } = await supabase
    .from("admin_audit_logs")
    .select("id, action, resource_type, admin_email")
    .limit(3);

  assert(!auditErr, "admin_audit_logs table is accessible by authenticated service role", auditErr?.message);
  console.log("Recent audit log entries found:", auditLogs?.length || 0);

  // --- TEST 6: Check Clean Tamara & Package Neutral Copy in Source ---
  console.log("\n▶ TEST 6: Inspection for Unsupported Marketing Claims");
  const tamaraHighlightFile = fs.readFileSync(path.resolve("src/components/site/TamaraHighlight.tsx"), "utf8");
  const hasShariaClaim = tamaraHighlightFile.includes("Shariah-Compliant Process") || tamaraHighlightFile.includes("Sharia-compliant");
  const hasZeroInterest = tamaraHighlightFile.includes("Zero Hidden Fees") || tamaraHighlightFile.includes("Zero interest");
  const hasInstantApproval = tamaraHighlightFile.includes("Instant Digital Approval");

  assert(!hasShariaClaim, "TamaraHighlight does not contain unverified Sharia certification claims");
  assert(!hasZeroInterest, "TamaraHighlight does not contain unverified interest/fee claims");
  assert(!hasInstantApproval, "TamaraHighlight does not contain instant approval claim");

  console.log("\n==================================================================");
  console.log(` QA SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================================");

  if (failed > 0) process.exit(1);
}

runQaTests();
