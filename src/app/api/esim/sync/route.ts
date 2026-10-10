import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPlans, getPricesVersion, Plan } from "@/lib/megaesim";
import {
  ESIM_CONFIG,
  getEnabledDestinations,
  calculateSalePriceUsd,
  getEsimMarkupPct,
} from "@/lib/esim-config";

/**
 * eSIM Catalogue Sync Endpoint
 *
 * POST /api/esim/sync
 * Header required: x-sync-secret = process.env.ESIM_SYNC_SECRET
 * Query param: ?force=true (bypass prices_version check)
 *
 * 1. Calls MegaEsim getPricesVersion().
 * 2. Compares against esim_catalogue_meta.prices_version.
 *    If unchanged and ?force is not set, returns early to respect the 100 req/min rate limit.
 * 3. Pulls plans for configured countries & regions from lib/esim-config.ts.
 * 4. Filters out plans where plan_kind == "number" (not sold at launch).
 * 5. Calculates sale_price_usd using ESIM_MARKUP_PCT and upserts into esim_plans.
 * 6. Marks plans no longer returned for the configured targets as is_active = false.
 * 7. Updates esim_catalogue_meta with the new prices_version and last_synced_at.
 */
export async function POST(request: NextRequest) {
  const syncSecret = process.env.ESIM_SYNC_SECRET?.trim();
  const providedSecret = request.headers.get("x-sync-secret")?.trim();

  if (!syncSecret || providedSecret !== syncSecret) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid or missing x-sync-secret header" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const isForce = searchParams.get("force") === "true" || searchParams.has("force");

  // Step 1: Check prices version
  let livePricesVersion: string;
  try {
    const versionRes = await getPricesVersion();
    livePricesVersion = versionRes.version;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch prices version";
    return NextResponse.json(
      { error: `MegaEsim version check failed: ${msg}` },
      { status: 502 }
    );
  }

  const supabase = createAdminClient();

  // Step 2: Compare against cached version
  const { data: metaRow, error: metaErr } = await supabase
    .from("esim_catalogue_meta")
    .select("prices_version, last_synced_at")
    .eq("id", "singleton")
    .maybeSingle();

  if (metaErr) {
    return NextResponse.json(
      {
        error: `Database error querying esim_catalogue_meta (did you run migration 0082?): ${metaErr.message}`,
      },
      { status: 500 }
    );
  }

  if (!isForce && metaRow?.prices_version && metaRow.prices_version === livePricesVersion) {
    return NextResponse.json({
      synced: false,
      message: "Catalogue is already up to date with prices version",
      prices_version: livePricesVersion,
      last_synced_at: metaRow.last_synced_at,
    });
  }

  // Step 3: Pull plans for configured countries & regions
  const markupPct = getEsimMarkupPct();
  const nowIso = new Date().toISOString();

  type PlanInsert = {
    plan_id: string;
    plan_kind: string;
    name: string;
    country_iso: string | null;
    region_slug: string | null;
    data_gb: number;
    validity_days: number;
    is_unlimited: boolean;
    network_type: string | null;
    carriers: unknown;
    fup_note: string | null;
    supports_topup: boolean;
    supports_cancel: boolean;
    supports_hotspot: boolean | null;
    ip_export: string | null;
    retail_price_usd: number;
    cost_usd: number;
    sale_price_usd: number;
    is_active: boolean;
    raw: unknown;
    synced_at: string;
  };

  const plansToUpsert: PlanInsert[] = [];
  const countryPlanIdsMap: Record<string, string[]> = {};
  const regionPlanIdsMap: Record<string, string[]> = {};
  const countryResults: {
    iso: string;
    name: string;
    count: number;
    skipped: boolean;
    error?: string;
  }[] = [];

  const enabledDestinations = getEnabledDestinations();

  try {
    // Sync configured enabled countries with a small delay between requests (<=100 req/min)
    for (const dest of enabledDestinations) {
      await new Promise((resolve) => setTimeout(resolve, 200));

      try {
        const plans = await getPlans({ country: dest.iso });
        const validPlans = (plans || []).filter((plan) => plan.plan_kind !== "number");

        if (validPlans.length === 0) {
          countryResults.push({
            iso: dest.iso,
            name: dest.name,
            count: 0,
            skipped: true,
          });
          continue;
        }

        countryPlanIdsMap[dest.iso] = [];
        countryResults.push({
          iso: dest.iso,
          name: dest.name,
          count: validPlans.length,
          skipped: false,
        });

        for (const plan of validPlans) {
          countryPlanIdsMap[dest.iso].push(plan.plan_id);

          plansToUpsert.push({
            plan_id: plan.plan_id,
            plan_kind: plan.plan_kind,
            name: plan.name,
            country_iso: dest.iso,
            region_slug: null,
            data_gb: plan.data_gb,
            validity_days: plan.validity_days,
            is_unlimited: plan.is_unlimited,
            network_type: plan.network_type || null,
            carriers: plan.carriers || null,
            fup_note: plan.fup_note || null,
            supports_topup: Boolean(plan.supports_topup),
            supports_cancel: Boolean(plan.supports_cancel),
            supports_hotspot: plan.supports_hotspot,
            ip_export: plan.ip_export || null,
            retail_price_usd: plan.retail_price,
            cost_usd: plan.your_price,
            sale_price_usd: calculateSalePriceUsd(plan.retail_price, markupPct),
            is_active: true,
            raw: plan,
            synced_at: nowIso,
          });
        }
      } catch (countryErr) {
        const errMsg = countryErr instanceof Error ? countryErr.message : "Fetch error";
        console.error(`MegaEsim fetch error for ${dest.iso}:`, errMsg);
        countryResults.push({
          iso: dest.iso,
          name: dest.name,
          count: 0,
          skipped: true,
          error: errMsg,
        });
      }
    }

    // Sync configured regions
    for (const regionSlug of ESIM_CONFIG.regions) {
      await new Promise((resolve) => setTimeout(resolve, 200));

      const plans = await getPlans({ region: regionSlug });
      regionPlanIdsMap[regionSlug] = [];

      for (const plan of plans) {
        if (plan.plan_kind === "number") {
          continue;
        }

        regionPlanIdsMap[regionSlug].push(plan.plan_id);

        plansToUpsert.push({
          plan_id: plan.plan_id,
          plan_kind: plan.plan_kind,
          name: plan.name,
          country_iso: null,
          region_slug: regionSlug,
          data_gb: plan.data_gb,
          validity_days: plan.validity_days,
          is_unlimited: plan.is_unlimited,
          network_type: plan.network_type || null,
          carriers: plan.carriers || null,
          fup_note: plan.fup_note || null,
          supports_topup: Boolean(plan.supports_topup),
          supports_cancel: Boolean(plan.supports_cancel),
          supports_hotspot: plan.supports_hotspot,
          ip_export: plan.ip_export || null,
          retail_price_usd: plan.retail_price,
          cost_usd: plan.your_price,
          sale_price_usd: calculateSalePriceUsd(plan.retail_price, markupPct),
          is_active: true,
          raw: plan,
          synced_at: nowIso,
        });
      }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed fetching catalogue plans";
    return NextResponse.json(
      { error: `MegaEsim catalogue fetch error: ${msg}` },
      { status: 502 }
    );
  }

  // Step 4: Upsert plans into database
  if (plansToUpsert.length > 0) {
    const { error: upsertErr } = await supabase
      .from("esim_plans")
      .upsert(plansToUpsert, { onConflict: "plan_id" });

    if (upsertErr) {
      return NextResponse.json(
        { error: `Failed to upsert esim_plans: ${upsertErr.message}` },
        { status: 500 }
      );
    }
  }

  // Step 5: Mark plans no longer returned as is_active = false for successfully synced countries
  for (const result of countryResults) {
    if (result.skipped) continue;
    const countryIso = result.iso;
    const activeIds = countryPlanIdsMap[countryIso] ?? [];
    if (activeIds.length > 0) {
      const formattedFilter = `(${activeIds.map((id) => `"${id}"`).join(",")})`;
      await supabase
        .from("esim_plans")
        .update({ is_active: false })
        .eq("country_iso", countryIso)
        .not("plan_id", "in", formattedFilter);
    }
  }

  for (const regionSlug of ESIM_CONFIG.regions) {
    const activeIds = regionPlanIdsMap[regionSlug] ?? [];
    if (activeIds.length > 0) {
      const formattedFilter = `(${activeIds.map((id) => `"${id}"`).join(",")})`;
      await supabase
        .from("esim_plans")
        .update({ is_active: false })
        .eq("region_slug", regionSlug)
        .not("plan_id", "in", formattedFilter);
    } else {
      await supabase
        .from("esim_plans")
        .update({ is_active: false })
        .eq("region_slug", regionSlug);
    }
  }

  // Step 6: Update metadata with latest version & timestamp
  const { error: metaUpdateErr } = await supabase
    .from("esim_catalogue_meta")
    .upsert({
      id: "singleton",
      prices_version: livePricesVersion,
      last_synced_at: nowIso,
    });

  if (metaUpdateErr) {
    return NextResponse.json(
      { error: `Failed to update esim_catalogue_meta: ${metaUpdateErr.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({
    synced: true,
    prices_version: livePricesVersion,
    plans_upserted: plansToUpsert.length,
    countries_synced: enabledDestinations.map((d) => d.iso),
    country_results: countryResults,
    regions_synced: ESIM_CONFIG.regions,
    markup_pct: markupPct,
    synced_at: nowIso,
  });
}
