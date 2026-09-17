"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface PageSeoFormState {
  status: "idle" | "success" | "error";
  message?: string;
}

export async function savePageSeoRow(
  path: string,
  _prevState: PageSeoFormState,
  formData: FormData
): Promise<PageSeoFormState> {
  const metaTitle = String(formData.get("meta_title") ?? "").trim();
  if (!metaTitle) return { status: "error", message: "Meta title is required." };

  const textField = (field: string) => String(formData.get(field) ?? "").trim() || null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("page_seo")
    .update({
      meta_title: metaTitle,
      meta_description: textField("meta_description"),
      og_image_url: textField("og_image_url"),
      noindex: formData.get("noindex") === "on",
    })
    .eq("path", path);

  if (error) return { status: "error", message: error.message };

  revalidatePath("/admin/page-seo");
  revalidatePath(path);
  return { status: "success", message: "Saved." };
}
