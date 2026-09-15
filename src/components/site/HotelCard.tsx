import Link from "next/link";
import type { HotelRow } from "@/lib/types/database";
import { formatWalkTime } from "@/lib/hotel-format";
import { WHATSAPP_TEMPLATES } from "@/lib/whatsapp-templates";
import { ExternalImage } from "./ExternalImage";
import { Price } from "./Price";
import { WhatsAppButton } from "./WhatsAppButton";

export function HotelCard({ hotel }: { hotel: HotelRow }) {
  const walkTime = formatWalkTime(hotel);

  return (
    <div className="overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm">
      <Link href={`/hotels/${hotel.slug}`} className="block">
        <div className="relative h-40 w-full bg-warm-ivory">
          {hotel.image_url && (
            <ExternalImage src={hotel.image_url} alt={hotel.name} fill className="object-cover" />
          )}
          {walkTime && (
            <span className="absolute right-3 top-3 rounded bg-masaar-black/80 px-2 py-1 text-[11px] font-medium text-white">
              {walkTime}
            </span>
          )}
        </div>
      </Link>
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/hotels/${hotel.slug}`}>
            <h3 className="font-semibold text-masaar-black hover:text-deep-gold">{hotel.name}</h3>
          </Link>
          {hotel.star_rating != null && (
            <span className="text-xs text-pure-gold">{"★".repeat(hotel.star_rating)}</span>
          )}
        </div>
        {hotel.terrain_note ? (
          <p className="text-xs text-masaar-black/60">{hotel.terrain_note}</p>
        ) : (
          hotel.category && <p className="text-xs text-masaar-black/60">{hotel.category}</p>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-masaar-black/60">
          {hotel.room_type && <span>Room Type: {hotel.room_type}</span>}
          {hotel.board_basis && <span>Board Basis: {hotel.board_basis}</span>}
        </div>
        {hotel.price_from_aed != null && (
          <div>
            <p className="text-xs text-masaar-black/50">From</p>
            <p className="text-lg font-semibold text-masaar-black">
              <Price amountAed={hotel.price_from_aed} />
              <span className="text-xs font-normal text-masaar-black/50"> per room per night</span>
            </p>
          </div>
        )}
        <div className="flex gap-2">
          <Link
            href={`/hotels/${hotel.slug}`}
            className="flex-1 rounded-md border border-black/15 px-4 py-2.5 text-center text-sm font-semibold text-masaar-black hover:bg-warm-ivory"
          >
            View Rooms
          </Link>
          <WhatsAppButton message={WHATSAPP_TEMPLATES.hotel(hotel.name)} className="flex-1">
            WhatsApp
          </WhatsAppButton>
        </div>
      </div>
    </div>
  );
}
