import type { Metadata } from "next";
import { PageHeader, StatCard } from "@/components/admin/ui";
import { listCustomers } from "@/lib/data/customers";
import { CustomersClientList } from "./CustomersClientList";

export const metadata: Metadata = {
  title: "Customers | Masaar Operations",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const customers = await listCustomers({ limit: 200 });

  const total = customers.length;
  const corporate = customers.filter((c) => c.customer_type === "corporate").length;
  const vip = customers.filter((c) => c.customer_type === "vip").length;
  const individual = customers.filter((c) => c.customer_type === "individual").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Management"
        description="Centralized directory of customers, travellers, and comprehensive operational history across quotations, bookings, invoices, and payments."
        breadcrumb={[{ label: "Operations", href: "/admin" }, { label: "Customers" }]}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Customers" value={total} />
        <StatCard label="Individual" value={individual} />
        <StatCard label="Corporate" value={corporate} />
        <StatCard label="VIP Pilgrims" value={vip} />
      </div>

      <CustomersClientList initialCustomers={customers} />
    </div>
  );
}
