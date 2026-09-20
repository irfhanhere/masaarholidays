import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type {
  AboutContentRow,
  BlogCategoryRow,
  BlogPostRow,
  HomeContentRow,
  LegalPageKey,
  LegalPageRow,
  PackageAddonCatalogRow,
  PackageType,
  PackageRow,
  PageSeoRow,
  PublicHotelRoomRow,
  PublicHotelRow,
  TestimonialRow,
  TransferRow,
  TransferRouteAvailableVehicleRow,
  UmrahDepartureMonthRow,
  VisaDocumentContextKey,
  VisaDocumentRow,
  VisaLandingContentRow,
  VisaTypeRow,
  PrivateTripRow,
  PrivateTripStopRow,
  UmrahContentRow,
  FaqCategory,
  FaqRow,
  ZiyaratVehicleTypeRow,
  ZiyaratPricingRow,
  PackageItineraryDay,
  UmrahInventoryConfigurationRow,
} from "@/lib/types/database";
import { FALLBACK_FAQS } from "@/lib/data/fallback-faqs";

/**
 * Server-side reads for the public site. Every function here degrades to
 * an empty result instead of throwing when Supabase isn't connected yet
 * (fresh checkout of this scaffold, no .env.local) — see
 * lib/supabase/env.ts#isSupabaseConfigured. Once real content exists,
 * these are what render it; there is no invented placeholder data behind
 * them.
 */

export async function getPublishedPackages(type: PackageType): Promise<PackageRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("packages")
    .select("*")
    .eq("type", type)
    .eq("show_on_website", true)
    .eq("is_active", true)
    .order("display_order", { ascending: true });
  if (error) {
    console.error("getPublishedPackages", error.message);
    return [];
  }
  return data ?? [];
}

export interface PackageDetail {
  pkg: PackageRow;
  roomPrices: { room_type: string; price_aed: number }[];
}

/**
 * Same visibility rule as getPublishedPackages (is_active + show_on_website)
 * — the 6 placeholder packages from 0011_seed_placeholder_packages.sql
 * stay 404 on the public site until Haseeb activates one from Admin.
 */
export async function getPackageBySlugAndType(
  slug: string,
  type: PackageType
): Promise<PackageDetail | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data: pkg, error } = await supabase
    .from("packages")
    .select("*")
    .eq("slug", slug)
    .eq("type", type)
    .eq("show_on_website", true)
    .eq("is_active", true)
    .maybeSingle();
  if (error) {
    console.error("getPackageBySlugAndType", error.message);
    return null;
  }
  if (!pkg) return null;

  const { data: roomPrices, error: roomPricesError } = await supabase
    .from("package_room_prices")
    .select("room_type, price_aed")
    .eq("package_id", pkg.id)
    .eq("is_active", true)
    .order("display_order", { ascending: true });
  if (roomPricesError) {
    console.error("getPackageBySlugAndType roomPrices", roomPricesError.message);
  }

  return { pkg, roomPrices: roomPrices ?? [] };
}

/**
 * Batched room-price lookup for a set of packages (listing-grid use —
 * one query for the whole grid rather than one per card). Room prices
 * are read live here, not from `packages.starting_price_aed` — that
 * cached column is kept in sync by the admin form on every save, but the
 * "starting from" figure shown on cards is deliberately computed from
 * this query's own data (see PackageCard's `minPrice`) so it can never
 * drift from what the room-pricing list right below it actually shows.
 */
export async function getPackageRoomPricesByPackageIds(
  packageIds: string[]
): Promise<Map<string, { room_type: string; price_aed: number }[]>> {
  const byPackage = new Map<string, { room_type: string; price_aed: number }[]>();
  if (!isSupabaseConfigured() || packageIds.length === 0) return byPackage;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("package_room_prices")
    .select("package_id, room_type, price_aed")
    .in("package_id", packageIds)
    .eq("is_active", true)
    .order("display_order", { ascending: true });
  if (error) {
    console.error("getPackageRoomPricesByPackageIds", error.message);
    return byPackage;
  }

  for (const row of data ?? []) {
    const list = byPackage.get(row.package_id) ?? [];
    list.push({ room_type: row.room_type, price_aed: row.price_aed });
    byPackage.set(row.package_id, list);
  }
  return byPackage;
}

