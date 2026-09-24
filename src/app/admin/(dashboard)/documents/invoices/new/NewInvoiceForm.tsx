"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field, inputClass, PrimaryButton, SecondaryButton, Card } from "@/components/admin/ui";
import { createManualInvoice, type CreateManualInvoiceInput } from "../../actions";

export function NewInvoiceForm() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const clientName = String(formData.get("client_name") ?? "").trim();
    if (!clientName) {
      setError("Client name is required.");
      return;
    }

    const input: CreateManualInvoiceInput = {
      client_name: clientName,
      client_phone: String(formData.get("client_phone") ?? "").trim() || undefined,
      client_email: String(formData.get("client_email") ?? "").trim() || undefined,
      client_country: String(formData.get("client_country") ?? "").trim() || undefined,
      due_date: String(formData.get("due_date") ?? "").trim() || undefined,
    };

    setIsPending(true);
    try {
      const res = await createManualInvoice(input);
      if (!res.success) {
        setError(res.error || "Failed to create invoice.");
        setIsPending(false);
        return;
      }
      if (res.id) {
        router.push(`/admin/documents/invoices/${res.id}`);
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
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
