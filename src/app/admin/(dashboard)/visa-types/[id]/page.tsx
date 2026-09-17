import { notFound } from "next/navigation";
import { Card, PageHeader, PrimaryButton, inputClass } from "@/components/admin/ui";
import { createClient } from "@/lib/supabase/server";
import { VisaTypeForm } from "../VisaTypeForm";
import { addVisaTypeDocument, deleteVisaTypeDocument } from "../actions";

export const metadata = { title: "Edit Visa Type | Masaar Admin", robots: { index: false } };

const ICON_OPTIONS = ["passport", "photo", "document", "flight", "hotel", "shield", "payment", "group"];

export default async function EditVisaTypePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: visaType } = await supabase.from("visa_types").select("*").eq("id", id).maybeSingle();
  if (!visaType) notFound();

  const { data: documents } = await supabase
    .from("visa_documents")
    .select("*")
    .eq("visa_type_id", id)
    .order("display_order", { ascending: true });

  return (
    <div>
      <PageHeader
        title={`Edit ${visaType.name}`}
        breadcrumb={[
          { label: "Dashboard", href: "/admin" },
          { label: "Visa Types", href: "/admin/visa-types" },
          { label: "Edit" },
        ]}
      />
      <VisaTypeForm visaTypeId={visaType.id} initial={visaType} />

      <div className="mt-6">
        <Card>
          <h2 className="mb-4 font-semibold text-masaar-black">Documents Required — Cards</h2>
          <p className="mb-4 text-sm text-masaar-black/60">
            The document cards shown in the &quot;Documents Required&quot; grid on this type&apos;s detail page.
          </p>
          <ul className="space-y-2">
            {(documents ?? []).length === 0 && (
              <li className="text-sm text-masaar-black/50">No documents added yet.</li>
            )}
            {(documents ?? []).map((doc, i) => (
              <li key={doc.id} className="flex items-start justify-between gap-3 rounded-md bg-admin-surface px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-masaar-black">
                    {String(i + 1).padStart(2, "0")}. {doc.title}{" "}
                    <span className="font-normal text-masaar-black/40">({doc.icon_key})</span>
                  </p>
                  {doc.description && <p className="text-xs text-masaar-black/60">{doc.description}</p>}
                </div>
                <form action={deleteVisaTypeDocument.bind(null, visaType.id, doc.id)}>
                  <button type="submit" className="text-xs text-red-600 underline">
                    Delete
                  </button>
                </form>
              </li>
            ))}
          </ul>

          <form
            action={addVisaTypeDocument.bind(null, visaType.id)}
            className="mt-4 space-y-2 border-t border-black/10 pt-4"
          >
            <div className="flex gap-2">
              <select name="icon_key" defaultValue="document" className={`w-40 shrink-0 ${inputClass}`}>
                {ICON_OPTIONS.map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </select>
              <input name="title" placeholder="Document title (e.g. Valid Passport)" required className={inputClass} />
            </div>
            <textarea name="description" placeholder="Description (optional)" rows={2} className={inputClass} />
            <PrimaryButton type="submit">+ Add Document</PrimaryButton>
          </form>
        </Card>
      </div>
    </div>
  );
}
