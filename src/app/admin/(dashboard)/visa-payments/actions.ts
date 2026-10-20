"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function processVisaRefund(paymentId: string, amount: number, reason?: string) {
  if (!isSupabaseConfigured()) {
    return { success: true, message: "Demo mode: refund simulated successfully." };
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("visa_payments")
      .update({
        refund_status: "refunded",
        refund_amount: amount,
        refund_date: new Date().toISOString(),
        payment_status: "refunded",
        updated_at: new Date().toISOString(),
      })
      .eq("id", paymentId);

    if (error) throw error;

    revalidatePath("/admin/visa-payments");
    return { success: true };
  } catch (err: any) {
    console.error("[processVisaRefund] Error:", err);
    return { success: false, error: err.message || "Failed to process refund" };
  }
}
