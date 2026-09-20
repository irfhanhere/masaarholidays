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

/** One segment of the route strip, auto-detecting airport vs. hotel to prefix an icon. */
function RouteSegment({ label }: { label: string }) {
  const lower = label.toLowerCase();
  const icon = lower.includes("airport") ? "✈" : lower.includes("hotel") ? "🕌" : null;
  return (
    <span className="flex items-center gap-1 whitespace-nowrap">
      {icon && <span aria-hidden="true">{icon}</span>}
      <span>{label.trim()}</span>
    </span>
  );
}

export function PackageCard({
  pkg,
  roomPrices,
  departureMonthSlug,
  departureMonthLabel,
  fallbackImageUrl,
}: {
  pkg: PackageRow;
  roomPrices?: { room_type: string; price_aed: number }[];
  /** Set only when rendered on an Umrah departure-month page — carried forward
   *  onto the "View Details" link (?month=slug) and this card's enquiry popup. */
  departureMonthSlug?: string;
  departureMonthLabel?: string;
  /** Used only when pkg.hero_image_url is unset — an existing site asset so
   *  callers (e.g. Home page) don't have to touch packages.hero_image_url. */
  fallbackImageUrl?: string;
}) {
  const featured = pkg.is_featured;
  const detailHref = departureMonthSlug
    ? `/${pkg.type}/${pkg.slug}?month=${departureMonthSlug}`
    : `/${pkg.type}/${pkg.slug}`;

  // Computed live from the room prices this card was actually given —
  // never trusts the cached packages.starting_price_aed when roomPrices
  // is available, so this can't drift from the room list shown right below it.
  const minPrice =
    roomPrices && roomPrices.length > 0
      ? Math.min(...roomPrices.map((r) => r.price_aed))
      : pkg.starting_price_aed;

  // All inclusions — no slice; admin controls what appears via inclusions_text.
  const inclusions = pkg.inclusions_text
    ?.split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  // Split route_line on "→" or "->" to get individual segments for icon decoration.
  const routeSegments = pkg.route_line
    ?.replace(/->/g, "→")
    .split("→")
    .map((s) => s.trim())
    .filter(Boolean);

  const hasMakkahHotel = Boolean(pkg.makkah_hotel_name);
  const hasMadinahHotel = Boolean(pkg.madinah_hotel_name);

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-lg border bg-white shadow-sm sm:flex-row ${
        featured ? "border-pure-gold ring-1 ring-pure-gold" : "border-black/10"
      }`}
    >
      {/* ── Image panel ─────────────────────────────────────── */}
      <Link
        href={detailHref}
        className="relative h-48 w-full shrink-0 bg-warm-ivory sm:h-auto sm:w-64 sm:self-stretch md:w-80"
      >
        {pkg.hero_image_url ? (
          <ExternalImage src={pkg.hero_image_url} alt={pkg.title} fill className="object-cover" />
        ) : (
          fallbackImageUrl && (
            <Image src={fallbackImageUrl} alt={pkg.title} fill className="object-cover" />
          )
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

      {/* ── Content panel ───────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-3 p-5">

        {/* Title / tagline / destination + duration */}
        <div>
          <Link href={detailHref}>
            <h3 className="text-lg font-semibold text-masaar-black hover:text-deep-gold">
              {pkg.title}
            </h3>
          </Link>
          {pkg.tagline && (
            <p className="mt-0.5 text-sm font-semibold text-deep-gold">{pkg.tagline}</p>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-masaar-black/60">
            {pkg.city_destination && <span>{pkg.city_destination}</span>}
            {pkg.city_destination && (pkg.duration_label || pkg.duration_days) && (
              <span className="text-masaar-black/25" aria-hidden="true">·</span>
            )}
            {(pkg.duration_label || pkg.duration_days) && (
              <span>{pkg.duration_label || `${pkg.duration_days} Days`}</span>
            )}
          </div>
        </div>

        {pkg.short_description && (
          <p className="text-sm leading-relaxed text-masaar-black/70">{pkg.short_description}</p>
        )}

        {/* Route strip */}
        {routeSegments && routeSegments.length > 0 && (
          <div className="overflow-x-auto">
            <div className="flex min-w-max items-center gap-1 rounded-md bg-warm-ivory px-3 py-2 text-[11px] text-masaar-black/65">
              {routeSegments.map((seg, i) => (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && (
                    <span className="px-0.5 text-masaar-black/35" aria-hidden="true">→</span>
                  )}
                  <RouteSegment label={seg} />
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Inclusions — ✓ for regular items, 🚗 for Ziyarat lines */}
        {inclusions && inclusions.length > 0 && (
          <ul className="grid gap-x-6 gap-y-1 text-sm text-masaar-black/70 sm:grid-cols-2">
            {inclusions.map((line) => {
              const isZiyarat = /ziyarat/i.test(line);
              return (
                <li key={line} className="flex items-start gap-1.5">
                  <span className="mt-px shrink-0 text-pure-gold" aria-hidden="true">
                    {isZiyarat ? "🚗" : "✓"}
                  </span>
                  <span>{line}</span>
                </li>
              );
            })}
          </ul>
        )}

        {/* Hotel proximity notes — Primary (Option A) & Alternate (Option B) */}
        {(hasMakkahHotel || hasMadinahHotel) && (
          <div className="space-y-3 rounded-md border border-black/10 bg-warm-ivory/60 px-3.5 py-3">
            {hasMakkahHotel && (
              <div className="text-sm">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-deep-gold">
                  {pkg.makkah_hotel_name_alt ? "Makkah Stay Options:" : "Makkah Stay:"}
                </p>
                <div className="mt-1 space-y-1">
                  <div className="flex flex-wrap items-baseline gap-1">
                    {pkg.makkah_hotel_name_alt && (
                      <span className="rounded bg-black/5 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-masaar-black/70">
                        Option A
                      </span>
                    )}
                    <span className="font-medium text-masaar-black">{pkg.makkah_hotel_name}</span>
                    {pkg.makkah_hotel_note && (
                      <span className="text-xs text-masaar-black/60">— {pkg.makkah_hotel_note}</span>
                    )}
                  </div>
                  {pkg.makkah_hotel_access_tag && (
                    <p className="flex items-center gap-1 text-xs text-masaar-black/50">
                      <span className="text-pure-gold" aria-hidden="true">✓</span>
                      {pkg.makkah_hotel_access_tag}
                    </p>
                  )}

                  {pkg.makkah_hotel_name_alt && (
                    <div className="mt-1.5 pt-1.5 border-t border-black/5">
                      <div className="flex flex-wrap items-baseline gap-1">
                        <span className="rounded bg-black/5 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-masaar-black/70">
                          Option B
                        </span>
                        <span className="font-medium text-masaar-black">{pkg.makkah_hotel_name_alt}</span>
                        {pkg.makkah_hotel_note_alt && (
                          <span className="text-xs text-masaar-black/60">— {pkg.makkah_hotel_note_alt}</span>
                        )}
                      </div>
                      {pkg.makkah_hotel_access_tag_alt && (
                        <p className="flex items-center gap-1 text-xs text-masaar-black/50">
                          <span className="text-pure-gold" aria-hidden="true">✓</span>
                          {pkg.makkah_hotel_access_tag_alt}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {hasMadinahHotel && (
              <div className={`text-sm ${hasMakkahHotel ? "pt-2 border-t border-black/10" : ""}`}>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-deep-gold">
                  {pkg.madinah_hotel_name_alt ? "Madinah Stay Options:" : "Madinah Stay:"}
                </p>
                <div className="mt-1 space-y-1">
                  <div className="flex flex-wrap items-baseline gap-1">
                    {pkg.madinah_hotel_name_alt && (
                      <span className="rounded bg-black/5 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-masaar-black/70">
                        Option A
                      </span>
                    )}
                    <span className="font-medium text-masaar-black">{pkg.madinah_hotel_name}</span>
                    {pkg.madinah_hotel_note && (
                      <span className="text-xs text-masaar-black/60">— {pkg.madinah_hotel_note}</span>
                    )}
                  </div>
                  {pkg.madinah_hotel_access_tag && (
                    <p className="flex items-center gap-1 text-xs text-masaar-black/50">
                      <span className="text-pure-gold" aria-hidden="true">✓</span>
                      {pkg.madinah_hotel_access_tag}
                    </p>
                  )}

                  {pkg.madinah_hotel_name_alt && (
                    <div className="mt-1.5 pt-1.5 border-t border-black/5">
                      <div className="flex flex-wrap items-baseline gap-1">
                        <span className="rounded bg-black/5 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-masaar-black/70">
                          Option B
                        </span>
                        <span className="font-medium text-masaar-black">{pkg.madinah_hotel_name_alt}</span>
                        {pkg.madinah_hotel_note_alt && (
                          <span className="text-xs text-masaar-black/60">— {pkg.madinah_hotel_note_alt}</span>
                        )}
                      </div>
                      {pkg.madinah_hotel_access_tag_alt && (
                        <p className="flex items-center gap-1 text-xs text-masaar-black/50">
                          <span className="text-pure-gold" aria-hidden="true">✓</span>
                          {pkg.madinah_hotel_access_tag_alt}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Room pricing chips */}
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

        {/* Price + CTAs */}
        <div className="mt-auto flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
          {minPrice != null && (
            <div>
              <p className="text-xs text-masaar-black/50">From</p>
              <p className="text-xl font-semibold text-masaar-black">
                <Price amountAed={minPrice} />
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Link
              href={detailHref}
              className="rounded-md border border-black/15 px-4 py-2.5 text-center text-sm font-semibold text-masaar-black hover:bg-warm-ivory"
            >
              View Details
            </Link>
            <PackageEnquiryButton
              packageTitle={pkg.title}
              tier={TIER_LABEL[pkg.tier]}
              duration={pkg.duration_label || `${pkg.duration_days} Days`}
              departureMonth={departureMonthLabel}
            />
          </div>
        </div>
      </div>
    </div>
  );
}