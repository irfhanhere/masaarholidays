"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function getClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) return supabase;
  if (process.env.NODE_ENV !== "production" && process.env.ALLOW_DEV_AUTH_BYPASS === "true") {
    return createAdminClient();
  }
  return supabase;
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
}

export async function deleteCategory(id: string) {
  const supabase = await getClient();
  const { error } = await supabase.from("blog_categories").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/blog/categories");
  revalidatePath("/admin/blog");
}

export async function reorderCategories(orderedIds: string[]) {
  const supabase = await getClient();
  await Promise.all(
    orderedIds.map((id, index) => supabase.from("blog_categories").update({ display_order: index }).eq("id", id))
  );
  revalidatePath("/admin/blog/categories");
}
