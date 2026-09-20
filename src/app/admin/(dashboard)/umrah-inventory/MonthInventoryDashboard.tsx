"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge, EmptyRow, PrimaryButton, SecondaryButton } from "@/components/admin/ui";
import type { PublishStatus, UmrahDepartureMonthRow } from "@/lib/types/database";
import { deleteInventoryConfiguration, toggleInventoryConfigurationStatus } from "./actions";

export interface InventoryConfigJoined {
  id: string;
  journey_type: "makkah_only" | "makkah_madinah";
  duration_nights: number;
  duration_days: number;
  duration_label: string;
  status: PublishStatus;
  created_at: string;
  package: { id: string; title: string; tier: "essential" | "signature" | "exclusive" } | null;
  month: { id: string; display_label: string; slug: string } | null;
  makkah_hotel: { id: string; name: string } | null;
  makkah_allow_similar: boolean;
  madinah_hotel: { id: string; name: string } | null;
  madinah_allow_similar: boolean;
  prices: { occupancy_type: string; price_aed: number }[];
}

interface Props {
  months: UmrahDepartureMonthRow[];
  configs: InventoryConfigJoined[];
}

const TIER_LABEL = { essential: "Essential", signature: "Signature", exclusive: "Exclusive" } as const;

export function MonthInventoryDashboard({ months, configs }: Props) {
  const [selectedMonthId, setSelectedMonthId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [journeyFilter, setJourneyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Calculate metrics per month
  const monthStats = months.map((month) => {
    const monthConfigs = configs.filter((c) => c.month?.id === month.id);
    const publishedCount = monthConfigs.filter((c) => c.status === "published").length;
    const draftCount = monthConfigs.filter((c) => c.status === "draft").length;
    return {
      month,
      total: monthConfigs.length,
      published: publishedCount,
      draft: draftCount,
    };
  });

  const totalAllConfigs = configs.length;
  const publishedAll = configs.filter((c) => c.status === "published").length;
  const draftAll = configs.filter((c) => c.status === "draft").length;

  // Filter configurations
  const filteredConfigs = configs.filter((c) => {
    if (selectedMonthId && c.month?.id !== selectedMonthId) return false;
    if (tierFilter && c.package?.tier !== tierFilter) return false;
    if (journeyFilter && c.journey_type !== journeyFilter) return false;
    if (statusFilter && c.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const pkgMatch = c.package?.title.toLowerCase().includes(q);
      const makkahMatch = c.makkah_hotel?.name.toLowerCase().includes(q);
      const madinahMatch = c.madinah_hotel?.name.toLowerCase().includes(q);
      const monthMatch = c.month?.display_label.toLowerCase().includes(q);
      if (!pkgMatch && !makkahMatch && !madinahMatch && !monthMatch) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* ── 1. Inventory Departure Months Hierarchy Cards ────────────────── */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-masaar-black/70">
            Departure Months Hierarchy
          </h3>
          <span className="text-xs text-masaar-black/50">
            Click a month to filter configurations below
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {/* All Months Card */}
          <div
            onClick={() => setSelectedMonthId(null)}
            className={`cursor-pointer rounded-lg border p-3.5 transition-all ${
              selectedMonthId === null
                ? "border-deep-gold bg-light-gold/10 ring-2 ring-deep-gold/30 shadow-xs"
                : "border-black/10 bg-white hover:border-black/20 hover:bg-warm-ivory/30"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-masaar-black">All Months</span>
              <span className="rounded bg-black/5 px-1.5 py-0.5 text-[10px] font-semibold text-masaar-black/70">
                All
              </span>
            </div>
            <div className="mt-2 text-xl font-bold text-masaar-black">{totalAllConfigs}</div>
            <div className="mt-1 flex items-center gap-2 text-[11px] text-masaar-black/60">
              <span className="text-emerald-700 font-medium">{publishedAll} Pub</span>
              <span>&middot;</span>
              <span>{draftAll} Draft</span>
            </div>
          </div>

          {/* Month Cards */}
          {monthStats.map(({ month, total, published, draft }) => {
            const isSelected = selectedMonthId === month.id;
            return (
              <div
                key={month.id}
                onClick={() => setSelectedMonthId(month.id)}
                className={`cursor-pointer rounded-lg border p-3.5 transition-all ${
                  isSelected
                    ? "border-deep-gold bg-light-gold/10 ring-2 ring-deep-gold/30 shadow-xs"
                    : "border-black/10 bg-white hover:border-black/20 hover:bg-warm-ivory/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate text-xs font-bold text-masaar-black">{month.display_label}</span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                      month.is_active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {month.is_active ? "Active" : "Draft"}
                  </span>
                </div>
                <div className="mt-2 text-xl font-bold text-masaar-black">{total}</div>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-masaar-black/60">
                  <span className="text-emerald-700 font-medium">{published} Pub</span>
                  <span>&middot;</span>
                  <span>{draft} Draft</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 2. Filter & Controls Bar ────────────────────────────────────────── */}
      <div className="rounded-lg border border-black/10 bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by package title, hotel, or month..."
              className="min-w-[220px] flex-1 rounded-md border border-black/15 px-3 py-2 text-sm focus:border-deep-gold focus:outline-none"
            />

            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="rounded-md border border-black/15 bg-white px-3 py-2 text-sm text-masaar-black"
            >
              <option value="">All Package Tiers</option>
              <option value="essential">Essential</option>
              <option value="signature">Signature</option>
              <option value="exclusive">Exclusive</option>
            </select>

            <select
              value={journeyFilter}
              onChange={(e) => setJourneyFilter(e.target.value)}
              className="rounded-md border border-black/15 bg-white px-3 py-2 text-sm text-masaar-black"
            >
              <option value="">All Journey Types</option>
              <option value="makkah_only">Makkah Only</option>
              <option value="makkah_madinah">Makkah + Madinah</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-black/15 bg-white px-3 py-2 text-sm text-masaar-black"
            >
              <option value="">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>

            {(search || tierFilter || journeyFilter || statusFilter || selectedMonthId !== null) && (
              <SecondaryButton
                type="button"
                onClick={() => {
                  setSearch("");
                  setTierFilter("");
                  setJourneyFilter("");
                  setStatusFilter("");
                  setSelectedMonthId(null);
                }}
              >
                Reset Filters
              </SecondaryButton>
            )}
          </div>

          <Link href="/admin/umrah-inventory/new">
            <PrimaryButton>+ Add Configuration</PrimaryButton>
          </Link>
        </div>
      </div>

      {/* ── 3. Configurations Table ────────────────────────────────────────── */}
      <div className="overflow-x-auto rounded-lg border border-black/10 bg-white shadow-xs">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/10 bg-admin-surface text-xs uppercase text-masaar-black/50">
            <tr>
              <th className="px-4 py-3">Package Tier</th>
              <th className="px-4 py-3">Journey</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Month</th>
              <th className="px-4 py-3">Hotels (Makkah / Madinah)</th>
              <th className="px-4 py-3 text-center">Double</th>
              <th className="px-4 py-3 text-center">Triple</th>
              <th className="px-4 py-3 text-center">Quad</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {filteredConfigs.length === 0 && (
              <EmptyRow colSpan={10}>
                No inventory configurations found for the selected filters.
              </EmptyRow>
            )}
            {filteredConfigs.map((config) => {
              const doublePrice = config.prices.find((p) => p.occupancy_type.toLowerCase() === "double")?.price_aed;
              const triplePrice = config.prices.find((p) => p.occupancy_type.toLowerCase() === "triple")?.price_aed;
              const quadPrice = config.prices.find((p) => p.occupancy_type.toLowerCase() === "quad")?.price_aed;

              return (
                <tr key={config.id} className="hover:bg-warm-ivory/30">
                  {/* Tier */}
                  <td className="px-4 py-3 font-semibold text-masaar-black">
                    <span className="inline-block rounded bg-black/5 px-2 py-0.5 text-xs font-bold text-masaar-black">
                      {config.package ? TIER_LABEL[config.package.tier] : "—"}
                    </span>
                    <div className="text-xs font-normal text-masaar-black/60">{config.package?.title}</div>
                  </td>

                  {/* Journey */}
                  <td className="px-4 py-3 text-xs font-medium">
                    <span
                      className={`inline-block rounded px-2 py-0.5 font-semibold ${
                        config.journey_type === "makkah_madinah"
                          ? "bg-deep-gold/15 text-deep-gold"
                          : "bg-gray-100 text-masaar-black/70"
                      }`}
                    >
                      {config.journey_type === "makkah_only" ? "Makkah Only" : "Makkah + Madinah"}
                    </span>
                  </td>

                  {/* Duration */}
                  <td className="px-4 py-3 text-xs font-medium text-masaar-black">
                    {config.duration_label || `${config.duration_nights}N / ${config.duration_days}D`}
                  </td>

                  {/* Month */}
                  <td className="px-4 py-3 text-xs text-masaar-black/80 font-medium">
                    {config.month?.display_label ?? "All Months"}
                  </td>

                  {/* Hotels */}
                  <td className="px-4 py-3 text-xs text-masaar-black/80">
                    <p className="font-semibold text-masaar-black">
                      🕌 Makkah: {config.makkah_hotel?.name ?? "TBD"}
                      {config.makkah_allow_similar && <span className="ml-1 text-[10px] font-normal text-masaar-black/50">(or similar)</span>}
                    </p>
                    {config.journey_type === "makkah_madinah" && (
                      <p className="mt-0.5 text-masaar-black/70">
                        🕌 Madinah: {config.madinah_hotel?.name ?? "TBD"}
                        {config.madinah_allow_similar && <span className="ml-1 text-[10px] font-normal text-masaar-black/50">(or similar)</span>}
                      </p>
                    )}
                  </td>

                  {/* Prices */}
                  <td className="px-4 py-3 text-center text-xs font-medium text-masaar-black">
                    {doublePrice != null ? `AED ${doublePrice.toLocaleString()}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-center text-xs font-medium text-masaar-black">
                    {triplePrice != null ? `AED ${triplePrice.toLocaleString()}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-center text-xs font-medium text-masaar-black">
                    {quadPrice != null ? `AED ${quadPrice.toLocaleString()}` : "—"}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <Badge tone={config.status === "published" ? "green" : "gray"}>
                      {config.status === "published" ? "Published" : "Draft"}
                    </Badge>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/umrah-inventory/${config.id}`}
                        className="text-xs font-semibold text-admin-primary underline hover:text-admin-primary-dark"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() =>
                          toggleInventoryConfigurationStatus(
                            config.id,
                            config.status === "published" ? "draft" : "published"
                          )
                        }
                        className="text-xs text-masaar-black/60 underline hover:text-masaar-black"
                      >
                        {config.status === "published" ? "Unpublish" : "Publish"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("Delete this inventory configuration?")) {
                            deleteInventoryConfiguration(config.id);
                          }
                        }}
                        className="text-xs text-red-600 underline hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
