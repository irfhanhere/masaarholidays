"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TransferRow } from "@/lib/types/database";
import { SUPPLIED_RATE_CARD } from "@/lib/data/transfers";

export interface TransferFormState {
  status: "idle" | "success" | "error";
  message?: string;
}

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

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function saveTransfer(
  transferId: string | null,
  _prevState: TransferFormState,
  formData: FormData
): Promise<TransferFormState> {
  const routeName = String(formData.get("route_name") ?? "").trim();
  if (!routeName) return { status: "error", message: "Route name is required." };

  const rawSlug = String(formData.get("slug") ?? "").trim();
  const slug = rawSlug ? slugify(rawSlug) : slugify(routeName);

  const transferType = String(formData.get("transfer_type") ?? "airport") as TransferRow["transfer_type"];
  const description = String(formData.get("description") ?? "").trim() || null;
  const longDescription = String(formData.get("long_description") ?? "").trim() || null;
  const imageUrl = String(formData.get("image_url") ?? "").trim() || null;
  const pickupLocation = String(formData.get("pickup_location") ?? "").trim() || null;
  const dropoffLocation = String(formData.get("dropoff_location") ?? "").trim() || null;
  const routeType = String(formData.get("route_type") ?? "one-way");
  const duration = String(formData.get("duration") ?? "").trim() || null;
  const routeNotes = String(formData.get("route_notes") ?? "").trim() || null;
  const isActive = formData.get("is_active") === "on";
  const featured = formData.get("featured") === "on";
  const displayOrder = parseInt(String(formData.get("display_order") ?? "0")) || 0;
  const seoTitle = String(formData.get("seo_title") ?? "").trim() || null;
  const metaDescription = String(formData.get("meta_description") ?? "").trim() || null;
  const focusKeyword = String(formData.get("focus_keyword") ?? "").trim() || null;

  const fullPayload: Record<string, any> = {
    route_name: routeName,
    slug,
    transfer_type: transferType,
    description,
    image_url: imageUrl,
    is_active: isActive,
    display_order: displayOrder,
    pickup_location: pickupLocation,
    dropoff_location: dropoffLocation,
    route_type: routeType,
    long_description: longDescription,
    duration,
    route_notes: routeNotes,
    featured,
    seo_title: seoTitle,
    meta_description: metaDescription,
    focus_keyword: focusKeyword,
  };

  const corePayload: Record<string, any> = {
    route_name: routeName,
    slug,
    transfer_type: transferType,
    description,
    image_url: imageUrl,
    is_active: isActive,
    display_order: displayOrder,
  };

  try {
    const supabase = await getClient();

    let targetId = transferId;
    if (targetId && !UUID_REGEX.test(targetId)) {
      const { data: bySlug } = await supabase.from("transfers").select("id").eq("slug", slug).maybeSingle();
      targetId = bySlug?.id || null;
    }

    if (targetId) {
      let { error } = await supabase.from("transfers").update(fullPayload as any).eq("id", targetId);
      if (isSchemaCacheOrColumnError(error)) {
        // Fallback to core payload if columns don't exist yet in remote schema
        const fallbackRes = await supabase.from("transfers").update(corePayload as any).eq("id", targetId);
        error = fallbackRes.error;
      }
      if (error) return { status: "error", message: error.message };
    } else {
      let { data: newRow, error } = await supabase.from("transfers").insert(fullPayload as any).select("id").single();
      if (isSchemaCacheOrColumnError(error)) {
        const fallbackRes = await supabase.from("transfers").insert(corePayload as any).select("id").single();
        newRow = fallbackRes.data;
        error = fallbackRes.error;
      }
      if (error) return { status: "error", message: error.message };

      // Initialize rate card rows for active vehicles
      if (newRow?.id) {
        try {
          const { data: activeVehicles } = await supabase
            .from("transfer_vehicles")
            .select("id, name")
            .eq("is_active", true);

          if (activeVehicles && activeVehicles.length > 0) {
            const fallbackRates = SUPPLIED_RATE_CARD[slug] || {};
            const initialRates = activeVehicles.map((v) => ({
              transfer_id: newRow.id,
              vehicle_id: v.id,
              price_aed: fallbackRates[v.name] || 0,
              is_active: true,
              display_order: 0,
            }));
            await supabase.from("transfer_route_rates").upsert(initialRates, { onConflict: "transfer_id,vehicle_id" });
          }
        } catch (e) {
          console.warn("[saveTransfer] Rate card initialization skipped:", e);
        }
      }
    }

    revalidatePath("/admin/transfers");
    revalidatePath("/admin/transfers/rate-card");
    revalidatePath("/transfers");
    revalidatePath(`/transfers/${slug}`);
    redirect("/admin/transfers");
  } catch (err: any) {
    if (err?.message?.includes("NEXT_REDIRECT") || err?.digest?.includes("NEXT_REDIRECT")) {
      throw err;
    }
    console.error("[saveTransfer] Error:", err);
    return { status: "error", message: err?.message || "Failed to save transfer" };
  }
}

