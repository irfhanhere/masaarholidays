import Link from "next/link";
import type { PackageRow } from "@/lib/types/database";
import { packageGeneralMessage } from "@/lib/whatsapp-templates";
import { ExternalImage } from "./ExternalImage";
import { WhatsAppButton } from "./WhatsAppButton";

const TIER_LABEL: Record<PackageRow["tier"], string> = {
  essential: "Essential",
  signature: "Signature",
  prive: "Privé",
};

export function PackageCard({
  pkg,
  roomPrices,
}: {
  pkg: PackageRow;
  roomPrices?: { room_type: string; price_aed: number }[];
}) {
  const featured = pkg.is_featured;
  const detailHref = `/${pkg.type}/${pkg.slug}`;

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-lg border bg-white shadow-sm ${
        featured ? "border-pure-gold ring-1 ring-pure-gold" : "border-black/10"
      }`}
    >
      <Link href={detailHref} className="relative block h-44 w-full bg-warm-ivory">
        {pkg.hero_image_url && (
          <ExternalImage src={pkg.hero_image_url} alt={pkg.title} fill className="object-cover" />
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

        {roomPrices && roomPrices.length > 0 && (
          <div className="rounded-md bg-warm-ivory p-3 text-sm">
            {roomPrices.map((rp) => (
              <div key={rp.room_type} className="flex justify-between py-0.5">
                <span className="text-masaar-black/70">{rp.room_type}</span>
                <span className="font-medium text-masaar-black">
                  AED {rp.price_aed.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-end justify-between pt-2">
          {pkg.starting_price_aed != null && (
            <div>
              <p className="text-xs text-masaar-black/50">From</p>
              <p className="text-xl font-semibold text-masaar-black">
                AED {pkg.starting_price_aed.toLocaleString()}
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Link
            href={detailHref}
            className="flex-1 rounded-md border border-black/15 px-4 py-2.5 text-center text-sm font-semibold text-masaar-black hover:bg-warm-ivory"
          >
            View Details
          </Link>
          <WhatsAppButton message={packageGeneralMessage(pkg.type, pkg.tier)} className="flex-1">
            WhatsApp
          </WhatsAppButton>
        </div>
      </div>
    </div>
  );
}
