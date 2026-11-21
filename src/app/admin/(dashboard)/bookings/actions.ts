"use server";

import { revalidatePath } from "next/cache";
import { convertQuotationToBooking } from "@/lib/data/bookings";
import { createAdminClient } from "@/lib/supabase/admin";

export async function convertQuotationAction(
  quotationId: string,
  staffName = "Admin"
): Promise<{ success: boolean; bookingId?: string; bookingReference?: string; error?: string }> {
  try {
    const result = await convertQuotationToBooking(quotationId, staffName);
    if (!result.success) {
      return { success: false, error: result.error || "Failed to convert quotation" };
    }
    revalidatePath("/admin/bookings");
    revalidatePath("/admin/quotations");
    revalidatePath(`/admin/documents/quotations/${quotationId}`);
    return result;
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to convert quotation" };
  }
}

export async function updateBookingStatusAction(
  bookingId: string,
  status: { booking_status?: string; payment_status?: string; fulfilment_status?: string; assigned_staff?: string }
) {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("bookings")
      .update({
        ...status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId);

    if (error) throw error;

    await (supabase as any).from("admin_audit_logs").insert({
      admin_email: "admin@masaarholidays.com",
      action: "update_booking_status",
      resource_type: "booking",
      resource_id: bookingId,
      details: status,
    });

    revalidatePath(`/admin/bookings/${bookingId}`);
    revalidatePath("/admin/bookings");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function addSupplierCostAction(params: {
  bookingId: string;
  supplierId?: string;
  serviceDescription: string;
  estimatedCost: number;
  actualCost: number;
  currency?: string;
  notes?: string;
}) {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("booking_supplier_costs").insert({
      booking_id: params.bookingId,
      supplier_id: params.supplierId || null,
      service_description: params.serviceDescription,
      estimated_cost: params.estimatedCost,
      actual_cost: params.actualCost,
      currency: params.currency || "AED",
      notes: params.notes || null,
    });

    if (error) throw error;

    revalidatePath(`/admin/bookings/${params.bookingId}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
