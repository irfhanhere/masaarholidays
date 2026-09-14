"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Field, PrimaryButton, SecondaryButton, inputClass } from "@/components/admin/ui";
import type {
  PackageItineraryDay,
  PackageRow,
  PackageType,
  TransferRow,
  TransferVehicleRow,
} from "@/lib/types/database";
import { savePackage, type PackageFormState } from "./actions";

type RoomPrice = { room_type: string; price_aed: string };
type TransferAddon = { transfer_id: string; vehicle_id: string };

export function PackageForm({
  packageId,
  initial,
  initialRoomPrices,
  initialUpgrade,
  initialUpgradeRoomPrices,
  initialTransferAddons,
  transferOptions,
  vehicleOptions,
  defaultType,
}: {
  packageId?: string;
  initial?: PackageRow;
  initialRoomPrices?: { room_type: string; price_aed: number }[];
  initialUpgrade?: { label: string } | null;
  initialUpgradeRoomPrices?: { room_type: string; price_aed: number }[];
  initialTransferAddons?: { transfer_id: string; vehicle_id: string | null }[];
  transferOptions?: TransferRow[];
  vehicleOptions?: TransferVehicleRow[];
  defaultType?: PackageType;
}) {
  const router = useRouter();
  const action = savePackage.bind(null, packageId ?? null);
  const [state, formAction, isPending] = useActionState<PackageFormState, FormData>(action, {
    status: "idle",
  });

  const [roomPrices, setRoomPrices] = useState<RoomPrice[]>(
    initialRoomPrices?.length
      ? initialRoomPrices.map((r) => ({ room_type: r.room_type, price_aed: String(r.price_aed) }))
      : [{ room_type: "Quad", price_aed: "" }]
  );
  const [hasUpgrade, setHasUpgrade] = useState(Boolean(initialUpgrade));
  const [upgradeRoomPrices, setUpgradeRoomPrices] = useState<RoomPrice[]>(
    initialUpgradeRoomPrices?.length
      ? initialUpgradeRoomPrices.map((r) => ({ room_type: r.room_type, price_aed: String(r.price_aed) }))
      : [{ room_type: "Quad", price_aed: "" }]
  );

  const [transferAddons, setTransferAddons] = useState<TransferAddon[]>(
    initialTransferAddons?.length
      ? initialTransferAddons.map((a) => ({ transfer_id: a.transfer_id, vehicle_id: a.vehicle_id ?? "" }))
      : []
  );

  const itineraryText = (initial?.itinerary as PackageItineraryDay[] | undefined)
    ?.map((d) => d.items.join("; "))
    .join("\n");

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <h2 className="mb-4 font-semibold text-masaar-black">1. Basic Information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Package Type" required>
            <div className="flex gap-4 pt-2">
              {(["umrah", "hajj"] as PackageType[]).map((t) => (
                <label key={t} className="flex items-center gap-2 text-sm capitalize">
                  <input type="radio" name="type" value={t} defaultChecked={(initial?.type ?? defaultType ?? "umrah") === t} required />
                  {t}
                </label>
              ))}
            </div>
          </Field>
          <Field label="Tier" required>
            <select name="tier" defaultValue={initial?.tier ?? "essential"} className={inputClass}>
              <option value="essential">Essential</option>
              <option value="signature">Signature</option>
              <option value="prive">Privé</option>
            </select>
          </Field>
          <Field label="Package Title" required>
            <input name="title" defaultValue={initial?.title} required placeholder="e.g. Spiritual Journey" className={inputClass} />
          </Field>
          <Field label="City / Destination">
            <input
              name="city_destination"
              defaultValue={initial?.city_destination ?? ""}
              placeholder="e.g. Makkah / Madinah"
              className={inputClass}
            />
          </Field>
          <Field label="Duration (Days)" required>
            <input
              type="number"
              min={1}
              name="duration_days"
              defaultValue={initial?.duration_days}
              required
              className={inputClass}
            />
          </Field>
          <Field label="Duration Label" hint='Display string, e.g. "6 Nights / 7 Days".'>
            <input name="duration_label" defaultValue={initial?.duration_label ?? ""} placeholder="e.g. 6 Nights / 7 Days" className={inputClass} />
          </Field>
          <Field label="Hero Image URL" hint="Supabase Storage upload UI is a follow-up — paste a URL for now.">
            <input name="hero_image_url" defaultValue={initial?.hero_image_url ?? ""} className={inputClass} />
          </Field>
        </div>
        <div className="mt-4 flex gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="is_active" defaultChecked={initial?.is_active ?? true} />
            Active (visible on website)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="is_featured" defaultChecked={initial?.is_featured ?? false} />
            Featured (&ldquo;Most Chosen&rdquo; — Signature emphasis)
          </label>
        </div>
      </Card>

      <Card>
        <h2 className="mb-1 font-semibold text-masaar-black">2. Package Details</h2>
        <p className="mb-3 text-sm text-masaar-black/60">
          Shown on the public package detail page alongside the room pricing table.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Validity" hint='Display string, e.g. a date range once real dates are confirmed.'>
            <input
              name="validity_label"
              defaultValue={initial?.validity_label ?? ""}
              placeholder="e.g. Travel dates arranged directly with your advisor"
              className={inputClass}
            />
          </Field>
          <Field label="Advance Booking Note">
            <input
              name="advance_booking_note"
              defaultValue={initial?.advance_booking_note ?? ""}
              placeholder="e.g. Recommended to book 3-4 weeks in advance."
              className={inputClass}
            />
          </Field>
          <Field label="Flight Note">
            <input
              name="flight_note"
              defaultValue={initial?.flight_note ?? ""}
              placeholder="e.g. International flights not included."
              className={inputClass}
            />
          </Field>
          <Field label="Rate Disclaimer">
            <input
              name="rate_disclaimer"
              defaultValue={initial?.rate_disclaimer ?? ""}
              placeholder="e.g. Prices are per person and subject to availability."
              className={inputClass}
            />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Inclusions" hint="One line per inclusion.">
            <textarea
              name="inclusions_text"
              rows={4}
              defaultValue={initial?.inclusions_text ?? ""}
              placeholder={"Comfortable hotel stay\nShared shuttle transport\nVisa processing\nAirport transfers"}
              className={inputClass}
            />
          </Field>
        </div>
      </Card>

      <Card>
        <h2 className="mb-1 font-semibold text-masaar-black">3. Itinerary</h2>
        <p className="mb-3 text-sm text-masaar-black/60">One line per day.</p>
        <textarea
          name="itinerary_text"
          rows={5}
          defaultValue={itineraryText}
          placeholder={"Arrival in Jeddah / Transfer to Makkah\nHotel check-in; Umrah guidance"}
          className={inputClass}
        />
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-masaar-black">4. Room Pricing (AED)</h2>
          <SecondaryButton type="button" onClick={() => setRoomPrices((rp) => [...rp, { room_type: "", price_aed: "" }])}>
            + Add Room Type
          </SecondaryButton>
        </div>
        <div className="space-y-2">
          {roomPrices.map((rp, i) => (
            <div key={i} className="flex gap-2">
              <input
                name="room_type"
                defaultValue={rp.room_type}
                placeholder="Room Type (e.g. Quad)"
                className={inputClass}
              />
              <input
                name="room_price"
                type="number"
                defaultValue={rp.price_aed}
                placeholder="Price (AED)"
                className={inputClass}
              />
              <SecondaryButton type="button" onClick={() => setRoomPrices((prev) => prev.filter((_, idx) => idx !== i))}>
                Remove
              </SecondaryButton>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-masaar-black/50">
          AED is the base currency. Website prices in INR, USD, EUR, GBP and SAR are calculated using
          the current currency settings.
        </p>
      </Card>

      <Card>
        <label className="flex items-center gap-2 text-sm font-semibold text-masaar-black">
          <input
            type="checkbox"
            name="has_upgrade"
            checked={hasUpgrade}
            onChange={(e) => setHasUpgrade(e.target.checked)}
          />
          This package has a &quot;Plus&quot; upgrade
        </label>
        <p className="mt-1 text-xs text-masaar-black/50">
          Essential Plus / Signature Plus — an add-on attached to this package, not a separate
          package type (brief Part 1).
        </p>

        {hasUpgrade && (
          <div className="mt-4 space-y-4 border-t border-black/10 pt-4">
            <Field label="Upgrade Label">
              <input
                name="upgrade_label"
                defaultValue={initialUpgrade?.label ?? ""}
                placeholder="e.g. Essential Plus"
                className={inputClass}
              />
            </Field>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium text-masaar-black">Upgrade Room Pricing (AED)</p>
                <SecondaryButton
                  type="button"
                  onClick={() => setUpgradeRoomPrices((rp) => [...rp, { room_type: "", price_aed: "" }])}
                >
                  + Add Room Type
                </SecondaryButton>
              </div>
              <div className="space-y-2">
                {upgradeRoomPrices.map((rp, i) => (
                  <div key={i} className="flex gap-2">
                    <input name="upgrade_room_type" defaultValue={rp.room_type} placeholder="Room Type" className={inputClass} />
                    <input
                      name="upgrade_room_price"
                      type="number"
                      defaultValue={rp.price_aed}
                      placeholder="Price (AED)"
                      className={inputClass}
                    />
                    <SecondaryButton
                      type="button"
                      onClick={() => setUpgradeRoomPrices((prev) => prev.filter((_, idx) => idx !== i))}
                    >
                      Remove
                    </SecondaryButton>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Card>

      {transferOptions && transferOptions.length > 0 && (
        <Card>
          <div className="mb-1 flex items-center justify-between">
            <h2 className="font-semibold text-masaar-black">5. Transfer Add-on (Optional)</h2>
            <SecondaryButton
              type="button"
              onClick={() =>
                setTransferAddons((prev) => [...prev, { transfer_id: transferOptions[0].id, vehicle_id: "" }])
              }
            >
              + Add Transfer Option
            </SecondaryButton>
          </div>
          <p className="mb-3 text-sm text-masaar-black/60">
            Offer specific routes/vehicles from the Transfer Rate Card as part of this package —
            per masaar-client-data-round2.md Section 3. Leave vehicle as &quot;Any&quot; to offer the
            route without committing to a specific vehicle.
          </p>
          <div className="space-y-2">
            {transferAddons.map((addon, i) => (
              <div key={i} className="flex gap-2">
                <select
                  name="transfer_addon_transfer_id"
                  value={addon.transfer_id}
                  onChange={(e) =>
                    setTransferAddons((prev) =>
                      prev.map((a, idx) => (idx === i ? { ...a, transfer_id: e.target.value } : a))
                    )
                  }
                  className={inputClass}
                >
                  {transferOptions.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.route_name}
                    </option>
                  ))}
                </select>
                <select
                  name="transfer_addon_vehicle_id"
                  value={addon.vehicle_id}
                  onChange={(e) =>
                    setTransferAddons((prev) =>
                      prev.map((a, idx) => (idx === i ? { ...a, vehicle_id: e.target.value } : a))
                    )
                  }
                  className={inputClass}
                >
                  <option value="">Any vehicle</option>
                  {(vehicleOptions ?? []).map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
                <SecondaryButton
                  type="button"
                  onClick={() => setTransferAddons((prev) => prev.filter((_, idx) => idx !== i))}
                >
                  Remove
                </SecondaryButton>
              </div>
            ))}
            {transferAddons.length === 0 && (
              <p className="text-sm italic text-masaar-black/40">No transfer add-ons attached yet.</p>
            )}
          </div>
        </Card>
      )}

      {state.status === "error" && <p className="text-sm text-red-600">{state.message}</p>}

      <div className="flex justify-end gap-2">
        <SecondaryButton type="button" onClick={() => router.push("/admin/packages")}>
          Cancel
        </SecondaryButton>
        <PrimaryButton type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save & Publish"}
        </PrimaryButton>
      </div>
    </form>
  );
}
