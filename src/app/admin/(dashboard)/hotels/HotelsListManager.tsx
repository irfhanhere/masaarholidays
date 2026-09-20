"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge, PrimaryButton, inputClass } from "@/components/admin/ui";
import type { HotelRow } from "@/lib/types/database";
import { deleteHotel, toggleHotelActive } from "./actions";

interface Props {
  hotels: HotelRow[];
}

function KebabMenu({
  hotel,
  onToggleActive,
  onDelete,
}: {
  hotel: HotelRow;
  onToggleActive: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="flex size-7 items-center justify-center rounded-md text-masaar-black/50 hover:bg-black/5"
      >
        &bull;&bull;&bull;
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-10 w-40 rounded-lg border border-black/10 bg-white py-1 text-sm shadow-lg">
          <button type="button" onClick={onToggleActive} className="block w-full px-3 py-2 text-left hover:bg-warm-ivory">
            {hotel.is_active ? "🚫 Unpublish" : "✅ Publish"}
          </button>
          <button type="button" onClick={onDelete} className="block w-full px-3 py-2 text-left text-red-600 hover:bg-red-50">
            🗑 Delete
          </button>
        </div>
      )}
    </div>
  );
}

export function HotelsListManager({ hotels: initialHotels }: Props) {
  const router = useRouter();
  const [hotels, setHotels] = useState(initialHotels);
  const [search, setSearch] = useState("");
  const [selectedCity, setSelectedCity] = useState("All Cities");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [unpublishTarget, setUnpublishTarget] = useState<HotelRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HotelRow | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleToggleConfirm() {
    if (!unpublishTarget) return;
    setIsPending(true);
    try {
      const nextActive = !unpublishTarget.is_active;
      await toggleHotelActive(unpublishTarget.id, nextActive);
      setHotels((prev) => prev.map((h) => (h.id === unpublishTarget.id ? { ...h, is_active: nextActive } : h)));
    } finally {
      setIsPending(false);
      setUnpublishTarget(null);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setIsPending(true);
    try {
      await deleteHotel(deleteTarget.id);
      setHotels((prev) => prev.filter((h) => h.id !== deleteTarget.id));
      router.refresh();
    } finally {
      setIsPending(false);
      setDeleteTarget(null);
    }
  }

  const filteredHotels = hotels.filter((h) => {
    const matchSearch = search === "" || h.name.toLowerCase().includes(search.toLowerCase());
    const matchCity = selectedCity === "All Cities" || h.city.toLowerCase() === selectedCity.toLowerCase();
    const matchCategory =
      selectedCategory === "All Categories" ||
      (h.category && h.category.toLowerCase() === selectedCategory.toLowerCase());
    const matchStatus =
      selectedStatus === "All Status" ||
      (selectedStatus === "Published" && h.is_active) ||
      (selectedStatus === "Draft" && !h.is_active);

    return matchSearch && matchCity && matchCategory && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-masaar-black/50">
            <Link href="/admin" className="hover:underline">Dashboard</Link>
            <span>&rsaquo;</span>
            <span className="font-semibold text-masaar-black">Hotels</span>
          </div>
          <h1 className="text-2xl font-bold text-masaar-black mt-1">Hotels</h1>
          <p className="text-xs text-masaar-black/60">
            Manage your hotel database. Add, edit and organize properties for Umrah and Hajj packages.
          </p>
        </div>

        <Link href="/admin/hotels/new">
          <PrimaryButton type="button">+ Add Hotel</PrimaryButton>
        </Link>
      </div>

      {/* Filter Controls Bar (Matching ADMIN - HOTEL.png) */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-black/10 bg-white p-4 shadow-2xs">
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-3 top-2.5 text-masaar-black/40 text-xs">🔍</span>
          <input
            type="text"
            placeholder="Search hotels..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputClass} pl-8`}
          />
        </div>

        <div className="w-40">
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className={inputClass}
          >
            <option value="All Cities">All Cities</option>
            <option value="Makkah">Makkah</option>
            <option value="Madinah">Madinah</option>
          </select>
        </div>

        <div className="w-44">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={inputClass}
          >
            <option value="All Categories">All Categories</option>
            <option value="Premium">Premium</option>
            <option value="Luxury">Luxury</option>
            <option value="Standard">Standard</option>
          </select>
        </div>

        <div className="w-40">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className={inputClass}
          >
            <option value="All Status">All Status</option>
            <option value="Published">Published</option>
            <option value="Draft">Draft</option>
          </select>
        </div>

        {(search || selectedCity !== "All Cities" || selectedCategory !== "All Categories" || selectedStatus !== "All Status") && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSelectedCity("All Cities");
              setSelectedCategory("All Categories");
              setSelectedStatus("All Status");
            }}
            className="rounded-lg border border-black/10 bg-warm-ivory/50 px-3 py-2 text-xs font-semibold text-masaar-black hover:bg-black/5"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-black/10 bg-white shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-black/10 bg-warm-ivory/50 font-bold uppercase text-masaar-black/60">
            <tr>
              <th className="px-4 py-3">Hotel</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Walking Distance</th>
              <th className="px-4 py-3">Breakfast</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {filteredHotels.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-masaar-black/50">
                  No hotels match your filters.
                </td>
              </tr>
            )}
            {filteredHotels.map((hotel) => {
              const stars = "★".repeat(hotel.star_rating || 5);
              const isPremium = hotel.category === "Premium";
              const isLuxury = hotel.category === "Luxury";

              return (
                <tr key={hotel.id} className="hover:bg-warm-ivory/20">
                  <td className="px-4 py-3 font-medium text-masaar-black">
                    <div className="flex items-center gap-3">
                      <img
                        src={hotel.image_url || "/images/hotels/voco-makkah.jpg"}
                        alt={hotel.name}
                        className="h-10 w-14 rounded object-cover border border-black/10"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                      <div>
                        <p className="font-bold text-masaar-black">{hotel.name}</p>
                        <p className="text-amber-500 text-[10px]">{stars}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-masaar-black/70 font-medium">{hotel.city}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-2.5 py-1 text-[10px] font-bold ${
                        isLuxury
                          ? "bg-purple-100 text-purple-800"
                          : isPremium
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {hotel.category || "Standard"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-masaar-black/80 font-medium">
                    {hotel.walk_time_minutes ? (
                      <span>🏃 {hotel.walk_time_minutes} minutes</span>
                    ) : hotel.shuttle_available ? (
                      <span>🚌 Shuttle</span>
                    ) : (
                      <span>🏃 5-min walk</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-masaar-black/80 font-medium">
                    {hotel.shuttle_note ? (
                      <span>☕ Breakfast Included</span>
                    ) : (
                      <span>☕ Room Only</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={hotel.is_active ? "green" : "gray"}>
                      {hotel.is_active ? "Published" : "Draft"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/hotels/${hotel.id}`}
                        className="rounded border border-black/10 px-3 py-1 text-xs font-semibold text-admin-primary hover:bg-black/5"
                      >
                        Edit
                      </Link>
                      <KebabMenu
                        hotel={hotel}
                        onToggleActive={() => setUnpublishTarget(hotel)}
                        onDelete={() => setDeleteTarget(hotel)}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {unpublishTarget && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-masaar-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-[#FAF5E8] text-[#A87F12]">
              <svg className="size-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
              </svg>
            </div>
            <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black">
              {unpublishTarget.is_active ? "Unpublish this hotel?" : "Publish this hotel?"}
            </h3>
            <p className="mt-2 text-sm text-masaar-black/60">
              {unpublishTarget.is_active
                ? "The hotel will be hidden from the public site but its content will remain saved as a draft."
                : "The hotel will become visible on the public site."}
            </p>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setUnpublishTarget(null)} disabled={isPending} className="flex-1 rounded-lg border border-black/15 bg-white px-4 py-2.5 text-sm font-semibold text-masaar-black hover:bg-warm-ivory">Cancel</button>
              <button type="button" onClick={handleToggleConfirm} disabled={isPending} className="flex-1 rounded-lg bg-[#8C6B1A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#A87F12] disabled:opacity-60">
                {isPending ? "Saving..." : unpublishTarget.is_active ? "Unpublish" : "Publish"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-masaar-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-red-50 text-red-600">
              <svg className="size-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black">Delete this hotel?</h3>
            <p className="mt-2 text-sm text-masaar-black/60">This action cannot be undone. Hotels referenced by a package or Umrah inventory configuration should be unpublished instead.</p>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setDeleteTarget(null)} disabled={isPending} className="flex-1 rounded-lg border border-black/15 bg-white px-4 py-2.5 text-sm font-semibold text-masaar-black hover:bg-warm-ivory">Cancel</button>
              <button type="button" onClick={handleDeleteConfirm} disabled={isPending} className="flex-1 rounded-lg bg-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60">
                {isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