/**
 * Umrah-only "Departure Month" browsing layer — a content/marketing
 * wrapper around the same packages queried above, not a separate pricing
 * dimension. Both functions rely on the same is_active RLS gate as the
 * public route (/umrah/departures/[slug] 404s when a month isn't
 * active) and the sitemap (only active months are ever queried, so
 * inactive ones can never appear in it) — there's no separate
 * visibility check to keep in sync.
 */
export async function getActiveUmrahDepartureMonths(): Promise<UmrahDepartureMonthRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("umrah_departure_months")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) {
    console.error("getActiveUmrahDepartureMonths", error.message);
    return [];
  }
  return data ?? [];
}

export async function getActiveUmrahDepartureMonthBySlug(
  slug: string
): Promise<UmrahDepartureMonthRow | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("umrah_departure_months")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error) {
    console.error("getActiveUmrahDepartureMonthBySlug", error.message);
    return null;
  }
  return data;
}

/**
 * Explicit column list (not "*") — data_confidence/admin_caution_note are
 * admin-only and must never reach the public site's network response,
 * not just be hidden in the rendered UI. Keep in sync with HotelRowShape
 * (lib/types/database.ts) minus those two columns.
 */
const PUBLIC_HOTEL_COLUMNS =
  "id, name, slug, city, category, star_rating, distance_from_haram_meters, walk_time_minutes, " +
  "walk_time_minutes_max, terrain_note, room_type, board_basis, cancellation_policy, view_type, " +
  "price_from_aed, description, image_url, route_type, elderly_family_suitability_note, " +
  "shuttle_available, shuttle_note, accessibility_note, google_maps_url, gallery_image_urls, " +
  "mens_gate_walk_minutes_min, mens_gate_walk_minutes_max, ladies_gate_walk_minutes_min, " +
  "ladies_gate_walk_minutes_max, nearest_mens_gate, nearest_ladies_gate, in_haram_plaza_walk_note, " +
  "zone, primary_gate, meta_title, meta_description, is_active, display_order, created_at, updated_at";

export async function getActiveHotels(city?: "Makkah" | "Madinah"): Promise<PublicHotelRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  let query = supabase.from("hotels").select(PUBLIC_HOTEL_COLUMNS).eq("is_active", true);
  if (city) query = query.eq("city", city);
  const { data, error } = await query.order("display_order", { ascending: true });
  if (error) {
    console.error("getActiveHotels", error.message);
    return [];
  }
  return (data ?? []) as unknown as PublicHotelRow[];
}

export async function getHotelBySlug(slug: string): Promise<PublicHotelRow | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("hotels")
    .select(PUBLIC_HOTEL_COLUMNS)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error) {
    console.error("getHotelBySlug", error.message);
    return null;
  }
  return data as unknown as PublicHotelRow | null;
}

/**
 * Explicit column list (not "*") — data_confidence/admin_caution_note are
 * admin-only and must never reach the public site's network response,
 * not just be hidden in the rendered UI. Keep in sync with
 * HotelRoomRowShape (lib/types/database.ts) minus those two columns.
 */
const PUBLIC_HOTEL_ROOM_COLUMNS =
  "id, hotel_id, room_type, price_ro, price_bb, bed_type, notes, rate_period_label, image_url, " +
  "size_sqm, bed_count, bathroom_count, view_options, board_basis_options, cancellation_policy_options, " +
  "is_active, display_order, created_at, updated_at";

