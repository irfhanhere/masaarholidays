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
}

export interface SelectablePackage {
  id: string;
  type: "umrah" | "hajj";
  tier: string;
  title: string;
  duration_days: number;
  room_prices: SelectablePackageRoomPrice[];
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
  const { data } = await supabase
    .from("packages")
    .select("id, type, tier, title, duration_days, room_prices:package_room_prices(room_type, price_aed)")
    .eq("is_active", true)
    .order("type", { ascending: true })
    .order("display_order", { ascending: true });

  return ((data ?? []) as unknown as (SelectablePackage & { room_prices: SelectablePackageRoomPrice[] })[]).map((pkg) => ({
    ...pkg,
    room_prices: (pkg.room_prices ?? []).filter((rp) => rp.price_aed != null),
  }));
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
