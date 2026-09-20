"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { HotelDataConfidence, HotelPrimaryGate } from "@/lib/types/database";

export interface HotelFormState {
  status: "idle" | "error";
  message?: string;
}

async function getClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    return supabase;
  }

  if (process.env.NODE_ENV !== "production" && process.env.ALLOW_DEV_AUTH_BYPASS === "true") {
    return createAdminClient();
  }

  return supabase;
}

function slugify(input: string) {
  return input.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function saveHotel(
  hotelId: string | null,
  _prevState: HotelFormState,
  formData: FormData
): Promise<HotelFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  if (!name || !city) return { status: "error", message: "Hotel name and city are required." };

  const textField = (field: string) => String(formData.get(field) ?? "").trim() || null;
  const numberField = (field: string) => (formData.get(field) ? Number(formData.get(field)) : null);
  const urlListField = (field: string) =>
    String(formData.get(field) ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

  const primaryGate = String(formData.get("primary_gate") ?? "").trim();
  const dataConfidence = String(formData.get("data_confidence") ?? "").trim();

  const payload = {
    name,
    city,
    category: textField("category"),
    star_rating: numberField("star_rating"),
    distance_from_haram_meters: numberField("distance_from_haram_meters"),
    walk_time_minutes: numberField("walk_time_minutes"),
    walk_time_minutes_max: numberField("walk_time_minutes_max"),
    terrain_note: textField("terrain_note"),
    room_type: textField("room_type"),
    board_basis: textField("board_basis"),
    cancellation_policy: textField("cancellation_policy"),
    view_type: textField("view_type"),
    price_from_aed: numberField("price_from_aed"),
    description: textField("description"),
    image_url: textField("image_url"),
    route_type: textField("route_type"),
    elderly_family_suitability_note: textField("elderly_family_suitability_note"),
    shuttle_available: formData.get("shuttle_available") === "on",
    shuttle_note: textField("shuttle_note"),
    accessibility_note: textField("accessibility_note"),
    google_maps_url: textField("google_maps_url"),
    meta_title: textField("meta_title"),
    meta_description: textField("meta_description"),
    gallery_image_urls: urlListField("gallery_image_urls"),
    // Madinah-only — left null for Makkah, since the form doesn't render these inputs for Makkah in the first place.
    mens_gate_walk_minutes_min: city === "Madinah" ? numberField("mens_gate_walk_minutes_min") : null,
    mens_gate_walk_minutes_max: city === "Madinah" ? numberField("mens_gate_walk_minutes_max") : null,
    ladies_gate_walk_minutes_min: city === "Madinah" ? numberField("ladies_gate_walk_minutes_min") : null,
    ladies_gate_walk_minutes_max: city === "Madinah" ? numberField("ladies_gate_walk_minutes_max") : null,
    nearest_mens_gate: city === "Madinah" ? textField("nearest_mens_gate") : null,
    nearest_ladies_gate: city === "Madinah" ? textField("nearest_ladies_gate") : null,
    in_haram_plaza_walk_note: city === "Madinah" ? textField("in_haram_plaza_walk_note") : null,
    zone: city === "Madinah" ? textField("zone") : null,
    primary_gate: (city === "Madinah" && (primaryGate === "mens" || primaryGate === "ladies")
      ? primaryGate
      : null) as HotelPrimaryGate | null,
    // Admin-only — never selected/rendered by the public site (see lib/data/public.ts's explicit column list).
    data_confidence: (dataConfidence === "verified" ||
    dataConfidence === "estimated" ||
    dataConfidence === "needs_verification"
      ? dataConfidence
      : null) as HotelDataConfidence | null,
    admin_caution_note: textField("admin_caution_note"),
    is_active: formData.get("is_active") === "on",
  };

  const supabase = await getClient();

  if (hotelId) {
    const { error } = await supabase.from("hotels").update(payload).eq("id", hotelId);
    if (error) return { status: "error", message: error.message };
  } else {
    const slug = `${slugify(name)}-${Date.now().toString(36)}`;
    const { error } = await supabase.from("hotels").insert({ ...payload, slug });
    if (error) return { status: "error", message: error.message };
  }

  revalidatePath("/admin/hotels");
  redirect("/admin/hotels");
}

export async function deleteHotel(id: string) {
  const supabase = await getClient();
  await supabase.from("hotels").delete().eq("id", id);
  revalidatePath("/admin/hotels");
}

export async function toggleHotelActive(id: string, isActive: boolean) {
  const supabase = await getClient();
  await supabase.from("hotels").update({ is_active: isActive }).eq("id", id);
  revalidatePath("/admin/hotels");
}

export interface HotelRoomFormState {
  status: "idle" | "success" | "error";
  message?: string;
}

function parseConfidence(value: FormDataEntryValue | null): HotelDataConfidence | null {
  const v = String(value ?? "").trim();
  return v === "verified" || v === "estimated" || v === "needs_verification" ? v : null;
}

export async function saveHotelRoom(
  hotelId: string,
  roomId: string | null,
  _prevState: HotelRoomFormState,
  formData: FormData
): Promise<HotelRoomFormState> {
  const roomType = String(formData.get("room_type") ?? "").trim();
  if (!roomType) return { status: "error", message: "Room name is required." };

  const textField = (field: string) => String(formData.get(field) ?? "").trim() || null;
  const numberField = (field: string) => (formData.get(field) ? Number(formData.get(field)) : null);
  const listField = (field: string) =>
    String(formData.get(field) ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

  const priceRo = numberField("price_ro");
  const priceBb = numberField("price_bb");
  if (priceRo == null && priceBb == null) {
    return { status: "error", message: "At least one of Room Only or B&B price is required." };
  }

  const payload = {
    hotel_id: hotelId,
    room_type: roomType,
    price_ro: priceRo,
    price_bb: priceBb,
    bed_type: textField("bed_type"),
    notes: textField("notes"),
    rate_period_label: textField("rate_period_label"),
    image_url: textField("image_url"),
    size_sqm: numberField("size_sqm"),
    bed_count: numberField("bed_count"),
    bathroom_count: numberField("bathroom_count"),
    view_options: listField("view_options"),
    board_basis_options: listField("board_basis_options"),
    cancellation_policy_options: listField("cancellation_policy_options"),
    // Admin-only — never selected/rendered by the public site (see lib/data/public.ts's explicit column list).
    data_confidence: parseConfidence(formData.get("data_confidence")),
    admin_caution_note: textField("admin_caution_note"),
    is_active: formData.get("is_active") === "on",
  };

  const supabase = await getClient();

  if (roomId) {
    const { error } = await supabase.from("hotel_rooms").update(payload).eq("id", roomId);
    if (error) {
      if (error.code === "23505") return { status: "error", message: `This hotel already has a room named "${roomType}".` };
      return { status: "error", message: error.message };
    }
  } else {
    const { count } = await supabase
      .from("hotel_rooms")
      .select("id", { count: "exact", head: true })
      .eq("hotel_id", hotelId);
    const { error } = await supabase.from("hotel_rooms").insert({ ...payload, display_order: count ?? 0 });
    if (error) {
      if (error.code === "23505") return { status: "error", message: `This hotel already has a room named "${roomType}".` };
      return { status: "error", message: error.message };
    }
  }

  revalidatePath(`/admin/hotels/${hotelId}`);
  revalidatePath("/hotels");
  return { status: "success" };
}

export async function deleteHotelRoom(hotelId: string, roomId: string) {
  const supabase = await getClient();
  await supabase.from("hotel_rooms").delete().eq("id", roomId);
  revalidatePath(`/admin/hotels/${hotelId}`);
  revalidatePath("/hotels");
}
