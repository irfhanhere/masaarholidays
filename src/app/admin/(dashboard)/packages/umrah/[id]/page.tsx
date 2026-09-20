import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PackageTierForm } from "../PackageTierForm";
import type { HotelRow } from "@/lib/types/database";
import type { AddonRow } from "../inclusions-addons/InclusionsAddonsManager";

export const metadata = { title: "Edit Package Tier | Masaar Admin", robots: { index: false } };

export default async function EditPackageTierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: pkg }, { data: hotels }, { data: addonsCatalog }] = await Promise.all([
    supabase.from("packages").select("*").eq("id", id).maybeSingle(),
    supabase.from("hotels").select("*").eq("is_active", true).order("name", { ascending: true }),
    supabase.from("package_addons_catalog").select("*").eq("category", "umrah").order("display_order", { ascending: true }),
  ]);

  if (!pkg) notFound();

  return (
    <PackageTierForm
      packageData={pkg}
      hotels={(hotels ?? []) as HotelRow[]}
      addonsCatalog={(addonsCatalog ?? []) as AddonRow[]}
    />
  );
}
