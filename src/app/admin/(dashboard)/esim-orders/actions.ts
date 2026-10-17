"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { retryFulfilEsimOrder, refundEsimOrder, type RefundEsimOrderResult } from "@/lib/esim-fulfilment";

/**
 * Server-side verification of active admin session and MFA assurance level.
 * Throws 401 or 403 if unauthorized.
 */
async function verifyAdminAuth() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    if (process.env.NODE_ENV !== "production" && process.env.ALLOW_DEV_AUTH_BYPASS === "true") {
      return { id: "dev-admin", email: "dev-admin@masaarholidays.com" };
    }
    throw new Error("Unauthorized: Active admin authentication session required.");
  }

  // Check MFA Assurance Level if user has 2FA configured
  const { data: aalData, error: aalErr } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (!aalErr && aalData) {
    if (aalData.nextLevel === "aal2" && aalData.currentLevel !== "aal2") {
      throw new Error("MFA Verification Required: You must complete two-factor authentication to perform this action.");
    }
  }

  return user;
}

/**
 * Retries automated provisioning for an eSIM order via MegaEsim reseller API.
 * Requires admin session + MFA verification.
 */
export async function retryOrderFulfilment(orderId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await verifyAdminAuth();
    const result = await retryFulfilEsimOrder(orderId);
    revalidatePath("/admin/esim-orders");
    return result;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Retry failed";
    return { success: false, error: msg };
  }
}

/**
 * Issues an eSIM order refund following the strict cancellation hierarchy:
 * (i) Cancels any 'ready' units with the carrier first.
 * (ii) Blocks refund if any unit is installed/active unless an explicit override note is provided.
 * (iii) Issues Stripe refund only when units are cancelled/failed/overridden.
 * Requires admin session + MFA verification.
 */
export async function refundOrder(
  orderId: string,
  overrideNote?: string
): Promise<RefundEsimOrderResult> {
  try {
    const adminUser = await verifyAdminAuth();

    const result = await refundEsimOrder({
      orderId,
      adminEmail: adminUser.email || undefined,
      overrideNote: overrideNote?.trim() || undefined,
    });

    revalidatePath("/admin/esim-orders");
    return result;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Refund execution failed";
    return { success: false, error: msg };
  }
}

/**
 * Dismisses needs_attention flag once staff has manually reviewed or addressed the order.
 * Requires admin session + MFA verification.
 */
export async function dismissAttentionFlag(orderId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await verifyAdminAuth();
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("esim_orders")
      .update({
        needs_attention: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/esim-orders");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update order";
    return { success: false, error: msg };
  }
}
