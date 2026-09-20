import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { HotelRow } from "@/lib/types/database";
import { HotelsListManager } from "./HotelsListManager";

export const metadata: Metadata = { title: "Hotels | Masaar Admin", robots: { index: false } };

export default async function AdminHotelsPage() {
  let hotels: HotelRow[] = [];
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase.from("hotels").select("*").order("display_order");
    hotels = data ?? [];
  }

  return <HotelsListManager hotels={hotels} />;
}
