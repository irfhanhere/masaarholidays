import Link from "next/link";
import type { Metadata } from "next";
import { PageHeader, PrimaryButton } from "@/components/admin/ui";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { UmrahDepartureMonthRow } from "@/lib/types/database";
import { InventoryConfigJoined, MonthInventoryDashboard } from "./MonthInventoryDashboard";

export const metadata: Metadata = { title: "Umrah Inventory Management | Masaar Admin", robots: { index: false } };

async function getData() {
  if (!isSupabaseConfigured()) return { months: [], configs: [] };
  const supabase = await createClient();

  const [{ data: months }, { data: configs }] = await Promise.all([
    supabase.from("umrah_departure_months").select("*").order("sort_order", { ascending: true }),
    supabase
      .from("umrah_inventory_configurations")
      .select(`
        id,
        journey_type,
        duration_nights,
        duration_days,
        duration_label,
        makkah_allow_similar,
        madinah_allow_similar,
        status,
        created_at,
        package:packages(id, title, tier),
        month:umrah_departure_months(id, display_label, slug),
        makkah_hotel:hotels!umrah_inventory_configurations_makkah_hotel_id_fkey(id, name),
        madinah_hotel:hotels!umrah_inventory_configurations_madinah_hotel_id_fkey(id, name),
        prices:umrah_configuration_room_prices(occupancy_type, price_aed)
      `)
      .order("created_at", { ascending: false }),
  ]);

  return {
    months: (months ?? []) as UmrahDepartureMonthRow[],
    configs: (configs as unknown as InventoryConfigJoined[]) ?? [],
  };
}

export default async function AdminUmrahInventoryPage() {
  const { months, configs } = await getData();

  return (
    <div>
      <PageHeader
        title="Umrah Inventory Management"
        description="Manage monthly departure configurations, hotel options, occupancy rates, and itinerary details."
        breadcrumb={[{ label: "Dashboard", href: "/admin" }, { label: "Umrah Inventory" }]}
        actions={
          <Link href="/admin/umrah-inventory/new">
            <PrimaryButton>+ Add Configuration</PrimaryButton>
          </Link>
        }
      />

      <MonthInventoryDashboard months={months} configs={configs} />
    </div>
  );
}
