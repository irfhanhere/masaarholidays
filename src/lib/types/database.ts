/**
 * Hand-written to match supabase/migrations/0001_init.sql +
 * 0002_seed_visa_contexts.sql.
 *
 * Once the Supabase project is connected, regenerate this from the live
 * schema instead of hand-editing it further:
 *
 *   npx supabase gen types typescript --project-id <ref> > src/lib/types/database.ts
 *
 * Shape follows @supabase/postgrest-js's GenericSchema contract exactly
 * (Tables/Views/Functions at the schema level, Row/Insert/Update/
 * Relationships per table) — omitting any of these makes the client fall
 * back to `never` for every query's inferred type.
 */

export type PackageType = "umrah" | "hajj";
export type PackageTier = "essential" | "signature" | "exclusive";
export type PublishStatus = "draft" | "published";
export type EnquiryStatus = "new" | "viewed" | "contacted" | "closed";
export type VisaDocumentContextKey =
  | "umrah_package"
  | "standalone_umrah_visa"
  | "hotel"
  | "hajj";
export type TestimonialSource = "admin" | "passenger";
export type CurrencyCode = "AED" | "INR" | "USD" | "EUR" | "GBP" | "SAR";
export type FaqCategory = "umrah" | "hajj" | "hotels" | "visa" | "transfers" | "general";

export type PackageItineraryDay = {
  day: number;
  title?: string;
  items: string[];
};

export type UmrahJourneyType = "makkah_only" | "makkah_madinah";

/** Hajj-only structured itinerary entry — replaces the day-by-day PackageItineraryDay format for Hajj specifically; Umrah keeps using `itinerary` unchanged. */
export type HajjItinerarySegment = {
  location: string;
  nights: number;
  board_type: string;
  note: string | null;
};

/** Fixed icon set for visa document cards — see visa_documents.icon_key (0022_visa_type_detail_pages.sql). Unrecognized/unset values fall back to "document" at render time. */
export type VisaDocumentIconKey =
  | "passport"
  | "photo"
  | "document"
  | "flight"
  | "hotel"
  | "shield"
  | "payment"
  | "group";

/** One entry in visa_types.features — the 4-icon strip below the detail-page hero. Wider icon vocabulary than VisaDocumentIconKey (also includes clock/headset/heart — see components/site/icons.tsx#VISA_ICON_MAP), so kept as plain string rather than that stricter union. */
export type VisaTypeFeature = {
  icon_key: string;
  label: string;
};

export type VisaTypeBenefit = {
  title: string;
  description: string;
};

type PackageRowShape = {
  id: string;
  type: PackageType;
  tier: PackageTier;
  title: string;
  slug: string;
  city_destination: string | null;
  /** Tier-level (1-2 sentences), shown under the tier heading on listing pages, above that tier's cards — synced across duration-variant siblings exactly like title/inclusions_text/city_destination. */
  short_description: string | null;
  /** Tier-level short positioning line shown on package cards — synced across duration-variant siblings. */
  tagline: string | null;
  /** Transfer route strip shown on the package card, e.g. "Jeddah Airport → Makkah Hotel → Madinah Hotel → Madinah Airport". Tier-level — synced across duration variants. */
  route_line: string | null;
  /** Hotel name for the Makkah stay on the package card, e.g. "VOCO Makkah (or similar)". Tier-level — synced. */
  makkah_hotel_name: string | null;
  /** Proximity/access note for the Makkah hotel, e.g. "8 mins via complimentary shuttle / 25-min walk". Never "private shuttle" for the hotel-to-Haram facility — use "complimentary" or "24/7 hotel shuttle service". Tier-level — synced. */
  makkah_hotel_note: string | null;
  /** Short access badge for the Makkah hotel, e.g. "Step-free access & shuttle service". Tier-level — synced. */
  makkah_hotel_access_tag: string | null;
  /** Hotel name for the Madinah stay on the package card. Tier-level — synced. */
  madinah_hotel_name: string | null;
  /** Proximity/access note for the Madinah hotel. Tier-level — synced. */
  madinah_hotel_note: string | null;
  /** Short access badge for the Madinah hotel. Tier-level — synced. */
  madinah_hotel_access_tag: string | null;
  /** Alternate (Option B) hotel name for the Makkah stay on the package card. Tier-level — synced. */
  makkah_hotel_name_alt: string | null;
  /** Proximity/access note for the alternate Makkah hotel. Tier-level — synced. */
  makkah_hotel_note_alt: string | null;
  /** Short access badge for the alternate Makkah hotel. Tier-level — synced. */
  makkah_hotel_access_tag_alt: string | null;
  /** Alternate (Option B) hotel name for the Madinah stay on the package card. Tier-level — synced. */
  madinah_hotel_name_alt: string | null;
  /** Proximity/access note for the alternate Madinah hotel. Tier-level — synced. */
  madinah_hotel_note_alt: string | null;
  /** Short access badge for the alternate Madinah hotel. Tier-level — synced. */
  madinah_hotel_access_tag_alt: string | null;
  duration_days: number;
  /** Nights for this specific duration variant of the tier (e.g. 7/10/14) — duration_days is kept as duration_nights + 1. Multiple rows can share the same (type, tier) to offer several duration options. */
  duration_nights: number;
  duration_label: string | null;
  validity_label: string | null;
  inclusions_text: string | null;
  /** key_slug values from package_addons_catalog enabled by default for this tier. Empty = not yet configured. */
  default_addon_slugs: string[];
  advance_booking_note: string | null;
  flight_note: string | null;
  rate_disclaimer: string | null;
  itinerary: PackageItineraryDay[];
  /** Hajj only, tier-level (synced like title/short_description) — free text, e.g. "A-Category", "VIP A-Category". Always null for Umrah rows. */
  maktab_category: string | null;
  /** Hajj only, per-duration (not synced — a 10-day and 17-day Hajj package genuinely have different segments, same reasoning as `itinerary`). Empty array for Umrah rows, which keep using `itinerary` instead. */
  itinerary_segments: HajjItinerarySegment[];
  hero_image_url: string | null;
  starting_price_aed: number | null;
  is_featured: boolean;
  is_active: boolean;
  show_on_website: boolean;
  /** Per-duration (each duration variant has its own detail-page URL/slug) — falls back to "{title} | Masaar Holidays" when unset. */
  meta_title: string | null;
  meta_description: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
};

