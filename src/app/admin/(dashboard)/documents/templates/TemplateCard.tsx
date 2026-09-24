"use client";

import { useState, useTransition } from "react";
import { Card, Field, inputClass, PrimaryButton } from "@/components/admin/ui";
import { updateDocumentTemplate } from "../actions";
import type { DocumentTemplateRow } from "@/lib/types/database";

export function TemplateCard({ template }: { template: DocumentTemplateRow }) {
  const [values, setValues] = useState({
    name: template.name,
    company_phone: template.company_phone ?? "",
    company_email: template.company_email ?? "",
    company_website: template.company_website ?? "",
    company_address: template.company_address ?? "",
    terms_text: template.terms_text ?? "",
    signature_text: template.signature_text ?? "",
  });
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSave() {
    startTransition(async () => {
      await updateDocumentTemplate(template.id, values);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  }

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <input
          className="w-2/3 border-b border-transparent bg-transparent font-semibold text-masaar-black focus:border-black/20 focus:outline-none"
          value={values.name}
          onChange={(e) => setValues({ ...values, name: e.target.value })}
        />
        <span className="text-xs capitalize text-masaar-black/50">{template.layout}</span>
      </div>
      <div className="space-y-3">
        <Field label="Company Phone">
          <input className={inputClass} value={values.company_phone} onChange={(e) => setValues({ ...values, company_phone: e.target.value })} />
        </Field>
        <Field label="Company Email">
          <input className={inputClass} value={values.company_email} onChange={(e) => setValues({ ...values, company_email: e.target.value })} />
        </Field>
        <Field label="Company Website">
          <input className={inputClass} value={values.company_website} onChange={(e) => setValues({ ...values, company_website: e.target.value })} />
        </Field>
        <Field label="Terms & Conditions">
          <textarea rows={3} className={inputClass} value={values.terms_text} onChange={(e) => setValues({ ...values, terms_text: e.target.value })} />
        </Field>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <PrimaryButton onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving…" : "Save"}
        </PrimaryButton>
        {saved && <span className="text-sm text-green-700">Saved.</span>}
      </div>
    </Card>
  );
}
