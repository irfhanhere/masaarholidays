"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { refundTabbyPayment } from "@/lib/tabby";
import type { VisaPaymentRowShape } from "@/lib/types/database";

export async function processVisaRefund(paymentId: string, amount: number, reason?: string) {
  if (!isSupabaseConfigured()) {
    return { success: true, message: "Demo mode: refund simulated successfully." };
  }

  try {
    const supabase = createAdminClient();

    // 1. Fetch current payment record
    const { data: payment, error: fetchErr } = await supabase
      .from("visa_payments")
      .select("*")
      .eq("id", paymentId)
      .maybeSingle();

    if (fetchErr) {
      throw new Error(`Failed to fetch payment record: ${fetchErr.message}`);
    }

    let tabbyRefundId: string | null = null;

    // 2. If Tabby payment, trigger Tabby Refund API
    if (payment && payment.gateway === "tabby" && payment.tabby_payment_id) {
      const refundResult = await refundTabbyPayment(
        payment.tabby_payment_id,
        amount,
        reason || "Admin requested refund"
      );
      tabbyRefundId = refundResult.id;
    }

    // 3. Update payment record
    const updatePayload: Partial<VisaPaymentRowShape> = {
      refund_status: "refunded",
      refund_amount: amount,
      refund_date: new Date().toISOString(),
      payment_status: "refunded",
      updated_at: new Date().toISOString(),
    };

    if (tabbyRefundId) {
      updatePayload.tabby_refund_id = tabbyRefundId;
    }

    const { error: updateErr } = await supabase
      .from("visa_payments")
      .update(updatePayload)
      .eq("id", paymentId);

    if (updateErr) throw updateErr;

    // 4. Update parent application if linked
    if (payment?.application_id) {
      await supabase
        .from("visa_applications")
        .update({
          payment_status: "refunded",
          updated_at: new Date().toISOString(),
        })
        .eq("id", payment.application_id);
    }

    revalidatePath("/admin/visa-payments");
    return { success: true, tabbyRefundId };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to process refund";
    console.error("[processVisaRefund] Error:", err);
    return { success: false, error: msg };
  }
}
