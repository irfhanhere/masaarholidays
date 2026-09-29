"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "media";

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

  try {
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
  } catch (err: any) {
    console.error("[uploadMediaFile] Error:", err);
    return { status: "error", error: err?.message || "Failed to upload file" };
  }
}

export async function deleteMediaFile(path: string) {
  try {
    const supabase = await getClient();
    const { error } = await supabase.storage.from(BUCKET).remove([path]);
    if (error) console.error("[deleteMediaFile] Error:", error.message);
    revalidatePath("/admin/media");
  } catch (err) {
    console.error("[deleteMediaFile] Unexpected error:", err);
  }
}

/** Saves alt text/caption for one image URL into media_library, and — where that
 *  same URL is a blog post's hero_image_url — keeps that row's own hero_image_alt
 *  in sync too, so there's one real source of truth per field, not two. */
export async function saveMediaMeta(formData: FormData) {
  const url = String(formData.get("url") ?? "").trim();
  if (!url) return;
  const altText = String(formData.get("alt_text") ?? "").trim() || null;
  const caption = String(formData.get("caption") ?? "").trim() || null;

  try {
    const supabase = await getClient();

    const { error } = await supabase
      .from("media_library")
      .upsert({ url, alt_text: altText, caption }, { onConflict: "url" });
    if (error) console.error("[saveMediaMeta] upsert error:", error.message);

    const { error: syncError } = await supabase
      .from("blog_posts")
      .update({ hero_image_alt: altText })
      .eq("hero_image_url", url);
    if (syncError) console.error("[saveMediaMeta] sync error:", syncError.message);

    revalidatePath("/admin/media");
    revalidatePath("/admin/blog");
    revalidatePath("/blog");
  } catch (err) {
    console.error("[saveMediaMeta] Unexpected error:", err);
  }
}
