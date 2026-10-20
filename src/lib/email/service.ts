import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteOrigin } from "@/lib/site-url";
import { sendIdempotentEmail, getStaffRecipientEmail } from "./client";
import {
  renderPaymentConfirmationEmail,
  renderVisaApplicationReceivedEmail,
  renderTransportBookingConfirmedEmail,
  renderEsimOrderConfirmedEmail,
  renderDocumentRequestEmail,
  renderStatusUpdateEmail,
  renderRefundConfirmedEmail,
  renderInternalOpsAlertEmail,
} from "./templates";
import type {
  VisaApplicationRow,
  VisaApplicantRow,
  TransferBookingRow,
} from "@/lib/types/database";

/**
 * High-level Transactional Email Service
 *
 * Dispatches customer and internal notifications triggered by verified
 * Stripe webhook events and administrative actions.
 */

/**
 * 1. Visa Payment & Application Submission Notifications
 */
export async function sendVisaPaymentAndSubmissionEmails(applicationId: string): Promise<void> {
  const supabase = createAdminClient();
  const siteOrigin = getSiteOrigin();

  const { data: application, error: appErr } = await supabase
    .from("visa_applications")
    .select("*")
    .eq("id", applicationId)
    .maybeSingle<VisaApplicationRow>();

  if (appErr || !application) {
    console.warn(`[email-service] Visa application not found: ${applicationId}`);
    return;
  }

  const { data: applicants } = await supabase
    .from("visa_applicants")
    .select("*")
    .eq("application_id", applicationId)
    .order("applicant_order", { ascending: true });

  const applicantNames = (applicants || []).map(
    (a: VisaApplicantRow) => a.full_name || "Applicant"
  );
  if (applicantNames.length === 0) {
    applicantNames.push(application.primary_contact_name);
  }

  const trackingUrl = `${siteOrigin}/visa/application/${application.tracking_token}`;
  const adminUrl = `${siteOrigin}/admin/visa-applications`;

  // A. Customer Payment Confirmation
  const paymentTpl = renderPaymentConfirmationEmail({
    customerName: application.primary_contact_name,
    serviceName: `${application.product_title} Visa Assistance`,
    referenceNo: application.reference_no,
    amountPaid: application.total_amount,
    currency: application.currency || "USD",
    paymentMethod: application.payment_method || "Card",
    trackingUrl,
    nextSteps:
      "Our visa specialists have received your application and will review all documents before filing with destination immigration authorities. You can track progress in real time using your reference number.",
  });

  await sendIdempotentEmail({
    to: application.primary_contact_email,
    subject: paymentTpl.subject,
    html: paymentTpl.html,
    idempotencyKey: `visa_pay_confirm_${application.id}`,
    templateType: "payment_confirmation",
    referenceId: application.reference_no,
    serviceType: "visa",
  });

  // B. Customer Visa Application Received
  const receiptTpl = renderVisaApplicationReceivedEmail({
    customerName: application.primary_contact_name,
    referenceNo: application.reference_no,
    visaType: application.product_title,
    applicantNames,
    trackingUrl,
    reviewTimeline: "3 to 5 working days",
  });

  await sendIdempotentEmail({
    to: application.primary_contact_email,
    subject: receiptTpl.subject,
    html: receiptTpl.html,
    idempotencyKey: `visa_app_received_${application.id}`,
    templateType: "visa_application_received",
    referenceId: application.reference_no,
    serviceType: "visa",
  });

  // C. Internal Ops Alert to Staff
  const opsTpl = renderInternalOpsAlertEmail({
    eventType: "New Paid Visa Application",
    referenceNo: application.reference_no,
    customerName: application.primary_contact_name,
    customerEmail: application.primary_contact_email,
    customerPhone: application.primary_contact_phone,
    serviceType: "Visa",
    amount: application.total_amount,
    currency: application.currency || "USD",
    adminUrl,
    extraDetails: {
      "Visa Package": application.product_title,
      "Travellers Count": String(application.applicant_count),
      "Destination": application.visa_type_slug.toUpperCase(),
    },
  });

  await sendIdempotentEmail({
    to: getStaffRecipientEmail(),
    subject: opsTpl.subject,
    html: opsTpl.html,
    idempotencyKey: `visa_ops_alert_${application.id}`,
    templateType: "internal_ops_alert",
    referenceId: application.reference_no,
    serviceType: "visa",
  });
}

/**
 * 2. Transport Booking Confirmation Notifications
 */
