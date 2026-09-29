"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

export async function savePackageTierMaster(formData: FormData) {
  try {
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
      console.error("[savePackageTierMaster] Error:", error.message);
      return;
    }

    revalidatePath("/admin/packages/umrah");
    revalidatePath("/admin/packages");
    redirect("/admin/packages/umrah");
  } catch (err: any) {
    if (err?.message?.includes("NEXT_REDIRECT") || err?.digest?.includes("NEXT_REDIRECT")) {
      throw err;
    }
    console.error("[savePackageTierMaster] Unexpected error:", err);
  }
}
