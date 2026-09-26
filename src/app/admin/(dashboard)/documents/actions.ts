"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendDocumentEmail } from "@/lib/documents/mailer";
import { generateDocumentPdf } from "@/lib/documents/generate-pdf";
import type { DocumentItemRow, DocumentItemType, DocumentRow, DocumentTemplateRowShape, DocumentType } from "@/lib/types/database";

async function getClient() {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      return createAdminClient();
    } catch {
      // ignore
    }
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

const VAT_RATE = 0.05;

function revalidateDocumentPaths(documentType: DocumentType, documentId?: string) {
  try {
    revalidatePath("/admin/documents");
    revalidatePath(`/admin/documents/${moduleSlug(documentType)}`);
    if (documentId) revalidatePath(`/admin/documents/${moduleSlug(documentType)}/${documentId}`);
  } catch (err) {
    console.warn("[revalidateDocumentPaths] Failed to revalidate:", err);
  }
}

function moduleSlug(documentType: DocumentType): string {
  return {
    quotation: "quotations",
    invoice: "invoices",
    receipt: "receipts",
    booking_voucher: "booking-vouchers",
  }[documentType];
}

/** Recomputes subtotal/discount/VAT/total on the parent document from its current line items. VAT is a flat 5% of (subtotal - discount), matching every reference invoice/quotation screenshot rather than per-item tax entry. */
async function recalcDocumentTotals(supabase: Awaited<ReturnType<typeof getClient>>, documentId: string) {
  const { data: items } = await supabase
    .from("document_items")
    .select("quantity, unit_price_aed, discount_aed")
    .eq("document_id", documentId);

  const subtotal = (items ?? []).reduce((sum, i) => sum + Number(i.quantity) * Number(i.unit_price_aed), 0);
  const discount = (items ?? []).reduce((sum, i) => sum + Number(i.discount_aed ?? 0), 0);
  const tax = Math.round((subtotal - discount) * VAT_RATE * 100) / 100;
  const total = Math.round((subtotal - discount + tax) * 100) / 100;

  await supabase
    .from("documents")
    .update({ subtotal_aed: subtotal, discount_aed: discount, tax_aed: tax, total_aed: total })
    .eq("id", documentId);
}

import { createManualQuotationCore, type CreateManualQuotationInput } from "@/lib/documents/service";

export type { CreateManualQuotationInput };

export async function createManualQuotation(input: CreateManualQuotationInput): Promise<{ success: boolean; id?: string; error?: string }> {
  const result = await createManualQuotationCore(input);
  if (result.success && result.id) {
    revalidateDocumentPaths("quotation", result.id);
  }
  return result;
}

export interface CreateManualInvoiceInput {
  client_name: string;
  client_email?: string;
  client_phone?: string;
  client_country?: string;
  due_date?: string;
}

export async function createManualInvoice(input: CreateManualInvoiceInput): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const supabase = await getClient();

    if (!input.client_name?.trim()) {
      return { success: false, error: "Client name is required." };
    }

    const { data: numberResult, error: numberError } = await supabase.rpc("generate_document_number", {
      p_document_type: "invoice",
    });
    if (numberError || !numberResult) {
      return { success: false, error: numberError?.message ?? "Failed to generate invoice number." };
    }

    const { data: template } = await supabase
      .from("document_templates")
      .select("id")
      .eq("document_type", "invoice")
      .eq("is_default", true)
      .maybeSingle();

    const { data: inserted, error } = await supabase
      .from("documents")
      .insert({
        document_type: "invoice",
        document_number: numberResult as string,
        status: "draft",
        client_name: input.client_name.trim(),
        client_email: input.client_email?.trim() || null,
        client_phone: input.client_phone?.trim() || null,
        client_country: input.client_country?.trim() || null,
        due_date: input.due_date || null,
        template_id: template?.id ?? null,
        subtotal_aed: 0,
        discount_aed: 0,
        tax_aed: 0,
        total_aed: 0,
        amount_paid_aed: 0,
      })
      .select("id")
      .single();

    if (error || !inserted) {
      return { success: false, error: error?.message ?? "Failed to create invoice." };
    }

    revalidateDocumentPaths("invoice");
    return { success: true, id: inserted.id };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to create invoice." };
  }
}

