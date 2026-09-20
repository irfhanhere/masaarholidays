"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge, PrimaryButton, SecondaryButton, inputClass } from "@/components/admin/ui";
import {
  addAddonItem,
  deleteInclusionItem,
  toggleAddonStatus,
  toggleInclusionDefault,
  toggleInclusionStatus,
  updateAddonItem,
  updateInclusionItem,
} from "./actions";

export interface InclusionRow {
  id: string;
  category: string;
  name: string;
  icon: string;
  is_default_included: boolean;
  status: string;
  display_order: number;
}

export interface AddonRow {
  id: string;
  category: string;
  name: string;
  key_slug: string;
  icon: string;
  price_type_label: string;
  private_trip_id: string | null;
  status: string;
  display_order: number;
}

export interface PrivateTripOption {
  id: string;
  name: string;
  destination: string;
}

interface Props {
  inclusions: InclusionRow[];
  addons: AddonRow[];
  privateTrips: PrivateTripOption[];
}

function slugify(text: string): string {
  return text.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-");
}

function InclusionKebabMenu({ item, onDelete }: { item: InclusionRow; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="flex size-7 items-center justify-center rounded-md text-masaar-black/40 hover:bg-black/5 hover:text-masaar-black"
      >
        &bull;&bull;&bull;
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-10 w-36 rounded-lg border border-black/10 bg-white py-1 text-xs shadow-lg">
          <button type="button" onClick={onDelete} title={`Delete "${item.name}"`} className="block w-full px-3 py-2 text-left text-red-600 hover:bg-red-50">
            🗑 Delete
          </button>
        </div>
      )}
    </div>
  );
}

