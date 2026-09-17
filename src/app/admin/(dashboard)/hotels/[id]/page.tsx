import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/ui";
import { createClient } from "@/lib/supabase/server";
import { HotelForm } from "../HotelForm";
import { HotelRoomsManager } from "../HotelRoomsManager";

export const metadata = { title: "Edit Hotel | Masaar Admin", robots: { index: false } };

export default async function EditHotelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: hotel } = await supabase.from("hotels").select("*").eq("id", id).maybeSingle();
  if (!hotel) notFound();

  const { data: rooms } = await supabase.from("hotel_rooms").select("*").eq("hotel_id", id).order("display_order");

  return (
    <div>
      <PageHeader
        title={`Edit ${hotel.name}`}
        breadcrumb={[{ label: "Dashboard", href: "/admin" }, { label: "Hotels", href: "/admin/hotels" }, { label: "Edit" }]}
      />
      <HotelForm hotelId={hotel.id} initial={hotel} />
      <div className="mt-6">
        <HotelRoomsManager hotelId={hotel.id} rooms={rooms ?? []} />
      </div>
    </div>
  );
}
