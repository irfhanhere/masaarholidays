import { NextResponse } from "next/server";
import { createManualQuotationCore } from "@/lib/documents/service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await createManualQuotationCore(body);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error || "Failed to create quotation" }, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("[api/quotations] Error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
