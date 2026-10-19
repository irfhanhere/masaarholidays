import { useState } from "react";
import Link from "next/link";
import {
  formatCardWalkTime,
  getTerrainCategory,
  type HotelWithSummary,
} from "@/lib/hotel-format";
import { ExternalImage } from "./ExternalImage";
import { WhatsAppButton } from "./WhatsAppButton";

export function HotelCard({
  hotel,
  viewMode = "grid",
}: {
  hotel: HotelWithSummary;
  viewMode?: "grid" | "list";
}) {
  const [isFavorite, setIsFavorite] = useState(false);
  const walkTime = formatCardWalkTime(hotel);
  const isMadinah = hotel.city === "Madinah";

  const starsCount = hotel.star_rating ?? 5;
  const stars = "★".repeat(starsCount);

  // Distance formatting
  const distanceStr = hotel.distance_from_haram_meters
    ? hotel.distance_from_haram_meters >= 1000
      ? `${(hotel.distance_from_haram_meters / 1000).toFixed(1)} km to Haram`
      : `${hotel.distance_from_haram_meters} m to Haram`
    : hotel.city === "Makkah"
    ? "Near Grand Mosque"
    : "Near Prophet's Mosque";

  // Route type display
  const routeStr =
    hotel.route_type ||
    (hotel.distance_from_haram_meters && hotel.distance_from_haram_meters <= 200
      ? "Direct plaza access"
      : "Street / sidewalk");

  // Path & Terrain display
  const terrainCategory = getTerrainCategory(hotel);
  const terrainStr =
    (hotel.terrain_note ? hotel.terrain_note.split("\n")[0].trim() : null) ||
    terrainCategory ||
    "Mostly flat";

  const priceAed = hotel.minPriceAed ?? hotel.price_from_aed;

  if (viewMode === "list") {
    return (
      <div className="group overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xs hover:shadow-md transition-all flex flex-col md:flex-row">
        {/* Thumbnail */}
        <div className="relative h-48 md:h-auto md:w-72 shrink-0 bg-warm-ivory overflow-hidden">
          {hotel.image_url ? (
            <ExternalImage
              src={hotel.image_url}
              alt={hotel.name}
              fill
              sizes="(max-width: 768px) 100vw, 300px"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-masaar-black/40">Photo coming soon</div>
          )}
          {walkTime && (
            <span className="absolute right-3 top-3 rounded-md bg-masaar-black/85 backdrop-blur-xs px-2.5 py-1 text-[11px] font-semibold text-white shadow-xs">
              {walkTime}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <Link href={`/hotels/${hotel.slug}`} className="block">
                  <h3 className="font-bold text-masaar-black text-lg hover:text-[#8C6B1A] transition leading-snug">
                    {hotel.name}
                  </h3>
                </Link>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-amber-500 text-xs font-bold">{stars}</span>
                  <span className="text-masaar-black/30">•</span>
                  <span className="text-xs text-masaar-black/60 flex items-center gap-1">
                    <span>📍</span> {hotel.city}, Saudi Arabia
                  </span>
                  <span className="inline-block rounded-md bg-warm-ivory px-2 py-0.5 text-[10px] font-bold text-[#8C6B1A] border border-black/5">
                    {hotel.category || "Premium"}
                  </span>
                </div>
              </div>

              {priceAed != null && (
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-masaar-black/40 block">From</span>
                  <span className="text-xl font-bold font-mono text-masaar-black">AED {Number(priceAed).toLocaleString()}</span>
                  <span className="text-[11px] text-masaar-black/50 block">/ room / night</span>
                </div>
              )}
            </div>

            {/* Quick 4-pill specs grid */}
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="flex items-center gap-2 rounded-lg bg-warm-ivory/60 px-3 py-2 border border-black/5">
                <span className="text-sm">🏃</span>
                <span className="font-semibold text-masaar-black truncate">{walkTime || "Short walk"}</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-warm-ivory/60 px-3 py-2 border border-black/5">
                <span className="text-sm">📏</span>
                <span className="font-semibold text-masaar-black truncate">{distanceStr}</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-warm-ivory/60 px-3 py-2 border border-black/5">
                <span className="text-sm">🚶</span>
                <span className="font-semibold text-masaar-black truncate">{routeStr}</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-warm-ivory/60 px-3 py-2 border border-black/5">
                <span className="text-sm">⛰️</span>
                <span className="font-semibold text-masaar-black truncate">{terrainStr}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-black/5">
            <span className="text-[11px] text-masaar-black/50 italic">
              Indicative rate. Subject to dates and availability.
            </span>
            <div className="flex items-center gap-2">
              <Link
                href={`/hotels/${hotel.slug}`}
                className="rounded-lg border border-black/15 bg-white px-4 py-2 text-xs font-semibold text-masaar-black hover:bg-warm-ivory transition"
              >
                View Rooms
              </Link>
              <WhatsAppButton
                templateKey="hotel"
                params={{ hotelName: hotel.name }}
                className="rounded-lg bg-[#C9A227] px-4 py-2 text-xs font-bold text-white hover:bg-[#B38F1E] shadow-xs transition"
              >
                Enquire
              </WhatsAppButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid Card matching H01 Inspiration Screen
  return (
    <div className="group overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        {/* Cover Image Container */}
        <div className="relative h-48 w-full bg-warm-ivory overflow-hidden">
          <Link href={`/hotels/${hotel.slug}`} className="block h-full w-full">
            {hotel.image_url ? (
              <ExternalImage
                src={hotel.image_url}
                alt={`${hotel.name} accommodation in ${hotel.city}`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-masaar-black/40">
                Photo coming soon
              </div>
            )}
          </Link>

          {/* Top Left Badge: Featured or Category */}
          <span className="absolute left-3 top-3 rounded-md bg-[#C9A227] px-2.5 py-1 text-[11px] font-bold text-white shadow-xs">
            ★ Featured
          </span>

          {/* Top Right Badges: Walk time pill + Favorite button */}
          <div className="absolute right-3 top-3 flex items-center gap-1.5">
            {walkTime && (
              <span className="rounded-md bg-masaar-black/85 backdrop-blur-xs px-2.5 py-1 text-[11px] font-semibold text-white shadow-xs">
                {walkTime}
              </span>
            )}
            <button
              type="button"
              onClick={() => setIsFavorite((v) => !v)}
              className="flex size-7 items-center justify-center rounded-full bg-white/90 backdrop-blur-xs text-masaar-black shadow-xs hover:bg-white transition"
              aria-label="Add to favorites"
            >
              <span className={isFavorite ? "text-red-500 text-xs" : "text-masaar-black/60 text-xs"}>
                {isFavorite ? "❤️" : "🤍"}
              </span>
            </button>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 space-y-3">
          {/* Title & Stars */}
          <div>
            <div className="flex items-start justify-between gap-2">
              <Link href={`/hotels/${hotel.slug}`}>
                <h3 className="font-bold text-masaar-black text-base hover:text-[#8C6B1A] transition leading-snug line-clamp-1">
                  {hotel.name}
                </h3>
              </Link>
              <span className="text-amber-500 text-xs font-bold shrink-0">{stars}</span>
            </div>

            {/* City & Category Tag */}
            <div className="flex items-center justify-between gap-2 mt-1">
              <span className="text-xs text-masaar-black/60 flex items-center gap-1">
                <span>📍</span> {hotel.city}
              </span>
              <span className="rounded-md bg-warm-ivory px-2 py-0.5 text-[10px] font-bold text-[#8C6B1A] border border-black/5">
                {hotel.category || "Premium"}
              </span>
            </div>
          </div>

          {/* 4-Pill Metadata Grid matching H01 */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Walk time */}
            <div className="flex items-center gap-2 rounded-lg bg-warm-ivory/60 p-2 border border-black/5">
              <span className="text-sm">🏃</span>
              <div className="min-w-0">
                <span className="font-bold text-masaar-black block text-[11px] truncate">
                  {walkTime || (isMadinah ? "3 min walk" : "2 min walk")}
                </span>
                <span className="text-[10px] text-masaar-black/50 block truncate">walk</span>
              </div>
            </div>

            {/* Distance to Haram */}
            <div className="flex items-center gap-2 rounded-lg bg-warm-ivory/60 p-2 border border-black/5">
              <span className="text-sm">📍</span>
              <div className="min-w-0">
                <span className="font-bold text-masaar-black block text-[11px] truncate">
                  {hotel.distance_from_haram_meters ? `${hotel.distance_from_haram_meters} m` : "Direct access"}
                </span>
                <span className="text-[10px] text-masaar-black/50 block truncate">to Haram</span>
              </div>
            </div>

            {/* Route type */}
            <div className="flex items-center gap-2 rounded-lg bg-warm-ivory/60 p-2 border border-black/5">
              <span className="text-sm">🚶</span>
              <div className="min-w-0">
                <span className="font-bold text-masaar-black block text-[11px] truncate">
                  {routeStr}
                </span>
                <span className="text-[10px] text-masaar-black/50 block truncate">route</span>
              </div>
            </div>

            {/* Path & Terrain */}
            <div className="flex items-center gap-2 rounded-lg bg-warm-ivory/60 p-2 border border-black/5">
              <span className="text-sm">⛰️</span>
              <div className="min-w-0">
                <span className="font-bold text-masaar-black block text-[11px] truncate">
                  {terrainStr}
                </span>
                <span className="text-[10px] text-masaar-black/50 block truncate">path &amp; terrain</span>
              </div>
            </div>
          </div>

          {/* Pricing matching H01 */}
          <div className="pt-2 border-t border-black/5">
            <span className="text-[10px] uppercase font-bold text-masaar-black/40 block">From</span>
            <div className="flex items-baseline gap-1.5">
              {priceAed != null ? (
                <>
                  <span className="text-lg font-bold font-mono text-masaar-black">
                    AED {Number(priceAed).toLocaleString()}
                  </span>
                  <span className="text-[11px] text-masaar-black/50">/ room / night</span>
                </>
              ) : (
                <span className="text-xs font-semibold text-masaar-black/50 italic">Contact us for pricing</span>
              )}
            </div>
            <p className="text-[10px] text-masaar-black/45 italic mt-0.5 leading-tight">
              Indicative rate. Subject to dates and availability.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons matching H01 */}
      <div className="p-4 pt-0">
        <div className="flex gap-2">
          <Link
            href={`/hotels/${hotel.slug}`}
            className="flex-1 rounded-xl border border-black/15 bg-white py-2 text-center text-xs font-bold text-masaar-black hover:bg-warm-ivory transition"
          >
            View Rooms
          </Link>
          <WhatsAppButton
            templateKey="hotel"
            params={{ hotelName: hotel.name }}
            className="flex-1 rounded-xl bg-[#C9A227] py-2 text-center text-xs font-bold text-white hover:bg-[#B38F1E] shadow-xs transition"
          >
            Enquire
          </WhatsAppButton>
        </div>
      </div>
    </div>
  );
}
