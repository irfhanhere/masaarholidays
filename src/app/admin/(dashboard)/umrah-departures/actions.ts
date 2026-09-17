"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface DepartureMonthFormState {
  status: "idle" | "error";
  message?: string;
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

  const supabase = await createClient();

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

  revalidatePath("/admin/umrah-departures");
  redirect("/admin/umrah-departures");
}

export async function deleteDepartureMonth(id: string) {
  const supabase = await createClient();
  await supabase.from("umrah_departure_months").delete().eq("id", id);
  revalidatePath("/admin/umrah-departures");
}

export async function toggleDepartureMonthActive(id: string, isActive: boolean) {
  const supabase = await createClient();
  await supabase.from("umrah_departure_months").update({ is_active: isActive }).eq("id", id);
  revalidatePath("/admin/umrah-departures");
}
