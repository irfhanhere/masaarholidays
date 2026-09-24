import { NextResponse } from "next/server";
import { createManualBookingVoucherCore, createDocumentFromSourceCore } from "@/lib/documents/service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (body.source_id) {
      const result = await createDocumentFromSourceCore(body.source_id, "booking_voucher");
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error || "Failed to generate booking confirmation" }, { status: 400 });
      }
      return NextResponse.json(result);
    }

    const result = await createManualBookingVoucherCore(body);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error || "Failed to create booking voucher" }, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[api/booking-vouchers] Error:", err);
    return NextResponse.json({ success: false, error: err?.message || "Internal server error" }, { status: 500 });
  }
}
