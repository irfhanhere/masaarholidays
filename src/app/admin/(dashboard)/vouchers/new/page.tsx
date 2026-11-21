import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { NewVoucherForm } from "./NewVoucherForm";

export const metadata: Metadata = {
  title: "Issue Travel Voucher | Masaar Operations",
  robots: { index: false },
};

export default function NewVoucherPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Issue Travel Voucher"
        description="Generate official branded travel vouchers for hotels, ground transfers, flights, or tours with supplier confirmation numbers."
        breadcrumb={[
          { label: "Operations", href: "/admin" },
          { label: "Vouchers", href: "/admin/vouchers" },
          { label: "New" },
        ]}
      />

      <NewVoucherForm />
    </div>
  );
}
