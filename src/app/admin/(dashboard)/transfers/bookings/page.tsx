import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { TransferBookingsClient } from "./TransferBookingsClient";
import type { TransferBookingRow } from "@/lib/types/database";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Transfer Bookings | Masaar Admin",
  robots: { index: false },
};

export default async function AdminTransferBookingsPage() {
  let bookings: TransferBookingRow[] = [];

  if (isSupabaseConfigured()) {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("transfer_bookings")
      .select("*")
      .order("created_at", { ascending: false });

    bookings = (data as TransferBookingRow[]) || [];
  }

  return <TransferBookingsClient bookings={bookings} />;
}
