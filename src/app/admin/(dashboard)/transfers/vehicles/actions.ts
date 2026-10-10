"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function getClient() {
  try {
    return createAdminClient();
  } catch {
    // fallback
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) return supabase;
  } catch {
    // ignore
  }

  return createClient();
}

function isSchemaCacheOrColumnError(error: any): boolean {
  if (!error) return false;
  if (error.code === "PGRST204" || error.code === "42703") return true;
  const msg = (error.message || "").toLowerCase();
  return (
    msg.includes("column") ||
    msg.includes("schema cache") ||
    msg.includes("could not find the")
  );
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function toggleVehicleActive(id: string, newActive: boolean) {
  const supabase = await getClient();

  let targetId = id;
  if (!UUID_REGEX.test(targetId)) {
    const { data: existing } = await supabase
      .from("transfer_vehicles")
      .select("id")
      .ilike("name", id)
      .maybeSingle();
    if (existing) targetId = existing.id;
  }

  const { error } = await supabase
    .from("transfer_vehicles")
    .update({ is_active: newActive })
    .eq("id", targetId);

  if (error) {
    console.error("toggleVehicleActive error:", error.message);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/transfers/vehicles");
  revalidatePath("/admin/transfers/rate-card");
  revalidatePath("/admin/transfers");
  revalidatePath("/transfers");
  return { success: true };
}

export async function updateVehicleOrder(id: string, displayOrder: number) {
  const supabase = await getClient();

  let targetId = id;
  if (!UUID_REGEX.test(targetId)) {
    const { data: existing } = await supabase
      .from("transfer_vehicles")
      .select("id")
      .ilike("name", id)
      .maybeSingle();
    if (existing) targetId = existing.id;
  }

  const { error } = await supabase
    .from("transfer_vehicles")
    .update({ display_order: displayOrder })
    .eq("id", targetId);

  if (error) {
    console.error("updateVehicleOrder error:", error.message);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/transfers/vehicles");
  revalidatePath("/admin/transfers/rate-card");
  return { success: true };
}

export async function saveVehicle(formData: FormData) {
  const supabase = await getClient();

  const id = formData.get("id")?.toString().trim();
  const name = formData.get("name")?.toString().trim();
  const displayOrder = Number(formData.get("display_order") || 1);
  const isActive = formData.get("is_active") === "true";

  if (!name) {
    return { success: false, error: "Vehicle name is required." };
  }

  // Core payload
  const corePayload = {
    name,
    display_order: displayOrder,
    is_active: isActive,
  };

  // Extended payload (if columns exist from migration 0083)
  const modelYear = formData.get("model_year")?.toString().trim() || null;
  const shortDescription = formData.get("short_description")?.toString().trim() || null;
  const detailedDescription = formData.get("detailed_description")?.toString().trim() || null;
  const imageUrl = formData.get("image_url")?.toString().trim() || null;
  const passengerCapacity = Number(formData.get("passenger_capacity") || 0);
  const luggageCapacity = Number(formData.get("luggage_capacity") || 0);
  const featuresRaw = formData.get("features")?.toString().trim();
  let features: string[] = [];
  if (featuresRaw) {
    try {
      features = JSON.parse(featuresRaw);
    } catch {
      features = featuresRaw.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }

  const extendedPayload = {
    ...corePayload,
    model_year: modelYear,
    description: shortDescription,
    detailed_description: detailedDescription,
    image_url: imageUrl,
    passenger_capacity: passengerCapacity,
    luggage_capacity: luggageCapacity,
    features,
    spec_verified: true,
  };

  let targetId = id;
  if (targetId && !UUID_REGEX.test(targetId)) {
    const { data: existing } = await supabase
      .from("transfer_vehicles")
      .select("id")
      .ilike("name", name)
      .maybeSingle();
    targetId = existing?.id;
  }

  if (targetId) {
    // Attempt with extended payload first
    let { error } = await supabase
      .from("transfer_vehicles")
      .update(extendedPayload)
      .eq("id", targetId);

    if (isSchemaCacheOrColumnError(error)) {
      console.warn("Extended columns not present on transfer_vehicles. Updating core columns only.");
      const res = await supabase
        .from("transfer_vehicles")
        .update(corePayload)
        .eq("id", targetId);
      error = res.error;
    }

    if (error) {
      console.error("saveVehicle update error:", error.message);
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/transfers/vehicles");
    revalidatePath("/admin/transfers/rate-card");
    revalidatePath("/admin/transfers");
    revalidatePath("/transfers");
    return { success: true, id: targetId };
  } else {
    // New vehicle
    let { data: newRow, error } = await supabase
      .from("transfer_vehicles")
      .insert(extendedPayload)
      .select("id")
      .single();

    if (isSchemaCacheOrColumnError(error)) {
      console.warn("Extended columns not present on transfer_vehicles. Inserting core columns only.");
      const res = await supabase
        .from("transfer_vehicles")
        .insert(corePayload)
        .select("id")
        .single();
      newRow = res.data;
      error = res.error;
    }

    if (error) {
      console.error("saveVehicle insert error:", error.message);
      return { success: false, error: error.message };
    }

    // Connect this new vehicle to existing active transfer routes in the rate card
    if (newRow?.id) {
      try {
        const { data: routes } = await supabase
          .from("transfers")
          .select("id")
          .eq("is_active", true);

        if (routes && routes.length > 0) {
          const rateInserts = routes.map((r) => ({
            transfer_id: r.id,
            vehicle_id: newRow.id,
            price_aed: 0,
            is_active: true,
            display_order: 0,
          }));
          await supabase.from("transfer_route_rates").upsert(rateInserts, { onConflict: "transfer_id,vehicle_id" });
        }
      } catch (rateErr) {
        console.warn("[saveVehicle] Rate card linkage skipped:", rateErr);
      }
    }

    revalidatePath("/admin/transfers/vehicles");
    revalidatePath("/admin/transfers/rate-card");
    revalidatePath("/admin/transfers");
    revalidatePath("/transfers");
    return { success: true, id: newRow?.id };
  }
}
