import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { getOperationsReport } from "@/lib/data/operations-reports";
import { ReportsClientDashboard } from "./ReportsClientDashboard";

export const metadata: Metadata = {
  title: "Reports & Profitability | Masaar Operations",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const data = await getOperationsReport();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operations & Financial Reporting"
        description="Comprehensive business analytics covering quotation pipeline, package sales performance, gross profit margins, supplier cost reconciliation, and outstanding payment aging."
        breadcrumb={[{ label: "Operations", href: "/admin" }, { label: "Reports" }]}
      />

      <ReportsClientDashboard initialData={data} />
    </div>
  );
}