export function InclusionsAddonsManager({ inclusions: initialInclusions, addons: initialAddons, privateTrips }: Props) {
  const [activeTab, setActiveTab] = useState<"umrah" | "hajj">("umrah");
  const [inclusions, setInclusions] = useState(initialInclusions);
  const [addons, setAddons] = useState(initialAddons);
  const [editingAddon, setEditingAddon] = useState<AddonRow | "new" | null>(null);
  const [editingInclusion, setEditingInclusion] = useState<InclusionRow | null>(null);
  const [deleteInclusionTarget, setDeleteInclusionTarget] = useState<InclusionRow | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingInclusion, setIsDeletingInclusion] = useState(false);

  async function handleDeleteInclusionConfirm() {
    if (!deleteInclusionTarget) return;
    setIsDeletingInclusion(true);
    try {
      await deleteInclusionItem(deleteInclusionTarget.id);
      setInclusions((prev) => prev.filter((i) => i.id !== deleteInclusionTarget.id));
    } finally {
      setIsDeletingInclusion(false);
      setDeleteInclusionTarget(null);
    }
  }

  async function handleToggleDefault(id: string, current: boolean) {
    const updated = inclusions.map((item) =>
      item.id === id ? { ...item, is_default_included: !current } : item
    );
    setInclusions(updated);
    await toggleInclusionDefault(id, !current);
  }

  async function handleToggleInclusionStatus(id: string, currentStatus: string) {
    const newStatus = currentStatus === "published" ? "draft" : "published";
    const updated = inclusions.map((item) =>
      item.id === id ? { ...item, status: newStatus } : item
    );
    setInclusions(updated);
    await toggleInclusionStatus(id, newStatus);
  }

  async function handleToggleAddonStatus(id: string, currentStatus: string) {
    const newStatus = currentStatus === "published" ? "draft" : "published";
    const updated = addons.map((item) =>
      item.id === id ? { ...item, status: newStatus } : item
    );
    setAddons(updated);
    await toggleAddonStatus(id, newStatus);
  }

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-masaar-black/50">
            <Link href="/admin/packages" className="hover:underline">Packages</Link>
            <span>&rsaquo;</span>
            <Link href="/admin/packages/umrah" className="hover:underline">Umrah</Link>
            <span>&rsaquo;</span>
            <span className="font-semibold text-masaar-black">Inclusions & Add-ons</span>
          </div>
          <h1 className="text-2xl font-bold text-masaar-black mt-1">Inclusions & Add-ons</h1>
          <p className="text-xs text-masaar-black/60">
            Manage the standard included services and optional add-ons for Umrah packages.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <PrimaryButton type="button">+ Add New &rsaquo;</PrimaryButton>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex border-b border-black/10">
        <button
          type="button"
          onClick={() => setActiveTab("umrah")}
          className={`border-b-2 px-6 py-2.5 text-sm font-bold transition-all ${
            activeTab === "umrah"
              ? "border-deep-gold text-deep-gold"
              : "border-transparent text-masaar-black/50 hover:text-masaar-black"
          }`}
        >
          Umrah
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("hajj")}
          className={`border-b-2 px-6 py-2.5 text-sm font-bold transition-all ${
            activeTab === "hajj"
              ? "border-deep-gold text-deep-gold"
              : "border-transparent text-masaar-black/50 hover:text-masaar-black"
          }`}
        >
          Hajj
        </button>
      </div>

      {/* ── SECTION 1: INCLUDED SERVICES ────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-4">
        <div className="rounded-xl border border-black/10 bg-white p-6 shadow-2xs space-y-4 lg:col-span-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 font-bold">
                ✓
              </span>
              <div>
                <h3 className="font-bold text-base text-masaar-black">Included Services</h3>
                <p className="text-xs text-masaar-black/50">
                  These services are included in the package price. You can manage the list and choose which are shown by default.
                </p>
              </div>
            </div>

            <SecondaryButton type="button">+ Add Inclusion</SecondaryButton>
          </div>

          <div className="overflow-x-auto rounded-lg border border-black/10">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-black/10 bg-warm-ivory/50 font-bold uppercase text-masaar-black/60">
                <tr>
                  <th className="px-3 py-2.5 w-8">#</th>
                  <th className="px-4 py-2.5">Service</th>
                  <th className="px-3 py-2.5">Icon</th>
                  <th className="px-4 py-2.5">Default Included</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {inclusions.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-warm-ivory/20">
                    <td className="px-3 py-3 font-bold text-masaar-black/40">{idx + 1}</td>
                    <td className="px-4 py-3 font-bold text-masaar-black">{item.name}</td>
                    <td className="px-3 py-3 text-base">{item.icon}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        id={`toggle_default_inc_${item.id}`}
                        onClick={() => handleToggleDefault(item.id, item.is_default_included)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                          item.is_default_included ? "bg-emerald-600" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            item.is_default_included ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleToggleInclusionStatus(item.id, item.status)}
                      >
                        <Badge tone={item.status === "published" ? "green" : "gray"}>
                          {item.status === "published" ? "Published" : "Draft"}
                        </Badge>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingInclusion(item)}
                          className="rounded border border-black/10 px-2.5 py-1 text-xs font-semibold text-masaar-black hover:bg-black/5"
                        >
                          Edit
                        </button>
                        <InclusionKebabMenu item={item} onDelete={() => setDeleteInclusionTarget(item)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Callout Box */}
        <div className="rounded-xl border border-black/10 bg-warm-ivory/30 p-5 shadow-2xs space-y-3 lg:col-span-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-base">ℹ</span>
            <h4 className="font-bold text-masaar-black">About Included Services</h4>
          </div>
          <p className="text-masaar-black/70 leading-relaxed">
            These are the core services that come with the package. You can enable or disable each service and choose which ones are included by default when creating or editing a package.
          </p>
          <div className="pt-2 border-t border-black/10 space-y-1 text-masaar-black/70">
            <p className="font-bold text-masaar-black">Tips:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Use clear and consistent service names.</li>
              <li>Add relevant icons for better visuals.</li>
              <li>These will be shown on the package details page.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── SECTION 2: OPTIONAL ADD-ONS ─────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-4">
        <div className="rounded-xl border border-black/10 bg-white p-6 shadow-2xs space-y-4 lg:col-span-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-amber-100 text-amber-800 font-bold">
                📦
              </span>
              <div>
                <h3 className="font-bold text-base text-masaar-black">Optional Add-ons</h3>
                <p className="text-xs text-masaar-black/50">
                  These are optional services that customers can select while enquiring.
                </p>
              </div>
            </div>

            <SecondaryButton type="button" onClick={() => setEditingAddon("new")}>+ Add Add-on</SecondaryButton>
          </div>

          <div className="overflow-x-auto rounded-lg border border-black/10">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-black/10 bg-warm-ivory/50 font-bold uppercase text-masaar-black/60">
                <tr>
                  <th className="px-3 py-2.5 w-8">#</th>
                  <th className="px-4 py-2.5">Add-on</th>
                  <th className="px-3 py-2.5">Icon</th>
                  <th className="px-4 py-2.5">Price Type</th>
                  <th className="px-4 py-2.5">Linked Trip</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {addons.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-warm-ivory/20">
                    <td className="px-3 py-3 font-bold text-masaar-black/40">{idx + 1}</td>
                    <td className="px-4 py-3 font-bold text-masaar-black">{item.name}</td>
                    <td className="px-3 py-3 text-base">{item.icon}</td>
                    <td className="px-4 py-3 text-masaar-black/70 font-medium">{item.price_type_label}</td>
                    <td className="px-4 py-3 text-masaar-black/70">
                      {item.private_trip_id ? (
                        <span className="font-medium text-deep-gold">
                          {privateTrips.find((t) => t.id === item.private_trip_id)?.name ?? "Linked"}
                        </span>
                      ) : (
                        <span className="text-masaar-black/30">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        id={`toggle_addon_status_${item.key_slug}`}
                        onClick={() => handleToggleAddonStatus(item.id, item.status)}
                      >
                        <Badge tone={item.status === "published" ? "green" : "gray"}>
                          {item.status === "published" ? "Published" : "Draft"}
                        </Badge>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingAddon(item)}
                          className="rounded border border-black/10 px-2.5 py-1 text-xs font-semibold text-masaar-black hover:bg-black/5"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Callout Box */}
        <div className="rounded-xl border border-black/10 bg-warm-ivory/30 p-5 shadow-2xs space-y-3 lg:col-span-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-base">ℹ</span>
            <h4 className="font-bold text-masaar-black">About Optional Add-ons</h4>
          </div>
          <p className="text-masaar-black/70 leading-relaxed">
            These services can be selected by customers when they enquire about a package.
          </p>
          <div className="pt-2 border-t border-black/10 space-y-1.5 text-masaar-black/70">
            <p className="font-bold text-masaar-black">Common add-ons include:</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>Umrah Visa</li>
              <li>Makkah Ziyarat</li>
              <li>Madinah Ziyarat</li>
              <li>Flights</li>
              <li>Private Trips</li>
              <li>Extra Nights</li>
            </ul>
          </div>
          <div className="pt-2 border-t border-black/10 space-y-1 text-masaar-black/70">
            <p className="font-bold text-masaar-black">Tips:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>These will appear as optional checkboxes in the enquiry form.</li>
              <li>You can set a fixed price or &quot;from&quot; price for each add-on.</li>
              <li>
                Link an add-on to a real Private Trip and the site shows that trip&apos;s actual name,
                description, image and duration — edit it once in Private Trips, and it updates everywhere.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {editingAddon && (
        <AddonEditorModal
          addon={editingAddon === "new" ? null : editingAddon}
          privateTrips={privateTrips}
          isSaving={isSaving}
          onClose={() => setEditingAddon(null)}
          onSave={async (values) => {
            setIsSaving(true);
            try {
              if (editingAddon === "new") {
                await addAddonItem(
                  "umrah",
                  values.name,
                  slugify(values.name),
                  values.icon,
                  values.priceTypeLabel,
                  values.privateTripId
                );
              } else {
                await updateAddonItem(
                  editingAddon.id,
                  values.name,
                  values.icon,
                  values.priceTypeLabel,
                  values.privateTripId
                );
              }
              window.location.reload();
            } finally {
              setIsSaving(false);
            }
          }}
        />
      )}

      {editingInclusion && (
        <InclusionEditorModal
          inclusion={editingInclusion}
          isSaving={isSaving}
          onClose={() => setEditingInclusion(null)}
          onSave={async (values) => {
            setIsSaving(true);
            try {
              await updateInclusionItem(editingInclusion.id, values.name, values.icon);
              setInclusions((prev) =>
                prev.map((i) => (i.id === editingInclusion.id ? { ...i, name: values.name, icon: values.icon } : i))
              );
              setEditingInclusion(null);
            } finally {
              setIsSaving(false);
            }
          }}
        />
      )}

      {deleteInclusionTarget && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-masaar-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-red-50 text-red-600">
              <svg className="size-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black">Delete this inclusion?</h3>
            <p className="mt-2 text-sm text-masaar-black/60">
              &quot;{deleteInclusionTarget.name}&quot; will be removed from the catalog. This action cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteInclusionTarget(null)}
                disabled={isDeletingInclusion}
                className="flex-1 rounded-lg border border-black/15 bg-white px-4 py-2.5 text-sm font-semibold text-masaar-black hover:bg-warm-ivory"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteInclusionConfirm}
                disabled={isDeletingInclusion}
                className="flex-1 rounded-lg bg-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60"
              >
                {isDeletingInclusion ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InclusionEditorModal({
  inclusion,
  isSaving,
  onClose,
  onSave,
}: {
  inclusion: InclusionRow;
  isSaving: boolean;
  onClose: () => void;
  onSave: (values: { name: string; icon: string }) => void;
}) {
  const [name, setName] = useState(inclusion.name);
  const [icon, setIcon] = useState(inclusion.icon);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-bold text-masaar-black">Edit Inclusion</h3>

        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-masaar-black">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="e.g. Airport Transfers" />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-masaar-black">Icon (emoji)</label>
            <input value={icon} onChange={(e) => setIcon(e.target.value)} className={inputClass} placeholder="✓" />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-black/15 px-4 py-2 text-sm font-semibold text-masaar-black hover:bg-warm-ivory"
          >
            Cancel
          </button>
          <PrimaryButton
            type="button"
            disabled={isSaving || !name.trim()}
            onClick={() => onSave({ name: name.trim(), icon: icon.trim() || "✓" })}
          >
            {isSaving ? "Saving…" : "Save"}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}

function AddonEditorModal({
  addon,
  privateTrips,
  isSaving,
  onClose,
  onSave,
}: {
  addon: AddonRow | null;
  privateTrips: PrivateTripOption[];
  isSaving: boolean;
  onClose: () => void;
  onSave: (values: { name: string; icon: string; priceTypeLabel: string; privateTripId: string | null }) => void;
}) {
  const [name, setName] = useState(addon?.name ?? "");
  const [icon, setIcon] = useState(addon?.icon ?? "📦");
  const [priceTypeLabel, setPriceTypeLabel] = useState(addon?.price_type_label ?? "Fixed / From Price");
  const [privateTripId, setPrivateTripId] = useState(addon?.private_trip_id ?? "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-bold text-masaar-black">{addon ? "Edit Add-on" : "Add New Add-on"}</h3>

        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-masaar-black">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="e.g. Private Makkah Ziyarat" />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-masaar-black">Icon (emoji)</label>
            <input value={icon} onChange={(e) => setIcon(e.target.value)} className={inputClass} placeholder="🕋" />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-masaar-black">Price Type Label</label>
            <input
              value={priceTypeLabel}
              onChange={(e) => setPriceTypeLabel(e.target.value)}
              className={inputClass}
              placeholder="e.g. From AED 300, or Fixed / From Price"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-masaar-black">Link to Private Trip (optional)</label>
            <select value={privateTripId} onChange={(e) => setPrivateTripId(e.target.value)} className={inputClass}>
              <option value="">— No linked trip —</option>
              {privateTrips.map((trip) => (
                <option key={trip.id} value={trip.id}>
                  {trip.name} ({trip.destination})
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-masaar-black/50">
              When set, the public site pulls this trip&apos;s real name, description, image and duration instead
              of the fields above (the fields above stay as a fallback for add-ons with no matching trip, like
              Visa or Flights).
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-black/15 px-4 py-2 text-sm font-semibold text-masaar-black hover:bg-warm-ivory"
          >
            Cancel
          </button>
          <PrimaryButton
            type="button"
            disabled={isSaving || !name.trim()}
            onClick={() =>
              onSave({
                name: name.trim(),
                icon: icon.trim() || "📦",
                priceTypeLabel: priceTypeLabel.trim() || "Fixed / From Price",
                privateTripId: privateTripId || null,
              })
            }
          >
            {isSaving ? "Saving…" : "Save"}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
