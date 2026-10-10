import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  VERIFIED_TRANSFER_ROUTES,
  VERIFIED_TRANSFER_VEHICLES,
  TRANSFER_SUPPLIED_RATE_CARD,
  type VehicleCatalogItem,
  type VerifiedRouteMeta,
} from "@/lib/data/transfers";
import {
  RateCardMatrixClient,
  type RateCardRouteItem,
  type RateCardVehicleItem,
  type RateCardCellState,
} from "./RateCardMatrixClient";

export const metadata: Metadata = {
  title: "Transfer Rate Card | Masaar Admin",
  robots: { index: false },
};

export default async function TransferRateCardPage() {
  let routes: RateCardRouteItem[] = [];
  let vehicles: RateCardVehicleItem[] = [];
  const rateMap: Record<string, RateCardCellState> = {};

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const [routesRes, vehiclesRes, ratesRes] = await Promise.all([
        supabase.from("transfers").select("*").order("display_order", { ascending: true }),
        supabase.from("transfer_vehicles").select("*").order("display_order", { ascending: true }),
        supabase.from("transfer_route_rates").select("transfer_id, vehicle_id, price_aed, is_active"),
      ]);

      const dbRoutes = routesRes.data ?? [];
      const dbVehicles = vehiclesRes.data ?? [];
      const dbRates = ratesRes.data ?? [];

      // 1. Process routes
      if (dbRoutes.length > 0) {
        routes = dbRoutes.map((r: any) => ({
          id: r.id,
          route_name: r.route_name,
          slug: r.slug,
          transfer_type: r.transfer_type || "airport",
          description: r.description || null,
          image_url: r.image_url || "/trips/jeddah-airport-to-makkah.webp",
          is_active: r.is_active ?? true,
          display_order: r.display_order ?? 0,
        }));
      }

      // 2. Process vehicles
      if (dbVehicles.length > 0) {
        vehicles = dbVehicles.map((v: any) => {
          const verified = VERIFIED_TRANSFER_VEHICLES.find(
            (vv: VehicleCatalogItem) =>
              vv.slug === v.slug ||
              vv.name.toLowerCase() === v.name.toLowerCase()
          );
          return {
            id: v.id,
            name: v.name,
            display_order: v.display_order ?? 0,
            image_url: v.image_url || verified?.image_url || "/vehicles/TOYOTA CAMERY.webp",
            passengers: v.passenger_capacity ?? verified?.passenger_capacity ?? 3,
            luggage: v.luggage_capacity ?? verified?.luggage_capacity ?? 3,
          };
        });
      }

      // 3. Process rates from DB
      for (const r of dbRates) {
        rateMap[`${r.transfer_id}__${r.vehicle_id}`] = {
          price_aed: Number(r.price_aed) || 0,
          is_active: r.is_active ?? true,
        };
      }
    } catch (err) {
      console.error("Error fetching rate card:", err);
    }
  }

  // Fallbacks if DB is offline or empty
  if (routes.length === 0) {
    routes = VERIFIED_TRANSFER_ROUTES.map((r: VerifiedRouteMeta, i: number) => ({
      id: r.slug,
      route_name: r.route_name,
      slug: r.slug,
      transfer_type: r.transfer_type,
      description: r.description,
      image_url: r.image_url,
      is_active: true,
      display_order: i + 1,
    }));
  }

  if (vehicles.length === 0) {
    vehicles = VERIFIED_TRANSFER_VEHICLES.map((v: VehicleCatalogItem) => ({
      id: v.slug,
      name: v.name,
      display_order: v.display_order,
      image_url: v.image_url,
      passengers: v.passenger_capacity,
      luggage: v.luggage_capacity,
    }));
  }

  // Ensure every route x vehicle pair has a seeded default from the supplied rate card
  for (const r of routes) {
    const routeCard = TRANSFER_SUPPLIED_RATE_CARD[r.slug];

    for (const v of vehicles) {
      const key = `${r.id}__${v.id}`;
      if (!rateMap[key]) {
        let price = 0;
        if (routeCard) {
          for (const [vName, p] of Object.entries(routeCard)) {
            if (
              v.name.toLowerCase().includes(vName.toLowerCase()) ||
              vName.toLowerCase().includes(v.name.toLowerCase())
            ) {
              price = p;
              break;
            }
          }
        }

        rateMap[key] = {
          price_aed: price,
          is_active: price > 0,
        };
      }
    }
  }

  return (
    <div className="p-6">
      <RateCardMatrixClient
        routes={routes}
        vehicles={vehicles}
        initialRateMap={rateMap}
      />
    </div>
  );
}
