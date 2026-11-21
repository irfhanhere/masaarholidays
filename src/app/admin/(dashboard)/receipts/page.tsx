import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, PrimaryButton, StatCard } from "@/components/admin/ui";
import { listDocuments } from "@/lib/data/documents";
import { ReceiptsClientList } from "../documents/receipts/ReceiptsClientList";

export const metadata: Metadata = {
  title: "Receipts | Masaar Operations",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function ReceiptsOperationsPage() {
  const receipts = await listDocuments("receipt", 100);

  const totalCollected = receipts.reduce(
    (sum, r) => sum + (Number(r.amount_paid_aed || r.total_aed) || 0),
    0
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment Receipts"
        description="Official payment receipt vouchers (MAS-RC-2026-XXXX) issued against authoritative gateway events and confirmed manual bank transfers/cash collections."
        breadcrumb={[
          { label: "Operations", href: "/admin" },
          { label: "Receipts" },
        ]}
        actions={
          <Link href="/admin/payments/record">
            <PrimaryButton>+ Record Payment & Issue Receipt</PrimaryButton>
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Total Receipts Issued" value={receipts.length} />
        <StatCard label="Total Funds Reconciled" value={`AED ${totalCollected.toLocaleString()}`} />
        <StatCard label="Default Currency" value="AED (UAE Dirham)" />
      </div>

      <ReceiptsClientList receipts={receipts} />
    </div>
  );
}
