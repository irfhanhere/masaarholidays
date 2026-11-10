"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { AdditionalServiceRow, AdditionalServiceFaq } from "@/lib/types/database";

export async function toggleServiceFeatured(id: string, nextFeatured: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("additional_services")
    .update({
      is_featured: nextFeatured,
      show_on_homepage: nextFeatured,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("toggleServiceFeatured error:", error);
  }

  revalidateAllPaths();
}

export async function setServiceStatus(id: string, nextStatus: "published" | "draft" | "archived") {
  const supabase = await createClient();
  const { error } = await supabase
    .from("additional_services")
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("setServiceStatus error:", error);
  }

  revalidateAllPaths();
}

export async function updateServiceOrder(id: string, newOrder: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("additional_services")
    .update({ display_order: newOrder, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("updateServiceOrder error:", error);
  }

  revalidateAllPaths();
}

export async function toggleThoughtfulSection(id: string, nextValue: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("additional_services")
    .update({
      show_in_thoughtful_services: nextValue,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("toggleThoughtfulSection error:", error);
  }

  revalidateAllPaths();
}

export async function toggleEnquiryPopup(id: string, nextValue: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("additional_services")
    .update({
      show_in_enquiry_popup: nextValue,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("toggleEnquiryPopup error:", error);
  }

  revalidateAllPaths();
}

export async function toggleEnquiryEnabled(id: string, nextValue: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("additional_services")
    .update({
      is_enquiry_enabled: nextValue,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("toggleEnquiryEnabled error:", error);
  }

  revalidateAllPaths();
}

export async function updateAdditionalService(
  id: string,
  payload: {
    status?: "published" | "draft" | "archived";
    is_enquiry_enabled?: boolean;
    show_on_homepage?: boolean;
    homepage_display_order?: number;
    show_in_thoughtful_services?: boolean;
    thoughtful_services_order?: number;
    show_in_enquiry_popup?: boolean;
    enquiry_popup_order?: number;
    allow_multiple_in_popup?: boolean;
    whatsapp_template_key?: string | null;
    faqs?: AdditionalServiceFaq[];
    meta_title?: string | null;
    meta_description?: string | null;
    image_alt?: string | null;
    display_order?: number;
  }
) {
  const supabase = await createClient();

  const updateData: Record<string, any> = {
    ...payload,
    updated_at: new Date().toISOString(),
  };

  if (payload.show_on_homepage !== undefined) {
    updateData.is_featured = payload.show_on_homepage;
  }

  const { error } = await (supabase.from("additional_services") as any)
    .update(updateData)
    .eq("id", id);

  if (error) {
    console.error("updateAdditionalService error:", error);
    return { success: false, error: error.message };
  }

  revalidateAllPaths();
  return { success: true };
}

function revalidateAllPaths() {
  revalidatePath("/");
  revalidatePath("/admin/additional-services");
  revalidatePath("/additional-services");
  revalidatePath("/additional-services/umrah-guide");
  revalidatePath("/umrah");
  revalidatePath("/sitemap.xml");
}
