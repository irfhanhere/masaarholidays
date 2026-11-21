import fs from "node:fs";
import path from "node:path";
import { DEFAULT_BEST_SELLING_PACKAGE } from "../src/lib/data/best-selling-package-catalog.ts";

const envPath = path.resolve(".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
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
}

const { createClient } = await import("@supabase/supabase-js");
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seedBestSellingPackage() {
  console.log("Seeding Masaar Best Selling Umrah Package into Supabase 'premium_umrah_packages' table...");

  const pkg = DEFAULT_BEST_SELLING_PACKAGE;

  const payload = {
    slug: pkg.slug,
    title: pkg.title,
    short_description: pkg.short_description,
    full_description: pkg.full_description,
    duration_days: pkg.duration_days,
    duration_nights: pkg.duration_nights,
    status: pkg.status,
    is_featured: pkg.is_featured,
    show_on_homepage: pkg.show_on_homepage,
    show_on_umrah_page: pkg.show_on_umrah_page,
    display_order: pkg.display_order,
    featured_image: pkg.featured_image,
    seo_title: pkg.seo_title,
    meta_description: pkg.meta_description,
    canonical_url: pkg.canonical_url,
    hotels: pkg.hotels,
    inclusions: pkg.inclusions,
    addons: pkg.addons,
    transport: pkg.transport,
    pricing: pkg.pricing,
    itinerary: pkg.itinerary,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("premium_umrah_packages")
    .upsert(payload, { onConflict: "slug" })
    .select()
    .single();

  if (error) {
    console.error("Error inserting best selling package into Supabase:", error);
  } else {
    console.log("✅ Successfully seeded Best Selling package into Supabase with ID:", data.id);
  }
}

seedBestSellingPackage().catch(console.error);
