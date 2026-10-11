import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateQuotationTotals } from "@/lib/documents/calculations";
import type { DocumentItemType } from "@/lib/types/database";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params;
    if (!documentId) {
      return NextResponse.json(
        { success: false, error: "Missing document ID" },
        { status: 400 }
      );
    }

    const payload = await req.json();
    const supabase = createAdminClient();

    const pricing = calculateQuotationTotals(payload.items || [], {
      applyVat: Boolean(payload.applyVat),
      vatRate: payload.vatRate ?? 0.05,
      documentDiscountAed: payload.documentDiscountAed,
      manualAdjustmentAed: payload.manualAdjustmentAed,
      manualAdjustmentReason: payload.manualAdjustmentReason,
      agreedTotalOverride: payload.agreedTotalOverride,
    });

    // 1. Delete old items and insert updated items
    await supabase.from("document_items").delete().eq("document_id", documentId);

    const itemsToInsert = pricing.items.map((it, idx) => {
      let details = it.details || "";
      if (it.status === "price_on_request" && !details.includes("[price_on_request]")) {
        details = details ? `${details} • [price_on_request]` : "[price_on_request]";
      }
      if (it.is_overridden && !details.includes("[price_overridden]")) {
        details = details ? `${details} • [price_overridden]` : "[price_overridden]";
      }

      return {
        document_id: documentId,
        item_type: it.item_type as DocumentItemType,
        description: it.description,
        details: details || null,
        quantity: it.quantity,
        unit_price_aed: it.unit_price_aed,
        discount_aed: it.discount_aed,
        tax_aed: it.tax_aed,
        amount_aed: it.amount_aed,
        display_order: it.display_order ?? idx,
      };
    });

    if (itemsToInsert.length > 0) {
      const { error: insErr } = await supabase.from("document_items").insert(itemsToInsert);
      if (insErr) {
        return NextResponse.json({ success: false, error: insErr.message }, { status: 400 });
      }
    }

    // 2. Update document totals
    const { error: docErr } = await supabase
      .from("documents")
      .update({
        subtotal_aed: pricing.subtotalAed,
        discount_aed: pricing.discountAed,
        tax_aed: pricing.taxAed,
        total_aed: pricing.totalAed,
      })
      .eq("id", documentId);

    if (docErr) {
      return NextResponse.json({ success: false, error: docErr.message }, { status: 400 });
    }

    // 3. Snapshot new version (safe, non-blocking)
    try {
      const [{ data: docData }, { data: itemsData }, { data: lastVersion }] = await Promise.all([
        supabase.from("documents").select("*").eq("id", documentId).single(),
        supabase.from("document_items").select("*").eq("document_id", documentId).order("display_order", { ascending: true }),
        supabase.from("document_versions").select("version_number").eq("document_id", documentId).order("version_number", { ascending: false }).limit(1).maybeSingle(),
      ]);

      if (docData) {
        const nextVersion = (lastVersion?.version_number ?? 0) + 1;
        await supabase.from("document_versions").insert({
          document_id: documentId,
          version_number: nextVersion,
          status_at_version: docData.status,
          snapshot: { document: docData, items: itemsData ?? [] },
        });
      }
    } catch (verErr) {
      console.warn("[api/documents/[id]/pricing] Version snapshot warning:", verErr);
    }

    return NextResponse.json({ success: true, pricing });
  } catch (err: any) {
    console.error("[api/documents/[id]/pricing POST] Error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
