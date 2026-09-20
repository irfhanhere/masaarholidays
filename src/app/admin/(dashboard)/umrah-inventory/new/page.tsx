import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type {
  HotelRow,
  PackageRow,
  PrivateTripRow,
  UmrahDepartureMonthRow,
} from "@/lib/types/database";
import { InventoryConfigurationWizard } from "../InventoryConfigurationWizard";

export const metadata: Metadata = {
  title: "New Inventory Configuration | Masaar Admin",
  robots: { index: false },
};

async function getData() {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();

  const [{ data: packages }, { data: months }, { data: hotels }, { data: trips }] =
    await Promise.all([
      supabase.from("packages").select("*").eq("type", "umrah").order("display_order", { ascending: true }),
      supabase.from("umrah_departure_months").select("*").order("sort_order", { ascending: true }),
      supabase.from("hotels").select("*").eq("is_active", true).order("name", { ascending: true }),
      supabase.from("private_trips").select("*").eq("status", "published").order("display_order", { ascending: true }),
    ]);

  const makkahHotels = (hotels ?? []).filter((h) => h.city.toLowerCase().includes("makkah"));
  const madinahHotels = (hotels ?? []).filter((h) => h.city.toLowerCase().includes("madinah"));

  return {
    packages: (packages ?? []) as PackageRow[],
    months: (months ?? []) as UmrahDepartureMonthRow[],
    makkahHotels: makkahHotels as HotelRow[],
    madinahHotels: madinahHotels as HotelRow[],
    privateTrips: (trips ?? []) as PrivateTripRow[],
  };
}

export default async function NewInventoryConfigurationPage() {
  const data = await getData();

  return (
    <div>
      <PageHeader
        title="Add Inventory Configuration"
        description="Create a new Umrah package configuration with journey options, hotels, pricing, and itinerary."
        breadcrumb={[
          { label: "Dashboard", href: "/admin" },
          { label: "Umrah Inventory", href: "/admin/umrah-inventory" },
          { label: "Add Configuration" },
        ]}
      />

      <InventoryConfigurationWizard
        packages={data?.packages ?? []}
        months={data?.months ?? []}
        makkahHotels={data?.makkahHotels ?? []}
        madinahHotels={data?.madinahHotels ?? []}
        privateTrips={data?.privateTrips ?? []}
      />
    </div>
  );
}
