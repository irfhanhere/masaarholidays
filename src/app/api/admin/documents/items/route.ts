import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { LineItemInput } from "@/app/admin/(dashboard)/documents/actions";
import type { DocumentType } from "@/lib/types/database";

const VAT_RATE = 0.05;

async function recalcTotals(supabase: any, documentId: string) {
  const { data: items } = await supabase
    .from("document_items")
    .select("quantity, unit_price_aed, discount_aed")
    .eq("document_id", documentId);

  const subtotal = (items ?? []).reduce(
    (sum: number, i: any) => sum + Number(i.quantity) * Number(i.unit_price_aed),
    0
  );
  const discount = (items ?? []).reduce(
    (sum: number, i: any) => sum + Number(i.discount_aed ?? 0),
    0
  );
  const tax = Math.round((subtotal - discount) * VAT_RATE * 100) / 100;
  const total = Math.round((subtotal - discount + tax) * 100) / 100;

  await supabase
    .from("documents")
    .update({
      subtotal_aed: subtotal,
      discount_aed: discount,
      tax_aed: tax,
      total_aed: total,
    })
    .eq("id", documentId);

  return { subtotal, discount, tax, total };
}

export async function POST(req: Request) {
  try {
    const { documentId, item } = (await req.json()) as {
      documentId: string;
      documentType?: DocumentType;
      item: LineItemInput;
    };

    if (!documentId || !item || !item.description) {
      return NextResponse.json(
        { success: false, error: "Missing documentId or item description" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { count } = await supabase
      .from("document_items")
      .select("id", { count: "exact", head: true })
      .eq("document_id", documentId);

    const amount =
      Number(item.quantity) * Number(item.unit_price_aed) -
      Number(item.discount_aed ?? 0);

    const { data: inserted, error } = await supabase
      .from("document_items")
      .insert({
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
      })
      .select("*")
      .single();

    if (error || !inserted) {
      return NextResponse.json(
        { success: false, error: error?.message || "Failed to insert item" },
        { status: 500 }
      );
    }

    const totals = await recalcTotals(supabase, documentId);

    return NextResponse.json({ success: true, item: inserted, totals });
  } catch (err: any) {
    console.error("[api/items POST] Error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const { itemId, documentId, patch } = (await req.json()) as {
      itemId: string;
      documentId: string;
      patch: Partial<LineItemInput>;
    };

    if (!itemId || !documentId) {
      return NextResponse.json(
        { success: false, error: "Missing itemId or documentId" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: existing } = await supabase
      .from("document_items")
      .select("*")
      .eq("id", itemId)
      .single();

    if (!existing) {
      return NextResponse.json({ success: false, error: "Item not found" }, { status: 404 });
    }

    const nextQty = patch.quantity ?? existing.quantity;
    const nextPrice = patch.unit_price_aed ?? existing.unit_price_aed;
    const nextDiscount = patch.discount_aed ?? existing.discount_aed;
    const nextAmount = Number(nextQty) * Number(nextPrice) - Number(nextDiscount);

    const { data: updated, error } = await supabase
      .from("document_items")
      .update({
        description: patch.description ?? existing.description,
        details: patch.details !== undefined ? patch.details : existing.details,
        quantity: nextQty,
        unit_price_aed: nextPrice,
        discount_aed: nextDiscount,
        amount_aed: nextAmount,
      })
      .eq("id", itemId)
      .select("*")
      .single();

    if (error || !updated) {
      return NextResponse.json(
        { success: false, error: error?.message || "Failed to update item" },
        { status: 500 }
      );
    }

    const totals = await recalcTotals(supabase, documentId);

    return NextResponse.json({ success: true, item: updated, totals });
  } catch (err: any) {
    console.error("[api/items PATCH] Error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("itemId");
    const documentId = searchParams.get("documentId");

    if (!itemId || !documentId) {
      return NextResponse.json(
        { success: false, error: "Missing itemId or documentId" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { error } = await supabase.from("document_items").delete().eq("id", itemId);
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const totals = await recalcTotals(supabase, documentId);

    return NextResponse.json({ success: true, totals });
  } catch (err: any) {
    console.error("[api/items DELETE] Error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal error" },
      { status: 500 }
    );
  }
}
