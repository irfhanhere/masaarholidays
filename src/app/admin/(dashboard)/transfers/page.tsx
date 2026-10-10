import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { TransferRow } from "@/lib/types/database";
import { TransfersOverviewClient } from "./TransfersOverviewClient";
import { VERIFIED_ROUTE_CATALOG } from "@/lib/data/transfers";

export const metadata: Metadata = {
  title: "Transfers | Masaar Admin",
  robots: { index: false },
};

export default async function AdminTransfersPage() {
  let transfers: any[] = [];

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const [transfersRes, ratesRes] = await Promise.all([
        supabase.from("transfers").select("*").order("display_order"),
        supabase.from("transfer_route_rates").select("transfer_id, is_active"),
      ]);

      const ratesCountMap = new Map<string, { active: number; total: number }>();
      for (const r of ratesRes.data ?? []) {
        const cur = ratesCountMap.get(r.transfer_id) || { active: 0, total: 0 };
        cur.total += 1;
        if (r.is_active) cur.active += 1;
        ratesCountMap.set(r.transfer_id, cur);
      }

      transfers = (transfersRes.data ?? []).map((t) => {
        const counts = ratesCountMap.get(t.id) || { active: 5, total: 5 };
        return {
          ...t,
          activeVehiclesCount: counts.active,
          totalVehiclesCount: counts.total,
        };
      });
    } catch (err) {
      console.error("AdminTransfersPage error:", err);
    }
  }

  // Fallback to verified catalog if DB empty
  if (transfers.length === 0) {
    transfers = Object.values(VERIFIED_ROUTE_CATALOG).map((meta, idx) => ({
      id: `route_${meta.slug}`,
      route_name: meta.route_name,
      slug: meta.slug,
      transfer_type: meta.transfer_type,
      description: meta.description,
      image_url: meta.image_url,
      is_active: true,
      display_order: idx + 1,
      featured: meta.featured,
      activeVehiclesCount: 5,
      totalVehiclesCount: 5,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
  }

  return <TransfersOverviewClient transfers={transfers} />;
}
