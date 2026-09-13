"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { EnquiryStatus } from "@/lib/types/database";

export async function setEnquiryStatus(id: string, status: EnquiryStatus) {
  const supabase = await createClient();
  await supabase.from("enquiries").update({ status }).eq("id", id);
  revalidatePath("/admin/enquiries");
  revalidatePath(`/admin/enquiries/${id}`);
}

export async function saveEnquiryNotes(id: string, formData: FormData) {
  const notes = String(formData.get("internal_notes") ?? "");
  const supabase = await createClient();
  await supabase.from("enquiries").update({ internal_notes: notes }).eq("id", id);
  revalidatePath(`/admin/enquiries/${id}`);
}

export async function deleteEnquiry(id: string) {
  const supabase = await createClient();
  await supabase.from("enquiries").delete().eq("id", id);
  revalidatePath("/admin/enquiries");
}
