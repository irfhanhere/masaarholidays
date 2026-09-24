"use client";

import { useState, useTransition } from "react";
import { Field, inputClass, PrimaryButton, SecondaryButton, Card } from "@/components/admin/ui";
import { createManualInvoice, type CreateManualInvoiceInput } from "../../actions";

export function NewInvoiceForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    const input: CreateManualInvoiceInput = {
      client_name: String(formData.get("client_name") ?? ""),
      client_phone: String(formData.get("client_phone") ?? "") || undefined,
      client_email: String(formData.get("client_email") ?? "") || undefined,
      client_country: String(formData.get("client_country") ?? "") || undefined,
      due_date: String(formData.get("due_date") ?? "") || undefined,
    };

    startTransition(async () => {
      try {
        await createManualInvoice(input);
      } catch (e) {
        if (e && typeof e === "object" && "digest" in e && typeof e.digest === "string" && e.digest.startsWith("NEXT_REDIRECT")) {
          throw e;
        }
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  }

  return (
    <form action={handleSubmit}>
      <Card>
        <h2 className="mb-4 font-semibold text-masaar-black">Client Details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Client Name" required>
            <input name="client_name" required className={inputClass} placeholder="e.g. Ahmed Khan" />
          </Field>
          <Field label="Client Phone">
            <input name="client_phone" className={inputClass} placeholder="+971 50 123 4567" />
          </Field>
          <Field label="Client Email">
            <input name="client_email" type="email" className={inputClass} placeholder="client@email.com" />
          </Field>
          <Field label="Country">
            <input name="client_country" className={inputClass} placeholder="Dubai, UAE" />
          </Field>
          <Field label="Due Date">
            <input name="due_date" type="date" className={inputClass} />
          </Field>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-4 flex justify-end gap-3">
          <SecondaryButton type="button" onClick={() => window.history.back()}>
            Cancel
          </SecondaryButton>
          <PrimaryButton type="submit" disabled={isPending}>
            {isPending ? "Creating…" : "Create Invoice →"}
          </PrimaryButton>
        </div>
      </Card>
    </form>
  );
}
