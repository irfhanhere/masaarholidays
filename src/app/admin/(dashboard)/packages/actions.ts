"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { HajjItinerarySegment, PackageItineraryDay, PackageType, PackageTier } from "@/lib/types/database";

export interface PackageFormState {
  status: "idle" | "error";
  message?: string;
}

/** e.g. "umrah-essential-7-nights" — unique by construction since (type, tier, duration_nights) is a DB unique constraint. */
function buildDurationSlug(type: PackageType, tier: PackageTier, durationNights: number) {
  return `${type}-${tier}-${durationNights}-nights`;
}

function parseRoomPrices(formData: FormData) {
  const roomTypes = formData.getAll("room_type") as string[];
  const roomPrices = formData.getAll("room_price") as string[];
  return roomTypes
    .map((room_type, i) => ({ room_type: room_type.trim(), price_aed: Number(roomPrices[i]) }))
    .filter((r) => r.room_type && !Number.isNaN(r.price_aed));
}

function parseItinerary(formData: FormData): PackageItineraryDay[] {
  const raw = String(formData.get("itinerary_text") ?? "");
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, i) => ({ day: i + 1, items: [line] }));
}

/** Hajj-only structured itinerary — one row per submitted segment, in the order given. */
function parseItinerarySegments(formData: FormData): HajjItinerarySegment[] {
  const locations = formData.getAll("segment_location") as string[];
  const nights = formData.getAll("segment_nights") as string[];
  const boardTypes = formData.getAll("segment_board_type") as string[];
  const notes = formData.getAll("segment_note") as string[];
  return locations
    .map((location, i) => ({
      location: location.trim(),
      nights: Number(nights[i]),
      board_type: (boardTypes[i] ?? "").trim(),
      note: (notes[i] ?? "").trim() || null,
    }))
    .filter((s) => s.location && s.nights > 0);
}

