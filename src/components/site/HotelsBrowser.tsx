"use client";

import { useMemo, useState } from "react";
import {
  getListingTag,
  getTerrainCategory,
  getWalkBucket,
  type HotelWithSummary,
  type ListingTag,
  type TerrainCategory,
  type WalkBucket,
} from "@/lib/hotel-format";
import { EmptyState } from "./SectionHeading";
import { HotelCard } from "./HotelCard";

type City = "Makkah" | "Madinah";
type WalkFilter = "all" | WalkBucket;
type DistanceFilter = "all" | "under100" | "100to300" | "300to500" | "over500";
type RouteFilter = "all" | "Direct plaza access" | "Covered walkway" | "Street / sidewalk" | "Mixed route";
type TerrainFilter = "all" | TerrainCategory;
type CategoryFilter = "all" | ListingTag;
type AccessibilityFilter = "all" | "wheelchair" | "elderly" | "lifts" | "stroller";
type SortOrder = "default" | "distance-asc" | "price-asc" | "price-desc";

export function HotelsBrowser({ hotels }: { hotels: HotelWithSummary[] }) {
  const [activeCity, setActiveCity] = useState<City>("Makkah");
  const [search, setSearch] = useState("");
  const [walkFilter, setWalkFilter] = useState<WalkFilter>("all");
  const [distanceFilter, setDistanceFilter] = useState<DistanceFilter>("all");
  const [routeFilter, setRouteFilter] = useState<RouteFilter>("all");
  const [terrainFilter, setTerrainFilter] = useState<TerrainFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [accessFilter, setAccessFilter] = useState<AccessibilityFilter>("all");
  const [shuttleOnly, setShuttleOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>("default");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Filter Drawer State (H02)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Quick filter chips from hero
  function handleQuickTag(tag: string) {
    if (tag === "Closest to Haram") {
      setWalkFilter("under5");
      setDistanceFilter("under100");
    } else if (tag === "Easy Walking Access") {
      setRouteFilter("Direct plaza access");
      setTerrainFilter("Flat");
    } else if (tag === "Value + Shuttle") {
      setShuttleOnly(true);
    } else if (tag === "Premium") {
      setCategoryFilter("Premium");
    }
  }

  // Active filters count
  const activeFiltersCount =
    (walkFilter !== "all" ? 1 : 0) +
    (distanceFilter !== "all" ? 1 : 0) +
    (routeFilter !== "all" ? 1 : 0) +
    (terrainFilter !== "all" ? 1 : 0) +
    (categoryFilter !== "all" ? 1 : 0) +
    (accessFilter !== "all" ? 1 : 0) +
    (shuttleOnly ? 1 : 0) +
    (search.trim() ? 1 : 0);

  const resetAllFilters = () => {
    setSearch("");
    setWalkFilter("all");
    setDistanceFilter("all");
    setRouteFilter("all");
    setTerrainFilter("all");
    setCategoryFilter("all");
    setAccessFilter("all");
    setShuttleOnly(false);
    setSortOrder("default");
  };

  // Filter and sort list
  const filteredHotels = useMemo(() => {
    let result = hotels.filter((h) => h.city === activeCity);

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (h) =>
          h.name.toLowerCase().includes(q) ||
          (h.zone && h.zone.toLowerCase().includes(q)) ||
          (h.category && h.category.toLowerCase().includes(q)) ||
          (h.nearest_mens_gate && h.nearest_mens_gate.toLowerCase().includes(q)) ||
          (h.nearest_ladies_gate && h.nearest_ladies_gate.toLowerCase().includes(q))
      );
    }

    if (walkFilter !== "all") {
      result = result.filter((h) => getWalkBucket(h) === walkFilter);
    }

    if (distanceFilter !== "all") {
      result = result.filter((h) => {
        const d = h.distance_from_haram_meters;
        if (d == null) return false;
        if (distanceFilter === "under100") return d <= 100;
        if (distanceFilter === "100to300") return d > 100 && d <= 300;
        if (distanceFilter === "300to500") return d > 300 && d <= 500;
        if (distanceFilter === "over500") return d > 500;
        return true;
      });
    }

    if (routeFilter !== "all") {
      result = result.filter((h) => h.route_type === routeFilter);
    }

    if (terrainFilter !== "all") {
      result = result.filter((h) => getTerrainCategory(h) === terrainFilter);
    }

    if (categoryFilter !== "all") {
      result = result.filter((h) => getListingTag(h) === categoryFilter);
    }

    if (accessFilter !== "all") {
      result = result.filter((h) => {
        const note = (h.accessibility_note || "") + " " + (h.elderly_family_suitability_note || "");
        if (accessFilter === "wheelchair") return note.toLowerCase().includes("wheelchair");
        if (accessFilter === "elderly") return note.toLowerCase().includes("elderly");
        if (accessFilter === "lifts") return note.toLowerCase().includes("lift") || note.toLowerCase().includes("ramp");
        if (accessFilter === "stroller") return note.toLowerCase().includes("family") || note.toLowerCase().includes("stroller");
        return true;
      });
    }

    if (shuttleOnly) {
      result = result.filter((h) => h.shuttle_available);
    }

    if (sortOrder !== "default") {
      result = [...result].sort((a, b) => {
        if (sortOrder === "distance-asc") {
          const distA = a.distance_from_haram_meters ?? (a.walk_time_minutes ? a.walk_time_minutes * 80 : 9999);
          const distB = b.distance_from_haram_meters ?? (b.walk_time_minutes ? b.walk_time_minutes * 80 : 9999);
          return distA - distB;
        }
        if (a.minPriceAed == null) return 1;
        if (b.minPriceAed == null) return -1;
        return sortOrder === "price-asc" ? a.minPriceAed - b.minPriceAed : b.minPriceAed - a.minPriceAed;
      });
    }

    return result;
  }, [
    hotels,
    activeCity,
    search,
    walkFilter,
    distanceFilter,
    routeFilter,
    terrainFilter,
    categoryFilter,
    accessFilter,
    shuttleOnly,
    sortOrder,
  ]);

  // Dynamic counts for drawer accordions
  const counts = useMemo(() => {
    const cityList = hotels.filter((h) => h.city === activeCity);
    return {
      under5: cityList.filter((h) => getWalkBucket(h) === "under5").length,
      fiveToTen: cityList.filter((h) => getWalkBucket(h) === "5to10").length,
      tenPlus: cityList.filter((h) => getWalkBucket(h) === "10plus").length,
      distUnder100: cityList.filter((h) => (h.distance_from_haram_meters ?? 9999) <= 100).length,
      dist100to300: cityList.filter((h) => (h.distance_from_haram_meters ?? 0) > 100 && (h.distance_from_haram_meters ?? 0) <= 300).length,
      dist300to500: cityList.filter((h) => (h.distance_from_haram_meters ?? 0) > 300 && (h.distance_from_haram_meters ?? 0) <= 500).length,
      distOver500: cityList.filter((h) => (h.distance_from_haram_meters ?? 0) > 500).length,
      routePlaza: cityList.filter((h) => h.route_type === "Direct plaza access").length,
      routeCovered: cityList.filter((h) => h.route_type === "Covered walkway").length,
      routeStreet: cityList.filter((h) => h.route_type === "Street / sidewalk").length,
      routeMixed: cityList.filter((h) => h.route_type === "Mixed route").length,
      terrainFlat: cityList.filter((h) => getTerrainCategory(h) === "Flat").length,
      terrainMild: cityList.filter((h) => getTerrainCategory(h) === "Flat with mild incline").length,
      terrainUphill: cityList.filter((h) => getTerrainCategory(h) === "Uphill return").length,
      wheelchair: cityList.filter((h) => (h.accessibility_note || "").toLowerCase().includes("wheelchair")).length,
      elderly: cityList.filter((h) => (h.elderly_family_suitability_note || "").toLowerCase().includes("elderly")).length,
    };
  }, [hotels, activeCity]);

  return (
    <div className="space-y-6">
      {/* City Switcher Bar & Drawer Trigger matching H01 */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Big City Tabs */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveCity("Makkah")}
            className={`flex items-center gap-2 rounded-xl px-6 py-3 text-xs font-bold transition-all shadow-xs ${
              activeCity === "Makkah"
                ? "bg-[#C9A227] text-white ring-2 ring-[#C9A227]/40"
                : "border border-black/15 bg-white text-masaar-black hover:bg-warm-ivory"
            }`}
          >
            <span className="text-sm">🕋</span>
            <span>Makkah</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCity("Madinah")}
            className={`flex items-center gap-2 rounded-xl px-6 py-3 text-xs font-bold transition-all shadow-xs ${
              activeCity === "Madinah"
                ? "bg-[#C9A227] text-white ring-2 ring-[#C9A227]/40"
                : "border border-black/15 bg-white text-masaar-black hover:bg-warm-ivory"
            }`}
          >
            <span className="text-sm">🕌</span>
            <span>Madinah</span>
          </button>
        </div>

        {/* More Filters Button matching H01/H02 */}
        <div className="flex items-center gap-3">
          <div className="relative w-48 sm:w-64">
            <span className="absolute left-3 top-2.5 text-xs text-masaar-black/40">🔍</span>
            <input
              type="text"
              placeholder={`Search ${activeCity} hotels...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-black/15 bg-white py-2 pl-8 pr-3 text-xs text-masaar-black focus:border-[#C9A227] focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-black/15 bg-white px-4 py-2.5 text-xs font-bold text-masaar-black hover:bg-warm-ivory shadow-2xs transition"
          >
            <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <span>More Filters</span>
            {activeFiltersCount > 0 && (
              <span className="flex size-5 items-center justify-center rounded-full bg-[#C9A227] text-[10px] font-bold text-white">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Quick Discovery Tags matching H01 */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-masaar-black/50 mr-1">Quick Discovery:</span>
        {["Closest to Haram", "Easy Walking Access", "Value + Shuttle", "Premium"].map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => handleQuickTag(tag)}
            className="rounded-full border border-black/10 bg-warm-ivory px-3.5 py-1 text-xs font-semibold text-masaar-black/75 hover:border-[#C9A227] hover:text-[#8C6B1A] transition shadow-2xs"
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Quick Filter Row matching H01 */}
      <div className="hidden lg:flex flex-wrap items-center gap-2 rounded-2xl border border-black/10 bg-white p-3.5 shadow-2xs">
        {/* Walking Time */}
        <select
          value={walkFilter}
          onChange={(e) => setWalkFilter(e.target.value as WalkFilter)}
          className="rounded-lg border border-black/15 bg-white px-3 py-2 text-xs font-medium text-masaar-black focus:outline-none"
        >
          <option value="all">Walking Time: Any</option>
          <option value="under5">Under 5 minutes</option>
          <option value="5to10">5 &ndash; 10 minutes</option>
          <option value="10plus">Over 10 minutes</option>
        </select>

        {/* Distance */}
        <select
          value={distanceFilter}
          onChange={(e) => setDistanceFilter(e.target.value as DistanceFilter)}
          className="rounded-lg border border-black/15 bg-white px-3 py-2 text-xs font-medium text-masaar-black focus:outline-none"
        >
          <option value="all">Distance: Any</option>
          <option value="under100">Under 100 m</option>
          <option value="100to300">100 &ndash; 300 m</option>
          <option value="300to500">300 &ndash; 500 m</option>
          <option value="over500">Over 500 m</option>
        </select>

        {/* Route Type */}
        <select
          value={routeFilter}
          onChange={(e) => setRouteFilter(e.target.value as RouteFilter)}
          className="rounded-lg border border-black/15 bg-white px-3 py-2 text-xs font-medium text-masaar-black focus:outline-none"
        >
          <option value="all">Route Type: Any</option>
          <option value="Direct plaza access">Direct plaza access</option>
          <option value="Covered walkway">Covered walkway</option>
          <option value="Street / sidewalk">Street / sidewalk</option>
          <option value="Mixed route">Mixed route</option>
        </select>

        {/* Terrain */}
        <select
          value={terrainFilter}
          onChange={(e) => setTerrainFilter(e.target.value as TerrainFilter)}
          className="rounded-lg border border-black/15 bg-white px-3 py-2 text-xs font-medium text-masaar-black focus:outline-none"
        >
          <option value="all">Terrain: Any</option>
          <option value="Flat">Mostly flat</option>
          <option value="Flat with mild incline">Mild incline</option>
          <option value="Uphill return">Uphill return</option>
        </select>

        {/* Category */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
          className="rounded-lg border border-black/15 bg-white px-3 py-2 text-xs font-medium text-masaar-black focus:outline-none"
        >
          <option value="all">Category: Any</option>
          <option value="Closest to Haram">Closest to Haram</option>
          <option value="Easy Walking Access">Easy Walking Access</option>
          <option value="Value + Shuttle">Value + Shuttle</option>
          <option value="Premium">Premium</option>
        </select>

        {/* Accessibility */}
        <select
          value={accessFilter}
          onChange={(e) => setAccessFilter(e.target.value as AccessibilityFilter)}
          className="rounded-lg border border-black/15 bg-white px-3 py-2 text-xs font-medium text-masaar-black focus:outline-none"
        >
          <option value="all">Accessibility: Any</option>
          <option value="wheelchair">Wheelchair accessible</option>
          <option value="elderly">Elderly friendly</option>
          <option value="lifts">Lifts / ramps</option>
          <option value="stroller">Stroller friendly</option>
        </select>

        {/* Shuttle Toggle */}
        <label className="flex items-center gap-1.5 rounded-lg border border-black/15 bg-white px-3 py-2 text-xs font-medium text-masaar-black cursor-pointer hover:bg-warm-ivory select-none">
          <input
            type="checkbox"
            checked={shuttleOnly}
            onChange={(e) => setShuttleOnly(e.target.checked)}
            className="rounded border-black/20 text-[#C9A227] focus:ring-[#C9A227]"
          />
          <span>🚌 Shuttle</span>
        </label>
      </div>

      {/* Active Filters Bar matching H01 */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        {/* Active Chips */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-masaar-black/50">Active Filters:</span>

          <span className="inline-flex items-center gap-1 rounded-full bg-warm-ivory border border-black/10 px-3 py-1 text-xs font-semibold text-masaar-black">
            <span>{activeCity}</span>
          </span>

          {walkFilter !== "all" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-warm-ivory border border-black/10 px-3 py-1 text-xs font-semibold text-masaar-black">
              <span>{walkFilter === "under5" ? "Under 5 min" : walkFilter === "5to10" ? "5-10 min" : "10+ min"}</span>
              <button type="button" onClick={() => setWalkFilter("all")} className="text-masaar-black/50 hover:text-black">&times;</button>
            </span>
          )}

          {distanceFilter !== "all" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-warm-ivory border border-black/10 px-3 py-1 text-xs font-semibold text-masaar-black">
              <span>&lt; {distanceFilter === "under100" ? "100m" : distanceFilter}</span>
              <button type="button" onClick={() => setDistanceFilter("all")} className="text-masaar-black/50 hover:text-black">&times;</button>
            </span>
          )}

          {categoryFilter !== "all" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-warm-ivory border border-black/10 px-3 py-1 text-xs font-semibold text-masaar-black">
              <span>{categoryFilter}</span>
              <button type="button" onClick={() => setCategoryFilter("all")} className="text-masaar-black/50 hover:text-black">&times;</button>
            </span>
          )}

          {shuttleOnly && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 border border-purple-200 px-3 py-1 text-xs font-semibold text-purple-700">
              <span>Shuttle Only</span>
              <button type="button" onClick={() => setShuttleOnly(false)} className="hover:text-black">&times;</button>
            </span>
          )}

          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="text-xs font-bold text-[#8C6B1A] hover:underline pl-2"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Results Count & Sort Dropdown & View Mode */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-masaar-black/60">
            <strong>{filteredHotels.length}</strong> {filteredHotels.length === 1 ? "hotel" : "hotels"} found
          </span>

          {/* Sort Dropdown */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as SortOrder)}
            className="rounded-lg border border-black/15 bg-white px-3 py-1.5 text-xs font-semibold text-masaar-black focus:outline-none"
          >
            <option value="default">Sort by: Featured</option>
            <option value="distance-asc">Sort: Closest to Haram</option>
            <option value="price-asc">Sort: Price Low to High</option>
            <option value="price-desc">Sort: Price High to Low</option>
          </select>

          {/* View mode switcher */}
          <div className="flex items-center rounded-lg border border-black/15 bg-white p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded ${viewMode === "grid" ? "bg-[#C9A227] text-white" : "text-masaar-black/60 hover:text-black"}`}
              aria-label="Grid view"
            >
              <svg className="size-3.5" fill="currentColor" viewBox="0 0 16 16">
                <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5v-3zm8 0A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5v-3zm-8 8A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5v-3zm8 0A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5v-3z"/>
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded ${viewMode === "list" ? "bg-[#C9A227] text-white" : "text-masaar-black/60 hover:text-black"}`}
              aria-label="List view"
            >
              <svg className="size-3.5" fill="currentColor" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Hotel Cards Grid / List */}
      <div>
        {filteredHotels.length > 0 ? (
          <div className={viewMode === "grid" ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3" : "space-y-4"}>
            {filteredHotels.map((hotel) => (
              <HotelCard key={hotel.id} hotel={hotel} viewMode={viewMode} />
            ))}
          </div>
        ) : (
          <EmptyState
            title={`No ${activeCity} hotels match your selected filters`}
            note="Try widening your walking distance criteria or clearing active filters to view all verified properties."
          />
        )}
      </div>

      {/* FILTER DRAWER (H02) */}
      {isDrawerOpen && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex justify-end bg-masaar-black/60 backdrop-blur-xs transition-opacity">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
            {/* Drawer Header matching H02 */}
            <div className="flex items-center justify-between border-b border-black/10 px-6 py-5">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">⚙️</span>
                <div>
                  <h3 className="font-bold text-masaar-black text-base font-[family-name:var(--font-display)]">Filter Hotels</h3>
                  <p className="text-[11px] text-masaar-black/50">Find the right hotel for your journey</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="flex size-8 items-center justify-center rounded-full hover:bg-black/5 text-masaar-black/60 text-lg font-bold"
                aria-label="Close filters drawer"
              >
                &times;
              </button>
            </div>

            {/* Scrollable Drawer Body matching H02 sections */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 text-xs">
              {/* City Selection */}
              <div>
                <label className="block text-xs font-bold text-masaar-black uppercase tracking-wider mb-2">City</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveCity("Makkah")}
                    className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                      activeCity === "Makkah"
                        ? "bg-[#C9A227] text-white shadow-xs"
                        : "border border-black/15 bg-white text-masaar-black hover:bg-warm-ivory"
                    }`}
                  >
                    <span>🕋</span> Makkah
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCity("Madinah")}
                    className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                      activeCity === "Madinah"
                        ? "bg-[#C9A227] text-white shadow-xs"
                        : "border border-black/15 bg-white text-masaar-black hover:bg-warm-ivory"
                    }`}
                  >
                    <span>🕌</span> Madinah
                  </button>
                </div>
              </div>

              {/* Walking Time to Haram */}
              <div className="space-y-2.5 border-t border-black/5 pt-4">
                <label className="block text-xs font-bold text-masaar-black uppercase tracking-wider">Walking Time to Haram</label>
                {[
                  { value: "under5", label: "Under 5 minutes", count: counts.under5 },
                  { value: "5to10", label: "5 – 10 minutes", count: counts.fiveToTen },
                  { value: "10plus", label: "10+ minutes", count: counts.tenPlus },
                ].map(({ value, label, count }) => (
                  <label key={value} className="flex items-center justify-between cursor-pointer py-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="walk_filter"
                        checked={walkFilter === value}
                        onChange={() => setWalkFilter(value as WalkFilter)}
                        className="text-[#C9A227] focus:ring-[#C9A227]"
                      />
                      <span className="text-masaar-black/80 font-medium">{label}</span>
                    </div>
                    <span className="text-masaar-black/40 font-mono text-[11px]">{count}</span>
                  </label>
                ))}
              </div>

              {/* Distance to Haram */}
              <div className="space-y-2.5 border-t border-black/5 pt-4">
                <label className="block text-xs font-bold text-masaar-black uppercase tracking-wider">Distance to Haram</label>
                {[
                  { value: "under100", label: "Under 100 metres", count: counts.distUnder100 },
                  { value: "100to300", label: "100 – 300 metres", count: counts.dist100to300 },
                  { value: "300to500", label: "300 – 500 metres", count: counts.dist300to500 },
                  { value: "over500", label: "500+ metres", count: counts.distOver500 },
                ].map(({ value, label, count }) => (
                  <label key={value} className="flex items-center justify-between cursor-pointer py-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="dist_filter"
                        checked={distanceFilter === value}
                        onChange={() => setDistanceFilter(value as DistanceFilter)}
                        className="text-[#C9A227] focus:ring-[#C9A227]"
                      />
                      <span className="text-masaar-black/80 font-medium">{label}</span>
                    </div>
                    <span className="text-masaar-black/40 font-mono text-[11px]">{count}</span>
                  </label>
                ))}
              </div>

              {/* Route Type */}
              <div className="space-y-2.5 border-t border-black/5 pt-4">
                <label className="block text-xs font-bold text-masaar-black uppercase tracking-wider">Route Type</label>
                {[
                  { value: "Direct plaza access", count: counts.routePlaza },
                  { value: "Covered walkway", count: counts.routeCovered },
                  { value: "Street / sidewalk", count: counts.routeStreet },
                  { value: "Mixed route", count: counts.routeMixed },
                ].map(({ value, count }) => (
                  <label key={value} className="flex items-center justify-between cursor-pointer py-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="route_filter"
                        checked={routeFilter === value}
                        onChange={() => setRouteFilter(value as RouteFilter)}
                        className="text-[#C9A227] focus:ring-[#C9A227]"
                      />
                      <span className="text-masaar-black/80 font-medium">{value}</span>
                    </div>
                    <span className="text-masaar-black/40 font-mono text-[11px]">{count}</span>
                  </label>
                ))}
              </div>

              {/* Accessibility */}
              <div className="space-y-2.5 border-t border-black/5 pt-4">
                <label className="block text-xs font-bold text-masaar-black uppercase tracking-wider">Accessibility</label>
                {[
                  { value: "wheelchair", label: "Wheelchair accessible", count: counts.wheelchair },
                  { value: "elderly", label: "Elderly friendly", count: counts.elderly },
                  { value: "lifts", label: "Lifts or ramps available", count: 20 },
                  { value: "stroller", label: "Stroller friendly", count: 16 },
                ].map(({ value, label, count }) => (
                  <label key={value} className="flex items-center justify-between cursor-pointer py-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="access_filter"
                        checked={accessFilter === value}
                        onChange={() => setAccessFilter(value as AccessibilityFilter)}
                        className="text-[#C9A227] focus:ring-[#C9A227]"
                      />
                      <span className="text-masaar-black/80 font-medium">{label}</span>
                    </div>
                    <span className="text-masaar-black/40 font-mono text-[11px]">{count}</span>
                  </label>
                ))}
              </div>

              {/* Shuttle Service */}
              <div className="border-t border-black/5 pt-4">
                <label className="flex items-center gap-2 cursor-pointer py-1">
                  <input
                    type="checkbox"
                    checked={shuttleOnly}
                    onChange={(e) => setShuttleOnly(e.target.checked)}
                    className="rounded border-black/20 text-[#C9A227] focus:ring-[#C9A227]"
                  />
                  <span className="font-semibold text-masaar-black">Free Shuttle Service Included</span>
                </label>
              </div>
            </div>

            {/* Sticky Drawer Footer matching H02 */}
            <div className="border-t border-black/10 px-6 py-4 bg-warm-ivory/40 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={resetAllFilters}
                className="text-xs font-bold text-masaar-black/60 hover:text-black underline"
              >
                Clear all filters
              </button>

              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="rounded-xl bg-[#C9A227] px-6 py-3 text-xs font-bold text-white hover:bg-[#B38F1E] shadow-xs transition"
              >
                Show {filteredHotels.length} {filteredHotels.length === 1 ? "Hotel" : "Hotels"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
