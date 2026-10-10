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

export async function toggleVehicleActive(id: string, newActive: boolean) {
  const supabase = await getClient();

  const { error } = await supabase
    .from("transfer_vehicles")
    .update({ is_active: newActive })
    .eq("id", id);

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

  const { error } = await supabase
    .from("transfer_vehicles")
    .update({ display_order: displayOrder })
    .eq("id", id);

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

  if (id) {
    // Attempt with extended payload first
    let { error } = await supabase
      .from("transfer_vehicles")
      .update(extendedPayload)
      .eq("id", id);

    if (error && error.code === "42703") {
      // Column doesn't exist yet in remote schema, fall back to core columns
      console.warn("Extended columns not present on transfer_vehicles. Updating core columns only.");
      const res = await supabase
        .from("transfer_vehicles")
        .update(corePayload)
        .eq("id", id);
      error = res.error;
    }

    if (error) {
      console.error("saveVehicle update error:", error.message);
      return { success: false, error: error.message };
    }
  } else {
    // New vehicle
    let { error } = await supabase
      .from("transfer_vehicles")
      .insert(extendedPayload);

    if (error && error.code === "42703") {
      const res = await supabase
        .from("transfer_vehicles")
        .insert(corePayload);
      error = res.error;
    }

    if (error) {
      console.error("saveVehicle insert error:", error.message);
      return { success: false, error: error.message };
    }
  }

  revalidatePath("/admin/transfers/vehicles");
  revalidatePath("/admin/transfers/rate-card");
  revalidatePath("/admin/transfers");
  revalidatePath("/transfers");
  return { success: true };
}
