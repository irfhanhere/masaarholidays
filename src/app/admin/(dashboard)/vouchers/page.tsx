import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, PrimaryButton, StatCard } from "@/components/admin/ui";
import { listDocuments } from "@/lib/data/documents";
import { VouchersClientList } from "./VouchersClientList";

export const metadata: Metadata = {
  title: "Travel Vouchers | Masaar Operations",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function VouchersOperationsPage() {
  const vouchers = await listDocuments("booking_voucher", 100);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Travel Vouchers"
        description="Issue granular service vouchers (Hotel Voucher, Airport Transfer, Intercity Transfer, Flight Itinerary, Ziyarah Tour) with supplier confirmation numbers and guest rosters."
        breadcrumb={[{ label: "Operations", href: "/admin" }, { label: "Travel Vouchers" }]}
        actions={
          <Link href="/admin/vouchers/new">
            <PrimaryButton>+ Issue Travel Voucher</PrimaryButton>
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Total Vouchers Issued" value={vouchers.length} />
        <StatCard label="Active Guests" value="Pilgrim Parties" />
        <StatCard label="Document Format" value="Masaar Official A4 PDF" />
      </div>

      <VouchersClientList initialVouchers={vouchers} />
    </div>
  );
}
