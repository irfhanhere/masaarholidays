export type TransportMode = "Flight" | "Haramain Speed Train" | "Bus" | "Walking" | "Other";

export interface PremiumPackageHotel {
  city: "Makkah" | "Madinah" | string;
  hotel_name: string;
  nights: number;
  image_url: string;
  description: string;
  star_rating?: number;
  distance_note?: string;
}

export interface PremiumPackageInclusion {
  id: string;
  title: string;
  icon: string;
  description?: string;
  enabled: boolean;
  is_train?: boolean;
}

export interface PremiumPackageTransport {
  id: string;
  journey_number: number;
  origin: string;
  destination: string;
  mode: TransportMode;
  airline_or_provider: string;
  date?: string;
  departure_time?: string;
  arrival_time?: string;
  reference_info?: string;
  notes?: string;
  status: "confirmed" | "scheduled" | "to_be_confirmed";
}

export interface PremiumPackagePricing {
  room_type: string;
  price_aed: number;
  currency: string;
  pricing_basis: string; // e.g. "per person"
  display_order: number;
  is_active: boolean;
  popular?: boolean;
  note?: string;
}

export interface PremiumPackageItineraryDay {
  day_number: number;
  weekday: string;
  title: string;
  subtitle?: string;
  transport_mode: TransportMode;
  image_url: string;
  image_alt: string;
  is_published: boolean;
  activities: string[];
  transport_note?: string;
}

export interface PremiumPackageAddon {
  id: string;
  title: string;
  type: "complimentary" | "upon_request";
  description: string;
  badge?: string;
  is_active: boolean;
}

export interface PremiumPackage {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  full_description: string;
  duration_days: number;
  duration_nights: number;
  status: "published" | "draft" | "archived";
  is_featured: boolean;
  show_on_homepage: boolean;
  show_on_umrah_page: boolean;
  display_order: number;
  featured_image: string;
  seo_title: string;
  meta_description: string;
  canonical_url: string;
  hotels: PremiumPackageHotel[];
  inclusions: PremiumPackageInclusion[];
  addons?: PremiumPackageAddon[];
  transport: PremiumPackageTransport[];
  pricing: PremiumPackagePricing[];
  itinerary: PremiumPackageItineraryDay[];
  created_at?: string;
  updated_at?: string;
}

