import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { NewCustomerForm } from "./NewCustomerForm";

export const metadata: Metadata = {
  title: "New Customer | Masaar Operations",
  robots: { index: false },
};

export default function NewCustomerPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Add New Customer"
        description="Register a new customer profile into the Masaar central operations directory."
        breadcrumb={[
          { label: "Operations", href: "/admin" },
          { label: "Customers", href: "/admin/customers" },
          { label: "New" },
        ]}
      />

      <NewCustomerForm />
    </div>
  );
}
