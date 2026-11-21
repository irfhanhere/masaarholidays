import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { NewSupplierForm } from "./NewSupplierForm";

export const metadata: Metadata = {
  title: "Add Supplier | Masaar Operations",
  robots: { index: false },
};

export default function NewSupplierPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Supplier Profile"
        description="Register a hotel, transport operator, airline carrier, visa partner, or tour provider in the Masaar supplier directory."
        breadcrumb={[
          { label: "Operations", href: "/admin" },
          { label: "Suppliers", href: "/admin/suppliers" },
          { label: "New" },
        ]}
      />

      <NewSupplierForm />
    </div>
  );
}
