import Link from "next/link";
import { formatCardWalkTime, getListingTag, splitTerrainNote, type HotelWithSummary } from "@/lib/hotel-format";
import { ExternalImage } from "./ExternalImage";
import { LocationIcon } from "./icons";
import { Price } from "./Price";
import { WhatsAppButton } from "./WhatsAppButton";

export function HotelCard({ hotel }: { hotel: HotelWithSummary }) {
  const walkTime = formatCardWalkTime(hotel);
  const listingTag = getListingTag(hotel);
  const terrainLines = splitTerrainNote(hotel.terrain_note);

  // Formatted distance display: e.g. "~5 min walk (450m)"
  const distanceDisplay = walkTime
    ? `${walkTime}${hotel.distance_from_haram_meters ? ` (${hotel.distance_from_haram_meters}m)` : ""}`
    : hotel.distance_from_haram_meters
    ? `${hotel.distance_from_haram_meters}m from Haram`
    : null;

  return (
    <div className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        <Link href={`/hotels/${hotel.slug}`} className="block">
          <div className="relative h-44 w-full bg-warm-ivory">
            {hotel.image_url && (
              <ExternalImage src={hotel.image_url} alt={hotel.name} fill className="object-cover" />
            )}
            {hotel.minPriceAed != null && (
              <span className="absolute left-3 top-3 rounded bg-pure-gold px-2.5 py-1 text-[11px] font-bold text-masaar-black shadow-xs">
                From <Price amountAed={hotel.minPriceAed} />
              </span>
            )}
            {walkTime && (
              <span className="absolute right-3 top-3 rounded bg-masaar-black/85 backdrop-blur-xs px-2.5 py-1 text-[11px] font-medium text-white shadow-xs">
                {walkTime}
              </span>
            )}
          </div>
        </Link>

        <div className="p-4 space-y-3">
          <div>
            <div className="flex items-start justify-between gap-2">
              <Link href={`/hotels/${hotel.slug}`}>
                <h3 className="font-semibold text-masaar-black hover:text-deep-gold text-base leading-tight">
                  {hotel.name}
                </h3>
              </Link>
              {hotel.star_rating != null && (
                <span className="text-xs text-pure-gold shrink-0">{"★".repeat(hotel.star_rating)}</span>
              )}
            </div>
            <p className="flex items-center gap-1 text-xs text-masaar-black/50 mt-1">
              <LocationIcon className="size-3.5" />
              {hotel.zone ? `${hotel.zone.split(":")[0]}, ${hotel.city}` : hotel.city}
            </p>
            {listingTag && (
              <span className="mt-2 inline-block rounded-full bg-warm-ivory px-2.5 py-1 text-[11px] font-semibold text-deep-gold border border-black/5">
                {listingTag}
              </span>
            )}
          </div>

          {/* Structured Walk & Terrain Proximity Fields (Developer Instruction Item 11) */}
          <div className="rounded-lg border border-black/5 bg-warm-ivory/50 p-2.5 space-y-1.5 text-xs">
            {distanceDisplay && (
              <div className="grid grid-cols-[100px_1fr] gap-1.5 leading-snug">
                <span className="font-semibold text-masaar-black">Distance:</span>
                <span className="text-masaar-black/75">{distanceDisplay}</span>
              </div>
            )}
            {hotel.route_type && (
              <div className="grid grid-cols-[100px_1fr] gap-1.5 leading-snug">
                <span className="font-semibold text-masaar-black">Route:</span>
                <span className="text-masaar-black/75">{hotel.route_type}</span>
              </div>
            )}
            {hotel.accessibility_note && (
              <div className="grid grid-cols-[100px_1fr] gap-1.5 leading-snug">
                <span className="font-semibold text-masaar-black">Access:</span>
                <span className="text-masaar-black/75">{hotel.accessibility_note}</span>
              </div>
            )}
            {terrainLines.length > 0 && (
              <div className="grid grid-cols-[100px_1fr] gap-1.5 leading-snug">
                <span className="font-semibold text-masaar-black">Path &amp; Terrain:</span>
                <div className="text-masaar-black/75">
                  {terrainLines.length > 1 ? (
                    <ul className="space-y-0.5">
                      {terrainLines.map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ul>
                  ) : (
                    terrainLines[0]
                  )}
                </div>
              </div>
            )}
            {hotel.elderly_family_suitability_note && (
              <div className="grid grid-cols-[100px_1fr] gap-1.5 leading-snug">
                <span className="font-semibold text-masaar-black">Best for:</span>
                <span className="text-masaar-black/75 font-medium text-deep-gold">
                  {hotel.elderly_family_suitability_note}
                </span>
              </div>
            )}
          </div>

          {/* Pricing with required Disclaimer */}
          {hotel.minPriceAed != null && (
            <div className="pt-1 border-t border-black/5">
              <p className="text-[11px] text-masaar-black/50 uppercase tracking-wide font-medium">Starting from</p>
              <p className="text-lg font-bold text-masaar-black">
                <Price amountAed={hotel.minPriceAed} />
                <span className="text-xs font-normal text-masaar-black/50"> / room / night</span>
              </p>
              {/* Mandatory pricing disclaimer (hotel_image1.png) */}
              <span className="text-[11px] text-masaar-black/55 italic block mt-0.5 leading-tight">
                Indicative rate from <Price amountAed={hotel.minPriceAed} /> / room / night. Subject to dates and availability.
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 pt-0">
        <div className="flex gap-2">
          <Link
            href={`/hotels/${hotel.slug}`}
            className="flex-1 rounded-lg border border-black/15 px-3 py-2 text-center text-xs font-semibold text-masaar-black hover:bg-warm-ivory transition-colors"
          >
            View Rooms
          </Link>
          <WhatsAppButton
            templateKey="hotel"
            params={{ hotelName: hotel.name }}
            className="flex-1 text-xs py-2"
          >
            WhatsApp
          </WhatsAppButton>
        </div>
      </div>
    </div>
  );
}
