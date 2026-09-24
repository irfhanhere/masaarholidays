import { NextResponse } from "next/server";
import { deleteDocument, deleteDocuments } from "@/app/admin/(dashboard)/documents/actions";
import type { DocumentType } from "@/lib/types/database";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const documentType: DocumentType = body.document_type || "invoice";

    if (Array.isArray(body.ids) && body.ids.length > 0) {
      const result = await deleteDocuments(body.ids, documentType);
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error || "Failed to delete documents" }, { status: 400 });
      }
      return NextResponse.json(result);
    }

    if (body.id) {
      const result = await deleteDocument(body.id, documentType);
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error || "Failed to delete document" }, { status: 400 });
      }
      return NextResponse.json(result);
    }

    return NextResponse.json({ success: false, error: "Missing document id or ids" }, { status: 400 });
  } catch (err: any) {
    console.error("[api/documents/delete] Error:", err);
    return NextResponse.json({ success: false, error: err?.message || "Internal server error" }, { status: 500 });
  }
}
