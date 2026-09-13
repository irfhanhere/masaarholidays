import type { TransferRow } from "@/lib/types/database";
import { WHATSAPP_TEMPLATES } from "@/lib/whatsapp-templates";
import { ExternalImage } from "./ExternalImage";
import { WhatsAppButton } from "./WhatsAppButton";

export function TransferCard({ transfer }: { transfer: TransferRow }) {
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
          {transfer.vehicle_type && (
            <p className="text-sm text-masaar-black/60">{transfer.vehicle_type}</p>
          )}
          {transfer.description && (
            <p className="mt-1 text-sm text-masaar-black/60">{transfer.description}</p>
          )}
        </div>
        <div className="flex items-center gap-4">
          {transfer.price_from_aed != null && (
            <div className="text-right">
              <p className="text-xs text-masaar-black/50">From</p>
              <p className="text-lg font-semibold text-masaar-black">
                AED {transfer.price_from_aed.toLocaleString()}
              </p>
            </div>
          )}
          <WhatsAppButton message={WHATSAPP_TEMPLATES.transfer(transfer.route_name)}>
            Enquire on WhatsApp
          </WhatsAppButton>
        </div>
      </div>
    </div>
  );
}
