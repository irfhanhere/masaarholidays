"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge, Field, PrimaryButton, SecondaryButton, inputClass } from "@/components/admin/ui";
import type { ZiyaratPricingRow, ZiyaratVehicleTypeRow } from "@/lib/types/database";
import { deleteVehicleType, savePricingMatrix, saveVehicleType, toggleVehicleActive } from "./actions";

interface Props {
  vehicles: ZiyaratVehicleTypeRow[];
  pricing: ZiyaratPricingRow[];
}

export function VehiclesManager({ vehicles, pricing }: Props) {
  const [activeTab, setActiveTab] = useState<"makkah" | "madinah" | "types">("makkah");
  const [editingVehicle, setEditingVehicle] = useState<Partial<ZiyaratVehicleTypeRow> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Local state for pricing matrix: { [key: `city:vehicle_type_id`]: number }
  const initialMatrix: Record<string, number> = {};
  pricing.forEach((p) => {
    initialMatrix[`${p.city}:${p.vehicle_type_id}`] = p.price_aed;
  });
  const [matrix, setMatrix] = useState<Record<string, number>>(initialMatrix);

  const handlePriceChange = (city: "Makkah" | "Madinah", vehicleId: string, val: string) => {
    const num = parseFloat(val) || 0;
    setMatrix((prev) => ({
      ...prev,
      [`${city}:${vehicleId}`]: num,
    }));
  };

  const handleSaveMatrix = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const itemsToSave: Array<{ city: "Makkah" | "Madinah"; vehicle_type_id: string; price_aed: number }> = [];
      vehicles.forEach((v) => {
        (["Makkah", "Madinah"] as const).forEach((city) => {
          const key = `${city}:${v.id}`;
          if (matrix[key] !== undefined) {
            itemsToSave.push({
              city,
              vehicle_type_id: v.id,
              price_aed: matrix[key],
            });
          }
        });
      });

      await savePricingMatrix(itemsToSave);
      setSaveMessage("Pricing matrix saved successfully!");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setSaveMessage(`Error saving matrix: ${message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-masaar-black/50">
            <Link href="/admin" className="hover:underline">Services</Link>
            <span>&rsaquo;</span>
            <span className="font-semibold text-masaar-black">Ziyarat & Vehicles</span>
          </div>
          <h1 className="text-2xl font-bold text-masaar-black mt-1">Ziyarat / Vehicle Pricing</h1>
          <p className="text-xs text-masaar-black/60">
            Manage vehicle options and pricing for Makkah and Madinah Ziyarat. This data can be used across multiple packages.
          </p>
        </div>

        <PrimaryButton
          type="button"
          onClick={() =>
            setEditingVehicle({
              name: "",
              capacity_label: "Up to 4 passengers",
              description: "",
              image_url: "",
              is_active: true,
              display_order: 0,
            })
          }
        >
          + Add Vehicle Type
        </PrimaryButton>
      </div>

      {/* Tabs Row */}
      <div className="flex border-b border-black/10">
        <button
          type="button"
          onClick={() => setActiveTab("makkah")}
          className={`border-b-2 px-6 py-2.5 text-sm font-bold transition-all ${
            activeTab === "makkah"
              ? "border-deep-gold text-deep-gold"
              : "border-transparent text-masaar-black/50 hover:text-masaar-black"
          }`}
        >
          Makkah Ziyarat
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("madinah")}
          className={`border-b-2 px-6 py-2.5 text-sm font-bold transition-all ${
            activeTab === "madinah"
              ? "border-deep-gold text-deep-gold"
              : "border-transparent text-masaar-black/50 hover:text-masaar-black"
          }`}
        >
          Madinah Ziyarat
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("types")}
          className={`border-b-2 px-6 py-2.5 text-sm font-bold transition-all ${
            activeTab === "types"
              ? "border-deep-gold text-deep-gold"
              : "border-transparent text-masaar-black/50 hover:text-masaar-black"
          }`}
        >
          Vehicle Types
        </button>
      </div>

      {saveMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-800">
          {saveMessage}
        </div>
      )}

      {/* Add / Edit Vehicle Modal/Drawer Form */}
      {editingVehicle && (
        <div className="rounded-xl border border-deep-gold/30 bg-warm-ivory/30 p-6 shadow-2xs space-y-4">
          <h3 className="font-bold text-base text-masaar-black">
            {editingVehicle.id ? "Edit Vehicle Type" : "New Vehicle Type"}
          </h3>
          <form action={saveVehicleType} onSubmit={() => setEditingVehicle(null)} className="space-y-4">
            {editingVehicle.id && <input type="hidden" name="id" value={editingVehicle.id} />}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Vehicle Name" required>
                <input
                  name="name"
                  required
                  className={inputClass}
                  defaultValue={editingVehicle.name ?? ""}
                  placeholder="e.g. Sedan, Staria, GMC Yukon"
                />
              </Field>

              <Field label="Capacity Label" required>
                <input
                  name="capacity_label"
                  required
                  className={inputClass}
                  defaultValue={editingVehicle.capacity_label ?? ""}
                  placeholder="e.g. Up to 4 passengers"
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Image URL">
                <input
                  name="image_url"
                  className={inputClass}
                  defaultValue={editingVehicle.image_url ?? ""}
                  placeholder="https://..."
                />
              </Field>

              <Field label="Description">
                <input
                  name="description"
                  className={inputClass}
                  defaultValue={editingVehicle.description ?? ""}
                  placeholder="e.g. Comfortable for small families"
                />
              </Field>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <SecondaryButton type="button" onClick={() => setEditingVehicle(null)}>
                Cancel
              </SecondaryButton>
              <PrimaryButton type="submit">Save Vehicle</PrimaryButton>
            </div>
          </form>
        </div>
      )}

      {/* Main Grid Content + Right Callout Box */}
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Left Column: Tables based on Active Tab */}
        <div className="space-y-6 lg:col-span-3">

          {/* TAB 1: MAKKAH ZIYARAT */}
          {(activeTab === "makkah" || activeTab === "madinah") && (
            <div className="rounded-xl border border-black/10 bg-white p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{activeTab === "makkah" ? "🕋" : "🕌"}</span>
                  <div>
                    <h3 className="font-bold text-base text-masaar-black">
                      {activeTab === "makkah" ? "Makkah Ziyarat" : "Madinah Ziyarat"}
                    </h3>
                    <p className="text-xs text-masaar-black/50">
                      Manage vehicle options and pricing for {activeTab === "makkah" ? "Makkah" : "Madinah"} Ziyarat tours.
                    </p>
                  </div>
                </div>

                <PrimaryButton type="button" onClick={handleSaveMatrix} disabled={isSaving} id="save_ziyarat_pricing_btn">
                  {isSaving ? "Saving..." : "Save Pricing Matrix"}
                </PrimaryButton>
              </div>

              <div className="overflow-x-auto rounded-lg border border-black/10">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-black/10 bg-warm-ivory/50 font-bold uppercase text-masaar-black/60">
                    <tr>
                      <th className="px-3 py-2.5 w-8">#</th>
                      <th className="px-4 py-2.5">Vehicle Type</th>
                      <th className="px-4 py-2.5">Image</th>
                      <th className="px-4 py-2.5">Capacity</th>
                      <th className="px-4 py-2.5">Price (AED)</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {vehicles.map((v, idx) => {
                      const cityLabel = activeTab === "makkah" ? "Makkah" : "Madinah";
                      const currentPrice = matrix[`${cityLabel}:${v.id}`] ?? 300;

                      return (
                        <tr key={v.id} className="hover:bg-warm-ivory/20">
                          <td className="px-3 py-3 font-bold text-masaar-black/40">{idx + 1}</td>
                          <td className="px-4 py-3 font-bold text-masaar-black">{v.name}</td>
                          <td className="px-4 py-3">
                            <img
                              src={v.image_url || "/images/vehicles/sedan.jpg"}
                              alt={v.name}
                              className="h-9 w-14 rounded object-cover border border-black/10"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                          </td>
                          <td className="px-4 py-3 text-masaar-black/70 font-medium">{v.capacity_label}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center w-32">
                              <span className="rounded-l border border-r-0 border-black/10 bg-warm-ivory px-2 py-1 text-[11px] font-bold text-masaar-black/60">
                                AED
                              </span>
                              <input
                                id={`price_${cityLabel}_${v.slug}`}
                                type="number"
                                min={0}
                                value={currentPrice}
                                onChange={(e) => handlePriceChange(cityLabel, v.id, e.target.value)}
                                className="w-full rounded-r border border-black/10 px-2 py-1 text-xs font-bold text-masaar-black focus:outline-none focus:ring-1 focus:ring-deep-gold"
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge tone={v.is_active ? "green" : "gray"}>
                              {v.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => setEditingVehicle(v)}
                              className="rounded border border-black/10 px-2.5 py-1 text-xs font-semibold text-admin-primary hover:bg-black/5"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: VEHICLE TYPES MASTER LIST */}
          {activeTab === "types" && (
            <div className="rounded-xl border border-black/10 bg-white p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🚗</span>
                  <div>
                    <h3 className="font-bold text-base text-masaar-black">Vehicle Types (Master List)</h3>
                    <p className="text-xs text-masaar-black/50">
                      Manage all vehicle types. These can be used in both Makkah and Madinah Ziyarat.
                    </p>
                  </div>
                </div>

                <SecondaryButton
                  type="button"
                  onClick={() =>
                    setEditingVehicle({
                      name: "",
                      capacity_label: "Up to 4 passengers",
                      description: "",
                      image_url: "",
                      is_active: true,
                    })
                  }
                >
                  + Add Vehicle Type
                </SecondaryButton>
              </div>

              <div className="overflow-x-auto rounded-lg border border-black/10">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-black/10 bg-warm-ivory/50 font-bold uppercase text-masaar-black/60">
                    <tr>
                      <th className="px-3 py-2.5 w-8">#</th>
                      <th className="px-4 py-2.5">Vehicle Type</th>
                      <th className="px-4 py-2.5">Image</th>
                      <th className="px-4 py-2.5">Capacity</th>
                      <th className="px-4 py-2.5">Description</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {vehicles.map((v, idx) => (
                      <tr key={v.id} className="hover:bg-warm-ivory/20">
                        <td className="px-3 py-3 font-bold text-masaar-black/40">{idx + 1}</td>
                        <td className="px-4 py-3 font-bold text-masaar-black">{v.name}</td>
                        <td className="px-4 py-3">
                          <img
                            src={v.image_url || "/images/vehicles/sedan.jpg"}
                            alt={v.name}
                            className="h-9 w-14 rounded object-cover border border-black/10"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        </td>
                        <td className="px-4 py-3 text-masaar-black/70 font-medium">{v.capacity_label}</td>
                        <td className="px-4 py-3 text-masaar-black/60">{v.description || "—"}</td>
                        <td className="px-4 py-3">
                          <button type="button" onClick={() => toggleVehicleActive(v.id, !v.is_active)}>
                            <Badge tone={v.is_active ? "green" : "gray"}>
                              {v.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setEditingVehicle(v)}
                            className="rounded border border-black/10 px-2.5 py-1 text-xs font-semibold text-admin-primary hover:bg-black/5"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Callout Box (Matching ADMIN -VEHICLE.png) */}
        <div className="rounded-xl border border-black/10 bg-warm-ivory/30 p-5 shadow-2xs space-y-4 lg:col-span-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-base">ℹ</span>
            <h4 className="font-bold text-masaar-black">About Ziyarat Pricing</h4>
          </div>
          <p className="text-masaar-black/70 leading-relaxed">
            These vehicle options and prices can be used across multiple packages (Signature, Exclusive, etc.). You only need to manage the pricing here once.
          </p>

          <div className="pt-3 border-t border-black/10 space-y-2">
            <h5 className="font-bold text-masaar-black">Popular Ziyarat Locations</h5>

            <div className="space-y-1.5 text-masaar-black/70">
              <p className="font-bold text-deep-gold">🕋 Makkah Ziyarat</p>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                <li>Jabal Al Noor</li>
                <li>Jabal Thawr</li>
                <li>Arafat</li>
                <li>Mina</li>
                <li>Muzdalifah</li>
                <li>Masjid Al Jinn</li>
                <li>Other historical sites</li>
              </ul>
            </div>

            <div className="space-y-1.5 pt-2 text-masaar-black/70">
              <p className="font-bold text-deep-gold">🕌 Madinah Ziyarat</p>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                <li>Quba Mosque</li>
                <li>Qiblatain Mosque</li>
                <li>Mount Uhud</li>
                <li>Masjid Al Khandaq</li>
                <li>Seven Mosques</li>
                <li>Other historical sites</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
