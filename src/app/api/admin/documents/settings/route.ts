import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import type { DocumentType } from "@/lib/types/database";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prefixes = {}, terms = {}, company = {}, bank = {}, notes = {} } = body;

    const supabase = createAdminClient();

    // 1. Update numbering prefixes in document_settings
    const { error: sErr } = await supabase
      .from("document_settings")
      .update({
        quotation_prefix: (prefixes.quotation_prefix ?? "Q-").toString().trim(),
        invoice_prefix: (prefixes.invoice_prefix ?? "INV-").toString().trim(),
        receipt_prefix: (prefixes.receipt_prefix ?? "REC-").toString().trim(),
        booking_voucher_prefix: (prefixes.booking_voucher_prefix ?? "BV-").toString().trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);

    if (sErr) {
      console.error("[api/documents/settings] document_settings update error:", sErr);
      return NextResponse.json({ success: false, error: sErr.message }, { status: 500 });
    }

    // 2. Update all document templates across types
    const docTypes: DocumentType[] = ["quotation", "invoice", "receipt", "booking_voucher"];
    for (const dt of docTypes) {
      const termsForType = terms[dt] ?? terms.quotation ?? null;
      const { error: tErr } = await supabase
        .from("document_templates")
        .update({
          terms_text: termsForType ? termsForType.toString() : null,
          company_phone: company.phone ? company.phone.toString() : null,
          company_email: company.email ? company.email.toString() : null,
          company_website: company.website ? company.website.toString() : null,
          company_address: company.address ? company.address.toString() : null,
          bank_name: bank.name ? bank.name.toString() : null,
          bank_account_name: bank.account_name ? bank.account_name.toString() : null,
          bank_account_number: bank.account_number ? bank.account_number.toString() : null,
          bank_iban: bank.iban ? bank.iban.toString() : null,
          bank_swift_code: bank.swift_code ? bank.swift_code.toString() : null,
          blessing_note: notes.blessing_note ? notes.blessing_note.toString() : null,
          signature_name: notes.signature_name ? notes.signature_name.toString() : null,
          signature_title: notes.signature_title ? notes.signature_title.toString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("document_type", dt);

      if (tErr) {
        console.warn(`[api/documents/settings] template update warning for ${dt}:`, tErr.message);
      }
    }

    try {
      revalidatePath("/admin/documents/settings");
      revalidatePath("/admin/documents/templates");
      revalidatePath("/admin/documents");
    } catch (e: any) {
      console.warn("[api/documents/settings] revalidatePath skipped:", e?.message);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[api/documents/settings] unexpected error:", err);
    return NextResponse.json({ success: false, error: err?.message || "Internal server error" }, { status: 500 });
  }
}
