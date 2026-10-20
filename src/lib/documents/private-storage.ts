import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export const PRIVATE_DOCUMENTS_BUCKET = "private_documents";

/**
 * Uploads a file to the private documents storage bucket.
 * Files in this bucket are strictly private (public = false) and require
 * authenticated service role access or a signed URL.
 */
export async function uploadPrivateDocument(
  path: string,
  fileBuffer: Buffer | Uint8Array,
  contentType: string
): Promise<{ path?: string; error?: string }> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(PRIVATE_DOCUMENTS_BUCKET)
    .upload(path, fileBuffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    return { error: error.message };
  }

  return { path: data.path };
}

/**
 * Generates a time-limited signed URL for staff or authorized clients
 * to view or download a private document securely.
 * Default expiration: 15 minutes (900 seconds).
 */
export async function getPrivateDocumentSignedUrl(
  path: string,
  expiresInSeconds: number = 900
): Promise<{ signedUrl?: string; error?: string }> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(PRIVATE_DOCUMENTS_BUCKET)
    .createSignedUrl(path, expiresInSeconds);

  if (error || !data?.signedUrl) {
    return { error: error?.message || "Failed to create signed URL" };
  }

  return { signedUrl: data.signedUrl };
}
