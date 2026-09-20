import Image from "next/image";
import Link from "next/link";
import type { PackageRow } from "@/lib/types/database";
import type { PublicHotelRow } from "@/lib/types/database";
import { formatCardWalkTime, getTerrainCategory } from "@/lib/hotel-format";
import { ExternalImage } from "./ExternalImage";
import { PackageEnquiryTrigger } from "./PackageEnquiryTrigger";
import { Price } from "./Price";

const TIER_LABEL: Record<PackageRow["tier"], string> = {
  essential: "Essential",
  signature: "Signature",
  exclusive: "Exclusive",
};

function RouteIcon({ label }: { label: string }) {
  const isAirport = label.toLowerCase().includes("airport");
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-warm-ivory text-deep-gold">
      {isAirport ? (
        <svg className="size-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M10.5 21l1.5-4.5m0 0l1.5 4.5m-1.5-4.5V10m0 0L3 6.5 4 5l7 3V3.5A1.5 1.5 0 0112.5 2v0A1.5 1.5 0 0114 3.5V8l7-3 1 1.5-8 3.5" />
        </svg>
      ) : (
        <svg className="size-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 21h18M5 21V7l7-4 7 4v14M9 9h1m4 0h1m-6 4h1m4 0h1m-6 4h1m4 0h1" />
        </svg>
      )}
    </span>
  );
}

