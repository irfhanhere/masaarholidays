import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { listDocuments } from "@/lib/data/documents";
import { NewBookingVoucherForm } from "./NewBookingVoucherForm";

export const metadata: Metadata = { title: "Create Booking Voucher | Masaar Admin", robots: { index: false } };

export default async function NewBookingVoucherPage() {
  const [quotations, invoices] = await Promise.all([
    listDocuments("quotation", 20),
    listDocuments("invoice", 20),
  ]);

  return (
    <div>
      <PageHeader
        title="Create Booking Voucher"
        description="Generate a booking confirmation from an accepted quotation or invoice, or start with fresh details."
        breadcrumb={[
          { label: "Dashboard", href: "/admin" },
          { label: "Documents", href: "/admin/documents" },
          { label: "Booking Vouchers", href: "/admin/documents/booking-vouchers" },
          { label: "Create" },
        ]}
      />
      <div className="max-w-4xl">
        <NewBookingVoucherForm quotations={quotations} invoices={invoices} />
      </div>
    </div>
  );
}
