import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { HotelRow } from "@/lib/types/database";
import { HotelsListManager } from "./HotelsListManager";

export const metadata: Metadata = { title: "Hotels | Masaar Admin", robots: { index: false } };

export default async function AdminHotelsPage() {
  let hotels: HotelRow[] = [];
  const roomCounts: Record<string, number> = {};
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const [{ data: hotelRows }, { data: roomRows }] = await Promise.all([
      supabase.from("hotels").select("*").order("display_order"),
      supabase.from("hotel_rooms").select("id, hotel_id"),
    ]);
    hotels = hotelRows ?? [];
    if (roomRows) {
      for (const r of roomRows) {
        roomCounts[r.hotel_id] = (roomCounts[r.hotel_id] || 0) + 1;
      }
    }
  }

  return <HotelsListManager hotels={hotels} roomCounts={roomCounts} />;
}
