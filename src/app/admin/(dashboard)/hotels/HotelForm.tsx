"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Card, Field, PrimaryButton, SecondaryButton, inputClass } from "@/components/admin/ui";
import type { HotelRow } from "@/lib/types/database";
import { saveHotel, type HotelFormState } from "./actions";

export function HotelForm({ hotelId, initial }: { hotelId?: string; initial?: HotelRow }) {
  const router = useRouter();
  const action = saveHotel.bind(null, hotelId ?? null);
  const [state, formAction, isPending] = useActionState<HotelFormState, FormData>(action, { status: "idle" });

  return (
    <form action={formAction} className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <h2 className="mb-4 font-semibold text-masaar-black">1. Hotel Information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Hotel Name" required>
            <input name="name" defaultValue={initial?.name} required placeholder="e.g. Makkah Tower Hotel" className={inputClass} />
          </Field>
          <Field label="City" required>
            <select name="city" defaultValue={initial?.city ?? "Makkah"} className={inputClass}>
              <option value="Makkah">Makkah</option>
              <option value="Madinah">Madinah</option>
            </select>
          </Field>
          <Field label="Category">
            <input
              name="category"
              defaultValue={initial?.category ?? ""}
              placeholder="e.g. Near-Haram Premium"
              className={inputClass}
            />
          </Field>
          <Field label="Star Rating">
            <select name="star_rating" defaultValue={initial?.star_rating ?? ""} className={inputClass}>
              <option value="">—</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} Star
                </option>
              ))}
            </select>
          </Field>
          <Field label="Distance from Haram (meters)">
            <input
              type="number"
              name="distance_from_haram_meters"
              defaultValue={initial?.distance_from_haram_meters ?? ""}
              placeholder="e.g. 250"
              className={inputClass}
            />
          </Field>
          <Field label="Walk Time (minutes)">
            <input
              type="number"
              name="walk_time_minutes"
              defaultValue={initial?.walk_time_minutes ?? ""}
              placeholder="e.g. 3"
              className={inputClass}
            />
          </Field>
          <Field label="Room Type">
            <input name="room_type" defaultValue={initial?.room_type ?? ""} placeholder="e.g. Twin / Triple / Quad" className={inputClass} />
          </Field>
          <Field label="Board Basis">
            <input name="board_basis" defaultValue={initial?.board_basis ?? ""} placeholder="e.g. Room Only / B&B" className={inputClass} />
          </Field>
          <Field label="Price From (AED)">
            <input type="number" name="price_from_aed" defaultValue={initial?.price_from_aed ?? ""} className={inputClass} />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Short Description" hint="Keep it short and helpful — key facilities, location, what makes this hotel suitable.">
            <textarea name="description" defaultValue={initial?.description ?? ""} rows={3} maxLength={300} className={inputClass} />
          </Field>
        </div>
      </Card>

      <div className="space-y-6">
        <Card>
          <h2 className="mb-4 font-semibold text-masaar-black">2. Hotel Image</h2>
          <Field label="Image URL" hint="Supabase Storage upload UI is a follow-up — paste a URL for now.">
            <input name="image_url" defaultValue={initial?.image_url ?? ""} className={inputClass} />
          </Field>
        </Card>
        <Card>
          <h2 className="mb-4 font-semibold text-masaar-black">3. Visibility</h2>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="is_active" defaultChecked={initial?.is_active ?? true} />
            Active (visible on website)
          </label>
        </Card>

        {state.status === "error" && <p className="text-sm text-red-600">{state.message}</p>}

        <div className="flex justify-end gap-2">
          <SecondaryButton type="button" onClick={() => router.push("/admin/hotels")}>
            Cancel
          </SecondaryButton>
          <PrimaryButton type="submit" disabled={isPending}>
            {isPending ? "Saving…" : "Save Hotel"}
          </PrimaryButton>
        </div>
      </div>
    </form>
  );
}
