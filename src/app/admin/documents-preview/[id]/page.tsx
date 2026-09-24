import { notFound } from "next/navigation";
import { getDocument, getDocumentItems, getDocumentTemplates } from "@/lib/data/documents";
import { DocumentView } from "@/components/documents/DocumentView";

/**
 * Admin-only, chrome-free "Preview Full Screen" — deliberately outside the
 * (dashboard) route group (same pattern as /admin/blog-preview/[id]) so it
 * renders without the Sidebar/Topbar. Still under /admin, so middleware's
 * auth gate still applies — this is not the public/customer view.
 */
export default async function DocumentPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const document = await getDocument(id);
  if (!document) notFound();

  const [items, templates, sourceDocument] = await Promise.all([
    getDocumentItems(id),
    getDocumentTemplates(document.document_type),
    document.document_type === "receipt" && document.source_document_id ? getDocument(document.source_document_id) : Promise.resolve(null),
  ]);
  const template = templates.find((t) => t.id === document.template_id) ?? templates.find((t) => t.is_default) ?? templates[0] ?? null;

  return (
    <div className="min-h-screen bg-admin-surface py-10">
      <DocumentView document={document} items={items} template={template} sourceDocumentNumber={sourceDocument?.document_number ?? null} />
    </div>
  );
}