export interface CreateManualBookingVoucherInput {
  client_name: string;
  client_email?: string;
  client_phone?: string;
  client_country?: string;
  travel_date?: string;
  return_date?: string;
  adults?: number;
  children?: number;
  infants?: number;
  origin?: string;
  destination?: string;
  booking_reference?: string;
  special_requirements?: string;
  notes?: string;
  source_document_id?: string;
  // Granular boxes
  makkah_hotel?: string;
  makkah_nights?: number;
  makkah_room?: string;
  madinah_hotel?: string;
  madinah_nights?: number;
  madinah_room?: string;
  transfer_vehicle?: string;
  transfer_route?: string;
  flight_airline?: string;
  flight_class?: string;
  flight_route?: string;
  include_visa?: boolean;
  visa_type?: string;
  include_ziyarat?: boolean;
  include_vip?: boolean;
  include_assistance?: boolean;
  custom_addons?: string;
}

export async function createManualBookingVoucher(input: CreateManualBookingVoucherInput): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const supabase = await getClient();

    if (!input.client_name?.trim()) return { success: false, error: "Client name is required." };

    const { data: numberResult, error: numberError } = await supabase.rpc("generate_document_number", {
      p_document_type: "booking_voucher",
    });
    if (numberError || !numberResult) return { success: false, error: numberError?.message ?? "Failed to generate booking voucher number." };

  const { data: template } = await supabase
    .from("document_templates")
    .select("id")
    .eq("document_type", "booking_voucher")
    .eq("is_default", true)
    .maybeSingle();

  const seq = (numberResult as string).split("-").pop() || "0001";
  const bookingRef = input.booking_reference?.trim() || `MH-BKG-${seq}`;

  const { data: inserted, error } = await supabase
    .from("documents")
    .insert({
      document_type: "booking_voucher",
      document_number: numberResult as string,
      status: "confirmed",
      client_name: input.client_name.trim(),
      client_email: input.client_email?.trim() || null,
      client_phone: input.client_phone?.trim() || null,
      client_country: input.client_country?.trim() || null,
      travel_date: input.travel_date || null,
      return_date: input.return_date || null,
      adults: input.adults ?? 2,
      children: input.children ?? 0,
      infants: input.infants ?? 0,
      origin: input.origin?.trim() || null,
      destination: input.destination?.trim() || "Makkah & Madinah",
      booking_reference: bookingRef,
      special_requirements: input.special_requirements?.trim() || null,
      notes: input.notes?.trim() || null,
      source_document_id: input.source_document_id || null,
      template_id: template?.id ?? null,
    })
    .select("id")
    .single();

  if (error || !inserted) return { success: false, error: error?.message ?? "Failed to create booking voucher." };

  // Insert any provided hotel, transfer, flight, and addon items
  const itemsToInsert: Array<{
    document_id: string;
    item_type: "hotel" | "transfer" | "flight" | "service" | "private_trip" | "custom";
    description: string;
    details: string | null;
    quantity: number;
    unit_price_aed: number;
    discount_aed: number;
    tax_aed: number;
    amount_aed: number;
    display_order: number;
  }> = [];
  let order = 0;

  if (input.makkah_hotel?.trim()) {
    itemsToInsert.push({
      document_id: inserted.id,
      item_type: "hotel",
      description: input.makkah_hotel.trim(),
      details: `${input.makkah_nights ?? 5} Nights — ${input.makkah_room?.trim() || "Twin Sharing"}`,
      quantity: input.makkah_nights ?? 5,
      unit_price_aed: 0,
      discount_aed: 0,
      tax_aed: 0,
      amount_aed: 0,
      display_order: order++,
    });
  }

  if (input.madinah_hotel?.trim()) {
    itemsToInsert.push({
      document_id: inserted.id,
      item_type: "hotel",
      description: input.madinah_hotel.trim(),
      details: `${input.madinah_nights ?? 5} Nights — ${input.madinah_room?.trim() || "Twin Sharing"}`,
      quantity: input.madinah_nights ?? 5,
      unit_price_aed: 0,
      discount_aed: 0,
      tax_aed: 0,
      amount_aed: 0,
      display_order: order++,
    });
  }

  if (input.transfer_vehicle?.trim()) {
    itemsToInsert.push({
      document_id: inserted.id,
      item_type: "transfer",
      description: input.transfer_vehicle.trim(),
      details: input.transfer_route?.trim() || "Airport – Makkah – Madinah – Airport",
      quantity: 1,
      unit_price_aed: 0,
      discount_aed: 0,
      tax_aed: 0,
      amount_aed: 0,
      display_order: order++,
    });
  }

  if (input.flight_airline?.trim()) {
    itemsToInsert.push({
      document_id: inserted.id,
      item_type: "flight",
      description: input.flight_airline.trim(),
      details: `${input.flight_class?.trim() || "Economy"} (${input.flight_route?.trim() || "DXB – JED – MED – DXB"})`,
      quantity: 1,
      unit_price_aed: 0,
      discount_aed: 0,
      tax_aed: 0,
      amount_aed: 0,
      display_order: order++,
    });
  }

  if (input.include_visa) {
    itemsToInsert.push({
      document_id: inserted.id,
      item_type: "service",
      description: input.visa_type?.trim() || "Saudi Tourist / Umrah Visa Processing",
      details: "Electronic visa with medical insurance",
      quantity: input.adults ?? 2,
      unit_price_aed: 0,
      discount_aed: 0,
      tax_aed: 0,
      amount_aed: 0,
      display_order: order++,
    });
  }

  if (input.include_ziyarat) {
    itemsToInsert.push({
      document_id: inserted.id,
      item_type: "private_trip",
      description: "Historical Ziyarat in Makkah & Madinah",
      details: "Guided historical sites tour with private chauffeur",
      quantity: 1,
      unit_price_aed: 0,
      discount_aed: 0,
      tax_aed: 0,
      amount_aed: 0,
      display_order: order++,
    });
  }

  if (input.include_vip) {
    itemsToInsert.push({
      document_id: inserted.id,
      item_type: "service",
      description: "VIP Meet & Assist at Airport",
      details: "Dedicated airport terminal coordinator and fast-track assistance",
      quantity: 1,
      unit_price_aed: 0,
      discount_aed: 0,
      tax_aed: 0,
      amount_aed: 0,
      display_order: order++,
    });
  }

  if (input.include_assistance) {
    itemsToInsert.push({
      document_id: inserted.id,
      item_type: "service",
      description: "24/7 Dedicated On-Ground Travel Assistance",
      details: "Round-the-clock concierge and operational support throughout the journey",
      quantity: 1,
      unit_price_aed: 0,
      discount_aed: 0,
      tax_aed: 0,
      amount_aed: 0,
      display_order: order++,
    });
  }

  if (input.custom_addons?.trim()) {
    itemsToInsert.push({
      document_id: inserted.id,
      item_type: "custom",
      description: input.custom_addons.trim(),
      details: "Special confirmed add-on service",
      quantity: 1,
      unit_price_aed: 0,
      discount_aed: 0,
      tax_aed: 0,
      amount_aed: 0,
      display_order: order++,
    });
  }

  if (itemsToInsert.length > 0) {
    await supabase.from("document_items").insert(itemsToInsert);
  }

    revalidateDocumentPaths("booking_voucher");
    return { success: true, id: inserted.id };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to create booking voucher." };
  }
}

