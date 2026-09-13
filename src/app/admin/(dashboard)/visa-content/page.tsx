import Link from "next/link";
import type { Metadata } from "next";
import { Card, PageHeader, PrimaryButton, SecondaryButton, inputClass } from "@/components/admin/ui";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { VisaDocumentContextKey } from "@/lib/types/database";
import { addVisaDocument, deleteVisaDocument, saveCaveat } from "./actions";

export const metadata: Metadata = { title: "Visa Content | Masaar Admin", robots: { index: false } };

const CONTEXTS: { key: VisaDocumentContextKey; label: string }[] = [
  { key: "umrah_package", label: "Umrah Package" },
  { key: "standalone_umrah_visa", label: "Standalone Umrah Visa" },
  { key: "hotel", label: "Hotel Booking" },
  { key: "hajj", label: "Hajj Package" },
];

export default async function VisaContentPage({
  searchParams,
}: {
  searchParams: Promise<{ context?: string }>;
}) {
  const requested = (await searchParams).context as VisaDocumentContextKey | undefined;
  const activeKey = CONTEXTS.some((c) => c.key === requested) ? requested! : CONTEXTS[0].key;

  let context: { id: string; caveat_text: string | null } | null = null;
  let documents: { id: string; title: string; description: string | null }[] = [];

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data: contextRow } = await supabase
      .from("visa_document_contexts")
      .select("id, caveat_text")
      .eq("context_key", activeKey)
      .maybeSingle();
    context = contextRow;

    if (contextRow) {
      const { data } = await supabase
        .from("visa_documents")
        .select("id, title, description")
        .eq("context_id", contextRow.id)
        .order("display_order");
      documents = data ?? [];
    }
  }

  return (
    <div>
      <PageHeader
        title="Visa Content"
        description="Manage the visa document checklists shown on your website — kept separate per product (brief Part 2)."
        breadcrumb={[{ label: "Dashboard", href: "/admin" }, { label: "Visa Content" }]}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {CONTEXTS.map((c) => (
          <Link key={c.key} href={`/admin/visa-content?context=${c.key}`}>
            {c.key === activeKey ? <PrimaryButton>{c.label}</PrimaryButton> : <SecondaryButton>{c.label}</SecondaryButton>}
          </Link>
        ))}
      </div>

      {!context && !isSupabaseConfigured() ? (
        <Card>
          <p className="text-sm text-masaar-black/60">
            Connect Supabase (.env.local) to manage visa content — the 4 contexts are seeded by
            supabase/migrations/0002_seed_visa_contexts.sql.
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-masaar-black">1. Documents Required</h2>
            </div>
            <ul className="space-y-2">
              {documents.length === 0 && (
                <li className="text-sm text-masaar-black/50">No documents added yet.</li>
              )}
              {documents.map((doc, i) => (
                <li key={doc.id} className="flex items-start justify-between gap-3 rounded-md bg-admin-surface px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-masaar-black">
                      {String(i + 1).padStart(2, "0")}. {doc.title}
                    </p>
                    {doc.description && <p className="text-xs text-masaar-black/60">{doc.description}</p>}
                  </div>
                  <form action={deleteVisaDocument.bind(null, doc.id)}>
                    <button type="submit" className="text-xs text-red-600 underline">
                      Delete
                    </button>
                  </form>
                </li>
              ))}
            </ul>

            {context && (
              <form action={addVisaDocument.bind(null, context.id)} className="mt-4 space-y-2 border-t border-black/10 pt-4">
                <input name="title" placeholder="Document title (e.g. Valid Passport)" required className={inputClass} />
                <textarea name="description" placeholder="Description (optional)" rows={2} className={inputClass} />
                <PrimaryButton type="submit">+ Add Document</PrimaryButton>
              </form>
            )}
          </Card>

          <Card>
            <h2 className="mb-4 font-semibold text-masaar-black">2. Important Information / Caveat</h2>
            {context && (
              <form action={saveCaveat.bind(null, activeKey)} className="space-y-3">
                <textarea
                  name="caveat_text"
                  defaultValue={context.caveat_text ?? ""}
                  rows={8}
                  placeholder="Visa requirements, processing times, and conditions may vary…"
                  className={inputClass}
                />
                <PrimaryButton type="submit">Save Visa Content</PrimaryButton>
              </form>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
