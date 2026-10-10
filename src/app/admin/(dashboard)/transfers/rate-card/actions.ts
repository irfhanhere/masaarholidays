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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) return supabase;
  } catch {
    // ignore
  }

  return createClient();
}

export interface RateUpdateItem {
  transfer_id: string;
  vehicle_id: string;
  price_aed: number;
  is_active: boolean;
}

/**
 * Server action to save the entire Rate Card Matrix with server-side validation.
 */
export async function saveRateCardBulk(rates: RateUpdateItem[]) {
  const supabase = await getClient();

  // Validate server-side
  const validUpdates: RateUpdateItem[] = [];
  for (const item of rates) {
    if (!item.transfer_id || !item.vehicle_id) continue;
    const price = Number(item.price_aed);
    if (Number.isNaN(price) || price < 0 || !Number.isFinite(price)) {
      return { success: false, error: `Invalid price AED value for route: ${item.price_aed}` };
    }
    validUpdates.push({
      transfer_id: item.transfer_id,
      vehicle_id: item.vehicle_id,
      price_aed: Math.round(price * 100) / 100, // Round to 2 decimal places
      is_active: Boolean(item.is_active),
    });
  }

  if (validUpdates.length > 0) {
    const { error } = await supabase
      .from("transfer_route_rates")
      .upsert(validUpdates, { onConflict: "transfer_id,vehicle_id" });

    if (error) {
      console.error("saveRateCardBulk error:", error.message);
      return { success: false, error: error.message };
    }
  }

  // Revalidate admin and public routes
  revalidatePath("/admin/transfers/rate-card");
  revalidatePath("/admin/transfers");
  revalidatePath("/transfers");
  revalidatePath("/transfers/[slug]", "page");

  return { success: true, count: validUpdates.length };
}

/**
 * Form-based fallback action
 */
export async function updateRateCard(formData: FormData) {
  const supabase = await getClient();

  const updates: RateUpdateItem[] = [];
  for (const [key, value] of formData.entries()) {
    const match = key.match(/^rate__(.+)__(.+)$/);
    if (!match || value === "") continue;
    const price = Number(value);
    if (Number.isNaN(price) || price < 0) continue;

    // Check if active flag exists
    const activeKey = `active__${match[1]}__${match[2]}`;
    const isActive = formData.get(activeKey) !== "false";

    updates.push({
      transfer_id: match[1],
      vehicle_id: match[2],
      price_aed: price,
      is_active: isActive,
    });
  }

  if (updates.length > 0) {
    const { error } = await supabase
      .from("transfer_route_rates")
      .upsert(updates, { onConflict: "transfer_id,vehicle_id" });
    if (error) console.error("updateRateCard", error.message);
  }

  revalidatePath("/admin/transfers/rate-card");
  revalidatePath("/admin/transfers");
  revalidatePath("/transfers");
}
