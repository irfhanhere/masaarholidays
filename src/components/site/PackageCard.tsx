import Image from "next/image";
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

export function PackageCard({
  pkg,
  roomPrices,
  departureMonthSlug,
  departureMonthLabel,
  fallbackImageUrl,
}: {
  pkg: PackageRow;
  roomPrices?: { room_type: string; price_aed: number }[];
  /** Set only when rendered on an Umrah departure-month page — carried forward onto the "View Details" link (?month=slug) so the detail page's own enquiry popup can mention it too, and passed straight into this card's own popup. */
  departureMonthSlug?: string;
  departureMonthLabel?: string;
  /** Used only when pkg.hero_image_url is unset — an existing site asset, not package data, so callers that need a photo (e.g. the Home page tier cards) don't have to touch packages.hero_image_url to get one. */
  fallbackImageUrl?: string;
}) {
  const featured = pkg.is_featured;
  const detailHref = departureMonthSlug
    ? `/${pkg.type}/${pkg.slug}?month=${departureMonthSlug}`
    : `/${pkg.type}/${pkg.slug}`;

  // Computed live from the room prices this card was actually given —
  // never trusts the cached packages.starting_price_aed when roomPrices
  // is available, so this can't drift from the room list shown right
  // below it. Falls back to the cached column only when a caller hasn't
  // passed roomPrices at all (e.g. the homepage's featured-packages grid).
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
      className={`flex flex-col overflow-hidden rounded-lg border bg-white shadow-sm sm:flex-row ${
        featured ? "border-pure-gold ring-1 ring-pure-gold" : "border-black/10"
      }`}
    >
      <Link
        href={detailHref}
        className="relative h-48 w-full shrink-0 bg-warm-ivory sm:h-auto sm:w-64 sm:self-stretch md:w-80"
      >
        {pkg.hero_image_url ? (
          <ExternalImage src={pkg.hero_image_url} alt={pkg.title} fill className="object-cover" />
        ) : (
          fallbackImageUrl && <Image src={fallbackImageUrl} alt={pkg.title} fill className="object-cover" />
        )}
        <span className="absolute left-3 top-3 rounded bg-masaar-black px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
          {TIER_LABEL[pkg.tier]}
        </span>
        {featured && (
          <span className="absolute right-3 top-3 rounded bg-pure-gold px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-masaar-black">
            Most Chosen
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <Link href={detailHref}>
            <h3 className="text-lg font-semibold text-masaar-black hover:text-deep-gold">{pkg.title}</h3>
          </Link>
          {pkg.city_destination && (
            <p className="text-sm text-masaar-black/60">{pkg.city_destination}</p>
          )}
        </div>

        <p className="text-sm text-masaar-black/70">{pkg.duration_label || `${pkg.duration_days} Days`}</p>

        {inclusions && inclusions.length > 0 && (
          <ul className="grid gap-x-6 gap-y-1 text-sm text-masaar-black/70 sm:grid-cols-2">
            {inclusions.map((line) => (
              <li key={line} className="flex gap-1.5">
                <span className="text-pure-gold">•</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        )}

        {roomPrices && roomPrices.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {roomPrices.map((rp) => (
              <div key={rp.room_type} className="rounded-md bg-warm-ivory px-3 py-1.5 text-sm">
                <span className="text-masaar-black/70">{rp.room_type}</span>{" "}
                <span className="font-semibold text-masaar-black">
                  <Price amountAed={rp.price_aed} />
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-auto flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
          {minPrice != null && (
            <div>
              <p className="text-xs text-masaar-black/50">From</p>
              <p className="text-xl font-semibold text-masaar-black">
                <Price amountAed={minPrice} />
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Link
              href={detailHref}
              className="flex-1 rounded-md border border-black/15 px-4 py-2.5 text-center text-sm font-semibold text-masaar-black hover:bg-warm-ivory sm:flex-none"
            >
              View Details
            </Link>
            <PackageEnquiryButton
              packageTitle={pkg.title}
              tier={TIER_LABEL[pkg.tier]}
              duration={pkg.duration_label || `${pkg.duration_days} Days`}
              departureMonth={departureMonthLabel}
              className="flex-1 sm:flex-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