type PackageRoomPriceRowShape = {
  id: string;
  package_id: string;
  room_type: string;
  price_aed: number;
  is_active: boolean;
  display_order: number;
};

type PackageUpgradeRowShape = {
  id: string;
  package_id: string;
  label: string;
  nights_makkah: number | null;
  nights_madinah: number | null;
  transport_note: string | null;
  support_note: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

type PackageUpgradeRoomPriceRowShape = {
  id: string;
  upgrade_id: string;
  room_type: string;
  price_aed: number;
  is_active: boolean;
  display_order: number;
};

/** "mens" or "ladies" — see hotels.primary_gate. */
export type HotelPrimaryGate = "mens" | "ladies";
/** Admin-only reliability flag — see hotels.data_confidence. Never selected/rendered publicly. */
export type HotelDataConfidence = "verified" | "estimated" | "needs_verification";

type HotelRowShape = {
  id: string;
  name: string;
  slug: string;
  city: string;
  category: string | null;
  star_rating: number | null;
  distance_from_haram_meters: number | null;
  walk_time_minutes: number | null;
  walk_time_minutes_max: number | null;
  terrain_note: string | null;
  room_type: string | null;
  board_basis: string | null;
  cancellation_policy: string | null;
  view_type: string | null;
  price_from_aed: number | null;
  description: string | null;
  image_url: string | null;
  /** General proximity/accessibility fields — apply to both cities. */
  route_type: string | null;
  elderly_family_suitability_note: string | null;
  shuttle_available: boolean;
  shuttle_note: string | null;
  accessibility_note: string | null;
  google_maps_url: string | null;
  gallery_image_urls: string[];
  /** Madinah-specific — always null for Makkah rows, which keep using distance_from_haram_meters/walk_time_minutes above. */
  mens_gate_walk_minutes_min: number | null;
  mens_gate_walk_minutes_max: number | null;
  ladies_gate_walk_minutes_min: number | null;
  ladies_gate_walk_minutes_max: number | null;
  nearest_mens_gate: string | null;
  nearest_ladies_gate: string | null;
  in_haram_plaza_walk_note: string | null;
  zone: string | null;
  /** Which gate's time the public hotel card's single walk-time badge shows. */
  primary_gate: HotelPrimaryGate | null;
  /** Admin-only — never selected by public data-layer functions (see lib/data/public.ts#getActiveHotels/getHotelBySlug), not just hidden in the UI. */
  data_confidence: HotelDataConfidence | null;
  admin_caution_note: string | null;
  /** Falls back to "{name} | Masaar Holidays" when unset. */
  meta_title: string | null;
  meta_description: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

type HotelRoomRowShape = {
  id: string;
  hotel_id: string;
  room_type: string;
  price_ro: number | null;
  price_bb: number | null;
  bed_type: string | null;
  notes: string | null;
  rate_period_label: string | null;
  image_url: string | null;
  size_sqm: number | null;
  bed_count: number | null;
  bathroom_count: number | null;
  /** Display-only badges — which options exist for this room, not a selectable control that recalculates price. */
  view_options: string[];
  board_basis_options: string[];
  cancellation_policy_options: string[];
  /** Admin-only — never selected by public data-layer functions, not just hidden in the UI. Same pattern as hotels.data_confidence. */
  data_confidence: HotelDataConfidence | null;
  admin_caution_note: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type HotelReviewRowShape = {
  id: string;
  hotel_id: string | null;
  hotel_slug: string;
  author_name: string;
  travel_party: string;
  rating: number;
  stay_month_year: string;
  read_time: string;
  title: string;
  content: string;
  highlight_quote: string | null;
  helpful_tag: string | null;
  is_verified: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

type PackageHotelRowShape = {
  id: string;
  package_id: string;
  hotel_id: string;
  nights: number;
  display_order: number;
};

type PackageTransferAddonRowShape = {
  id: string;
  package_id: string;
  transfer_id: string;
  vehicle_id: string | null;
  is_active: boolean;
  display_order: number;
};

export type TransferType = "airport" | "train" | "intercity" | "ziyarat" | "day-trip" | "other";

type TransferRowShape = {
  id: string;
  route_name: string;
  slug: string;
  transfer_type: TransferType;
  vehicle_type: string | null;
  vehicle_capacity: string | null;
  price_from_aed: number | null;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

type TransferVehicleRowShape = {
  id: string;
  name: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

type TransferRouteRateRowShape = {
  id: string;
  transfer_id: string;
  vehicle_id: string;
  price_aed: number;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

/** Public-safe view — vehicle availability per route, no price column. */
type TransferRouteAvailableVehicleRowShape = {
  transfer_id: string;
  vehicle_id: string;
  vehicle_name: string;
  display_order: number;
};

type VisaDocumentContextRowShape = {
  id: string;
  context_key: VisaDocumentContextKey;
  label: string;
  caveat_text: string | null;
  updated_at: string;
};

type VisaDocumentRowShape = {
  id: string;
  /** Mutually exclusive with visa_type_id — see visa_documents_exactly_one_parent. */
  context_id: string | null;
  /** Mutually exclusive with context_id. Set for the per-visa-type "Documents Required" grid. */
  visa_type_id: string | null;
  title: string;
  description: string | null;
  icon_key: VisaDocumentIconKey;
  display_order: number;
};

type VisaTypeRowShape = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  audience_text: string | null;
  /** Detail-page hero H1 — falls back to `name` if unset. */
  hero_headline: string | null;
  /** 1-2 sentence hero paragraph. */
  hero_intro: string | null;
  /** Detail-page hero background photo — falls back to a generic banner if unset. */
  hero_image_url: string | null;
  /** The 4-icon feature strip below the hero, admin-editable per type. */
  features: VisaTypeFeature[];
  /** Optional "Benefits" list (title + description pairs) shown below the feature strip — section hidden entirely when empty. */
  benefits: VisaTypeBenefit[];
  /** Intro line under the "Documents Required" heading. */
  documents_intro: string | null;
  /** Warning-style "Important Information" callout — paragraphs separated by a blank line. */
  important_info_text: string | null;
  /** Optional "Who May Need This Service?" bullets — section hidden entirely when empty. */
  who_needs_this: string[];
  /** Small note under the bottom CTA buttons. */
  cta_note: string | null;
  /** Falls back to "{name} | Masaar Holidays" when unset. */
  meta_title: string | null;
  meta_description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

/** Singleton row (id always 1) — admin-editable copy for the /visa landing page's Important Information + bottom CTA section, same pattern as WhatsAppSettingsRow. */
type VisaLandingContentRowShape = {
  id: number;
  important_info_text: string | null;
  cta_heading: string | null;
  cta_line: string | null;
  cta_note: string | null;
  updated_at: string;
};

/** Singleton row (id always 1) — admin-editable bottom CTA quote on the Home page. Same pattern as VisaLandingContentRow. */
type HomeContentRowShape = {
  id: number;
  cta_quote_text: string | null;
  cta_quote_reference: string | null;
  updated_at: string;
};

/** One entry in about_content.core_values / .differentiators — icon + label + one-line description. */
export type AboutIconItem = {
  icon_key: string;
  label: string;
  description: string;
};

/** Singleton row (id always 1) — every paragraph/quote on the About page, admin-editable. Same pattern as VisaLandingContentRow/HomeContentRow. The founder-note fields are deliberately name-less (see migration comment) — a standing site rule, not enforced at the type level. */
/** Admin-editable meta title/description/OG image/noindex for one static top-level page, keyed by its locale-independent path (e.g. "/umrah"). Replaces the old Page SEO admin stub, which had no backing table. */
type PageSeoRowShape = {
  path: string;
  meta_title: string;
  meta_description: string | null;
  og_image_url: string | null;
  noindex: boolean;
  updated_at: string;
};

/** 'privacy_policy' | 'terms_conditions' | 'cookie_policy' | 'accessibility'. */
export type LegalPageKey = "privacy_policy" | "terms_conditions" | "cookie_policy" | "accessibility";

type LegalPageRowShape = {
  key: string;
  title: string;
  content: string;
  updated_at: string;
};

export type BlogContentFormat = "legacy" | "html";

type MediaLibraryRowShape = {
  id: string;
  url: string;
  alt_text: string | null;
  caption: string | null;
  file_name: string | null;
  width: number | null;
  height: number | null;
  uploaded_at: string;
};

type BlogCategoryRowShape = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  seo_title: string | null;
  meta_description: string | null;
  status: "active" | "inactive";
  display_order: number;
  created_at: string;
  updated_at: string;
};

type BlogPostRowShape = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  /** 'legacy' = old ##/- plain-text markup; 'html' = real HTML from the rich-text editor. */
  content_format: BlogContentFormat;
  /** Legacy free-text category, kept for old rows — no longer written to by the admin UI. */
  category: string | null;
  category_id: string | null;
  tags: string[];
  author_name: string;
  is_featured: boolean;
  hero_image_url: string | null;
  hero_image_alt: string | null;
  status: PublishStatus;
  meta_title: string | null;
  meta_description: string | null;
  focus_keyword: string | null;
  canonical_url: string | null;
  noindex: boolean;
  og_title: string | null;
  og_description: string | null;
  og_image_url: string | null;
  /** Future publish time for a draft — the publish-scheduled-posts cron flips status once this passes. */
  scheduled_at: string | null;
  published_at: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
};

type AboutContentRowShape = {
  id: number;
  hero_subline: string | null;
  purpose_text: string | null;
  purpose_quote: string | null;
  purpose_image_url: string | null;
  founding_story_heading: string | null;
  founding_story_text: string | null;
  founding_story_image_url: string | null;
  vision_text: string | null;
  mission_text: string | null;
  core_values: AboutIconItem[];
  sadaqah_text: string | null;
  sadaqah_image_url: string | null;
  approach_text: string | null;
  approach_quote: string | null;
  who_we_serve_text: string | null;
  differentiators: AboutIconItem[];
  founder_eyebrow: string | null;
  founder_text: string | null;
  founder_image_url: string | null;
  founder_quote: string | null;
  founder_signoff: string | null;
  updated_at: string;
};

type TestimonialRowShape = {
  id: string;
  customer_name: string;
  location: string | null;
  photo_url: string | null;
  rating: number;
  testimonial_text: string;
  service: string;
  package_id: string | null;
  status: PublishStatus;
  is_featured: boolean;
  display_order: number;
  consent_given: boolean;
  consent_notes: string | null;
  submitted_via: TestimonialSource;
  created_at: string;
  updated_at: string;
};

type EnquiryRowShape = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  enquiry_type: string;
  message: string | null;
  number_of_travellers: string | null;
  travel_date: string | null;
  page_source: string | null;
  referring_url: string | null;
  status: EnquiryStatus;
  internal_notes: string | null;
  received_at: string;
  updated_at: string;
};

type CurrencyRateRowShape = {
  currency_code: CurrencyCode;
  rate_to_aed: number;
  is_base: boolean;
  updated_at: string;
};

type WhatsAppTemplateRowShape = {
  id: string;
  key: string;
  label: string;
  template_text: string;
  placeholders: string[];
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

type WhatsAppSettingsRowShape = {
  id: number;
  phone_number: string;
  updated_at: string;
};

type UmrahDepartureMonthRowShape = {
  id: string;
  slug: string;
  display_label: string;
  hero_image_url: string | null;
  hero_headline: string | null;
  hero_subtext: string | null;
  best_for_note: string | null;
  booking_advice_note: string | null;
  /** Falls back to a generated "Umrah Packages — {display_label} | Masaar Holidays" when unset. */
  meta_title: string | null;
  meta_description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type PrivateTripDestination = "Makkah" | "Madinah" | "Other";
export type PrivateTripStatus = "draft" | "published";
export type PrivateTripPickupPoint = "hotel_lobby" | "custom" | "both";
export type PrivateTripStopVisitType = "Visit" | "Pass By" | "Pickup" | "Drop Off";

type PrivateTripRowShape = {
  id: string;
  name: string;
  slug: string;
  destination: PrivateTripDestination;
  short_description: string;
  duration: string;
  trip_type: string;
  featured_image_url: string | null;
  hero_image_url: string | null;
  status: PrivateTripStatus;
  pickup_point: PrivateTripPickupPoint;
  time_slots: string[];
  important_note: string | null;
  whatsapp_template_key: string | null;
  meta_title: string | null;
  meta_description: string | null;
  gallery_images: string[];
  whats_included: string[];
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type GuidedAssistanceFeature = {
  title: string;
  description: string;
};

type UmrahContentRowShape = {
  id: number;
  guided_assistance_eyebrow: string | null;
  guided_assistance_heading: string | null;
  guided_assistance_duration: string | null;
  guided_assistance_description: string | null;
  guided_assistance_features: GuidedAssistanceFeature[];
  guided_assistance_badges: string[];
  guided_assistance_whatsapp_template_key: string | null;
  is_active: boolean;
  updated_at: string;
};

type PrivateTripStopRowShape = {
  id: string;
  trip_id: string;
  stop_number: number;
  stop_name: string;
  image_url: string | null;
  visit_duration: string | null;
  visit_type: PrivateTripStopVisitType;
  short_description: string | null;
  why_it_matters: string | null;
  created_at: string;
  updated_at: string;
};

type FaqRowShape = {
  id: string;
  category: FaqCategory;
  question: string;
  answer: string;
  display_order: number;
  published: boolean;
  created_at: string;
  updated_at: string;
};

type PackageInclusionCatalogRowShape = {
  id: string;
  category: string;
  name: string;
  icon: string;
  is_default_included: boolean;
  status: PublishStatus;
  display_order: number;
  created_at: string;
  updated_at: string;
};

type PackageAddonCatalogRowShape = {
  id: string;
  category: string;
  name: string;
  key_slug: string;
  icon: string;
  price_type_label: string;
  /** Optional reference to a real private_trips row — when set, the public site shows that trip's actual name/description/image/duration instead of this row's own text fields. Never fabricated: null when there's genuinely no matching trip. */
  private_trip_id: string | null;
  status: PublishStatus;
  display_order: number;
  created_at: string;
  updated_at: string;
};

/** Helper so every table follows the exact same Row/Insert/Update/Relationships shape. */
type AdminMfaBackupCodeRowShape = {
  id: string;
  user_id: string;
  code_hash: string;
  used_at: string | null;
  created_at: string;
};

type Table<Row, RequiredKeys extends keyof Row> = {
  Row: Row;
  Insert: Partial<Row> & Pick<Row, RequiredKeys>;
  Update: Partial<Row>;
  Relationships: [];
};

/** Helper for read-only views (no Insert/Update). */
type View<Row> = {
  Row: Row;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      packages: Table<PackageRowShape, "type" | "tier" | "title" | "slug" | "duration_days" | "duration_nights">;
      package_room_prices: Table<PackageRoomPriceRowShape, "package_id" | "room_type" | "price_aed">;
      package_upgrades: Table<PackageUpgradeRowShape, "package_id" | "label">;
      package_upgrade_room_prices: Table<
        PackageUpgradeRoomPriceRowShape,
        "upgrade_id" | "room_type" | "price_aed"
      >;
      hotels: Table<HotelRowShape, "name" | "slug" | "city">;
      hotel_rooms: Table<HotelRoomRowShape, "hotel_id" | "room_type">;
      hotel_reviews: Table<HotelReviewRowShape, "hotel_slug" | "author_name" | "title" | "content">;
      package_hotels: Table<PackageHotelRowShape, "package_id" | "hotel_id" | "nights">;
      package_transfer_addons: Table<PackageTransferAddonRowShape, "package_id" | "transfer_id">;
      transfers: Table<TransferRowShape, "route_name" | "slug">;
      transfer_vehicles: Table<TransferVehicleRowShape, "name">;
      transfer_route_rates: Table<TransferRouteRateRowShape, "transfer_id" | "vehicle_id" | "price_aed">;
      visa_document_contexts: Table<VisaDocumentContextRowShape, "context_key" | "label">;
      visa_documents: Table<VisaDocumentRowShape, "title">;
      visa_types: Table<VisaTypeRowShape, "slug" | "name">;
      testimonials: Table<
        TestimonialRowShape,
        "customer_name" | "rating" | "testimonial_text" | "service"
      >;
      enquiries: Table<EnquiryRowShape, "name" | "enquiry_type">;
      currency_rates: Table<CurrencyRateRowShape, keyof CurrencyRateRowShape>;
      whatsapp_templates: Table<WhatsAppTemplateRowShape, "key" | "label" | "template_text">;
      whatsapp_settings: Table<WhatsAppSettingsRowShape, "id" | "phone_number">;
      umrah_departure_months: Table<UmrahDepartureMonthRowShape, "slug" | "display_label">;
      visa_landing_content: Table<VisaLandingContentRowShape, "id">;
      home_content: Table<HomeContentRowShape, "id">;
      about_content: Table<AboutContentRowShape, "id">;
      umrah_content: Table<UmrahContentRowShape, "id">;
      page_seo: Table<PageSeoRowShape, "path" | "meta_title">;
      legal_pages: Table<LegalPageRowShape, "key" | "title" | "content">;
      blog_posts: Table<BlogPostRowShape, "title" | "slug">;
      blog_categories: Table<BlogCategoryRowShape, "name" | "slug">;
      media_library: Table<MediaLibraryRowShape, "url">;
      private_trips: Table<PrivateTripRowShape, "name" | "slug" | "destination">;
      private_trip_stops: Table<PrivateTripStopRowShape, "trip_id" | "stop_number" | "stop_name">;
      faqs: Table<FaqRowShape, "category" | "question" | "answer">;
      umrah_inventory_configurations: Table<
        UmrahInventoryConfigurationRowShape,
        "package_id" | "journey_type" | "duration_nights" | "duration_days" | "duration_label"
      >;
      umrah_configuration_room_prices: Table<
        UmrahConfigurationRoomPriceRowShape,
        "configuration_id" | "occupancy_type" | "price_aed"
      >;
      umrah_configuration_private_trips: Table<
        UmrahConfigurationPrivateTripRowShape,
        "configuration_id" | "private_trip_id"
      >;
      ziyarat_vehicle_types: Table<ZiyaratVehicleTypeRowShape, "name" | "slug" | "capacity_label">;
      ziyarat_pricing: Table<ZiyaratPricingRowShape, "city" | "vehicle_type_id" | "price_aed">;
      package_inclusions_catalog: Table<PackageInclusionCatalogRowShape, "name">;
      package_addons_catalog: Table<PackageAddonCatalogRowShape, "name" | "key_slug">;
      admin_mfa_backup_codes: Table<AdminMfaBackupCodeRowShape, "user_id" | "code_hash">;
      documents: Table<DocumentRowShape, "document_type" | "document_number" | "client_name">;
      document_items: Table<DocumentItemRowShape, "document_id" | "description">;
      document_versions: Table<DocumentVersionRowShape, "document_id" | "version_number" | "status_at_version" | "snapshot">;
      document_templates: Table<DocumentTemplateRowShape, "document_type" | "name">;
      document_shares: Table<DocumentShareRowShape, "document_id" | "share_token">;
      document_settings: Table<DocumentSettingsRowShape, "id">;
    };
    Views: {
      transfer_route_available_vehicles: View<TransferRouteAvailableVehicleRowShape>;
    };
    Functions: {
      generate_document_number: {
        Args: { p_document_type: string };
        Returns: string;
      };
    };
  };
};

export type PackageRow = Database["public"]["Tables"]["packages"]["Row"];
export type HotelRow = Database["public"]["Tables"]["hotels"]["Row"];
export type HotelRoomRow = Database["public"]["Tables"]["hotel_rooms"]["Row"];
export type HotelReviewRow = Database["public"]["Tables"]["hotel_reviews"]["Row"];
/** What the public site fetches — admin-only fields (data_confidence, admin_caution_note) are never selected by public queries, not just hidden in the UI. See lib/data/public.ts#getActiveHotels/getHotelBySlug. */
export type PublicHotelRow = Omit<HotelRow, "data_confidence" | "admin_caution_note">;
/** What the public site fetches for rooms — same admin-only exclusion as PublicHotelRow. See lib/data/public.ts#getHotelRooms/getActiveHotelRoomPriceSummaries. */
export type PublicHotelRoomRow = Omit<HotelRoomRow, "data_confidence" | "admin_caution_note">;
export type TransferRow = Database["public"]["Tables"]["transfers"]["Row"];
export type TransferVehicleRow = Database["public"]["Tables"]["transfer_vehicles"]["Row"];
export type PackageTransferAddonRow =
  Database["public"]["Tables"]["package_transfer_addons"]["Row"];
export type TransferRouteRateRow = Database["public"]["Tables"]["transfer_route_rates"]["Row"];
export type TransferRouteAvailableVehicleRow =
  Database["public"]["Views"]["transfer_route_available_vehicles"]["Row"];
export type TestimonialRow = Database["public"]["Tables"]["testimonials"]["Row"];
export type EnquiryRow = Database["public"]["Tables"]["enquiries"]["Row"];
export type CurrencyRateRow = Database["public"]["Tables"]["currency_rates"]["Row"];
export type VisaTypeRow = Database["public"]["Tables"]["visa_types"]["Row"];
export type VisaDocumentContextRow =
  Database["public"]["Tables"]["visa_document_contexts"]["Row"];
export type VisaDocumentRow = Database["public"]["Tables"]["visa_documents"]["Row"];
export type WhatsAppTemplateRow = Database["public"]["Tables"]["whatsapp_templates"]["Row"];
export type WhatsAppSettingsRow = Database["public"]["Tables"]["whatsapp_settings"]["Row"];
export type UmrahDepartureMonthRow = Database["public"]["Tables"]["umrah_departure_months"]["Row"];
export type VisaLandingContentRow = Database["public"]["Tables"]["visa_landing_content"]["Row"];
export type HomeContentRow = Database["public"]["Tables"]["home_content"]["Row"];
export type AboutContentRow = Database["public"]["Tables"]["about_content"]["Row"];
export type UmrahContentRow = Database["public"]["Tables"]["umrah_content"]["Row"];
export type PageSeoRow = Database["public"]["Tables"]["page_seo"]["Row"];
export type LegalPageRow = Database["public"]["Tables"]["legal_pages"]["Row"];
export type BlogPostRow = Database["public"]["Tables"]["blog_posts"]["Row"];
export type BlogCategoryRow = Database["public"]["Tables"]["blog_categories"]["Row"];
export type MediaLibraryRow = Database["public"]["Tables"]["media_library"]["Row"];
export type PrivateTripRow = Database["public"]["Tables"]["private_trips"]["Row"];
export type PrivateTripStopRow = Database["public"]["Tables"]["private_trip_stops"]["Row"];

export type UmrahInventoryConfigurationRowShape = {
  id: string;
  package_id: string;
  journey_type: UmrahJourneyType;
  month_id: string | null;
  duration_nights: number;
  duration_days: number;
  duration_label: string;
  makkah_nights: number | null;
  madinah_nights: number | null;
  makkah_hotel_id: string | null;
  makkah_allow_similar: boolean;
  makkah_custom_note: string | null;
  madinah_hotel_id: string | null;
  madinah_allow_similar: boolean;
  madinah_custom_note: string | null;
  makkah_hotel_id_alt: string | null;
  makkah_allow_similar_alt: boolean;
  makkah_custom_note_alt: string | null;
  madinah_hotel_id_alt: string | null;
  madinah_allow_similar_alt: boolean;
  madinah_custom_note_alt: string | null;
  itinerary: PackageItineraryDay[];
  inclusions_override: string | null;
  status: PublishStatus;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type UmrahConfigurationRoomPriceRowShape = {
  id: string;
  configuration_id: string;
  occupancy_type: string;
  price_aed: number;
  display_order: number;
};

export type UmrahConfigurationPrivateTripRowShape = {
  id: string;
  configuration_id: string;
  private_trip_id: string;
  display_order: number;
};

export type ZiyaratVehicleTypeRowShape = {
  id: string;
  name: string;
  slug: string;
  capacity_label: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type ZiyaratPricingRowShape = {
  id: string;
  city: "Makkah" | "Madinah";
  vehicle_type_id: string;
  price_aed: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type UmrahInventoryConfigurationRow =
  Database["public"]["Tables"]["umrah_inventory_configurations"]["Row"];
export type UmrahConfigurationRoomPriceRow =
  Database["public"]["Tables"]["umrah_configuration_room_prices"]["Row"];
export type UmrahConfigurationPrivateTripRow =
  Database["public"]["Tables"]["umrah_configuration_private_trips"]["Row"];
export type ZiyaratVehicleTypeRow =
  Database["public"]["Tables"]["ziyarat_vehicle_types"]["Row"];
export type ZiyaratPricingRow =
  Database["public"]["Tables"]["ziyarat_pricing"]["Row"];
export type FaqRow =
  Database["public"]["Tables"]["faqs"]["Row"];
export type PackageAddonCatalogRow =
  Database["public"]["Tables"]["package_addons_catalog"]["Row"];
export type PackageInclusionCatalogRow =
  Database["public"]["Tables"]["package_inclusions_catalog"]["Row"];

// ─────────────────────────────────────────────────────────────────────────
// Document & Proposal Toolkit (0074_document_toolkit.sql) — Quotation /
// Invoice / Receipt / Booking Voucher. A presentation layer over the CMS
// above, not a duplicate of it: document_items freezes a snapshot of
// description/price on save (source_type/source_id are for the admin
// "edit" affordance only, never re-read live). Not a CRM — client_name/
// email/phone are free text, no FK into `enquiries`.
// ─────────────────────────────────────────────────────────────────────────
export type DocumentType = "quotation" | "invoice" | "receipt" | "booking_voucher";
export type DocumentJourneyType = "umrah" | "hajj" | "hotel" | "transfer" | "private_trip" | "custom";
export type DocumentItemType =
  | "umrah_package"
  | "hajj_package"
  | "hotel"
  | "transfer"
  | "private_trip"
  | "flight"
  | "service"
  | "custom";
export type DocumentPaymentMethod = "bank_transfer" | "cash" | "card" | "other";
export type DocumentTemplateLayout = "premium" | "classic" | "minimal";

export const QUOTATION_STATUSES = [
  "draft",
  "sent",
  "viewed",
  "revision_requested",
  "revised",
  "accepted",
  "rejected",
  "expired",
] as const;
export const INVOICE_STATUSES = ["draft", "issued", "sent", "partially_paid", "paid", "cancelled"] as const;
export const RECEIPT_STATUSES = ["draft", "issued", "sent", "cancelled"] as const;
export const BOOKING_VOUCHER_STATUSES = ["draft", "issued", "sent", "cancelled"] as const;

export type DocumentRowShape = {
  id: string;
  document_type: DocumentType;
  document_number: string;
  status: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  client_country: string | null;
  journey_type: DocumentJourneyType | null;
  travel_date: string | null;
  return_date: string | null;
  adults: number | null;
  children: number | null;
  infants: number | null;
  origin: string | null;
  destination: string | null;
  special_requirements: string | null;
  source_document_id: string | null;
  subtotal_aed: number;
  discount_aed: number;
  tax_aed: number;
  total_aed: number;
  amount_paid_aed: number;
  notes: string | null;
  terms: string | null;
  issue_date: string;
  due_date: string | null;
  valid_until: string | null;
  payment_method: DocumentPaymentMethod | null;
  transaction_reference: string | null;
  payment_date: string | null;
  booking_reference: string | null;
  template_id: string | null;
  future_crm_client_id: string | null;
  future_crm_enquiry_id: string | null;
  future_crm_booking_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type DocumentItemRowShape = {
  id: string;
  document_id: string;
  item_type: DocumentItemType;
  source_type: string | null;
  source_id: string | null;
  description: string;
  details: string | null;
  quantity: number;
  unit_price_aed: number;
  discount_aed: number;
  tax_aed: number;
  amount_aed: number;
  display_order: number;
  created_at: string;
};

export type DocumentVersionRowShape = {
  id: string;
  document_id: string;
  version_number: number;
  status_at_version: string;
  snapshot: { document: DocumentRowShape; items: DocumentItemRowShape[] };
  created_at: string;
  created_by: string | null;
};

export type DocumentTemplateRowShape = {
  id: string;
  document_type: DocumentType;
  name: string;
  layout: DocumentTemplateLayout;
  logo_url: string | null;
  header_text: string | null;
  footer_text: string | null;
  primary_color: string;
  secondary_color: string;
  gold_color: string;
  typography: string;
  company_phone: string | null;
  company_email: string | null;
  company_website: string | null;
  company_address: string | null;
  terms_text: string | null;
  signature_text: string | null;
  bank_name: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  bank_iban: string | null;
  bank_swift_code: string | null;
  blessing_note: string | null;
  signature_name: string | null;
  signature_title: string | null;
  footer_image_url: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type DocumentShareRowShape = {
  id: string;
  document_id: string;
  share_token: string;
  expires_at: string | null;
  viewed_at: string | null;
  created_at: string;
};

export type DocumentSettingsRowShape = {
  id: number;
  quotation_prefix: string;
  invoice_prefix: string;
  receipt_prefix: string;
  booking_voucher_prefix: string;
  updated_at: string;
};

export type DocumentRow = Database["public"]["Tables"]["documents"]["Row"];
export type DocumentItemRow = Database["public"]["Tables"]["document_items"]["Row"];
export type DocumentVersionRow = Database["public"]["Tables"]["document_versions"]["Row"];
export type DocumentTemplateRow = Database["public"]["Tables"]["document_templates"]["Row"];
export type DocumentShareRow = Database["public"]["Tables"]["document_shares"]["Row"];
export type DocumentSettingsRow = Database["public"]["Tables"]["document_settings"]["Row"];


