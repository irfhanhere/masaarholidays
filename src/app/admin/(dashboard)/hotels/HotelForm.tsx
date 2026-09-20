"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Field, PrimaryButton, SecondaryButton, inputClass } from "@/components/admin/ui";
import type { HotelRow } from "@/lib/types/database";
import { saveHotel, type HotelFormState } from "./actions";

export function HotelForm({ hotelId, initial }: { hotelId?: string; initial?: HotelRow }) {
  const router = useRouter();
  const action = saveHotel.bind(null, hotelId ?? null);
  const [state, formAction, isPending] = useActionState<HotelFormState, FormData>(action, { status: "idle" });
  const [city, setCity] = useState(initial?.city ?? "Makkah");
  const isMadinah = city === "Madinah";

  return (
    <form action={formAction} className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
      <Card>
        <h2 className="mb-4 font-semibold text-masaar-black">1. Hotel Information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Hotel Name" required>
            <input name="name" defaultValue={initial?.name} required placeholder="e.g. Makkah Tower Hotel" className={inputClass} />
          </Field>
          <Field label="City" required>
            <select name="city" value={city} onChange={(e) => setCity(e.target.value)} className={inputClass}>
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
          {!isMadinah && (
            <>
              <Field label="Distance from Haram (meters)">
                <input
                  type="number"
                  name="distance_from_haram_meters"
                  defaultValue={initial?.distance_from_haram_meters ?? ""}
                  placeholder="e.g. 250"
                  className={inputClass}
                />
              </Field>
              <Field label="Walk Time (minutes)" hint="Lower bound if it's a range, e.g. 3 for &quot;3-4 min&quot;.">
                <input
                  type="number"
                  name="walk_time_minutes"
                  defaultValue={initial?.walk_time_minutes ?? ""}
                  placeholder="e.g. 3"
                  className={inputClass}
                />
              </Field>
              <Field label="Walk Time Max (minutes)" hint="Upper bound if it's a range — leave blank for a single value.">
                <input
                  type="number"
                  name="walk_time_minutes_max"
                  defaultValue={initial?.walk_time_minutes_max ?? ""}
                  placeholder="e.g. 4"
                  className={inputClass}
                />
              </Field>
            </>
          )}
          <Field label="Room Type">
            <input name="room_type" defaultValue={initial?.room_type ?? ""} placeholder="e.g. Twin / Triple / Quad" className={inputClass} />
          </Field>
          <Field label="Board Basis" hint="Filter dimension — leave blank until confirmed.">
            <input name="board_basis" defaultValue={initial?.board_basis ?? ""} placeholder="e.g. Room Only / Breakfast / Half Board" className={inputClass} />
          </Field>
          <Field label="Cancellation Policy" hint="Filter dimension — leave blank until confirmed.">
            <input
              name="cancellation_policy"
              defaultValue={initial?.cancellation_policy ?? ""}
              placeholder="e.g. Non-refundable / Part-refundable / Free cancellation"
              className={inputClass}
            />
          </Field>
          <Field label="View Type" hint="Leave blank unless confirmed — not every room has a view.">
            <input
              name="view_type"
              defaultValue={initial?.view_type ?? ""}
              placeholder="e.g. Kaaba View / Haram View"
              className={inputClass}
            />
          </Field>
          <Field label="Price From (AED)">
            <input type="number" name="price_from_aed" defaultValue={initial?.price_from_aed ?? ""} className={inputClass} />
          </Field>
        </div>
        <div className="mt-4 grid gap-4">
          <Field
            label="Path & Terrain"
            hint="Shown on hotel cards and the package 'Your Stay' card, just above Best For. E.g. &quot;Flat, open plaza facing King Fahd Gate&quot;. For a longer, multi-part description, put one point per line — each line renders as its own bullet."
          >
            <textarea name="terrain_note" defaultValue={initial?.terrain_note ?? ""} rows={3} className={inputClass} />
          </Field>
          <Field label="Short Description" hint="Keep it short and helpful — key facilities, location, what makes this hotel suitable.">
            <textarea name="description" defaultValue={initial?.description ?? ""} rows={3} maxLength={300} className={inputClass} />
          </Field>
        </div>
      </Card>

      {isMadinah && (
        <Card>
          <h2 className="mb-1 font-semibold text-masaar-black">2. Madinah Gate Distances</h2>
          <p className="mb-4 text-sm text-masaar-black/60">
            Madinah has two Haram entrances that can differ by several minutes — shown as separate lines
            instead of one combined distance.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Men's Gate — Walk Time Min (minutes)">
              <input type="number" name="mens_gate_walk_minutes_min" defaultValue={initial?.mens_gate_walk_minutes_min ?? ""} className={inputClass} />
            </Field>
            <Field label="Men's Gate — Walk Time Max (minutes)">
              <input type="number" name="mens_gate_walk_minutes_max" defaultValue={initial?.mens_gate_walk_minutes_max ?? ""} className={inputClass} />
            </Field>
            <Field label="Nearest Men's Gate" hint='e.g. "King Fahd Gate (23)"'>
              <input name="nearest_mens_gate" defaultValue={initial?.nearest_mens_gate ?? ""} className={inputClass} />
            </Field>
            <Field label="Ladies' Gate — Walk Time Min (minutes)">
              <input type="number" name="ladies_gate_walk_minutes_min" defaultValue={initial?.ladies_gate_walk_minutes_min ?? ""} className={inputClass} />
            </Field>
            <Field label="Ladies' Gate — Walk Time Max (minutes)">
              <input type="number" name="ladies_gate_walk_minutes_max" defaultValue={initial?.ladies_gate_walk_minutes_max ?? ""} className={inputClass} />
            </Field>
            <Field label="Nearest Ladies' Gate" hint='e.g. "Gate 25"'>
              <input name="nearest_ladies_gate" defaultValue={initial?.nearest_ladies_gate ?? ""} className={inputClass} />
            </Field>
            <Field label="Primary Gate" hint="Which figure shows on the hotel card's single walk-time badge.">
              <select name="primary_gate" defaultValue={initial?.primary_gate ?? ""} className={inputClass}>
                <option value="">—</option>
                <option value="mens">Men&apos;s</option>
                <option value="ladies">Ladies&apos;</option>
              </select>
            </Field>
            <Field label="Zone" hint='e.g. "Zone 1: Bab As-Salam / Gate 25"'>
              <input name="zone" defaultValue={initial?.zone ?? ""} className={inputClass} />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="In-Plaza Walk Note" hint="Optional — extra distance inside the courtyard to Rawdah, where known.">
              <textarea name="in_haram_plaza_walk_note" defaultValue={initial?.in_haram_plaza_walk_note ?? ""} rows={2} className={inputClass} />
            </Field>
          </div>
        </Card>
      )}

      <Card>
        <h2 className="mb-1 font-semibold text-masaar-black">{isMadinah ? "3." : "2."} Proximity &amp; Accessibility</h2>
        <p className="mb-4 text-sm text-masaar-black/60">Applies to both cities.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Route Type" hint='e.g. "flat", "plaza-crossing", "road-crossing"'>
            <input name="route_type" defaultValue={initial?.route_type ?? ""} className={inputClass} />
          </Field>
          <Field label="Google Maps URL">
            <input name="google_maps_url" defaultValue={initial?.google_maps_url ?? ""} className={inputClass} />
          </Field>
        </div>
        <div className="mt-4 grid gap-4">
          <Field label="Elderly &amp; Family Suitability Note">
            <textarea name="elderly_family_suitability_note" defaultValue={initial?.elderly_family_suitability_note ?? ""} rows={2} className={inputClass} />
          </Field>
          <Field label="Accessibility Note" hint="Lifts, step-free access, etc.">
            <textarea name="accessibility_note" defaultValue={initial?.accessibility_note ?? ""} rows={2} className={inputClass} />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="shuttle_available" defaultChecked={initial?.shuttle_available ?? false} />
            Shuttle available
          </label>
          <Field label="Shuttle Note">
            <textarea name="shuttle_note" defaultValue={initial?.shuttle_note ?? ""} rows={2} className={inputClass} />
          </Field>
          <Field label="Gallery Image URLs" hint="One URL per line — shown on the detail page's Hotel Gallery grid.">
            <textarea name="gallery_image_urls" defaultValue={(initial?.gallery_image_urls ?? []).join("\n")} rows={3} className={inputClass} />
          </Field>
        </div>
      </Card>

      <Card>
        <h2 className="mb-1 font-semibold text-masaar-black">Page SEO</h2>
        <p className="mb-3 text-sm text-masaar-black/60">
          Falls back to a generated title/description from this hotel&apos;s name and description when left blank.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Meta Title">
            <input name="meta_title" defaultValue={initial?.meta_title ?? ""} className={inputClass} />
          </Field>
          <Field label="Meta Description">
            <input name="meta_description" defaultValue={initial?.meta_description ?? ""} className={inputClass} />
          </Field>
        </div>
      </Card>

      <Card className="border-amber-300 bg-amber-50/40">
        <h2 className="mb-1 font-semibold text-masaar-black">Admin Only — Never Shown Publicly</h2>
        <p className="mb-4 text-sm text-masaar-black/60">
          Internal notes to flag listings that need a follow-up before being relied on — never selected or
          rendered by the public site.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Data Confidence">
            <select name="data_confidence" defaultValue={initial?.data_confidence ?? ""} className={inputClass}>
              <option value="">—</option>
              <option value="verified">Verified</option>
              <option value="estimated">Estimated</option>
              <option value="needs_verification">Needs Verification</option>
            </select>
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Admin Caution Note" hint='e.g. "Reviews flag room-condition issues, confirm before featuring."'>
            <textarea name="admin_caution_note" defaultValue={initial?.admin_caution_note ?? ""} rows={2} className={inputClass} />
          </Field>
        </div>
      </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <h2 className="mb-4 font-semibold text-masaar-black">Hotel Image</h2>
          <Field label="Image URL" hint="Supabase Storage upload UI is a follow-up — paste a URL for now.">
            <input name="image_url" defaultValue={initial?.image_url ?? ""} className={inputClass} />
          </Field>
        </Card>
        <Card>
          <h2 className="mb-4 font-semibold text-masaar-black">Visibility</h2>
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
