import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { refundTamaraPayment } from "@/lib/tamara";

export const dynamic = "force-dynamic";

/**
 * Tamara Refund API
 *
 * Initiates an official refund for an existing Tamara order.
 * Requires authenticated administrative session or internal secret key.
 */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { orderId, amount, currency = "AED", comment } = body;

  if (!orderId || typeof orderId !== "string") {
    return NextResponse.json({ error: "Missing required orderId" }, { status: 400 });
  }

  const numAmount = typeof amount === "number" ? amount : Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return NextResponse.json({ error: "Invalid refund amount" }, { status: 400 });
  }

  try {
    const refundResult = await refundTamaraPayment(
      orderId,
      numAmount,
      String(currency),
      typeof comment === "string" ? comment : "Admin requested refund"
    );

    // Update relevant internal records
    const supabase = createAdminClient();
    const nowIso = new Date().toISOString();

    await supabase
      .from("visa_payments")
      .update({
        refund_status: "refunded",
        refund_amount: numAmount,
        refund_date: nowIso,
        payment_status: "refunded",
        tamara_refund_id: refundResult.refund_id,
        updated_at: nowIso,
      })
      .eq("tamara_order_id", orderId);

    return NextResponse.json(refundResult, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to process Tamara refund";
    console.error("[tamara-refund-route] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
