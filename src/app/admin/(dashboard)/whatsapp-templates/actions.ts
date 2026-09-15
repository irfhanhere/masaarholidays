"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateTemplate(templateId: string, formData: FormData) {
  const templateText = String(formData.get("template_text") ?? "").trim();
  if (!templateText) return;
  const isActive = formData.get("is_active") === "on";

  const supabase = await createClient();
  await supabase
    .from("whatsapp_templates")
    .update({ template_text: templateText, is_active: isActive })
    .eq("id", templateId);

  revalidatePath("/admin/whatsapp-templates");
}

export async function updatePhoneNumber(formData: FormData) {
  const raw = String(formData.get("phone_number") ?? "").trim();
  const digitsOnly = raw.replace(/\D/g, "");
  if (!digitsOnly) return;

  const supabase = await createClient();
  await supabase.from("whatsapp_settings").update({ phone_number: digitsOnly }).eq("id", 1);

  revalidatePath("/admin/whatsapp-templates");
}
