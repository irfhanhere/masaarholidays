"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "media";

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

export interface UploadMediaState {
  status: "idle" | "success" | "error";
  error?: string;
}

export async function uploadMediaFile(
  _prevState: UploadMediaState,
  formData: FormData
): Promise<UploadMediaState> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", error: "Please choose a file to upload." };
  }

  const supabase = await getClient();
  const cleanName = file.name.replace(/[^\w.\-]+/g, "-");
  const path = `${Date.now()}-${cleanName}`;

  const buffer = await file.arrayBuffer();
  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });

  if (error) {
    return { status: "error", error: error.message };
  }

  revalidatePath("/admin/media");
  return { status: "success" };
}

export async function deleteMediaFile(path: string) {
  const supabase = await getClient();
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/media");
}

/** Saves alt text/caption for one image URL into media_library, and — where that
 *  same URL is a blog post's hero_image_url — keeps that row's own hero_image_alt
 *  in sync too, so there's one real source of truth per field, not two. */
export async function saveMediaMeta(formData: FormData) {
  const url = String(formData.get("url") ?? "").trim();
  if (!url) throw new Error("Missing image URL");
  const altText = String(formData.get("alt_text") ?? "").trim() || null;
  const caption = String(formData.get("caption") ?? "").trim() || null;

  const supabase = await getClient();

  const { error } = await supabase
    .from("media_library")
    .upsert({ url, alt_text: altText, caption }, { onConflict: "url" });
  if (error) throw new Error(error.message);

  const { error: syncError } = await supabase
    .from("blog_posts")
    .update({ hero_image_alt: altText })
    .eq("hero_image_url", url);
  if (syncError) throw new Error(syncError.message);

  revalidatePath("/admin/media");
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
}
