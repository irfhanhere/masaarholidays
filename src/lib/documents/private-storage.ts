import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export const PRIVATE_DOCUMENTS_BUCKET = "private_documents";

/**
 * Validates that a storage path is safe and does not attempt directory traversal.
 */
export function isSafeStoragePath(path: string): boolean {
  if (!path || typeof path !== "string") return false;
  // Must not contain directory traversal attempts
  if (path.includes("..") || path.includes("\\") || path.startsWith("/")) return false;
  // Must match standard alphanumeric, slash, dash, underscore, dot pattern
  const validPathRegex = /^[a-zA-Z0-9_\-\/]+\.[a-zA-Z0-9]+$/;
  return validPathRegex.test(path);
}

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
  if (!isSafeStoragePath(path)) {
    return { error: "Invalid or unsafe storage path." };
  }

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
  if (!isSafeStoragePath(path)) {
    return { error: "Invalid or unsafe storage path." };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(PRIVATE_DOCUMENTS_BUCKET)
    .createSignedUrl(path, expiresInSeconds);

  if (error || !data?.signedUrl) {
    return { error: error?.message || "Failed to create signed URL" };
  }

  return { signedUrl: data.signedUrl };
}

/**
 * Directly downloads a private document as a binary Buffer from private storage.
 * Used for authenticated administrative single downloads and ZIP bundling.
 */
export async function downloadPrivateDocument(
  path: string
): Promise<{ buffer?: Buffer; contentType?: string; error?: string }> {
  if (!isSafeStoragePath(path)) {
    return { error: "Invalid or unsafe storage path." };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(PRIVATE_DOCUMENTS_BUCKET)
    .download(path);

  if (error || !data) {
    return { error: error?.message || "Failed to download document from storage." };
  }

  const arrayBuffer = await data.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    contentType: data.type || "application/octet-stream",
  };
}
