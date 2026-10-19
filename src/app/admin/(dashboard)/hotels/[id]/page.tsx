import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HotelForm } from "../HotelForm";
import { fetchHotelReviewsForAdmin } from "../review-actions";

export const metadata = { title: "Edit Hotel | Masaar Admin", robots: { index: false } };

export default async function EditHotelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: hotel } = await supabase.from("hotels").select("*").eq("id", id).maybeSingle();
  if (!hotel) notFound();

  const { data: rooms } = await supabase.from("hotel_rooms").select("*").eq("hotel_id", id).order("display_order");
  const reviews = await fetchHotelReviewsForAdmin(hotel.slug, hotel.id);

  return (
    <HotelForm
      hotelId={hotel.id}
      initial={hotel}
      rooms={rooms ?? []}
      reviews={reviews ?? []}
    />
  );
}
