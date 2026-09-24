import { NextResponse } from "next/server";
import { createManualInvoice } from "@/app/admin/(dashboard)/documents/actions";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await createManualInvoice(body);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error || "Failed to create invoice" }, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[api/invoices] Error:", err);
    return NextResponse.json({ success: false, error: err?.message || "Internal server error" }, { status: 500 });
  }
}
