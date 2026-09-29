"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { VisaDocumentContextKey } from "@/lib/types/database";

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

export async function addVisaDocument(contextId: string, formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!title) return;

  try {
    const supabase = await getClient();
    const { count } = await supabase
      .from("visa_documents")
      .select("id", { count: "exact", head: true })
      .eq("context_id", contextId);

    await supabase.from("visa_documents").insert({
      context_id: contextId,
      title,
      description: description || null,
      display_order: count ?? 0,
    });

    revalidatePath("/admin/visa-content");
  } catch (err) {
    console.error("[addVisaDocument] Error:", err);
  }
}

export async function deleteVisaDocument(documentId: string) {
  try {
    const supabase = await getClient();
    await supabase.from("visa_documents").delete().eq("id", documentId);
    revalidatePath("/admin/visa-content");
  } catch (err) {
    console.error("[deleteVisaDocument] Error:", err);
  }
}

export async function saveCaveat(contextKey: VisaDocumentContextKey, formData: FormData) {
  const caveatText = String(formData.get("caveat_text") ?? "").trim();
  try {
    const supabase = await getClient();
    await supabase
      .from("visa_document_contexts")
      .update({ caveat_text: caveatText || null })
      .eq("context_key", contextKey);
    revalidatePath("/admin/visa-content");
  } catch (err) {
    console.error("[saveCaveat] Error:", err);
  }
}
