"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { PackageItineraryDay, PackageType, PackageTier } from "@/lib/types/database";

export interface PackageFormState {
  status: "idle" | "error";
  message?: string;
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
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

export async function savePackage(
  packageId: string | null,
  _prevState: PackageFormState,
  formData: FormData
): Promise<PackageFormState> {
  const type = String(formData.get("type")) as PackageType;
  const tier = String(formData.get("tier")) as PackageTier;
  const title = String(formData.get("title") ?? "").trim();
  const cityDestination = String(formData.get("city_destination") ?? "").trim();
  const durationDays = Number(formData.get("duration_days"));
  const isActive = formData.get("is_active") === "on";
  const isFeatured = formData.get("is_featured") === "on";
  const heroImageUrl = String(formData.get("hero_image_url") ?? "").trim() || null;

  if (!title || !type || !tier || !durationDays) {
    return { status: "error", message: "Title, type, tier and duration are required." };
  }

  const roomPrices = parseRoomPrices(formData);
  const itinerary = parseItinerary(formData);
  const startingPrice = roomPrices.length > 0 ? Math.min(...roomPrices.map((r) => r.price_aed)) : null;

  const supabase = await createClient();

  const textField = (name: string) => String(formData.get(name) ?? "").trim() || null;

  const payload = {
    type,
    tier,
    title,
    city_destination: cityDestination || null,
    duration_days: durationDays,
    duration_label: textField("duration_label"),
    validity_label: textField("validity_label"),
    inclusions_text: textField("inclusions_text"),
    advance_booking_note: textField("advance_booking_note"),
    flight_note: textField("flight_note"),
    rate_disclaimer: textField("rate_disclaimer"),
    is_active: isActive,
    is_featured: isFeatured,
    show_on_website: isActive,
    hero_image_url: heroImageUrl,
    itinerary,
    starting_price_aed: startingPrice,
  };

  let id = packageId;

  if (id) {
    const { error } = await supabase.from("packages").update(payload).eq("id", id);
    if (error) return { status: "error", message: error.message };
  } else {
    const slug = `${slugify(title)}-${Date.now().toString(36)}`;
    const { data, error } = await supabase
      .from("packages")
      .insert({ ...payload, slug })
      .select("id")
      .single();
    if (error) return { status: "error", message: error.message };
    id = data.id;
  }

  // Replace room prices wholesale — simplest consistent approach for a
  // small, fully-resubmitted list.
  await supabase.from("package_room_prices").delete().eq("package_id", id);
  if (roomPrices.length > 0) {
    await supabase.from("package_room_prices").insert(
      roomPrices.map((r, i) => ({ package_id: id, room_type: r.room_type, price_aed: r.price_aed, display_order: i }))
    );
  }

  // Plus upgrade (brief Part 1: attached to the package, not a new tier).
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
