"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface DepartureMonthFormState {
  status: "idle" | "error";
  message?: string;
}

/**
 * Writes here need to survive dev_bypass mode the same way every other
 * admin actions file does (see hotels/actions.ts, users/actions.ts,
 * umrah-inventory/actions.ts) — without this, an is_active toggle under
 * dev_bypass silently no-ops: createClient() runs as the RLS "anon" role
 * (no real Supabase session exists in dev_bypass), and
 * umrah_departure_months only grants writes to "authenticated". This file
 * was missing that fallback entirely, which is exactly what made
 * toggleDepartureMonthActive look like it worked (no thrown error) while
 * never actually changing the row.
 */
async function getClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) return supabase;

  if (process.env.NODE_ENV !== "production" && process.env.ALLOW_DEV_AUTH_BYPASS === "true") {
    return createAdminClient();
  }

  return supabase;
}

export async function saveDepartureMonth(
  monthId: string | null,
  _prevState: DepartureMonthFormState,
  formData: FormData
): Promise<DepartureMonthFormState> {
  const displayLabel = String(formData.get("display_label") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const sortOrder = Number(formData.get("sort_order") ?? 0);
  const isActive = formData.get("is_active") === "on";

  if (!displayLabel || !slug) {
    return { status: "error", message: "Display label and slug are required." };
  }

  const textField = (name: string) => String(formData.get(name) ?? "").trim() || null;

  const payload = {
    display_label: displayLabel,
    slug,
    hero_image_url: textField("hero_image_url"),
    hero_headline: textField("hero_headline"),
    hero_subtext: textField("hero_subtext"),
    best_for_note: textField("best_for_note"),
    booking_advice_note: textField("booking_advice_note"),
    meta_title: textField("meta_title"),
    meta_description: textField("meta_description"),
    sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
    is_active: isActive,
  };

  const supabase = await getClient();

  if (monthId) {
    const { error } = await supabase.from("umrah_departure_months").update(payload).eq("id", monthId);
    if (error) {
      if (error.code === "23505") return { status: "error", message: `The slug "${slug}" is already in use.` };
      return { status: "error", message: error.message };
    }
  } else {
    const { error } = await supabase.from("umrah_departure_months").insert(payload);
    if (error) {
      if (error.code === "23505") return { status: "error", message: `The slug "${slug}" is already in use.` };
      return { status: "error", message: error.message };
    }
  }

  revalidateDepartureMonthPaths();
  redirect("/admin/umrah-departures");
}

export async function deleteDepartureMonth(id: string) {
  const supabase = await getClient();
  const { error } = await supabase.from("umrah_departure_months").delete().eq("id", id);
  if (error) console.error("deleteDepartureMonth", error.message);
  revalidateDepartureMonthPaths();
}

export async function toggleDepartureMonthActive(id: string, isActive: boolean) {
  const supabase = await getClient();
  const { error } = await supabase.from("umrah_departure_months").update({ is_active: isActive }).eq("id", id);
  if (error) console.error("toggleDepartureMonthActive", error.message);
  revalidateDepartureMonthPaths();
}

/**
 * A month's is_active status gates real public visibility (see
 * getActiveUmrahDepartureMonths/getActiveUmrahDepartureMonthBySlug in
 * lib/data/public.ts — the nav dropdown, sitemap, and the month's own
 * /umrah/departures/[slug] page all read it, not just this admin badge),
 * and also changes which /umrah/[slug] package configurations show
 * (getPublishedUmrahInventoryConfigurations excludes a config whose
 * month is inactive). Revalidate every one of those, plus the sibling
 * Umrah Inventory Management screen's own month cards — not just this
 * form's own admin page — so a status flip takes effect everywhere on
 * the next request, not just here.
 */
function revalidateDepartureMonthPaths() {
  revalidatePath("/admin/umrah-departures");
  revalidatePath("/admin/umrah-inventory");
  revalidatePath("/umrah", "layout");
  revalidatePath("/", "layout");
  revalidatePath("/sitemap.xml");
}
