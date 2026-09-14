import { PageHeader } from "@/components/admin/ui";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { PackageType, TransferRow, TransferVehicleRow } from "@/lib/types/database";
import { PackageForm } from "../PackageForm";

export const metadata = { title: "Add Package | Masaar Admin", robots: { index: false } };

export default async function NewPackagePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const type: PackageType = (await searchParams).type === "hajj" ? "hajj" : "umrah";

  let transferOptions: TransferRow[] = [];
  let vehicleOptions: TransferVehicleRow[] = [];
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const [transfersRes, vehiclesRes] = await Promise.all([
      supabase.from("transfers").select("*").eq("is_active", true).order("display_order"),
      supabase.from("transfer_vehicles").select("*").eq("is_active", true).order("display_order"),
    ]);
    transferOptions = transfersRes.data ?? [];
    vehicleOptions = vehiclesRes.data ?? [];
  }

  return (
    <div>
      <PageHeader
        title={`Add ${type === "hajj" ? "Hajj" : "Umrah"} Package`}
        description="Create a new package to display on your website."
        breadcrumb={[
          { label: "Dashboard", href: "/admin" },
          { label: "Packages", href: "/admin/packages" },
          { label: "Add Package" },
        ]}
      />
      <PackageForm defaultType={type} transferOptions={transferOptions} vehicleOptions={vehicleOptions} />
    </div>
  );
}
