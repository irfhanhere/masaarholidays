import Link from "next/link";
import type { Metadata } from "next";
import { Badge, EmptyRow, PageHeader, PrimaryButton, SecondaryButton } from "@/components/admin/ui";
import { createClient } from "@/lib/supabase/server";
import { getPackageRoomPricesByPackageIds } from "@/lib/data/public";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { PackageRow, PackageTier, PackageType } from "@/lib/types/database";
import { deletePackage, togglePackageActive } from "./actions";

export const metadata: Metadata = { title: "Packages | Masaar Admin", robots: { index: false } };

const TIER_TONE: Record<PackageRow["tier"], "green" | "amber" | "gold"> = {
  essential: "green",
  signature: "amber",
  exclusive: "gold",
};

const TIER_LABEL: Record<PackageTier, string> = {
  essential: "Essential",
  signature: "Signature",
  exclusive: "Exclusive",
};

const TIER_ORDER: PackageTier[] = ["essential", "signature", "exclusive"];

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
  // "Starting From" is computed live from package_room_prices here too —
  // not read from the cached packages.starting_price_aed column — so it
  // always matches what a visitor would actually see, per admin instructions
  // request not to add a new stored column for this.
  const roomPricesByPackage = await getPackageRoomPricesByPackageIds(packages.map((p) => p.id));

  // Group into tiers — each tier can now hold multiple duration variants
  // (rows sharing the same type + tier), sorted shortest duration first.
  const tierGroups = TIER_ORDER.map((tier) => ({
    tier,
    packages: packages.filter((p) => p.tier === tier).sort((a, b) => a.duration_nights - b.duration_nights),
  })).filter((g) => g.packages.length > 0);

  return (
    <div>
      <PageHeader
        title="Packages"
        description="Manage the packages displayed on your website. Each tier can offer several duration options."
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

      {tierGroups.length === 0 && (
        <div className="rounded-lg border border-dashed border-black/15 bg-white px-6 py-10 text-center text-sm text-masaar-black/50">
          No {type} packages yet.
        </div>
      )}

      <div className="space-y-6">
        {tierGroups.map(({ tier, packages: tierPackages }) => (
          <div key={tier} className="overflow-x-auto rounded-lg border border-black/10 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/10 bg-admin-surface px-4 py-3">
              <div className="flex items-center gap-2">
                <Badge tone={TIER_TONE[tier]}>{TIER_LABEL[tier]}</Badge>
                <p className="text-sm text-masaar-black/70">
                  {tierPackages[0].title}
                  {tierPackages[0].is_featured && <span className="ml-2 text-xs text-deep-gold">Most Chosen</span>}
                </p>
              </div>
              <Link href={`/admin/packages/new?type=${type}&cloneFrom=${tierPackages[0].id}`}>
                <SecondaryButton type="button">+ Add Duration</SecondaryButton>
              </Link>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="border-b border-black/10 text-xs uppercase text-masaar-black/50">
                <tr>
                  <th className="px-4 py-3">Package Title</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3">City / Destination</th>
                  <th className="px-4 py-3">Starting From (AED)</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {tierPackages.length === 0 && <EmptyRow colSpan={7}>No duration variants yet.</EmptyRow>}
                {tierPackages.map((pkg) => {
                  const roomPrices = roomPricesByPackage.get(pkg.id) ?? [];
                  const minPrice = roomPrices.length > 0 ? Math.min(...roomPrices.map((r) => r.price_aed)) : null;
                  return (
                    <tr key={pkg.id}>
                      <td className="px-4 py-3 font-medium text-masaar-black">
                        <div>{pkg.title}</div>
                        {pkg.tagline && <div className="text-xs text-masaar-black/50">{pkg.tagline}</div>}
                      </td>
                      <td className="px-4 py-3 text-xs text-masaar-black/80 whitespace-nowrap">
                        {pkg.duration_label || `${pkg.duration_nights} Nights`}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-masaar-black/60">{pkg.slug}</td>
                      <td className="px-4 py-3 text-masaar-black/70">{pkg.city_destination ?? "—"}</td>
                      <td className="px-4 py-3 text-masaar-black/70">
                        {minPrice != null ? `AED ${minPrice.toLocaleString()}` : "—"}
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
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