export async function updateDocumentBasics(documentId: string, documentType: DocumentType, patch: Partial<DocumentRow>): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getClient();
    const { error } = await supabase.from("documents").update(patch).eq("id", documentId);
    if (error) {
      if (error.code === "23505" && patch.document_number) {
        return { success: false, error: `Document number "${patch.document_number}" is already in use by another document.` };
      }
      return { success: false, error: error.message };
    }
    revalidateDocumentPaths(documentType, documentId);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to update document basics." };
  }
}

export interface LineItemInput {
  item_type: DocumentItemType;
  source_type?: string | null;
  source_id?: string | null;
  description: string;
  details?: string | null;
  quantity: number;
  unit_price_aed: number;
  discount_aed?: number;
}

export async function addLineItem(documentId: string, documentType: DocumentType, item: LineItemInput): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getClient();

    const { count } = await supabase.from("document_items").select("id", { count: "exact", head: true }).eq("document_id", documentId);
    const amount = Number(item.quantity) * Number(item.unit_price_aed) - Number(item.discount_aed ?? 0);

    const { error } = await supabase.from("document_items").insert({
      document_id: documentId,
      item_type: item.item_type,
      source_type: item.source_type ?? null,
      source_id: item.source_id ?? null,
      description: item.description,
      details: item.details ?? null,
      quantity: item.quantity,
      unit_price_aed: item.unit_price_aed,
      discount_aed: item.discount_aed ?? 0,
      tax_aed: 0,
      amount_aed: amount,
      display_order: count ?? 0,
    });
    if (error) return { success: false, error: error.message };

    await recalcDocumentTotals(supabase, documentId);
    revalidateDocumentPaths(documentType, documentId);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to add line item." };
  }
}

