import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Read-only CMS pull-in for the Quotation line-item picker ("+ Add Hotel" /
 * "+ Add Transfer" / etc. in the Quotation Builder). These are the same
 * public-readable CMS tables the live site already queries — no new data,
 * just a flat shape convenient for a <select> dropdown. Selecting one only
 * pre-fills a document_item row; nothing here is re-read once a document
 * is saved (see documents.ts / 0074 migration header comment on
 * snapshotting).
 */

export interface SelectableHotel {
  id: string;
  name: string;
  city: string;
  star_rating: number | null;
  price_from_aed: number | null;
}

export interface SelectableTransfer {
  id: string;
  route_name: string;
  vehicle_type: string | null;
  price_from_aed: number | null;
}

export interface SelectablePrivateTrip {
  id: string;
  name: string;
  destination: string;
  slug: string;
}

export interface SelectablePackageRoomPrice {
  room_type: string;
  price_aed: number;
  note?: string;
  pricing_basis?: string;
}

export interface SelectablePackage {
  id: string;
  type: "umrah" | "hajj";
  tier: string;
  title: string;
  slug?: string;
  duration_days: number;
  duration_nights?: number;
  hotels?: any[];
  inclusions?: any[];
  exclusions?: any[];
  itinerary?: any[];
  room_prices: SelectablePackageRoomPrice[];
  source_table?: "premium_umrah_packages" | "packages";
}

export interface SelectableZiyaratOption {
  id: string; // ziyarat_pricing.id
  vehicle_name: string;
  city: "Makkah" | "Madinah";
  capacity_label: string;
  price_aed: number;
}

export async function getSelectableHotels(): Promise<SelectableHotel[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("hotels")
    .select("id, name, city, star_rating, price_from_aed")
    .eq("is_active", true)
    .order("city", { ascending: true })
    .order("name", { ascending: true });
  return (data ?? []) as SelectableHotel[];
}

export async function getSelectableTransfers(): Promise<SelectableTransfer[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("transfers")
    .select("id, route_name, vehicle_type, price_from_aed")
    .eq("is_active", true)
    .order("route_name", { ascending: true });
  return (data ?? []) as SelectableTransfer[];
}

export async function getSelectablePrivateTrips(): Promise<SelectablePrivateTrip[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("private_trips")
    .select("id, name, destination, slug")
    .eq("status", "published")
    .order("destination", { ascending: true })
    .order("name", { ascending: true });
  return (data ?? []) as SelectablePrivateTrip[];
}

export async function getSelectablePackages(): Promise<SelectablePackage[]> {
  const supabase = await createClient();

  // 1. Authoritative CMS Umrah Packages from premium_umrah_packages
  const { data: premiumData } = await (supabase as any)
    .from("premium_umrah_packages")
    .select("id, slug, title, duration_days, duration_nights, hotels, inclusions, itinerary, pricing, status")
    .order("display_order", { ascending: true });

  const premiumPackages: SelectablePackage[] = ((premiumData as any[]) ?? [])
    .filter((pkg: any) => pkg.status === "published" || !pkg.status)
    .map((pkg: any) => {
      let roomPrices: SelectablePackageRoomPrice[] = [];
      if (Array.isArray(pkg.pricing)) {
        roomPrices = pkg.pricing.map((p: any) => ({
          room_type: p.room_type || "Standard Room",
          price_aed: Number(p.price_aed) || 0,
          note: p.note,
          pricing_basis: p.pricing_basis || "per person",
        }));
      }
      return {
        id: pkg.id,
        type: "umrah",
        tier: pkg.slug === "masaar-best-selling-umrah" ? "best-selling" : "premium",
        title: pkg.title,
        slug: pkg.slug,
        duration_days: pkg.duration_days ?? 6,
        duration_nights: pkg.duration_nights ?? 5,
        hotels: Array.isArray(pkg.hotels) ? pkg.hotels : [],
        inclusions: Array.isArray(pkg.inclusions) ? pkg.inclusions : [],
        itinerary: Array.isArray(pkg.itinerary) ? pkg.itinerary : [],
        room_prices: roomPrices,
        source_table: "premium_umrah_packages",
      };
    });

  // 2. Standard and Hajj packages from packages table
  const { data: standardData } = await supabase
    .from("packages")
    .select("id, type, tier, title, slug, duration_days, duration_nights, room_prices:package_room_prices(room_type, price_aed)")
    .eq("is_active", true)
    .order("type", { ascending: true })
    .order("display_order", { ascending: true });

  const standardPackages: SelectablePackage[] = ((standardData ?? []) as any[]).map((pkg) => ({
    id: pkg.id,
    type: pkg.type ?? "umrah",
    tier: pkg.tier ?? "standard",
    title: pkg.title,
    slug: pkg.slug,
    duration_days: pkg.duration_days ?? 0,
    duration_nights: pkg.duration_nights ?? 0,
    room_prices: (pkg.room_prices ?? []).filter((rp: any) => rp.price_aed != null).map((rp: any) => ({
      room_type: rp.room_type,
      price_aed: Number(rp.price_aed) || 0,
      pricing_basis: "per person",
    })),
    source_table: "packages",
  }));

  // Return CMS premium packages first, then standard/hajj packages
  return [...premiumPackages, ...standardPackages];
}

export async function getSelectableZiyaratOptions(): Promise<SelectableZiyaratOption[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ziyarat_pricing")
    .select("id, city, price_aed, vehicle:ziyarat_vehicle_types(name, capacity_label)")
    .eq("is_active", true)
    .order("city", { ascending: true });

  return ((data ?? []) as unknown as { id: string; city: "Makkah" | "Madinah"; price_aed: number; vehicle: { name: string; capacity_label: string } | null }[]).map(
    (row) => ({
      id: row.id,
      city: row.city,
      price_aed: row.price_aed,
      vehicle_name: row.vehicle?.name ?? "Vehicle",
      capacity_label: row.vehicle?.capacity_label ?? "",
    })
  );
}

export interface SelectableAdditionalService {
  id: string;
  name: string;
  slug: string;
  category: string;
  price_type: "fixed" | "from" | "on_request";
  price_aed: number | null;
  currency: string;
  short_description: string;
  icon?: string;
  features?: string[];
  status: string;
}

export async function getSelectableAdditionalServices(): Promise<SelectableAdditionalService[]> {
  const { getAllPublishedAdditionalServices } = await import("@/lib/data/additional-services");
  const services = await getAllPublishedAdditionalServices();
  return services.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    category: s.category,
    price_type: s.price_type,
    price_aed: s.price_aed,
    currency: s.currency || "AED",
    short_description: s.short_description,
    icon: s.icon,
    features: s.features,
    status: s.status,
  }));
}

