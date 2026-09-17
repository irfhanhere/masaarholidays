import { PageHeader } from "@/components/admin/ui";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { PackageRow, PackageType, TransferRow, TransferVehicleRow } from "@/lib/types/database";
import { PackageForm } from "../PackageForm";

export const metadata = { title: "Add Package | Masaar Admin", robots: { index: false } };

export default async function NewPackagePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; cloneFrom?: string }>;
}) {
  const { type: typeParam, cloneFrom } = await searchParams;
  const type: PackageType = typeParam === "hajj" ? "hajj" : "umrah";

  let transferOptions: TransferRow[] = [];
  let vehicleOptions: TransferVehicleRow[] = [];
  let clonedInitial: PackageRow | undefined;
  let isNewDuration = false;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const [transfersRes, vehiclesRes] = await Promise.all([
      supabase.from("transfers").select("*").eq("is_active", true).order("display_order"),
      supabase.from("transfer_vehicles").select("*").eq("is_active", true).order("display_order"),
    ]);
    transferOptions = transfersRes.data ?? [];
    vehicleOptions = vehiclesRes.data ?? [];

    if (cloneFrom) {
      const { data: source } = await supabase.from("packages").select("*").eq("id", cloneFrom).maybeSingle();
      if (source) {
        isNewDuration = true;
        clonedInitial = {
          ...source,
          duration_nights: undefined as unknown as number, // force a deliberate, distinct value
          duration_days: undefined as unknown as number,
          // New duration rows start inactive — real pricing is still pending, same as the
          // existing placeholder packages — regardless of whether the sibling being cloned is live.
          is_active: false,
          show_on_website: false,
        };
      }
    }
  }

  return (
    <div>
      <PageHeader
        title={isNewDuration ? `Add Duration — ${clonedInitial?.title}` : `Add ${type === "hajj" ? "Hajj" : "Umrah"} Package`}
        description={
          isNewDuration
            ? "Title and other tier-level copy are pre-filled from the existing tier and stay in sync with it — just set the new duration, slug details and pricing."
            : "Create a new package to display on your website."
        }
        breadcrumb={[
          { label: "Dashboard", href: "/admin" },
          { label: "Packages", href: "/admin/packages" },
          { label: isNewDuration ? "Add Duration" : "Add Package" },
        ]}
      />
      <PackageForm
        defaultType={type}
        initial={clonedInitial}
        transferOptions={transferOptions}
        vehicleOptions={vehicleOptions}
      />
    </div>
  );
}
