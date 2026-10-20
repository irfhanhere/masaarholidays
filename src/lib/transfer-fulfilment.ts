import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendDocumentEmail, getStaffAlertEmails, isSmtpConfigured } from "@/lib/documents/mailer";
import { sendTransportConfirmationEmails } from "@/lib/email/service";
import { getSiteOrigin } from "@/lib/site-url";
import { CONTACT } from "@/lib/contact";
import type { TransferBookingRow } from "@/lib/types/database";
import type { TransferVoucherData } from "@/components/documents/GranularVoucherDocumentView";

/**
 * Marks transfer booking as paid and dispatches customer and staff confirmation emails.
 * Called automatically from the Stripe webhook after payment confirmation.
 */
export async function fulfilTransferBooking(bookingId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  // Atomically claim and update status to 'paid' and 'confirmed'
  const { data: booking, error: updateErr } = await supabase
    .from("transfer_bookings")
    .update({
      payment_status: "paid",
      booking_status: "confirmed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId)
    .select("*")
    .single<TransferBookingRow>();

  if (updateErr || !booking) {
    console.error("Failed to update transfer booking status:", updateErr?.message);
    return { success: false, error: updateErr?.message || "Booking not found" };
  }

  const siteOrigin = getSiteOrigin();
  const formattedAmount = (booking.charged_amount_minor / 100).toFixed(2);
  const statusUrl = `${siteOrigin}/transfers/booking/success?token=${booking.public_token}`;
  const adminUrl = `${siteOrigin}/admin/transfers/bookings/${booking.id}`;

  // 1. Send Customer and Staff Confirmation Emails idempotently
  try {
    await sendTransportConfirmationEmails(booking.id);
  } catch (emailErr) {
    console.error("Failed to dispatch transfer confirmation emails:", emailErr);
  }

  return { success: true };
}

/**
 * Generates an official Booking Voucher in the documents system from an existing transfer booking.
 * Pre-fills vehicle, passenger, luggage, pickup, and flight details into the voucher document.
 */
export async function issueTransferVoucher(bookingId: string): Promise<{ success: boolean; documentId?: string; voucherNumber?: string; error?: string }> {
  const supabase = createAdminClient();

  const { data: booking, error: fetchErr } = await supabase
    .from("transfer_bookings")
    .select("*")
    .eq("id", bookingId)
    .single<TransferBookingRow>();

  if (fetchErr || !booking) {
    return { success: false, error: "Transfer booking not found." };
  }

  // If already issued, return existing voucher ID
  if (booking.voucher_document_id && booking.voucher_number) {
    return {
      success: true,
      documentId: booking.voucher_document_id,
      voucherNumber: booking.voucher_number,
    };
  }

  // 1. Generate new voucher document number (e.g. BV-2026-001)
  const { data: numberResult, error: numberError } = await (supabase.rpc as any)(
    "generate_document_number",
    { p_document_type: "booking_voucher" }
  );

  const voucherNumber =
    !numberError && numberResult
      ? (numberResult as string)
      : `BV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  // 2. Fetch default template if available
  const { data: template } = await supabase
    .from("document_templates")
    .select("id")
    .eq("document_type", "booking_voucher")
    .eq("is_default", true)
    .maybeSingle();

  // 3. Create document record
  const { data: doc, error: docError } = await supabase
    .from("documents")
    .insert({
      document_type: "booking_voucher",
      document_number: voucherNumber,
      client_name: booking.customer_name,
      client_email: booking.customer_email,
      client_phone: booking.customer_phone,
      booking_reference: booking.booking_ref,
      status: "issued",
      issue_date: new Date().toISOString().split("T")[0],
      subtotal_aed: Number(booking.price_aed),
      discount_aed: 0,
      tax_aed: 0,
      total_aed: Number(booking.price_aed),
      amount_paid_aed: Number(booking.price_aed),
      template_id: template?.id || null,
      notes: booking.special_requests || "Private air-conditioned transfer with professional chauffeur.",
    })
    .select("id")
    .single();

  if (docError || !doc) {
    return { success: false, error: docError?.message || "Failed to create voucher document." };
  }

  // 4. Construct TransferVoucherData for document item details
  const voucherData: TransferVoucherData = {
    bookingReference: booking.booking_ref,
    guestName: booking.customer_name,
    vehicleType: `${booking.vehicle_name} (${booking.model_year || "2023–2026"})`,
    route: `${booking.pickup_location} → ${booking.dropoff_location}`,
    pickupDateTime: `${booking.travel_date} at ${booking.pickup_time}`,
    dropOffLocation: booking.dropoff_location,
    flightNo: booking.flight_number || undefined,
    driverContact: `Operations Desk: ${CONTACT.phoneDisplay}`,
    confirmationNo: voucherNumber,
    specialRequests: booking.special_requests || undefined,
    voucherNotes: `Please present this voucher along with valid ID to your private chauffeur upon arrival. Contact 24/7 Dispatch Desk at ${CONTACT.phoneDisplay} for live assistance.`,
  };

  // 5. Insert item into document_items
  await supabase.from("document_items").insert({
    document_id: doc.id,
    item_type: "transfer",
    description: `Private Transfer: ${booking.route_name}`,
    details: JSON.stringify(voucherData),
    quantity: 1,
    unit_price_aed: Number(booking.price_aed),
    discount_aed: 0,
    tax_aed: 0,
    amount_aed: Number(booking.price_aed),
    display_order: 1,
  });

  // 6. Link voucher back to transfer_bookings
  await supabase
    .from("transfer_bookings")
    .update({
      voucher_document_id: doc.id,
      voucher_number: voucherNumber,
      booking_status: "voucher_issued",
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId);

  return {
    success: true,
    documentId: doc.id,
    voucherNumber,
  };
}