export async function updateLineItem(itemId: string, documentId: string, documentType: DocumentType, patch: Partial<LineItemInput>): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getClient();

    const { data: existing } = await supabase.from("document_items").select("*").eq("id", itemId).single<DocumentItemRow>();
    if (!existing) return { success: false, error: "Line item not found." };

    const merged = { ...existing, ...patch };
    const amount = Number(merged.quantity) * Number(merged.unit_price_aed) - Number(merged.discount_aed ?? 0);

    const { error } = await supabase
      .from("document_items")
      .update({ ...patch, amount_aed: amount })
      .eq("id", itemId);
    if (error) return { success: false, error: error.message };

    await recalcDocumentTotals(supabase, documentId);
    revalidateDocumentPaths(documentType, documentId);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to update line item." };
  }
}

export async function deleteLineItem(itemId: string, documentId: string, documentType: DocumentType): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getClient();
    const { error } = await supabase.from("document_items").delete().eq("id", itemId);
    if (error) return { success: false, error: error.message };

    await recalcDocumentTotals(supabase, documentId);
    revalidateDocumentPaths(documentType, documentId);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to delete line item." };
  }
}

export async function reorderLineItems(documentId: string, documentType: DocumentType, orderedItemIds: string[]): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getClient();
    await Promise.all(
      orderedItemIds.map((id, index) => supabase.from("document_items").update({ display_order: index }).eq("id", id))
    );
    revalidateDocumentPaths(documentType, documentId);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to reorder items." };
  }
}

/** Snapshots the current document + items as a new version — never overwrites or deletes a prior version. */
export async function saveDocumentVersion(documentId: string, documentType: DocumentType): Promise<{ success: boolean; version?: number; error?: string }> {
  try {
    const supabase = await getClient();

    const [{ data: document }, { data: items }, { data: lastVersion }] = await Promise.all([
      supabase.from("documents").select("*").eq("id", documentId).single(),
      supabase.from("document_items").select("*").eq("document_id", documentId).order("display_order", { ascending: true }),
      supabase.from("document_versions").select("version_number").eq("document_id", documentId).order("version_number", { ascending: false }).limit(1).maybeSingle(),
    ]);

    if (!document) return { success: false, error: "Document not found." };

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const nextVersion = (lastVersion?.version_number ?? 0) + 1;

    const { error } = await supabase.from("document_versions").insert({
      document_id: documentId,
      version_number: nextVersion,
      status_at_version: document.status,
      snapshot: { document, items: items ?? [] },
      created_by: user?.id ?? null,
    });
    if (error) return { success: false, error: error.message };

    revalidateDocumentPaths(documentType, documentId);
    return { success: true, version: nextVersion };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to save version." };
  }
}

