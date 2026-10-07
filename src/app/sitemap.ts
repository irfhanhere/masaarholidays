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
import {
  DEFAULT_LOCALE,
  LOCALE_HREFLANG,
  SUPPORTED_LOCALES,
  localizedPath,
} from "@/lib/locale-constants";

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
  "/privacy-policy",
  "/terms-conditions",
  "/accessibility",
];

// Fallback stable date for static pages if no database record exists
const STABLE_STATIC_FALLBACK_DATE = new Date("2026-09-20T04:16:10.000Z");

/**
 * Helper to generate sitemap entries across all supported languages (en, ar, ur, hi)
 * with reciprocal hreflang alternates.
 */
function createSitemapEntries(
  path: string,
  lastModified: Date,
  origin: string
): MetadataRoute.Sitemap {
  const languages: Record<string, string> = {};
  for (const l of SUPPORTED_LOCALES) {
    languages[LOCALE_HREFLANG[l]] = `${origin}${localizedPath(l, path)}`;
  }
  languages["x-default"] = `${origin}${localizedPath(DEFAULT_LOCALE, path)}`;

  return SUPPORTED_LOCALES.map((locale) => ({
    url: `${origin}${localizedPath(locale, path)}`,
    lastModified,
    alternates: {
      languages,
    },
  }));
}

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
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.filter(
    (path) => !noindexedPaths.has(path)
  ).flatMap((path) => {
    const seo = pageSeoMap.get(path);
    const lastModified = seo?.updated_at ? new Date(seo.updated_at) : STABLE_STATIC_FALLBACK_DATE;
    return createSitemapEntries(path, lastModified, origin);
  });

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

  const packageEntries: MetadataRoute.Sitemap = validPackages.flatMap((pkg) => {
    // For Umrah master packages, map to clean canonical URLs (/umrah/essential, etc.)
    const cleanSlug = pkg.type === "umrah" ? pkg.slug.replace(/^umrah-/, "") : pkg.slug;
    const path = `/${pkg.type}/${cleanSlug}`;
    return createSitemapEntries(path, new Date(pkg.updated_at), origin);
  });

  const hotelEntries: MetadataRoute.Sitemap = hotels.flatMap((hotel) =>
    createSitemapEntries(`/hotels/${hotel.slug}`, new Date(hotel.updated_at), origin)
  );

  const visaTypeEntries: MetadataRoute.Sitemap = visaTypes.flatMap((visaType) =>
    createSitemapEntries(`/visa/${visaType.slug}`, new Date(visaType.updated_at), origin)
  );

  // Only active departure months (inactive months like July/Aug/Sept are excluded by getActiveUmrahDepartureMonths)
  const departureEntries: MetadataRoute.Sitemap = departureMonths.flatMap((month) =>
    createSitemapEntries(`/umrah/departures/${month.slug}`, new Date(month.updated_at), origin)
  );

  // One journey page per active departure month per tier
  const journeyEntries: MetadataRoute.Sitemap = departureMonths.flatMap((month) =>
    UMRAH_TIER_ORDER.flatMap((tier) =>
      createSitemapEntries(`/umrah/departures/${month.slug}/${tier}`, new Date(month.updated_at), origin)
    )
  );

  const blogEntries: MetadataRoute.Sitemap = blogPosts.flatMap((post) =>
    createSitemapEntries(`/blog/${post.slug}`, new Date(post.updated_at), origin)
  );

  const privateTripEntries: MetadataRoute.Sitemap = privateTrips.flatMap((trip) =>
    createSitemapEntries(`/private-trips/${trip.slug}`, new Date(trip.updated_at), origin)
  );

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
