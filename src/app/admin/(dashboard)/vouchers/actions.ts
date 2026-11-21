"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getNextDocumentNumber } from "@/lib/documents/numbering";

export async function createVoucherAction(formData: FormData) {
  try {
    const supabase = createAdminClient();
    const voucherType = formData.get("voucherType") as string;
    const clientName = formData.get("clientName") as string;
    const bookingReference = formData.get("bookingReference") as string;
    const clientPhone = (formData.get("clientPhone") as string) || "+971";
    const travelDate = (formData.get("travelDate") as string) || null;
    const returnDate = (formData.get("returnDate") as string) || null;
    const serviceTitle = formData.get("serviceTitle") as string;
    const serviceDetails = (formData.get("serviceDetails") as string) || "";
    const supplierConfirmation = (formData.get("supplierConfirmation") as string) || "";
    const notes = (formData.get("notes") as string) || "";

    if (!clientName || !bookingReference) {
      return { success: false, error: "Client name and booking reference are required." };
    }

    const docNumber = await getNextDocumentNumber("booking_voucher");

    const payload = {
      document_type: "booking_voucher" as const,
      document_number: docNumber,
      status: "confirmed",
      client_name: clientName.trim(),
      client_phone: clientPhone.trim(),
      booking_reference: bookingReference.trim(),
      travel_date: travelDate,
      return_date: returnDate,
      destination: serviceTitle.trim(),
      special_requirements: JSON.stringify({
        voucherType,
        supplierConfirmation,
        serviceDetails,
      }),
      notes: notes.trim() || undefined,
      terms: "Please present this voucher upon check-in or arrival. Masaar Holidays 24/7 Operations Support: +971 55 227 6299.",
      issue_date: new Date().toISOString().split("T")[0],
    };

    const { data, error } = await (supabase as any).from("documents").insert(payload).select("*").single();
    if (error) throw error;

    // Add item row
    await supabase.from("document_items").insert({
      document_id: data.id,
      item_type: voucherType === "hotel" ? "hotel" : voucherType === "flight" ? "flight" : "transfer",
      description: serviceTitle.trim(),
      details: `${serviceDetails} • Confirmation Ref: ${supplierConfirmation || "Confirmed"}`,
      quantity: 1,
      unit_price_aed: 0,
      discount_aed: 0,
      tax_aed: 0,
      amount_aed: 0,
      display_order: 1,
    });

    // Audit log
    await (supabase as any).from("admin_audit_logs").insert({
      admin_email: "admin@masaarholidays.com",
      action: "create_travel_voucher",
      resource_type: "booking_voucher",
      resource_id: data.id,
      details: { document_number: docNumber, booking_reference: bookingReference, voucher_type: voucherType },
    });

    revalidatePath("/admin/vouchers");
    revalidatePath("/admin/bookings");
    return { success: true, voucherId: data.id, voucherNumber: docNumber };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create voucher." };
  }
}
