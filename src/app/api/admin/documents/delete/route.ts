import { NextResponse } from "next/server";
import { deleteDocumentCore, deleteDocumentsCore } from "@/lib/documents/service";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (Array.isArray(body.ids) && body.ids.length > 0) {
      const result = await deleteDocumentsCore(body.ids);
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error || "Failed to delete documents" }, { status: 400 });
      }
      return NextResponse.json(result);
    }

    if (body.id) {
      const result = await deleteDocumentCore(body.id);
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
