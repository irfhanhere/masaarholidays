"use client";

import { useState } from "react";
import { Card, SecondaryButton, inputClass } from "@/components/admin/ui";
import type { LineItemInput } from "@/app/admin/(dashboard)/documents/actions";
import type { DocumentItemRow } from "@/lib/types/database";
import type {
  SelectableHotel,
  SelectablePackage,
  SelectablePrivateTrip,
  SelectableTransfer,
  SelectableZiyaratOption,
} from "@/lib/data/document-products";

/**
 * Shared "+ Add Hotel/Transfer/Private Trip/Package/Ziyarat/Custom Item"
 * picker and the editable line-item row — identical between the Quotation
 * Builder and Invoice Builder (both pull from the same CMS tables and
 * write document_items the same way), so it lives here once instead of
 * being copy-pasted per document type.
 */

export function money(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export interface LineItemProducts {
  hotels: SelectableHotel[];
  transfers: SelectableTransfer[];
  privateTrips: SelectablePrivateTrip[];
  packages: SelectablePackage[];
  ziyaratOptions: SelectableZiyaratOption[];
}

export function LineItemRow({
  item,
  onUpdate,
  onDelete,
  disabled,
}: {
  item: DocumentItemRow;
  onUpdate: (id: string, patch: Partial<LineItemInput>) => void;
  onDelete: (id: string) => void;
  disabled: boolean;
}) {
  const [description, setDescription] = useState(item.description);
  const [quantity, setQuantity] = useState(item.quantity);
  const [unitPrice, setUnitPrice] = useState(item.unit_price_aed);
  const [discount, setDiscount] = useState(item.discount_aed);

  function commit() {
    if (description !== item.description || quantity !== item.quantity || unitPrice !== item.unit_price_aed || discount !== item.discount_aed) {
      onUpdate(item.id, { description, quantity, unit_price_aed: unitPrice, discount_aed: discount });
    }
  }

  return (
    <div className="grid grid-cols-12 items-center gap-2 rounded-md border border-black/10 p-3 text-sm">
      <input className={inputClass + " col-span-4"} value={description} onChange={(e) => setDescription(e.target.value)} onBlur={commit} disabled={disabled} />
      <input
        type="number"
        min={0}
        className={inputClass + " col-span-2"}
        value={quantity}
        onChange={(e) => setQuantity(Number(e.target.value))}
        onBlur={commit}
        disabled={disabled}
      />
      <input
        type="number"
        min={0}
        className={inputClass + " col-span-2"}
        value={unitPrice}
        onChange={(e) => setUnitPrice(Number(e.target.value))}
        onBlur={commit}
        disabled={disabled}
      />
      <input
        type="number"
        min={0}
        className={inputClass + " col-span-2"}
        value={discount}
        onChange={(e) => setDiscount(Number(e.target.value))}
        onBlur={commit}
        disabled={disabled}
      />
      <span className="col-span-1 text-right font-medium">AED {money(item.amount_aed)}</span>
      <button type="button" onClick={() => onDelete(item.id)} className="col-span-1 text-right text-red-500 hover:underline" disabled={disabled}>
        Remove
      </button>
    </div>
  );
}

type AddKind = "hotel" | "transfer" | "private_trip" | "package" | "ziyarat" | "custom";

export function AddItemCard({ products, onAdd, disabled }: { products: LineItemProducts; onAdd: (item: LineItemInput) => void; disabled: boolean }) {
  const [kind, setKind] = useState<AddKind>("hotel");
  const [selectedId, setSelectedId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [customDescription, setCustomDescription] = useState("");
  const [customPrice, setCustomPrice] = useState(0);

  function reset() {
    setSelectedId("");
    setQuantity(1);
    setCustomDescription("");
    setCustomPrice(0);
  }

  function handleAdd() {
    if (kind === "hotel") {
      const hotel = products.hotels.find((h) => h.id === selectedId);
      if (!hotel) return;
      onAdd({ item_type: "hotel", source_type: "hotel", source_id: hotel.id, description: hotel.name, details: hotel.city, quantity, unit_price_aed: hotel.price_from_aed ?? 0 });
    } else if (kind === "transfer") {
      const t = products.transfers.find((x) => x.id === selectedId);
      if (!t) return;
      onAdd({ item_type: "transfer", source_type: "transfer", source_id: t.id, description: t.route_name, details: t.vehicle_type ?? undefined, quantity, unit_price_aed: t.price_from_aed ?? 0 });
    } else if (kind === "private_trip") {
      const p = products.privateTrips.find((x) => x.id === selectedId);
      if (!p) return;
      onAdd({ item_type: "private_trip", source_type: "private_trip", source_id: p.id, description: p.name, details: p.destination, quantity, unit_price_aed: customPrice });
    } else if (kind === "package") {
      const [pkgId, roomType] = selectedId.split("::");
      const pkg = products.packages.find((x) => x.id === pkgId);
      const rp = pkg?.room_prices.find((r) => r.room_type === roomType);
      if (!pkg || !rp) return;
      onAdd({
        item_type: pkg.type === "hajj" ? "hajj_package" : "umrah_package",
        source_type: "package",
        source_id: pkg.id,
        description: `${pkg.title} (${pkg.tier})`,
        details: `${pkg.duration_days} Days — ${rp.room_type} Sharing`,
        quantity,
        unit_price_aed: rp.price_aed,
      });
    } else if (kind === "ziyarat") {
      const z = products.ziyaratOptions.find((x) => x.id === selectedId);
      if (!z) return;
      onAdd({ item_type: "private_trip", source_type: "ziyarat_pricing", source_id: z.id, description: `Private Ziyarat — ${z.vehicle_name}`, details: `${z.city} — ${z.capacity_label}`, quantity, unit_price_aed: z.price_aed });
    } else {
      if (!customDescription.trim()) return;
      onAdd({ item_type: "custom", description: customDescription, quantity, unit_price_aed: customPrice });
    }
    reset();
  }

  return (
    <Card>
      <h2 className="mb-4 font-semibold text-masaar-black">Add Existing Products</h2>
      <div className="flex flex-wrap gap-2">
        {(["hotel", "transfer", "private_trip", "package", "ziyarat", "custom"] as AddKind[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => {
              setKind(k);
              reset();
            }}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize ${
              kind === k ? "border-admin-primary bg-admin-surface text-admin-primary" : "border-black/15 text-masaar-black/60"
            }`}
          >
            {k.replace("_", " ")}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        {kind === "hotel" && (
          <select className={inputClass + " sm:col-span-2"} value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
            <option value="">Select hotel…</option>
            {products.hotels.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name} ({h.city}) — AED {h.price_from_aed ?? 0}
              </option>
            ))}
          </select>
        )}
        {kind === "transfer" && (
          <select className={inputClass + " sm:col-span-2"} value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
            <option value="">Select transfer…</option>
            {products.transfers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.route_name} — AED {t.price_from_aed ?? 0}
              </option>
            ))}
          </select>
        )}
        {kind === "private_trip" && (
          <>
            <select className={inputClass} value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
              <option value="">Select trip…</option>
              {products.privateTrips.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.destination})
                </option>
              ))}
            </select>
            <input type="number" min={0} placeholder="Price (AED)" className={inputClass} value={customPrice || ""} onChange={(e) => setCustomPrice(Number(e.target.value))} />
          </>
        )}
        {kind === "package" && (
          <select className={inputClass + " sm:col-span-2"} value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
            <option value="">Select package + room type…</option>
            {products.packages.map((pkg) =>
              pkg.room_prices.map((rp) => (
                <option key={`${pkg.id}::${rp.room_type}`} value={`${pkg.id}::${rp.room_type}`}>
                  {pkg.title} ({pkg.tier}) — {rp.room_type} — AED {rp.price_aed}
                </option>
              ))
            )}
          </select>
        )}
        {kind === "ziyarat" && (
          <select className={inputClass + " sm:col-span-2"} value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
            <option value="">Select vehicle…</option>
            {products.ziyaratOptions.map((z) => (
              <option key={z.id} value={z.id}>
                {z.city} — {z.vehicle_name} ({z.capacity_label}) — AED {z.price_aed}
              </option>
            ))}
          </select>
        )}
        {kind === "custom" && (
          <>
            <input placeholder="Description" className={inputClass + " sm:col-span-2"} value={customDescription} onChange={(e) => setCustomDescription(e.target.value)} />
            <input type="number" min={0} placeholder="Price (AED)" className={inputClass} value={customPrice || ""} onChange={(e) => setCustomPrice(Number(e.target.value))} />
          </>
        )}

        <input type="number" min={1} className={inputClass} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} placeholder="Qty" />
      </div>

      <div className="mt-3">
        <SecondaryButton type="button" onClick={handleAdd} disabled={disabled}>
          {disabled ? "Adding…" : "+ Add Item"}
        </SecondaryButton>
      </div>
    </Card>
  );
}
