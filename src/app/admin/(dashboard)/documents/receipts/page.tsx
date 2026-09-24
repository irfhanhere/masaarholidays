import Link from "next/link";
import type { Metadata } from "next";
import { PageHeader, PrimaryButton } from "@/components/admin/ui";
import { listDocuments } from "@/lib/data/documents";
import { ReceiptsClientList } from "./ReceiptsClientList";

export const metadata: Metadata = { title: "Receipts | Masaar Admin", robots: { index: false } };

export default async function ReceiptsListPage() {
  const receipts = await listDocuments("receipt");

  return (
    <div>
      <PageHeader
        title="Receipts"
        description="Receipts are generated automatically when a payment is recorded against an invoice or issued directly."
        breadcrumb={[
          { label: "Dashboard", href: "/admin" },
          { label: "Documents", href: "/admin/documents" },
          { label: "Receipts" },
        ]}
        actions={
          <Link href="/admin/documents/receipts/new">
            <PrimaryButton>+ Create Receipt</PrimaryButton>
          </Link>
        }
      />

      <ReceiptsClientList receipts={receipts} />
    </div>
  );
}
