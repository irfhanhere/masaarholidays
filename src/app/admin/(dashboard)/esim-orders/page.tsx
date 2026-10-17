import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { EsimOrdersClient } from "./EsimOrdersClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "eSIM Orders | Masaar Admin",
  robots: { index: false },
};

export default async function AdminEsimOrdersPage() {
  let orders: any[] = [];
  let plans: any[] = [];

  if (isSupabaseConfigured()) {
    const supabase = createAdminClient();

    const [ordersRes, plansRes] = await Promise.all([
      supabase.from("esim_orders").select("*").order("created_at", { ascending: false }),
      supabase.from("esim_plans").select("plan_id, name, country_iso, region_slug, data_gb, validity_days"),
    ]);

    orders = ordersRes.data || [];
    plans = plansRes.data || [];
  }

  const plansMap = new Map<string, any>();
  for (const plan of plans) {
    plansMap.set(plan.plan_id, plan);
  }

  return <EsimOrdersClient orders={orders} plansMap={Object.fromEntries(plansMap)} />;
}