export async function getHotelRooms(hotelId: string): Promise<PublicHotelRoomRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("hotel_rooms")
    .select(PUBLIC_HOTEL_ROOM_COLUMNS)
    .eq("hotel_id", hotelId)
    .eq("is_active", true)
    .order("display_order", { ascending: true });
  if (error) {
    console.error("getHotelRooms", error.message);
    return [];
  }
  return (data ?? []) as unknown as PublicHotelRoomRow[];
}

export type HotelRoomPriceSummary = {
  hotel_id: string;
  price_ro: number | null;
  price_bb: number | null;
  cancellation_policy_options: string[];
};

/**
 * Bulk fetch of just the columns the /hotels listing needs to compute a
 * live "From AED X" price and the refundable filter for every hotel at
 * once — one query instead of one per hotel. RLS (hotel_rooms_public_read)
 * already restricts this to active rooms on active hotels.
 */
export async function getActiveHotelRoomPriceSummaries(): Promise<HotelRoomPriceSummary[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("hotel_rooms")
    .select("hotel_id, price_ro, price_bb, cancellation_policy_options")
    .eq("is_active", true);
  if (error) {
    console.error("getActiveHotelRoomPriceSummaries", error.message);
    return [];
  }
  return data ?? [];
}

export async function getActiveTransfers(): Promise<TransferRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transfers")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });
  if (error) {
    console.error("getActiveTransfers", error.message);
    return [];
  }
  return data ?? [];
}

/**
 * Vehicle names available per route, grouped by transfer_id — deliberately
 * NOT price. Reads the public-safe `transfer_route_available_vehicles`
 * view (0005_transfer_rate_card.sql), which never selects price_aed, so
 * there's no numeric rate for this function to even accidentally return.
 */
export async function getTransferAvailableVehicles(): Promise<
  Map<string, TransferRouteAvailableVehicleRow[]>
> {
  const byTransfer = new Map<string, TransferRouteAvailableVehicleRow[]>();
  if (!isSupabaseConfigured()) return byTransfer;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transfer_route_available_vehicles")
    .select("*")
    .order("display_order", { ascending: true });
  if (error) {
    console.error("getTransferAvailableVehicles", error.message);
    return byTransfer;
  }
  for (const row of data ?? []) {
    const list = byTransfer.get(row.transfer_id) ?? [];
    list.push(row);
    byTransfer.set(row.transfer_id, list);
  }
  return byTransfer;
}

export async function getPublishedTestimonials(limit?: number): Promise<TestimonialRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  let query = supabase
    .from("testimonials")
    .select("*")
    .eq("status", "published")
    .order("display_order", { ascending: true });
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  if (error) {
    console.error("getPublishedTestimonials", error.message);
    return [];
  }
  return data ?? [];
}

export async function getActiveVisaTypes(): Promise<VisaTypeRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("visa_types")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });
  if (error) {
    console.error("getActiveVisaTypes", error.message);
    return [];
  }
  return data ?? [];
}

/** One visa type plus its per-type "Documents Required" grid (visa_documents.visa_type_id) — powers the shared /visa/[slug] detail template. */
export async function getVisaTypeBySlug(
  slug: string
): Promise<{ visaType: VisaTypeRow; documents: VisaDocumentRow[] } | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data: visaType, error: visaTypeError } = await supabase
    .from("visa_types")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (visaTypeError || !visaType) {
    if (visaTypeError) console.error("getVisaTypeBySlug", visaTypeError.message);
    return null;
  }
  const { data: documents, error: documentsError } = await supabase
    .from("visa_documents")
    .select("*")
    .eq("visa_type_id", visaType.id)
    .order("display_order", { ascending: true });
  if (documentsError) console.error("getVisaTypeBySlug documents", documentsError.message);
  return { visaType, documents: documents ?? [] };
}

/** Singleton row — the /visa landing page's Important Information + CTA copy, admin-editable from Admin → Visa Types → Edit Landing Page Content. Returns null when unset; callers fall back to generic copy. */
export async function getVisaLandingContent(): Promise<VisaLandingContentRow | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.from("visa_landing_content").select("*").eq("id", 1).maybeSingle();
  if (error) {
    console.error("getVisaLandingContent", error.message);
    return null;
  }
  return data;
}

