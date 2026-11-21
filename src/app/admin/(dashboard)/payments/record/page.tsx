import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { RecordPaymentForm } from "./RecordPaymentForm";

export const metadata: Metadata = {
  title: "Record Payment | Masaar Operations",
  robots: { index: false },
};

export default function RecordPaymentPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Record Payment"
        description="Log a confirmed payment against a booking or invoice and generate an authoritative Masaar receipt."
        breadcrumb={[
          { label: "Operations", href: "/admin" },
          { label: "Payments", href: "/admin/payments" },
          { label: "Record" },
        ]}
      />

      <RecordPaymentForm />
    </div>
  );
}
