"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { EnquiryStatus, EnquiryRow, DocumentRow } from "@/lib/types/database";
import { type CrmMetadata, parseCrmMeta } from "./crm-utils";

export type { CrmMetadata };

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

export async function updateEnquiryCrm(id: string, metaPatch: Partial<CrmMetadata>, newName?: string, newPhone?: string, newEmail?: string) {
  const supabase = await getClient();
  const { data: existing } = await supabase.from("enquiries").select("*").eq("id", id).single<EnquiryRow>();
  if (!existing) throw new Error("Enquiry not found.");

  const currentMeta = parseCrmMeta(existing.internal_notes);
  const updatedMeta: CrmMetadata = { ...currentMeta, ...metaPatch };

  // Map CRM status to valid DB status
  let dbStatus: EnquiryStatus = existing.status;
  if (metaPatch.crm_status) {
    if (metaPatch.crm_status === "new") dbStatus = "new";
    else if (metaPatch.crm_status === "contacted") dbStatus = "contacted";
    else if (metaPatch.crm_status === "lost" || metaPatch.crm_status === "converted" || metaPatch.crm_status === "accepted") dbStatus = "closed";
    else dbStatus = "viewed";
  }

  const updatePayload: Partial<EnquiryRow> = {
    internal_notes: JSON.stringify(updatedMeta),
    status: dbStatus,
  };

  if (newName?.trim()) updatePayload.name = newName.trim();
  if (newPhone !== undefined) updatePayload.phone = newPhone?.trim() || null;
  if (newEmail !== undefined) updatePayload.email = newEmail?.trim() || null;

  const { error } = await supabase.from("enquiries").update(updatePayload as any).eq("id", id);
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

export interface CreateEnquiryInput {
  name: string;
  phone?: string;
  email?: string;
  country?: string;
  enquiry_type: string;
  travel_date?: string;
  adults?: number;
  children?: number;
  preferred_package?: string;
  assigned_to?: string;
  crm_status?: "new" | "contacted" | "preparing_quote" | "quote_sent" | "revision_requested" | "accepted" | "converted" | "lost";
  notes?: string;
}

export async function createEnquiryLead(input: CreateEnquiryInput) {
  const supabase = await getClient();
  if (!input.name?.trim()) throw new Error("Client name is required.");

  const meta: CrmMetadata = {
    crm_status: input.crm_status || "new",
    country: input.country || "UAE",
    travel_dates: input.travel_date,
    preferred_package: input.preferred_package || "Standard",
    adults: input.adults ?? 2,
    children: input.children ?? 0,
    notes: input.notes,
  };

  let dbStatus: EnquiryStatus = "new";
  if (meta.crm_status === "contacted") dbStatus = "contacted";
  else if (meta.crm_status === "lost") dbStatus = "closed";

  const travellersStr = `${input.adults ?? 2} Adults${input.children ? `, ${input.children} Children` : ""}`;

  const { data: inserted, error } = await supabase
    .from("enquiries")
    .insert({
      name: input.name.trim(),
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      enquiry_type: input.enquiry_type || "Umrah",
      number_of_travellers: travellersStr,
      travel_date: input.travel_date || null,
      page_source: "Admin CRM Lead Form",
      status: dbStatus,
      internal_notes: JSON.stringify(meta),
      message: input.notes || null,
    })
    .select("id")
    .single();

  if (error || !inserted) throw new Error(error?.message ?? "Failed to create lead.");

  revalidatePath("/admin/enquiries");
  return inserted.id;
}

/** Converts an enquiry lead directly into a quotation document */
export async function convertEnquiryToQuotation(enquiryId: string) {
  const supabase = await getClient();
  const { data: enquiry } = await supabase.from("enquiries").select("*").eq("id", enquiryId).single<EnquiryRow>();
  if (!enquiry) throw new Error("Enquiry not found.");

  const meta = parseCrmMeta(enquiry.internal_notes);

  const { data: numberResult, error: numberError } = await supabase.rpc("generate_document_number", {
    p_document_type: "quotation",
  });
  if (numberError || !numberResult) throw new Error(numberError?.message ?? "Failed to generate quotation number.");

  const { data: template } = await supabase
    .from("document_templates")
    .select("id")
    .eq("document_type", "quotation")
    .eq("is_default", true)
    .maybeSingle();

  const journeyTypeMap: Record<string, string> = {
    Umrah: "umrah",
    Hajj: "hajj",
    Hotels: "hotel",
    Transfers: "transfer",
    "Private Trip": "private_trip",
  };
  const journeyType = journeyTypeMap[enquiry.enquiry_type] || "umrah";

  const { data: inserted, error } = await supabase
    .from("documents")
    .insert({
      document_type: "quotation",
      document_number: numberResult as string,
      status: "draft",
      client_name: enquiry.name,
      client_email: enquiry.email,
      client_phone: enquiry.phone,
      client_country: meta.country || "UAE",
      journey_type: journeyType as any,
      travel_date: enquiry.travel_date || meta.travel_dates || null,
      adults: meta.adults ?? 2,
      children: meta.children ?? 0,
      destination: enquiry.enquiry_type === "Hajj" ? "Makkah (Hajj)" : "Makkah & Madinah",
      notes: meta.notes || enquiry.message || null,
      future_crm_enquiry_id: enquiry.id,
      template_id: template?.id ?? null,
    })
    .select("id")
    .single();

  if (error || !inserted) throw new Error(error?.message ?? "Failed to create quotation.");

  // Update lead status to "preparing_quote"
  meta.crm_status = "preparing_quote";
  await supabase
    .from("enquiries")
    .update({
      internal_notes: JSON.stringify(meta),
      status: "viewed",
    })
    .eq("id", enquiryId);

  revalidatePath("/admin/enquiries");
  revalidatePath("/admin/documents");

  redirect(`/admin/documents/invoices/new?seedQuotationId=${inserted.id}`);
}

export async function deleteEnquiry(id: string) {
  const supabase = await getClient();
  const { error } = await supabase.from("enquiries").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/enquiries");
  redirect("/admin/enquiries");
}

export async function deleteEnquiries(ids: string[]) {
  if (ids.length === 0) return;
  const supabase = await getClient();
  const { error } = await supabase.from("enquiries").delete().in("id", ids);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/enquiries");
}
