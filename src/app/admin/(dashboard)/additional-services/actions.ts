"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function toggleServiceFeatured(id: string, nextFeatured: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("additional_services")
    .update({ is_featured: nextFeatured, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("toggleServiceFeatured error:", error);
  }

  revalidatePath("/");
  revalidatePath("/admin/additional-services");
  revalidatePath("/additional-services");
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

  revalidatePath("/");
  revalidatePath("/admin/additional-services");
  revalidatePath("/additional-services");
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

  revalidatePath("/");
  revalidatePath("/admin/additional-services");
  revalidatePath("/additional-services");
}

