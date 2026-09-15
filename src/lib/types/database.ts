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
export type PackageTier = "essential" | "signature" | "prive";
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

type PackageRowShape = {
  id: string;
  type: PackageType;
  tier: PackageTier;
  title: string;
  slug: string;
  city_destination: string | null;
  duration_days: number;
  duration_label: string | null;
  validity_label: string | null;
  inclusions_text: string | null;
  advance_booking_note: string | null;
  flight_note: string | null;
  rate_disclaimer: string | null;
  itinerary: PackageItineraryDay[];
  hero_image_url: string | null;
  starting_price_aed: number | null;
  is_featured: boolean;
  is_active: boolean;
  show_on_website: boolean;
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
  context_id: string;
  title: string;
  description: string | null;
  display_order: number;
};

type VisaTypeRowShape = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  audience_text: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
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
      packages: Table<PackageRowShape, "type" | "tier" | "title" | "slug" | "duration_days">;
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
      visa_documents: Table<VisaDocumentRowShape, "context_id" | "title">;
      visa_types: Table<VisaTypeRowShape, "slug" | "name">;
      testimonials: Table<
        TestimonialRowShape,
        "customer_name" | "rating" | "testimonial_text" | "service"
      >;
      enquiries: Table<EnquiryRowShape, "name" | "enquiry_type">;
      currency_rates: Table<CurrencyRateRowShape, keyof CurrencyRateRowShape>;
      whatsapp_templates: Table<WhatsAppTemplateRowShape, "key" | "label" | "template_text">;
      whatsapp_settings: Table<WhatsAppSettingsRowShape, "id" | "phone_number">;
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
