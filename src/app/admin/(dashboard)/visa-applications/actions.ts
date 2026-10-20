"use server";

import { revalidatePath } from "next/cache";
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

export async function getDocumentSignedUrlAction(filePath: string) {
  try {
    const { signedUrl, error } = await getPrivateDocumentSignedUrl(filePath, 3600); // 1 hour link
    if (error || !signedUrl) {
      return { success: false, error: error || "Failed to generate signed document URL" };
    }
    return { success: true, url: signedUrl };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to generate signed document URL" };
  }
}
