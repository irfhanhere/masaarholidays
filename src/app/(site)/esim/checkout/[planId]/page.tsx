import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { EsimCheckoutClient } from "@/components/site/EsimCheckoutClient";
import { createAdminClient } from "@/lib/supabase/admin";
import { isEsimVatEnabled, getEsimVatPct } from "@/lib/vat";
import { verifyEsimAccess } from "@/lib/esim-launch-server";
import { getAllEsimFxQuotes } from "@/lib/esim-fx";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ planId: string }>;
}): Promise<Metadata> {
  const { planId } = await params;
  const decodedId = decodeURIComponent(planId);

  const supabase = createAdminClient();
  const { data: plan } = await supabase
    .from("esim_plans")
    .select("name")
    .eq("plan_id", decodedId)
    .eq("is_active", true)
    .eq("plan_kind", "data")
    .maybeSingle();

  const title = plan ? `Order ${plan.name} — eSIM Checkout` : "eSIM Checkout";

  return {
    title: `${title} | Masaar Holidays`,
    description: "Complete your travel eSIM order with secure instant online payment.",
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function EsimCheckoutPage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  // Block access when launch mode is off unless preview cookie is present
  const hasAccess = await verifyEsimAccess();
  if (!hasAccess) {
    notFound();
  }

  const { planId } = await params;
  const decodedPlanId = decodeURIComponent(planId);

  const supabase = createAdminClient();

  // Load the active data plan by id from esim_plans (404 if missing)
  const { data: plan, error } = await supabase
    .from("esim_plans")
    .select(
      "plan_id, name, country_iso, region_slug, data_gb, validity_days, is_unlimited, network_type, carriers, fup_note, supports_hotspot, sale_price_usd, is_active, plan_kind"
    )
    .eq("plan_id", decodedPlanId)
    .eq("is_active", true)
    .eq("plan_kind", "data")
    .maybeSingle();

  if (error || !plan) {
    notFound();
  }

  // Fetch dedicated eSIM FX quotes (with pegged AED 3.6725, SAR 3.75, and buffered live rates)
  const esimFxQuotes = await getAllEsimFxQuotes();
  const esimFxRates: Record<string, number> = {};
  for (const [curr, q] of Object.entries(esimFxQuotes)) {
    esimFxRates[curr] = q.effectiveRate;
  }
  const usdToAedRate = esimFxRates["AED"] || 3.6725;

  const safePlan = {
    plan_id: plan.plan_id,
    name: plan.name,
    country_iso: plan.country_iso,
    region_slug: plan.region_slug,
    data_gb: Number(plan.data_gb),
    validity_days: Number(plan.validity_days),
    is_unlimited: Boolean(plan.is_unlimited),
    network_type: plan.network_type,
    carriers: plan.carriers,
    fup_note: plan.fup_note,
    supports_hotspot: plan.supports_hotspot,
    sale_price_usd: Number(plan.sale_price_usd),
  };

  const vatEnabled = isEsimVatEnabled();
  const vatPct = getEsimVatPct();

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "eSIM", href: "/esim" },
          { label: "Checkout" },
          { label: safePlan.name },
        ]}
      />
      <EsimCheckoutClient
        plan={safePlan}
        usdToAedRate={usdToAedRate}
        esimFxRates={esimFxRates}
        vatEnabled={vatEnabled}
        vatPct={vatPct}
      />
    </>
  );
}
