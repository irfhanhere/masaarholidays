import Link from "next/link";
import type { PackageRow } from "@/lib/types/database";
import { ExternalImage } from "./ExternalImage";
import { PackageEnquiryTrigger } from "./PackageEnquiryTrigger";

const TIER_THEME: Record<
  PackageRow["tier"],
  { badgeBg: string; badgeText: string; label: string; shifting: string }
> = {
  essential: {
    badgeBg: "bg-slate-700",
    badgeText: "text-white",
    label: "Essential",
    shifting: "Shifting",
  },
  signature: {
    badgeBg: "bg-amber-700",
    badgeText: "text-white",
    label: "Signature",
    shifting: "Shifting",
  },
  exclusive: {
    badgeBg: "bg-masaar-black",
    badgeText: "text-pure-gold",
    label: "Exclusive",
    shifting: "Non-Shifting",
  },
};

export function HajjPackageCard({ pkg }: { pkg: PackageRow }) {
  const featured = pkg.is_featured;
  const detailHref = `/hajj/${pkg.slug}`;
  const theme = TIER_THEME[pkg.tier] || TIER_THEME.signature;

  const inclusions = pkg.inclusions_text
    ?.split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 4);

  return (
    <div
      className={`group flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-all hover:shadow-md ${
        featured ? "border-pure-gold ring-1 ring-pure-gold/50" : "border-black/10"
      }`}
    >
      <Link href={detailHref} className="relative block h-44 w-full overflow-hidden bg-warm-ivory">
        {pkg.hero_image_url && (
          <ExternalImage
            src={pkg.hero_image_url}
            alt={pkg.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Top Badges */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <span className={`rounded px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${theme.badgeBg} ${theme.badgeText}`}>
            {theme.label}
          </span>
          <span className="rounded bg-white/90 backdrop-blur-sm px-2 py-0.5 text-[11px] font-semibold text-masaar-black">
            {theme.shifting}
          </span>
        </div>

        {featured && (
          <span className="absolute right-3 top-3 rounded bg-pure-gold px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-masaar-black shadow-sm">
            Recommended
          </span>
        )}

        {/* Bottom Image Overlay Info */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs text-white">
          <span className="font-semibold drop-shadow">{pkg.duration_days} Days / {pkg.duration_nights} Nights</span>
          {pkg.maktab_category && (
            <span className="rounded bg-black/40 px-2 py-0.5 text-[10px] backdrop-blur-sm">
              {pkg.maktab_category}
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div>
          <Link href={detailHref}>
            <h4 className="text-lg font-bold text-masaar-black transition-colors hover:text-deep-gold">
              {pkg.title}
            </h4>
          </Link>
          {pkg.city_destination && (
            <p className="mt-1 text-xs font-medium text-masaar-black/60">
              📍 {pkg.city_destination}
            </p>
          )}
        </div>

        {pkg.tagline && (
          <p className="mt-2 text-xs italic text-masaar-black/75 line-clamp-1">
            &ldquo;{pkg.tagline}&rdquo;
          </p>
        )}

        {/* Key Inclusions Highlights */}
        {inclusions && inclusions.length > 0 && (
          <div className="my-4 border-t border-black/5 pt-3">
            <ul className="space-y-1.5 text-xs text-masaar-black/80">
              {inclusions.map((line) => (
                <li key={line} className="flex items-start gap-1.5">
                  <span className="text-pure-gold font-bold">✓</span>
                  <span className="line-clamp-1">{line}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action & Status */}
        <div className="mt-auto border-t border-black/10 pt-3">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium text-masaar-black/50">Hajj 2027 Season</span>
            <span className="font-semibold text-deep-gold">Price on Request</span>
          </div>

          <PackageEnquiryTrigger pkg={pkg} className="w-full" />

          <div className="mt-2 text-center">
            <Link
              href={detailHref}
              className="text-xs font-semibold text-masaar-black/70 hover:text-deep-gold hover:underline"
            >
              View Inclusions & Details →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
