"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/audit-logger";
import {
  type PaymentDisplaySettings,
  getPaymentDisplaySettings,
} from "@/lib/data/payment-display-settings";

const PAYMENT_SETTINGS_STORAGE_KEY = "cms_payment_display_settings";

/**
 * Save payment display settings from Admin.
 * NOTE: These settings strictly control public promotional copy and customer enquiry notices.
 * They DO NOT activate/deactivate backend payment gateways, modify API keys, or alter webhooks.
 */
export async function savePaymentDisplaySettingsAction(
  settings: Partial<PaymentDisplaySettings>
): Promise<{ success: boolean; message: string; data?: PaymentDisplaySettings }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, message: "Unauthorized: Administrator sign-in required." };
    }

    const current = await getPaymentDisplaySettings();
    const updated: PaymentDisplaySettings = {
      ...current,
      ...settings,
    };

    if (isSupabaseConfigured()) {
      // Try writing to payment_display_settings table
      await (supabase as any).from("payment_display_settings").upsert(
        {
          id: 1,
          ...updated,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

      // Always sync to backup record to guarantee instant persistence
      await (supabase as any).from("legal_pages").upsert({
        key: PAYMENT_SETTINGS_STORAGE_KEY,
        title: "CMS Payment Display Settings",
        content: JSON.stringify(updated),
        updated_at: new Date().toISOString(),
      });

      // Record administrative audit log
      await logAdminAction({
        adminEmail: user.email || "admin@masaarholidays.com",
        adminUserId: user.id,
        action: "UPDATE_PAYMENT_DISPLAY_SETTINGS",
        resourceType: "payment_display_settings",
        resourceId: "1",
        details: {
          tabby_promo_enabled: updated.tabby_promo_enabled,
          tamara_promo_enabled: updated.tamara_promo_enabled,
        },
      });

      // Revalidate affected public routes
      try {
        revalidatePath("/");
        revalidatePath("/saudi-visa");
        revalidatePath("/visa/application");
        revalidatePath("/esim");
        revalidatePath("/transfers");
        revalidatePath("/admin/payment-display");
      } catch {}

      return {
        success: true,
        message: "Payment display settings saved successfully.",
        data: updated,
      };
    }

    return {
      success: true,
      message: "Payment display settings saved (local mode).",
      data: updated,
    };
  } catch (err: any) {
    return { success: false, message: err?.message || "Failed to save payment display settings" };
  }
}