/** Singleton row — the Home page's Founder's Note + Vision & Mission section and bottom CTA quote, admin-editable from Admin → Home & About. Returns null when unset; callers fall back to generic copy. */
export async function getHomeContent(): Promise<HomeContentRow | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.from("home_content").select("*").eq("id", 1).maybeSingle();
  if (error) {
    console.error("getHomeContent", error.message);
    return null;
  }
  return data;
}

/** Singleton row — every paragraph/quote on the About page, admin-editable from Admin → About Content. Returns null when unset; callers fall back to the reference copy. */
export async function getAboutContent(): Promise<AboutContentRow | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.from("about_content").select("*").eq("id", 1).maybeSingle();
  if (error) {
    console.error("getAboutContent", error.message);
    return null;
  }
  return data;
}

/** Admin-editable meta title/description/OG image/noindex for one static top-level page — Admin → Page SEO. Returns null when unset (or the row doesn't exist yet); callers fall back to their own hardcoded copy. */
export async function getPageSeo(path: string): Promise<PageSeoRow | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.from("page_seo").select("*").eq("path", path).maybeSingle();
  if (error) {
    console.error("getPageSeo", error.message);
    return null;
  }
  return data;
}

export async function getPublishedBlogPosts(): Promise<BlogPostRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false });
  if (error) {
    console.error("getPublishedBlogPosts", error.message);
    return [];
  }
  return data ?? [];
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPostRow | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) {
    console.error("getBlogPostBySlug", error.message);
    return null;
  }
  return data;
}

export async function getBlogCategoryById(id: string | null): Promise<BlogCategoryRow | null> {
  if (!id || !isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("blog_categories").select("*").eq("id", id).maybeSingle();
  return data;
}

export async function getActiveBlogCategories(): Promise<BlogCategoryRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("blog_categories")
    .select("*")
    .eq("status", "active")
    .order("display_order", { ascending: true });
  return data ?? [];
}

/** Up to 3 other published posts, preferring the same category, for the article's "Related Articles" strip. */
export async function getRelatedBlogPosts(currentPostId: string, categoryId: string | null): Promise<BlogPostRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();

  if (categoryId) {
    const { data } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("status", "published")
      .eq("category_id", categoryId)
      .neq("id", currentPostId)
      .order("published_at", { ascending: false })
      .limit(3);
    if (data && data.length > 0) return data;
  }

  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("status", "published")
    .neq("id", currentPostId)
    .order("published_at", { ascending: false })
    .limit(3);
  return data ?? [];
}

/** Admin-editable legal document content (Privacy Policy, Terms & Conditions, Cookie Policy, Accessibility) — Admin → Legal & Cookies. Returns null when unset; callers fall back to their own default copy. */
export async function getLegalPage(key: LegalPageKey): Promise<LegalPageRow | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.from("legal_pages").select("*").eq("key", key).maybeSingle();
  if (error) {
    console.error("getLegalPage", error.message);
    return null;
  }
  return data;
}

export async function getVisaDocumentContext(contextKey: VisaDocumentContextKey) {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data: context, error: contextError } = await supabase
    .from("visa_document_contexts")
    .select("*")
    .eq("context_key", contextKey)
    .maybeSingle();
  if (contextError || !context) {
    if (contextError) console.error("getVisaDocumentContext", contextError.message);
    return null;
  }
  const { data: documents, error: documentsError } = await supabase
    .from("visa_documents")
    .select("*")
    .eq("context_id", context.id)
    .order("display_order", { ascending: true });
  if (documentsError) {
    console.error("getVisaDocumentContext documents", documentsError.message);
  }
  return { context, documents: documents ?? [] };
}

export async function getPublishedPrivateTrips(): Promise<PrivateTripRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("private_trips")
    .select("*")
    .eq("status", "published")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) {
    console.error("getPublishedPrivateTrips", error.message);
    return [];
  }
  return data ?? [];
}

