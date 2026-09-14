import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type {
  HotelRoomRow,
  HotelRow,
  PackageType,
  PackageRow,
  TestimonialRow,
  TransferRow,
  TransferRouteAvailableVehicleRow,
  VisaDocumentContextKey,
  VisaTypeRow,
} from "@/lib/types/database";

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

export async function getActiveHotels(city?: "Makkah" | "Madinah"): Promise<HotelRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  let query = supabase.from("hotels").select("*").eq("is_active", true);
  if (city) query = query.eq("city", city);
  const { data, error } = await query.order("display_order", { ascending: true });
  if (error) {
    console.error("getActiveHotels", error.message);
    return [];
  }
  return data ?? [];
}

export async function getHotelBySlug(slug: string): Promise<HotelRow | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("hotels")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error) {
    console.error("getHotelBySlug", error.message);
    return null;
  }
  return data;
}

export async function getHotelRooms(hotelId: string): Promise<HotelRoomRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("hotel_rooms")
    .select("*")
    .eq("hotel_id", hotelId)
    .eq("is_active", true)
    .order("display_order", { ascending: true });
  if (error) {
    console.error("getHotelRooms", error.message);
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
