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

// Every real, indexable route on the site — static top-level pages, plus
// active/published rows from each content type with its own detail
// route (packages, hotels, visa types, Umrah departure months).
// Inactive/draft rows and admin-noindexed static pages are excluded by
// the same is_active/status/noindex gates their own public routes and
// nav already use — see lib/data/public.ts.
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

/** Blog posts count as live once published, or once a scheduled draft's publish
 *  time has passed (the cron flips status to published within 5 minutes, but the
 *  sitemap shouldn't lag behind what a visitor can already load at that URL). */
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

  const [umrahPackages, hajjPackages, hotels, visaTypes, departureMonths, blogPosts, privateTrips] = await Promise.all([
    getPublishedPackages("umrah"),
    getPublishedPackages("hajj"),
    getActiveHotels(),
    getActiveVisaTypes(),
    getActiveUmrahDepartureMonths(),
    getSitemapVisibleBlogPosts(),
    getPublishedPrivateTrips(),
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

  // One journey page per active departure month per tier — see
  // app/(site)/umrah/departures/[month]/[tier]/page.tsx, which always
  // resolves successfully for any active month + valid tier combination.
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
