"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PrivateTripDestination, PrivateTripPickupPoint, PrivateTripStatus, PrivateTripStopVisitType } from "@/lib/types/database";

export interface PrivateTripFormState {
  status: "idle" | "success" | "error";
  error?: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function getClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    return supabase;
  }

  if (process.env.NODE_ENV !== "production" && process.env.ALLOW_DEV_AUTH_BYPASS === "true") {
    return createAdminClient();
  }

  return supabase;
}

export async function savePrivateTrip(
  tripId: string | null,
  _prevState: PrivateTripFormState,
  formData: FormData
): Promise<PrivateTripFormState> {
  const supabase = await getClient();

  const name = String(formData.get("name") ?? "").trim();
  const rawSlug = String(formData.get("slug") ?? "").trim();
  const slug = rawSlug ? slugify(rawSlug) : slugify(name);
  const destination = (formData.get("destination") as PrivateTripDestination) || "Makkah";
  const short_description = String(formData.get("short_description") ?? "").trim();
  const duration = String(formData.get("duration") ?? "").trim() || "2 – 2.5 hrs";
  const trip_type = String(formData.get("trip_type") ?? "").trim() || "Private Sightseeing";
  const featured_image_url = String(formData.get("featured_image_url") ?? "").trim() || null;
  const hero_image_url = String(formData.get("hero_image_url") ?? "").trim() || null;
  const status = (formData.get("status") as PrivateTripStatus) || "draft";
  const pickup_point = (formData.get("pickup_point") as PrivateTripPickupPoint) || "hotel_lobby";
  const important_note = String(formData.get("important_note") ?? "").trim() || null;
  const whatsapp_template_key = String(formData.get("whatsapp_template_key") ?? "").trim() || "privateTripEnquiry";
  const meta_title = String(formData.get("meta_title") ?? "").trim() || null;
  const meta_description = String(formData.get("meta_description") ?? "").trim() || null;

  // Time slots parsing from form
  let time_slots: string[] = ["7:00 AM", "8:00 AM", "9:00 AM", "2:00 PM", "3:00 PM", "4:00 PM"];
  const rawTimeSlots = formData.get("time_slots_json");
  if (rawTimeSlots) {
    try {
      time_slots = JSON.parse(String(rawTimeSlots));
    } catch {
      // fallback
    }
  }

  // Each gallery item carries its own alt text now — gallery_images (just the URLs) is
  // still what's stored on private_trips; the alt text is upserted into media_library
  // below, once the trip itself has saved successfully.
  interface GalleryItem {
    url: string;
    alt: string;
  }
  let galleryItems: GalleryItem[] = [];
  const rawGalleryImages = formData.get("gallery_images_json");
  if (rawGalleryImages) {
    try {
      const parsed = JSON.parse(String(rawGalleryImages));
      galleryItems = Array.isArray(parsed)
        ? parsed.filter(
            (item: unknown): item is GalleryItem =>
              typeof item === "object" && item !== null && typeof (item as GalleryItem).url === "string" && (item as GalleryItem).url.trim().length > 0
          )
        : [];
    } catch {
      galleryItems = [];
    }
  }
  const gallery_images = galleryItems.map((item) => item.url);

  let whats_included: string[] = [];
  const rawWhatsIncluded = formData.get("whats_included_json");
  if (rawWhatsIncluded) {
    try {
      whats_included = JSON.parse(String(rawWhatsIncluded)).filter((s: unknown) => typeof s === "string" && s.trim());
    } catch {
      whats_included = [];
    }
  }

  if (!name) {
    return { status: "error", error: "Trip Name is required." };
  }

  // Stops parsing
  interface StopItem {
    id?: string;
    stop_number: number;
    stop_name: string;
    image_url?: string | null;
    visit_duration?: string | null;
    visit_type: PrivateTripStopVisitType;
    short_description?: string | null;
  }

  let stops: StopItem[] = [];
  const rawStops = formData.get("stops_json");
  if (rawStops) {
    try {
      stops = JSON.parse(String(rawStops));
    } catch {
      stops = [];
    }
  }

  let savedTripId = tripId;

  if (tripId) {
    const { error: updateError } = await supabase
      .from("private_trips")
      .update({
        name,
        slug,
        destination,
        short_description,
        duration,
        trip_type,
        featured_image_url,
        hero_image_url,
        status,
        pickup_point,
        time_slots,
        important_note,
        whatsapp_template_key,
        meta_title,
        meta_description,
        gallery_images,
        whats_included,
        updated_at: new Date().toISOString(),
      })
      .eq("id", tripId);

    if (updateError) {
      return { status: "error", error: updateError.message };
    }
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from("private_trips")
      .insert({
        name,
        slug,
        destination,
        short_description,
        duration,
        trip_type,
        featured_image_url,
        hero_image_url,
        status,
        pickup_point,
        time_slots,
        important_note,
        whatsapp_template_key,
        meta_title,
        meta_description,
        gallery_images,
        whats_included,
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      return { status: "error", error: insertError?.message ?? "Failed to insert private trip." };
    }
    savedTripId = inserted.id;
  }

  // Sync stops
  if (savedTripId) {
    await supabase.from("private_trip_stops").delete().eq("trip_id", savedTripId);

    if (stops.length > 0) {
      const stopsToInsert = stops.map((stop, index) => ({
        trip_id: savedTripId as string,
        stop_number: index + 1,
        stop_name: stop.stop_name || `Stop ${index + 1}`,
        image_url: stop.image_url || null,
        visit_duration: stop.visit_type === "Pass By" ? null : stop.visit_duration || null,
        visit_type: stop.visit_type || "Visit",
        short_description: stop.short_description || null,
      }));

      const { error: stopsError } = await supabase.from("private_trip_stops").insert(stopsToInsert);
      if (stopsError) {
        console.error("Failed to save stops", stopsError.message);
      }
    }
  }

  // Sync gallery alt text into the shared Media Library catalog — same table the
  // standalone Media Library admin page reads/writes, so there's one source of
  // truth per image, not a second copy living only on this trip.
  const itemsWithAlt = galleryItems.filter((item) => item.alt.trim().length > 0);
  if (itemsWithAlt.length > 0) {
    const { error: mediaError } = await supabase
      .from("media_library")
      .upsert(
        itemsWithAlt.map((item) => ({ url: item.url, alt_text: item.alt.trim() })),
        { onConflict: "url" }
      );
    if (mediaError) {
      console.error("Failed to sync gallery alt text to media_library", mediaError.message);
    }
  }

  revalidatePath("/admin/private-trips");
  revalidatePath("/admin/media");
  revalidatePath("/private-trips/[slug]", "page");
  revalidatePath("/");

  redirect("/admin/private-trips");
}

export async function unpublishPrivateTrip(id: string) {
  const supabase = await getClient();
  const { error } = await supabase
    .from("private_trips")
    .update({ status: "draft", updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/private-trips");
  revalidatePath("/private-trips/[slug]", "page");
  revalidatePath("/");
}

export async function publishPrivateTrip(id: string) {
  const supabase = await getClient();
  const { error } = await supabase
    .from("private_trips")
    .update({ status: "published", updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/private-trips");
  revalidatePath("/private-trips/[slug]", "page");
  revalidatePath("/");
}

export async function deletePrivateTrip(id: string) {
  const supabase = await getClient();

  const { data: trip } = await supabase.from("private_trips").select("status").eq("id", id).maybeSingle();
  if (trip?.status === "published") {
    throw new Error("Cannot delete a published trip. Please unpublish it first.");
  }

  const { error } = await supabase.from("private_trips").delete().eq("id", id);
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/private-trips");
  revalidatePath("/private-trips/[slug]", "page");
  revalidatePath("/");
}
