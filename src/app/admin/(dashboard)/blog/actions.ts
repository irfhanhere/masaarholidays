"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { BlogContentFormat, PublishStatus } from "@/lib/types/database";

export interface BlogFormState {
  status: "idle" | "success" | "error";
  error?: string;
  savedId?: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function getClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return supabase;
  }

  if (process.env.NODE_ENV !== "production" && process.env.ALLOW_DEV_AUTH_BYPASS === "true") {
    return createAdminClient();
  }

  return supabase;
}

export async function saveBlogPost(
  postId: string | null,
  _prevState: BlogFormState,
  formData: FormData
): Promise<BlogFormState> {
  const supabase = await getClient();

  const title = String(formData.get("title") ?? "").trim();
  const rawSlug = String(formData.get("slug") ?? "").trim();
  const slug = rawSlug ? slugify(rawSlug) : slugify(title);
  const excerpt = String(formData.get("excerpt") ?? "").trim() || null;
  const content = String(formData.get("content") ?? "").trim();
  const content_format = (formData.get("content_format") as BlogContentFormat) || "html";
  const category_id = String(formData.get("category_id") ?? "").trim() || null;
  const hero_image_url = String(formData.get("hero_image_url") ?? "").trim() || null;
  const hero_image_alt = String(formData.get("hero_image_alt") ?? "").trim();
  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const author_name = String(formData.get("author_name") ?? "").trim() || "Haseeb";
  const is_featured = formData.get("is_featured") === "on";
  const publicationMode = String(formData.get("publication_mode") ?? "draft"); // 'draft' | 'published' | 'scheduled'
  const scheduledAtRaw = String(formData.get("scheduled_at") ?? "").trim();

  const meta_title = String(formData.get("meta_title") ?? "").trim() || null;
  const meta_description = String(formData.get("meta_description") ?? "").trim() || null;
  const focus_keyword = String(formData.get("focus_keyword") ?? "").trim() || null;
  const canonical_url = String(formData.get("canonical_url") ?? "").trim() || null;
  const noindex = formData.get("noindex") === "on";
  const og_title = String(formData.get("og_title") ?? "").trim() || null;
  const og_description = String(formData.get("og_description") ?? "").trim() || null;
  const og_image_url = String(formData.get("og_image_url") ?? "").trim() || null;

  if (!title) {
    return { status: "error", error: "Title is required." };
  }

  let status: PublishStatus = "draft";
  let published_at: string | null = null;
  let scheduled_at: string | null = null;

  if (publicationMode === "published") {
    status = "published";
    published_at = new Date().toISOString();
  } else if (publicationMode === "scheduled" && scheduledAtRaw) {
    status = "draft";
    scheduled_at = new Date(scheduledAtRaw).toISOString();
  }

  const payload = {
    title,
    slug,
    excerpt,
    content,
    content_format,
    category_id,
    hero_image_url,
    hero_image_alt: hero_image_alt || null,
    tags,
    author_name,
    is_featured,
    status,
    meta_title,
    meta_description,
    focus_keyword,
    canonical_url,
    noindex,
    og_title,
    og_description,
    og_image_url,
    published_at,
    scheduled_at,
  };

  let savedId = postId;

  if (postId) {
    const { error } = await supabase.from("blog_posts").update(payload).eq("id", postId);
    if (error) return { status: "error", error: error.message };
  } else {
    const { data, error } = await supabase.from("blog_posts").insert(payload).select("id").single();
    if (error) return { status: "error", error: error.message };
    savedId = data.id;
  }

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  return { status: "success", savedId: savedId ?? undefined };
}

export async function deleteBlogPost(id: string) {
  const supabase = await getClient();
  const { error } = await supabase.from("blog_posts").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
}

export async function unpublishBlogPost(id: string) {
  const supabase = await getClient();
  const { error } = await supabase.from("blog_posts").update({ status: "draft", scheduled_at: null }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
}

export async function toggleBlogPostStatus(id: string, newStatus: PublishStatus) {
  const supabase = await getClient();
  const { error } = await supabase
    .from("blog_posts")
    .update({ status: newStatus, published_at: newStatus === "published" ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
}

export async function publishFromPreview(id: string) {
  const supabase = await getClient();
  const { error } = await supabase
    .from("blog_posts")
    .update({ status: "published", published_at: new Date().toISOString(), scheduled_at: null })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  redirect(`/admin/blog/${id}`);
}

export async function duplicateBlogPost(id: string) {
  const supabase = await getClient();
  const { data: original, error: fetchError } = await supabase.from("blog_posts").select("*").eq("id", id).single();
  if (fetchError || !original) throw new Error(fetchError?.message ?? "Article not found");

  const baseSlug = `${original.slug}-copy`;
  let slug = baseSlug;
  let attempt = 1;
  // Guarantee a unique slug rather than failing on the unique constraint.
  while (true) {
    const { data: clash } = await supabase.from("blog_posts").select("id").eq("slug", slug).maybeSingle();
    if (!clash) break;
    attempt += 1;
    slug = `${baseSlug}-${attempt}`;
  }

  const {
    id: _id,
    created_at: _createdAt,
    updated_at: _updatedAt,
    published_at: _publishedAt,
    ...rest
  } = original;
  void _id;
  void _createdAt;
  void _updatedAt;
  void _publishedAt;

  const { data: copy, error } = await supabase
    .from("blog_posts")
    .insert({ ...rest, title: `${original.title} (Copy)`, slug, status: "draft", scheduled_at: null, published_at: null })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  revalidatePath("/admin/blog");
  redirect(`/admin/blog/${copy.id}`);
}