export async function updateDocumentStatus(documentId: string, documentType: DocumentType, status: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getClient();
    const { error } = await supabase.from("documents").update({ status }).eq("id", documentId);
    if (error) return { success: false, error: error.message };
    await saveDocumentVersion(documentId, documentType);
    revalidateDocumentPaths(documentType, documentId);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to update status." };
  }
}

export async function duplicateDocument(documentId: string, documentType: DocumentType): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const supabase = await getClient();

    const [{ data: document }, { data: items }] = await Promise.all([
      supabase.from("documents").select("*").eq("id", documentId).single<DocumentRow>(),
      supabase.from("document_items").select("*").eq("document_id", documentId).order("display_order", { ascending: true }),
    ]);
    if (!document) return { success: false, error: "Document not found." };

    const { data: numberResult, error: numError } = await supabase.rpc("generate_document_number", { p_document_type: documentType });
    if (numError || !numberResult) return { success: false, error: numError?.message ?? "Failed to generate document number." };

    const {
      id: _id,
      document_number: _num,
      created_at: _ca,
      updated_at: _ua,
      status: _status,
      ...rest
    } = document;

    const { data: inserted, error } = await supabase
      .from("documents")
      .insert({ ...rest, document_number: numberResult as string, status: "draft" })
      .select("id")
      .single();
    if (error || !inserted) return { success: false, error: error?.message ?? "Failed to duplicate document." };

    if (items && items.length > 0) {
      const copies = (items as DocumentItemRow[]).map(({ id: _itemId, document_id: _docId, created_at: _createdAt, ...rest }) => ({
        ...rest,
        document_id: inserted.id,
      }));
      await supabase.from("document_items").insert(copies);
    }

    revalidateDocumentPaths(documentType);
    return { success: true, id: inserted.id };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to duplicate document." };
  }
}

export async function deleteDocument(documentId: string, documentType: DocumentType): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getClient();
    const { error } = await supabase.from("documents").delete().eq("id", documentId);
    if (error) return { success: false, error: error.message };
    revalidateDocumentPaths(documentType);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to delete document." };
  }
}

export async function deleteDocuments(documentIds: string[], documentType: DocumentType): Promise<{ success: boolean; error?: string }> {
  try {
    if (documentIds.length === 0) return { success: true };
    const supabase = await getClient();
    const { error } = await supabase.from("documents").delete().in("id", documentIds);
    if (error) return { success: false, error: error.message };
    revalidateDocumentPaths(documentType);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to delete documents." };
  }
}

