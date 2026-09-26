import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { getDocumentSettings, getDefaultTemplate } from "@/lib/data/documents";
import { SettingsForm } from "./SettingsForm";

export const metadata: Metadata = {
  title: "Document & PDF Settings | Masaar Admin",
  robots: { index: false },
};

export default async function DocumentSettingsPage() {
  const [
    settings,
    quotationTemplate,
    invoiceTemplate,
    receiptTemplate,
    voucherTemplate,
  ] = await Promise.all([
    getDocumentSettings(),
    getDefaultTemplate("quotation"),
    getDefaultTemplate("invoice"),
    getDefaultTemplate("receipt"),
    getDefaultTemplate("booking_voucher"),
  ]);

  return (
    <div>
      <PageHeader
        title="Document & PDF Settings"
        description="Configure numbering prefixes, default Terms & Conditions, company details, bank accounts, and PDF branding."
        breadcrumb={[
          { label: "Dashboard", href: "/admin" },
          { label: "Documents", href: "/admin/documents" },
          { label: "Settings" },
        ]}
      />
      {settings ? (
        <SettingsForm
          settings={settings}
          templates={{
            quotation: quotationTemplate,
            invoice: invoiceTemplate,
            receipt: receiptTemplate,
            booking_voucher: voucherTemplate,
          }}
        />
      ) : (
        <p className="text-sm text-masaar-black/60">
          Settings not found — run migration 0074 in Supabase.
        </p>
      )}
    </div>
  );
}
