"use server";

import { revalidatePath } from "next/cache";
import { recordPaymentAndGenerateReceipt } from "@/lib/data/payments";

export async function recordPaymentAction(
  formData: FormData
): Promise<{ success: boolean; receiptId?: string; receiptNumber?: string; remainingBalance?: number; error?: string }> {
  try {
    const bookingId = (formData.get("bookingId") as string) || undefined;
    const invoiceId = (formData.get("invoiceId") as string) || undefined;
    const customerId = (formData.get("customerId") as string) || undefined;
    const amount = Number(formData.get("amount"));
    const paymentMethod = formData.get("paymentMethod") as any;
    const paymentDate = (formData.get("paymentDate") as string) || undefined;
    const transactionReference = (formData.get("transactionReference") as string) || undefined;
    const receivedBy = (formData.get("receivedBy") as string) || "Admin";
    const notes = (formData.get("notes") as string) || undefined;

    if (!amount || amount <= 0) {
      return { success: false, error: "Payment amount must be greater than zero." };
    }

    const result = await recordPaymentAndGenerateReceipt({
      bookingId,
      invoiceId,
      customerId,
      amount,
      paymentMethod,
      paymentDate,
      transactionReference,
      receivedBy,
      notes,
    });

    if (!result.success) {
      return result;
    }

    revalidatePath("/admin/payments");
    revalidatePath("/admin/receipts");
    revalidatePath("/admin/invoices");
    revalidatePath("/admin/bookings");
    return result;
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to record payment" };
  }
}
