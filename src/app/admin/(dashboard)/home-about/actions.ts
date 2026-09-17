"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface HomeContentFormState {
  status: "idle" | "error";
  message?: string;
}

export async function saveHomeContent(
  _prevState: HomeContentFormState,
  formData: FormData
): Promise<HomeContentFormState> {
  const textField = (field: string) => String(formData.get(field) ?? "").trim() || null;

  const supabase = await createClient();
  const { error } = await supabase.from("home_content").upsert({
    id: 1,
    cta_quote_text: textField("cta_quote_text"),
    cta_quote_reference: textField("cta_quote_reference"),
  });

  if (error) return { status: "error", message: error.message };

  revalidatePath("/admin/home-about");
  revalidatePath("/");
  redirect("/admin/home-about");
}

export interface AboutContentFormState {
  status: "idle" | "error";
  message?: string;
}

function parseIconItems(formData: FormData, prefix: string, count: number): { icon_key: string; label: string; description: string }[] {
  const items = [];
  for (let i = 0; i < count; i++) {
    const label = String(formData.get(`${prefix}_label_${i}`) ?? "").trim();
    if (!label) continue;
    items.push({
      icon_key: String(formData.get(`${prefix}_icon_${i}`) ?? "").trim() || "document",
      label,
      description: String(formData.get(`${prefix}_description_${i}`) ?? "").trim(),
    });
  }
  return items;
}

export async function saveAboutContent(
  _prevState: AboutContentFormState,
  formData: FormData
): Promise<AboutContentFormState> {
  const textField = (field: string) => String(formData.get(field) ?? "").trim() || null;

  const supabase = await createClient();
  const { error } = await supabase.from("about_content").upsert({
    id: 1,
    hero_subline: textField("hero_subline"),
    purpose_text: textField("purpose_text"),
    purpose_quote: textField("purpose_quote"),
    purpose_image_url: textField("purpose_image_url"),
    founding_story_heading: textField("founding_story_heading"),
    founding_story_text: textField("founding_story_text"),
    founding_story_image_url: textField("founding_story_image_url"),
    vision_text: textField("vision_text"),
    mission_text: textField("mission_text"),
    core_values: parseIconItems(formData, "core_value", 6),
    sadaqah_text: textField("sadaqah_text"),
    sadaqah_image_url: textField("sadaqah_image_url"),
    approach_text: textField("approach_text"),
    approach_quote: textField("approach_quote"),
    who_we_serve_text: textField("who_we_serve_text"),
    differentiators: parseIconItems(formData, "differentiator", 4),
    founder_eyebrow: textField("founder_eyebrow"),
    founder_text: textField("founder_text"),
    founder_image_url: textField("founder_image_url"),
    founder_quote: textField("founder_quote"),
    founder_signoff: textField("founder_signoff"),
  });

  if (error) return { status: "error", message: error.message };

  revalidatePath("/admin/home-about");
  revalidatePath("/about");
  redirect("/admin/home-about");
}
