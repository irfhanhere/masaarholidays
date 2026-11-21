import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, PrimaryButton, StatCard } from "@/components/admin/ui";
import { listSuppliers } from "@/lib/data/suppliers";
import { SuppliersClientList } from "./SuppliersClientList";

export const metadata: Metadata = {
  title: "Suppliers | Masaar Operations",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function SuppliersPage() {
  const suppliers = await listSuppliers();

  const total = suppliers.length;
  const hotels = suppliers.filter((s) => s.category === "hotel").length;
  const transport = suppliers.filter((s) => s.category === "transport").length;
  const airlines = suppliers.filter((s) => s.category === "airline").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Supplier Management"
        description="Contracted service partner directory for hotels, airlines, ground fleet, visa authorities, and eSIM providers with distinct cost tracking and payment terms."
        breadcrumb={[{ label: "Operations", href: "/admin" }, { label: "Suppliers" }]}
        actions={
          <Link href="/admin/suppliers/new">
            <PrimaryButton>+ Add Supplier Profile</PrimaryButton>
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Suppliers" value={total} />
        <StatCard label="Hotels" value={hotels} />
        <StatCard label="Fleet & Transport" value={transport} />
        <StatCard label="Airlines & Carriers" value={airlines} />
      </div>

      <SuppliersClientList initialSuppliers={suppliers} />
    </div>
  );
}
