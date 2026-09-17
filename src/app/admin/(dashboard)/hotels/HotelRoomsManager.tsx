"use client";

import { useActionState, useEffect, useState } from "react";
import { Card, Field, PrimaryButton, SecondaryButton, inputClass } from "@/components/admin/ui";
import type { HotelRoomRow } from "@/lib/types/database";
import { deleteHotelRoom, saveHotelRoom, type HotelRoomFormState } from "./actions";

function RoomForm({
  hotelId,
  room,
  onDone,
}: {
  hotelId: string;
  room?: HotelRoomRow;
  onDone?: () => void;
}) {
  const action = saveHotelRoom.bind(null, hotelId, room?.id ?? null);
  const [state, formAction, isPending] = useActionState<HotelRoomFormState, FormData>(action, { status: "idle" });

  useEffect(() => {
    if (state.status === "success") onDone?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Room Name" required>
          <input name="room_type" defaultValue={room?.room_type ?? ""} required placeholder="e.g. Classic Room" className={inputClass} />
        </Field>
        <Field label="Rate Period" hint='e.g. "Oct 1-30, 2026"'>
          <input name="rate_period_label" defaultValue={room?.rate_period_label ?? ""} className={inputClass} />
        </Field>
        <Field label="Room Only Price (AED)">
          <input type="number" name="price_ro" defaultValue={room?.price_ro ?? ""} className={inputClass} />
        </Field>
        <Field label="B&amp;B Price (AED)">
          <input type="number" name="price_bb" defaultValue={room?.price_bb ?? ""} className={inputClass} />
        </Field>
        <Field label="Bed Type">
          <input name="bed_type" defaultValue={room?.bed_type ?? ""} placeholder="e.g. Double/King" className={inputClass} />
        </Field>
        <Field label="Image URL">
          <input name="image_url" defaultValue={room?.image_url ?? ""} className={inputClass} />
        </Field>
        <Field label="Size (m²)">
          <input type="number" name="size_sqm" defaultValue={room?.size_sqm ?? ""} className={inputClass} />
        </Field>
        <Field label="Beds">
          <input type="number" name="bed_count" defaultValue={room?.bed_count ?? ""} className={inputClass} />
        </Field>
        <Field label="Bathrooms">
          <input type="number" name="bathroom_count" defaultValue={room?.bathroom_count ?? ""} className={inputClass} />
        </Field>
      </div>

      <Field label="Notes">
        <textarea name="notes" defaultValue={room?.notes ?? ""} rows={2} className={inputClass} />
      </Field>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Board Basis Options" hint="One per line">
          <textarea
            name="board_basis_options"
            defaultValue={(room?.board_basis_options ?? []).join("\n")}
            rows={3}
            placeholder={"Room Only\nBreakfast\nHalf Board"}
            className={inputClass}
          />
        </Field>
        <Field label="Cancellation Options" hint="One per line">
          <textarea
            name="cancellation_policy_options"
            defaultValue={(room?.cancellation_policy_options ?? []).join("\n")}
            rows={3}
            placeholder={"Non-refundable\nFree cancellation"}
            className={inputClass}
          />
        </Field>
        <Field label="View Options" hint="One per line">
          <textarea
            name="view_options"
            defaultValue={(room?.view_options ?? []).join("\n")}
            rows={3}
            placeholder={"Kaaba View\nHaram View"}
            className={inputClass}
          />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="is_active" defaultChecked={room?.is_active ?? true} />
        Active (visible on website)
      </label>

      <div className="rounded-md border border-amber-300 bg-amber-50/40 p-3">
        <p className="mb-2 text-xs font-semibold text-masaar-black">Admin Only — Never Shown Publicly</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Data Confidence">
            <select name="data_confidence" defaultValue={room?.data_confidence ?? ""} className={inputClass}>
              <option value="">—</option>
              <option value="verified">Verified</option>
              <option value="estimated">Estimated</option>
              <option value="needs_verification">Needs Verification</option>
            </select>
          </Field>
          <Field label="Caution Note">
            <input name="admin_caution_note" defaultValue={room?.admin_caution_note ?? ""} className={inputClass} />
          </Field>
        </div>
      </div>

      {state.status === "error" && <p className="text-sm text-red-600">{state.message}</p>}

      <div className="flex justify-end gap-2">
        {onDone && (
          <SecondaryButton type="button" onClick={onDone}>
            Cancel
          </SecondaryButton>
        )}
        <PrimaryButton type="submit" disabled={isPending}>
          {isPending ? "Saving…" : room ? "Save Room" : "+ Add Room"}
        </PrimaryButton>
      </div>
    </form>
  );
}

function RoomRow({ hotelId, room }: { hotelId: string; room: HotelRoomRow }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div className="rounded-md border border-black/10 p-4">
        <RoomForm hotelId={hotelId} room={room} onDone={() => setEditing(false)} />
      </div>
    );
  }

  const price = room.price_ro ?? room.price_bb;

  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-admin-surface px-4 py-3">
      <div>
        <p className="text-sm font-medium text-masaar-black">
          {room.room_type}
          {price != null && <span className="font-normal text-masaar-black/60"> — AED {price.toLocaleString()}</span>}
          {!room.is_active && <span className="ml-2 text-xs text-masaar-black/40">(Inactive)</span>}
        </p>
        {room.data_confidence && (
          <p className="text-xs text-masaar-black/40">
            {room.data_confidence === "needs_verification" ? "Needs Verification" : room.data_confidence === "estimated" ? "Estimated" : "Verified"}
            {room.admin_caution_note && ` — ${room.admin_caution_note}`}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setEditing(true)} className="text-sm font-medium text-admin-primary">
          Edit
        </button>
        <form action={deleteHotelRoom.bind(null, hotelId, room.id)}>
          <button type="submit" className="text-sm text-red-600 underline">
            Delete
          </button>
        </form>
      </div>
    </div>
  );
}

export function HotelRoomsManager({ hotelId, rooms }: { hotelId: string; rooms: HotelRoomRow[] }) {
  const [adding, setAdding] = useState(false);

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-masaar-black">Room Options</h2>
        {!adding && <SecondaryButton type="button" onClick={() => setAdding(true)}>+ Add Room</SecondaryButton>}
      </div>

      <div className="space-y-2">
        {rooms.length === 0 && <p className="text-sm text-masaar-black/50">No rooms added yet.</p>}
        {rooms.map((room) => (
          <RoomRow key={room.id} hotelId={hotelId} room={room} />
        ))}
      </div>

      {adding && (
        <div className="mt-4 rounded-md border border-black/10 p-4">
          <RoomForm hotelId={hotelId} onDone={() => setAdding(false)} />
        </div>
      )}
    </Card>
  );
}
