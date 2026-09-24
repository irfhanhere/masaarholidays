import "server-only";
import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  DocumentItemRow,
  DocumentItemType,
  DocumentRow,
  DocumentSettingsRow,
  DocumentShareRow,
  DocumentTemplateRow,
  DocumentType,
  DocumentVersionRow,
} from "@/lib/types/database";

/**
 * documents/document_items/document_versions carry no public RLS read
 * policy at all (client names, phones, prices) — every admin read needs a
 * real "authenticated" session same as every admin write, so this module
 * uses the same dev_bypass-aware fallback as every actions.ts file (see
 * umrah-departures/actions.ts for the incident that made this mandatory:
 * without it, a read/write silently returns nothing under dev_bypass
 * instead of throwing).
 */
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

/**
 * Every read below falls back to an empty result on error (so the admin UI
 * degrades to an empty state rather than crashing — same convention as
 * umrah-inventory/page.tsx#getData) but ALWAYS logs first: a swallowed,
 * unlogged error here is exactly what made toggleDepartureMonthActive look
 * like it worked while silently doing nothing (see umrah-departures/
 * actions.ts). Most likely real-world cause: migration 0074 hasn't been
 * run in Supabase yet — the error message will say so directly
 * ("Could not find the table 'public.documents'").
 */
function logIfError(context: string, error: { message: string } | null) {
  if (error) console.error(`[documents] ${context}:`, error.message);
}

export interface DocumentCounts {
  draftQuotations: number;
  sentQuotations: number;
  invoices: number;
  receipts: number;
  bookingVouchers: number;
}

export async function getDocumentCounts(): Promise<DocumentCounts> {
  const supabase = await getClient();

  const [draftQ, sentQ, invoices, receipts, vouchers] = await Promise.all([
    supabase.from("documents").select("id", { count: "exact", head: true }).eq("document_type", "quotation").eq("status", "draft"),
    supabase.from("documents").select("id", { count: "exact", head: true }).eq("document_type", "quotation").in("status", ["sent", "viewed", "accepted", "revised"]),
    supabase.from("documents").select("id", { count: "exact", head: true }).eq("document_type", "invoice"),
    supabase.from("documents").select("id", { count: "exact", head: true }).eq("document_type", "receipt"),
    supabase.from("documents").select("id", { count: "exact", head: true }).eq("document_type", "booking_voucher"),
  ]);

  logIfError("getDocumentCounts (draft quotations)", draftQ.error);
  logIfError("getDocumentCounts (sent quotations)", sentQ.error);
  logIfError("getDocumentCounts (invoices)", invoices.error);
  logIfError("getDocumentCounts (receipts)", receipts.error);
  logIfError("getDocumentCounts (booking vouchers)", vouchers.error);

  return {
    draftQuotations: draftQ.count ?? 0,
    sentQuotations: sentQ.count ?? 0,
    invoices: invoices.count ?? 0,
    receipts: receipts.count ?? 0,
    bookingVouchers: vouchers.count ?? 0,
  };
}

export async function listDocuments(documentType?: DocumentType, limit = 50): Promise<DocumentRow[]> {
  const supabase = await getClient();
  let query = supabase.from("documents").select("*").order("created_at", { ascending: false }).limit(limit);
  if (documentType) query = query.eq("document_type", documentType);
  const { data, error } = await query;
  logIfError("listDocuments", error);
  return (data ?? []) as DocumentRow[];
}

export async function getDocument(id: string): Promise<DocumentRow | null> {
  const supabase = await getClient();
  const { data, error } = await supabase.from("documents").select("*").eq("id", id).maybeSingle();
  logIfError("getDocument", error);
  return (data as DocumentRow | null) ?? null;
}

export async function getDocumentItems(documentId: string): Promise<DocumentItemRow[]> {
  const supabase = await getClient();
  const { data, error } = await supabase
    .from("document_items")
    .select("*")
    .eq("document_id", documentId)
    .order("display_order", { ascending: true });
  logIfError("getDocumentItems", error);
  return (data ?? []) as DocumentItemRow[];
}

export async function getDocumentVersions(documentId: string): Promise<DocumentVersionRow[]> {
  const supabase = await getClient();
  const { data, error } = await supabase
    .from("document_versions")
    .select("*")
    .eq("document_id", documentId)
    .order("version_number", { ascending: false });
  logIfError("getDocumentVersions", error);
  return (data ?? []) as DocumentVersionRow[];
}

/** Every receipt linked to an invoice IS a payment record (one row per payment — see actions.ts#recordPayment), so "payment history" is just this query, not a separate table. */
export async function getReceiptsForInvoice(invoiceId: string): Promise<DocumentRow[]> {
  const supabase = await getClient();
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("document_type", "receipt")
    .eq("source_document_id", invoiceId)
    .order("payment_date", { ascending: false });
  logIfError("getReceiptsForInvoice", error);
  return (data ?? []) as DocumentRow[];
}

