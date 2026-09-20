import Image from "next/image";
import Link from "next/link";
import type { PackageRow } from "@/lib/types/database";
import type { PublicUmrahInventoryConfig } from "@/lib/data/public";
import { ExternalImage } from "./ExternalImage";
import { PackageEnquiryButton } from "./PackageEnquiryButton";
import { Price } from "./Price";

const TIER_ORDER: Array<PackageRow["tier"]> = ["essential", "signature", "exclusive"];

const TIER_BADGES: Record<PackageRow["tier"], { label: string; tag: string }> = {
  essential: { label: "ESSENTIAL", tag: "Smart & Budget Friendly" },
  signature: { label: "SIGNATURE", tag: "Most Chosen" },
  exclusive: { label: "EXCLUSIVE", tag: "VIP & Maximum Comfort" },
};

interface Props {
  packages: PackageRow[];
  inventoryConfigs: PublicUmrahInventoryConfig[];
}

export function Umrah3CardGrid({ packages, inventoryConfigs }: Props) {
  // Sort packages by Essential -> Signature -> Exclusive
  const orderedPackages = TIER_ORDER.map((tier) => packages.find((p) => p.tier === tier)).filter(
    (p): p is PackageRow => Boolean(p)
  );

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {orderedPackages.map((pkg) => {
        // Find published configs for this package tier
        const tierConfigs = inventoryConfigs.filter((c) => c.package_id === pkg.id);
        const makkahOnlyConfigs = tierConfigs.filter((c) => c.journey_type === "makkah_only");

        // Pick default lowest price config for Makkah Only (or any config for this tier)
        const defaultConfig = (makkahOnlyConfigs.length > 0 ? makkahOnlyConfigs : tierConfigs).sort((a, b) => {
          if (!a.min_price_aed) return 1;
          if (!b.min_price_aed) return -1;
          return a.min_price_aed - b.min_price_aed;
        })[0];

        // Overall starting price across all published configs for this tier
        const allPrices = tierConfigs.flatMap((c) => c.room_prices.map((r) => r.price_aed));
        const minStartingPrice =
          allPrices.length > 0
            ? Math.min(...allPrices)
            : pkg.starting_price_aed;

        const makkahHotelName = defaultConfig?.makkah_hotel?.name || pkg.makkah_hotel_name || "Makkah 4★ Hotel";
        const madinahHotelName = defaultConfig?.madinah_hotel?.name || pkg.madinah_hotel_name;

        const detailHref = `/umrah/${pkg.slug}`;
        const isFeatured = pkg.tier === "signature";

        return (
          <div
            key={pkg.id}
            className={`flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-all hover:shadow-md ${
              isFeatured ? "border-pure-gold ring-2 ring-pure-gold/50" : "border-black/10"
            }`}
          >
            {/* Header / Image banner */}
            <div className="relative h-48 w-full bg-masaar-black">
              {pkg.hero_image_url ? (
                <ExternalImage src={pkg.hero_image_url} alt={pkg.title} fill className="object-cover opacity-80" />
              ) : (
                <Image src="/brand/banners/umrah.png" alt={pkg.title} fill className="object-cover opacity-60" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-masaar-black/90 via-masaar-black/30 to-transparent" />

              <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                <span className="rounded bg-masaar-black/80 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                  {TIER_BADGES[pkg.tier]?.label || pkg.tier}
                </span>
                {isFeatured && (
                  <span className="rounded bg-pure-gold px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-masaar-black shadow-sm">
                    Most Chosen
                  </span>
                )}
              </div>

              <div className="absolute bottom-4 left-4 right-4 text-white">
                <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold">{pkg.title}</h3>
                {pkg.tagline && <p className="text-xs text-light-gold">{pkg.tagline}</p>}
              </div>
            </div>

            {/* Body Content */}
            <div className="flex flex-1 flex-col justify-between p-6 space-y-6">
              <div className="space-y-4">
                {/* Description */}
                {pkg.short_description && (
                  <p className="text-xs leading-relaxed text-masaar-black/70 sm:text-sm">
                    {pkg.short_description}
                  </p>
                )}

                {/* Duration & Route */}
                <div className="rounded-lg bg-warm-ivory/70 p-3 text-xs">
                  <div className="flex items-center justify-between font-semibold text-masaar-black">
                    <span>{defaultConfig?.duration_label || `${pkg.duration_days} Days / ${pkg.duration_nights} Nights`}</span>
                    <span className="text-deep-gold">
                      {defaultConfig?.journey_type === "makkah_madinah" ? "Makkah + Madinah" : "Makkah Only"}
                    </span>
                  </div>
                </div>

                {/* Hotels Block */}
                <div className="rounded-lg border border-black/10 bg-warm-ivory/40 p-4 text-xs space-y-2.5">
                  <div>
                    <span className="font-bold text-deep-gold uppercase tracking-wider text-[10px]">Makkah Hotel:</span>
                    <p className="font-semibold text-masaar-black">
                      {makkahHotelName}
                      {defaultConfig?.makkah_allow_similar && (
                        <span className="ml-1 text-[10px] font-normal text-masaar-black/50">(or similar)</span>
                      )}
                    </p>
                    {defaultConfig?.makkah_custom_note && (
                      <p className="text-[11px] text-masaar-black/60">{defaultConfig.makkah_custom_note}</p>
                    )}
                  </div>

                  {madinahHotelName && (
                    <div className="border-t border-black/10 pt-2">
                      <span className="font-bold text-deep-gold uppercase tracking-wider text-[10px]">Madinah Hotel:</span>
                      <p className="font-semibold text-masaar-black">
                        {madinahHotelName}
                        {defaultConfig?.madinah_allow_similar && (
                          <span className="ml-1 text-[10px] font-normal text-masaar-black/50">(or similar)</span>
                        )}
                      </p>
                      {defaultConfig?.madinah_custom_note && (
                        <p className="text-[11px] text-masaar-black/60">{defaultConfig.madinah_custom_note}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Room Price Chips preview */}
                {defaultConfig && defaultConfig.room_prices.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {defaultConfig.room_prices.map((rp) => (
                      <span
                        key={rp.occupancy_type}
                        className="rounded bg-warm-ivory px-2 py-1 text-[11px] font-medium text-masaar-black/80"
                      >
                        {rp.occupancy_type}: <Price amountAed={rp.price_aed} />
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Price & Actions Footer */}
              <div className="border-t border-black/10 pt-4">
                {minStartingPrice != null && (
                  <div className="mb-4">
                    <span className="text-xs text-masaar-black/50">Starting from</span>
                    <div className="text-2xl font-bold text-masaar-black">
                      <Price amountAed={minStartingPrice} />
                      <span className="text-xs font-normal text-masaar-black/60"> / person</span>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Link
                    href={detailHref}
                    className="flex-1 rounded-md border border-black/20 bg-white py-2.5 text-center text-xs font-semibold text-masaar-black hover:bg-warm-ivory"
                  >
                    View Details
                  </Link>
                  <PackageEnquiryButton
                    packageTitle={pkg.title}
                    tier={TIER_BADGES[pkg.tier]?.label || pkg.tier}
                    duration={defaultConfig?.duration_label || `${pkg.duration_days} Days`}
                    configurationId={defaultConfig?.id}
                    journeyType={defaultConfig?.journey_type}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
