"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UmrahJourneyType, PackageItineraryDay, PublishStatus } from "@/lib/types/database";

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

export async function saveInventoryConfiguration(formData: FormData) {
  const supabase = await getClient();

  const id = (formData.get("id") as string)?.trim() || null;
  const package_id = (formData.get("package_id") as string)?.trim();
  const journey_type = (formData.get("journey_type") as string)?.trim() as UmrahJourneyType;
  const month_id = (formData.get("month_id") as string)?.trim() || null;
  const duration_nights = parseInt((formData.get("duration_nights") as string) || "0", 10);
  const duration_days = parseInt((formData.get("duration_days") as string) || "0", 10);
  const duration_label = (formData.get("duration_label") as string)?.trim() || `${duration_nights} Nights / ${duration_days} Days`;
  const status = ((formData.get("status") as string)?.trim() || "published") as PublishStatus;

  // Option A Hotels
  const makkah_hotel_id = (formData.get("makkah_hotel_id") as string)?.trim() || null;
  const makkah_allow_similar = formData.get("makkah_allow_similar") === "on";
  const makkah_custom_note = (formData.get("makkah_custom_note") as string)?.trim() || null;

  const madinah_hotel_id = journey_type === "makkah_madinah" ? (formData.get("madinah_hotel_id") as string)?.trim() || null : null;
  const madinah_allow_similar = journey_type === "makkah_madinah" ? formData.get("madinah_allow_similar") === "on" : false;
  const madinah_custom_note = journey_type === "makkah_madinah" ? (formData.get("madinah_custom_note") as string)?.trim() || null : null;

  // Option B (Alternate) Hotels
  const makkah_hotel_id_alt = (formData.get("makkah_hotel_id_alt") as string)?.trim() || null;
  const makkah_allow_similar_alt = formData.get("makkah_allow_similar_alt") === "on";
  const makkah_custom_note_alt = (formData.get("makkah_custom_note_alt") as string)?.trim() || null;

  const madinah_hotel_id_alt = journey_type === "makkah_madinah" ? (formData.get("madinah_hotel_id_alt") as string)?.trim() || null : null;
  const madinah_allow_similar_alt = journey_type === "makkah_madinah" ? formData.get("madinah_allow_similar_alt") === "on" : false;
  const madinah_custom_note_alt = journey_type === "makkah_madinah" ? (formData.get("madinah_custom_note_alt") as string)?.trim() || null : null;

  // Inclusions override
  const inclusions_override = (formData.get("inclusions_override") as string)?.trim() || null;

  // Day-by-day Itinerary parsing
  const itineraryJsonRaw = (formData.get("itinerary_json") as string)?.trim() || "[]";
  let itinerary: PackageItineraryDay[] = [];
  try {
    itinerary = JSON.parse(itineraryJsonRaw);
  } catch {
    itinerary = [];
  }

  const payload = {
    package_id,
    journey_type,
    month_id,
    duration_nights,
    duration_days,
    duration_label,
    makkah_hotel_id,
    makkah_allow_similar,
    makkah_custom_note,
    madinah_hotel_id,
    madinah_allow_similar,
    madinah_custom_note,
    makkah_hotel_id_alt,
    makkah_allow_similar_alt,
    makkah_custom_note_alt,
    madinah_hotel_id_alt,
    madinah_allow_similar_alt,
    madinah_custom_note_alt,
    itinerary,
    inclusions_override,
    status,
  };

  let configId = id;

  if (configId) {
    const { error } = await supabase.from("umrah_inventory_configurations").update(payload).eq("id", configId);
    if (error) {
      throw new Error(error.message);
    }
  } else {
    const { data, error } = await supabase.from("umrah_inventory_configurations").insert(payload).select("id").single();
    if (error) {
      throw new Error(error.message);
    }
    configId = data.id;
  }

  // Room Pricing (Double, Triple, Quad, Single)
  const roomTypes = ["Double", "Triple", "Quad", "Single"];
  const roomPrices: { configuration_id: string; occupancy_type: string; price_aed: number; display_order: number }[] = [];

  roomTypes.forEach((occupancy, index) => {
    const valStr = (formData.get(`price_${occupancy.toLowerCase()}`) as string)?.trim();
    if (valStr) {
      const price = parseFloat(valStr);
      if (!isNaN(price) && price >= 0) {
        roomPrices.push({
          configuration_id: configId,
          occupancy_type: occupancy,
          price_aed: price,
          display_order: index,
        });
      }
    }
  });

  await supabase.from("umrah_configuration_room_prices").delete().eq("configuration_id", configId);
  if (roomPrices.length > 0) {
    await supabase.from("umrah_configuration_room_prices").insert(roomPrices);
  }

  // Private Trips assignments
  const selectedTripIds = formData.getAll("private_trip_ids") as string[];
  await supabase.from("umrah_configuration_private_trips").delete().eq("configuration_id", configId);
  if (selectedTripIds.length > 0) {
    await supabase.from("umrah_configuration_private_trips").insert(
      selectedTripIds.map((tripId, idx) => ({
        configuration_id: configId,
        private_trip_id: tripId,
        display_order: idx,
      }))
    );
  }

  revalidatePath("/admin/umrah-inventory");
  redirect("/admin/umrah-inventory");
}

export async function deleteInventoryConfiguration(id: string) {
  const supabase = await getClient();
  await supabase.from("umrah_inventory_configurations").delete().eq("id", id);
  revalidatePath("/admin/umrah-inventory");
}

export async function toggleInventoryConfigurationStatus(id: string, newStatus: PublishStatus) {
  const supabase = await getClient();
  await supabase.from("umrah_inventory_configurations").update({ status: newStatus }).eq("id", id);
  revalidatePath("/admin/umrah-inventory");
}
