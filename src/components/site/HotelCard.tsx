import type { HotelRow } from "@/lib/types/database";
import { WHATSAPP_TEMPLATES } from "@/lib/whatsapp-templates";
import { ExternalImage } from "./ExternalImage";
import { WhatsAppButton } from "./WhatsAppButton";

export function HotelCard({ hotel }: { hotel: HotelRow }) {
  return (
    <div className="overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm">
      <div className="relative h-40 w-full bg-warm-ivory">
        {hotel.image_url && (
          <ExternalImage src={hotel.image_url} alt={hotel.name} fill className="object-cover" />
        )}
        {hotel.walk_time_minutes != null && (
          <span className="absolute right-3 top-3 rounded bg-masaar-black/80 px-2 py-1 text-[11px] font-medium text-white">
            {hotel.walk_time_minutes} min walk
          </span>
        )}
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-masaar-black">{hotel.name}</h3>
          {hotel.star_rating != null && (
            <span className="text-xs text-pure-gold">{"★".repeat(hotel.star_rating)}</span>
          )}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-masaar-black/60">
          {hotel.room_type && <span>Room Type: {hotel.room_type}</span>}
          {hotel.board_basis && <span>Board Basis: {hotel.board_basis}</span>}
        </div>
        {hotel.price_from_aed != null && (
          <div>
            <p className="text-xs text-masaar-black/50">From</p>
            <p className="text-lg font-semibold text-masaar-black">
              AED {hotel.price_from_aed.toLocaleString()}
              <span className="text-xs font-normal text-masaar-black/50"> per room per night</span>
            </p>
          </div>
        )}
        <WhatsAppButton message={WHATSAPP_TEMPLATES.hotel(hotel.name)} className="w-full">
          Enquire on WhatsApp
        </WhatsAppButton>
      </div>
    </div>
  );
}
