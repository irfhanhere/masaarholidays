import "server-only";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { CONTACT } from "@/lib/contact";

export interface PaymentDisplaySettings {
  // Tabby Promotional Settings
  tabby_promo_enabled: boolean;
  tabby_enquiry_message: string;
  tabby_whatsapp_number: string;

  // Tamara Promotional Settings
  tamara_promo_enabled: boolean;
  tamara_heading: string;
  tamara_description: string;
  tamara_logo_url: string;
  tamara_display_order: number;
}

export const DEFAULT_PAYMENT_DISPLAY_SETTINGS: PaymentDisplaySettings = {
  tabby_promo_enabled: false,
  tabby_enquiry_message:
    "Interested in paying with Tabby? Contact our team on WhatsApp for assistance. Tabby payment integration is currently being updated.",
  tabby_whatsapp_number: CONTACT.whatsappPhoneIntl || "971557329320",

  tamara_promo_enabled: true,
  tamara_heading: "Flexible Payments with Tamara",
  tamara_description:
    "Enjoy a convenient payment experience with Tamara. Choose Tamara at checkout when available.",
  tamara_logo_url: "/brand/tamara-logo.svg",
  tamara_display_order: 2,
};

const PAYMENT_SETTINGS_STORAGE_KEY = "cms_payment_display_settings";

/**
 * Load authoritative payment display settings from Supabase.
 */
export async function getPaymentDisplaySettings(): Promise<PaymentDisplaySettings> {
  try {
    if (isSupabaseConfigured()) {
      const supabase = await createClient();

      // Check primary singleton table if present
      const { data: primaryData, error: primaryErr } = await (supabase as any)
        .from("payment_display_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();

      if (!primaryErr && primaryData) {
        return {
          ...DEFAULT_PAYMENT_DISPLAY_SETTINGS,
          ...primaryData,
        };
      }

      // Fallback check in legal_pages singleton storage
      const { data: fallbackData } = await (supabase as any)
        .from("legal_pages")
        .select("content")
        .eq("key", PAYMENT_SETTINGS_STORAGE_KEY)
        .maybeSingle();

      if (fallbackData?.content) {
        try {
          const parsed = JSON.parse(fallbackData.content);
          return {
            ...DEFAULT_PAYMENT_DISPLAY_SETTINGS,
            ...parsed,
          };
        } catch {}
      }
    }
  } catch (err: any) {
    console.warn("Could not read payment display settings from database, using defaults:", err?.message);
  }

  return DEFAULT_PAYMENT_DISPLAY_SETTINGS;
}
