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

export async function updateTemplate(templateId: string, formData: FormData) {
  const label = String(formData.get("label") ?? "").trim();
  const templateText = String(formData.get("template_text") ?? "").trim();
  if (!label || !templateText) return;
  const isActive = formData.get("is_active") === "on";
  const placeholders = String(formData.get("placeholders") ?? "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  const displayOrderRaw = String(formData.get("display_order") ?? "").trim();
  const displayOrder = displayOrderRaw ? Number(displayOrderRaw) : undefined;

  const supabase = await getClient();
  await supabase
    .from("whatsapp_templates")
    .update({
      label,
      template_text: templateText,
      is_active: isActive,
      placeholders,
      ...(displayOrder !== undefined && !Number.isNaN(displayOrder) ? { display_order: displayOrder } : {}),
    })
    .eq("id", templateId);

  revalidatePath("/admin/whatsapp-templates");
  revalidatePath("/admin/settings/whatsapp-templates");
}

export async function createTemplate(formData: FormData) {
  const label = String(formData.get("label") ?? "").trim();
  if (!label) return;

  const key = label
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .trim()
    .split(/\s+/)
    .map((word, i) => (i === 0 ? word.charAt(0).toLowerCase() + word.slice(1) : word.charAt(0).toUpperCase() + word.slice(1)))
    .join("");
  if (!key) return;

  const supabase = await getClient();

  const { data: existing } = await supabase.from("whatsapp_templates").select("id").eq("key", key).maybeSingle();
  if (existing) return; // key already taken — admin should pick a different label

  const { data: maxOrderRow } = await supabase
    .from("whatsapp_templates")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  await supabase.from("whatsapp_templates").insert({
    key,
    label,
    template_text: "Assalamu Alaikum,\n\n",
    placeholders: [],
    is_active: true,
    display_order: (maxOrderRow?.display_order ?? 0) + 1,
  });

  revalidatePath("/admin/whatsapp-templates");
  redirect(`/admin/whatsapp-templates?key=${key}`);
}

export async function updatePhoneNumber(formData: FormData) {
  const raw = String(formData.get("phone_number") ?? "").trim();
  const digitsOnly = raw.replace(/\D/g, "");
  if (!digitsOnly) return;

  const supabase = await getClient();
  await supabase.from("whatsapp_settings").update({ phone_number: digitsOnly }).eq("id", 1);

  revalidatePath("/admin/whatsapp-templates");
  revalidatePath("/admin/settings/whatsapp-templates");
}
