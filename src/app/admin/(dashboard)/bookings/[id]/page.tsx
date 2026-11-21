import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { getBookingById } from "@/lib/data/bookings";
import { BookingDetailView } from "./BookingDetailView";

export const metadata: Metadata = {
  title: "Booking Details | Masaar Operations",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getBookingById(id);

  if (!detail) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={detail.booking.booking_reference}
        description={`Journey: ${detail.booking.package_name} • Manage fulfilment, itinerary, traveller roster, invoices, receipts, and vouchers.`}
        breadcrumb={[
          { label: "Operations", href: "/admin" },
          { label: "Bookings", href: "/admin/bookings" },
          { label: detail.booking.booking_reference },
        ]}
      />

      <BookingDetailView detail={detail} />
    </div>
  );
}
