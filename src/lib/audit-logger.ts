import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export interface LogAdminActionParams {
  adminEmail: string;
  adminUserId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  details?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Standardized audit logging for administrative actions,
 * visa updates, document issuance, and payment/refund management.
 */
export async function logAdminAction(params: LogAdminActionParams): Promise<void> {
  const timestamp = new Date().toISOString();
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("admin_audit_logs").insert({
      admin_email: params.adminEmail,
      admin_user_id: params.adminUserId || null,
      action: params.action,
      resource_type: params.resourceType,
      resource_id: params.resourceId || null,
      details: params.details || {},
      ip_address: params.ipAddress || null,
      user_agent: params.userAgent || null,
    });

    if (error) {
      // In case the migration table has not been executed yet in a local branch,
      // fail open and log cleanly to stdout without blocking business operations.
      console.log(`[AUDIT LOG] [${timestamp}] ${params.adminEmail} performed ${params.action} on ${params.resourceType}:${params.resourceId || "N/A"}`);
    }
  } catch {
    console.log(`[AUDIT LOG] [${timestamp}] ${params.adminEmail} performed ${params.action} on ${params.resourceType}:${params.resourceId || "N/A"}`);
  }
}
