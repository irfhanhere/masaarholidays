import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type PublicEsimCarrier = {
  locationName?: string;
  locationLogo?: string;
  locationCode?: string;
  operatorList?: Array<{ operatorName: string; networkType: string }>;
  [key: string]: unknown;
};

export type PublicEsimPlan = {
  plan_id: string;
  name: string;
  country_iso: string | null;
  region_slug: string | null;
  data_gb: number;
  validity_days: number;
  is_unlimited: boolean;
  network_type: string | null;
  carriers: PublicEsimCarrier[] | null;
  fup_note: string | null;
  supports_topup: boolean;
  supports_cancel: boolean;
  supports_hotspot: boolean | null;
  ip_export: string | null;
  sale_price_usd: number;
};

/**
 * Server-only function that queries active data plans from esim_plans
 * using the Supabase service-role client.
 *
 * Security:
 * - Browser never queries the esim tables directly.
 * - Strips cost_usd, retail_price_usd, raw, and internal metadata
 *   before returning sanitized PublicEsimPlan objects.
 */
export async function getEsimPlans(): Promise<PublicEsimPlan[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("esim_plans")
      .select(
        "plan_id, name, country_iso, region_slug, data_gb, validity_days, is_unlimited, network_type, carriers, fup_note, supports_topup, supports_cancel, supports_hotspot, ip_export, sale_price_usd"
      )
      .eq("is_active", true)
      .eq("plan_kind", "data")
      .order("data_gb", { ascending: true })
      .order("validity_days", { ascending: true })
      .order("sale_price_usd", { ascending: true });

    if (error) {
      console.error("getEsimPlans database error:", error.message);
      return [];
    }

    if (!data) return [];

    // Whitelist and format safe client props only
    return data.map((row) => ({
      plan_id: row.plan_id,
      name: row.name,
      country_iso: row.country_iso,
      region_slug: row.region_slug,
      data_gb: Number(row.data_gb),
      validity_days: Number(row.validity_days),
      is_unlimited: Boolean(row.is_unlimited),
      network_type: row.network_type,
      carriers: (row.carriers as PublicEsimCarrier[]) ?? null,
      fup_note: row.fup_note,
      supports_topup: Boolean(row.supports_topup),
      supports_cancel: Boolean(row.supports_cancel),
      supports_hotspot: row.supports_hotspot,
      ip_export: row.ip_export,
      sale_price_usd: Number(row.sale_price_usd),
    }));
  } catch (err: unknown) {
    console.error("getEsimPlans unexpected exception:", err);
    return [];
  }
}
