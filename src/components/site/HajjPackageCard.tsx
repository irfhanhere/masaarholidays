import Link from "next/link";
import type { PackageRow } from "@/lib/types/database";
import { ExternalImage } from "./ExternalImage";
import { PackageEnquiryButton } from "./PackageEnquiryButton";
import { Price } from "./Price";

const TIER_LABEL: Record<PackageRow["tier"], string> = {
  essential: "Essential",
  signature: "Signature",
  exclusive: "Exclusive",
};

/**
 * Hajj-only compact card — image-top, tier badge, short inclusions,
 * a compact room-price mini-table, "From AED X", and a single calm-toned
 * CTA (no "Reserve", no dual-CTA — reuses the same enquiry popup every
 * other package CTA already uses). Deliberately separate from
 * PackageCard.tsx (Umrah's full-width horizontal card): a distinct visual
 * style for Hajj, not a variant of the Umrah one. See HajjPackageGrid.tsx.
 */
export function HajjPackageCard({
  pkg,
  roomPrices,
}: {
  pkg: PackageRow;
  roomPrices?: { room_type: string; price_aed: number }[];
}) {
  const featured = pkg.is_featured;
  const detailHref = `/hajj/${pkg.slug}`;

  // Same query-time computation as PackageCard.tsx — never trusts the
  // cached packages.starting_price_aed when roomPrices is available.
  const minPrice =
    roomPrices && roomPrices.length > 0
      ? Math.min(...roomPrices.map((r) => r.price_aed))
      : pkg.starting_price_aed;

  const inclusions = pkg.inclusions_text
    ?.split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 3);

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-lg border bg-white shadow-sm ${
        featured ? "border-pure-gold ring-1 ring-pure-gold" : "border-black/10"
      }`}
    >
      <Link href={detailHref} className="relative block h-36 w-full bg-warm-ivory">
        {pkg.hero_image_url && (
          <ExternalImage src={pkg.hero_image_url} alt={pkg.title} fill className="object-cover" />
        )}
        <span className="absolute left-2 top-2 rounded bg-masaar-black px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
          {TIER_LABEL[pkg.tier]}
        </span>
        {featured && (
          <span className="absolute right-2 top-2 rounded bg-pure-gold px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-masaar-black">
            Most Chosen
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link href={detailHref}>
          <h3 className="text-base font-semibold text-masaar-black hover:text-deep-gold">{pkg.title}</h3>
        </Link>

        {inclusions && inclusions.length > 0 && (
          <ul className="space-y-0.5 text-xs text-masaar-black/70">
            {inclusions.map((line) => (
              <li key={line} className="flex gap-1">
                <span className="text-pure-gold">•</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        )}

        {roomPrices && roomPrices.length > 0 && (
          <div className="mt-1 divide-y divide-black/5 rounded-md border border-black/10 text-xs">
            {roomPrices.map((rp) => (
              <div key={rp.room_type} className="flex justify-between px-2 py-1">
                <span className="text-masaar-black/60">{rp.room_type}</span>
                <span className="font-medium text-masaar-black">
                  <Price amountAed={rp.price_aed} />
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-auto pt-2">
          {minPrice != null && (
            <p className="text-xs text-masaar-black/50">
              From{" "}
              <span className="text-lg font-semibold text-masaar-black">
                <Price amountAed={minPrice} />
              </span>
            </p>
          )}
          <PackageEnquiryButton
            packageTitle={pkg.title}
            tier={TIER_LABEL[pkg.tier]}
            duration={pkg.duration_label || `${pkg.duration_days} Days`}
            className="mt-2 w-full"
          />
        </div>
      </div>
    </div>
  );
}
