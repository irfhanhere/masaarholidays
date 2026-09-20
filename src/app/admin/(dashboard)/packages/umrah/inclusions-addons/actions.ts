"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PublishStatus } from "@/lib/types/database";

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

export async function toggleInclusionDefault(id: string, isDefault: boolean) {
  const supabase = await getClient();
  const { error } = await supabase
    .from("package_inclusions_catalog")
    .update({ is_default_included: isDefault, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/packages/umrah/inclusions-addons");
}

export async function toggleInclusionStatus(id: string, newStatus: string) {
  const supabase = await getClient();
  const { error } = await supabase
    .from("package_inclusions_catalog")
    .update({ status: newStatus as PublishStatus, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/packages/umrah/inclusions-addons");
}

export async function toggleAddonStatus(id: string, newStatus: string) {
  const supabase = await getClient();
  const { error } = await supabase
    .from("package_addons_catalog")
    .update({ status: newStatus as PublishStatus, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/packages/umrah/inclusions-addons");
  revalidatePath("/admin/packages/umrah");
  revalidatePath("/umrah");
}

export async function addInclusionItem(category: string, name: string, icon: string) {
  const supabase = await getClient();
  const { error } = await supabase
    .from("package_inclusions_catalog")
    .insert({ category, name, icon, is_default_included: true, status: "published" });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/packages/umrah/inclusions-addons");
}

export async function updateInclusionItem(id: string, name: string, icon: string) {
  const supabase = await getClient();
  const { error } = await supabase
    .from("package_inclusions_catalog")
    .update({ name, icon, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/packages/umrah/inclusions-addons");
  revalidatePath("/umrah");
}

export async function deleteInclusionItem(id: string) {
  const supabase = await getClient();
  const { error } = await supabase.from("package_inclusions_catalog").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/packages/umrah/inclusions-addons");
  revalidatePath("/umrah");
}

export async function addAddonItem(
  category: string,
  name: string,
  key_slug: string,
  icon: string,
  price_type_label: string,
  private_trip_id: string | null
) {
  const supabase = await getClient();
  const { error } = await supabase
    .from("package_addons_catalog")
    .insert({ category, name, key_slug, icon, price_type_label, private_trip_id, status: "published" });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/packages/umrah/inclusions-addons");
  revalidatePath("/umrah");
}

export async function updateAddonItem(
  id: string,
  name: string,
  icon: string,
  price_type_label: string,
  private_trip_id: string | null
) {
  const supabase = await getClient();
  const { error } = await supabase
    .from("package_addons_catalog")
    .update({ name, icon, price_type_label, private_trip_id, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/packages/umrah/inclusions-addons");
  revalidatePath("/umrah");
}
