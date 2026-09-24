import Link from "next/link";
import type { Metadata } from "next";
import { PageHeader, PrimaryButton } from "@/components/admin/ui";
import { listDocuments } from "@/lib/data/documents";
import { InvoicesClientList } from "./InvoicesClientList";

export const metadata: Metadata = { title: "Invoices | Masaar Admin", robots: { index: false } };

export default async function InvoicesListPage() {
  const invoices = await listDocuments("invoice");

  return (
    <div>
      <PageHeader
        title="Invoices"
        description="Create invoices from an accepted quotation, or manually."
        breadcrumb={[{ label: "Dashboard", href: "/admin" }, { label: "Documents", href: "/admin/documents" }, { label: "Invoices" }]}
        actions={
          <Link href="/admin/documents/invoices/new">
            <PrimaryButton>+ Create Invoice</PrimaryButton>
          </Link>
        }
      />

      <InvoicesClientList invoices={invoices} />
    </div>
  );
}
