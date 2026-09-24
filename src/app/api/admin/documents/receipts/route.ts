import { NextResponse } from "next/server";
import { createManualReceiptCore } from "@/lib/documents/service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await createManualReceiptCore(body);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error || "Failed to create receipt" }, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[api/receipts] Error:", err);
    return NextResponse.json({ success: false, error: err?.message || "Internal server error" }, { status: 500 });
  }
}
