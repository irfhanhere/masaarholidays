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

export type PackageItineraryDay = {
  day: number;
  items: string[];
};

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

type PackageRowShape = {
  id: string;
  type: PackageType;
  tier: PackageTier;
  title: string;
  slug: string;
  city_destination: string | null;
  /** Tier-level (1-2 sentences), shown under the tier heading on listing pages, above that tier's cards — synced across duration-variant siblings exactly like title/inclusions_text/city_destination. */
  short_description: string | null;
  duration_days: number;
  /** Nights for this specific duration variant of the tier (e.g. 7/10/14) — duration_days is kept as duration_nights + 1. Multiple rows can share the same (type, tier) to offer several duration options. */
  duration_nights: number;
  duration_label: string | null;
  validity_label: string | null;
  inclusions_text: string | null;
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

/** Helper so every table follows the exact same Row/Insert/Update/Relationships shape. */
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
      private_trips: Table<PrivateTripRowShape, "name" | "slug" | "destination">;
      private_trip_stops: Table<PrivateTripStopRowShape, "trip_id" | "stop_number" | "stop_name">;
    };
    Views: {
      transfer_route_available_vehicles: View<TransferRouteAvailableVehicleRowShape>;
    };
    Functions: Record<string, never>;
  };
};

export type PackageRow = Database["public"]["Tables"]["packages"]["Row"];
export type HotelRow = Database["public"]["Tables"]["hotels"]["Row"];
export type HotelRoomRow = Database["public"]["Tables"]["hotel_rooms"]["Row"];
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
export type PrivateTripRow = Database["public"]["Tables"]["private_trips"]["Row"];
export type PrivateTripStopRow = Database["public"]["Tables"]["private_trip_stops"]["Row"];

