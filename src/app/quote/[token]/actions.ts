"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * The public quotation page has no login session — a share_token IS the
 * authorization, so this goes straight through the service-role client
 * (same documented exception as getSharedDocument in lib/data/documents.ts)
 * rather than the admin auth-gated getClient() pattern every /admin action
 * uses.
 */
export async function respondToQuotation(
  token: string,
  action: "accept" | "request_changes",
  changeDetails?: { categories?: string[]; message?: string }
) {
  const supabase = createAdminClient();

  const { data: share } = await supabase.from("document_shares").select("document_id").eq("share_token", token).maybeSingle();
  if (!share) throw new Error("This quotation link is no longer valid.");

  const status = action === "accept" ? "accepted" : "revision_requested";
  
  const updatePayload: { status: string; notes?: string } = { status };
  if (action === "request_changes" && changeDetails) {
    const cats = changeDetails.categories?.join(", ") || "General";
    const noteEntry = `[Client Revision Request - ${new Date().toLocaleDateString("en-GB")}]:\nCategories: ${cats}\n${changeDetails.message ? `Notes: ${changeDetails.message}` : ""}\n`;
    
    const { data: existingDoc } = await supabase.from("documents").select("notes").eq("id", share.document_id).single();
    updatePayload.notes = existingDoc?.notes ? `${existingDoc.notes}\n\n${noteEntry}` : noteEntry;
  }

  const { error } = await supabase.from("documents").update(updatePayload).eq("id", share.document_id);
  if (error) throw new Error(error.message);

  const lastVersion = await supabase
    .from("document_versions")
    .select("version_number")
    .eq("document_id", share.document_id)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data: document } = await supabase.from("documents").select("*").eq("id", share.document_id).single();
  const { data: items } = await supabase.from("document_items").select("*").eq("document_id", share.document_id);
  if (!document) throw new Error("Document not found.");

  await supabase.from("document_versions").insert({
    document_id: share.document_id,
    version_number: (lastVersion.data?.version_number ?? 0) + 1,
    status_at_version: status,
    snapshot: { document, items: items ?? [] },
  });

  revalidatePath(`/quote/${token}`);
  revalidatePath("/admin/documents");
  revalidatePath("/admin/documents/quotations");
  revalidatePath(`/admin/documents/quotations/${share.document_id}`);
  return status;
}
