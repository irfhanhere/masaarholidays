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
import { getAllPublishedAdditionalServices } from "@/lib/data/additional-services";
import { UMRAH_TIER_ORDER } from "@/lib/umrah-journey";
import { getSiteOrigin } from "@/lib/site-url";
import {
  DEFAULT_LOCALE,
  LOCALE_HREFLANG,
  SEO_ENABLED_LOCALES,
  localizedPath,
} from "@/lib/locale-constants";
import { DEFAULT_PREMIUM_PACKAGE } from "@/lib/data/premium-package-catalog";
import { DEFAULT_BEST_SELLING_PACKAGE } from "@/lib/data/best-selling-package-catalog";

import { isEsimLive } from "@/lib/esim-launch";

/**
 * Top-level static pages on the site that are published and indexable.
 * Note: /cookie-preferences is intentionally omitted because it is marked noindex.
 * Note: /umrah/* dynamic packages are loaded directly from the database.
 */
const STATIC_ROUTES = [
  "/",
  "/umrah",
  "/umrah/sharjah",
  "/umrah/dubai",
  "/hajj",
  "/hotels",
  "/transfers",
  "/visa",
  "/esim",
  "/faq",
  "/about",
  "/contact",
  "/blog",
  "/private-trips",
  "/additional-services",
  "/additional-services/umrah-guide",
  "/privacy-policy",
  "/terms-conditions",
  "/accessibility",
];

// Fallback stable date for static pages if no database record exists
const STABLE_STATIC_FALLBACK_DATE = new Date("2026-09-20T04:16:10.000Z");

/**
 * Helper to generate sitemap entries across approved SEO locales (English only
 * until translations for ar/ur/hi are published) with reciprocal hreflang alternates
 * when multiple locales are active.
 */
