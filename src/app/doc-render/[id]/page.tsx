import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyDocumentRenderToken } from "@/lib/documents/render-token";
import { DocumentView } from "@/components/documents/DocumentView";
import { DocRenderClient } from "./DocRenderClient";
import type { DocumentItemRow, DocumentRow, DocumentTemplateRow } from "@/lib/types/database";

export const dynamic = "force-dynamic";

export default async function DocumentRenderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ key?: string; print?: string; download?: string }>;
}) {
  const { id } = await params;
  const { key, print, download } = await searchParams;

  if (!key || !verifyDocumentRenderToken(id, key)) notFound();

  const supabase = createAdminClient();
  const { data: document } = await supabase.from("documents").select("*").eq("id", id).maybeSingle();
  if (!document) notFound();

  const [{ data: items }, { data: template }, { data: sourceDocument }] = await Promise.all([
    supabase.from("document_items").select("*").eq("document_id", id).order("display_order", { ascending: true }),
    document.template_id
      ? supabase.from("document_templates").select("*").eq("id", document.template_id).maybeSingle()
      : Promise.resolve({ data: null }),
    document.document_type === "receipt" && document.source_document_id
      ? supabase.from("documents").select("document_number").eq("id", document.source_document_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return (
    <DocRenderClient
      documentNumber={document.document_number}
      autoPrint={print === "true"}
      autoDownload={download === "true"}
    >
      <DocumentView
        document={document as DocumentRow}
        items={(items ?? []) as DocumentItemRow[]}
        template={(template as DocumentTemplateRow | null) ?? null}
        sourceDocumentNumber={sourceDocument?.document_number ?? null}
      />
    </DocRenderClient>
  );
}
