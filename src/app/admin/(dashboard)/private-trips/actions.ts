"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

export async function savePrivateTrip(
  tripId: string | null,
  _prevState: PrivateTripFormState,
  formData: FormData
): Promise<PrivateTripFormState> {
  const supabase = await createClient();

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
    // Delete existing stops and re-insert in order
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

  revalidatePath("/admin/private-trips");
  revalidatePath("/private-trips/[slug]", "page");
  revalidatePath("/");

  redirect("/admin/private-trips");
}

export async function unpublishPrivateTrip(id: string) {
  const supabase = await createClient();
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
  const supabase = await createClient();
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
  const supabase = await createClient();

  // Enforce rule: cannot delete published content
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