export async function getPrivateTripBySlug(
  slug: string
): Promise<{ trip: PrivateTripRow; stops: PrivateTripStopRow[] } | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data: trip, error: tripError } = await supabase
    .from("private_trips")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (tripError || !trip) {
    if (tripError) console.error("getPrivateTripBySlug", tripError.message);
    return null;
  }

  const { data: stops, error: stopsError } = await supabase
    .from("private_trip_stops")
    .select("*")
    .eq("trip_id", trip.id)
    .order("stop_number", { ascending: true });
  if (stopsError) {
    console.error("getPrivateTripBySlug stops", stopsError.message);
  }

  return { trip, stops: stops ?? [] };
}

/** Real alt text for a set of image URLs, from the admin-edited media_library catalog.
 *  Returns only entries that actually have alt_text set — callers keep their own
 *  fallback for URLs not yet annotated, never invent one here. */
export async function getMediaAltTextMap(urls: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (!isSupabaseConfigured() || urls.length === 0) return map;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("media_library")
    .select("url, alt_text")
    .in("url", urls)
    .not("alt_text", "is", null);
  if (error) {
    console.error("getMediaAltTextMap", error.message);
    return map;
  }
  for (const row of data ?? []) {
    if (row.alt_text) map.set(row.url, row.alt_text);
  }
  return map;
}

export async function getPublishedPrivateTripStops(tripId: string): Promise<PrivateTripStopRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("private_trip_stops")
    .select("*")
    .eq("trip_id", tripId)
    .order("stop_number", { ascending: true });
  if (error) {
    console.error("getPublishedPrivateTripStops", error.message);
    return [];
  }
  return data ?? [];
}

export const DEFAULT_UMRAH_CONTENT: UmrahContentRow = {
  id: 1,
  guided_assistance_eyebrow: "RITUAL GUIDANCE",
  guided_assistance_heading: "Guided Umrah Assistance",
  guided_assistance_duration: "~3-4 hours (full ritual coverage)",
  guided_assistance_description:
    "Step-by-step spiritual and practical accompaniment through your Umrah rituals, ensuring peace of mind and strict adherence to the Sunnah.",
  guided_assistance_features: [
    {
      title: "Sunnah-Guided",
      description: "Step-by-step guidance strictly according to Sunnah",
    },
    {
      title: "Side-by-Side Support",
      description: "Accompanies you through Tawaf, Sa'ai, and prayers",
    },
    {
      title: "Recitation Support",
      description: "Helps lead and recite supplications (duas) throughout",
    },
  ],
  guided_assistance_badges: [
    "Personal & Dedicated Guide",
    "Authentic Sunnah Guidance",
    "End-to-End Ritual Companion (3-4 Hours)",
  ],
  guided_assistance_whatsapp_template_key: "guidedUmrah",
  is_active: true,
  updated_at: new Date().toISOString(),
};

export async function getUmrahContent(): Promise<UmrahContentRow> {
  if (!isSupabaseConfigured()) return DEFAULT_UMRAH_CONTENT;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("umrah_content")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error) {
    console.error("getUmrahContent", error.message);
    return DEFAULT_UMRAH_CONTENT;
  }
  return data ?? DEFAULT_UMRAH_CONTENT;
}

export async function getPublishedFaqs(category?: FaqCategory): Promise<FaqRow[]> {
  const fallback = category
    ? FALLBACK_FAQS.filter((f) => f.category === category && f.published)
    : FALLBACK_FAQS.filter((f) => f.published);

  if (!isSupabaseConfigured()) return fallback;

  try {
    const supabase = await createClient();
    let query = supabase
      .from("faqs")
      .select("*")
      .eq("published", true)
      .order("display_order", { ascending: true });

    if (category) {
      query = query.eq("category", category);
    }

    const { data, error } = await query;
    if (error) {
      // Table might not be migrated yet in Supabase
      console.warn("getPublishedFaqs falling back to seed data:", error.message);
      return fallback;
    }
    return data && data.length > 0 ? data : fallback;
  } catch (err) {
    console.warn("getPublishedFaqs error, using fallback:", err);
    return fallback;
  }
}

