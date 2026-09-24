import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { listDocuments } from "@/lib/data/documents";
import { NewReceiptForm } from "./NewReceiptForm";

export const metadata: Metadata = { title: "Create Receipt | Masaar Admin", robots: { index: false } };

export default async function NewReceiptPage() {
  const invoices = await listDocuments("invoice", 50);

  return (
    <div>
      <PageHeader
        title="Create Receipt"
        description="Issue an official payment receipt against an invoice or as a standalone payment acknowledgment."
        breadcrumb={[
          { label: "Dashboard", href: "/admin" },
          { label: "Documents", href: "/admin/documents" },
          { label: "Receipts", href: "/admin/documents/receipts" },
          { label: "Create" },
        ]}
      />
      <div className="max-w-3xl">
        <NewReceiptForm invoices={invoices} />
      </div>
    </div>
  );
}
