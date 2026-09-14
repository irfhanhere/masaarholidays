"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, Field, PrimaryButton, SecondaryButton, inputClass } from "@/components/admin/ui";
import type { TransferRow } from "@/lib/types/database";
import { saveTransfer, type TransferFormState } from "./actions";

export function TransferForm({ transferId, initial }: { transferId?: string; initial?: TransferRow }) {
  const router = useRouter();
  const action = saveTransfer.bind(null, transferId ?? null);
  const [state, formAction, isPending] = useActionState<TransferFormState, FormData>(action, { status: "idle" });

  return (
    <form action={formAction} className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <h2 className="mb-4 font-semibold text-masaar-black">1. Transfer Information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Route Name" required hint="e.g. Jeddah Airport → Makkah">
            <input name="route_name" defaultValue={initial?.route_name} required className={inputClass} />
          </Field>
          <Field label="Transfer Type">
            <select name="transfer_type" defaultValue={initial?.transfer_type ?? "airport"} className={inputClass}>
              <option value="airport">Airport</option>
              <option value="train">Haramain Train</option>
              <option value="intercity">Intercity</option>
              <option value="ziyarat">Ziyarat</option>
              <option value="day-trip">Day Trip</option>
              <option value="other">Other</option>
            </select>
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Short Description">
            <textarea name="description" defaultValue={initial?.description ?? ""} rows={3} maxLength={300} className={inputClass} />
          </Field>
        </div>
        <p className="mt-4 text-xs text-masaar-black/50">
          Per-vehicle pricing (Camry, Staria, GMC XL Yukon, Hiace Grand Cabin, Coaster) is set in
          the <Link href="/admin/transfers/rate-card" className="text-admin-primary underline">Rate Card</Link>,
          not here &mdash; that&apos;s the admin-only reference the public page never shows.
        </p>
      </Card>

      <div className="space-y-6">
        <Card>
          <h2 className="mb-4 font-semibold text-masaar-black">2. Vehicle Image</h2>
          <Field label="Image URL" hint="Supabase Storage upload UI is a follow-up.">
            <input name="image_url" defaultValue={initial?.image_url ?? ""} className={inputClass} />
          </Field>
        </Card>
        <Card>
          <h2 className="mb-4 font-semibold text-masaar-black">3. Status</h2>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="is_active" defaultChecked={initial?.is_active ?? true} />
            Active (visible on website)
          </label>
        </Card>

        {state.status === "error" && <p className="text-sm text-red-600">{state.message}</p>}

        <div className="flex justify-end gap-2">
          <SecondaryButton type="button" onClick={() => router.push("/admin/transfers")}>
            Cancel
          </SecondaryButton>
          <PrimaryButton type="submit" disabled={isPending}>
            {isPending ? "Saving…" : "Save Transfer"}
          </PrimaryButton>
        </div>
      </div>
    </form>
  );
}