export interface PublicUmrahInventoryConfig {
  id: string;
  package_id: string;
  package: PackageRow;
  journey_type: "makkah_only" | "makkah_madinah";
  month_id: string | null;
  departure_month?: UmrahDepartureMonthRow | null;
  duration_nights: number;
  duration_days: number;
  duration_label: string;
  /** Structured night split for a makkah_madinah journey — null for makkah_only configs. Never derive this by parsing duration_label. */
  makkah_nights: number | null;
  madinah_nights: number | null;
  makkah_hotel?: PublicHotelRow | null;
  makkah_allow_similar: boolean;
  makkah_custom_note: string | null;
  madinah_hotel?: PublicHotelRow | null;
  madinah_allow_similar: boolean;
  madinah_custom_note: string | null;
  makkah_hotel_alt?: PublicHotelRow | null;
  makkah_allow_similar_alt: boolean;
  makkah_custom_note_alt: string | null;
  madinah_hotel_alt?: PublicHotelRow | null;
  madinah_allow_similar_alt: boolean;
  madinah_custom_note_alt: string | null;
  room_prices: { occupancy_type: string; price_aed: number }[];
  min_price_aed: number | null;
  itinerary: PackageItineraryDay[];
  inclusions_override: string | null;
  private_trips: Array<{ id: string; name: string; destination: string; short_description: string }>;
  status: "published" | "draft";
}

/** Shape of a row from getPublishedUmrahInventoryConfigurations' joined select — the base config row plus its resolved relations, keyed by the query's join aliases. */
type UmrahInventoryConfigJoinRow = UmrahInventoryConfigurationRow & {
  packages: PackageRow;
  umrah_departure_months: UmrahDepartureMonthRow | null;
  makkah_hotel: PublicHotelRow | null;
  madinah_hotel: PublicHotelRow | null;
  makkah_hotel_alt: PublicHotelRow | null;
  madinah_hotel_alt: PublicHotelRow | null;
};

