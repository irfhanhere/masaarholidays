import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  VERIFIED_TRANSFER_VEHICLES,
  type VehicleCatalogItem,
} from "@/lib/data/transfers";
import {
  VehiclesManagerClient,
  type VehicleItem,
} from "./VehiclesManagerClient";

export const metadata: Metadata = {
  title: "Vehicle Manager — Transfers | Masaar Admin",
  robots: { index: false },
};

export default async function TransferVehiclesPage() {
  let vehicles: VehicleItem[] = [];
  let totalRoutesCount = 12;

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const [vehiclesRes, routesRes] = await Promise.all([
        supabase
          .from("transfer_vehicles")
          .select("*")
          .order("display_order", { ascending: true }),
        supabase.from("transfers").select("id", { count: "exact" }),
      ]);

      if (routesRes.count) {
        totalRoutesCount = routesRes.count;
      }

      const rows = (vehiclesRes.data || []) as any[];

      // Merge database rows with verified fleet specifications
      vehicles = VERIFIED_TRANSFER_VEHICLES.map((verified: VehicleCatalogItem) => {
        const dbRow = rows.find(
          (r: any) =>
            (r.id && r.id === verified.slug) ||
            r.name.toLowerCase() === verified.name.toLowerCase()
        );

        return {
          id: dbRow?.id || verified.slug,
          name: dbRow?.name || verified.name,
          display_order: dbRow?.display_order ?? verified.display_order,
          is_active: dbRow?.is_active ?? true,
          slug: dbRow?.slug || verified.slug,
          vehicle_type: dbRow?.vehicle_type || verified.vehicle_type,
          model_year: dbRow?.model_year || verified.model_year,
          description: dbRow?.description || verified.description,
          detailed_description: dbRow?.detailed_description || verified.detailed_description,
          image_url: dbRow?.image_url || verified.image_url,
          passenger_capacity: dbRow?.passenger_capacity ?? verified.passenger_capacity,
          luggage_capacity: dbRow?.luggage_capacity ?? verified.luggage_capacity,
          features: dbRow?.features || verified.features,
          spec_verified: true,
        };
      });

      // Also include any extra custom vehicles from the database not in our static catalog
      for (const row of rows) {
        const alreadyIncluded = vehicles.some(
          (v) =>
            v.id === row.id ||
            v.name.toLowerCase() === row.name.toLowerCase()
        );
        if (!alreadyIncluded) {
          vehicles.push({
            id: row.id,
            name: row.name,
            display_order: row.display_order ?? vehicles.length + 1,
            is_active: row.is_active ?? true,
            slug: row.slug || null,
            vehicle_type: row.vehicle_type || null,
            model_year: row.model_year || null,
            description: row.description || null,
            detailed_description: row.detailed_description || null,
            image_url: row.image_url || "/vehicles/TOYOTA CAMERY.webp",
            passenger_capacity: row.passenger_capacity ?? 4,
            luggage_capacity: row.luggage_capacity ?? 3,
            features: row.features || [],
            spec_verified: row.spec_verified ?? false,
          });
        }
      }
    } catch (err) {
      console.error("Error loading transfer vehicles:", err);
    }
  }

  // Fallback if DB fetch returned empty
  if (vehicles.length === 0) {
    vehicles = VERIFIED_TRANSFER_VEHICLES.map((v: VehicleCatalogItem) => ({
      id: v.slug,
      name: v.name,
      display_order: v.display_order,
      is_active: true,
      slug: v.slug,
      vehicle_type: v.vehicle_type,
      model_year: v.model_year,
      description: v.description,
      detailed_description: v.detailed_description,
      image_url: v.image_url,
      passenger_capacity: v.passenger_capacity,
      luggage_capacity: v.luggage_capacity,
      features: v.features,
      spec_verified: true,
    }));
  }

  // Sort by display_order
  vehicles.sort((a, b) => a.display_order - b.display_order);

  return (
    <div className="p-6">
      <VehiclesManagerClient
        initialVehicles={vehicles}
        totalRoutesCount={totalRoutesCount}
      />
    </div>
  );
}
