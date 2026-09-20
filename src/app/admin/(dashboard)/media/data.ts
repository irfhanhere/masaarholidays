import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { MediaLibraryRow } from "@/lib/types/database";

const BUCKET = "media";

export interface MediaCatalogEntry {
  url: string;
  fileName: string;
  /** Human-readable descriptions of every place this exact URL is referenced, e.g. "Blog: Welcome to the Masaar Journal". */
  usedIn: string[];
  /** Set only when this URL is a blog_posts.hero_image_url — the one existing per-row alt-text column we keep in sync. */
  syncBlogPostIds: string[];
  altText: string | null;
  caption: string | null;
  size: number | null;
  contentType: string | null;
  isUploadedFile: boolean;
  /** The file's actual path within the storage bucket (may include a subfolder, e.g. "blog/…") — only set for uploaded files, and what deleteMediaFile needs, since fileName above is just the display basename. */
  storagePath: string | null;
}

function fileNameFromUrl(url: string): string {
  try {
    const path = url.startsWith("http") ? new URL(url).pathname : url;
    return decodeURIComponent(path.split("/").pop() || url);
  } catch {
    return url;
  }
}

/** Every image URL currently referenced by real content rows, plus every file sitting in the
 *  media storage bucket (uploaded but not necessarily attached to a row yet), merged by URL
 *  with whatever alt_text/caption already exists in media_library. Pulls only real, already-
 *  referenced URLs — nothing invented. */
export async function getMediaCatalog(): Promise<MediaCatalogEntry[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();

  const [
    { data: blogPosts },
    { data: hotels },
    { data: hotelRooms },
    { data: packages },
    { data: privateTrips },
    { data: privateTripStops },
    { data: vehicleTypes },
    { data: departureMonths },
    { data: mediaRows },
    { data: storageFiles },
  ] = await Promise.all([
    supabase.from("blog_posts").select("id, title, hero_image_url, hero_image_alt"),
    supabase.from("hotels").select("id, name, image_url, gallery_image_urls"),
    supabase.from("hotel_rooms").select("id, room_type, image_url, hotel_id"),
    supabase.from("packages").select("id, title, hero_image_url"),
    supabase.from("private_trips").select("id, name, featured_image_url, hero_image_url, gallery_images"),
    supabase.from("private_trip_stops").select("id, stop_name, image_url, trip_id"),
    supabase.from("ziyarat_vehicle_types").select("id, name, image_url"),
    supabase.from("umrah_departure_months").select("id, display_label, hero_image_url"),
    supabase.from("media_library").select("*"),
    supabase.storage.from(BUCKET).list("", { limit: 500, sortBy: { column: "created_at", order: "desc" } }),
  ]);

  const byUrl = new Map<string, MediaCatalogEntry>();

  function record(url: string | null | undefined, label: string) {
    if (!url || !url.trim()) return;
    let entry = byUrl.get(url);
    if (!entry) {
      entry = {
        url,
        fileName: fileNameFromUrl(url),
        usedIn: [],
        syncBlogPostIds: [],
        altText: null,
        caption: null,
        size: null,
        contentType: null,
        isUploadedFile: false,
        storagePath: null,
      };
      byUrl.set(url, entry);
    }
    entry.usedIn.push(label);
  }

  for (const post of blogPosts ?? []) {
    record(post.hero_image_url, `Blog: ${post.title}`);
    if (post.hero_image_url) {
      const entry = byUrl.get(post.hero_image_url)!;
      entry.syncBlogPostIds.push(post.id);
      if (!entry.altText) entry.altText = post.hero_image_alt;
    }
  }

  for (const hotel of hotels ?? []) {
    record(hotel.image_url, `Hotel: ${hotel.name}`);
    for (const url of hotel.gallery_image_urls ?? []) {
      record(url, `Hotel gallery: ${hotel.name}`);
    }
  }

  for (const room of hotelRooms ?? []) {
    record(room.image_url, `Hotel room: ${room.room_type}`);
  }

  for (const pkg of packages ?? []) {
    record(pkg.hero_image_url, `Package: ${pkg.title}`);
  }

  for (const trip of privateTrips ?? []) {
    record(trip.featured_image_url, `Private Trip: ${trip.name}`);
    if (trip.hero_image_url && trip.hero_image_url !== trip.featured_image_url) {
      record(trip.hero_image_url, `Private Trip hero: ${trip.name}`);
    }
    for (const url of trip.gallery_images ?? []) {
      record(url, `Private Trip gallery: ${trip.name}`);
    }
  }

  for (const stop of privateTripStops ?? []) {
    record(stop.image_url, `Trip stop: ${stop.stop_name}`);
  }

  for (const vehicle of vehicleTypes ?? []) {
    record(vehicle.image_url, `Vehicle: ${vehicle.name}`);
  }

  for (const month of departureMonths ?? []) {
    record(month.hero_image_url, `Departure month: ${month.display_label}`);
  }

  // Merge in existing media_library metadata (alt_text/caption).
  const mediaByUrl = new Map<string, MediaLibraryRow>((mediaRows ?? []).map((m) => [m.url, m]));
  for (const [url, entry] of byUrl) {
    const meta = mediaByUrl.get(url);
    if (meta) {
      entry.altText = meta.alt_text ?? entry.altText;
      entry.caption = meta.caption ?? entry.caption;
    }
  }

  // Files uploaded to the bucket but not (yet) referenced by any row — still worth cataloguing.
  for (const file of storageFiles ?? []) {
    if (!file.id) continue; // skip the empty-folder placeholder entry
    const url = supabase.storage.from(BUCKET).getPublicUrl(file.name).data.publicUrl;
    if (!byUrl.has(url)) {
      const meta = mediaByUrl.get(url);
      byUrl.set(url, {
        url,
        fileName: file.name,
        usedIn: [],
        syncBlogPostIds: [],
        altText: meta?.alt_text ?? null,
        caption: meta?.caption ?? null,
        size: file.metadata?.size ?? null,
        contentType: file.metadata?.mimetype ?? null,
        isUploadedFile: true,
        storagePath: file.name,
      });
    } else {
      const entry = byUrl.get(url)!;
      entry.isUploadedFile = true;
      entry.storagePath = file.name;
      entry.size = file.metadata?.size ?? entry.size;
      entry.contentType = file.metadata?.mimetype ?? entry.contentType;
    }
  }

  return [...byUrl.values()].sort((a, b) => b.usedIn.length - a.usedIn.length);
}
