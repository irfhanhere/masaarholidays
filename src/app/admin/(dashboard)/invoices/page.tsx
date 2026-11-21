import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, PrimaryButton, StatCard } from "@/components/admin/ui";
import { listDocuments } from "@/lib/data/documents";
import { InvoicesClientList } from "../documents/invoices/InvoicesClientList";

export const metadata: Metadata = {
  title: "Invoices | Masaar Operations",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function InvoicesOperationsPage() {
  const invoices = await listDocuments("invoice", 100);

  const totalInvoiced = invoices.reduce((sum, inv) => sum + (Number(inv.total_aed) || 0), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + (Number(inv.amount_paid_aed) || 0), 0);
  const outstanding = Math.max(0, totalInvoiced - totalPaid);
  const paidCount = invoices.filter((i) => i.status === "paid").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoice Management"
        description="Issue Pro Forma and Final Sales Invoices connected to confirmed bookings and accepted quotations, with automated balance tracking and branded PDF output."
        breadcrumb={[
          { label: "Operations", href: "/admin" },
          { label: "Invoices" },
        ]}
        actions={
          <Link href="/admin/documents/invoices/new">
            <PrimaryButton>+ Create Invoice</PrimaryButton>
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Invoices" value={invoices.length} />
        <StatCard label="Total Invoiced" value={`AED ${totalInvoiced.toLocaleString()}`} />
        <StatCard label="Total Collected" value={`AED ${totalPaid.toLocaleString()}`} />
        <StatCard label="Outstanding Balance" value={`AED ${outstanding.toLocaleString()}`} />
      </div>

      <InvoicesClientList invoices={invoices} />
    </div>
  );
}
