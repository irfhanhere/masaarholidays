import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDocument, ensureDocumentShare } from "@/lib/data/documents";
import { createAdminClient } from "@/lib/supabase/admin";
import { SendQuotationPanel } from "./SendQuotationPanel";

export const metadata: Metadata = {
  title: "Send Quotation | Masaar Admin",
  robots: { index: false },
};

export default async function SendQuotationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const document = await getDocument(id);
  if (!document || document.document_type !== "quotation") notFound();

  const share = await ensureDocumentShare(id);

  const supabase = createAdminClient();
  const { data: ws } = await supabase
    .from("whatsapp_settings")
    .select("phone_number")
    .eq("id", 1)
    .maybeSingle();

  return (
    <SendQuotationPanel
      document={document}
      shareToken={share.share_token}
      whatsappPhone={ws?.phone_number ?? "971552276299"}
    />
  );
}