export async function createShareLink(documentId: string) {
  const supabase = await getClient();
  const token = randomBytes(16).toString("hex");

  const { error } = await supabase.from("document_shares").insert({ document_id: documentId, share_token: token });
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/documents/quotations/${documentId}`);
  return token;
}

export async function updateDocumentSettings(patch: {
  quotation_prefix: string;
  invoice_prefix: string;
  receipt_prefix: string;
  booking_voucher_prefix: string;
}) {
  const supabase = await getClient();
  const { error } = await supabase.from("document_settings").update(patch).eq("id", 1);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/documents/settings");
}

export interface UpdatePdfSettingsInput {
  prefixes: {
    quotation_prefix: string;
    invoice_prefix: string;
    receipt_prefix: string;
    booking_voucher_prefix: string;
  };
  terms: {
    quotation: string;
    invoice: string;
    receipt: string;
    booking_voucher: string;
  };
  company: {
    phone: string;
    email: string;
    website: string;
    address: string;
  };
  bank: {
    name: string;
    account_name: string;
    account_number: string;
    iban: string;
    swift_code: string;
  };
  notes: {
    blessing_note: string;
    signature_name: string;
    signature_title: string;
  };
}

export async function updateDocumentPdfSettings(input: UpdatePdfSettingsInput): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getClient();

    // 1. Update numbering prefixes in document_settings
    const { error: sErr } = await supabase
      .from("document_settings")
      .update({
        quotation_prefix: input.prefixes.quotation_prefix.trim(),
        invoice_prefix: input.prefixes.invoice_prefix.trim(),
        receipt_prefix: input.prefixes.receipt_prefix.trim(),
        booking_voucher_prefix: input.prefixes.booking_voucher_prefix.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);

    if (sErr) console.warn("document_settings update error:", sErr);

    // 2. Update all document templates across types
    const docTypes: DocumentType[] = ["quotation", "invoice", "receipt", "booking_voucher"];
    for (const dt of docTypes) {
      const termsForType = input.terms[dt] ?? input.terms.quotation;
      await supabase
        .from("document_templates")
        .update({
          terms_text: termsForType || null,
          company_phone: input.company.phone || null,
          company_email: input.company.email || null,
          company_website: input.company.website || null,
          company_address: input.company.address || null,
          bank_name: input.bank.name || null,
          bank_account_name: input.bank.account_name || null,
          bank_account_number: input.bank.account_number || null,
          bank_iban: input.bank.iban || null,
          bank_swift_code: input.bank.swift_code || null,
          blessing_note: input.notes.blessing_note || null,
          signature_name: input.notes.signature_name || null,
          signature_title: input.notes.signature_title || null,
          updated_at: new Date().toISOString(),
        })
        .eq("document_type", dt);
    }

    revalidatePath("/admin/documents/settings");
    revalidatePath("/admin/documents/templates");
    revalidatePath("/admin/documents");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to update PDF settings." };
  }
}

export async function updateDocumentTemplate(templateId: string, patch: Partial<DocumentTemplateRowShape>) {
  const supabase = await getClient();
  const { error } = await supabase.from("document_templates").update(patch).eq("id", templateId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/documents/templates");
}

export interface SendDocumentEmailInput {
  to: string;
  cc?: string;
  subject: string;
  message: string; // plain text / simple HTML from the rich-text-ish textarea, with {{variables}} already substituted
  includePdfAttachment: boolean;
}

export async function sendDocumentEmailAction(documentId: string, documentType: DocumentType, input: SendDocumentEmailInput) {
  const supabase = await getClient();
  const { data: document } = await supabase.from("documents").select("*").eq("id", documentId).single<DocumentRow>();
  if (!document) throw new Error("Document not found.");

  const attachment = input.includePdfAttachment
    ? { filename: `${document.document_number}.pdf`, content: await generateDocumentPdf(documentId) }
    : undefined;

  await sendDocumentEmail({
    to: input.to,
    cc: input.cc,
    subject: input.subject,
    html: input.message.replace(/\n/g, "<br />"),
    attachment,
  });

  if (document.status === "draft") {
    await supabase.from("documents").update({ status: "sent" }).eq("id", documentId);
    await saveDocumentVersion(documentId, documentType);
  }

  revalidateDocumentPaths(documentType, documentId);
}

/** Creates a new document of `toType`, seeded from an existing document's client/travel details and line items — used for Quotation → Invoice, Invoice → Receipt(payment), Quotation → Booking Voucher. Line items are copied as a fresh snapshot, never a live reference back to the source. */
export async function createDocumentFromSource(sourceId: string, toType: DocumentType): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const supabase = await getClient();

    const [{ data: source }, { data: items }] = await Promise.all([
      supabase.from("documents").select("*").eq("id", sourceId).single<DocumentRow>(),
      supabase.from("document_items").select("*").eq("document_id", sourceId).order("display_order", { ascending: true }),
    ]);
    if (!source) return { success: false, error: "Source document not found." };

    const { data: numberResult, error: numberError } = await supabase.rpc("generate_document_number", { p_document_type: toType });
    if (numberError || !numberResult) return { success: false, error: numberError?.message ?? "Failed to generate document number." };

    const { data: template } = await supabase.from("document_templates").select("id").eq("document_type", toType).eq("is_default", true).maybeSingle();

    const { data: inserted, error } = await supabase
      .from("documents")
      .insert({
        document_type: toType,
        document_number: numberResult as string,
        status: "draft",
        client_name: source.client_name,
        client_email: source.client_email,
        client_phone: source.client_phone,
        client_country: source.client_country,
        journey_type: source.journey_type,
        travel_date: source.travel_date,
        return_date: source.return_date,
        adults: source.adults,
        children: source.children,
        infants: source.infants,
        origin: source.origin,
        destination: source.destination,
        special_requirements: source.special_requirements,
        source_document_id: source.id,
        subtotal_aed: source.subtotal_aed,
        discount_aed: source.discount_aed,
        tax_aed: source.tax_aed,
        total_aed: source.total_aed,
        notes: source.notes,
        terms: source.terms,
        template_id: template?.id ?? null,
        booking_reference: toType === "booking_voucher" ? `MH-BKG-${(numberResult as string).split("-").pop()}` : null,
      })
      .select("id")
      .single();
    if (error || !inserted) return { success: false, error: error?.message ?? "Failed to create document." };

    if (items && items.length > 0) {
      const copies = (items as DocumentItemRow[]).map(({ id: _itemId, document_id: _docId, created_at: _createdAt, ...rest }) => ({
        ...rest,
        document_id: inserted.id,
      }));
      await supabase.from("document_items").insert(copies);
    }

    revalidateDocumentPaths(toType);
    return { success: true, id: inserted.id };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to create document." };
  }
}

export interface RecordPaymentInput {
  amount: number;
  payment_method: "bank_transfer" | "cash" | "card" | "other";
  transaction_reference?: string;
  payment_date: string;
  notes?: string;
}

/**
 * The core Receipt Maker action: records a payment against an invoice and
 * generates the receipt for it in one step — a receipt is never created
 * standalone (see the "documents" table's header comment / brief). Each
 * payment gets its own receipt row (own total_aed = the payment amount,
 * not the invoice's total), so an invoice's "payment history" is simply
 * every receipt with source_document_id = this invoice (no separate
 * payments table needed).
 */
export async function recordPayment(invoiceId: string, input: RecordPaymentInput): Promise<{
  success: boolean;
  receiptId?: string;
  receiptNumber?: string;
  newStatus?: string;
  balanceDue?: number;
  error?: string;
}> {
  try {
    const supabase = await getClient();

    if (!(input.amount > 0)) return { success: false, error: "Payment amount must be greater than zero." };

    const { data: invoice } = await supabase.from("documents").select("*").eq("id", invoiceId).single<DocumentRow>();
    if (!invoice) return { success: false, error: "Invoice not found." };

    const newAmountPaid = Math.round((invoice.amount_paid_aed + input.amount) * 100) / 100;
    const newStatus = newAmountPaid >= invoice.total_aed ? "paid" : "partially_paid";

    const { error: invoiceUpdateError } = await supabase
      .from("documents")
      .update({ amount_paid_aed: newAmountPaid, status: newStatus })
      .eq("id", invoiceId);
    if (invoiceUpdateError) return { success: false, error: invoiceUpdateError.message };

    const { data: numberResult, error: numberError } = await supabase.rpc("generate_document_number", { p_document_type: "receipt" });
    if (numberError || !numberResult) return { success: false, error: numberError?.message ?? "Failed to generate receipt number." };

    const { data: template } = await supabase.from("document_templates").select("id").eq("document_type", "receipt").eq("is_default", true).maybeSingle();

    const { data: receipt, error: receiptError } = await supabase
      .from("documents")
      .insert({
        document_type: "receipt",
        document_number: numberResult as string,
        status: "issued",
        client_name: invoice.client_name,
        client_email: invoice.client_email,
        client_phone: invoice.client_phone,
        client_country: invoice.client_country,
        source_document_id: invoice.id,
        booking_reference: invoice.booking_reference,
        total_aed: input.amount,
        payment_method: input.payment_method,
        transaction_reference: input.transaction_reference?.trim() || null,
        payment_date: input.payment_date,
        notes: input.notes?.trim() || null,
        template_id: template?.id ?? null,
      })
      .select("id, document_number")
      .single();
    if (receiptError || !receipt) return { success: false, error: receiptError?.message ?? "Failed to create receipt." };

    await saveDocumentVersion(invoiceId, "invoice");

    revalidateDocumentPaths("invoice", invoiceId);
    revalidateDocumentPaths("receipt", receipt.id);

    return {
      success: true,
      receiptId: receipt.id,
      receiptNumber: receipt.document_number,
      newStatus,
      balanceDue: Math.round((invoice.total_aed - newAmountPaid) * 100) / 100,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to record payment." };
  }
}

export interface CreateManualReceiptInput {
  client_name: string;
  client_email?: string;
  client_phone?: string;
  client_country?: string;
  amount: number;
  payment_method: "bank_transfer" | "cash" | "card" | "other";
  payment_date: string;
  transaction_reference?: string;
  booking_reference?: string;
  source_document_id?: string;
  notes?: string;
}

export async function createManualReceipt(input: CreateManualReceiptInput): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const supabase = await getClient();

    if (!input.client_name?.trim()) return { success: false, error: "Client name is required." };
    if (!(input.amount > 0)) return { success: false, error: "Receipt amount must be greater than zero." };

    const { data: numberResult, error: numberError } = await supabase.rpc("generate_document_number", { p_document_type: "receipt" });
    if (numberError || !numberResult) return { success: false, error: numberError?.message ?? "Failed to generate receipt number." };

    const { data: template } = await supabase.from("document_templates").select("id").eq("document_type", "receipt").eq("is_default", true).maybeSingle();

    // If against an invoice, update that invoice amount_paid
    if (input.source_document_id) {
      const { data: invoice } = await supabase.from("documents").select("*").eq("id", input.source_document_id).single<DocumentRow>();
      if (invoice) {
        const newAmountPaid = Math.round((invoice.amount_paid_aed + input.amount) * 100) / 100;
        const newStatus = newAmountPaid >= invoice.total_aed ? "paid" : "partially_paid";
        await supabase.from("documents").update({ amount_paid_aed: newAmountPaid, status: newStatus }).eq("id", invoice.id);
        await saveDocumentVersion(invoice.id, "invoice");
      }
    }

    const { data: receipt, error: receiptError } = await supabase
      .from("documents")
      .insert({
        document_type: "receipt",
        document_number: numberResult as string,
        status: "issued",
        client_name: input.client_name.trim(),
        client_email: input.client_email?.trim() || null,
        client_phone: input.client_phone?.trim() || null,
        client_country: input.client_country?.trim() || null,
        source_document_id: input.source_document_id || null,
        booking_reference: input.booking_reference?.trim() || null,
        total_aed: input.amount,
        payment_method: input.payment_method,
        transaction_reference: input.transaction_reference?.trim() || null,
        payment_date: input.payment_date,
        notes: input.notes?.trim() || null,
        template_id: template?.id ?? null,
      })
      .select("id")
      .single();

    if (receiptError || !receipt) return { success: false, error: receiptError?.message ?? "Failed to create receipt." };

    revalidateDocumentPaths("receipt");
    if (input.source_document_id) revalidateDocumentPaths("invoice", input.source_document_id);

    return { success: true, id: receipt.id };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to create receipt." };
  }
}
