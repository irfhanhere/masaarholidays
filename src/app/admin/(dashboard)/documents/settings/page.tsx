import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { getDocumentSettings } from "@/lib/data/documents";
import { SettingsForm } from "./SettingsForm";

export const metadata: Metadata = { title: "Document Settings | Masaar Admin", robots: { index: false } };

export default async function DocumentSettingsPage() {
  const settings = await getDocumentSettings();

  return (
    <div>
      <PageHeader
        title="Document Settings"
        description="Numbering prefixes for quotations, invoices, receipts and booking vouchers."
        breadcrumb={[{ label: "Dashboard", href: "/admin" }, { label: "Documents", href: "/admin/documents" }, { label: "Settings" }]}
      />
      {settings ? (
        <SettingsForm settings={settings} />
      ) : (
        <p className="text-sm text-masaar-black/60">Settings not found — run migration 0074 in Supabase.</p>
      )}
    </div>
  );
}
