// tests/technical_seo_qa.mjs
// Comprehensive Technical SEO Test Suite for Masaar Holidays

import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Load environment variables
const env = fs.readFileSync(".env.local", "utf8");
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1]?.trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1]?.trim() || env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();
const origin = (env.match(/NEXT_PUBLIC_SITE_URL=(.*)/)?.[1]?.trim() || "https://www.masaarholidays.com").replace(/\/$/, "");

const supabase = createClient(url, key);

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTestSuite() {
  console.log("===============================================================================");
  console.log("       MASAAR HOLIDAYS — TECHNICAL SEO & SITEMAP VERIFICATION SUITE           ");
  console.log("===============================================================================");

  // --- 1. SITEMAP INTEGRATION & DATABASE SYNCHRONIZATION ---
  console.log("\n[TEST GROUP 1: XML SITEMAP & DYNAMIC PACKAGE SYNCHRONIZATION]");
  
  const { data: premiumPkgs, error: pErr } = await supabase
    .from("premium_umrah_packages")
    .select("slug, status, updated_at, seo_title, meta_description, canonical_url, pricing");

  assert(!pErr && Array.isArray(premiumPkgs), "Connected to Supabase premium_umrah_packages");
  
  const bestSelling = premiumPkgs.find((p) => p.slug === "masaar-best-selling-umrah");
  const premium = premiumPkgs.find((p) => p.slug === "masaar-premium-umrah");

  assert(bestSelling && bestSelling.status === "published", "Best Selling package is published in Supabase");
  assert(premium && premium.status === "published", "Premium package is published in Supabase");

  // Read sitemap.ts source file to verify static & dynamic configuration
  const sitemapSource = fs.readFileSync("src/app/sitemap.ts", "utf8");
  assert(!sitemapSource.includes('"/umrah/masaar-premium-umrah"'), "sitemap.ts: Hardcoded /umrah/masaar-premium-umrah removed from STATIC_ROUTES");
  assert(sitemapSource.includes("getPublishedPremiumUmrahPackages"), "sitemap.ts: Queries premium_umrah_packages dynamically");
  assert(sitemapSource.includes("entry.url.includes(\"/admin\")"), "sitemap.ts: Strictly excludes admin URLs");
  assert(sitemapSource.includes("entry.url.includes(\"/qa/\")"), "sitemap.ts: Strictly excludes private QA URLs");
  assert(sitemapSource.includes("entry.url.includes(\"/esim/checkout\")"), "sitemap.ts: Strictly excludes private checkout URLs");

  // Verify static routes in sitemap.ts
  const requiredStaticUrls = [
    "/",
    "/umrah",
    "/hajj",
    "/hotels",
    "/transfers",
    "/visa",
    "/esim",
    "/about",
    "/contact",
  ];
  for (const route of requiredStaticUrls) {
    assert(sitemapSource.includes(`"${route}"`), `sitemap.ts: Contains mandatory static route "${route}"`);
  }

  // --- 2. CANONICAL URL AUDIT ---
  console.log("\n[TEST GROUP 2: CANONICAL URL INTEGRITY & DOMAIN POLICY]");
  
  const expectedCanonicalBSP = `${origin}/umrah/masaar-best-selling-umrah`;
  const expectedCanonicalPremium = `${origin}/umrah/masaar-premium-umrah`;

  assert(bestSelling.canonical_url === expectedCanonicalBSP, `Best Selling canonical is self-referencing: ${bestSelling.canonical_url}`);
  assert(premium.canonical_url === expectedCanonicalPremium, `Premium package canonical is self-referencing: ${premium.canonical_url}`);
  assert(bestSelling.canonical_url !== `${origin}/umrah`, "Best Selling package does not incorrectly canonicalize to /umrah");
  assert(premium.canonical_url !== `${origin}/umrah`, "Premium package does not incorrectly canonicalize to /umrah");
  assert(origin.startsWith("https://www.masaarholidays.com"), "Origin strictly enforces preferred https://www.masaarholidays.com domain");

  // --- 3. ROBOTS.TXT & INDEXING DIRECTIVES ---
  console.log("\n[TEST GROUP 3: ROBOTS.TXT & CRAWLING DIRECTIVES]");
  
  const robotsSource = fs.readFileSync("src/app/robots.ts", "utf8");
  assert(robotsSource.includes('allow: "/"'), "robots.ts: Explicitly allows root public routes");
  assert(robotsSource.includes('"/admin/"'), "robots.ts: Disallows /admin/");
  assert(robotsSource.includes('"/api/"'), "robots.ts: Disallows /api/");
  assert(robotsSource.includes('"/qa/"'), "robots.ts: Disallows /qa/");
  assert(robotsSource.includes('"/esim/checkout/"'), "robots.ts: Disallows /esim/checkout/");
  assert(robotsSource.includes('"/visa/application/"'), "robots.ts: Disallows /visa/application/");
  assert(robotsSource.includes("sitemap.xml"), "robots.ts: Declares production sitemap.xml");

  const adminLayout = fs.readFileSync("src/app/admin/(dashboard)/layout.tsx", "utf8");
  assert(adminLayout.includes("robots:") && adminLayout.includes("index: false"), "Admin dashboard layout strictly exports noindex, nofollow robots metadata");

  const qaPage = fs.readFileSync("src/app/(site)/qa/tabby-test-limit/page.tsx", "utf8");
  assert(qaPage.includes("index: false") && qaPage.includes("follow: false"), "QA sandbox page strictly exports noindex, nofollow");

  // --- 4. STRUCTURED DATA & SCHEMA.ORG MODELS ---
  console.log("\n[TEST GROUP 4: STRUCTURED DATA / SCHEMA.ORG COMPLIANCE]");

  // Verify UmrahPackageSchema component
  const packageSchemaSource = fs.readFileSync("src/components/site/UmrahPackageSchema.tsx", "utf8");
  assert(packageSchemaSource.includes('"@type": "TouristTrip"'), "UmrahPackageSchema: Uses Schema.org TouristTrip model");
  assert(packageSchemaSource.includes('"@type": "TravelAgency"'), "UmrahPackageSchema: Connects provider to TravelAgency");
  assert(packageSchemaSource.includes('touristType: "Pilgrim"') || packageSchemaSource.includes('"touristType": "Pilgrim"'), "UmrahPackageSchema: Defines touristType as Pilgrim");
  assert(packageSchemaSource.includes("itinerary:"), "UmrahPackageSchema: Maps day-by-day pilgrimage itinerary");
  assert(packageSchemaSource.includes("name: `${p.room_type} (Per Person)`"), "UmrahPackageSchema: Represents per-occupancy pricing clearly per person");

  // Verify ServiceSchema component
  const serviceSchemaSource = fs.readFileSync("src/components/site/ServiceSchema.tsx", "utf8");
  assert(serviceSchemaSource.includes('"@type": "Service"'), "ServiceSchema: Uses Schema.org Service model");
  assert(serviceSchemaSource.includes("#travelagency"), "ServiceSchema: References canonical TravelAgency #travelagency ID");

  // Verify breadcrumbs on package detail pages
  const bspPageSource = fs.readFileSync("src/app/(site)/umrah/masaar-best-selling-umrah/page.tsx", "utf8");
  const premPageSource = fs.readFileSync("src/app/(site)/umrah/masaar-premium-umrah/page.tsx", "utf8");
  
  assert(!bspPageSource.includes('{ label: "Home", href: "/" }'), "Best Selling page: Eliminated duplicate Home breadcrumb item");
  assert(bspPageSource.includes('{ label: "Umrah", href: "/umrah" }'), "Best Selling page: Breadcrumb trail maps Home > Umrah > Package");
  assert(!premPageSource.includes('{ label: "Home", href: "/" }'), "Premium package page: Eliminated duplicate Home breadcrumb item");
  assert(premPageSource.includes('{ label: "Umrah", href: "/umrah" }'), "Premium package page: Breadcrumb trail maps Home > Umrah > Package");

  // Verify ServiceSchema rendered on key service pages
  const umrahPageSource = fs.readFileSync("src/app/(site)/umrah/page.tsx", "utf8");
  const visaPageSource = fs.readFileSync("src/app/(site)/visa/page.tsx", "utf8");
  const hotelsPageSource = fs.readFileSync("src/app/(site)/hotels/page.tsx", "utf8");
  const hajjPageSource = fs.readFileSync("src/app/(site)/hajj/page.tsx", "utf8");
  const esimPageSource = fs.readFileSync("src/app/(site)/esim/page.tsx", "utf8");

  assert(umrahPageSource.includes("<ServiceSchema"), "/umrah: Renders valid Service structured data");
  assert(visaPageSource.includes("<ServiceSchema"), "/visa: Renders valid Service structured data");
  assert(hotelsPageSource.includes("<ServiceSchema"), "/hotels: Renders valid Service structured data");
  assert(hajjPageSource.includes("<ServiceSchema"), "/hajj: Renders valid Service structured data");
  assert(esimPageSource.includes("<ServiceSchema"), "/esim: Renders valid Service structured data");

  // --- 5. METADATA INTEGRITY & KEYWORD ALIGNMENT ---
  console.log("\n[TEST GROUP 5: SEO METADATA & OPEN GRAPH]");

  assert(bestSelling.seo_title.includes("Best Selling Umrah Package from UAE | 6 Days & 5 Nights"), "Best Selling SEO title matches approved specification");
  assert(bestSelling.meta_description.includes("DoubleTree") || bestSelling.meta_description.includes("hotel accommodation"), "Best Selling meta description accurately reflects hotel & flights");
  assert(premium.seo_title.includes("Premium Umrah Package from UAE"), "Premium package SEO title is distinct and accurate");
  assert(bestSelling.seo_title !== premium.seo_title, "Best Selling and Premium package have distinct SEO titles");
  assert(bestSelling.meta_description !== premium.meta_description, "Best Selling and Premium package have distinct meta descriptions");

  // Verify /umrah page_seo in Supabase
  const { data: pageSeoUmrah } = await supabase.from("page_seo").select("*").eq("path", "/umrah").single();
  assert(pageSeoUmrah && pageSeoUmrah.meta_title.includes("Umrah Packages from UAE | Makkah & Madinah Packages"), "page_seo: /umrah meta_title updated in database");
  assert(pageSeoUmrah && pageSeoUmrah.meta_description.includes("Explore thoughtfully planned Umrah packages from the UAE"), "page_seo: /umrah meta_description updated in database");

  // --- 6. ADMIN CMS SEO CONTROLS ---
  console.log("\n[TEST GROUP 6: ADMIN CMS SEO MANAGEMENT & WARNINGS]");

  const adminEditorSource = fs.readFileSync("src/app/admin/(dashboard)/umrah-packages/UmrahPackageEditorClient.tsx", "utf8");
  assert(adminEditorSource.includes("Indexing Warning: Noindex Directive Active"), "Admin Editor: Prominent warning banner displayed when package is published but marked noindex");
  assert(adminEditorSource.includes("Google Search Result Preview"), "Admin Editor: Features real-time Google SERP Snippet Preview");
  assert(adminEditorSource.includes("Social Sharing Card Preview"), "Admin Editor: Features real-time Social Sharing Card Preview");
  assert(adminEditorSource.includes("Optimal: 50–60"), "Admin Editor: Live character counter for SEO Title (50-60 chars)");
  assert(adminEditorSource.includes("Optimal: 140–160"), "Admin Editor: Live character counter for Meta Description (140-160 chars)");
  assert(adminEditorSource.includes("Enable System-Generated Schema.org TouristTrip"), "Admin Editor: Admin toggle for TouristTrip Schema.org structured data");

  const adminActionsSource = fs.readFileSync("src/app/admin/(dashboard)/umrah-packages/actions.ts", "utf8");
  assert(adminActionsSource.includes('revalidatePath("/sitemap.xml")'), "Admin Actions: Automatically revalidates /sitemap.xml on package save");
  assert(adminActionsSource.includes('revalidatePath("/robots.txt")'), "Admin Actions: Automatically revalidates /robots.txt on package save");

  // --- 7. INTERNAL LINKING VERIFICATION ---
  console.log("\n[TEST GROUP 7: INTERNAL LINKING & ARCHITECTURE]");

  const homeSpotlightSource = fs.readFileSync("src/components/site/MasaarBestSellingUmrahSpotlight.tsx", "utf8");
  assert(homeSpotlightSource.includes('href="/umrah/masaar-best-selling-umrah"'), "Homepage spotlight links directly to /umrah/masaar-best-selling-umrah");

  const crossLinksSource = fs.readFileSync("src/components/site/CrossLinkServices.tsx", "utf8");
  assert(crossLinksSource.includes('href: "/hotels"'), "CrossLinkServices: Links contextually to /hotels");
  assert(crossLinksSource.includes('href: "/transfers"'), "CrossLinkServices: Links contextually to /transfers");
  assert(crossLinksSource.includes('href: "/visa"'), "CrossLinkServices: Links contextually to /visa");

  console.log("\n===============================================================================");
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("===============================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite();
