import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  getActiveHotels,
  getActiveUmrahDepartureMonths,
  getActiveVisaTypes,
  getPublishedPackages,
} from "@/lib/data/public";

// Every real, indexable route on the site — static top-level pages, plus
// active/published rows from each content type with its own detail
// route (packages, hotels, visa types, Umrah departure months).
// Inactive/draft rows and admin-noindexed static pages are excluded by
// the same is_active/status/noindex gates their own public routes and
// nav already use — see lib/data/public.ts.
const STATIC_ROUTES = ["/", "/umrah", "/hajj", "/hotels", "/transfers", "/visa", "/about", "/contact"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

  let noindexedPaths = new Set<string>();
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase.from("page_seo").select("path").eq("noindex", true);
    noindexedPaths = new Set((data ?? []).map((r) => r.path));
  }

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.filter((path) => !noindexedPaths.has(path)).map(
    (path) => ({
      url: `${origin}${path}`,
      lastModified: new Date(),
    })
  );

  const [umrahPackages, hajjPackages, hotels, visaTypes, departureMonths] = await Promise.all([
    getPublishedPackages("umrah"),
    getPublishedPackages("hajj"),
    getActiveHotels(),
    getActiveVisaTypes(),
    getActiveUmrahDepartureMonths(),
  ]);

  const packageEntries: MetadataRoute.Sitemap = [...umrahPackages, ...hajjPackages].map((pkg) => ({
    url: `${origin}/${pkg.type}/${pkg.slug}`,
    lastModified: new Date(pkg.updated_at),
  }));

  const hotelEntries: MetadataRoute.Sitemap = hotels.map((hotel) => ({
    url: `${origin}/hotels/${hotel.slug}`,
    lastModified: new Date(hotel.updated_at),
  }));

  const visaTypeEntries: MetadataRoute.Sitemap = visaTypes.map((visaType) => ({
    url: `${origin}/visa/${visaType.slug}`,
    lastModified: new Date(visaType.updated_at),
  }));

  const departureEntries: MetadataRoute.Sitemap = departureMonths.map((month) => ({
    url: `${origin}/umrah/departures/${month.slug}`,
    lastModified: new Date(month.updated_at),
  }));

  return [...staticEntries, ...packageEntries, ...hotelEntries, ...visaTypeEntries, ...departureEntries];
}