export async function toggleTransferActive(id: string, isActive: boolean) {
  try {
    const supabase = await getClient();
    let targetId = id;
    if (!UUID_REGEX.test(targetId)) {
      const { data: existing } = await supabase.from("transfers").select("id").eq("slug", id).maybeSingle();
      if (existing) targetId = existing.id;
    }
    await supabase.from("transfers").update({ is_active: isActive }).eq("id", targetId);
    revalidatePath("/admin/transfers");
    revalidatePath("/admin/transfers/rate-card");
    revalidatePath("/transfers");
  } catch (err) {
    console.error("[toggleTransferActive] Error:", err);
  }
}

export async function toggleTransferFeatured(id: string, isFeatured: boolean) {
  try {
    const supabase = await getClient();
    let targetId = id;
    if (!UUID_REGEX.test(targetId)) {
      const { data: existing } = await supabase.from("transfers").select("id").eq("slug", id).maybeSingle();
      if (existing) targetId = existing.id;
    }
    const { error } = await supabase.from("transfers").update({ featured: isFeatured }).eq("id", targetId);
    if (error) {
      console.warn("Featured column update skipped:", error.message);
    }
    revalidatePath("/admin/transfers");
    revalidatePath("/transfers");
  } catch (err) {
    console.error("[toggleTransferFeatured] Error:", err);
  }
}

export async function duplicateTransfer(id: string) {
  try {
    const supabase = await getClient();
    let targetId = id;
    if (!UUID_REGEX.test(targetId)) {
      const { data: bySlug } = await supabase.from("transfers").select("id").eq("slug", id).maybeSingle();
      if (bySlug) targetId = bySlug.id;
    }

    const { data: original, error: fetchErr } = await supabase
      .from("transfers")
      .select("*")
      .eq("id", targetId)
      .maybeSingle();

    if (fetchErr || !original) {
      console.error("[duplicateTransfer] Original not found:", fetchErr);
      return;
    }

    const newSlug = `${original.slug}-copy-${Date.now().toString(36)}`;
    const newName = `${original.route_name} (Copy)`;

    const insertPayload = {
      ...original,
    };
    delete (insertPayload as any).id;
    delete (insertPayload as any).created_at;
    delete (insertPayload as any).updated_at;
    insertPayload.slug = newSlug;
    insertPayload.route_name = newName;

    const { data: newRow, error: insertErr } = await supabase
      .from("transfers")
      .insert(insertPayload)
      .select("id")
      .single();

    if (insertErr || !newRow) {
      console.error("[duplicateTransfer] Insert failed:", insertErr);
      return;
    }

    // Clone rates for the new transfer
    const { data: rates } = await supabase
      .from("transfer_route_rates")
      .select("*")
      .eq("transfer_id", targetId);

    if (rates && rates.length > 0) {
      const clonedRates = rates.map((r) => ({
        transfer_id: newRow.id,
        vehicle_id: r.vehicle_id,
        price_aed: r.price_aed,
        is_active: r.is_active,
        display_order: r.display_order,
      }));
      await supabase.from("transfer_route_rates").insert(clonedRates);
    }

    revalidatePath("/admin/transfers");
    revalidatePath("/admin/transfers/rate-card");
    revalidatePath("/transfers");
  } catch (err) {
    console.error("[duplicateTransfer] Error:", err);
  }
}

export async function deleteTransfer(id: string) {
  try {
    const supabase = await getClient();
    let targetId = id;
    if (!UUID_REGEX.test(targetId)) {
      const { data: existing } = await supabase.from("transfers").select("id").eq("slug", id).maybeSingle();
      if (existing) targetId = existing.id;
    }
    await supabase.from("transfers").delete().eq("id", targetId);
    revalidatePath("/admin/transfers");
    revalidatePath("/admin/transfers/rate-card");
    revalidatePath("/transfers");
  } catch (err) {
    console.error("[deleteTransfer] Error:", err);
  }
}
