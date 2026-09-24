"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { VisaDocumentIconKey, VisaTypeBenefit, VisaTypeFeature } from "@/lib/types/database";

export interface VisaTypeFormState {
  status: "idle" | "error";
  message?: string;
}

const ICON_KEYS: VisaDocumentIconKey[] = [
  "passport",
  "photo",
  "document",
  "flight",
  "hotel",
  "shield",
  "payment",
  "group",
];

function parseFeatures(formData: FormData): VisaTypeFeature[] {
  const icons = formData.getAll("feature_icon") as string[];
  const labels = formData.getAll("feature_label") as string[];
  return labels
    .map((label, i) => ({ icon_key: icons[i] || "document", label: label.trim() }))
    .filter((f) => f.label);
}

function parseBenefits(formData: FormData): VisaTypeBenefit[] {
  const titles = formData.getAll("benefit_title") as string[];
  const descriptions = formData.getAll("benefit_description") as string[];
  return titles
    .map((title, i) => ({ title: title.trim(), description: (descriptions[i] ?? "").trim() }))
    .filter((b) => b.title);
}

function parseBulletList(formData: FormData, name: string): string[] {
  return String(formData.get(name) ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export async function saveVisaType(
  visaTypeId: string | null,
  _prevState: VisaTypeFormState,
  formData: FormData
): Promise<VisaTypeFormState> {
  const slug = String(formData.get("slug") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const displayOrder = Number(formData.get("display_order") ?? 0);
  const isActive = formData.get("is_active") === "on";

  if (!slug || !name) {
    return { status: "error", message: "Slug and name are required." };
  }

  const textField = (field: string) => String(formData.get(field) ?? "").trim() || null;

  const payload = {
    slug,
    name,
    description: textField("description"),
    audience_text: textField("audience_text"),
    hero_headline: textField("hero_headline"),
    hero_intro: textField("hero_intro"),
    hero_image_url: textField("hero_image_url"),
    features: parseFeatures(formData),
    benefits: parseBenefits(formData),
    documents_intro: textField("documents_intro"),
    important_info_text: textField("important_info_text"),
    who_needs_this: parseBulletList(formData, "who_needs_this_text"),
    cta_note: textField("cta_note"),
    meta_title: textField("meta_title"),
    meta_description: textField("meta_description"),
    display_order: Number.isFinite(displayOrder) ? displayOrder : 0,
    is_active: isActive,
  };

  const supabase = await createClient();

  if (visaTypeId) {
    const { error } = await supabase.from("visa_types").update(payload).eq("id", visaTypeId);
    if (error) {
      if (error.code === "23505") return { status: "error", message: `The slug "${slug}" is already in use.` };
      return { status: "error", message: error.message };
    }
  } else {
    const { error } = await supabase.from("visa_types").insert(payload);
    if (error) {
      if (error.code === "23505") return { status: "error", message: `The slug "${slug}" is already in use.` };
      return { status: "error", message: error.message };
    }
  }

  revalidatePath("/admin/visa-types");
  revalidatePath("/visa");
  redirect("/admin/visa-types");
}

export async function deleteVisaType(id: string) {
  const supabase = await createClient();
  await supabase.from("visa_types").delete().eq("id", id);
  revalidatePath("/admin/visa-types");
  revalidatePath("/visa");
}

export async function toggleVisaTypeActive(id: string, isActive: boolean) {
  const supabase = await createClient();
  await supabase.from("visa_types").update({ is_active: isActive }).eq("id", id);
  revalidatePath("/admin/visa-types");
  revalidatePath("/visa");
}

export async function addVisaTypeDocument(visaTypeId: string, formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  const description = String(formData.get("description") ?? "").trim() || null;
  const iconKey = String(formData.get("icon_key") ?? "document");

  const supabase = await createClient();
  const { count } = await supabase
    .from("visa_documents")
    .select("id", { count: "exact", head: true })
    .eq("visa_type_id", visaTypeId);

  await supabase.from("visa_documents").insert({
    visa_type_id: visaTypeId,
    title,
    description,
    icon_key: (ICON_KEYS.includes(iconKey as VisaDocumentIconKey) ? iconKey : "document") as VisaDocumentIconKey,
    display_order: count ?? 0,
  });

  revalidatePath(`/admin/visa-types/${visaTypeId}`);
  revalidatePath("/visa");
}

export async function deleteVisaTypeDocument(visaTypeId: string, documentId: string) {
  const supabase = await createClient();
  await supabase.from("visa_documents").delete().eq("id", documentId);
  revalidatePath(`/admin/visa-types/${visaTypeId}`);
  revalidatePath("/visa");
}

export interface VisaLandingContentFormState {
  status: "idle" | "error";
  message?: string;
}

export async function saveVisaLandingContent(
  _prevState: VisaLandingContentFormState,
  formData: FormData
): Promise<VisaLandingContentFormState> {
  const textField = (field: string) => String(formData.get(field) ?? "").trim() || null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("visa_landing_content")
    .upsert({
      id: 1,
      important_info_text: textField("important_info_text"),
      cta_heading: textField("cta_heading"),
      cta_line: textField("cta_line"),
      cta_note: textField("cta_note"),
    });

  if (error) return { status: "error", message: error.message };

  revalidatePath("/admin/visa-types/landing");
  revalidatePath("/visa");
  redirect("/admin/visa-types");
}
