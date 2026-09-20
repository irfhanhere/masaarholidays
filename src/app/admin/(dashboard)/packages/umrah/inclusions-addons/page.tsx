import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { InclusionsAddonsManager, type InclusionRow, type AddonRow } from "./InclusionsAddonsManager";

export const metadata: Metadata = {
  title: "Inclusions & Add-ons | Masaar Admin",
  robots: { index: false },
};

async function getData() {
  if (!isSupabaseConfigured()) return { inclusions: [], addons: [], privateTrips: [] };
  const supabase = await createClient();

  const [{ data: inclusions }, { data: addons }, { data: privateTrips }] = await Promise.all([
    supabase.from("package_inclusions_catalog").select("*").eq("category", "umrah").order("display_order", { ascending: true }),
    supabase.from("package_addons_catalog").select("*").eq("category", "umrah").order("display_order", { ascending: true }),
    supabase.from("private_trips").select("id, name, destination").order("display_order", { ascending: true }),
  ]);

  return {
    inclusions: (inclusions ?? []) as InclusionRow[],
    addons: (addons ?? []) as AddonRow[],
    privateTrips: privateTrips ?? [],
  };
}

export default async function InclusionsAddonsPage() {
  const data = await getData();

  return (
    <InclusionsAddonsManager
      inclusions={data.inclusions}
      addons={data.addons}
      privateTrips={data.privateTrips}
    />
  );
}
