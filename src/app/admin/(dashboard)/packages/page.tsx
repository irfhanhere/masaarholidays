import Link from "next/link";
import type { Metadata } from "next";
import { Badge, EmptyRow, PageHeader, PrimaryButton, SecondaryButton } from "@/components/admin/ui";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { PackageRow, PackageType } from "@/lib/types/database";
import { deletePackage, togglePackageActive } from "./actions";

export const metadata: Metadata = { title: "Packages | Masaar Admin", robots: { index: false } };

const TIER_TONE: Record<PackageRow["tier"], "green" | "amber" | "gold"> = {
  essential: "green",
  signature: "amber",
  prive: "gold",
};

async function getPackages(type: PackageType): Promise<PackageRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("packages")
    .select("*")
    .eq("type", type)
    .order("display_order", { ascending: true });
  return data ?? [];
}

export default async function AdminPackagesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const type: PackageType = (await searchParams).type === "hajj" ? "hajj" : "umrah";
  const packages = await getPackages(type);

  return (
    <div>
      <PageHeader
        title="Packages"
        description="Manage the packages displayed on your website."
        breadcrumb={[{ label: "Dashboard", href: "/admin" }, { label: "Packages" }]}
        actions={
          <Link href={`/admin/packages/new?type=${type}`}>
            <PrimaryButton>+ Add Package</PrimaryButton>
          </Link>
        }
      />

      <div className="mb-4 flex gap-2">
        <Link href="/admin/packages?type=umrah">
          {type === "umrah" ? <PrimaryButton>Umrah Packages</PrimaryButton> : <SecondaryButton>Umrah Packages</SecondaryButton>}
        </Link>
        <Link href="/admin/packages?type=hajj">
          {type === "hajj" ? <PrimaryButton>Hajj Packages</PrimaryButton> : <SecondaryButton>Hajj Packages</SecondaryButton>}
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-black/10 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/10 bg-admin-surface text-xs uppercase text-masaar-black/50">
            <tr>
              <th className="px-4 py-3">Package</th>
              <th className="px-4 py-3">Tier</th>
              <th className="px-4 py-3">City / Destination</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Starting From (AED)</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {packages.length === 0 && <EmptyRow colSpan={7}>No {type} packages yet.</EmptyRow>}
            {packages.map((pkg) => (
              <tr key={pkg.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-masaar-black">{pkg.title}</p>
                  {pkg.is_featured && <span className="text-xs text-deep-gold">Most Chosen</span>}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={TIER_TONE[pkg.tier]}>{pkg.tier}</Badge>
                </td>
                <td className="px-4 py-3 text-masaar-black/70">{pkg.city_destination ?? "—"}</td>
                <td className="px-4 py-3 text-masaar-black/70">{pkg.duration_days} Days</td>
                <td className="px-4 py-3 text-masaar-black/70">
                  {pkg.starting_price_aed != null ? `AED ${pkg.starting_price_aed.toLocaleString()}` : "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={pkg.is_active ? "green" : "gray"}>{pkg.is_active ? "Active" : "Inactive"}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/packages/${pkg.id}`} className="text-sm font-medium text-admin-primary">
                      Edit
                    </Link>
                    <form action={togglePackageActive.bind(null, pkg.id, !pkg.is_active)}>
                      <button type="submit" className="text-sm text-masaar-black/60 underline">
                        {pkg.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </form>
                    <form action={deletePackage.bind(null, pkg.id)}>
                      <button type="submit" className="text-sm text-red-600 underline">
                        Delete
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
