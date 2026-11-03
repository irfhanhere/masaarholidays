import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteOrigin } from "@/lib/site-url";
import { generateSecurePackageToken } from "@/lib/documents/secure-token";
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
  renderCustomerVisaPaymentConfirmedEmail,
  renderInternalPaidVisaApplicationEmail,
  type ApplicantDocReviewItem,
} from "./templates";
import type {
  VisaApplicationRow,
  VisaApplicantRow,
  VisaApplicationDocumentRow,
  VisaPaymentRow,
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
 *
 * Strictly adheres to Section 5 (Internal Operations Alert to care@masaarholidays.com)
 * and Section 6 (Customer Payment Confirmation) with per-application idempotency.
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

  const [applicantsRes, docsRes, paymentsRes] = await Promise.all([
    supabase
      .from("visa_applicants")
      .select("*")
      .eq("application_id", applicationId)
      .order("applicant_number", { ascending: true }),
    supabase
      .from("visa_application_documents")
      .select("*")
      .eq("application_id", applicationId)
      .order("created_at", { ascending: true }),
    supabase
      .from("visa_payments")
      .select("*")
      .eq("application_id", applicationId)
      .order("created_at", { ascending: false }),
  ]);

  const applicants: VisaApplicantRow[] = applicantsRes.data || [];
  const documents: VisaApplicationDocumentRow[] = docsRes.data || [];
  const payments: VisaPaymentRow[] = paymentsRes.data || [];

  const applicantNames = applicants.map((a) => a.full_name || "Applicant");
  if (applicantNames.length === 0) {
    applicantNames.push(application.primary_contact_name);
  }

  const trackingUrl = `${siteOrigin}/visa/application/${application.tracking_token}`;
  const adminUrl = `${siteOrigin}/admin/visa-applications`;

  // Generate 48-hour expiring secure token link for document review
  let secureDocumentsUrl: string | undefined = undefined;
  try {
    if (documents.length > 0) {
      const secureToken = generateSecurePackageToken(application.id, undefined, 48);
      secureDocumentsUrl = `${siteOrigin}/api/visa/secure-package?token=${secureToken}`;
    }
  } catch (tokenErr) {
    console.warn("[email-service] Failed to generate secure document package token:", tokenErr);
  }

  // Build applicant-wise document checklist
  const applicantDocItems: ApplicantDocReviewItem[] = applicants.map((appItem, idx) => {
    const docs = documents.filter(
      (d) => d.applicant_id === appItem.id || (!d.applicant_id && idx === 0)
    );
    return {
      applicantNumber: appItem.applicant_number || idx + 1,
      applicantName: appItem.full_name,
      passportNumber: appItem.passport_number,
      documents: docs.map((d) => ({
        documentType: d.document_type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        fileName: d.file_name,
        verificationStatus: (d.verification_status as "pending" | "verified" | "rejected") || "pending",
      })),
    };
  });

  // If no individual applicants rows exist, build single primary item
  if (applicantDocItems.length === 0) {
    applicantDocItems.push({
      applicantNumber: 1,
      applicantName: application.primary_contact_name,
      documents: documents.map((d) => ({
        documentType: d.document_type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        fileName: d.file_name,
        verificationStatus: (d.verification_status as "pending" | "verified" | "rejected") || "pending",
      })),
    });
  }

  const stripePaymentRef =
    application.stripe_payment_intent_id ||
    payments[0]?.transaction_reference ||
    application.stripe_session_id ||
    "Confirmed via Stripe Live";

  const paymentDateTime =
    new Date().toLocaleString("en-US", {
      timeZone: "Asia/Dubai",
      dateStyle: "medium",
      timeStyle: "short",
    }) + " GST";

  // A. Customer Payment Confirmation Email (Section 6)
  const custTpl = renderCustomerVisaPaymentConfirmedEmail({
    customerName: application.primary_contact_name,
    referenceNo: application.reference_no,
    productTitle: application.product_title,
    amountPaid: application.total_amount,
    currency: application.currency || "AED",
    applicantCount: application.applicant_count,
    trackingUrl,
  });

  await sendIdempotentEmail({
    to: application.primary_contact_email,
    subject: custTpl.subject,
    html: custTpl.html,
    idempotencyKey: `visa_cust_pay_confirm_${application.id}`,
    templateType: "visa_customer_payment_confirmed",
    referenceId: application.reference_no,
    serviceType: "visa",
    metadata: {
      applicationId: application.id,
      amount: application.total_amount,
      currency: application.currency || "AED",
      stripeRef: stripePaymentRef,
    },
  });

  // B. Internal Operations Notification Email (Section 5 -> care@masaarholidays.com)
  const opsTpl = renderInternalPaidVisaApplicationEmail({
    referenceNo: application.reference_no,
    paymentStatus: "Paid & Confirmed (Stripe Live)",
    amount: application.total_amount,
    currency: application.currency || "AED",
    stripePaymentRef,
    paymentDateTime,
    customerName: application.primary_contact_name,
    customerEmail: application.primary_contact_email,
    customerPhone: application.primary_contact_phone,
    applicantCount: application.applicant_count,
    applicantNames,
    applicantDocItems,
    adminUrl,
    secureDocumentsUrl,
    productTitle: application.product_title,
    visaSlug: application.visa_type_slug,
  });

  await sendIdempotentEmail({
    to: getStaffRecipientEmail(),
    subject: opsTpl.subject,
    html: opsTpl.html,
    idempotencyKey: `visa_internal_paid_ops_${application.id}`,
    templateType: "visa_internal_paid_ops",
    referenceId: application.reference_no,
    serviceType: "visa",
    metadata: {
      applicationId: application.id,
      amount: application.total_amount,
      currency: application.currency || "AED",
      stripeRef: stripePaymentRef,
    },
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
