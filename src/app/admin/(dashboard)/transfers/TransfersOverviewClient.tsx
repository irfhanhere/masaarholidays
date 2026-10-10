"use client";

import { useId, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import type { TransferRow } from "@/lib/types/database";
import {
  deleteTransfer,
  duplicateTransfer,
  toggleTransferActive,
  toggleTransferFeatured,
} from "./actions";

interface TransferWithMeta extends TransferRow {
  activeVehiclesCount?: number;
  totalVehiclesCount?: number;
}

interface Props {
  transfers: TransferWithMeta[];
}

export function TransfersOverviewClient({ transfers }: Props) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const searchInputId = useId();

  // Metrics
  const metrics = useMemo(() => {
    const total = transfers.length;
    const active = transfers.filter((t) => t.is_active).length;
    const inactive = total - active;
    const featured = transfers.filter((t) => (t as any).featured).length;
    return { total, active, inactive, featured, vehicles: 5 };
  }, [transfers]);

  // Filtered rows
  const filtered = useMemo(() => {
    return transfers.filter((t) => {
      const matchesSearch =
        !search ||
        t.route_name.toLowerCase().includes(search.toLowerCase()) ||
        t.slug.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || t.transfer_type === selectedCategory;
      const matchesStatus =
        selectedStatus === "all" ||
        (selectedStatus === "active" && t.is_active) ||
        (selectedStatus === "inactive" && !t.is_active);
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [transfers, search, selectedCategory, selectedStatus]);

  const handleToggleActive = (id: string, currentState: boolean) => {
    startTransition(async () => {
      await toggleTransferActive(id, !currentState);
    });
  };

  const handleToggleFeatured = (id: string, currentState: boolean) => {
    startTransition(async () => {
      await toggleTransferFeatured(id, !currentState);
    });
  };

  const handleDuplicate = (id: string) => {
    if (!confirm("Duplicate this route and its vehicle rates?")) return;
    startTransition(async () => {
      await duplicateTransfer(id);
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    startTransition(async () => {
      await deleteTransfer(id);
      setDeletingId(null);
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Action Buttons Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-masaar-black/50">
            <Link href="/admin" className="hover:underline">Dashboard</Link>
            <span>&rsaquo;</span>
            <span className="font-semibold text-masaar-black">Transfers</span>
          </div>
          <h1 className="text-2xl font-bold text-masaar-black mt-1">Transfers</h1>
          <p className="text-xs text-masaar-black/60">
            Manage the transfer routes displayed on your website. Per-vehicle pricing lives in the Rate Card.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/admin/transfers/vehicles"
            className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 bg-white px-3.5 py-2 text-xs font-semibold text-masaar-black shadow-2xs hover:bg-black/5"
          >
            <svg className="size-3.5 text-deep-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <span>Vehicles &amp; Fleet</span>
          </Link>

          <Link
            href="/admin/transfers/rate-card"
            className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 bg-white px-3.5 py-2 text-xs font-semibold text-masaar-black shadow-2xs hover:bg-black/5"
          >
            <svg className="size-3.5 text-deep-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Rate Card</span>
          </Link>

          <Link
            href="/admin/transfers/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-deep-gold px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-deep-gold/90"
          >
            <span>+ Add Transfer</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <div className="rounded-xl border border-black/10 bg-white p-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-warm-ivory text-base">
              🚗
            </span>
            <div>
              <div className="text-xl font-bold text-masaar-black">{metrics.total}</div>
              <div className="text-[11px] text-masaar-black/50">Total Routes</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-black/10 bg-white p-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 font-bold text-sm">
              ●
            </span>
            <div>
              <div className="text-xl font-bold text-masaar-black">{metrics.active}</div>
              <div className="text-[11px] text-masaar-black/50">Active Routes</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-black/10 bg-white p-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 font-bold text-sm">
              ●
            </span>
            <div>
              <div className="text-xl font-bold text-masaar-black">{metrics.inactive}</div>
              <div className="text-[11px] text-masaar-black/50">Inactive Routes</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-black/10 bg-white p-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700 font-bold text-sm">
              🚙
            </span>
            <div>
              <div className="text-xl font-bold text-masaar-black">{metrics.vehicles}</div>
              <div className="text-[11px] text-masaar-black/50">Vehicle Types</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-black/10 bg-white p-4 shadow-2xs col-span-2 sm:col-span-1">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-warm-ivory text-deep-gold font-bold text-sm">
              ★
            </span>
            <div>
              <div className="text-xl font-bold text-masaar-black">{metrics.featured}</div>
              <div className="text-[11px] text-masaar-black/50">Featured on Site</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-black/10 bg-white p-3.5 shadow-2xs">
        <div className="relative min-w-[220px] flex-1">
          <svg
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-masaar-black/40"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <label htmlFor={searchInputId} className="sr-only">Search routes</label>
          <input
            id={searchInputId}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search routes..."
            className="w-full rounded-lg border border-black/10 bg-warm-ivory/30 py-1.5 pl-9 pr-3 text-xs text-masaar-black placeholder:text-masaar-black/40 focus:border-deep-gold focus:outline-none"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          aria-label="Filter by category"
          className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs text-masaar-black focus:border-deep-gold focus:outline-none"
        >
          <option value="all">All Categories</option>
          <option value="airport">Airport Transfers</option>
          <option value="intercity">Intercity Transfers</option>
          <option value="ziyarat">Ziyarat</option>
          <option value="train">Train Station Transfers</option>
          <option value="day-trip">Day Trips</option>
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          aria-label="Filter by status"
          className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs text-masaar-black focus:border-deep-gold focus:outline-none"
        >
          <option value="all">All Status</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>

        {(search || selectedCategory !== "all" || selectedStatus !== "all") && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSelectedCategory("all");
              setSelectedStatus("all");
            }}
            className="text-xs font-semibold text-deep-gold hover:underline"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto rounded-xl border border-black/10 bg-white shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-black/10 bg-warm-ivory/50 uppercase tracking-wider text-[11px] text-masaar-black/60 font-semibold">
            <tr>
              <th className="px-4 py-3.5">Route</th>
              <th className="px-4 py-3.5">Category</th>
              <th className="px-4 py-3.5">Vehicles</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5 text-center">Featured</th>
              <th className="px-4 py-3.5 text-center">Order</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-masaar-black/50">
                  No routes match your current search or filters.
                </td>
              </tr>
            ) : (
              filtered.map((t) => {
                const isFeatured = (t as any).featured ?? false;
                const vehiclesActive = t.activeVehiclesCount ?? 5;
                const vehiclesTotal = t.totalVehiclesCount ?? 5;

                return (
                  <tr key={t.id} className="transition-colors hover:bg-warm-ivory/20">
                    {/* Route thumbnail + title */}
                    <td className="px-4 py-3 font-medium text-masaar-black">
                      <div className="flex items-center gap-3">
                        <div className="relative size-10 shrink-0 overflow-hidden rounded-md border border-black/10 bg-warm-ivory">
                          {t.image_url ? (
                            <Image
                              src={t.image_url}
                              alt={t.route_name}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          ) : (
                            <span className="flex size-full items-center justify-center text-xs">
                              🚗
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-masaar-black">{t.route_name}</div>
                          <div className="text-[10px] text-masaar-black/40 font-mono">
                            /{t.slug}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category badge */}
                    <td className="px-4 py-3">
                      <span className="inline-block rounded-full bg-warm-ivory px-2.5 py-0.5 text-[10px] font-semibold text-masaar-black/80 capitalize">
                        {t.transfer_type.replace("-", " ")}
                      </span>
                    </td>

                    {/* Vehicles count */}
                    <td className="px-4 py-3 text-masaar-black/70">
                      <span className="font-semibold text-masaar-black">{vehiclesActive}</span>/{vehiclesTotal} active
                    </td>

                    {/* Status badge & toggle */}
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleToggleActive(t.id, t.is_active)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-opacity ${
                          t.is_active
                            ? "bg-emerald-50 text-emerald-700 hover:opacity-80"
                            : "bg-gray-100 text-gray-500 hover:opacity-80"
                        }`}
                      >
                        <span className="text-[9px]">●</span>
                        <span>{t.is_active ? "Active" : "Inactive"}</span>
                      </button>
                    </td>

                    {/* Featured toggle */}
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleToggleFeatured(t.id, isFeatured)}
                        title={isFeatured ? "Remove from Featured" : "Mark as Featured"}
                        className={`text-base transition-colors ${
                          isFeatured ? "text-deep-gold" : "text-black/20 hover:text-deep-gold/60"
                        }`}
                      >
                        ★
                      </button>
                    </td>

                    {/* Display order */}
                    <td className="px-4 py-3 text-center font-mono text-masaar-black/60">
                      {t.display_order}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Public Preview */}
                        <Link
                          href={`/transfers/${t.slug}`}
                          target="_blank"
                          title="Preview on website"
                          className="flex size-7 items-center justify-center rounded-md border border-black/10 bg-white text-masaar-black/60 hover:border-black/25 hover:text-masaar-black"
                        >
                          <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Link>

                        {/* Edit */}
                        <Link
                          href={`/admin/transfers/${t.id}`}
                          title="Edit route"
                          className="flex size-7 items-center justify-center rounded-md border border-black/10 bg-white text-masaar-black/60 hover:border-black/25 hover:text-masaar-black"
                        >
                          <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </Link>

                        {/* Duplicate */}
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleDuplicate(t.id)}
                          title="Duplicate route"
                          className="flex size-7 items-center justify-center rounded-md border border-black/10 bg-white text-masaar-black/60 hover:border-black/25 hover:text-masaar-black"
                        >
                          <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          disabled={isPending || deletingId === t.id}
                          onClick={() => handleDelete(t.id, t.route_name)}
                          title="Delete route"
                          className="flex size-7 items-center justify-center rounded-md border border-black/10 bg-white text-red-500 hover:bg-red-50 hover:border-red-200"
                        >
                          <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
