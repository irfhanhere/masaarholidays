"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Admin-only reference data (masaar-client-data-round2.md, Section 3) —
 * this action, and everything that reads transfer_route_rates directly,
 * requires an authenticated session per RLS (0005_transfer_rate_card.sql).
 * The public site never calls this and can't read this table at all.
 */
export async function updateRateCard(formData: FormData) {
  const supabase = await createClient();

  const updates: { transfer_id: string; vehicle_id: string; price_aed: number }[] = [];
  for (const [key, value] of formData.entries()) {
    const match = key.match(/^rate__(.+)__(.+)$/);
    if (!match || value === "") continue;
    const price = Number(value);
    if (Number.isNaN(price) || price < 0) continue;
    updates.push({ transfer_id: match[1], vehicle_id: match[2], price_aed: price });
  }

  if (updates.length > 0) {
    const { error } = await supabase
      .from("transfer_route_rates")
      .upsert(updates, { onConflict: "transfer_id,vehicle_id" });
    if (error) console.error("updateRateCard", error.message);
  }

  revalidatePath("/admin/transfers/rate-card");
}
