import type { PackageRow, PackageTier } from "@/lib/types/database";
import { getPackageRoomPricesByPackageIds } from "@/lib/data/public";
import { EmptyState } from "./SectionHeading";
import { PackageCard } from "./PackageCard";

const TIER_ORDER: PackageTier[] = ["essential", "signature", "exclusive"];
const TIER_LABEL: Record<PackageTier, string> = {
  essential: "Essential",
  signature: "Signature",
  exclusive: "Exclusive",
};

/**
 * The package tier grid — reused as-is by /umrah, /hajj and Umrah
 * departure month pages (components/site/PackageGrid.tsx), so all three
 * pick up any change here automatically. Groups packages into labeled
 * Essential/Signature/Exclusive sections, each showing that tier's
 * short_description once, followed by its card(s); a tier with zero
 * active duration variants is simply skipped (no empty heading). Every
 * duration-variant sibling is now a full-width horizontal PackageCard
 * (see PackageCard.tsx), stacked vertically — this replaced an earlier
 * grid-based layout that had to special-case a single-card tier to
 * avoid dead space next to it; a full-width card has no such case to
 * special-case, single or multiple.
 *
 * An async Server Component — it does its own batched room-price fetch
 * for exactly the packages it's given, so every card can show a live
 * "starting from" figure and room-pricing list without every caller
 * having to fetch and wire that up separately.
 */
export async function PackageGrid({
  packages,
  emptyTitle,
  emptyNote,
  departureMonthSlug,
  departureMonthLabel,
}: {
  packages: PackageRow[];
  emptyTitle: string;
  emptyNote?: string;
  /** Set only by the Umrah departure-month page — forwarded onto every card so each one's "View Details" link and enquiry popup can mention this month. Omitted on /umrah and /hajj themselves. */
  departureMonthSlug?: string;
  departureMonthLabel?: string;
}) {
  if (packages.length === 0) {
    return <EmptyState title={emptyTitle} note={emptyNote} />;
  }

  const roomPricesByPackage = await getPackageRoomPricesByPackageIds(packages.map((p) => p.id));

  const tierGroups = TIER_ORDER.map((tier) => ({
    tier,
    items: packages.filter((p) => p.tier === tier).sort((a, b) => a.duration_nights - b.duration_nights),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-10">
      {tierGroups.map(({ tier, items }) => (
        <div key={tier}>
          <h3 className="text-lg font-semibold text-masaar-black">{TIER_LABEL[tier]}</h3>
          <p className="mb-4 mt-1 text-sm text-masaar-black/60">
            {items[0].short_description || "Description pending"}
          </p>
          <div className="space-y-4">
            {items.map((pkg) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                roomPrices={roomPricesByPackage.get(pkg.id) ?? []}
                departureMonthSlug={departureMonthSlug}
                departureMonthLabel={departureMonthLabel}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
