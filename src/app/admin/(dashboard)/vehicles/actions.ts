"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function getClient() {
  try {
    return createAdminClient();
  } catch {
    // Admin client unavailable — fall back to session-based client
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) return supabase;
  } catch {
    // ignore
  }

  return createClient();
}

export async function saveVehicleType(formData: FormData) {
  try {
    const supabase = await getClient();

    const id = formData.get("id") as string | null;
    const name = (formData.get("name") as string)?.trim();
    const capacity_label = (formData.get("capacity_label") as string)?.trim();
    const description = (formData.get("description") as string)?.trim() || null;
    const image_url = (formData.get("image_url") as string)?.trim() || null;
    const is_active = formData.get("is_active") === "true" || formData.get("is_active") === "on";
    const display_order = parseInt((formData.get("display_order") as string) || "0", 10);

    if (!name || !capacity_label) {
      console.error("Vehicle name and capacity label are required.");
      return;
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    const payload = {
      name,
      slug,
      capacity_label,
      description,
      image_url,
      is_active,
      display_order,
      updated_at: new Date().toISOString(),
    };

    if (id) {
      const { error } = await supabase.from("ziyarat_vehicle_types").update(payload).eq("id", id);
      if (error) {
        console.error("[saveVehicleType] update error:", error.message);
        return;
      }
    } else {
      const { error } = await supabase.from("ziyarat_vehicle_types").insert([payload]);
      if (error) {
        console.error("[saveVehicleType] insert error:", error.message);
        return;
      }
    }

    revalidatePath("/admin/vehicles");
  } catch (err) {
    console.error("[saveVehicleType] Unexpected error:", err);
  }
}

export async function toggleVehicleActive(id: string, is_active: boolean) {
  try {
    const supabase = await getClient();
    const { error } = await supabase
      .from("ziyarat_vehicle_types")
      .update({ is_active, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) console.error("[toggleVehicleActive] error:", error.message);
    revalidatePath("/admin/vehicles");
  } catch (err) {
    console.error("[toggleVehicleActive] Unexpected error:", err);
  }
}

export async function deleteVehicleType(id: string) {
  try {
    const supabase = await getClient();
    const { error } = await supabase.from("ziyarat_vehicle_types").delete().eq("id", id);

    if (error) console.error("[deleteVehicleType] error:", error.message);
    revalidatePath("/admin/vehicles");
  } catch (err) {
    console.error("[deleteVehicleType] Unexpected error:", err);
  }
}

export async function savePricingMatrix(prices: Array<{ city: "Makkah" | "Madinah"; vehicle_type_id: string; price_aed: number }>) {
  try {
    const supabase = await getClient();

    for (const item of prices) {
      const { error } = await supabase
        .from("ziyarat_pricing")
        .upsert(
          {
            city: item.city,
            vehicle_type_id: item.vehicle_type_id,
            price_aed: item.price_aed,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "city,vehicle_type_id" }
        );
      if (error) console.error("[savePricingMatrix] error:", error.message);
    }

    revalidatePath("/admin/vehicles");
  } catch (err) {
    console.error("[savePricingMatrix] Unexpected error:", err);
  }
}
