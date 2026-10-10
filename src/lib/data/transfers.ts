import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type {
  TransferRow,
  TransferType,
  TransferVehicleRow,
  TransferRouteRateRow,
} from "@/lib/types/database";
import {
  TRANSFER_CATEGORIES,
  VERIFIED_VEHICLE_CATALOG,
  SUPPLIED_RATE_CARD,
  VERIFIED_ROUTE_CATALOG,
  VERIFIED_TRANSFER_ROUTES,
  VERIFIED_TRANSFER_VEHICLES,
  TRANSFER_SUPPLIED_RATE_CARD,
  type TransferCategoryMeta,
  type VehicleCatalogItem,
  type VerifiedRouteMeta,
  type RouteVehicleOption,
  type EnrichedTransferRoute,
} from "./transfers-catalog";

export * from "./transfers-catalog";

/**
 * Normalizes vehicle row and matches with verified vehicle metadata
 */
function enrichVehicle(
  dbVehicle: TransferVehicleRow | null,
  rateRow: TransferRouteRateRow
): RouteVehicleOption {
  const catalog = VERIFIED_VEHICLE_CATALOG.find(
    (v) => v.name.toLowerCase() === dbVehicle?.name?.toLowerCase()
  ) || VERIFIED_VEHICLE_CATALOG[0];

  return {
    rateId: rateRow.id,
    vehicleId: dbVehicle?.id ?? rateRow.vehicle_id,
    vehicleName: dbVehicle?.name || catalog.name,
    vehicleSlug: catalog.slug,
    vehicleType: catalog.vehicle_type,
    modelYear: catalog.model_year,
    imageUrl: catalog.image_url,
    passengerCapacity: catalog.passenger_capacity,
    luggageCapacity: catalog.luggage_capacity,
    description: catalog.description,
    detailedDescription: catalog.detailed_description,
    features: catalog.features,
    priceAed: Number(rateRow.price_aed) || 0,
    isActive: rateRow.is_active,
    displayOrder: rateRow.display_order ?? catalog.display_order,
  };
}

/**
 * Returns all active transfers with starting indicative prices and vehicle options
 */
