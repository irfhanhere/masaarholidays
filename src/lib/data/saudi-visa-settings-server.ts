import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  SaudiVisaSettings,
  DEFAULT_SAUDI_VISA_SETTINGS,
} from "./saudi-visa-settings";

/**
 * Loads dynamic Saudi Visa Settings from Supabase with safe fallback to DEFAULT_SAUDI_VISA_SETTINGS.
 */
export async function getSaudiVisaSettings(): Promise<SaudiVisaSettings> {
  if (!isSupabaseConfigured()) {
    return DEFAULT_SAUDI_VISA_SETTINGS;
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("saudi_visa_settings" as any)
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (error || !data) {
      return DEFAULT_SAUDI_VISA_SETTINGS;
    }

    const row = data as any;
    return {
      basePrice: Number(row.base_price) || DEFAULT_SAUDI_VISA_SETTINGS.basePrice,
      familyDiscountPercentage: Number(row.family_discount_percentage) || DEFAULT_SAUDI_VISA_SETTINGS.familyDiscountPercentage,
      familyMinimumApplicants: Number(row.family_minimum_applicants) || DEFAULT_SAUDI_VISA_SETTINGS.familyMinimumApplicants,
      currency: row.currency || DEFAULT_SAUDI_VISA_SETTINGS.currency,
      processingEstimate: row.processing_estimate || DEFAULT_SAUDI_VISA_SETTINGS.processingEstimate,
      whatsappNumber: row.whatsapp_number || DEFAULT_SAUDI_VISA_SETTINGS.whatsappNumber,
      approvedNationalities: Array.isArray(row.approved_nationalities)
        ? row.approved_nationalities
        : DEFAULT_SAUDI_VISA_SETTINGS.approvedNationalities,
      validityRequirements: {
        passportMinMonths: Number(row.validity_requirements?.passportMinMonths) || 6,
        residenceMinMonths: Number(row.validity_requirements?.residenceMinMonths) || 3,
        emiratesIdMinMonths: Number(row.validity_requirements?.emiratesIdMinMonths) || 3,
      },
      allowUnknownNationalitiesManualReview:
        typeof row.allow_unknown_nationalities_manual_review === "boolean"
          ? row.allow_unknown_nationalities_manual_review
          : true,
    };
  } catch (err) {
    console.warn("[getSaudiVisaSettings] Error querying saudi_visa_settings table, using defaults:", err);
    return DEFAULT_SAUDI_VISA_SETTINGS;
  }
}

/**
 * Saves or updates Saudi Visa settings in the database.
 */
export async function updateSaudiVisaSettings(
  settings: Partial<SaudiVisaSettings>
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();
    const current = await getSaudiVisaSettings();

    const merged = {
      base_price: settings.basePrice ?? current.basePrice,
      family_discount_percentage: settings.familyDiscountPercentage ?? current.familyDiscountPercentage,
      family_minimum_applicants: settings.familyMinimumApplicants ?? current.familyMinimumApplicants,
      currency: settings.currency ?? current.currency,
      processing_estimate: settings.processingEstimate ?? current.processingEstimate,
      whatsapp_number: settings.whatsappNumber ?? current.whatsappNumber,
      approved_nationalities: settings.approvedNationalities ?? current.approvedNationalities,
      validity_requirements: {
        passportMinMonths: settings.validityRequirements?.passportMinMonths ?? current.validityRequirements.passportMinMonths,
        residenceMinMonths: settings.validityRequirements?.residenceMinMonths ?? current.validityRequirements.residenceMinMonths,
        emiratesIdMinMonths: settings.validityRequirements?.emiratesIdMinMonths ?? current.validityRequirements.emiratesIdMinMonths,
      },
      allow_unknown_nationalities_manual_review:
        settings.allowUnknownNationalitiesManualReview ?? current.allowUnknownNationalitiesManualReview,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("saudi_visa_settings" as any)
      .upsert({ id: 1, ...merged }, { onConflict: "id" });

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update settings" };
  }
}
