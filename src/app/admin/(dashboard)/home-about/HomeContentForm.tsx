"use client";

import { useActionState } from "react";
import { Card, Field, PrimaryButton, inputClass } from "@/components/admin/ui";
import type { HomeContentRow } from "@/lib/types/database";
import { saveHomeContent, type HomeContentFormState } from "./actions";

export function HomeContentForm({ initial }: { initial?: HomeContentRow }) {
  const [state, formAction, isPending] = useActionState<HomeContentFormState, FormData>(saveHomeContent, {
    status: "idle",
  });

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <h2 className="mb-1 font-semibold text-masaar-black">Bottom CTA Quote</h2>
        <p className="mb-3 text-sm text-masaar-black/60">
          Shown beside &quot;Speak to a Masaar Advisor&quot; at the bottom of the Home page.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Quote Text">
            <textarea name="cta_quote_text" rows={2} defaultValue={initial?.cta_quote_text ?? ""} className={inputClass} />
          </Field>
          <Field label="Reference" hint='e.g. "Qur’an 2:197"'>
            <input name="cta_quote_reference" defaultValue={initial?.cta_quote_reference ?? ""} className={inputClass} />
          </Field>
        </div>
      </Card>

      {state.status === "error" && <p className="text-sm text-red-600">{state.message}</p>}

      <div className="flex justify-end">
        <PrimaryButton type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save"}
        </PrimaryButton>
      </div>
    </form>
  );
}
