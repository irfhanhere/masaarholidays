"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface HotelFormState {
  status: "idle" | "error";
  message?: string;
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

  const payload = {
    name,
    city,
    category: String(formData.get("category") ?? "").trim() || null,
    star_rating: formData.get("star_rating") ? Number(formData.get("star_rating")) : null,
    distance_from_haram_meters: formData.get("distance_from_haram_meters")
      ? Number(formData.get("distance_from_haram_meters"))
      : null,
    walk_time_minutes: formData.get("walk_time_minutes") ? Number(formData.get("walk_time_minutes")) : null,
    room_type: String(formData.get("room_type") ?? "").trim() || null,
    board_basis: String(formData.get("board_basis") ?? "").trim() || null,
    price_from_aed: formData.get("price_from_aed") ? Number(formData.get("price_from_aed")) : null,
    description: String(formData.get("description") ?? "").trim() || null,
    image_url: String(formData.get("image_url") ?? "").trim() || null,
    is_active: formData.get("is_active") === "on",
  };

  const supabase = await createClient();

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
  const supabase = await createClient();
  await supabase.from("hotels").delete().eq("id", id);
  revalidatePath("/admin/hotels");
}

export async function toggleHotelActive(id: string, isActive: boolean) {
  const supabase = await createClient();
  await supabase.from("hotels").update({ is_active: isActive }).eq("id", id);
  revalidatePath("/admin/hotels");
}