export async function getDocumentTemplates(documentType: DocumentType): Promise<DocumentTemplateRow[]> {
  const supabase = await getClient();
  const { data, error } = await supabase.from("document_templates").select("*").eq("document_type", documentType).order("created_at", { ascending: true });
  logIfError("getDocumentTemplates", error);
  return (data ?? []) as DocumentTemplateRow[];
}

export async function getDefaultTemplate(documentType: DocumentType): Promise<DocumentTemplateRow | null> {
  const supabase = await getClient();
  const { data, error } = await supabase
    .from("document_templates")
    .select("*")
    .eq("document_type", documentType)
    .eq("is_default", true)
    .maybeSingle();
  logIfError("getDefaultTemplate", error);
  return (data as DocumentTemplateRow | null) ?? null;
}

export async function getDocumentSettings(): Promise<DocumentSettingsRow | null> {
  const supabase = await getClient();
  const { data, error } = await supabase.from("document_settings").select("*").eq("id", 1).maybeSingle();
  logIfError("getDocumentSettings", error);
  return (data as DocumentSettingsRow | null) ?? null;
}

export async function getDocumentShares(documentId: string): Promise<DocumentShareRow[]> {
  const supabase = await getClient();
  const { data, error } = await supabase.from("document_shares").select("*").eq("document_id", documentId).order("created_at", { ascending: false });
  logIfError("getDocumentShares", error);
  return (data ?? []) as DocumentShareRow[];
}

/**
 * Returns the document's active share link, creating one first if none
 * exists yet. Deliberately a plain data-layer function, not the
 * createShareLink server action in documents/actions.ts — that action
 * calls revalidatePath, which Next.js hard-errors on when called during a
 * page render (as opposed to in response to a user-triggered mutation),
 * and this needs to run during the Send Quotation page's render so the
 * link is ready before the page ever shows.
 */
export async function ensureDocumentShare(documentId: string): Promise<DocumentShareRow> {
  const supabase = await getClient();

  const existing = await getDocumentShares(documentId);
  const active = existing.find((s) => !s.expires_at || new Date(s.expires_at) > new Date());
  if (active) return active;

  const token = randomBytes(16).toString("hex");
  const { data, error } = await supabase.from("document_shares").insert({ document_id: documentId, share_token: token }).select("*").single();
  logIfError("ensureDocumentShare", error);
  if (!data) throw new Error(error?.message ?? "Failed to create a secure share link.");
  return data as DocumentShareRow;
}

/**
 * Public, non-admin lookup by share token — the ONLY read path documents
 * ever go through without an authenticated admin session, so it uses the
 * service-role client directly (same allowed-exception pattern documented
 * in lib/supabase/admin.ts) rather than a blanket anon RLS policy. Token
 * possession is the access control; there is no customer account.
 */
export async function getSharedDocument(
  token: string
): Promise<{ document: DocumentRow; items: DocumentItemRow[]; template: DocumentTemplateRow | null; share: DocumentShareRow } | null> {
  const supabase = createAdminClient();

  const { data: share, error: shareError } = await supabase.from("document_shares").select("*").eq("share_token", token).maybeSingle();
  logIfError("getSharedDocument (share)", shareError);
  if (!share) return null;
  if (share.expires_at && new Date(share.expires_at) < new Date()) return null;

  const { data: document, error: documentError } = await supabase.from("documents").select("*").eq("id", share.document_id).maybeSingle();
  logIfError("getSharedDocument (document)", documentError);
  if (!document) return null;

  const [{ data: items, error: itemsError }, { data: template, error: templateError }] = await Promise.all([
    supabase.from("document_items").select("*").eq("document_id", document.id).order("display_order", { ascending: true }),
    document.template_id
      ? supabase.from("document_templates").select("*").eq("id", document.template_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);
  logIfError("getSharedDocument (items)", itemsError);
  logIfError("getSharedDocument (template)", templateError);

  if (!share.viewed_at) {
    await supabase.from("document_shares").update({ viewed_at: new Date().toISOString() }).eq("id", share.id);
    if (document.status === "sent") {
      await supabase.from("documents").update({ status: "viewed" }).eq("id", document.id);
      document.status = "viewed";
    }
  }

  return {
    document: document as DocumentRow,
    items: (items ?? []) as DocumentItemRow[],
    template: (template as DocumentTemplateRow | null) ?? null,
    share: share as DocumentShareRow,
  };
}

export function labelForItemType(type: DocumentItemType): string {
  const labels: Record<DocumentItemType, string> = {
    umrah_package: "Umrah Package",
    hajj_package: "Hajj Package",
    hotel: "Hotel",
    transfer: "Transfer",
    private_trip: "Private Trip",
    flight: "Flight",
    service: "Service",
    custom: "Custom Item",
  };
  return labels[type];
}
