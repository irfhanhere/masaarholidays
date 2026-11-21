import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { getCustomerById } from "@/lib/data/customers";
import { CustomerDetailView } from "./CustomerDetailView";

export const metadata: Metadata = {
  title: "Customer Profile | Masaar Operations",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const history = await getCustomerById(id);

  if (!history) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={history.customer.full_name}
        description={`Customer ID: ${history.customer.customer_number} • Manage contact information, travellers, quotes, bookings, and financial ledger.`}
        breadcrumb={[
          { label: "Operations", href: "/admin" },
          { label: "Customers", href: "/admin/customers" },
          { label: history.customer.customer_number },
        ]}
      />

      <CustomerDetailView history={history} />
    </div>
  );
}
