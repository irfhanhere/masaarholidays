import Link from "next/link";
import type { Metadata } from "next";
import { PageHeader, Card, StatCard, Badge, PrimaryButton } from "@/components/admin/ui";
import { getDocumentCounts, listDocuments } from "@/lib/data/documents";
import type { DocumentRow, DocumentType } from "@/lib/types/database";

export const metadata: Metadata = { title: "Documents | Masaar Admin", robots: { index: false } };

const TYPE_LABEL: Record<DocumentType, string> = {
  quotation: "Quotation",
  invoice: "Invoice",
  receipt: "Receipt",
  booking_voucher: "Booking Voucher",
};

const MODULE_PATH: Record<DocumentType, string> = {
  quotation: "quotations",
  invoice: "invoices",
  receipt: "receipts",
  booking_voucher: "booking-vouchers",
};

function statusTone(status?: string | null): "green" | "amber" | "gray" | "blue" | "gold" {
  if (!status) return "blue";
  if (["accepted", "paid", "issued"].includes(status)) return "green";
  if (["sent", "viewed", "partially_paid"].includes(status)) return "gold";
  if (["rejected", "cancelled", "expired"].includes(status)) return "gray";
  if (status === "revision_requested") return "amber";
  return "blue";
}

function formatDate(value?: string | null): string {
  if (!value) return "—";
  try {
    const d = new Date(value);
    return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}

export default async function DocumentsOverviewPage() {
  const [counts, recentAll] = await Promise.all([getDocumentCounts(), listDocuments(undefined, 10)]);
  const recent = recentAll.filter((doc) => doc.document_type !== "quotation");

  return (
    <div>
      <PageHeader
        title="Documents"
        description="Invoices, receipts and booking vouchers — built from your existing Masaar packages, hotels, transfers and trips."
        breadcrumb={[{ label: "Dashboard", href: "/admin" }, { label: "Documents" }]}
        actions={
          <Link href="/admin/documents/invoices/new">
            <PrimaryButton>+ Create Invoice</PrimaryButton>
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatCard label="Invoices" value={counts.invoices} />
        <StatCard label="Receipts" value={counts.receipts} />
        <StatCard label="Booking Vouchers" value={counts.bookingVouchers} />
      </div>

      <Card className="mt-6 !p-0">
        <div className="border-b border-black/10 px-6 py-4">
          <h2 className="font-semibold text-masaar-black">Recent Documents</h2>
        </div>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/10 text-xs uppercase tracking-wide text-masaar-black/50">
              <th className="px-6 py-3 font-medium">Document No.</th>
              <th className="px-6 py-3 font-medium">Type</th>
              <th className="px-6 py-3 font-medium">Client</th>
              <th className="px-6 py-3 font-medium">Amount</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Date</th>
              <th className="px-6 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {recent.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-masaar-black/50">
                  No documents yet. Create your first invoice to get started.
                </td>
              </tr>
            )}
            {recent.map((doc: DocumentRow) => (
              <tr key={doc.id} className="border-b border-black/5 last:border-0">
                <td className="px-6 py-3 font-medium">{doc.document_number}</td>
                <td className="px-6 py-3">{TYPE_LABEL[doc.document_type] || doc.document_type}</td>
                <td className="px-6 py-3">{doc.client_name}</td>
                <td className="px-6 py-3">{Number(doc.total_aed ?? 0) > 0 ? `AED ${Number(doc.total_aed).toLocaleString()}` : "—"}</td>
                <td className="px-6 py-3">
                  <Badge tone={statusTone(doc.status)}>{(doc.status ?? "draft").replace(/_/g, " ")}</Badge>
                </td>
                <td className="px-6 py-3 text-masaar-black/60">{formatDate(doc.created_at)}</td>
                <td className="px-6 py-3">
                  {MODULE_PATH[doc.document_type] ? (
                    <Link href={`/admin/documents/${MODULE_PATH[doc.document_type]}/${doc.id}`} className="font-medium text-admin-primary hover:underline">
                      View
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
