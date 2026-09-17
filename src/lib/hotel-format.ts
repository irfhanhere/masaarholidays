import type { HotelRoomRow, HotelRow, PublicHotelRow } from "@/lib/types/database";

/** A hotel plus the two figures the /hotels listing computes live from loaded room data — never stored columns. */
export type HotelWithSummary = PublicHotelRow & { minPriceAed: number | null; isRefundable: boolean };

function formatRange(min: number | null, max: number | null): string | null {
  if (min == null) return null;
  const range = max != null && max !== min ? `${min}-${max}` : `${min}`;
  return `${range} min walk`;
}

/** Makkah-style single-Haram walk time — "2-3 min walk" / "1 min walk" / null if no data. */
export function formatWalkTime(hotel: Pick<HotelRow, "walk_time_minutes" | "walk_time_minutes_max">): string | null {
  return formatRange(hotel.walk_time_minutes, hotel.walk_time_minutes_max);
}

export function formatDistance(hotel: Pick<HotelRow, "distance_from_haram_meters">): string | null {
  if (hotel.distance_from_haram_meters == null) return null;
  return hotel.distance_from_haram_meters >= 1000
    ? `${(hotel.distance_from_haram_meters / 1000).toFixed(1)}km from Haram`
    : `${hotel.distance_from_haram_meters}m from Haram`;
}

type GateFields = Pick<
  HotelRow,
  | "mens_gate_walk_minutes_min"
  | "mens_gate_walk_minutes_max"
  | "ladies_gate_walk_minutes_min"
  | "ladies_gate_walk_minutes_max"
>;

/** Madinah men's-gate walk time — "2-3 min walk" / null if no data. */
export function formatMensGateWalkTime(hotel: GateFields): string | null {
  return formatRange(hotel.mens_gate_walk_minutes_min, hotel.mens_gate_walk_minutes_max);
}

/** Madinah ladies'-gate walk time — "2-3 min walk" / null if no data. */
export function formatLadiesGateWalkTime(hotel: GateFields): string | null {
  return formatRange(hotel.ladies_gate_walk_minutes_min, hotel.ladies_gate_walk_minutes_max);
}

type CardWalkFields = Pick<HotelRow, "city" | "walk_time_minutes" | "walk_time_minutes_max" | "primary_gate"> &
  GateFields;

/**
 * The single walk-time range used for the hotel card badge AND the
 * walking-distance filter, so both stay consistent. Madinah hotels use
 * whichever gate the admin marked `primary_gate` (falls back to men's,
 * then ladies', if unset); Makkah hotels use the single Haram-wide
 * walk_time_minutes pair.
 */
export function getEffectiveWalkRange(hotel: CardWalkFields): { min: number; max: number } | null {
  if (hotel.city !== "Madinah") {
    if (hotel.walk_time_minutes == null) return null;
    return { min: hotel.walk_time_minutes, max: hotel.walk_time_minutes_max ?? hotel.walk_time_minutes };
  }
  const gates: [number | null, number | null][] =
    hotel.primary_gate === "ladies"
      ? [
          [hotel.ladies_gate_walk_minutes_min, hotel.ladies_gate_walk_minutes_max],
          [hotel.mens_gate_walk_minutes_min, hotel.mens_gate_walk_minutes_max],
        ]
      : [
          [hotel.mens_gate_walk_minutes_min, hotel.mens_gate_walk_minutes_max],
          [hotel.ladies_gate_walk_minutes_min, hotel.ladies_gate_walk_minutes_max],
        ];
  for (const [min, max] of gates) {
    if (min != null) return { min, max: max ?? min };
  }
  return null;
}

/** Single walk-time figure for the hotel card badge — "2-3 min walk" / null if no data. */
export function formatCardWalkTime(hotel: CardWalkFields): string | null {
  const range = getEffectiveWalkRange(hotel);
  return range ? formatRange(range.min, range.max) : null;
}

export type WalkBucket = "under5" | "5to10" | "10plus";

/** Buckets a hotel's effective walk-time minimum into the filter's three ranges — null when there's no walk-time data at all. */
export function getWalkBucket(hotel: CardWalkFields): WalkBucket | null {
  const range = getEffectiveWalkRange(hotel);
  if (!range) return null;
  if (range.min < 5) return "under5";
  if (range.min <= 10) return "5to10";
  return "10plus";
}

/** Lowest of a room's two rate types (Room Only / B&B), or null if neither is set. */
function roomMinPrice(room: Pick<HotelRoomRow, "price_ro" | "price_bb">): number | null {
  const prices = [room.price_ro, room.price_bb].filter((p): p is number => p != null);
  return prices.length > 0 ? Math.min(...prices) : null;
}

/**
 * Live minimum price across a hotel's loaded rooms — same
 * never-trust-the-cached-column pattern as PackageCard's minPrice (see
 * components/site/PackageCard.tsx). Falls back to the cached
 * hotels.price_from_aed column only when no rooms were loaded for this
 * hotel at all.
 */
export function computeHotelMinPrice(
  rooms: Pick<HotelRoomRow, "price_ro" | "price_bb">[],
  fallbackPriceFromAed: number | null
): number | null {
  const prices = rooms.map(roomMinPrice).filter((p): p is number => p != null);
  return prices.length > 0 ? Math.min(...prices) : fallbackPriceFromAed;
}

function isRefundableOption(option: string): boolean {
  const lower = option.toLowerCase();
  if (lower.includes("non-refundable") || lower.includes("non refundable")) return false;
  return lower.includes("refundable") || lower.includes("free cancellation");
}

/** True if any of a hotel's rooms has at least one refundable-sounding cancellation option. */
export function computeHotelIsRefundable(rooms: Pick<HotelRoomRow, "cancellation_policy_options">[]): boolean {
  return rooms.some((room) => room.cancellation_policy_options.some(isRefundableOption));
}