export async function getPublishedUmrahInventoryConfigurations(): Promise<PublicUmrahInventoryConfig[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();

  const { data: configs, error } = await supabase
    .from("umrah_inventory_configurations")
    .select(`
      *,
      packages!inner(*),
      umrah_departure_months(*),
      makkah_hotel:hotels!umrah_inventory_configurations_makkah_hotel_id_fkey(${PUBLIC_HOTEL_COLUMNS}),
      madinah_hotel:hotels!umrah_inventory_configurations_madinah_hotel_id_fkey(${PUBLIC_HOTEL_COLUMNS}),
      makkah_hotel_alt:hotels!umrah_inventory_configurations_makkah_hotel_id_alt_fkey(${PUBLIC_HOTEL_COLUMNS}),
      madinah_hotel_alt:hotels!umrah_inventory_configurations_madinah_hotel_id_alt_fkey(${PUBLIC_HOTEL_COLUMNS})
    `)
    .eq("status", "published")
    .order("display_order", { ascending: true });

  if (error) {
    console.error("getPublishedUmrahInventoryConfigurations", error.message);
    return [];
  }

  if (!configs || configs.length === 0) return [];

  const typedConfigs = configs as unknown as UmrahInventoryConfigJoinRow[];
  const configIds = typedConfigs.map((c) => c.id);

  const [{ data: prices }, { data: tripJunctions }] = await Promise.all([
    supabase
      .from("umrah_configuration_room_prices")
      .select("*")
      .in("configuration_id", configIds)
      .order("display_order", { ascending: true }),
    supabase
      .from("umrah_configuration_private_trips")
      .select("configuration_id, private_trips(id, name, destination, short_description)")
      .in("configuration_id", configIds),
  ]);

  const pricesByConfig = new Map<string, { occupancy_type: string; price_aed: number }[]>();
  (prices ?? []).forEach((p) => {
    const list = pricesByConfig.get(p.configuration_id) ?? [];
    list.push({ occupancy_type: p.occupancy_type, price_aed: p.price_aed });
    pricesByConfig.set(p.configuration_id, list);
  });

  interface TripJunctionRow {
    configuration_id: string;
    private_trips: { id: string; name: string; destination: string; short_description: string } | null;
  }
  const typedTripJunctions = (tripJunctions ?? []) as unknown as TripJunctionRow[];

  const tripsByConfig = new Map<string, Array<{ id: string; name: string; destination: string; short_description: string }>>();
  typedTripJunctions.forEach((j) => {
    if (j.private_trips) {
      const list = tripsByConfig.get(j.configuration_id) ?? [];
      list.push(j.private_trips);
      tripsByConfig.set(j.configuration_id, list);
    }
  });

  return typedConfigs.map((c) => {
    const rPrices = pricesByConfig.get(c.id) ?? [];
    const minPrice = rPrices.length > 0 ? Math.min(...rPrices.map((p) => p.price_aed)) : null;

    return {
      id: c.id,
      package_id: c.package_id,
      package: c.packages,
      journey_type: c.journey_type,
      month_id: c.month_id,
      departure_month: c.umrah_departure_months,
      duration_nights: c.duration_nights,
      duration_days: c.duration_days,
      duration_label: c.duration_label,
      makkah_nights: c.makkah_nights,
      madinah_nights: c.madinah_nights,
      makkah_hotel: c.makkah_hotel,
      makkah_allow_similar: c.makkah_allow_similar,
      makkah_custom_note: c.makkah_custom_note,
      madinah_hotel: c.madinah_hotel,
      madinah_allow_similar: c.madinah_allow_similar,
      madinah_custom_note: c.madinah_custom_note,
      makkah_hotel_alt: c.makkah_hotel_alt,
      makkah_allow_similar_alt: c.makkah_allow_similar_alt,
      makkah_custom_note_alt: c.makkah_custom_note_alt,
      madinah_hotel_alt: c.madinah_hotel_alt,
      madinah_allow_similar_alt: c.madinah_allow_similar_alt,
      madinah_custom_note_alt: c.madinah_custom_note_alt,
      room_prices: rPrices,
      min_price_aed: minPrice,
      itinerary: c.itinerary ?? [],
      inclusions_override: c.inclusions_override,
      private_trips: tripsByConfig.get(c.id) ?? [],
      status: c.status,
    };
  });
}

export async function getZiyaratPricingForPublic() {
  if (!isSupabaseConfigured()) return { vehicleTypes: [], pricing: [] };
  const supabase = await createClient();

  const [{ data: vehicleTypes }, { data: pricing }] = await Promise.all([
    supabase.from("ziyarat_vehicle_types").select("*").eq("is_active", true).order("display_order", { ascending: true }),
    supabase.from("ziyarat_pricing").select("*").eq("is_active", true),
  ]);

  return {
    vehicleTypes: (vehicleTypes ?? []) as ZiyaratVehicleTypeRow[],
    pricing: (pricing ?? []) as ZiyaratPricingRow[],
  };
}

export interface PublicAddonCatalogRow extends PackageAddonCatalogRow {
  /** Real data from the linked private_trips row (null when private_trip_id is unset) — never fabricated placeholder text. */
  linked_trip: {
    name: string;
    short_description: string;
    duration: string;
    featured_image_url: string | null;
    slug: string;
  } | null;
}

export async function getAddonsCatalogForPublic(): Promise<PublicAddonCatalogRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("package_addons_catalog")
    .select("*, linked_trip:private_trips(name, short_description, duration, featured_image_url, slug)")
    .eq("status", "published")
    .order("display_order", { ascending: true });

  if (error) {
    console.error("getAddonsCatalogForPublic error:", error.message);
    return [];
  }
  return (data ?? []) as unknown as PublicAddonCatalogRow[];
}