function createSitemapEntries(
  path: string,
  lastModified: Date,
  origin: string
): MetadataRoute.Sitemap {
  const isMultiLingual = SEO_ENABLED_LOCALES.length > 1;
  const languages: Record<string, string> = {};
  if (isMultiLingual) {
    for (const l of SEO_ENABLED_LOCALES) {
      languages[LOCALE_HREFLANG[l]] = `${origin}${localizedPath(l, path)}`;
    }
    languages["x-default"] = `${origin}${localizedPath(DEFAULT_LOCALE, path)}`;
  }

  return SEO_ENABLED_LOCALES.map((locale) => ({
    url: `${origin}${localizedPath(locale, path)}`,
    lastModified,
    ...(isMultiLingual ? { alternates: { languages } } : {}),
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

/**
 * Loads published Umrah packages from the authoritative premium_umrah_packages table.
 * Strictly respects package publication status, noindex flag, and actual updated_at timestamps.
 */
async function getPublishedPremiumUmrahPackages(): Promise<Array<{ slug: string; updated_at: string }>> {
  if (!isSupabaseConfigured()) {
    return [DEFAULT_PREMIUM_PACKAGE, DEFAULT_BEST_SELLING_PACKAGE]
      .filter((p) => p.status === "published" && !p.noindex)
      .map((p) => ({
        slug: p.slug,
        updated_at: p.updated_at || "2026-11-21T16:39:12.736Z",
      }));
  }

  try {
    const supabase = await createClient();
    const { data, error } = await (supabase as any)
      .from("premium_umrah_packages")
      .select("slug, status, updated_at, noindex")
      .eq("status", "published");

    if (error || !Array.isArray(data) || data.length === 0) {
      return [DEFAULT_PREMIUM_PACKAGE, DEFAULT_BEST_SELLING_PACKAGE]
        .filter((p) => p.status === "published" && !p.noindex)
        .map((p) => ({
          slug: p.slug,
          updated_at: p.updated_at || "2026-11-21T16:39:12.736Z",
        }));
    }

    return data
      .filter((p: any) => !p.noindex)
      .map((p: any) => ({
        slug: p.slug,
        updated_at: p.updated_at || new Date().toISOString(),
      }));
  } catch (err) {
    console.error("sitemap getPublishedPremiumUmrahPackages", err);
    return [DEFAULT_PREMIUM_PACKAGE, DEFAULT_BEST_SELLING_PACKAGE]
      .filter((p) => p.status === "published" && !p.noindex)
      .map((p) => ({
        slug: p.slug,
        updated_at: p.updated_at || "2026-11-21T16:39:12.736Z",
      }));
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = getSiteOrigin();

  const noindexedPaths = new Set<string>();
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
  const activeStaticRoutes = isEsimLive()
    ? STATIC_ROUTES
    : STATIC_ROUTES.filter((path) => path !== "/esim");

  const staticEntries: MetadataRoute.Sitemap = activeStaticRoutes.filter(
    (path) => !noindexedPaths.has(path)
  ).flatMap((path) => {
    const seo = pageSeoMap.get(path);
    const lastModified = seo?.updated_at ? new Date(seo.updated_at) : STABLE_STATIC_FALLBACK_DATE;
    return createSitemapEntries(path, lastModified, origin);
  });

  // 2. Data-driven published content
  const [
    publishedPremiumPackages,
    umrahPackages,
    hajjPackages,
    hotels,
    visaTypes,
    departureMonths,
    blogPosts,
    privateTrips,
    transfers,
    additionalServices,
  ] = await Promise.all([
    getPublishedPremiumUmrahPackages(),
    getPublishedPackages("umrah"),
    getPublishedPackages("hajj"),
    getActiveHotels(),
    getActiveVisaTypes(),
    getActiveUmrahDepartureMonths(),
    getSitemapVisibleBlogPosts(),
    getPublishedPrivateTrips(),
    (await import("@/lib/data/transfers")).getPublicTransfers(),
    getAllPublishedAdditionalServices(),
  ]);

  // Premium / Best Selling Umrah Packages managed through Admin CMS
  const premiumPackageEntries: MetadataRoute.Sitemap = publishedPremiumPackages.flatMap((pkg) =>
    createSitemapEntries(`/umrah/${pkg.slug}`, new Date(pkg.updated_at), origin)
  );

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

  const RETAINED_VISA_SLUGS = new Set(["saudi-tourist", "uae", "golden-visa-assistance"]);
  const validVisaTypes = visaTypes.filter((vt) => RETAINED_VISA_SLUGS.has(vt.slug));

  const visaTypeEntries: MetadataRoute.Sitemap = [
    ...validVisaTypes.flatMap((visaType) =>
      createSitemapEntries(`/visa/${visaType.slug}`, new Date(visaType.updated_at), origin)
    ),
    // Online application flows for Saudi and UAE Visas
    ...["saudi-tourist", "uae"].flatMap((slug) =>
      createSitemapEntries(`/visa/${slug}/apply`, STABLE_STATIC_FALLBACK_DATE, origin)
    ),
  ];

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

  const transferEntries: MetadataRoute.Sitemap = transfers
    .filter((t) => t.is_active)
    .flatMap((t) =>
      createSitemapEntries(`/transfers/${t.slug}`, new Date(t.updated_at), origin)
    );

  const additionalServiceEntries: MetadataRoute.Sitemap = additionalServices
    .filter((s) => s.status === "published" && s.slug !== "umrah-guide")
    .flatMap((s) =>
      createSitemapEntries(`/additional-services/${s.slug}`, new Date(s.updated_at), origin)
    );

  const allEntries = [
    ...staticEntries,
    ...premiumPackageEntries,
    ...packageEntries,
    ...hotelEntries,
    ...visaTypeEntries,
    ...departureEntries,
    ...journeyEntries,
    ...blogEntries,
    ...privateTripEntries,
    ...transferEntries,
    ...additionalServiceEntries,
  ];

  const seenUrls = new Set<string>();
  const deduplicated: MetadataRoute.Sitemap = [];
  for (const entry of allEntries) {
    // Strictly exclude any private, admin, checkout, or testing routes
    if (
      entry.url.includes("/admin") ||
      entry.url.includes("/api/") ||
      entry.url.includes("/qa/") ||
      entry.url.includes("/quote") ||
      entry.url.includes("/doc-render") ||
      entry.url.includes("/esim/checkout") ||
      entry.url.includes("/visa/application")
    ) {
      continue;
    }

    if (!seenUrls.has(entry.url)) {
      seenUrls.add(entry.url);
      deduplicated.push(entry);
    }
  }

  return deduplicated;
}
