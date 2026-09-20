import type { PackageRow, PackageTier } from "@/lib/types/database";
import { EmptyState } from "./SectionHeading";
import { HajjPackageCard } from "./HajjPackageCard";

const TIER_ORDER: PackageTier[] = ["essential", "signature", "exclusive"];

/**
 * Hajj-only listing grid — a deliberately separate component from
 * PackageGrid.tsx (Umrah's tier-first grouping), not a shared/parameterized
 * version of it: Hajj groups by DURATION first ("10 Day Hajj Packages",
 * "14 Day Hajj Packages", ...), then shows that duration's Essential/
 * Signature/Exclusive cards side by side — the inverse of Umrah's tier-first,
 * duration-second grouping. Forcing one component to do both would mean
 * threading a "group by" mode through PackageGrid's tier-section markup,
 * short_description handling, etc., for two genuinely different page
 * layouts — a second component is the smaller, safer change, and leaves
 * Umrah's grid completely untouched.
 *
 * A duration section only appears if at least one tier has an active
 * package at that length, same graceful-degrade pattern as PackageGrid.
 */
export function HajjPackageGrid({
  packages,
  emptyTitle,
  emptyNote,
}: {
  packages: PackageRow[];
  emptyTitle: string;
  emptyNote?: string;
}) {
  if (packages.length === 0) {
    return <EmptyState title={emptyTitle} note={emptyNote} />;
  }

  const durationDays = [...new Set(packages.map((p) => p.duration_days))].sort((a, b) => a - b);

  const durationGroups = durationDays
    .map((days) => ({
      days,
      items: TIER_ORDER.map((tier) => packages.find((p) => p.duration_days === days && p.tier === tier)).filter(
        (p): p is PackageRow => Boolean(p)
      ),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="space-y-10">
      {durationGroups.map(({ days, items }) => (
        <div key={days}>
          <h3 className="mb-4 text-lg font-semibold text-masaar-black">{days} Day Hajj Packages</h3>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((pkg) => (
              <HajjPackageCard key={pkg.id} pkg={pkg} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
