import Link from "next/link";
import type { Metadata } from "next";
import { PageHeader, StatCard, PrimaryButton } from "@/components/admin/ui";
import { listDocuments } from "@/lib/data/documents";
import { BookingVouchersClientList } from "./BookingVouchersClientList";

export const metadata: Metadata = { title: "Booking Vouchers & Confirmations | Masaar Admin", robots: { index: false } };

export default async function BookingVouchersListPage() {
  const vouchers = await listDocuments("booking_voucher");

  const confirmedCount = vouchers.filter((v) => v.status === "confirmed" || v.status === "issued").length;
  const draftCount = vouchers.filter((v) => v.status === "draft").length;
  const sentCount = vouchers.filter((v) => v.status === "sent").length;

  return (
    <div>
      <PageHeader
        title="Booking Vouchers & Confirmations"
        description="Official booking confirmations and granular hotel/transfer vouchers generated for your guests and suppliers."
        breadcrumb={[
          { label: "Dashboard", href: "/admin" },
          { label: "Documents", href: "/admin/documents" },
          { label: "Booking Vouchers" },
        ]}
        actions={
          <Link href="/admin/documents/booking-vouchers/new">
            <PrimaryButton>+ Create Booking Voucher</PrimaryButton>
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-6">
        <StatCard label="Total Bookings" value={vouchers.length} />
        <StatCard label="Confirmed" value={confirmedCount} />
        <StatCard label="Drafts" value={draftCount} />
        <StatCard label="Sent to Clients" value={sentCount} />
      </div>

      <BookingVouchersClientList vouchers={vouchers} />
    </div>
  );
}
