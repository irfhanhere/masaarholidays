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
  const assignedServiceSlug = String(formData.get("assigned_service_slug") ?? "").trim() || null;
  const defaultCtaText = String(formData.get("default_cta_text") ?? "").trim() || "Enquire on WhatsApp";

  try {
    const supabase = await getClient();
    await supabase
      .from("whatsapp_templates")
      .update({
        label,
        template_text: templateText,
        is_active: isActive,
        placeholders,
        assigned_service_slug: assignedServiceSlug,
        default_cta_text: defaultCtaText,
        ...(displayOrder !== undefined && !Number.isNaN(displayOrder) ? { display_order: displayOrder } : {}),
      })
      .eq("id", templateId);

    revalidatePath("/admin/whatsapp-templates");
    revalidatePath("/admin/settings/whatsapp-templates");
  } catch (err) {
    console.error("[updateTemplate] Error:", err);
  }
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

  const assignedServiceSlug = String(formData.get("assigned_service_slug") ?? "").trim() || null;
  const defaultCtaText = String(formData.get("default_cta_text") ?? "").trim() || "Enquire on WhatsApp";
  const templateText = String(formData.get("template_text") ?? "").trim() || "Assalamu Alaikum,\n\n";

  try {
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
      template_text: templateText,
      placeholders: [],
      is_active: true,
      display_order: (maxOrderRow?.display_order ?? 0) + 1,
      assigned_service_slug: assignedServiceSlug,
      default_cta_text: defaultCtaText,
    });

    revalidatePath("/admin/whatsapp-templates");
    redirect(`/admin/whatsapp-templates?key=${key}`);
  } catch (err: any) {
    if (err?.message?.includes("NEXT_REDIRECT") || err?.digest?.includes("NEXT_REDIRECT")) {
      throw err;
    }
    console.error("[createTemplate] Error:", err);
  }
}

export async function duplicateTemplate(templateId: string) {
  try {
    const supabase = await getClient();
    const { data: original, error } = await supabase
      .from("whatsapp_templates")
      .select("*")
      .eq("id", templateId)
      .maybeSingle();

    if (error || !original) {
      console.error("[duplicateTemplate] Could not find template to duplicate:", templateId);
      return;
    }

    const randomSuffix = Math.floor(Math.random() * 900 + 100);
    const newKey = `${original.key}Copy${randomSuffix}`;
    const newLabel = `${original.label} (Copy)`;

    const { data: maxOrderRow } = await supabase
      .from("whatsapp_templates")
      .select("display_order")
      .order("display_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    await supabase.from("whatsapp_templates").insert({
      key: newKey,
      label: newLabel,
      template_text: original.template_text,
      placeholders: original.placeholders || [],
      is_active: true,
      display_order: (maxOrderRow?.display_order ?? 0) + 1,
      assigned_service_slug: original.assigned_service_slug,
      default_cta_text: original.default_cta_text || "Enquire on WhatsApp",
    });

    revalidatePath("/admin/whatsapp-templates");
    redirect(`/admin/whatsapp-templates?key=${newKey}`);
  } catch (err: any) {
    if (err?.message?.includes("NEXT_REDIRECT") || err?.digest?.includes("NEXT_REDIRECT")) {
      throw err;
    }
    console.error("[duplicateTemplate] Error:", err);
  }
}

export async function updatePhoneNumber(formData: FormData) {
  const raw = String(formData.get("phone_number") ?? "").trim();
  const digitsOnly = raw.replace(/\D/g, "");
  if (!digitsOnly) return;

  try {
    const supabase = await getClient();
    await supabase.from("whatsapp_settings").update({ phone_number: digitsOnly }).eq("id", 1);

    revalidatePath("/admin/whatsapp-templates");
    revalidatePath("/admin/settings/whatsapp-templates");
  } catch (err) {
    console.error("[updatePhoneNumber] Error:", err);
  }
}
