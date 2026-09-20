import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { ZiyaratPricingRow, ZiyaratVehicleTypeRow } from "@/lib/types/database";
import { VehiclesManager } from "./VehiclesManager";

export const metadata: Metadata = {
  title: "Vehicles & Ziyarat Pricing | Masaar Admin",
  robots: { index: false },
};

async function getData() {
  if (!isSupabaseConfigured()) return { vehicles: [], pricing: [] };
  const supabase = await createClient();

  const [{ data: vehicles }, { data: pricing }] = await Promise.all([
    supabase.from("ziyarat_vehicle_types").select("*").order("display_order", { ascending: true }),
    supabase.from("ziyarat_pricing").select("*"),
  ]);

  return {
    vehicles: (vehicles ?? []) as ZiyaratVehicleTypeRow[],
    pricing: (pricing ?? []) as ZiyaratPricingRow[],
  };
}

export default async function AdminVehiclesPage() {
  const { vehicles, pricing } = await getData();

  return (
    <div>
      <PageHeader
        title="Vehicles & Ziyarat Pricing"
        description="Manage vehicle types catalog and city-specific Ziyarat pricing matrix."
        breadcrumb={[{ label: "Dashboard", href: "/admin" }, { label: "Vehicles & Ziyarat" }]}
      />

      <VehiclesManager vehicles={vehicles} pricing={pricing} />
    </div>
  );
}
