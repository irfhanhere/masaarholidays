import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSharedDocument } from "@/lib/data/documents";
import { WHATSAPP_DEFAULT_PHONE } from "@/lib/whatsapp-templates";
import { DocumentView } from "@/components/documents/DocumentView";
import { QuoteActions } from "./QuoteActions";

import { ClientQuotationPortal } from "./ClientQuotationPortal";

export const metadata: Metadata = { title: "Your Masaar Holidays Document", robots: { index: false, follow: false } };

export default async function PublicQuotePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await getSharedDocument(token);
  if (!result) notFound();

  const { document, items, template } = result;

  const supabase = createAdminClient();
  const { data: settings } = await supabase.from("whatsapp_settings").select("phone_number").eq("id", 1).maybeSingle();
  const { data: sourceDocument } =
    document.document_type === "receipt" && document.source_document_id
      ? await supabase.from("documents").select("document_number").eq("id", document.source_document_id).maybeSingle()
      : { data: null };

  if (document.document_type === "quotation") {
    return (
      <ClientQuotationPortal
        token={token}
        document={document}
        items={items}
        template={template}
        whatsappPhone={settings?.phone_number ?? WHATSAPP_DEFAULT_PHONE}
      />
    );
  }

  return (
    <div className="min-h-screen bg-admin-surface py-10">
      <div className="mx-auto max-w-[820px] px-4">
        <div className="mb-6 rounded-lg border border-black/10 bg-white p-5">
          <QuoteActions
            token={token}
            status={document.status}
            documentType={document.document_type}
            documentNumber={document.document_number}
            totalAed={document.total_aed}
            whatsappPhone={settings?.phone_number ?? WHATSAPP_DEFAULT_PHONE}
          />
        </div>
      </div>
      <DocumentView document={document} items={items} template={template} sourceDocumentNumber={sourceDocument?.document_number ?? null} />
      <div className="mx-auto mt-6 max-w-[820px] px-4 text-center text-xs text-masaar-black/40">
        <p>This is a secure link shared by Masaar Holidays. Your information is safe with us.</p>
      </div>
    </div>
  );
}
