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

/**
 * Splits a hotel's "Path & Terrain" note into separate display lines —
 * admins enter one point per line for longer, multi-part descriptions
 * (matching the pattern used for inclusions_text elsewhere); a single-line
 * note just renders as one item. Never guesses sentence boundaries, so a
 * plain "Flat exit through Safwa Tower complex." note isn't awkwardly
 * split mid-thought.
 */
export function splitTerrainNote(note: string | null | undefined): string[] {
  if (!note) return [];
  return note
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * Some hotel_rooms.image_url rows were saved as a local filesystem path
 * (e.g. "C:/Program Files/Git/hotels/.../room.jpg") instead of a real URL —
 * a data-entry bug, not something the renderer can fix. Rather than let the
 * browser attempt (and fail) to load a local path as if it were a hosted
 * image, callers use this to fall back to a neutral placeholder instead.
 */
export function isRenderableImageUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  return url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/");
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

export type ListingTag = "Closest to Haram" | "Easy Walking Access" | "Value + Shuttle" | "Premium";

/**
 * Walk-tier per hotel, keyed by slug, matching the client's 3-level
 * dataset verbatim (spec item 11: Level 1 "step onto plaza" / Level 2
 * "easy & flat" / Level 3 "hills, long walks & shuttles"). Deriving the
 * tag from raw distance alone misclassifies hills — e.g. Hilton
 * Convention Makkah is only 450m but a steep uphill return, so it must
 * read "Value + Shuttle" like the rest of Level 3, not "Easy Walking
 * Access". Hotels not in this map (no client walk data, e.g. Madinah or
 * not-yet-surveyed Makkah properties) get no tag rather than a guess.
 */
const WALK_TIER_BY_SLUG: Record<string, ListingTag> = {
  // Level 1 — Closest to Haram
  "intercontinental-dar-al-tawhid": "Closest to Haram",
  "al-marwa-rayhaan": "Closest to Haram",
  "raffles-makkah-palace": "Closest to Haram",
  "al-safwah-royale-orchid": "Closest to Haram",
  "dorrar-al-eiman-royal": "Closest to Haram",
  // Level 2 — Easy Walking Access
  "makkah-hotel-and-towers": "Easy Walking Access",
  "al-ghufran-safwah": "Easy Walking Access",
  "movenpick-hotel-and-residences-hajar-tower-makkah": "Easy Walking Access",
  "swissotel-al-maqam": "Easy Walking Access",
  "zamzam-pullman": "Easy Walking Access",
  "makkah-clock-royal-tower": "Easy Walking Access",
  "swissotel-makkah": "Easy Walking Access",
  "jabal-omar-hyatt-regency": "Easy Walking Access",
  "le-meridien-makkah": "Easy Walking Access",
  "conrad-jabal-omar": "Easy Walking Access",
  "hilton-suites-makkah": "Easy Walking Access",
  "jabal-omar-marriott": "Easy Walking Access",
  "makarem-ajyad": "Easy Walking Access",
  "sheraton-jabal-al-kaaba": "Easy Walking Access",
  "anjum-hotel": "Easy Walking Access",
  // Level 3 — Value + Shuttle
  "jumeirah-jabal-omar": "Value + Shuttle",
  "hilton-convention-makkah": "Value + Shuttle",
  "address-jabal-omar": "Value + Shuttle",
  "doubletree-jabal-omar": "Value + Shuttle",
  "maysan-al-maqam": "Value + Shuttle",
  "emaar-grand-hotel": "Value + Shuttle",
  "al-kiswah-towers": "Value + Shuttle",
  "voco-makkah": "Value + Shuttle",
  "time-ruba-hotel-and-suites": "Value + Shuttle",
};

export type TerrainCategory =
  | "Flat"
  | "Flat with mild incline"
  | "Uphill return"
  | "Steep, shuttle recommended"
  | "Long distance, vehicle required";

/**
 * Route-difficulty per Makkah hotel, keyed by slug — the exact "Route"
 * column from the client's walk/terrain table (spec item 11), independent
 * of ListingTag (which mixes distance, shuttle-need and star rating into
 * one marketing badge). This is a separate filter dimension on purpose:
 * a guest choosing on terrain difficulty alone (e.g. avoiding any incline
 * regardless of distance) can't do that from ListingTag, since e.g.
 * "Value + Shuttle" hotels span everything from "mostly flat, short
 * incline" to "steep, shuttle recommended".
 */
const TERRAIN_BY_SLUG: Record<string, TerrainCategory> = {
  // Level 1 — all flat
  "intercontinental-dar-al-tawhid": "Flat",
  "al-marwa-rayhaan": "Flat",
  "raffles-makkah-palace": "Flat",
  "al-safwah-royale-orchid": "Flat",
  "dorrar-al-eiman-royal": "Flat",
  // Level 2 — flat, one mild incline
  "makkah-hotel-and-towers": "Flat",
  "al-ghufran-safwah": "Flat",
  "movenpick-hotel-and-residences-hajar-tower-makkah": "Flat",
  "swissotel-al-maqam": "Flat",
  "zamzam-pullman": "Flat",
  "makkah-clock-royal-tower": "Flat",
  "swissotel-makkah": "Flat",
  "jabal-omar-hyatt-regency": "Flat",
  "le-meridien-makkah": "Flat",
  "conrad-jabal-omar": "Flat with mild incline",
  "hilton-suites-makkah": "Flat",
  "jabal-omar-marriott": "Flat",
  "makarem-ajyad": "Flat",
  "sheraton-jabal-al-kaaba": "Flat",
  "anjum-hotel": "Flat",
  // Level 3 — hills, long walks & shuttles
  "jumeirah-jabal-omar": "Uphill return",
  "hilton-convention-makkah": "Uphill return",
  "address-jabal-omar": "Uphill return",
  "doubletree-jabal-omar": "Uphill return",
  "maysan-al-maqam": "Flat with mild incline",
  "emaar-grand-hotel": "Uphill return",
  "al-kiswah-towers": "Steep, shuttle recommended",
  "voco-makkah": "Long distance, vehicle required",
  "time-ruba-hotel-and-suites": "Long distance, vehicle required",
};

/**
 * Terrain-difficulty filter value for any hotel. Makkah hotels use the
 * client's exact table above; Madinah hotels have no such table, but every
 * seeded Madinah hotel's own route_type is real data ('flat' — see
 * 0026_seed_madinah_hotels.sql), so "Flat" is read from that rather than
 * guessed. Returns null when there's genuinely no terrain data to go on.
 */
export function getTerrainCategory(hotel: Pick<HotelRow, "slug" | "route_type">): TerrainCategory | null {
  const byTable = TERRAIN_BY_SLUG[hotel.slug];
  if (byTable) return byTable;
  if (hotel.route_type?.trim().toLowerCase() === "flat") return "Flat";
  return null;
}

type ListingTagFields = Pick<HotelRow, "slug" | "star_rating" | "shuttle_available"> & CardWalkFields;

/**
 * Single badge for the /hotels listing cards (spec item 5b). A 5-star hotel
 * reads as Premium regardless of its walk tier; a Makkah hotel in the
 * client's own Level 1/2/3 table (WALK_TIER_BY_SLUG) uses that exact
 * grouping. For everything else — Madinah hotels, which have real gate
 * walk-time data (0026_seed_madinah_hotels.sql) but no client-provided
 * tier table — the tier is derived from that real walk-time/shuttle data
 * instead of going untagged, using the same under-3 / under-7 / further-or-
 * shuttle bands the Makkah table's own tiers roughly fall into. Returns
 * null only when there's truly no distance data to go on.
 */
export function getListingTag(hotel: ListingTagFields): ListingTag | null {
  if (hotel.star_rating != null && hotel.star_rating >= 5) return "Premium";

  const byTable = WALK_TIER_BY_SLUG[hotel.slug];
  if (byTable) return byTable;

  if (hotel.shuttle_available) return "Value + Shuttle";
  const range = getEffectiveWalkRange(hotel);
  if (!range) return null;
  if (range.min <= 3) return "Closest to Haram";
  if (range.min <= 7) return "Easy Walking Access";
  return "Value + Shuttle";
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
