import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type {
  HotelRow,
  PackageRow,
  PrivateTripRow,
  UmrahDepartureMonthRow,
  UmrahInventoryConfigurationRow,
} from "@/lib/types/database";
import { InventoryConfigurationWizard } from "../InventoryConfigurationWizard";

export const metadata: Metadata = { title: "Edit Inventory Configuration | Masaar Admin", robots: { index: false } };

async function getData(id: string) {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();

  const [{ data: config }, { data: packages }, { data: months }, { data: hotels }, { data: trips }, { data: prices }, { data: assignedTrips }] =
    await Promise.all([
      supabase.from("umrah_inventory_configurations").select("*").eq("id", id).maybeSingle(),
      supabase.from("packages").select("*").eq("type", "umrah").order("display_order", { ascending: true }),
      supabase.from("umrah_departure_months").select("*").order("sort_order", { ascending: true }),
      supabase.from("hotels").select("*").eq("is_active", true).order("name", { ascending: true }),
      supabase.from("private_trips").select("*").eq("status", "published").order("display_order", { ascending: true }),
      supabase.from("umrah_configuration_room_prices").select("*").eq("configuration_id", id),
      supabase.from("umrah_configuration_private_trips").select("private_trip_id").eq("configuration_id", id),
    ]);

  if (!config) return null;

  const makkahHotels = (hotels ?? []).filter((h) => h.city.toLowerCase().includes("makkah"));
  const madinahHotels = (hotels ?? []).filter((h) => h.city.toLowerCase().includes("madinah"));

  const initialPrices: Record<string, number> = {};
  (prices ?? []).forEach((p) => {
    initialPrices[p.occupancy_type] = p.price_aed;
  });

  const initialTripIds = (assignedTrips ?? []).map((t) => t.private_trip_id);

  return {
    config: config as UmrahInventoryConfigurationRow,
    packages: (packages ?? []) as PackageRow[],
    months: (months ?? []) as UmrahDepartureMonthRow[],
    makkahHotels: makkahHotels as HotelRow[],
    madinahHotels: madinahHotels as HotelRow[],
    privateTrips: (trips ?? []) as PrivateTripRow[],
    initialPrices,
    initialTripIds,
  };
}

export default async function EditInventoryConfigurationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getData(id);
  if (!data) notFound();

  return (
    <div>
      <PageHeader
        title="Edit Inventory Configuration"
        description="Update journey details, hotel options, occupancy pricing and itinerary."
        breadcrumb={[
          { label: "Dashboard", href: "/admin" },
          { label: "Umrah Inventory", href: "/admin/umrah-inventory" },
          { label: "Edit Configuration" },
        ]}
      />

      <InventoryConfigurationWizard
        initial={data.config}
        packages={data.packages}
        months={data.months}
        makkahHotels={data.makkahHotels}
        madinahHotels={data.madinahHotels}
        privateTrips={data.privateTrips}
        initialPrices={data.initialPrices}
        initialTripIds={data.initialTripIds}
      />
    </div>
  );
}