export async function getPublicTransfers(): Promise<EnrichedTransferRoute[]> {
  let dbTransfers: TransferRow[] = [];
  let dbVehicles: TransferVehicleRow[] = [];
  let dbRates: TransferRouteRateRow[] = [];

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const [tRes, vRes, rRes] = await Promise.all([
        supabase
          .from("transfers")
          .select("*")
          .eq("is_active", true)
          .order("display_order", { ascending: true }),
        supabase.from("transfer_vehicles").select("*").eq("is_active", true).order("display_order"),
        supabase.from("transfer_route_rates").select("*").eq("is_active", true),
      ]);
      dbTransfers = tRes.data ?? [];
      dbVehicles = vRes.data ?? [];
      dbRates = rRes.data ?? [];
    } catch (err) {
      console.error("getPublicTransfers DB error:", err);
    }
  }

  // Fallback to static catalog if DB is empty/unreachable
  if (dbTransfers.length === 0) {
    const staticRoutes = Object.values(VERIFIED_ROUTE_CATALOG);
    return staticRoutes.map((meta, idx) => {
      const rates = SUPPLIED_RATE_CARD[meta.slug] || {};
      const vehicleOptions: RouteVehicleOption[] = VERIFIED_VEHICLE_CATALOG.map((v) => ({
        rateId: `static-rate-${idx}-${v.slug}`,
        vehicleId: v.slug,
        vehicleName: v.name,
        vehicleSlug: v.slug,
        vehicleType: v.vehicle_type,
        modelYear: v.model_year,
        imageUrl: v.image_url,
        passengerCapacity: v.passenger_capacity,
        luggageCapacity: v.luggage_capacity,
        description: v.description,
        detailedDescription: v.detailed_description,
        features: v.features,
        priceAed: rates[v.name] || 0,
        isActive: true,
        displayOrder: v.display_order,
      }));

      const activePriced = vehicleOptions.filter((v) => v.isActive && v.priceAed > 0);
      const startingPrice =
        activePriced.length > 0 ? Math.min(...activePriced.map((v) => v.priceAed)) : null;

      return {
        id: `static-${meta.slug}`,
        route_name: meta.route_name,
        slug: meta.slug,
        transfer_type: meta.transfer_type,
        vehicle_type: null,
        vehicle_capacity: null,
        price_from_aed: startingPrice,
        description: meta.description,
        image_url: meta.image_url,
        is_active: true,
        display_order: idx + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        pickupLocation: meta.pickup_location,
        dropoffLocation: meta.dropoff_location,
        routeTypeKind: meta.route_type,
        durationText: meta.duration,
        longDescriptionText: meta.long_description,
        routeNotesText: meta.route_notes,
        isFeatured: meta.featured,
        startingPriceAed: startingPrice,
        activeVehiclesCount: activePriced.length,
        availableVehicles: vehicleOptions,
      };
    });
  }

  // Merge DB data with verified catalog metadata
  return dbTransfers.map((t) => {
    const meta = VERIFIED_ROUTE_CATALOG[t.slug];
    const routeRates = dbRates.filter((r) => r.transfer_id === t.id);

    const vehicleOptions: RouteVehicleOption[] = routeRates.map((rate) => {
      const vehicleRow = dbVehicles.find((v) => v.id === rate.vehicle_id) || null;
      return enrichVehicle(vehicleRow, rate);
    });

    // If no rates row found in DB, populate from supplied rate card
    if (vehicleOptions.length === 0) {
      const fallbackRates = SUPPLIED_RATE_CARD[t.slug] || {};
      for (const v of VERIFIED_VEHICLE_CATALOG) {
        vehicleOptions.push({
          rateId: `fallback-${t.id}-${v.slug}`,
          vehicleId: v.slug,
          vehicleName: v.name,
          vehicleSlug: v.slug,
          vehicleType: v.vehicle_type,
          modelYear: v.model_year,
          imageUrl: v.image_url,
          passengerCapacity: v.passenger_capacity,
          luggageCapacity: v.luggage_capacity,
          description: v.description,
          detailedDescription: v.detailed_description,
          features: v.features,
          priceAed: fallbackRates[v.name] || 0,
          isActive: true,
          displayOrder: v.display_order,
        });
      }
    }

    vehicleOptions.sort((a, b) => a.displayOrder - b.displayOrder);

    const activePriced = vehicleOptions.filter((v) => v.isActive && v.priceAed > 0);
    const startingPrice =
      t.price_from_aed ??
      (activePriced.length > 0 ? Math.min(...activePriced.map((v) => v.priceAed)) : null);

    return {
      ...t,
      pickupLocation: t.pickup_location || meta?.pickup_location || "Pick-up Location",
      dropoffLocation: t.dropoff_location || meta?.dropoff_location || "Drop-off Destination",
      routeTypeKind: (t.route_type as any) || meta?.route_type || "one-way",
      durationText: t.duration || meta?.duration || "1.5 – 2 hours",
      longDescriptionText: t.long_description || meta?.long_description || t.description || "",
      routeNotesText: t.route_notes || meta?.route_notes || "",
      isFeatured: t.featured ?? meta?.featured ?? false,
      startingPriceAed: startingPrice,
      activeVehiclesCount: activePriced.length,
      availableVehicles: vehicleOptions,
    };
  });
}

/**
 * Returns single transfer by slug with vehicle options and rates
 */
export async function getPublicTransferBySlug(
  slug: string
): Promise<EnrichedTransferRoute | null> {
  const all = await getPublicTransfers();
  const found = all.find((r) => r.slug === slug);
  return found || null;
}

/**
 * Returns all active vehicles
 */
export async function getAllTransferVehicles(): Promise<VehicleCatalogItem[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("transfer_vehicles")
        .select("*")
        .order("display_order", { ascending: true });
      if (data && data.length > 0) {
        return data.map((v) => {
          const cat = VERIFIED_VEHICLE_CATALOG.find(
            (c) => c.name.toLowerCase() === v.name.toLowerCase()
          ) || VERIFIED_VEHICLE_CATALOG[0];
          return {
            id: v.id,
            name: v.name,
            slug: (v as any).slug || cat.slug,
            vehicle_type: (v as any).vehicle_type || cat.vehicle_type,
            model_year: (v as any).model_year || cat.model_year,
            image_url: (v as any).image_url || cat.image_url,
            passenger_capacity: (v as any).passenger_capacity || cat.passenger_capacity,
            luggage_capacity: (v as any).luggage_capacity || cat.luggage_capacity,
            description: (v as any).description || cat.description,
            detailed_description: (v as any).detailed_description || cat.detailed_description,
            features: (v as any).features || cat.features,
            spec_verified: (v as any).spec_verified ?? true,
            display_order: v.display_order,
          };
        });
      }
    } catch (err) {
      console.error("getAllTransferVehicles DB error:", err);
    }
  }
  return VERIFIED_VEHICLE_CATALOG;
}