export async function sendTransportConfirmationEmails(bookingId: string): Promise<void> {
  const supabase = createAdminClient();
  const siteOrigin = getSiteOrigin();

  const { data: booking, error } = await supabase
    .from("transfer_bookings")
    .select("*")
    .eq("id", bookingId)
    .maybeSingle<TransferBookingRow>();

  if (error || !booking) {
    console.warn(`[email-service] Transfer booking not found: ${bookingId}`);
    return;
  }

  const voucherUrl = `${siteOrigin}/transfers/booking/success?token=${booking.public_token}`;
  const adminUrl = `${siteOrigin}/admin/transfers/bookings/${booking.id}`;
  const amountFormatted = (booking.charged_amount_minor / 100).toFixed(2);

  // A. Customer Booking Confirmation Email
  if (booking.customer_email) {
    const custTpl = renderTransportBookingConfirmedEmail({
      customerName: booking.customer_name,
      bookingRef: booking.booking_ref,
      routeName: booking.route_name,
      vehicleName: booking.vehicle_name,
      travelDate: booking.travel_date,
      pickupTime: booking.pickup_time,
      passengers: booking.passengers,
      pickupLocation: booking.pickup_location,
      dropoffLocation: booking.dropoff_location,
      amountPaid: amountFormatted,
      currency: booking.charge_currency,
      flightNumber: booking.flight_number,
      voucherUrl,
    });

    await sendIdempotentEmail({
      to: booking.customer_email,
      subject: custTpl.subject,
      html: custTpl.html,
      idempotencyKey: `trf_booking_confirm_${booking.id}`,
      templateType: "transport_booking_confirmed",
      referenceId: booking.booking_ref,
      serviceType: "transport",
    });
  }

  // B. Staff Operations Alert
  const opsTpl = renderInternalOpsAlertEmail({
    eventType: "New Paid Chauffeur Transfer Booking",
    referenceNo: booking.booking_ref,
    customerName: booking.customer_name,
    customerEmail: booking.customer_email,
    customerPhone: booking.customer_phone,
    serviceType: "Transport",
    amount: amountFormatted,
    currency: booking.charge_currency,
    adminUrl,
    extraDetails: {
      Route: booking.route_name,
      Vehicle: booking.vehicle_name,
      "Travel Date": `${booking.travel_date} at ${booking.pickup_time}`,
      Passengers: String(booking.passengers),
    },
  });

  await sendIdempotentEmail({
    to: getStaffRecipientEmail(),
    subject: opsTpl.subject,
    html: opsTpl.html,
    idempotencyKey: `trf_ops_alert_${booking.id}`,
    templateType: "internal_ops_alert",
    referenceId: booking.booking_ref,
    serviceType: "transport",
  });
}

/**
 * 3. Additional Document Request Notification
 */
export async function sendDocumentRequestNotification(params: {
  applicationId: string;
  requestedDocs: string[];
  notes?: string;
}): Promise<boolean> {
  const supabase = createAdminClient();
  const siteOrigin = getSiteOrigin();

  const { data: application } = await supabase
    .from("visa_applications")
    .select("*")
    .eq("id", params.applicationId)
    .maybeSingle<VisaApplicationRow>();

  if (!application) return false;

  const secureUploadUrl = `${siteOrigin}/visa/application/${application.tracking_token}`;
  const tpl = renderDocumentRequestEmail({
    customerName: application.primary_contact_name,
    referenceNo: application.reference_no,
    requestedDocs: params.requestedDocs,
    secureUploadUrl,
    notes: params.notes,
  });

  const res = await sendIdempotentEmail({
    to: application.primary_contact_email,
    subject: tpl.subject,
    html: tpl.html,
    idempotencyKey: `doc_req_${application.id}_${Date.now()}`,
    templateType: "doc_request",
    referenceId: application.reference_no,
    serviceType: "visa",
  });

  return res.success;
}

/**
 * 4. Application / Booking Status Update Notification
 */
export async function sendStatusUpdateNotification(params: {
  serviceType: "visa" | "transport" | "esim";
  referenceNo: string;
  customerName: string;
  customerEmail: string;
  serviceName: string;
  newStatus: string;
  statusNote?: string;
  trackingUrl: string;
}): Promise<boolean> {
  const tpl = renderStatusUpdateEmail({
    customerName: params.customerName,
    serviceName: params.serviceName,
    referenceNo: params.referenceNo,
    newStatus: params.newStatus,
    statusNote: params.statusNote,
    trackingUrl: params.trackingUrl,
  });

  const res = await sendIdempotentEmail({
    to: params.customerEmail,
    subject: tpl.subject,
    html: tpl.html,
    idempotencyKey: `status_${params.serviceType}_${params.referenceNo}_${params.newStatus.toLowerCase().replace(/\s+/g, "_")}`,
    templateType: "status_update",
    referenceId: params.referenceNo,
    serviceType: params.serviceType,
  });

  return res.success;
}

/**
 * 5. Refund Notification
 */
export async function sendRefundNotification(params: {
  serviceType: "visa" | "transport" | "esim";
  referenceNo: string;
  customerName: string;
  customerEmail: string;
  serviceName: string;
  refundAmount: number | string;
  currency: string;
  reason?: string;
}): Promise<boolean> {
  const tpl = renderRefundConfirmedEmail({
    customerName: params.customerName,
    serviceName: params.serviceName,
    referenceNo: params.referenceNo,
    refundAmount: params.refundAmount,
    currency: params.currency,
    reason: params.reason,
  });

  const res = await sendIdempotentEmail({
    to: params.customerEmail,
    subject: tpl.subject,
    html: tpl.html,
    idempotencyKey: `refund_${params.serviceType}_${params.referenceNo}`,
    templateType: "refund_confirmed",
    referenceId: params.referenceNo,
    serviceType: params.serviceType,
  });

  return res.success;
}
