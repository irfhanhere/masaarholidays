import Link from "next/link";
import type { Metadata } from "next";
import { Badge, PageHeader, PrimaryButton, SecondaryButton } from "@/components/admin/ui";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { PackageRow } from "@/lib/types/database";

export const metadata: Metadata = { title: "Umrah Package Tiers | Masaar Admin", robots: { index: false } };

async function getUmrahPackageTiers(): Promise<PackageRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("packages")
    .select("*")
    .eq("type", "umrah")
    .order("display_order", { ascending: true });
  return data ?? [];
}

export default async function AdminUmrahPackagesPage() {
  const packages = await getUmrahPackageTiers();

  return (
    <div>
      <PageHeader
        title="Umrah Package Tiers"
        description="Manage the master package tiers (Essential, Signature, Exclusive) and default hotel assignments."
        breadcrumb={[
          { label: "Dashboard", href: "/admin" },
          { label: "Packages", href: "/admin/packages" },
          { label: "Umrah" },
        ]}
      />

      <div className="grid gap-6 md:grid-cols-3">
        {packages.map((pkg) => (
          <div key={pkg.id} className="rounded-xl border border-black/10 bg-white p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <Badge tone={pkg.tier === "essential" ? "green" : pkg.tier === "signature" ? "amber" : "gold"}>
                {pkg.tier.toUpperCase()}
              </Badge>
              {pkg.is_featured && <span className="text-xs font-bold text-deep-gold">Most Chosen</span>}
            </div>

            <div>
              <h3 className="text-lg font-bold text-masaar-black">{pkg.title}</h3>
              <p className="text-xs text-masaar-black/60 line-clamp-2 mt-1">
                {pkg.short_description || pkg.tagline || "Spiritual Umrah experience."}
              </p>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-black/5 text-xs text-masaar-black/70">
              <p><strong>Makkah Default:</strong> {pkg.makkah_hotel_name || "VOCO Makkah"}</p>
              <p><strong>Madinah Default:</strong> {pkg.madinah_hotel_name || "Zowar International"}</p>
            </div>

            <div className="pt-2">
              <Link href={`/admin/packages/umrah/${pkg.id}`}>
                <PrimaryButton type="button" className="w-full">
                  Edit Package Tier
                </PrimaryButton>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
