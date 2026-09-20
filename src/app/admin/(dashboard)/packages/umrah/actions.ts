"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

export async function savePackageTierMaster(formData: FormData) {
  const supabase = await getClient();

  const id = (formData.get("id") as string)?.trim();
  if (!id) throw new Error("Package ID is required");

  const title = (formData.get("title") as string)?.trim();
  const tagline = (formData.get("tagline") as string)?.trim() || null;
  const short_description = (formData.get("short_description") as string)?.trim() || null;
  const is_featured = formData.get("is_featured") === "on";
  const makkah_hotel_name = (formData.get("makkah_hotel_name") as string)?.trim() || null;
  const madinah_hotel_name = (formData.get("madinah_hotel_name") as string)?.trim() || null;
  const inclusions_text = (formData.get("inclusions_text") as string)?.trim() || null;
  const default_addon_slugs = ((formData.get("default_addon_slugs") as string) ?? "")
    .split(",")
    .map((slug) => slug.trim())
    .filter(Boolean);

  const payload = {
    title,
    tagline,
    short_description,
    is_featured,
    makkah_hotel_name,
    madinah_hotel_name,
    inclusions_text,
    default_addon_slugs,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("packages").update(payload).eq("id", id);
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/packages/umrah");
  revalidatePath("/admin/packages");
  redirect("/admin/packages/umrah");
}
