import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing document ID" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const [{ data: document }, { data: items }] = await Promise.all([
      supabase.from("documents").select("*").eq("id", id).single(),
      supabase
        .from("document_items")
        .select("*")
        .eq("document_id", id)
        .order("display_order", { ascending: true }),
    ]);

    if (!document) {
      return NextResponse.json(
        { success: false, error: "Document not found" },
        { status: 404 }
      );
    }

    const prefixMap: Record<string, string> = {
      quotation: "MH-QT",
      invoice: "MH-INV",
      receipt: "MH-RCT",
      booking_voucher: "MH-BKG",
    };
    const prefix = prefixMap[document.document_type] || "MH-DOC";
    const docNumber = `${prefix}-${Date.now().toString().slice(-6)}`;

    const {
      id: _id,
      document_number: _num,
      created_at: _ca,
      updated_at: _ua,
      status: _status,
      ...rest
    } = document;

    const { data: inserted, error: insertError } = await supabase
      .from("documents")
      .insert({ ...rest, document_number: docNumber, status: "draft" })
      .select("id")
      .single();

    if (insertError || !inserted) {
      return NextResponse.json(
        { success: false, error: insertError?.message || "Failed to duplicate document." },
        { status: 400 }
      );
    }

    if (items && items.length > 0) {
      const copies = items.map(
        ({ id: _itemId, document_id: _docId, created_at: _createdAt, ...itemRest }) => ({
          ...itemRest,
          document_id: inserted.id,
        })
      );
      await supabase.from("document_items").insert(copies);
    }

    return NextResponse.json({ success: true, id: inserted.id });
  } catch (err: any) {
    console.error("[api/documents/[id]/duplicate] Error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
