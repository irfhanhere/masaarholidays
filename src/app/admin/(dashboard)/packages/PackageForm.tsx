"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Field, PrimaryButton, SecondaryButton, inputClass } from "@/components/admin/ui";
import type { PackageItineraryDay, PackageRow, PackageType } from "@/lib/types/database";
import { savePackage, type PackageFormState } from "./actions";

type RoomPrice = { room_type: string; price_aed: string };

export function PackageForm({
  packageId,
  initial,
  initialRoomPrices,
  initialUpgrade,
  initialUpgradeRoomPrices,
  defaultType,
}: {
  packageId?: string;
  initial?: PackageRow;
  initialRoomPrices?: { room_type: string; price_aed: number }[];
  initialUpgrade?: { label: string } | null;
  initialUpgradeRoomPrices?: { room_type: string; price_aed: number }[];
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
        <h2 className="mb-1 font-semibold text-masaar-black">2. Itinerary</h2>
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
          <h2 className="font-semibold text-masaar-black">3. Room Pricing (AED)</h2>
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
