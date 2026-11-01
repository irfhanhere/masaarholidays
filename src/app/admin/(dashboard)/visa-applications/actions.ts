"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getPrivateDocumentSignedUrl } from "@/lib/documents/private-storage";
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

    revalidatePath("/admin/visa-applications");
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
    revalidatePath("/admin/visa-applications");
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
    revalidatePath("/admin/visa-applications");
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
    return { success: true, applicants: [], documents: [], timeline: [] };
  }

  try {
    const supabase = createAdminClient();

    const [appRes, applicantsRes, docsRes] = await Promise.all([
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
    ]);

    if (appRes.error) throw appRes.error;

    return {
      success: true,
      application: appRes.data,
      applicants: applicantsRes.data || [],
      documents: docsRes.data || [],
      timeline: (appRes.data?.status_timeline as any[]) || [],
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
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    const isAdmin =
      (!authErr && user) ||
      (process.env.NODE_ENV !== "production" && process.env.ALLOW_DEV_AUTH_BYPASS === "true");

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
    const supabaseUser = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabaseUser.auth.getUser();

    const isAdmin =
      (!authErr && user) ||
      (process.env.NODE_ENV !== "production" && process.env.ALLOW_DEV_AUTH_BYPASS === "true");

    if (!isAdmin) {
      return { success: false, error: "Unauthorized. Admin credentials required." };
    }

    const supabase = createAdminClient();
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

    revalidatePath("/admin/visa-applications");
    return { success: true };
  } catch (err: any) {
    console.error("[updateDocumentVerificationStatusAction] Error:", err);
    return { success: false, error: err.message || "Failed to update verification status" };
  }
}

