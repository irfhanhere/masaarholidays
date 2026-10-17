import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendDocumentEmail, getStaffAlertEmails, isSmtpConfigured } from "@/lib/documents/mailer";
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

  // 1. Send Customer Confirmation Email
  if (booking.customer_email) {
    const customerHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Booking Confirmation - Masaar Holidays</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fbfbf9; color: #1a1a1a; margin: 0; padding: 30px 15px;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #eaeaea; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    
    <!-- Header -->
    <div style="background-color: #111111; color: #ffffff; padding: 28px 24px; text-align: center;">
      <h1 style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px; color: #d4af37;">MASAAR HOLIDAYS</h1>
      <p style="margin: 6px 0 0; font-size: 13px; color: #e5e5e5; letter-spacing: 0.2px;">Private Chauffeur &amp; Airport Transfer Confirmation</p>
    </div>

    <!-- Body Content -->
    <div style="padding: 30px 24px;">
      <h2 style="font-size: 18px; color: #111111; margin-top: 0;">Assalamu Alaikum ${booking.customer_name},</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #444444;">
        Thank you for choosing Masaar Holidays. Your payment has been received and your private transfer is now <strong>confirmed</strong>.
      </p>

      <!-- Booking Card -->
      <div style="background: #f8f8f6; border-left: 4px solid #d4af37; border-radius: 6px; padding: 18px; margin: 24px 0;">
        <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #888888; font-weight: bold;">Booking Reference</div>
        <div style="font-size: 20px; font-weight: bold; color: #111111; margin-top: 4px;">${booking.booking_ref}</div>
        <div style="font-size: 13px; color: #666666; margin-top: 6px;">Total Paid: <strong>${formattedAmount} ${booking.charge_currency}</strong> (AED ${booking.price_aed})</div>
      </div>

      <!-- Journey Summary Table -->
      <h3 style="font-size: 15px; border-bottom: 1px solid #eeeeee; padding-bottom: 8px; margin-top: 24px; color: #111111;">Journey Details</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 12px;">
        <tr>
          <td style="padding: 8px 0; color: #666666; width: 38%;">Route:</td>
          <td style="padding: 8px 0; font-weight: 600; color: #111111;">${booking.route_name}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666666;">Vehicle:</td>
          <td style="padding: 8px 0; font-weight: 600; color: #111111;">${booking.vehicle_name} (${booking.model_year || "2023–2026"})</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666666;">Travel Date:</td>
          <td style="padding: 8px 0; font-weight: 600; color: #111111;">${booking.travel_date}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666666;">Pickup Time:</td>
          <td style="padding: 8px 0; font-weight: 600; color: #111111;">${booking.pickup_time}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666666;">Party Size:</td>
          <td style="padding: 8px 0; color: #111111;">${booking.passengers} Passengers, ${booking.suitcases || "0"} Suitcases</td>
        </tr>
        ${booking.flight_number ? `
        <tr>
          <td style="padding: 8px 0; color: #666666;">Flight Number:</td>
          <td style="padding: 8px 0; font-weight: 600; color: #111111;">${booking.flight_number.toUpperCase()}</td>
        </tr>` : ""}
        <tr>
          <td style="padding: 8px 0; color: #666666;">Pickup Location:</td>
          <td style="padding: 8px 0; color: #111111;">${booking.pickup_location}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666666;">Drop-off Location:</td>
          <td style="padding: 8px 0; color: #111111;">${booking.dropoff_location}</td>
        </tr>
        ${booking.special_requests ? `
        <tr>
          <td style="padding: 8px 0; color: #666666;">Special Notes:</td>
          <td style="padding: 8px 0; font-style: italic; color: #111111;">${booking.special_requests}</td>
        </tr>` : ""}
      </table>

      <!-- Next Steps Notice -->
      <div style="background-color: #f0f7ff; border: 1px solid #d0e4ff; border-radius: 8px; padding: 16px; margin: 24px 0; font-size: 13px; color: #1a4f8b;">
        <strong>Chauffeur &amp; Airport Meet Notice:</strong><br>
        Our operations dispatch desk monitors live flight arrivals. Your assigned chauffeur's name and vehicle number will be sent to your WhatsApp (${booking.customer_phone}) prior to pickup. For airport arrivals, your driver will hold a name board at the arrival gate.
      </div>

      <!-- Action Button -->
      <div style="text-align: center; margin: 30px 0 10px;">
        <a href="${statusUrl}" style="background-color: #111111; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 13px; font-weight: bold; display: inline-block;">
          View Online Booking Summary &rarr;
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #fafafa; border-top: 1px solid #eeeeee; padding: 20px 24px; text-align: center; font-size: 12px; color: #777777;">
      <p style="margin: 0 0 4px;">24/7 Operations Desk: <a href="tel:+${CONTACT.whatsappPhoneIntl}" style="color: #111111; font-weight: bold; text-decoration: none;">${CONTACT.phoneDisplay}</a></p>
      <p style="margin: 0;">Masaar Holidays &bull; Licensed Umrah &amp; Hajj Tourism Operator &bull; Dubai, UAE</p>
    </div>
  </div>
</body>
</html>
    `;

    try {
      if (isSmtpConfigured()) {
        await sendDocumentEmail({
          to: booking.customer_email,
          subject: `Booking Confirmed: ${booking.route_name} Private Transfer (${booking.booking_ref})`,
          html: customerHtml,
        });
      }
    } catch (err) {
      console.error("Failed to send customer transfer booking confirmation email:", err);
    }
  }

  // 2. Send Staff Alert Email
  const staffRecipients = getStaffAlertEmails();
  const staffHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; padding: 20px; color: #222;">
  <div style="max-width: 600px; margin: auto; border: 1px solid #ccc; border-radius: 8px; padding: 20px;">
    <h2 style="color: #2e7d32; margin-top: 0;">&#10004; New Paid Transfer Booking</h2>
    <p>A customer has paid online via Stripe for a private transfer route.</p>

    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
      <tr><td style="padding: 6px 0; font-weight: bold;">Booking Ref:</td><td>${booking.booking_ref}</td></tr>
      <tr><td style="padding: 6px 0; font-weight: bold;">Customer:</td><td>${booking.customer_name} (${booking.customer_phone})</td></tr>
      <tr><td style="padding: 6px 0; font-weight: bold;">Email:</td><td>${booking.customer_email}</td></tr>
      <tr><td style="padding: 6px 0; font-weight: bold;">Route:</td><td>${booking.route_name}</td></tr>
      <tr><td style="padding: 6px 0; font-weight: bold;">Vehicle:</td><td>${booking.vehicle_name} (${booking.model_year || ""})</td></tr>
      <tr><td style="padding: 6px 0; font-weight: bold;">Travel Date & Time:</td><td>${booking.travel_date} at ${booking.pickup_time}</td></tr>
      <tr><td style="padding: 6px 0; font-weight: bold;">Party:</td><td>${booking.passengers} Pax, ${booking.suitcases} Luggage</td></tr>
      <tr><td style="padding: 6px 0; font-weight: bold;">Flight:</td><td>${booking.flight_number || "None"}</td></tr>
      <tr><td style="padding: 6px 0; font-weight: bold;">Pickup Location:</td><td>${booking.pickup_location}</td></tr>
      <tr><td style="padding: 6px 0; font-weight: bold;">Drop-off:</td><td>${booking.dropoff_location}</td></tr>
      <tr><td style="padding: 6px 0; font-weight: bold;">Amount Paid:</td><td>${formattedAmount} ${booking.charge_currency} (AED ${booking.price_aed})</td></tr>
      <tr><td style="padding: 6px 0; font-weight: bold;">Stripe Session:</td><td>${booking.stripe_session_id || "N/A"}</td></tr>
    </table>

    <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee;">
      <a href="${adminUrl}" style="background-color: #111; color: #fff; text-decoration: none; padding: 10px 18px; border-radius: 6px; font-weight: bold; font-size: 13px; display: inline-block;">
        Open Booking in Admin & Issue Voucher &rarr;
      </a>
    </div>
  </div>
</body>
</html>
  `;

  try {
    if (isSmtpConfigured() && staffRecipients.length > 0) {
      await sendDocumentEmail({
        to: staffRecipients,
        subject: `[New Paid Booking] ${booking.booking_ref} - ${booking.route_name} (${booking.customer_name})`,
        html: staffHtml,
      });
    }
  } catch (err) {
    console.error("Failed to send staff transfer booking alert email:", err);
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
