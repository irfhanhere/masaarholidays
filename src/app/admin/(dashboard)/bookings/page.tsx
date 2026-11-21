import type { Metadata } from "next";
import { PageHeader, StatCard } from "@/components/admin/ui";
import { listBookings } from "@/lib/data/bookings";
import { BookingsClientList } from "./BookingsClientList";

export const metadata: Metadata = {
  title: "Bookings | Masaar Operations",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function BookingsPage() {
  const bookings = await listBookings({ limit: 200 });

  const total = bookings.length;
  const confirmed = bookings.filter((b) => b.booking_status === "confirmed" || b.booking_status === "in_progress").length;
  const fullyPaid = bookings.filter((b) => b.payment_status === "paid").length;
  const unpaidOrPartial = bookings.filter((b) => b.payment_status === "unpaid" || b.payment_status === "partially_paid").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Booking Management"
        description="Centralized command center for managing customer bookings, traveller rosters, itineraries, flight & hotel arrangements, invoices, and vouchers."
        breadcrumb={[{ label: "Operations", href: "/admin" }, { label: "Bookings" }]}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Bookings" value={total} />
        <StatCard label="Active Journeys" value={confirmed} />
        <StatCard label="Fully Paid" value={fullyPaid} />
        <StatCard label="Pending Balance" value={unpaidOrPartial} />
      </div>

      <BookingsClientList initialBookings={bookings} />
    </div>
  );
}
