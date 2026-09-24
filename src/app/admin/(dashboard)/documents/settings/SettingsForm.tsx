"use client";

import { useState, useTransition } from "react";
import { Card, Field, inputClass, PrimaryButton } from "@/components/admin/ui";
import { updateDocumentSettings } from "../actions";
import type { DocumentSettingsRow } from "@/lib/types/database";

export function SettingsForm({ settings }: { settings: DocumentSettingsRow }) {
  const [values, setValues] = useState({
    quotation_prefix: settings.quotation_prefix,
    invoice_prefix: settings.invoice_prefix,
    receipt_prefix: settings.receipt_prefix,
    booking_voucher_prefix: settings.booking_voucher_prefix,
  });
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSave() {
    startTransition(async () => {
      await updateDocumentSettings(values);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  }

  return (
    <Card className="max-w-xl">
      <h2 className="mb-4 font-semibold text-masaar-black">Document Numbering</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Quotation Prefix" hint='e.g. "Q-" → Q-2026-0042'>
          <input className={inputClass} value={values.quotation_prefix} onChange={(e) => setValues({ ...values, quotation_prefix: e.target.value })} />
        </Field>
        <Field label="Invoice Prefix" hint='e.g. "INV-" → INV-2026-0018'>
          <input className={inputClass} value={values.invoice_prefix} onChange={(e) => setValues({ ...values, invoice_prefix: e.target.value })} />
        </Field>
        <Field label="Receipt Prefix" hint='e.g. "REC-" → REC-2026-0012'>
          <input className={inputClass} value={values.receipt_prefix} onChange={(e) => setValues({ ...values, receipt_prefix: e.target.value })} />
        </Field>
        <Field label="Booking Voucher Prefix" hint='e.g. "BV-" → BV-2026-0007'>
          <input className={inputClass} value={values.booking_voucher_prefix} onChange={(e) => setValues({ ...values, booking_voucher_prefix: e.target.value })} />
        </Field>
      </div>
      <p className="mt-3 text-xs text-masaar-black/50">
        Format is always {"<prefix><year>-<sequence>"}, e.g. Q-2026-0042. Changing a prefix only affects documents created after the change.
      </p>
      <div className="mt-4 flex items-center gap-3">
        <PrimaryButton onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving…" : "Save Settings"}
        </PrimaryButton>
        {saved && <span className="text-sm text-green-700">Saved.</span>}
      </div>
    </Card>
  );
}
