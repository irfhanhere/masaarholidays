"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { HotelRow } from "@/lib/types/database";
import { deleteHotel, toggleHotelActive } from "./actions";
import { SupplierRatesModal } from "./SupplierRatesModal";

interface Props {
  hotels: HotelRow[];
  roomCounts?: Record<string, number>;
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
        onBlur={() => setTimeout(() => setOpen(false), 180)}
        className="flex size-7 items-center justify-center rounded-md text-masaar-black/50 hover:bg-black/5 hover:text-masaar-black transition"
        aria-label="More options"
      >
        <span className="text-base font-bold leading-none tracking-widest">&middot;&middot;&middot;</span>
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-20 w-44 rounded-xl border border-black/10 bg-white py-1.5 text-xs shadow-xl">
          <Link
            href={`/hotels/${hotel.slug}`}
            target="_blank"
            className="flex items-center gap-2 px-3.5 py-2 text-masaar-black/80 hover:bg-warm-ivory"
          >
            <span>👁</span>
            <span>View Public Page ↗</span>
          </Link>
          <Link
            href={`/admin/hotels/${hotel.id}`}
            className="flex items-center gap-2 px-3.5 py-2 text-masaar-black/80 hover:bg-warm-ivory"
          >
            <span>✏️</span>
            <span>Edit Full Details</span>
          </Link>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              onToggleActive();
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-masaar-black/80 hover:bg-warm-ivory"
          >
            <span>{hotel.is_active ? "🚫" : "✅"}</span>
            <span>{hotel.is_active ? "Unpublish Hotel" : "Publish Hotel"}</span>
          </button>
          <div className="my-1 border-t border-black/5" />
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              onDelete();
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 px-3.5 py-2 text-left font-semibold text-red-600 hover:bg-red-50"
          >
            <span>🗑</span>
            <span>Delete Hotel</span>
          </button>
        </div>
      )}
    </div>
  );
}

