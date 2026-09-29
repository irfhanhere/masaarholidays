"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PublishStatus } from "@/lib/types/database";

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

export async function toggleInclusionDefault(id: string, isDefault: boolean) {
  try {
    const supabase = await getClient();
    const { error } = await supabase
      .from("package_inclusions_catalog")
      .update({ is_default_included: isDefault, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) console.error("[toggleInclusionDefault] Error:", error.message);
    revalidatePath("/admin/packages/umrah/inclusions-addons");
  } catch (err) {
    console.error("[toggleInclusionDefault] Unexpected error:", err);
  }
}

export async function toggleInclusionStatus(id: string, newStatus: string) {
  try {
    const supabase = await getClient();
    const { error } = await supabase
      .from("package_inclusions_catalog")
      .update({ status: newStatus as PublishStatus, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) console.error("[toggleInclusionStatus] Error:", error.message);
    revalidatePath("/admin/packages/umrah/inclusions-addons");
  } catch (err) {
    console.error("[toggleInclusionStatus] Unexpected error:", err);
  }
}

export async function toggleAddonStatus(id: string, newStatus: string) {
  try {
    const supabase = await getClient();
    const { error } = await supabase
      .from("package_addons_catalog")
      .update({ status: newStatus as PublishStatus, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) console.error("[toggleAddonStatus] Error:", error.message);
    revalidatePath("/admin/packages/umrah/inclusions-addons");
    revalidatePath("/admin/packages/umrah");
    revalidatePath("/umrah");
  } catch (err) {
    console.error("[toggleAddonStatus] Unexpected error:", err);
  }
}

export async function addInclusionItem(category: string, name: string, icon: string) {
  try {
    const supabase = await getClient();
    const { error } = await supabase
      .from("package_inclusions_catalog")
      .insert({ category, name, icon, is_default_included: true, status: "published" });

    if (error) console.error("[addInclusionItem] Error:", error.message);
    revalidatePath("/admin/packages/umrah/inclusions-addons");
  } catch (err) {
    console.error("[addInclusionItem] Unexpected error:", err);
  }
}

export async function updateInclusionItem(id: string, name: string, icon: string) {
  try {
    const supabase = await getClient();
    const { error } = await supabase
      .from("package_inclusions_catalog")
      .update({ name, icon, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) console.error("[updateInclusionItem] Error:", error.message);
    revalidatePath("/admin/packages/umrah/inclusions-addons");
    revalidatePath("/umrah");
  } catch (err) {
    console.error("[updateInclusionItem] Unexpected error:", err);
  }
}

export async function deleteInclusionItem(id: string) {
  try {
    const supabase = await getClient();
    const { error } = await supabase.from("package_inclusions_catalog").delete().eq("id", id);

    if (error) console.error("[deleteInclusionItem] Error:", error.message);
    revalidatePath("/admin/packages/umrah/inclusions-addons");
    revalidatePath("/umrah");
  } catch (err) {
    console.error("[deleteInclusionItem] Unexpected error:", err);
  }
}

export async function addAddonItem(
  category: string,
  name: string,
  key_slug: string,
  icon: string,
  price_type_label: string,
  private_trip_id: string | null
) {
  try {
    const supabase = await getClient();
    const { error } = await supabase
      .from("package_addons_catalog")
      .insert({ category, name, key_slug, icon, price_type_label, private_trip_id, status: "published" });

    if (error) console.error("[addAddonItem] Error:", error.message);
    revalidatePath("/admin/packages/umrah/inclusions-addons");
    revalidatePath("/umrah");
  } catch (err) {
    console.error("[addAddonItem] Unexpected error:", err);
  }
}

export async function updateAddonItem(
  id: string,
  name: string,
  icon: string,
  price_type_label: string,
  private_trip_id: string | null
) {
  try {
    const supabase = await getClient();
    const { error } = await supabase
      .from("package_addons_catalog")
      .update({ name, icon, price_type_label, private_trip_id, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) console.error("[updateAddonItem] Error:", error.message);
    revalidatePath("/admin/packages/umrah/inclusions-addons");
    revalidatePath("/umrah");
  } catch (err) {
    console.error("[updateAddonItem] Unexpected error:", err);
  }
}
