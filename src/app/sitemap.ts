import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  getActiveHotels,
  getActiveUmrahDepartureMonths,
  getActiveVisaTypes,
  getPublishedPackages,
  getPublishedPrivateTrips,
} from "@/lib/data/public";
import { UMRAH_TIER_ORDER } from "@/lib/umrah-journey";
import { getSiteOrigin } from "@/lib/site-url";

/**
 * Top-level static pages on the site that are published and indexable.
 */
const STATIC_ROUTES = [
  "/",
  "/umrah",
  "/hajj",
  "/hotels",
  "/transfers",
  "/visa",
  "/faq",
  "/about",
  "/contact",
  "/blog",
  "/private-trips",
];

// Fallback stable date for static pages if no database record exists
const STABLE_STATIC_FALLBACK_DATE = new Date("2026-09-20T04:16:10.000Z");

/**
 * Blog posts count as live once published, or once a scheduled draft's publish
 * time has passed.
 */
async function getSitemapVisibleBlogPosts() {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("slug, updated_at")
    .or(`status.eq.published,and(status.eq.draft,scheduled_at.lte.${nowIso})`);
  if (error) {
    console.error("sitemap getSitemapVisibleBlogPosts", error.message);
    return [];
  }
  return data ?? [];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = getSiteOrigin();

  let noindexedPaths = new Set<string>();
  const pageSeoMap = new Map<string, { noindex: boolean; updated_at: string }>();

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase.from("page_seo").select("path, noindex, updated_at");
    for (const row of data ?? []) {
      if (row.noindex) noindexedPaths.add(row.path);
      pageSeoMap.set(row.path, row);
    }
  }

  // 1. Static pages with real updated_at dates from page_seo
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.filter((path) => !noindexedPaths.has(path)).map(
    (path) => {
      const seo = pageSeoMap.get(path);
      return {
        url: `${origin}${path}`,
        lastModified: seo?.updated_at ? new Date(seo.updated_at) : STABLE_STATIC_FALLBACK_DATE,
      };
    }
  );

  // 2. Data-driven published content
  const [umrahPackages, hajjPackages, hotels, visaTypes, departureMonths, blogPosts, privateTrips] = await Promise.all([
    getPublishedPackages("umrah"),
    getPublishedPackages("hajj"),
    getActiveHotels(),
    getActiveVisaTypes(),
    getActiveUmrahDepartureMonths(),
    getSitemapVisibleBlogPosts(),
    getPublishedPrivateTrips(),
  ]);

  // Exclude any internal/admin placeholder slugs (e.g. umrah-*-placeholder, hajj-*-placeholder)
  const validPackages = [...umrahPackages, ...hajjPackages].filter(
    (pkg) => !pkg.slug.includes("placeholder") && pkg.is_active && pkg.show_on_website
  );

  const packageEntries: MetadataRoute.Sitemap = validPackages.map((pkg) => ({
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

  // Only active departure months (inactive months like July/Aug/Sept are excluded by getActiveUmrahDepartureMonths)
  const departureEntries: MetadataRoute.Sitemap = departureMonths.map((month) => ({
    url: `${origin}/umrah/departures/${month.slug}`,
    lastModified: new Date(month.updated_at),
  }));

  // One journey page per active departure month per tier
  const journeyEntries: MetadataRoute.Sitemap = departureMonths.flatMap((month) =>
    UMRAH_TIER_ORDER.map((tier) => ({
      url: `${origin}/umrah/departures/${month.slug}/${tier}`,
      lastModified: new Date(month.updated_at),
    }))
  );

  const blogEntries: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${origin}/blog/${post.slug}`,
    lastModified: new Date(post.updated_at),
  }));

  const privateTripEntries: MetadataRoute.Sitemap = privateTrips.map((trip) => ({
    url: `${origin}/private-trips/${trip.slug}`,
    lastModified: new Date(trip.updated_at),
  }));

  return [
    ...staticEntries,
    ...packageEntries,
    ...hotelEntries,
    ...visaTypeEntries,
    ...departureEntries,
    ...journeyEntries,
    ...blogEntries,
    ...privateTripEntries,
  ];
}
