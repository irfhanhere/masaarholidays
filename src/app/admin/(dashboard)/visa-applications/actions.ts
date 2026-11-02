"use server";

async function safeRevalidatePath(path: string) {
  try {
    const { revalidatePath } = await import("next/cache");
    revalidatePath(path);
  } catch {
    // ignore outside Next.js request context
  }
}

async function getAdminUser() {
  if (process.env.NODE_ENV !== "production" && process.env.ALLOW_DEV_AUTH_BYPASS === "true") {
    return {
      isAdmin: true,
      user: { id: "00000000-0000-0000-0000-000000000000", email: "admin@masaarholidays.com" },
    };
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (!error && user) {
      return { isAdmin: true, user };
    }
  } catch {
    // outside request context or cookies unavailable
  }

  return { isAdmin: false, user: null };
}

import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getPrivateDocumentSignedUrl } from "@/lib/documents/private-storage";
import type { ZipEntry } from "@/lib/documents/simple-zip";
import type { VisaApplicationStatus } from "@/lib/types/database";

export async function updateVisaApplicationStatus(
  applicationId: string,
  newStatus: string,
  notes?: string
) {
  if (!isSupabaseConfigured()) {
    return { success: true, message: "Demo mode: status updated." };
  }

  try {
    const supabase = createAdminClient();

    // Fetch existing timeline
    const { data: current } = await supabase
      .from("visa_applications")
      .select("status_timeline")
      .eq("id", applicationId)
      .maybeSingle();

    const existingTimeline = (current?.status_timeline as any[]) || [];
    const updatedTimeline = [
      ...existingTimeline,
      {
        step: newStatus,
        status: "completed" as const,
        timestamp: new Date().toISOString(),
        note: notes || `Status changed to ${newStatus}`,
      },
    ];

    const { error } = await supabase
      .from("visa_applications")
      .update({
        application_status: newStatus as VisaApplicationStatus,
        status_timeline: updatedTimeline,
        internal_notes: notes || undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId);

    if (error) throw error;

    // Trigger customer notification for meaningful status updates
    try {
      const { data: appRow } = await supabase
        .from("visa_applications")
        .select("reference_no, primary_contact_name, primary_contact_email, product_title, tracking_token")
        .eq("id", applicationId)
        .maybeSingle();

      if (appRow) {
        const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL || "https://www.masaarholidays.com";
        const trackingUrl = `${siteOrigin}/visa/application/${appRow.tracking_token}`;

        if (newStatus === "documents_required") {
          const { sendDocumentRequestNotification } = await import("@/lib/email/service");
          await sendDocumentRequestNotification({
            applicationId,
            requestedDocs: [notes || "Additional verification documents"],
            notes: notes || undefined,
          });
        } else {
          const { sendStatusUpdateNotification } = await import("@/lib/email/service");
          await sendStatusUpdateNotification({
            serviceType: "visa",
            referenceNo: appRow.reference_no,
            customerName: appRow.primary_contact_name,
            customerEmail: appRow.primary_contact_email,
            serviceName: `${appRow.product_title} Visa`,
            newStatus: newStatus.replace(/_/g, " ").toUpperCase(),
            statusNote: notes || undefined,
            trackingUrl,
          });
        }
      }
    } catch (notifErr) {
      console.warn("[updateVisaApplicationStatus] Status notification dispatch note:", notifErr);
    }

    await safeRevalidatePath("/admin/visa-applications");
    return { success: true };
  } catch (err: any) {
    console.error("[updateVisaApplicationStatus] Error:", err);
    return { success: false, error: err.message };
  }
}

export async function retryVisaNotificationAction(applicationId: string) {
  try {
    const { sendVisaPaymentAndSubmissionEmails } = await import("@/lib/email/service");
    await sendVisaPaymentAndSubmissionEmails(applicationId);
    await safeRevalidatePath("/admin/visa-applications");
    return { success: true };
  } catch (err: any) {
    console.error("[retryVisaNotificationAction] Error:", err);
    return { success: false, error: err.message || "Failed to retry notification" };
  }
}

export async function getVisaNotificationLogsAction(referenceNo: string) {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("email_notifications")
      .select("*")
      .eq("reference_id", referenceNo)
      .order("created_at", { ascending: false });

    if (error) return { success: false, error: error.message };
    return { success: true, notifications: data || [] };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function saveInternalNotesAction(applicationId: string, internalNotes: string) {
  if (!isSupabaseConfigured()) {
    return { success: true, message: "Demo mode: notes saved." };
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("visa_applications")
      .update({
        internal_notes: internalNotes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId);

    if (error) throw error;
    await safeRevalidatePath("/admin/visa-applications");
    return { success: true };
  } catch (err: any) {
    console.error("[saveInternalNotesAction] Error:", err);
    return { success: false, error: err.message };
  }
}

export async function requestMissingDocumentsAction(
  applicationId: string,
  requestedDocsNote: string
) {
  if (!isSupabaseConfigured()) {
    return { success: true, message: "Demo mode: missing documents requested." };
  }

  return updateVisaApplicationStatus(
    applicationId,
    "documents_required",
    requestedDocsNote || "Additional or clearer documents required for submission."
  );
}

export async function getApplicationDetailsAction(applicationId: string) {
  if (!isSupabaseConfigured()) {
    return {
      success: true,
      application: null,
      applicants: [],
      documents: [],
      payments: [],
      timeline: [],
      auditLogs: [],
      emailNotifications: [],
      internal_notes: "",
    };
  }

  try {
    const supabase = createAdminClient();

    const [appRes, applicantsRes, docsRes, paymentsRes] = await Promise.all([
      supabase.from("visa_applications").select("*").eq("id", applicationId).maybeSingle(),
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

    if (appRes.error) throw appRes.error;

    // Fetch related audit logs & email records
    let auditLogs: any[] = [];
    let emailNotifications: any[] = [];

    try {
      const { data: logs } = await supabase
        .from("admin_audit_logs")
        .select("*")
        .or(`resource_id.eq.${applicationId},details->>applicationId.eq.${applicationId}`)
        .order("created_at", { ascending: false })
        .limit(30);
      if (logs) auditLogs = logs;
    } catch {
      // ignore
    }

    try {
      if (appRes.data?.reference_no) {
        const { data: emails } = await supabase
          .from("email_notifications")
          .select("*")
          .or(`reference_id.eq.${appRes.data.reference_no},metadata->>applicationId.eq.${applicationId}`)
          .order("created_at", { ascending: false })
          .limit(20);
        if (emails) emailNotifications = emails;
      }
    } catch {
      // ignore
    }

    return {
      success: true,
      application: appRes.data,
      applicants: applicantsRes.data || [],
      documents: docsRes.data || [],
      payments: paymentsRes.data || [],
      timeline: (appRes.data?.status_timeline as any[]) || [],
      auditLogs,
      emailNotifications,
      internal_notes: appRes.data?.internal_notes || "",
    };
  } catch (err: any) {
    console.error("[getApplicationDetailsAction] Error:", err);
    return { success: false, error: err.message };
  }
}

export async function getDocumentSignedUrlAction(
  filePath: string,
  documentId?: string,
  applicationId?: string
) {
  try {
    const { isAdmin, user } = await getAdminUser();
    if (!isAdmin) {
      return { success: false, error: "Unauthorized. Admin credentials required." };
    }

    const { isSafeStoragePath } = await import("@/lib/documents/private-storage");
    if (!isSafeStoragePath(filePath)) {
      return { success: false, error: "Invalid or unsafe document file path." };
    }

    const { signedUrl, error } = await getPrivateDocumentSignedUrl(filePath, 900); // 15 minutes link
    if (error || !signedUrl) {
      return { success: false, error: error || "Failed to generate signed document URL" };
    }

    // Log document preview in audit log
    const { logAdminAction } = await import("@/lib/audit-logger");
    await logAdminAction({
      adminEmail: user?.email || "admin@masaarholidays.com",
      adminUserId: user?.id || null,
      action: "visa.document.preview",
      resourceType: "visa_application_document",
      resourceId: documentId || null,
      details: {
        applicationId: applicationId || null,
        filePath,
      },
    });

    return { success: true, url: signedUrl };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to generate signed document URL" };
  }
}

export async function updateDocumentVerificationStatusAction(
  documentId: string,
  applicationId: string,
  status: "verified" | "rejected" | "pending",
  rejectionReason?: string
) {
  try {
    const { isAdmin, user } = await getAdminUser();
    if (!isAdmin) {
      return { success: false, error: "Unauthorized. Admin credentials required." };
    }

    const supabase = createAdminClient();

    // Prevent marking verified if document does not exist
    const { data: existingDoc, error: docFetchErr } = await supabase
      .from("visa_application_documents")
      .select("id, file_path, file_name")
      .eq("id", documentId)
      .eq("application_id", applicationId)
      .maybeSingle();

    if (docFetchErr || !existingDoc) {
      return { success: false, error: "Cannot update document: Document record does not exist." };
    }

    if (status === "verified" && (!existingDoc.file_path || existingDoc.file_path.trim().length === 0)) {
      return { success: false, error: "Cannot verify document: No file is attached to this document record." };
    }

    const { error: updateErr } = await supabase
      .from("visa_application_documents")
      .update({
        verification_status: status,
        rejection_reason: rejectionReason || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", documentId)
      .eq("application_id", applicationId);

    if (updateErr) throw updateErr;

    const { logAdminAction } = await import("@/lib/audit-logger");
    await logAdminAction({
      adminEmail: user?.email || "admin@masaarholidays.com",
      adminUserId: user?.id || null,
      action: `visa.document.verify_${status}`,
      resourceType: "visa_application_document",
      resourceId: documentId,
      details: {
        applicationId,
        status,
        rejectionReason: rejectionReason || null,
      },
    });

    await safeRevalidatePath("/admin/visa-applications");
    return { success: true };
  } catch (err: any) {
    console.error("[updateDocumentVerificationStatusAction] Error:", err);
    return { success: false, error: err.message || "Failed to update verification status" };
  }
}

export async function recordVisaRefundAction(
  applicationId: string,
  refundAmount: number,
  reason: string
) {
  try {
    const { isAdmin, user } = await getAdminUser();
    if (!isAdmin) {
      return { success: false, error: "Unauthorized. Admin credentials required." };
    }

    const supabase = createAdminClient();
    const { data: application, error: appErr } = await supabase
      .from("visa_applications")
      .select("*")
      .eq("id", applicationId)
      .single();

    if (appErr || !application) {
      return { success: false, error: "Application not found" };
    }

    let gatewayRefundId: string | null = null;

    // If application was paid through Stripe and has a payment intent, trigger Stripe refund
    if (application.payment_gateway === "stripe" && application.stripe_payment_intent_id) {
      try {
        const { getStripe } = await import("@/lib/stripe");
        const stripe = getStripe();
        const refund = await stripe.refunds.create({
          payment_intent: application.stripe_payment_intent_id,
          amount: Math.round(refundAmount * 100),
          reason: "requested_by_customer",
          metadata: {
            application_id: applicationId,
            reference_no: application.reference_no,
            admin_reason: reason,
          },
        });
        gatewayRefundId = refund.id;
      } catch (stripeErr: any) {
        console.warn("[recordVisaRefundAction] Stripe refund notice:", stripeErr.message);
      }
    }

    // Update application status
    await supabase
      .from("visa_applications")
      .update({
        payment_status: "refunded",
        internal_notes: `Refund of AED ${refundAmount.toFixed(2)} recorded by admin. Reason: ${reason}. ${application.internal_notes || ""}`.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId);

    // Record refund in visa_payments ledger
    await supabase.from("visa_payments").insert({
      application_id: applicationId,
      transaction_reference: gatewayRefundId || `manual_refund_${Date.now()}`,
      amount: refundAmount,
      currency: application.currency || "AED",
      payment_method: application.payment_method || "card",
      payment_status: "refunded",
      gateway: application.payment_gateway || "stripe",
      refund_status: "refunded",
      refund_amount: refundAmount,
      refund_date: new Date().toISOString(),
      idempotency_key: `refund_${applicationId}_${Date.now()}`,
    });

    // Send customer refund notification email
    try {
      const { sendRefundNotification } = await import("@/lib/email/service");
      await sendRefundNotification({
        serviceType: "visa",
        referenceNo: application.reference_no,
        customerName: application.primary_contact_name,
        customerEmail: application.primary_contact_email,
        serviceName: `${application.product_title} Visa`,
        refundAmount,
        currency: application.currency || "AED",
      });
    } catch (emailErr) {
      console.warn("[recordVisaRefundAction] Email notification note:", emailErr);
    }

    // Audit log
    const { logAdminAction } = await import("@/lib/audit-logger");
    await logAdminAction({
      adminEmail: user?.email || "admin@masaarholidays.com",
      adminUserId: user?.id || null,
      action: "visa.application.refund",
      resourceType: "visa_application",
      resourceId: applicationId,
      details: {
        referenceNo: application.reference_no,
        refundAmount,
        reason,
        gatewayRefundId,
      },
    });

    await safeRevalidatePath("/admin/visa-applications");
    return { success: true };
  } catch (err: any) {
    console.error("[recordVisaRefundAction] Error:", err);
    return { success: false, error: err.message || "Failed to process refund" };
  }
}

export async function exportVisaApplicationsCsvAction(): Promise<{ success: boolean; csv?: string; error?: string }> {
  try {
    const supabase = createAdminClient();
    const { data: apps, error } = await supabase
      .from("visa_applications")
      .select("reference_no, product_title, applicant_count, primary_contact_name, primary_contact_email, primary_contact_phone, nationality, total_amount, currency, payment_status, application_status, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const headers = [
      "Reference No",
      "Product",
      "Applicants",
      "Primary Contact",
      "Email",
      "Phone",
      "Nationality",
      "Total Amount",
      "Currency",
      "Payment Status",
      "Application Status",
      "Date",
    ];

    const rows = (apps || []).map((a) => [
      `"${a.reference_no}"`,
      `"${a.product_title.replace(/"/g, '""')}"`,
      a.applicant_count,
      `"${a.primary_contact_name.replace(/"/g, '""')}"`,
      `"${a.primary_contact_email}"`,
      `"${a.primary_contact_phone}"`,
      `"${a.nationality}"`,
      a.total_amount,
      `"${a.currency}"`,
      `"${a.payment_status}"`,
      `"${a.application_status}"`,
      `"${a.created_at}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    return { success: true, csv: csvContent };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to export applications" };
  }
}

export async function getDefaultVisaOperationsEmailAction(): Promise<string> {
  if (process.env.VISA_OPERATIONS_EMAIL && process.env.VISA_OPERATIONS_EMAIL.trim()) {
    return process.env.VISA_OPERATIONS_EMAIL.trim();
  }
  const { getStaffRecipientEmail } = await import("@/lib/email/client");
  return getStaffRecipientEmail();
}

export interface SendVisaDocumentsEmailParams {
  applicationId: string;
  recipient: string;
  cc?: string;
  deliveryMethod: "attachment" | "link";
  selectedDocIds: string[];
  customNotes?: string;
}

export async function sendVisaDocumentsEmailAction(params: SendVisaDocumentsEmailParams): Promise<{
  success: boolean;
  messageId?: string;
  recipient?: string;
  deliveryMethod?: "attachment" | "link";
  timestamp?: string;
  error?: string;
}> {
  const timestamp = new Date().toISOString();

  try {
    const { isAdmin, user } = await getAdminUser();
    if (!isAdmin) {
      return { success: false, error: "Unauthorized. Admin credentials required." };
    }

    const adminEmail = user?.email || "admin@masaarholidays.com";

    // Validate recipient email
    const recipient = params.recipient.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!recipient || !emailRegex.test(recipient)) {
      return { success: false, error: "Invalid recipient email address format." };
    }

    if (params.cc && params.cc.trim()) {
      const ccEmails = params.cc.split(",").map((e) => e.trim()).filter(Boolean);
      for (const cc of ccEmails) {
        if (!emailRegex.test(cc)) {
          return { success: false, error: `Invalid CC email address format: "${cc}"` };
        }
      }
    }

    const supabase = createAdminClient();

    // Fetch application details
    const { data: app, error: appErr } = await supabase
      .from("visa_applications")
      .select("*")
      .eq("id", params.applicationId)
      .maybeSingle();

    if (appErr || !app) {
      return { success: false, error: "Application not found." };
    }

    // Fetch applicants
    const { data: applicants } = await supabase
      .from("visa_applicants")
      .select("id, full_name, applicant_number")
      .eq("application_id", params.applicationId);

    const applicantMap = new Map<string, string>();
    (applicants || []).forEach((a) => {
      applicantMap.set(a.id, a.full_name);
    });

    // Fetch documents
    let docsQuery = supabase
      .from("visa_application_documents")
      .select("*")
      .eq("application_id", params.applicationId);

    if (params.selectedDocIds && params.selectedDocIds.length > 0) {
      docsQuery = docsQuery.in("id", params.selectedDocIds);
    }

    const { data: docs, error: docsErr } = await docsQuery.order("created_at", { ascending: true });

    if (docsErr || !docs || docs.length === 0) {
      return { success: false, error: "No documents found or selected for delivery." };
    }

    const { logAdminAction } = await import("@/lib/audit-logger");
    const { downloadPrivateDocument, isSafeStoragePath } = await import("@/lib/documents/private-storage");
    const { createZipArchive } = await import("@/lib/documents/simple-zip");
    const { generateSecurePackageToken } = await import("@/lib/documents/secure-token");
    const { sendEmail } = await import("@/lib/email/client");
    const { getSiteOrigin } = await import("@/lib/site-url");

    const siteOrigin = getSiteOrigin();

    // Log email send attempt
    await logAdminAction({
      adminEmail,
      adminUserId: user?.id || null,
      action: "visa.documents.email_attempt",
      resourceType: "visa_application",
      resourceId: app.id,
      details: {
        referenceNo: app.reference_no,
        recipient,
        deliveryMethod: params.deliveryMethod,
        documentCount: docs.length,
      },
    });

    let attachments: Array<{ filename: string; content: Buffer; contentType?: string }> | undefined = undefined;
    let secureDownloadUrl: string | null = null;
    let totalSizeBytes = 0;

    // Build document list for email
    const docListSummary = docs.map((doc, idx) => {
      const applicantName =
        (doc.applicant_id ? applicantMap.get(doc.applicant_id) : null) ||
        app.primary_contact_name ||
        `Applicant ${idx + 1}`;
      totalSizeBytes += doc.file_size || 0;
      return {
        name: doc.file_name,
        type: doc.document_type,
        applicant: applicantName,
        sizeKb: ((doc.file_size || 0) / 1024).toFixed(0),
      };
    });

    if (params.deliveryMethod === "attachment") {
      const zipEntries: ZipEntry[] = [];
      const usedFilenames = new Set<string>();

      for (let i = 0; i < docs.length; i++) {
        const doc = docs[i];
        if (!isSafeStoragePath(doc.file_path)) continue;

        const { buffer } = await downloadPrivateDocument(doc.file_path);
        if (!buffer) continue;

        const applicantName =
          (doc.applicant_id ? applicantMap.get(doc.applicant_id) : null) ||
          app.primary_contact_name ||
          `Applicant_${i + 1}`;

        const cleanName = applicantName.replace(/[^a-zA-Z0-9_-]/g, "_");
        const cleanDocType = doc.document_type.replace(/[^a-zA-Z0-9_-]/g, "_");
        const originalExt = doc.file_name.split(".").pop() || "bin";

        let zipFileName = `${cleanName}_${cleanDocType}.${originalExt}`;
        let counter = 1;
        while (usedFilenames.has(zipFileName)) {
          zipFileName = `${cleanName}_${cleanDocType}_${counter}.${originalExt}`;
          counter++;
        }
        usedFilenames.add(zipFileName);

        zipEntries.push({
          filename: zipFileName,
          data: buffer,
        });
      }

      if (zipEntries.length === 0) {
        return { success: false, error: "Failed to download document binaries from storage." };
      }

      const zipBuffer = createZipArchive(zipEntries);
      const zipSizeMb = zipBuffer.length / (1024 * 1024);

      if (zipSizeMb > 15) {
        return {
          success: false,
          error: `The compiled documents ZIP (${zipSizeMb.toFixed(1)} MB) exceeds the safe email attachment limit of 15 MB. Please select 'Secure download link' delivery method instead.`,
        };
      }

      attachments = [
        {
          filename: `${app.reference_no}_documents.zip`,
          content: zipBuffer,
          contentType: "application/zip",
        },
      ];
    } else {
      // Secure download link
      const token = generateSecurePackageToken(
        app.id,
        params.selectedDocIds && params.selectedDocIds.length > 0 ? params.selectedDocIds : undefined,
        48 // 48 hours expiry
      );
      secureDownloadUrl = `${siteOrigin}/api/visa/secure-package?token=${token}`;
    }

    // Render professional HTML email
    const emailSubject = `[Masaar Holidays] Visa Application Documents — ${app.reference_no} (${app.primary_contact_name})`;
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; background: #f9f8f6; color: #1c1917; margin: 0; padding: 24px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e7e5e4; border-radius: 12px; overflow: hidden; }
    .header { background: #1c1917; padding: 24px 32px; text-align: left; }
    .header h1 { color: #f5f5f4; font-size: 18px; margin: 0; letter-spacing: 0.05em; font-weight: 600; }
    .header p { color: #c5a880; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; margin: 4px 0 0 0; font-weight: 600; }
    .content { padding: 32px; font-size: 14px; line-height: 1.6; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; background: #fef3c7; color: #92400e; margin-bottom: 16px; }
    .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
    .info-table td { padding: 8px 12px; border-bottom: 1px solid #f5f5f4; }
    .info-table td:first-child { font-weight: 600; color: #78716c; width: 38%; }
    .doc-list { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 12px; }
    .doc-list th { text-align: left; padding: 8px 12px; background: #fbfbfa; border-bottom: 1px solid #e7e5e4; color: #78716c; font-weight: 600; }
    .doc-list td { padding: 8px 12px; border-bottom: 1px solid #f5f5f4; }
    .cta-box { background: #fefce8; border: 1px solid #fef08a; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0; }
    .btn { display: inline-block; background: #c5a880; color: #1c1917; font-weight: 700; font-size: 13px; text-decoration: none; padding: 12px 24px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .expiry { font-size: 11px; color: #78716c; margin-top: 10px; }
    .notes-box { background: #f5f5f4; border-left: 3px solid #c5a880; padding: 12px 16px; font-size: 13px; margin: 20px 0; border-radius: 0 6px 6px 0; }
    .footer { background: #fafaf9; border-top: 1px solid #f5f5f4; padding: 20px 32px; font-size: 11px; color: #a8a29e; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <p>Masaar Holidays · Visa Operations</p>
      <h1>Visa Application Documents Dispatch</h1>
    </div>
    <div class="content">
      <span class="badge">Reference: ${app.reference_no}</span>
      <p>Hello,</p>
      <p>Please find the official verified documents for visa application <strong>${app.reference_no}</strong> processed by Masaar Holidays.</p>

      <table class="info-table">
        <tr><td>Reference No</td><td><strong>${app.reference_no}</strong></td></tr>
        <tr><td>Primary Contact</td><td>${app.primary_contact_name}</td></tr>
        <tr><td>Visa Service</td><td>${app.product_title}</td></tr>
        <tr><td>Applicants Count</td><td>${app.applicant_count} Traveller(s)</td></tr>
        <tr><td>Delivery Method</td><td>${params.deliveryMethod === "attachment" ? "Direct ZIP Attachment" : "Secure Download Link"}</td></tr>
      </table>

      ${params.customNotes ? `<div class="notes-box"><strong>Staff Note:</strong><br>${params.customNotes.replace(/\n/g, "<br>")}</div>` : ""}

      <h3 style="font-size: 13px; margin: 20px 0 8px 0; text-transform: uppercase; letter-spacing: 0.05em; color: #78716c;">
        Included Documents (${docListSummary.length})
      </h3>
      <table class="doc-list">
        <thead>
          <tr>
            <th>Applicant</th>
            <th>Type</th>
            <th>File Name</th>
            <th>Size</th>
          </tr>
        </thead>
        <tbody>
          ${docListSummary
            .map(
              (d) => `<tr>
                <td><strong>${d.applicant}</strong></td>
                <td>${d.type}</td>
                <td>${d.name}</td>
                <td>${d.sizeKb} KB</td>
              </tr>`
            )
            .join("")}
        </tbody>
      </table>

      ${
        secureDownloadUrl
          ? `<div class="cta-box">
              <p style="margin: 0 0 12px 0; font-weight: 600; color: #1c1917;">Click below to download all selected verified documents as a compressed ZIP package:</p>
              <a href="${secureDownloadUrl}" class="btn" target="_blank" rel="noopener noreferrer">Download Documents Package (.ZIP)</a>
              <p class="expiry">🔒 Secure time-limited link. Valid for 48 hours. Direct download without size limits.</p>
            </div>`
          : `<p style="margin-top: 20px; font-size: 13px; color: #166534; background: #f0fdf4; padding: 12px 16px; border-radius: 6px; border: 1px solid #bbf7d0;">
              📎 All ${docListSummary.length} documents have been compiled into a secure ZIP archive (<strong>${app.reference_no}_documents.zip</strong>) and attached directly to this email.
            </p>`
      }

      <p style="margin-top: 24px; font-size: 13px; color: #78716c;">
        If you have any questions or require additional information regarding this visa application, please contact our visa department.
      </p>
    </div>
    <div class="footer">
      Masaar Holidays · care@masaarholidays.com · +971 4 456 7890<br>
      Confidentiality Note: This transmission contains confidential identity documents and is intended solely for authorized visa processing.
    </div>
  </div>
</body>
</html>
    `;

    // Send email using existing email engine
    const sendResult = await sendEmail({
      to: recipient,
      cc: params.cc?.trim() || undefined,
      subject: emailSubject,
      html: emailHtml,
      attachments,
    });

    if (sendResult.success) {
      // Audit log success
      await logAdminAction({
        adminEmail,
        adminUserId: user?.id || null,
        action: "visa.documents.email_sent",
        resourceType: "visa_application",
        resourceId: app.id,
        details: {
          referenceNo: app.reference_no,
          recipient,
          cc: params.cc || null,
          deliveryMethod: params.deliveryMethod,
          messageId: sendResult.messageId || null,
          documentCount: docs.length,
        },
      });

      // Record in email_notifications
      try {
        await supabase.from("email_notifications").insert({
          idempotency_key: `visa_doc_email_${app.id}_${Date.now()}`,
          recipient,
          subject: emailSubject,
          template_type: "visa_documents_dispatch",
          reference_id: app.reference_no,
          service_type: "visa",
          status: "sent",
          metadata: {
            applicationId: app.id,
            deliveryMethod: params.deliveryMethod,
            messageId: sendResult.messageId || null,
            documentCount: docs.length,
          },
          sent_at: timestamp,
        });
      } catch (logErr) {
        console.warn("[sendVisaDocumentsEmailAction] Notification logging note:", logErr);
      }

      await safeRevalidatePath("/admin/visa-applications");
      return {
        success: true,
        messageId: sendResult.messageId,
        recipient,
        deliveryMethod: params.deliveryMethod,
        timestamp,
      };
    } else {
      const errorMsg = sendResult.error || "Failed to dispatch email via SMTP provider.";

      // Audit log failure
      await logAdminAction({
        adminEmail,
        adminUserId: user?.id || null,
        action: "visa.documents.email_failed",
        resourceType: "visa_application",
        resourceId: app.id,
        details: {
          referenceNo: app.reference_no,
          recipient,
          deliveryMethod: params.deliveryMethod,
          error: errorMsg,
          skipped: sendResult.skipped || false,
        },
      });

      // Record in email_notifications
      try {
        await supabase.from("email_notifications").insert({
          idempotency_key: `visa_doc_email_fail_${app.id}_${Date.now()}`,
          recipient,
          subject: emailSubject,
          template_type: "visa_documents_dispatch",
          reference_id: app.reference_no,
          service_type: "visa",
          status: sendResult.skipped ? "skipped_no_smtp" : "failed",
          error_message: errorMsg,
          metadata: {
            applicationId: app.id,
            deliveryMethod: params.deliveryMethod,
            skipped: sendResult.skipped || false,
          },
        });
      } catch {
        // ignore
      }

      return {
        success: false,
        error: errorMsg,
        recipient,
        deliveryMethod: params.deliveryMethod,
        timestamp,
      };
    }
  } catch (err: any) {
    console.error("[sendVisaDocumentsEmailAction] Error:", err);
    return {
      success: false,
      error: err.message || "An unexpected error occurred while delivering documents.",
      recipient: params.recipient,
      deliveryMethod: params.deliveryMethod,
      timestamp,
    };
  }
}

