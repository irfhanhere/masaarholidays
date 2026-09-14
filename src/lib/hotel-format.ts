import type { HotelRow } from "@/lib/types/database";

/** "2-3 min walk" / "1 min walk" / null if no data at all. */
export function formatWalkTime(hotel: Pick<HotelRow, "walk_time_minutes" | "walk_time_minutes_max">): string | null {
  if (hotel.walk_time_minutes == null) return null;
  const range =
    hotel.walk_time_minutes_max != null && hotel.walk_time_minutes_max !== hotel.walk_time_minutes
      ? `${hotel.walk_time_minutes}-${hotel.walk_time_minutes_max}`
      : `${hotel.walk_time_minutes}`;
  return `${range} min walk`;
}

export function formatDistance(hotel: Pick<HotelRow, "distance_from_haram_meters">): string | null {
  if (hotel.distance_from_haram_meters == null) return null;
  return hotel.distance_from_haram_meters >= 1000
    ? `${(hotel.distance_from_haram_meters / 1000).toFixed(1)}km from Haram`
    : `${hotel.distance_from_haram_meters}m from Haram`;
}
