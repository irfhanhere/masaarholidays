import type { Metadata } from "next";
import { Card, PageHeader, PrimaryButton } from "@/components/admin/ui";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { TransferRow, TransferVehicleRow } from "@/lib/types/database";
import { updateRateCard } from "./actions";

export const metadata: Metadata = { title: "Transfer Rate Card | Masaar Admin", robots: { index: false } };

export default async function TransferRateCardPage() {
  let routes: TransferRow[] = [];
  let vehicles: TransferVehicleRow[] = [];
  const rateMap = new Map<string, number>(); // `${transfer_id}__${vehicle_id}` -> price

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const [routesRes, vehiclesRes, ratesRes] = await Promise.all([
      supabase.from("transfers").select("*").order("display_order"),
      supabase.from("transfer_vehicles").select("*").order("display_order"),
      supabase.from("transfer_route_rates").select("transfer_id, vehicle_id, price_aed"),
    ]);
    routes = routesRes.data ?? [];
    vehicles = vehiclesRes.data ?? [];
    for (const rate of ratesRes.data ?? []) {
      rateMap.set(`${rate.transfer_id}__${rate.vehicle_id}`, rate.price_aed);
    }
  }

  return (
    <div>
      <PageHeader
        title="Transfer Rate Card"
        description="Internal reference only — route × vehicle pricing, for the team to quote from on WhatsApp. Never shown on the public Transfers page."
        breadcrumb={[
          { label: "Dashboard", href: "/admin" },
          { label: "Transfers", href: "/admin/transfers" },
          { label: "Rate Card" },
        ]}
      />

      <div className="mb-4 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
        Prices here are admin-only (enforced at the database level, not just hidden in the UI) —
        the public Transfers page shows route + available vehicles only, no numbers.
      </div>

      {routes.length === 0 || vehicles.length === 0 ? (
        <Card>
          <p className="text-sm text-masaar-black/60">
            No routes/vehicles yet. Seeded by supabase/migrations/0006_seed_transfer_rate_card.sql.
          </p>
        </Card>
      ) : (
        <form action={updateRateCard}>
          <Card className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-black/10">
                  <th className="py-2 pr-4">Route</th>
                  {vehicles.map((v) => (
                    <th key={v.id} className="whitespace-nowrap px-2 py-2 text-center">
                      {v.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {routes.map((route) => (
                  <tr key={route.id}>
                    <td className="py-2 pr-4 font-medium text-masaar-black">{route.route_name}</td>
                    {vehicles.map((vehicle) => (
                      <td key={vehicle.id} className="px-2 py-2 text-center">
                        <input
                          type="number"
                          min={0}
                          step="1"
                          name={`rate__${route.id}__${vehicle.id}`}
                          defaultValue={rateMap.get(`${route.id}__${vehicle.id}`) ?? ""}
                          placeholder="—"
                          className="w-20 rounded border border-black/15 px-2 py-1 text-center text-sm"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 flex justify-end">
              <PrimaryButton type="submit">Save Rate Card</PrimaryButton>
            </div>
          </Card>
        </form>
      )}
    </div>
  );
}
