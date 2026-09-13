import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/ui";
import { createClient } from "@/lib/supabase/server";
import { PackageForm } from "../PackageForm";

export const metadata = { title: "Edit Package | Masaar Admin", robots: { index: false } };

export default async function EditPackagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: pkg }, { data: roomPrices }, { data: upgrade }] = await Promise.all([
    supabase.from("packages").select("*").eq("id", id).maybeSingle(),
    supabase.from("package_room_prices").select("room_type, price_aed").eq("package_id", id).order("display_order"),
    supabase.from("package_upgrades").select("id, label").eq("package_id", id).maybeSingle(),
  ]);

  if (!pkg) notFound();

  let upgradeRoomPrices: { room_type: string; price_aed: number }[] = [];
  if (upgrade) {
    const { data } = await supabase
      .from("package_upgrade_room_prices")
      .select("room_type, price_aed")
      .eq("upgrade_id", upgrade.id)
      .order("display_order");
    upgradeRoomPrices = data ?? [];
  }

  return (
    <div>
      <PageHeader
        title={`Edit ${pkg.title}`}
        breadcrumb={[
          { label: "Dashboard", href: "/admin" },
          { label: "Packages", href: "/admin/packages" },
          { label: "Edit" },
        ]}
      />
      <PackageForm
        packageId={pkg.id}
        initial={pkg}
        initialRoomPrices={roomPrices ?? []}
        initialUpgrade={upgrade}
        initialUpgradeRoomPrices={upgradeRoomPrices}
      />
    </div>
  );
}