/** One "Your Stay" hotel entry — real hotel record (image, walk time, terrain) when a name match was found, otherwise falls back to just the package's own free-text hotel name/note (never fabricated). */
function StayEntry({
  cityLabel,
  hotelName,
  accessTag,
  matchedHotel,
}: {
  cityLabel: string;
  hotelName: string;
  accessTag: string | null;
  matchedHotel: PublicHotelRow | null;
}) {
  const walkTime = matchedHotel ? formatCardWalkTime(matchedHotel) : null;
  const terrain = matchedHotel ? getTerrainCategory(matchedHotel) : null;
  const image = matchedHotel?.image_url;

  return (
    <div className="flex items-center gap-3">
      <div className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-warm-ivory">
        {image ? (
          <ExternalImage src={image} alt={hotelName} fill className="object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-deep-gold">
            <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M3 21h18M5 21V7l7-4 7 4v14M9 9h1m4 0h1m-6 4h1m4 0h1" />
            </svg>
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-masaar-black/45">{cityLabel}</p>
        <p className="truncate text-sm font-semibold text-masaar-black">{hotelName}</p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-masaar-black/55">
          {walkTime && (
            <span className="flex items-center gap-1">
              <svg className="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {walkTime}
            </span>
          )}
          {terrain && <span>{terrain}</span>}
          {!matchedHotel && accessTag && <span>{accessTag}</span>}
        </div>
      </div>
    </div>
  );
}

export function FeaturedPackageCard({
  pkg,
  roomPrices,
  durationLabel,
  fallbackImageUrl,
  makkahHotel,
  madinahHotel,
}: {
  pkg: PackageRow;
  roomPrices?: { room_type: string; price_aed: number }[];
  /** Overrides pkg.duration_label/duration_days — the caller has resolved a specific inventory configuration whose duration should be shown instead of the tier row's own (stale/legacy) duration fields. */
  durationLabel?: string;
  fallbackImageUrl?: string;
  /** Real hotel record matched by name against the hotels table — null when no match was found (never fabricated). */
  makkahHotel?: PublicHotelRow | null;
  madinahHotel?: PublicHotelRow | null;
}) {
  const detailHref = `/${pkg.type}/${pkg.slug}`;

  const minPrice =
    roomPrices && roomPrices.length > 0
      ? Math.min(...roomPrices.map((r) => r.price_aed))
      : pkg.starting_price_aed;

  const inclusions = pkg.inclusions_text
    ?.split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const routeSegments = pkg.route_line
    ?.replace(/->/g, "→")
    .split("→")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm lg:flex-row">
      {/* ── Image panel ─────────────────────────────────────── */}
      <Link
        href={detailHref}
        className="relative h-52 w-full shrink-0 bg-warm-ivory lg:h-auto lg:w-72 lg:self-stretch"
      >
        {pkg.hero_image_url ? (
          <ExternalImage src={pkg.hero_image_url} alt={pkg.title} fill className="object-cover" />
        ) : (
          fallbackImageUrl && <Image src={fallbackImageUrl} alt={pkg.title} fill className="object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent" />
        <span className="absolute bottom-4 left-4 right-4 font-[family-name:var(--font-display)] text-lg font-bold uppercase leading-tight text-white">
          {TIER_LABEL[pkg.tier]}
        </span>
      </Link>

      {/* ── Content panel ───────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-3 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded bg-masaar-black px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
            {TIER_LABEL[pkg.tier]}
          </span>
          {pkg.is_featured && (
            <span className="rounded bg-pure-gold px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-masaar-black">
              Most Chosen
            </span>
          )}
        </div>

        <div>
          <Link href={detailHref}>
            <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black hover:text-deep-gold">
              {pkg.title}
            </h3>
          </Link>
          {pkg.tagline && <p className="mt-1 text-sm italic text-masaar-black/70">{pkg.tagline}</p>}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-masaar-black/55">
            {pkg.city_destination && <span>{pkg.city_destination}</span>}
            {pkg.city_destination && (pkg.duration_label || pkg.duration_days) && (
              <span className="text-masaar-black/25" aria-hidden="true">·</span>
            )}
            {(durationLabel || pkg.duration_label || pkg.duration_days) && (
              <span>{durationLabel || pkg.duration_label || `${pkg.duration_days} Days`}</span>
            )}
          </div>
        </div>

        {pkg.short_description && (
          <p className="text-sm leading-relaxed text-masaar-black/70">{pkg.short_description}</p>
        )}

        {/* Route flow */}
        {routeSegments && routeSegments.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            {routeSegments.map((seg, i) => (
              <div key={i} className="flex items-center gap-1.5">
                {i > 0 && (
                  <span className="text-masaar-black/25" aria-hidden="true">→</span>
                )}
                <div className="flex flex-col items-center gap-1">
                  <RouteIcon label={seg} />
                  <span className="max-w-[70px] text-center text-[10px] font-medium leading-tight text-masaar-black/60">
                    {seg}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid gap-5 border-t border-black/5 pt-4 sm:grid-cols-2">
          {/* What's Included */}
          {inclusions && inclusions.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-masaar-black/70">What&apos;s Included</p>
              <ul className="mt-2 space-y-1.5 text-sm text-masaar-black/70">
                {inclusions.map((line) => (
                  <li key={line} className="flex items-start gap-1.5">
                    <span className="mt-px shrink-0 text-pure-gold" aria-hidden="true">✓</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Your Stay */}
          {(pkg.makkah_hotel_name || pkg.madinah_hotel_name) && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-masaar-black/70">Your Stay</p>
              <div className="mt-2 space-y-3">
                {pkg.makkah_hotel_name && (
                  <StayEntry
                    cityLabel="Makkah"
                    hotelName={pkg.makkah_hotel_name}
                    accessTag={pkg.makkah_hotel_access_tag}
                    matchedHotel={makkahHotel ?? null}
                  />
                )}
                {pkg.madinah_hotel_name && (
                  <StayEntry
                    cityLabel="Madinah"
                    hotelName={pkg.madinah_hotel_name}
                    accessTag={pkg.madinah_hotel_access_tag}
                    matchedHotel={madinahHotel ?? null}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Price panel ─────────────────────────────────────── */}
      <div className="flex shrink-0 flex-col justify-center gap-3 border-t border-black/10 p-6 lg:w-56 lg:border-l lg:border-t-0">
        {minPrice != null && (
          <div>
            <p className="text-xs text-masaar-black/50">From</p>
            <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-deep-gold">
              <Price amountAed={minPrice} />
            </p>
            <p className="text-xs text-masaar-black/50">/ person</p>
          </div>
        )}
        <Link
          href={detailHref}
          className="rounded-md border border-black/15 px-4 py-2.5 text-center text-sm font-semibold text-masaar-black hover:bg-warm-ivory"
        >
          View Details →
        </Link>
        <PackageEnquiryTrigger
          pkg={pkg}
          hotelName={makkahHotel?.name || madinahHotel?.name}
          duration={durationLabel}
          fallbackImageUrl={fallbackImageUrl}
          className="w-full justify-center"
        />
      </div>
    </div>
  );
}
