import Link from "next/link";
import type { Metadata } from "next";
import { PageHeader, PrimaryButton, StatCard } from "@/components/admin/ui";
import { getDocumentCounts, listDocuments } from "@/lib/data/documents";
import { QuotationsClientList } from "./QuotationsClientList";

import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Quotations | Masaar Admin",
  robots: { index: false },
};

export default async function QuotationsPage() {
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
  const revisionCount = quotations.filter((q) => q.status === "revision_requested").length;
  const acceptedCount = quotations.filter((q) => q.status === "accepted").length;

  return (
    <div>
      <PageHeader
        title="Quotations"
        description="Build, customise and send bespoke pilgrimage quotations with multi-version history and client approval."
        breadcrumb={[
          { label: "Dashboard", href: "/admin" },
          { label: "Documents", href: "/admin/documents" },
          { label: "Quotations" },
        ]}
        actions={
          <Link href="/admin/documents/quotations/new">
            <PrimaryButton>+ Create Quotation</PrimaryButton>
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Draft Quotations" value={draftCount} />
        <StatCard label="Awaiting Client" value={sentCount} />
        <StatCard label="Revision Requested" value={revisionCount} />
        <StatCard label="Accepted Quotations" value={acceptedCount} />
      </div>

      <div className="mt-6">
        <QuotationsClientList quotations={quotations} shareMap={shareMap} />
      </div>
    </div>
  );
}
