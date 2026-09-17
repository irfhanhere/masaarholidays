"use client";

import { useActionState } from "react";
import { Field, PrimaryButton, inputClass } from "@/components/admin/ui";
import type { PageSeoRow } from "@/lib/types/database";
import { savePageSeoRow, type PageSeoFormState } from "./actions";

const PAGE_LABELS: Record<string, string> = {
  "/": "Home",
  "/umrah": "Umrah Packages",
  "/hajj": "Hajj Packages",
  "/hotels": "Hotels",
  "/transfers": "Transfers",
  "/visa": "Visa",
  "/about": "About",
  "/contact": "Contact",
};

export function PageSeoRowForm({ row }: { row: PageSeoRow }) {
  const action = savePageSeoRow.bind(null, row.path);
  const [state, formAction, isPending] = useActionState<PageSeoFormState, FormData>(action, { status: "idle" });

  return (
    <div className="rounded-lg border border-black/10 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-masaar-black">
          {PAGE_LABELS[row.path] ?? row.path}
          <span className="ml-2 font-mono text-xs font-normal text-masaar-black/40">{row.path}</span>
        </h3>
        {state.status === "success" && <span className="text-xs text-green-700">Saved</span>}
        {state.status === "error" && <span className="text-xs text-red-600">{state.message}</span>}
      </div>
      <form action={formAction} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Meta Title" required>
            <input name="meta_title" defaultValue={row.meta_title} required className={inputClass} />
          </Field>
          <Field label="OG Image URL">
            <input name="og_image_url" defaultValue={row.og_image_url ?? ""} className={inputClass} />
          </Field>
        </div>
        <Field label="Meta Description">
          <textarea name="meta_description" rows={2} defaultValue={row.meta_description ?? ""} className={inputClass} />
        </Field>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="noindex" defaultChecked={row.noindex} />
            Noindex (hide from search engines and the sitemap)
          </label>
          <PrimaryButton type="submit" disabled={isPending}>
            {isPending ? "Saving…" : "Save"}
          </PrimaryButton>
        </div>
      </form>
    </div>
  );
}
