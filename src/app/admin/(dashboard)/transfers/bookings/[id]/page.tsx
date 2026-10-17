import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { TransferBookingRow } from "@/lib/types/database";
import { BookingDetailClient } from "./BookingDetailClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Booking #${id.slice(0, 8)} | Masaar Admin`,
    robots: { index: false },
  };
}

export default async function TransferBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    notFound();
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("transfer_bookings")
    .select("*")
    .eq("id", id)
    .maybeSingle<TransferBookingRow>();

  if (error || !data) {
    notFound();
  }

  return <BookingDetailClient booking={data} />;
}
