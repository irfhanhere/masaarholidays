import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { NewInvoiceForm } from "./NewInvoiceForm";

export const metadata: Metadata = { title: "Create Invoice | Masaar Admin", robots: { index: false } };

export default function NewInvoicePage() {
  return (
    <div>
      <PageHeader
        title="Create Invoice"
        description="Start with client details — you'll add packages, hotels, transfers and pricing next."
        breadcrumb={[
          { label: "Dashboard", href: "/admin" },
          { label: "Documents", href: "/admin/documents" },
          { label: "Invoices", href: "/admin/documents/invoices" },
          { label: "Create" },
        ]}
      />
      <div className="max-w-3xl">
        <NewInvoiceForm />
      </div>
    </div>
  );
}
