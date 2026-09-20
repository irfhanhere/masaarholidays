"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "media";

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

/** Uploads an image to the shared media bucket and returns its public URL directly — used by
 *  the hero-image picker and the rich-text editor's inline image button, both of which need
 *  the URL immediately rather than a redirect to the Media Library. */
export async function uploadBlogImage(formData: FormData): Promise<string | null> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return null;

  const supabase = await getClient();
  const cleanName = file.name.replace(/[^\w.\-]+/g, "-");
  const path = `blog/${Date.now()}-${cleanName}`;

  const buffer = await file.arrayBuffer();
  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });

  if (error) return null;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
