"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { VisaDocumentContextKey } from "@/lib/types/database";

export async function addVisaDocument(contextId: string, formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!title) return;

  const supabase = await createClient();
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
}

export async function deleteVisaDocument(documentId: string) {
  const supabase = await createClient();
  await supabase.from("visa_documents").delete().eq("id", documentId);
  revalidatePath("/admin/visa-content");
}

export async function saveCaveat(contextKey: VisaDocumentContextKey, formData: FormData) {
  const caveatText = String(formData.get("caveat_text") ?? "").trim();
  const supabase = await createClient();
  await supabase
    .from("visa_document_contexts")
    .update({ caveat_text: caveatText || null })
    .eq("context_key", contextKey);
  revalidatePath("/admin/visa-content");
}
