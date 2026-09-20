"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Field, PrimaryButton, SecondaryButton, inputClass } from "@/components/admin/ui";
import type {
  HajjItinerarySegment,
  PackageItineraryDay,
  PackageRow,
  PackageType,
  TransferRow,
  TransferVehicleRow,
} from "@/lib/types/database";
import { savePackage, type PackageFormState } from "./actions";

type RoomPrice = { room_type: string; price_aed: string };
type TransferAddon = { transfer_id: string; vehicle_id: string };
type SegmentField = { location: string; nights: string; board_type: string; note: string };

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

  // Controlled so the Hajj-only fields (maktab category, segmented
  // itinerary) can show/hide live as the admin picks a type, rather than
  // only reflecting whatever type the package already had on load.
  const [type, setType] = useState<PackageType>(initial?.type ?? defaultType ?? "umrah");

  const itineraryText = (initial?.itinerary as PackageItineraryDay[] | undefined)
    ?.map((d) => d.items.join("; "))
    .join("\n");

  const [segments, setSegments] = useState<SegmentField[]>(
    initial?.itinerary_segments?.length
      ? (initial.itinerary_segments as HajjItinerarySegment[]).map((s) => ({
          location: s.location,
          nights: String(s.nights),
          board_type: s.board_type,
          note: s.note ?? "",
        }))
      : [{ location: "", nights: "", board_type: "", note: "" }]
  );

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <h2 className="mb-1 font-semibold text-masaar-black">1. Basic Information</h2>
        <p className="mb-4 text-sm text-masaar-black/60">
          Title, city/destination and the fields in &ldquo;2. Package Details&rdquo; below apply to
          the whole tier — saving here updates every duration variant of this same tier
          automatically, so you only enter that copy once.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Package Type" required>
            <div className="flex gap-4 pt-2">
              {(["umrah", "hajj"] as PackageType[]).map((t) => (
                <label key={t} className="flex items-center gap-2 text-sm capitalize">
                  <input
                    type="radio"
                    name="type"
                    value={t}
                    checked={type === t}
                    onChange={() => setType(t)}
                    required
                  />
                  {t}
                </label>
              ))}
            </div>
          </Field>
          <Field label="Tier" required>
            <select name="tier" defaultValue={initial?.tier ?? "essential"} className={inputClass}>
              <option value="essential">Essential</option>
              <option value="signature">Signature</option>
              <option value="exclusive">Exclusive</option>
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
          <Field
            label="Short Description"
            hint="1-2 sentences, shown under the tier heading on the listing pages, above the card(s) for this tier."
            className="sm:col-span-2"
          >
            <textarea
              name="short_description"
              rows={2}
              defaultValue={initial?.short_description ?? ""}
              placeholder="e.g. A warm, comfortable introduction to Umrah, without compromising on care."
              className={inputClass}
            />
          </Field>
          <Field
            label="Card Tagline"
            hint="A short tier-level line shown on every package card, shared across this tier's duration variants."
            className="sm:col-span-2"
          >
            <input
              name="tagline"
              defaultValue={initial?.tagline ?? ""}
              placeholder="e.g. Smart & Comfortable"
              className={inputClass}
            />
          </Field>
        </div>

        {/* ── Package Card — Route & Hotel Notes (tier-level, synced) ── */}
        <div className="mt-4 border-t border-black/8 pt-4">
          <p className="mb-3 text-sm font-medium text-masaar-black">Package Card — Route & Hotel Notes</p>
          <p className="mb-3 text-xs text-masaar-black/50">
            Tier-level — saved here updates every duration variant of this tier automatically. Leave blank to hide the section from the card.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Route Line"
              hint='Displayed as a transfer route strip on the card, e.g. "Jeddah Airport → Makkah Hotel → Madinah Hotel → Madinah Airport". Use → as the separator — it will be split into labelled segments with icons.'
              className="sm:col-span-2"
            >
              <input
                name="route_line"
                defaultValue={(initial as PackageRow & { route_line?: string | null })?.route_line ?? ""}
                placeholder="e.g. Jeddah Airport → Makkah Hotel → Madinah Hotel → Madinah Airport"
                className={inputClass}
              />
            </Field>
            <Field label="Makkah Hotel Name" hint='e.g. "VOCO Makkah (or similar)"'>
              <input
                name="makkah_hotel_name"
                defaultValue={(initial as PackageRow & { makkah_hotel_name?: string | null })?.makkah_hotel_name ?? ""}
                placeholder="e.g. VOCO Makkah (or similar)"
                className={inputClass}
              />
            </Field>
            <Field
              label="Makkah Hotel Access Note"
              hint='Proximity/access description, e.g. "8 mins via complimentary shuttle / 25-min walk". ⚠ Use "complimentary shuttle" or "24/7 hotel shuttle service" — never "private shuttle" for a hotel Haram shuttle.'
            >
              <input
                name="makkah_hotel_note"
                defaultValue={(initial as PackageRow & { makkah_hotel_note?: string | null })?.makkah_hotel_note ?? ""}
                placeholder="e.g. 8 mins via complimentary shuttle / 25-min walk"
                className={inputClass}
              />
            </Field>
            <Field label="Makkah Hotel Access Tag" hint='Short badge text, e.g. "Step-free access & 24/7 hotel shuttle service"' className="sm:col-span-2">
              <input
                name="makkah_hotel_access_tag"
                defaultValue={(initial as PackageRow & { makkah_hotel_access_tag?: string | null })?.makkah_hotel_access_tag ?? ""}
                placeholder="e.g. Step-free access & 24/7 hotel shuttle service"
                className={inputClass}
              />
            </Field>
            <Field label="Madinah Hotel Name" hint='e.g. "Zowar International Madinah"'>
              <input
                name="madinah_hotel_name"
                defaultValue={(initial as PackageRow & { madinah_hotel_name?: string | null })?.madinah_hotel_name ?? ""}
                placeholder="e.g. Zowar International Madinah"
                className={inputClass}
              />
            </Field>
            <Field label="Madinah Hotel Access Note" hint='e.g. "4-min flat walk to Northern Courtyard"'>
              <input
                name="madinah_hotel_note"
                defaultValue={(initial as PackageRow & { madinah_hotel_note?: string | null })?.madinah_hotel_note ?? ""}
                placeholder="e.g. 4-min flat walk to Northern Courtyard"
                className={inputClass}
              />
            </Field>
            <Field label="Madinah Hotel Access Tag" hint='Short badge text, e.g. "Level, pedestrian-only pathway"' className="sm:col-span-2">
              <input
                name="madinah_hotel_access_tag"
                defaultValue={(initial as PackageRow & { madinah_hotel_access_tag?: string | null })?.madinah_hotel_access_tag ?? ""}
                placeholder="e.g. Level, pedestrian-only pathway"
                className={inputClass}
              />
            </Field>

            <div className="sm:col-span-2 mt-2 pt-2 border-t border-black/10">
              <p className="text-xs font-semibold uppercase tracking-wider text-deep-gold mb-2">Alternate Hotel Option (Option B)</p>
            </div>

            <Field label="Makkah Alternate Hotel Name" hint='Option B hotel name, e.g. "Al Kiswah Towers Makkah (or similar)"'>
              <input
                name="makkah_hotel_name_alt"
                defaultValue={(initial as PackageRow & { makkah_hotel_name_alt?: string | null })?.makkah_hotel_name_alt ?? ""}
                placeholder="e.g. Al Kiswah Towers Makkah (or similar)"
                className={inputClass}
              />
            </Field>
            <Field label="Makkah Alternate Hotel Note" hint='Proximity note for Option B'>
              <input
                name="makkah_hotel_note_alt"
                defaultValue={(initial as PackageRow & { makkah_hotel_note_alt?: string | null })?.makkah_hotel_note_alt ?? ""}
                placeholder="e.g. 10 mins via 24/7 hotel shuttle service"
                className={inputClass}
              />
            </Field>
            <Field label="Makkah Alternate Hotel Tag" hint='Access tag for Option B' className="sm:col-span-2">
              <input
                name="makkah_hotel_access_tag_alt"
                defaultValue={(initial as PackageRow & { makkah_hotel_access_tag_alt?: string | null })?.makkah_hotel_access_tag_alt ?? ""}
                placeholder="e.g. Step-free access & 24/7 hotel shuttle service"
                className={inputClass}
              />
            </Field>

            <Field label="Madinah Alternate Hotel Name" hint='Option B hotel name, e.g. "Emaar Mektan Madinah (or similar)"'>
              <input
                name="madinah_hotel_name_alt"
                defaultValue={(initial as PackageRow & { madinah_hotel_name_alt?: string | null })?.madinah_hotel_name_alt ?? ""}
                placeholder="e.g. Emaar Mektan Madinah (or similar)"
                className={inputClass}
              />
            </Field>
            <Field label="Madinah Alternate Hotel Note" hint='Proximity note for Option B'>
              <input
                name="madinah_hotel_note_alt"
                defaultValue={(initial as PackageRow & { madinah_hotel_note_alt?: string | null })?.madinah_hotel_note_alt ?? ""}
                placeholder="e.g. 5-min flat walk to King Saud Gate"
                className={inputClass}
              />
            </Field>
            <Field label="Madinah Alternate Hotel Tag" hint='Access tag for Option B' className="sm:col-span-2">
              <input
                name="madinah_hotel_access_tag_alt"
                defaultValue={(initial as PackageRow & { madinah_hotel_access_tag_alt?: string | null })?.madinah_hotel_access_tag_alt ?? ""}
                placeholder="e.g. Pedestrian commercial strip approach"
                className={inputClass}
              />
            </Field>
          </div>
        </div>

        <div className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {type === "hajj" && (
              <Field
                label="Maktab Category"
                hint='Hajj only. Free text — phrase it however fits, e.g. "A-Category" or "VIP A-Category". Tier-level, shared across this tier&apos;s duration variants.'
              >
                <input
                  name="maktab_category"
                  defaultValue={initial?.maktab_category ?? ""}
                  placeholder="e.g. A-Category"
                  className={inputClass}
                />
              </Field>
            )}
            <Field label="Duration (Nights)" required hint="This tier's own duration variants share the same title/copy below but each have their own nights, slug, hotels and pricing.">
              <input
                type="number"
                min={1}
                name="duration_nights"
                defaultValue={initial?.duration_nights}
                required
                className={inputClass}
              />
            </Field>
            <Field
              label="Duration Label"
              hint='Display text only, e.g. "6 Nights / 7 Days" — does not affect Duration (Nights) above, or which duration section this package appears under on the site. Keep it matching, or it will read inconsistently.'
            >
              <input name="duration_label" defaultValue={initial?.duration_label ?? ""} placeholder="e.g. 6 Nights / 7 Days" className={inputClass} />
            </Field>
            <Field label="Hero Image URL" hint="Supabase Storage upload UI is a follow-up — paste a URL for now.">
              <input name="hero_image_url" defaultValue={initial?.hero_image_url ?? ""} className={inputClass} />
            </Field>
          </div>
        </div>

        <div className="mt-4 flex gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="is_active" defaultChecked={initial?.is_active ?? true} />
            Active (visible on website — set per duration, independent of siblings)
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
              placeholder={"Comfortable hotel stay\nPrivate shuttle transport\nVisa processing\nAirport transfers"}
              className={inputClass}
            />
          </Field>
        </div>
      </Card>

      <Card>
        <h2 className="mb-1 font-semibold text-masaar-black">Page SEO</h2>
        <p className="mb-3 text-sm text-masaar-black/60">
          Per-duration — this specific duration&apos;s detail page. Falls back to a generated title/description
          from this package&apos;s content when left blank.
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

      {type === "hajj" ? (
        <Card>
          <div className="mb-1 flex items-center justify-between">
            <h2 className="font-semibold text-masaar-black">3. Itinerary Segments</h2>
            <SecondaryButton
              type="button"
              onClick={() =>
                setSegments((prev) => [...prev, { location: "", nights: "", board_type: "", note: "" }])
              }
            >
              + Add Segment
            </SecondaryButton>
          </div>
          <p className="mb-3 text-sm text-masaar-black/60">
            Hajj only — one row per city/location, e.g. Madinah, Makkah, Aziziyah, Mina &amp; Arafat.
            Specific to this duration, not shared with sibling variants.
          </p>
          <div className="space-y-3">
            {segments.map((seg, i) => (
              <div key={i} className="grid gap-2 rounded-md border border-black/10 p-3 sm:grid-cols-[2fr_1fr_1fr_2fr_auto] sm:items-start">
                <input
                  name="segment_location"
                  defaultValue={seg.location}
                  placeholder="Location (e.g. Madinah)"
                  className={inputClass}
                />
                <input
                  name="segment_nights"
                  type="number"
                  min={1}
                  defaultValue={seg.nights}
                  placeholder="Nights"
                  className={inputClass}
                />
                <input
                  name="segment_board_type"
                  defaultValue={seg.board_type}
                  placeholder="Board (e.g. Half Board)"
                  className={inputClass}
                />
                <input
                  name="segment_note"
                  defaultValue={seg.note}
                  placeholder="Note (optional)"
                  className={inputClass}
                />
                <SecondaryButton
                  type="button"
                  onClick={() => setSegments((prev) => prev.filter((_, idx) => idx !== i))}
                >
                  Remove
                </SecondaryButton>
              </div>
            ))}
          </div>
        </Card>
      ) : (
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
      )}

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
          package type.
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
