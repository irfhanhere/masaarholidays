"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Card, Field, PrimaryButton, SecondaryButton, inputClass } from "@/components/admin/ui";
import type { VisaLandingContentRow } from "@/lib/types/database";
import { saveVisaLandingContent, type VisaLandingContentFormState } from "../actions";

export function VisaLandingContentForm({ initial }: { initial?: VisaLandingContentRow }) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<VisaLandingContentFormState, FormData>(
    saveVisaLandingContent,
    { status: "idle" }
  );

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <h2 className="mb-1 font-semibold text-masaar-black">Important Information</h2>
        <p className="mb-3 text-sm text-masaar-black/60">
          General disclaimer shown below the visa type cards. One paragraph per line. Falls back to
          a generic disclaimer if left blank.
        </p>
        <textarea
          name="important_info_text"
          rows={4}
          defaultValue={initial?.important_info_text ?? ""}
          className={inputClass}
        />
      </Card>

      <Card>
        <h2 className="mb-1 font-semibold text-masaar-black">Bottom CTA</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Heading" hint='Falls back to "Start Your Visa Application" if left blank.'>
            <input name="cta_heading" defaultValue={initial?.cta_heading ?? ""} className={inputClass} />
          </Field>
          <Field label="Note" hint='Small line under the buttons, e.g. "Our team is available to assist you during working hours."'>
            <input name="cta_note" defaultValue={initial?.cta_note ?? ""} className={inputClass} />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Line" hint="Short line under the heading.">
            <textarea name="cta_line" rows={2} defaultValue={initial?.cta_line ?? ""} className={inputClass} />
          </Field>
        </div>
      </Card>

      {state.status === "error" && <p className="text-sm text-red-600">{state.message}</p>}

      <div className="flex justify-end gap-2">
        <SecondaryButton type="button" onClick={() => router.push("/admin/visa-types")}>
          Cancel
        </SecondaryButton>
        <PrimaryButton type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save"}
        </PrimaryButton>
      </div>
    </form>
  );
}