export async function savePackage(
  packageId: string | null,
  _prevState: PackageFormState,
  formData: FormData
): Promise<PackageFormState> {
  const type = String(formData.get("type")) as PackageType;
  const tier = String(formData.get("tier")) as PackageTier;
  const title = String(formData.get("title") ?? "").trim();
  const cityDestination = String(formData.get("city_destination") ?? "").trim();
  const durationNights = Number(formData.get("duration_nights"));
  const durationDays = durationNights > 0 ? durationNights + 1 : 0;
  const isActive = formData.get("is_active") === "on";
  const isFeatured = formData.get("is_featured") === "on";
  const heroImageUrl = String(formData.get("hero_image_url") ?? "").trim() || null;

  if (!title || !type || !tier || !durationNights) {
    return { status: "error", message: "Title, type, tier and duration (nights) are required." };
  }

  const roomPrices = parseRoomPrices(formData);
  // Hajj uses itinerary_segments instead of the day-by-day itinerary field
  // — only one of the two is ever populated per row, matching whichever
  // one the form actually rendered for this package's type.
  const itinerary = type === "hajj" ? [] : parseItinerary(formData);
  const itinerarySegments = type === "hajj" ? parseItinerarySegments(formData) : [];
  const startingPrice = roomPrices.length > 0 ? Math.min(...roomPrices.map((r) => r.price_aed)) : null;

  const supabase = await createClient();

  const textField = (name: string) => String(formData.get(name) ?? "").trim() || null;

  const payload = {
    type,
    tier,
    title,
    city_destination: cityDestination || null,
    short_description: textField("short_description"),
    tagline: textField("tagline"),
    route_line: textField("route_line"),
    makkah_hotel_name: textField("makkah_hotel_name"),
    makkah_hotel_note: textField("makkah_hotel_note"),
    makkah_hotel_access_tag: textField("makkah_hotel_access_tag"),
    madinah_hotel_name: textField("madinah_hotel_name"),
    madinah_hotel_note: textField("madinah_hotel_note"),
    madinah_hotel_access_tag: textField("madinah_hotel_access_tag"),
    makkah_hotel_name_alt: textField("makkah_hotel_name_alt"),
    makkah_hotel_note_alt: textField("makkah_hotel_note_alt"),
    makkah_hotel_access_tag_alt: textField("makkah_hotel_access_tag_alt"),
    madinah_hotel_name_alt: textField("madinah_hotel_name_alt"),
    madinah_hotel_note_alt: textField("madinah_hotel_note_alt"),
    madinah_hotel_access_tag_alt: textField("madinah_hotel_access_tag_alt"),
    // Hajj-only fields — always null/empty for Umrah, since the form
    // never renders these inputs for Umrah in the first place.
    maktab_category: type === "hajj" ? textField("maktab_category") : null,
    duration_days: durationDays,
    duration_nights: durationNights,
    duration_label: textField("duration_label"),
    validity_label: textField("validity_label"),
    inclusions_text: textField("inclusions_text"),
    advance_booking_note: textField("advance_booking_note"),
    flight_note: textField("flight_note"),
    rate_disclaimer: textField("rate_disclaimer"),
    // Per-duration, not synced across tier siblings — each duration
    // variant has its own detail-page URL/slug (same reasoning as slug
    // itself, unlike title/inclusions_text which ARE synced below).
    meta_title: textField("meta_title"),
    meta_description: textField("meta_description"),
    is_active: isActive,
    is_featured: isFeatured,
    show_on_website: isActive,
    hero_image_url: heroImageUrl,
    itinerary,
    itinerary_segments: itinerarySegments,
    starting_price_aed: startingPrice,
  };

  let id = packageId;

  if (id) {
    const { error } = await supabase.from("packages").update(payload).eq("id", id);
    if (error) {
      if (error.code === "23505") {
        return { status: "error", message: `This tier already has a ${durationNights}-night duration option.` };
      }
      return { status: "error", message: error.message };
    }
  } else {
    const slug = buildDurationSlug(type, tier, durationNights);
    const { data, error } = await supabase
      .from("packages")
      .insert({ ...payload, slug })
      .select("id")
      .single();
    if (error) {
      if (error.code === "23505") {
        return { status: "error", message: `This tier already has a ${durationNights}-night duration option.` };
      }
      return { status: "error", message: error.message };
    }
    id = data.id;
  }

  // Tier-level copy (title, city/destination, inclusions, notes, featured
  // flag) is shared across every duration variant of this same tier for Umrah.
  // For Hajj, each duration variant (e.g. 9d vs 12d vs 15d) has distinct
  // hotel stays (Clock Tower, Madinah) and titles, so do not overwrite siblings.
  if (type !== "hajj") {
    await supabase
      .from("packages")
      .update({
        title: payload.title,
        city_destination: payload.city_destination,
        short_description: payload.short_description,
        tagline: payload.tagline,
        route_line: payload.route_line,
        makkah_hotel_name: payload.makkah_hotel_name,
        makkah_hotel_note: payload.makkah_hotel_note,
        makkah_hotel_access_tag: payload.makkah_hotel_access_tag,
        madinah_hotel_name: payload.madinah_hotel_name,
        madinah_hotel_note: payload.madinah_hotel_note,
        madinah_hotel_access_tag: payload.madinah_hotel_access_tag,
        makkah_hotel_name_alt: payload.makkah_hotel_name_alt,
        makkah_hotel_note_alt: payload.makkah_hotel_note_alt,
        makkah_hotel_access_tag_alt: payload.makkah_hotel_access_tag_alt,
        madinah_hotel_name_alt: payload.madinah_hotel_name_alt,
        madinah_hotel_note_alt: payload.madinah_hotel_note_alt,
        madinah_hotel_access_tag_alt: payload.madinah_hotel_access_tag_alt,
        maktab_category: payload.maktab_category,
        inclusions_text: payload.inclusions_text,
        advance_booking_note: payload.advance_booking_note,
        flight_note: payload.flight_note,
        rate_disclaimer: payload.rate_disclaimer,
        validity_label: payload.validity_label,
        is_featured: payload.is_featured,
      })
      .eq("type", type)
      .eq("tier", tier)
      .neq("id", id);
  }

  // Replace room prices wholesale — simplest consistent approach for a
  // small, fully-resubmitted list.
  await supabase.from("package_room_prices").delete().eq("package_id", id);
  if (roomPrices.length > 0) {
    await supabase.from("package_room_prices").insert(
      roomPrices.map((r, i) => ({ package_id: id, room_type: r.room_type, price_aed: r.price_aed, display_order: i }))
    );
  }

  // Plus upgrade — attached to the package, not a new tier.
  const hasUpgrade = formData.get("has_upgrade") === "on";
  if (hasUpgrade) {
    const upgradeLabel = String(formData.get("upgrade_label") ?? `${title} Plus`).trim();
    const { data: existingUpgrade } = await supabase
      .from("package_upgrades")
      .select("id")
      .eq("package_id", id)
      .maybeSingle();

    let upgradeId = existingUpgrade?.id as string | undefined;
    if (upgradeId) {
      await supabase.from("package_upgrades").update({ label: upgradeLabel, is_active: true }).eq("id", upgradeId);
    } else {
      const { data } = await supabase
        .from("package_upgrades")
        .insert({ package_id: id, label: upgradeLabel, is_active: true })
        .select("id")
        .single();
      upgradeId = data?.id;
    }

    if (upgradeId) {
      const upgradeRoomTypes = formData.getAll("upgrade_room_type") as string[];
      const upgradeRoomPrices = formData.getAll("upgrade_room_price") as string[];
      const upgradePrices = upgradeRoomTypes
        .map((room_type, i) => ({ room_type: room_type.trim(), price_aed: Number(upgradeRoomPrices[i]) }))
        .filter((r) => r.room_type && !Number.isNaN(r.price_aed));

      await supabase.from("package_upgrade_room_prices").delete().eq("upgrade_id", upgradeId);
      if (upgradePrices.length > 0) {
        await supabase.from("package_upgrade_room_prices").insert(
          upgradePrices.map((r, i) => ({ upgrade_id: upgradeId, room_type: r.room_type, price_aed: r.price_aed, display_order: i }))
        );
      }
    }
  } else {
    await supabase.from("package_upgrades").delete().eq("package_id", id);
  }

  // Transfer add-ons (masaar-client-data-round2.md Section 3) — same
  // "replace wholesale" pattern as room prices.
  const addonTransferIds = formData.getAll("transfer_addon_transfer_id") as string[];
  const addonVehicleIds = formData.getAll("transfer_addon_vehicle_id") as string[];
  const transferAddons = addonTransferIds
    .map((transfer_id, i) => ({ transfer_id, vehicle_id: addonVehicleIds[i] || null }))
    .filter((a) => a.transfer_id);

  await supabase.from("package_transfer_addons").delete().eq("package_id", id);
  if (transferAddons.length > 0) {
    await supabase.from("package_transfer_addons").insert(
      transferAddons.map((a, i) => ({
        package_id: id,
        transfer_id: a.transfer_id,
        vehicle_id: a.vehicle_id,
        display_order: i,
      }))
    );
  }

  revalidatePath("/admin/packages");
  redirect("/admin/packages");
}

export async function deletePackage(id: string) {
  const supabase = await createClient();
  await supabase.from("packages").delete().eq("id", id);
  revalidatePath("/admin/packages");
}

export async function togglePackageActive(id: string, isActive: boolean) {
  const supabase = await createClient();
  await supabase.from("packages").update({ is_active: isActive, show_on_website: isActive }).eq("id", id);
  revalidatePath("/admin/packages");
}
