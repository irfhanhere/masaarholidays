"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { VisaProductRow } from "@/lib/types/database";

export async function toggleVisaProductActive(productId: string, currentActive: boolean) {
  if (!isSupabaseConfigured()) {
    return { success: true, message: "Demo mode: status toggled." };
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("visa_products")
      .update({ is_active: !currentActive, updated_at: new Date().toISOString() })
      .eq("id", productId);

    if (error) {
      console.error("[toggleVisaProductActive] Supabase error:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/visa-products");
    revalidatePath("/visa");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update product" };
  }
}

export async function saveVisaProduct(data: {
  id?: string;
  visa_type_slug: string;
  title: string;
  subtitle: string;
  duration: string;
  entry_type: string;
  visa_fee_usd: number;
  service_fee_usd: number;
  processing_fee_usd: number;
  validity_days: string;
  processing_time: string;
  is_popular: boolean;
  is_active: boolean;
  inclusions: string[];
  exclusions: string[];
}) {
  const total_usd = Number(data.visa_fee_usd) + Number(data.service_fee_usd) + Number(data.processing_fee_usd);

  if (!isSupabaseConfigured()) {
    return { success: true, message: "Demo mode: product saved." };
  }

  try {
    const supabase = createAdminClient();
    const payload = {
      visa_type_slug: data.visa_type_slug,
      title: data.title,
      subtitle: data.subtitle,
      duration: data.duration,
      entry_type: data.entry_type,
      visa_fee_usd: data.visa_fee_usd,
      service_fee_usd: data.service_fee_usd,
      processing_fee_usd: data.processing_fee_usd,
      total_usd,
      currency: "USD",
      validity_days: data.validity_days,
      processing_time: data.processing_time,
      is_popular: data.is_popular,
      is_active: data.is_active,
      inclusions: data.inclusions,
      exclusions: data.exclusions,
      updated_at: new Date().toISOString(),
    };

    if (data.id) {
      const { error } = await supabase.from("visa_products").update(payload).eq("id", data.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("visa_products").insert([payload]);
      if (error) throw error;
    }

    revalidatePath("/admin/visa-products");
    revalidatePath("/visa");
    revalidatePath(`/visa/${data.visa_type_slug}`);
    return { success: true };
  } catch (err: any) {
    console.error("[saveVisaProduct] Error:", err);
    return { success: false, error: err.message || "Failed to save product" };
  }
}

export async function deleteVisaProduct(productId: string) {
  if (!isSupabaseConfigured()) {
    return { success: true, message: "Demo mode: product deleted." };
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("visa_products").delete().eq("id", productId);
    if (error) throw error;

    revalidatePath("/admin/visa-products");
    revalidatePath("/visa");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete product" };
  }
}
