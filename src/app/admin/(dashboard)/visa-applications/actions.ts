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

    revalidatePath("/admin/visa-applications");
    return { success: true };
  } catch (err: any) {
    console.error("[updateVisaApplicationStatus] Error:", err);
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
