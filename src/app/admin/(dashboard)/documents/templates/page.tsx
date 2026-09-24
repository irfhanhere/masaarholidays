import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { getDocumentTemplates } from "@/lib/data/documents";
import { TemplateCard } from "./TemplateCard";

export const metadata: Metadata = { title: "Document Templates | Masaar Admin", robots: { index: false } };

export default async function DocumentTemplatesPage() {
  const [quotation, invoice, receipt, bookingVoucher] = await Promise.all([
    getDocumentTemplates("quotation"),
    getDocumentTemplates("invoice"),
    getDocumentTemplates("receipt"),
    getDocumentTemplates("booking_voucher"),
  ]);

  return (
    <div>
      <PageHeader
        title="Document Templates"
        description="Brand, layout and contact details used when generating each document type."
        breadcrumb={[{ label: "Dashboard", href: "/admin" }, { label: "Documents", href: "/admin/documents" }, { label: "Templates" }]}
      />
      <div className="space-y-8">
        {[
          { label: "Quotation Templates", templates: quotation },
          { label: "Invoice Templates", templates: invoice },
          { label: "Receipt Templates", templates: receipt },
          { label: "Booking Voucher Templates", templates: bookingVoucher },
        ].map((group) => (
          <div key={group.label}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-masaar-black/60">{group.label}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {group.templates.map((t) => (
                <TemplateCard key={t.id} template={t} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