export function HotelsListManager({ hotels: initialHotels, roomCounts = {} }: Props) {
  const router = useRouter();
  const [hotels, setHotels] = useState(initialHotels);
  const [search, setSearch] = useState("");
  const [selectedCity, setSelectedCity] = useState("All Cities");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedStars, setSelectedStars] = useState("All Stars");
  const [selectedWalkingTime, setSelectedWalkingTime] = useState("All Walking Times");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [onlyMissingData, setOnlyMissingData] = useState(false);
  const [onlyShuttle, setOnlyShuttle] = useState(false);

  const [selectedHotelIds, setSelectedHotelIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [isRatesModalOpen, setIsRatesModalOpen] = useState(false);

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

  // Handle Export CSV
  function handleExportCsv() {
    const headers = [
      "ID",
      "Name",
      "City",
      "Category",
      "Star Rating",
      "Distance (m)",
      "Walk Time (min)",
      "Route Type",
      "Terrain Note",
      "Price From (AED)",
      "Status",
      "Confidence",
      "Google Maps URL",
    ];

    const rows = filteredHotels.map((h) => [
      `"${h.id}"`,
      `"${(h.name || "").replace(/"/g, '""')}"`,
      `"${h.city}"`,
      `"${h.category || ""}"`,
      h.star_rating ?? "",
      h.distance_from_haram_meters ?? "",
      h.walk_time_minutes ?? "",
      `"${(h.route_type || "").replace(/"/g, '""')}"`,
      `"${(h.terrain_note || "").replace(/"/g, '""')}"`,
      h.price_from_aed ?? "",
      h.is_active ? "Published" : "Draft",
      h.data_confidence || "estimated",
      `"${(h.google_maps_url || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `masaar-hotels-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Filtered list
  const filteredHotels = hotels.filter((h) => {
    const matchSearch =
      search === "" ||
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      (h.zone && h.zone.toLowerCase().includes(search.toLowerCase())) ||
      (h.category && h.category.toLowerCase().includes(search.toLowerCase())) ||
      (h.official_name && h.official_name.toLowerCase().includes(search.toLowerCase()));

    const matchCity = selectedCity === "All Cities" || h.city.toLowerCase() === selectedCity.toLowerCase();

    const matchCategory =
      selectedCategory === "All Categories" ||
      (h.category && h.category.toLowerCase().includes(selectedCategory.toLowerCase()));

    const matchStars =
      selectedStars === "All Stars" ||
      (selectedStars === "5" && h.star_rating === 5) ||
      (selectedStars === "4" && h.star_rating === 4) ||
      (selectedStars === "3" && h.star_rating === 3);

    const walkMin = h.walk_time_minutes ?? (h.distance_from_haram_meters ? Math.ceil(h.distance_from_haram_meters / 80) : null);
    const matchWalkingTime =
      selectedWalkingTime === "All Walking Times" ||
      (selectedWalkingTime === "under5" && walkMin != null && walkMin <= 5) ||
      (selectedWalkingTime === "5to10" && walkMin != null && walkMin > 5 && walkMin <= 10) ||
      (selectedWalkingTime === "over10" && walkMin != null && walkMin > 10);

    const matchStatus =
      selectedStatus === "All Status" ||
      (selectedStatus === "Published" && h.is_active) ||
      (selectedStatus === "Draft" && !h.is_active);

    const hasMissingData =
      !h.google_maps_url ||
      (!h.distance_from_haram_meters && !h.walk_time_minutes && !h.shuttle_available) ||
      !h.price_from_aed;

    const matchMissing = !onlyMissingData || hasMissingData;
    const matchShuttle = !onlyShuttle || Boolean(h.shuttle_available);

    return matchSearch && matchCity && matchCategory && matchStars && matchWalkingTime && matchStatus && matchMissing && matchShuttle;
  });

  // Bulk actions
  const isAllSelected = filteredHotels.length > 0 && selectedHotelIds.size === filteredHotels.length;
  function toggleSelectAll() {
    if (isAllSelected) {
      setSelectedHotelIds(new Set());
    } else {
      setSelectedHotelIds(new Set(filteredHotels.map((h) => h.id)));
    }
  }

  function toggleSelectHotel(id: string) {
    setSelectedHotelIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredHotels.length / pageSize));
  const start = (currentPage - 1) * pageSize;
  const paginatedHotels = filteredHotels.slice(start, start + pageSize);

  // Stats for A01 KPI Strip
  const stats = useMemo(() => {
    const total = hotels.length;
    const published = hotels.filter((h) => h.is_active).length;
    const drafts = total - published;
    const makkah = hotels.filter((h) => h.city === "Makkah").length;
    const madinah = hotels.filter((h) => h.city === "Madinah").length;
    const verified = hotels.filter((h) => h.data_confidence === "verified").length;
    return { total, published, drafts, makkah, madinah, verified };
  }, [hotels]);

  const activeFiltersCount =
    (selectedCity !== "All Cities" ? 1 : 0) +
    (selectedCategory !== "All Categories" ? 1 : 0) +
    (selectedStars !== "All Stars" ? 1 : 0) +
    (selectedWalkingTime !== "All Walking Times" ? 1 : 0) +
    (selectedStatus !== "All Status" ? 1 : 0) +
    (onlyMissingData ? 1 : 0) +
    (onlyShuttle ? 1 : 0);

  function resetAllFilters() {
    setSearch("");
    setSelectedCity("All Cities");
    setSelectedCategory("All Categories");
    setSelectedStars("All Stars");
    setSelectedWalkingTime("All Walking Times");
    setSelectedStatus("All Status");
    setOnlyMissingData(false);
    setOnlyShuttle(false);
    setCurrentPage(1);
  }

  return (
    <div className="space-y-6">
      {/* Top Header matching A01 */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-masaar-black/50">
            <Link href="/admin" className="hover:text-masaar-black transition">
              Dashboard
            </Link>
            <span>&rsaquo;</span>
            <span className="font-semibold text-masaar-black">Hotels</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-masaar-black mt-1 font-[family-name:var(--font-display)]">
            Hotels
          </h1>
          <p className="text-xs text-masaar-black/60 mt-0.5">
            Manage hotel listings, pricing, walking routes and room categories.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsRatesModalOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-[#C9A227]/40 bg-[#FAF5E8] px-3.5 py-2 text-xs font-semibold text-[#8C6B1A] hover:bg-[#F2E8CF] transition"
          >
            <span>📊</span>
            <span>Supplier Rates (SAR)</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 rounded-lg border border-black/15 bg-white px-3.5 py-2 text-xs font-semibold text-masaar-black hover:bg-warm-ivory transition"
          >
            <svg className="size-3.5 text-masaar-black/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Export CSV</span>
          </button>

          <Link href="/admin/hotels/new">
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-lg bg-[#C9A227] px-4 py-2 text-xs font-bold text-white hover:bg-[#B38F1E] shadow-xs transition"
            >
              <span>+</span>
              <span>Add Hotel</span>
            </button>
          </Link>
        </div>
      </div>

      {/* 5 KPI Stat Cards matching A01 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {/* Total Hotels */}
        <div className="rounded-xl border border-black/10 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-masaar-black/50">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Hotels</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-warm-ivory text-masaar-black/70">
              🏢
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-masaar-black font-mono">{stats.total}</div>
          <p className="mt-1 text-[11px] text-masaar-black/50">Active inventory in database</p>
        </div>

        {/* Published */}
        <div className="rounded-xl border border-black/10 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-masaar-black/50">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Published</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              ✓
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-masaar-black font-mono">{stats.published}</span>
            <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
              {Math.round((stats.published / Math.max(1, stats.total)) * 100)}% live
            </span>
          </div>
          <p className="mt-1 text-[11px] text-emerald-700 font-medium">Visible on public catalogue</p>
        </div>

        {/* Drafts */}
        <div className="rounded-xl border border-black/10 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-masaar-black/50">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Drafts</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              📝
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-masaar-black font-mono">{stats.drafts}</div>
          <p className="mt-1 text-[11px] text-amber-700 font-medium">Requires review / unpublished</p>
        </div>

        {/* Makkah Hotels */}
        <div className="rounded-xl border border-black/10 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-masaar-black/50">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Makkah Hotels</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-[#FAF5E8] text-[#8C6B1A]">
              🕋
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-masaar-black font-mono">{stats.makkah}</div>
          <p className="mt-1 text-[11px] text-masaar-black/50">Holy City properties</p>
        </div>

        {/* Madinah Hotels */}
        <div className="rounded-xl border border-black/10 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-masaar-black/50">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Madinah Hotels</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-[#FAF5E8] text-[#8C6B1A]">
              🕌
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-masaar-black font-mono">{stats.madinah}</div>
          <p className="mt-1 text-[11px] text-masaar-black/50">Prophet&apos;s City properties</p>
        </div>
      </div>

      {/* Filter and Search Bar matching A01 */}
      <div className="space-y-3 rounded-xl border border-black/10 bg-white p-4 shadow-2xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <svg
              className="absolute left-3 top-2.5 size-4 text-masaar-black/40"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by hotel name, location, brand..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-black/15 bg-warm-ivory/20 py-2 pl-9 pr-3 text-xs text-masaar-black placeholder:text-masaar-black/40 focus:border-[#C9A227] focus:bg-white focus:outline-none transition"
            />
          </div>

          {/* City Dropdown */}
          <div className="w-32">
            <select
              value={selectedCity}
              onChange={(e) => {
                setSelectedCity(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-xs text-masaar-black focus:border-[#C9A227] focus:outline-none"
            >
              <option value="All Cities">All Cities</option>
              <option value="Makkah">Makkah</option>
              <option value="Madinah">Madinah</option>
            </select>
          </div>

          {/* Category Dropdown */}
          <div className="w-36">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-xs text-masaar-black focus:border-[#C9A227] focus:outline-none"
            >
              <option value="All Categories">All Categories</option>
              <option value="Luxury">Luxury 5 Star</option>
              <option value="Premium">Premium</option>
              <option value="Standard">Standard</option>
              <option value="Economy">Economy</option>
            </select>
          </div>

          {/* Star Rating Dropdown */}
          <div className="w-28">
            <select
              value={selectedStars}
              onChange={(e) => {
                setSelectedStars(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-xs text-masaar-black focus:border-[#C9A227] focus:outline-none"
            >
              <option value="All Stars">All Stars</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
            </select>
          </div>

          {/* Walking Time Dropdown */}
          <div className="w-36">
            <select
              value={selectedWalkingTime}
              onChange={(e) => {
                setSelectedWalkingTime(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-xs text-masaar-black focus:border-[#C9A227] focus:outline-none"
            >
              <option value="All Walking Times">All Walking Times</option>
              <option value="under5">Under 5 min</option>
              <option value="5to10">5 &ndash; 10 min</option>
              <option value="over10">Over 10 min</option>
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="w-32">
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-xs text-masaar-black focus:border-[#C9A227] focus:outline-none"
            >
              <option value="All Status">All Status</option>
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
            </select>
          </div>

          {/* More Filters Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvancedFilters((v) => !v)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
              showAdvancedFilters || onlyMissingData || onlyShuttle
                ? "border-[#C9A227] bg-[#FAF5E8] text-[#8C6B1A]"
                : "border-black/15 bg-white text-masaar-black/70 hover:bg-warm-ivory"
            }`}
          >
            <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <span>More Filters</span>
            {activeFiltersCount > 0 && (
              <span className="flex size-4 items-center justify-center rounded-full bg-[#C9A227] text-[10px] font-bold text-white">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="rounded-lg border border-black/10 bg-warm-ivory px-3 py-2 text-xs font-semibold text-masaar-black hover:bg-black/5 transition"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Collapsible Advanced Filters */}
        {showAdvancedFilters && (
          <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-black/5 text-xs">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-masaar-black/80 select-none">
              <input
                type="checkbox"
                checked={onlyMissingData}
                onChange={(e) => {
                  setOnlyMissingData(e.target.checked);
                  setCurrentPage(1);
                }}
                className="rounded border-black/20 text-[#C9A227] focus:ring-[#C9A227]"
              />
              <span>Missing Pin or Walking Distance</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-medium text-masaar-black/80 select-none">
              <input
                type="checkbox"
                checked={onlyShuttle}
                onChange={(e) => {
                  setOnlyShuttle(e.target.checked);
                  setCurrentPage(1);
                }}
                className="rounded border-black/20 text-[#C9A227] focus:ring-[#C9A227]"
              />
              <span>Free Shuttle Service Available</span>
            </label>
          </div>
        )}
      </div>

      {/* Selected Items Bulk Bar */}
      {selectedHotelIds.size > 0 && (
        <div className="flex items-center justify-between rounded-xl bg-masaar-black px-4 py-3 text-xs text-white shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2 font-medium">
            <span className="flex size-5 items-center justify-center rounded-full bg-pure-gold text-[10px] font-bold text-masaar-black">
              {selectedHotelIds.size}
            </span>
            <span>hotels selected</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSelectedHotelIds(new Set())}
              className="text-white/60 hover:text-white transition"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* Table matching A01 Table Layout */}
      <div className="overflow-x-auto rounded-xl border border-black/10 bg-white shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-black/10 bg-warm-ivory/50 font-semibold text-masaar-black/70">
            <tr>
              <th className="w-10 px-4 py-3.5 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={toggleSelectAll}
                  className="rounded border-black/20 text-[#C9A227] focus:ring-[#C9A227]"
                  aria-label="Select all hotels"
                />
              </th>
              <th className="px-4 py-3.5">HOTEL</th>
              <th className="px-4 py-3.5">CITY</th>
              <th className="px-4 py-3.5">CATEGORY</th>
              <th className="px-4 py-3.5">STAR RATING</th>
              <th className="px-4 py-3.5">WALKING ACCESS</th>
              <th className="px-4 py-3.5">ROOM TYPES</th>
              <th className="px-4 py-3.5">PRICE FROM</th>
              <th className="px-4 py-3.5">STATUS</th>
              <th className="px-4 py-3.5 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {paginatedHotels.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center text-masaar-black/50">
                  <div className="text-3xl mb-2">🏨</div>
                  <p className="font-semibold text-masaar-black">No hotels match your filters</p>
                  <p className="text-xs text-masaar-black/50 mt-1">Try resetting search keywords or expanding walking distance.</p>
                  <button
                    type="button"
                    onClick={resetAllFilters}
                    className="mt-3 inline-block rounded-lg border border-black/10 bg-warm-ivory px-3 py-1.5 text-xs font-semibold text-[#8C6B1A]"
                  >
                    Reset all filters
                  </button>
                </td>
              </tr>
            ) : (
              paginatedHotels.map((hotel) => {
                const isSelected = selectedHotelIds.has(hotel.id);
                const starsCount = hotel.star_rating || 5;
                const stars = "★".repeat(starsCount);
                const roomCount = roomCounts[hotel.id] ?? 1;

                // Subtitle
                const subtitle =
                  hotel.route_type ||
                  hotel.verified_address ||
                  (hotel.zone ? `${hotel.zone.split(":")[0]}` : null) ||
                  (hotel.city === "Makkah" ? "Near Masjid al-Haram" : "Near Al-Masjid an-Nabawi");

                // Walking access formatting matching A01
                const walkMin = hotel.walk_time_minutes ?? (hotel.distance_from_haram_meters ? Math.ceil(hotel.distance_from_haram_meters / 80) : null);
                const walkMeters = hotel.distance_from_haram_meters;

                return (
                  <tr
                    key={hotel.id}
                    className={`transition-colors hover:bg-warm-ivory/25 ${
                      isSelected ? "bg-amber-50/40" : ""
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectHotel(hotel.id)}
                        className="rounded border-black/20 text-[#C9A227] focus:ring-[#C9A227]"
                        aria-label={`Select ${hotel.name}`}
                      />
                    </td>

                    {/* HOTEL (Thumbnail + Name + Subtitle) */}
                    <td className="px-4 py-3 font-medium text-masaar-black min-w-[260px]">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={hotel.image_url || "/images/hotels/voco-makkah.jpg"}
                          alt={hotel.name}
                          className="h-11 w-14 rounded-lg object-cover border border-black/10 shrink-0 bg-warm-ivory"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                        <div className="min-w-0">
                          <Link
                            href={`/admin/hotels/${hotel.id}`}
                            className="font-bold text-masaar-black hover:text-[#8C6B1A] transition truncate block"
                          >
                            {hotel.name}
                          </Link>
                          <p className="text-[11px] text-masaar-black/50 truncate max-w-[200px]">
                            {subtitle}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* CITY */}
                    <td className="px-4 py-3 font-medium">
                      <span className="inline-flex items-center gap-1 font-semibold text-masaar-black">
                        {hotel.city === "Makkah" ? "🕋" : "🕌"} {hotel.city}
                      </span>
                    </td>

                    {/* CATEGORY badge */}
                    <td className="px-4 py-3">
                      <span className="inline-block rounded-md bg-warm-ivory px-2 py-0.5 text-[11px] font-semibold text-masaar-black/75 border border-black/5">
                        {hotel.category || "Standard"}
                      </span>
                    </td>

                    {/* STAR RATING */}
                    <td className="px-4 py-3">
                      <span className="text-amber-500 font-bold text-xs tracking-tight">
                        {stars}
                      </span>
                    </td>

                    {/* WALKING ACCESS */}
                    <td className="px-4 py-3 min-w-[170px]">
                      {walkMin != null ? (
                        <div>
                          <div className="flex items-center gap-1 font-bold text-masaar-black">
                            <span className="text-masaar-black/50">🏃</span>
                            <span>{walkMin} min walk</span>
                            {walkMeters && <span className="text-masaar-black/50 font-normal">({walkMeters} m)</span>}
                          </div>
                          <div className="text-[10px] text-masaar-black/50 truncate max-w-[160px]">
                            {hotel.route_type || (walkMeters && walkMeters <= 200 ? "Direct plaza access" : "Walking route")}
                          </div>
                        </div>
                      ) : hotel.shuttle_available ? (
                        <div>
                          <span className="inline-flex items-center gap-1 rounded bg-purple-50 px-2 py-0.5 text-[11px] font-semibold text-purple-700">
                            🚌 Free Shuttle
                          </span>
                          <p className="text-[10px] text-masaar-black/50 mt-0.5">Complimentary scheduled transit</p>
                        </div>
                      ) : (
                        <span className="text-[11px] text-masaar-black/40 italic">
                          Route not surveyed
                        </span>
                      )}
                    </td>

                    {/* ROOM TYPES */}
                    <td className="px-4 py-3 font-medium text-masaar-black/80">
                      <span>{roomCount} {roomCount === 1 ? "room type" : "room types"}</span>
                    </td>

                    {/* PRICE FROM */}
                    <td className="px-4 py-3 font-mono font-bold text-masaar-black">
                      {hotel.price_from_aed ? (
                        <div>
                          <span>AED {Number(hotel.price_from_aed).toLocaleString()}</span>
                          <span className="text-[10px] font-normal text-masaar-black/40 block">/ night</span>
                        </div>
                      ) : (
                        <span className="text-masaar-black/40 font-normal italic text-[11px]">On Request</span>
                      )}
                    </td>

                    {/* STATUS */}
                    <td className="px-4 py-3">
                      {hotel.is_active ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
                          <span className="size-1.5 rounded-full bg-emerald-600" />
                          <span>Published</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-700">
                          <span className="size-1.5 rounded-full bg-gray-400" />
                          <span>Draft</span>
                        </span>
                      )}
                    </td>

                    {/* ACTIONS */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/hotels/${hotel.id}`}
                          className="rounded-lg border border-black/15 bg-white px-2.5 py-1 text-xs font-semibold text-masaar-black hover:bg-warm-ivory transition"
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
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer matching A01 */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-black/10 bg-white px-4 py-3.5 text-xs text-masaar-black/70 shadow-2xs">
        <div>
          Showing <span className="font-bold text-masaar-black">{filteredHotels.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span>&ndash;
          <span className="font-bold text-masaar-black">{Math.min(currentPage * pageSize, filteredHotels.length)}</span> of{" "}
          <span className="font-bold text-masaar-black">{filteredHotels.length}</span> hotels
        </div>

        <div className="flex items-center gap-4">
          {/* Page size dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-masaar-black/50">Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="rounded-lg border border-black/15 bg-white px-2.5 py-1 text-xs font-semibold text-masaar-black focus:outline-none"
            >
              <option value={12}>12 / page</option>
              <option value={24}>24 / page</option>
              <option value={48}>48 / page</option>
            </select>
          </div>

          {/* Numbered pagination */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex size-7 items-center justify-center rounded-lg border border-black/15 bg-white font-bold text-masaar-black hover:bg-warm-ivory disabled:opacity-30 disabled:pointer-events-none"
                aria-label="Previous page"
              >
                &lsaquo;
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((p, idx, arr) => {
                  const prev = arr[idx - 1];
                  const showEllipsis = prev && p - prev > 1;

                  return (
                    <div key={p} className="flex items-center">
                      {showEllipsis && <span className="px-1 text-masaar-black/30">&hellip;</span>}
                      <button
                        type="button"
                        onClick={() => setCurrentPage(p)}
                        className={`flex size-7 items-center justify-center rounded-lg text-xs font-bold transition ${
                          currentPage === p
                            ? "bg-[#C9A227] text-white shadow-2xs"
                            : "border border-black/15 bg-white text-masaar-black hover:bg-warm-ivory"
                        }`}
                      >
                        {p}
                      </button>
                    </div>
                  );
                })}

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex size-7 items-center justify-center rounded-lg border border-black/15 bg-white font-bold text-masaar-black hover:bg-warm-ivory disabled:opacity-30 disabled:pointer-events-none"
                aria-label="Next page"
              >
                &rsaquo;
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Supplier Rates Explorer Modal */}
      <SupplierRatesModal
        hotels={hotels}
        isOpen={isRatesModalOpen}
        onClose={() => setIsRatesModalOpen(false)}
      />

      {/* Confirmation Modals */}
      {unpublishTarget && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-masaar-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-amber-50 text-amber-700">
              <svg className="size-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-masaar-black">
              {unpublishTarget.is_active ? "Unpublish this hotel?" : "Publish this hotel?"}
            </h3>
            <p className="mt-2 text-xs text-masaar-black/60 leading-relaxed">
              {unpublishTarget.is_active
                ? "The hotel will be hidden from the public website catalogue. Existing quotes or package configurations will retain their reference."
                : "The hotel will immediately become visible to pilgrims on the public hotel browsing page."}
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setUnpublishTarget(null)}
                disabled={isPending}
                className="flex-1 rounded-lg border border-black/15 bg-white px-4 py-2.5 text-xs font-semibold text-masaar-black hover:bg-warm-ivory"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleToggleConfirm}
                disabled={isPending}
                className="flex-1 rounded-lg bg-[#C9A227] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#B38F1E] disabled:opacity-60"
              >
                {isPending ? "Saving..." : unpublishTarget.is_active ? "Unpublish Hotel" : "Publish Hotel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-masaar-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-red-50 text-red-600">
              <svg className="size-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-masaar-black">Delete this hotel?</h3>
            <p className="mt-2 text-xs text-masaar-black/60 leading-relaxed">
              This action cannot be undone. If this hotel is linked to active packages or inventory, consider unpublishing it instead to maintain data integrity.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isPending}
                className="flex-1 rounded-lg border border-black/15 bg-white px-4 py-2.5 text-xs font-semibold text-masaar-black hover:bg-warm-ivory"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isPending}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {isPending ? "Deleting..." : "Delete Hotel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
