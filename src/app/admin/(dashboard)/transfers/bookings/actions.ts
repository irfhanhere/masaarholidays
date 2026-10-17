"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { issueTransferVoucher } from "@/lib/transfer-fulfilment";

export async function triggerIssueVoucher(bookingId: string) {
  try {
    const res = await issueTransferVoucher(bookingId);
    if (!res.success) {
      return { success: false, error: res.error || "Failed to generate voucher." };
    }

    revalidatePath("/admin/transfers/bookings");
    revalidatePath(`/admin/transfers/bookings/${bookingId}`);
    revalidatePath("/admin/documents/booking-vouchers");

    return {
      success: true,
      documentId: res.documentId,
      voucherNumber: res.voucherNumber,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error issuing voucher";
    return { success: false, error: msg };
  }
}

export async function updateTransferBookingStatus(
  bookingId: string,
  bookingStatus: "pending" | "confirmed" | "voucher_issued" | "completed" | "cancelled"
) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("transfer_bookings")
    .update({
      booking_status: bookingStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/transfers/bookings");
  revalidatePath(`/admin/transfers/bookings/${bookingId}`);
  return { success: true };
}
