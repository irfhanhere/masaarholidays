"use server";

import { revalidatePath } from "next/cache";
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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) return supabase;
  } catch {
    // ignore
  }

  return createClient();
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export interface CategoryFormState {
  status: "idle" | "success" | "error";
  error?: string;
}

export async function saveCategory(
  categoryId: string | null,
  _prevState: CategoryFormState,
  formData: FormData
): Promise<CategoryFormState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { status: "error", error: "Name is required." };

  const rawSlug = String(formData.get("slug") ?? "").trim();
  const slug = slugify(rawSlug || name);
  const description = String(formData.get("description") ?? "").trim() || null;
  const seo_title = String(formData.get("seo_title") ?? "").trim() || null;
  const meta_description = String(formData.get("meta_description") ?? "").trim() || null;
  const status: "active" | "inactive" = (formData.get("status") as string) === "inactive" ? "inactive" : "active";

  try {
    const supabase = await getClient();
    const payload = { name, slug, description, seo_title, meta_description, status };

    if (categoryId) {
      const { error } = await supabase.from("blog_categories").update(payload).eq("id", categoryId);
      if (error) return { status: "error", error: error.message };
    } else {
      const { error } = await supabase.from("blog_categories").insert(payload);
      if (error) return { status: "error", error: error.message };
    }

    revalidatePath("/admin/blog/categories");
    revalidatePath("/admin/blog");
    revalidatePath("/blog");
    return { status: "success" };
  } catch (err: any) {
    console.error("[saveCategory] Error:", err);
    return { status: "error", error: err?.message || "Failed to save category" };
  }
}

export async function deleteCategory(id: string) {
  try {
    const supabase = await getClient();
    const { error } = await supabase.from("blog_categories").delete().eq("id", id);
    if (error) console.error("[deleteCategory] error:", error.message);
    revalidatePath("/admin/blog/categories");
    revalidatePath("/admin/blog");
  } catch (err) {
    console.error("[deleteCategory] Error:", err);
  }
}

export async function reorderCategories(orderedIds: string[]) {
  try {
    const supabase = await getClient();
    await Promise.all(
      orderedIds.map((id, index) => supabase.from("blog_categories").update({ display_order: index }).eq("id", id))
    );
    revalidatePath("/admin/blog/categories");
  } catch (err) {
    console.error("[reorderCategories] Error:", err);
  }
}
