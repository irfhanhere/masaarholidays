import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, PrimaryButton, StatCard } from "@/components/admin/ui";
import { getDocumentCounts, listDocuments } from "@/lib/data/documents";
import { QuotationsClientList } from "../documents/quotations/QuotationsClientList";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Quotations | Masaar Operations",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function QuotationsOperationsPage() {
  const supabase = createAdminClient();
  const [counts, quotations, { data: sharesData }] = await Promise.all([
    getDocumentCounts(),
    listDocuments("quotation", 100),
    supabase.from("document_shares").select("document_id, share_token"),
  ]);

  const shareMap: Record<string, string> = {};
  sharesData?.forEach((s) => {
    if (s.document_id && s.share_token) shareMap[s.document_id] = s.share_token;
  });

  const draftCount = quotations.filter((q) => q.status === "draft").length;
  const sentCount = quotations.filter((q) => ["sent", "viewed"].includes(q.status)).length;
  const acceptedCount = quotations.filter((q) => q.status === "accepted" || q.status === "converted").length;
  const totalValue = quotations.reduce((sum, q) => sum + (Number(q.total_aed) || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quotation Management"
        description="Build, price, snapshot, and deliver bespoke pilgrimage and travel quotations with multi-version history, WhatsApp sharing, and booking conversion."
        breadcrumb={[
          { label: "Operations", href: "/admin" },
          { label: "Quotations" },
        ]}
        actions={
          <Link href="/admin/documents/quotations/new">
            <PrimaryButton>+ Create Quotation</PrimaryButton>
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Quotations" value={quotations.length} />
        <StatCard label="Draft Proposals" value={draftCount} />
        <StatCard label="Sent & Viewed" value={sentCount} />
        <StatCard label="Accepted / Booked" value={acceptedCount} />
      </div>

      <QuotationsClientList quotations={quotations} shareMap={shareMap} />
    </div>
  );
}
