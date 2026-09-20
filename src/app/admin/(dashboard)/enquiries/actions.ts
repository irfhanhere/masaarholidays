"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { EnquiryStatus } from "@/lib/types/database";

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

export async function setEnquiryStatus(id: string, status: EnquiryStatus) {
  const supabase = await getClient();
  const { error } = await supabase.from("enquiries").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/enquiries");
  revalidatePath(`/admin/enquiries/${id}`);
}

export async function saveEnquiryNotes(id: string, formData: FormData) {
  const notes = String(formData.get("internal_notes") ?? "");
  const supabase = await getClient();
  const { error } = await supabase.from("enquiries").update({ internal_notes: notes }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/enquiries/${id}`);
}

/** Used from the enquiry detail page — redirects back to the list afterwards, since staying on a now-deleted row's page would otherwise 404. */
export async function deleteEnquiry(id: string) {
  const supabase = await getClient();
  const { error } = await supabase.from("enquiries").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/enquiries");
  redirect("/admin/enquiries");
}

/** Used from the list page's multi-select "Delete Selected" — no redirect, since we're already on the target page and the list just needs to refresh. */
export async function deleteEnquiries(ids: string[]) {
  if (ids.length === 0) return;
  const supabase = await getClient();
  const { error } = await supabase.from("enquiries").delete().in("id", ids);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/enquiries");
}
