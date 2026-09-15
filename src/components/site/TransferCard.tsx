import type { TransferRow, TransferRouteAvailableVehicleRow } from "@/lib/types/database";
import { ExternalImage } from "./ExternalImage";
import { WhatsAppButton } from "./WhatsAppButton";

/**
 * No pricing here, deliberately — masaar-client-data-round2.md Section 3:
 * "Haseeb does not want these prices shown on the public Transfers page."
 * Route + available vehicle options + a single WhatsApp CTA only. The
 * `vehicles` prop comes from the public-safe view that never carries a
 * price column in the first place — see lib/data/public.ts.
 */
export function TransferCard({
  transfer,
  vehicles,
}: {
  transfer: TransferRow;
  vehicles: TransferRouteAvailableVehicleRow[];
}) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-black/10 bg-white p-4 sm:flex-row">
      <div className="relative h-32 w-full shrink-0 overflow-hidden rounded-md bg-warm-ivory sm:w-48">
        {transfer.image_url && (
          <ExternalImage src={transfer.image_url} alt={transfer.route_name} fill className="object-cover" />
        )}
      </div>
      <div className="flex flex-1 flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h3 className="font-semibold text-masaar-black">{transfer.route_name}</h3>
          {transfer.description && (
            <p className="mt-1 text-sm text-masaar-black/60">{transfer.description}</p>
          )}
          {vehicles.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {vehicles.map((v) => (
                <span
                  key={v.vehicle_id}
                  className="rounded-full bg-warm-ivory px-2.5 py-1 text-xs font-medium text-masaar-black/70"
                >
                  {v.vehicle_name}
                </span>
              ))}
            </div>
          )}
        </div>
        <WhatsAppButton templateKey="transfer" params={{ route: transfer.route_name }}>
          Enquire on WhatsApp
        </WhatsAppButton>
      </div>
    </div>
  );
}
