import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, PrimaryButton, StatCard } from "@/components/admin/ui";
import { listPayments } from "@/lib/data/payments";
import { PaymentsClientList } from "./PaymentsClientList";

export const metadata: Metadata = {
  title: "Payments | Masaar Operations",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const payments = await listPayments(100);

  const totalCollected = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const bankTransfers = payments.filter((p) => p.payment_method === "bank_transfer").length;
  const cardsAndGateways = payments.filter((p) => p.payment_method === "stripe" || p.payment_method === "tamara" || p.payment_method === "credit_card").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments Ledger"
        description="Unified financial record of customer payments received across Bank Transfers, Cash, Stripe, and Tamara, reconciled against bookings and invoices."
        breadcrumb={[{ label: "Operations", href: "/admin" }, { label: "Payments" }]}
        actions={
          <Link href="/admin/payments/record">
            <PrimaryButton>+ Record Payment</PrimaryButton>
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Transactions" value={payments.length} />
        <StatCard label="Total Collected" value={`AED ${totalCollected.toLocaleString()}`} />
        <StatCard label="Bank Transfers" value={bankTransfers} />
        <StatCard label="Online / Cards" value={cardsAndGateways} />
      </div>

      <PaymentsClientList initialPayments={payments} />
    </div>
  );
}
