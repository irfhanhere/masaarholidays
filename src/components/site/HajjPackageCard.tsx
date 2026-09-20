import Link from "next/link";
import type { PackageRow } from "@/lib/types/database";
import { ExternalImage } from "./ExternalImage";
import { PackageEnquiryTrigger } from "./PackageEnquiryTrigger";

const TIER_LABEL: Record<PackageRow["tier"], string> = {
  essential: "Essential",
  signature: "Signature",
  exclusive: "Exclusive",
};

/**
 * Hajj-only compact card — image-top, tier badge, short inclusions, and a
 * single calm-toned CTA (no "Reserve", no dual-CTA — reuses the same
 * enquiry popup every other package CTA already uses). Pricing is
 * deliberately not shown here — admin-controlled, to be re-enabled once
 * 2027 season pricing is confirmed. Deliberately separate from
 * PackageCard.tsx (Umrah's full-width horizontal card): a distinct visual
 * style for Hajj, not a variant of the Umrah one. See HajjPackageGrid.tsx.
 */
export function HajjPackageCard({ pkg }: { pkg: PackageRow }) {
  const featured = pkg.is_featured;
  const detailHref = `/hajj/${pkg.slug}`;

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

        <div className="mt-auto pt-2">
          <PackageEnquiryTrigger pkg={pkg} className="w-full" />
        </div>
      </div>
    </div>
  );
}
