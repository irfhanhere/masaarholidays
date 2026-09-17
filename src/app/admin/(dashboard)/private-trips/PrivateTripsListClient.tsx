"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge, PrimaryButton } from "@/components/admin/ui";
import type { PrivateTripRow } from "@/lib/types/database";
import { deletePrivateTrip, publishPrivateTrip, unpublishPrivateTrip } from "./actions";

function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export function PrivateTripsListClient({ trips }: { trips: PrivateTripRow[] }) {
  const [search, setSearch] = useState("");
  const [destinationFilter, setDestinationFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Action Menu open state
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Dialog states
  const [unpublishTarget, setUnpublishTarget] = useState<PrivateTripRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PrivateTripRow | null>(null);

  const [isPending, startTransition] = useTransition();

  const filteredTrips = useMemo(() => {
    return trips.filter((trip) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = trip.name.toLowerCase().includes(q);
        const matchDesc = trip.short_description?.toLowerCase().includes(q);
        const matchDest = trip.destination.toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchDest) return false;
      }

      if (destinationFilter !== "all" && trip.destination !== destinationFilter) {
        return false;
      }

      if (typeFilter !== "all" && trip.trip_type !== typeFilter) {
        return false;
      }

      if (statusFilter !== "all" && trip.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [trips, search, destinationFilter, typeFilter, statusFilter]);

  const totalCount = trips.length;
  const publishedCount = trips.filter((t) => t.status === "published").length;
  const draftsCount = trips.filter((t) => t.status === "draft").length;

  const tripTypes = useMemo(() => {
    const set = new Set<string>();
    trips.forEach((t) => {
      if (t.trip_type) set.add(t.trip_type);
    });
    return Array.from(set);
  }, [trips]);

  function toggleSelectAll() {
    if (selectedIds.size === filteredTrips.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTrips.map((t) => t.id)));
    }
  }

  function toggleSelect(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  function handleUnpublishConfirm() {
    if (!unpublishTarget) return;
    startTransition(async () => {
      try {
        await unpublishPrivateTrip(unpublishTarget.id);
        setUnpublishTarget(null);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to unpublish trip");
      }
    });
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    startTransition(async () => {
      try {
        await deletePrivateTrip(deleteTarget.id);
        setDeleteTarget(null);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to delete trip");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* 3 Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* All Trips */}
        <div className="flex items-center gap-4 rounded-xl border border-black/10 bg-white p-5 shadow-xs">
          <div className="flex size-12 items-center justify-center rounded-full bg-[#FAF5E8] text-[#C9A227]">
            <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold tracking-wider text-masaar-black/50 uppercase">ALL TRIPS</p>
            <p className="font-[family-name:var(--font-display)] text-3xl font-bold text-masaar-black">{totalCount}</p>
          </div>
        </div>

        {/* Published */}
        <div className="flex items-center gap-4 rounded-xl border border-black/10 bg-white p-5 shadow-xs">
          <div className="flex size-12 items-center justify-center rounded-full bg-green-50 text-green-600">
            <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold tracking-wider text-masaar-black/50 uppercase">PUBLISHED</p>
            <p className="font-[family-name:var(--font-display)] text-3xl font-bold text-masaar-black">{publishedCount}</p>
          </div>
        </div>

        {/* Drafts */}
        <div className="flex items-center gap-4 rounded-xl border border-black/10 bg-white p-5 shadow-xs">
          <div className="flex size-12 items-center justify-center rounded-full bg-gray-100 text-gray-500">
            <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold tracking-wider text-masaar-black/50 uppercase">DRAFTS</p>
            <p className="font-[family-name:var(--font-display)] text-3xl font-bold text-masaar-black">{draftsCount}</p>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-black/10 bg-white p-4 shadow-xs">
        {/* Search */}
        <div className="relative min-w-[240px] flex-1">
          <svg
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-masaar-black/40"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search trips..."
            className="w-full rounded-md border border-black/15 bg-white py-2 pr-3 pl-9 text-sm text-masaar-black placeholder:text-masaar-black/40 focus:border-deep-gold focus:outline-none"
          />
        </div>

        {/* Destination Filter */}
        <select
          value={destinationFilter}
          onChange={(e) => setDestinationFilter(e.target.value)}
          className="rounded-md border border-black/15 bg-white px-3 py-2 text-sm text-masaar-black focus:border-deep-gold focus:outline-none"
        >
          <option value="all">Destination: All</option>
          <option value="Makkah">Makkah</option>
          <option value="Madinah">Madinah</option>
          <option value="Other">Other</option>
        </select>

        {/* Trip Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-md border border-black/15 bg-white px-3 py-2 text-sm text-masaar-black focus:border-deep-gold focus:outline-none"
        >
          <option value="all">Trip Type: All</option>
          {tripTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-black/15 bg-white px-3 py-2 text-sm text-masaar-black focus:border-deep-gold focus:outline-none"
        >
          <option value="all">Status: All</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {/* Main Table or Empty State */}
      {filteredTrips.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-black/10 bg-white px-6 py-16 text-center shadow-xs">
          <div className="mb-4 flex size-20 items-center justify-center rounded-full bg-warm-ivory text-deep-gold">
            <svg className="size-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 21l-8-5V5l8 5 8-5v11l-8 5z" />
            </svg>
          </div>
          <h3 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-masaar-black">
            {trips.length === 0 ? "No private trips yet." : "No matching trips found."}
          </h3>
          <p className="mt-2 max-w-md text-sm text-masaar-black/60">
            {trips.length === 0
              ? "Add sightseeing experiences that travellers can request as part of their journey."
              : "Try adjusting your search query or filters to find what you're looking for."}
          </p>
          <Link href="/admin/private-trips/new" className="mt-6">
            <PrimaryButton className="bg-[#A87F12] hover:bg-[#C9A227]">
              + Add Your First Private Trip
            </PrimaryButton>
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-black/10 bg-warm-ivory/50 text-xs font-semibold text-masaar-black/60 uppercase">
                <tr>
                  <th className="w-10 px-4 py-3.5">
                    <input
                      type="checkbox"
                      checked={selectedIds.size > 0 && selectedIds.size === filteredTrips.length}
                      onChange={toggleSelectAll}
                      className="rounded border-black/20 text-deep-gold focus:ring-deep-gold"
                    />
                  </th>
                  <th className="px-4 py-3.5">Trip</th>
                  <th className="px-4 py-3.5">Destination</th>
                  <th className="px-4 py-3.5">Duration</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Updated</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {filteredTrips.map((trip) => {
                  const isSelected = selectedIds.has(trip.id);
                  const isMenuOpen = openMenuId === trip.id;
                  const isPublished = trip.status === "published";

                  return (
                    <tr key={trip.id} className="hover:bg-warm-ivory/30 transition-colors">
                      <td className="px-4 py-3.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(trip.id)}
                          className="rounded border-black/20 text-deep-gold focus:ring-deep-gold"
                        />
                      </td>

                      {/* Trip Card / Thumb + Details */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-warm-ivory">
                            {trip.featured_image_url ? (
                              <Image
                                src={trip.featured_image_url}
                                alt={trip.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex size-full items-center justify-center text-xs text-masaar-black/30">
                                No img
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-masaar-black">{trip.name}</p>
                            <p className="line-clamp-1 max-w-xs text-xs text-masaar-black/60">
                              {trip.short_description || "—"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-masaar-black/80 font-medium">{trip.destination}</td>
                      <td className="px-4 py-3.5 text-masaar-black/70">{trip.duration}</td>

                      <td className="px-4 py-3.5">
                        <Badge tone={isPublished ? "green" : "gray"}>
                          {isPublished ? "Published" : "Draft"}
                        </Badge>
                      </td>

                      <td className="px-4 py-3.5 text-xs text-masaar-black/60">
                        {formatDate(trip.updated_at || trip.created_at)}
                      </td>

                      {/* Actions */}
                      <td className="relative px-4 py-3.5 text-right">
                        <div className="inline-flex items-center gap-2">
                          <Link href={`/admin/private-trips/${trip.id}`}>
                            <button
                              type="button"
                              className="rounded-md border border-black/15 bg-white px-3 py-1.5 text-xs font-semibold text-masaar-black transition-colors hover:bg-warm-ivory"
                            >
                              Edit
                            </button>
                          </Link>

                          {/* 3 dots dropdown */}
                          <div className="relative inline-block text-left">
                            <button
                              type="button"
                              onClick={() => setOpenMenuId(isMenuOpen ? null : trip.id)}
                              className="flex size-8 items-center justify-center rounded-md border border-black/15 bg-white text-masaar-black/70 transition-colors hover:bg-warm-ivory"
                              aria-label="More actions"
                            >
                              <svg className="size-4" fill="currentColor" viewBox="0 0 24 24">
                                <circle cx="5" cy="12" r="2" />
                                <circle cx="12" cy="12" r="2" />
                                <circle cx="19" cy="12" r="2" />
                              </svg>
                            </button>

                            {isMenuOpen && (
                              <>
                                <div
                                  className="fixed inset-0 z-20"
                                  onClick={() => setOpenMenuId(null)}
                                />
                                <div className="absolute right-0 z-30 mt-1 w-40 rounded-lg border border-black/10 bg-white py-1 shadow-lg">
                                  {/* Preview */}
                                  <Link
                                    href={`/private-trips/${trip.slug}`}
                                    target="_blank"
                                    onClick={() => setOpenMenuId(null)}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-masaar-black hover:bg-warm-ivory"
                                  >
                                    <svg className="size-4 text-masaar-black/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    Preview
                                  </Link>

                                  {/* Unpublish or Publish */}
                                  {isPublished ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        setUnpublishTarget(trip);
                                      }}
                                      className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-masaar-black hover:bg-warm-ivory"
                                    >
                                      <svg className="size-4 text-masaar-black/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      Unpublish
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        startTransition(async () => {
                                          await publishPrivateTrip(trip.id);
                                        });
                                      }}
                                      className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-green-700 hover:bg-green-50"
                                    >
                                      <svg className="size-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                      </svg>
                                      Publish
                                    </button>
                                  )}

                                  {/* Delete (only allowed if draft/unpublished) */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      if (isPublished) {
                                        alert("Published trips cannot be deleted directly. Please unpublish first.");
                                        return;
                                      }
                                      setDeleteTarget(trip);
                                    }}
                                    className={`flex w-full items-center gap-2 px-3 py-2 text-xs font-medium ${
                                      isPublished
                                        ? "text-masaar-black/30 cursor-not-allowed"
                                        : "text-red-600 hover:bg-red-50"
                                    }`}
                                  >
                                    <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Delete
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-black/10 bg-warm-ivory/30 px-4 py-3 text-xs text-masaar-black/60">
            <p>
              Showing 1–{filteredTrips.length} of {trips.length} trips
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled
                className="size-7 rounded-md border border-black/15 bg-white text-masaar-black/40 disabled:opacity-50"
              >
                ‹
              </button>
              <button
                type="button"
                className="size-7 rounded-md bg-[#A87F12] font-semibold text-white"
              >
                1
              </button>
              <button
                type="button"
                disabled
                className="size-7 rounded-md border border-black/15 bg-white text-masaar-black/40 disabled:opacity-50"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unpublish Modal */}
      {unpublishTarget && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-masaar-black/60 p-4"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-[#FAF5E8] text-[#A87F12]">
              <svg className="size-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
              </svg>
            </div>

            <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black">
              Unpublish this private trip?
            </h3>
            <p className="mt-2 text-sm text-masaar-black/60">
              It will no longer appear on the website or in the enquiry add-on list, but its information will remain saved.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setUnpublishTarget(null)}
                disabled={isPending}
                className="flex-1 rounded-lg border border-black/15 bg-white px-4 py-2.5 text-sm font-semibold text-masaar-black hover:bg-warm-ivory"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUnpublishConfirm}
                disabled={isPending}
                className="flex-1 rounded-lg bg-[#8C6B1A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#A87F12] disabled:opacity-60"
              >
                {isPending ? "Unpublishing..." : "Unpublish"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-masaar-black/60 p-4"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-red-50 text-red-600">
              <svg className="size-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>

            <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black">
              Delete this private trip?
            </h3>
            <p className="mt-2 text-sm text-masaar-black/60">
              This action cannot be undone.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isPending}
                className="flex-1 rounded-lg border border-black/15 bg-white px-4 py-2.5 text-sm font-semibold text-masaar-black hover:bg-warm-ivory"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isPending}
                className="flex-1 rounded-lg bg-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60"
              >
                {isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
