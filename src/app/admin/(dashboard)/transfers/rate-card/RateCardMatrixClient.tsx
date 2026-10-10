"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { saveRateCardBulk, type RateUpdateItem } from "./actions";

export interface RateCardRouteItem {
  id: string;
  route_name: string;
  slug: string;
  transfer_type: string;
  description?: string | null;
  image_url?: string | null;
  is_active: boolean;
  display_order: number;
}

export interface RateCardVehicleItem {
  id: string;
  name: string;
  display_order: number;
  image_url: string;
  passengers: number;
  luggage: number;
}

export interface RateCardCellState {
  price_aed: number;
  is_active: boolean;
}

export function RateCardMatrixClient({
  routes,
  vehicles,
  initialRateMap,
}: {
  routes: RateCardRouteItem[];
  vehicles: RateCardVehicleItem[];
  initialRateMap: Record<string, RateCardCellState>;
}) {
  const [rates, setRates] = useState<Record<string, RateCardCellState>>(initialRateMap);
  const [selectedRouteId, setSelectedRouteId] = useState<string>(routes[0]?.id || "");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isPending, startTransition] = useTransition();
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Filter routes
  const filteredRoutes = routes.filter((r) => {
    const matchesSearch =
      r.route_name.toLowerCase().includes(search.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory =
      categoryFilter === "all" ||
      r.transfer_type.toLowerCase() === categoryFilter.toLowerCase();

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && r.is_active) ||
      (statusFilter === "inactive" && !r.is_active);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const selectedRoute = routes.find((r) => r.id === selectedRouteId) || routes[0];

  const handleCellPriceChange = (routeId: string, vehicleId: string, val: string) => {
    const num = Number(val);
    if (Number.isNaN(num) || num < 0) return;
    const key = `${routeId}__${vehicleId}`;
    setRates((prev) => ({
      ...prev,
      [key]: {
        price_aed: num,
        is_active: prev[key]?.is_active ?? true,
      },
    }));
    setHasUnsavedChanges(true);
  };

  const handleCellToggleActive = (routeId: string, vehicleId: string) => {
    const key = `${routeId}__${vehicleId}`;
    const current = rates[key] ?? { price_aed: 0, is_active: true };
    setRates((prev) => ({
      ...prev,
      [key]: {
        price_aed: current.price_aed,
        is_active: !current.is_active,
      },
    }));
    setHasUnsavedChanges(true);
  };

  const handleSaveAll = () => {
    const updates: RateUpdateItem[] = [];

    for (const route of routes) {
      for (const vehicle of vehicles) {
        const key = `${route.id}__${vehicle.id}`;
        const item = rates[key];
        if (item) {
          updates.push({
            transfer_id: route.id,
            vehicle_id: vehicle.id,
            price_aed: item.price_aed,
            is_active: item.is_active,
          });
        }
      }
    }

    startTransition(async () => {
      const res = await saveRateCardBulk(updates);
      if (res.success) {
        setHasUnsavedChanges(false);
        setNotification({
          type: "success",
          text: `Rate Card successfully saved (${res.count} route rates updated).`,
        });
      } else {
        setNotification({
          type: "error",
          text: res.error || "Failed to save rate card.",
        });
      }
      setTimeout(() => setNotification(null), 4000);
    });
  };

  const getCategoryBadgeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "airport":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "intercity":
        return "bg-blue-50 text-blue-800 border-blue-200";
      case "ziyarat":
        return "bg-purple-50 text-purple-800 border-purple-200";
      case "train":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "day-trip":
        return "bg-pink-50 text-pink-800 border-pink-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getCategoryLabel = (type: string) => {
    switch (type.toLowerCase()) {
      case "airport":
        return "Airport";
      case "intercity":
        return "Intercity";
      case "ziyarat":
        return "Ziyarat";
      case "train":
        return "Train Station";
      case "day-trip":
        return "Day Trips";
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed right-6 top-20 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg transition-all ${
            notification.type === "success"
              ? "border border-green-200 bg-green-50 text-green-800"
              : "border border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {notification.type === "success" ? (
            <svg className="size-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="size-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Top Banner / Breadcrumb & Header (Matches ADMIN - Rate card.png) */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-masaar-black/50">
            <Link href="/admin" className="hover:underline">Dashboard</Link>
            <span>›</span>
            <Link href="/admin/transfers" className="hover:underline">Transfers</Link>
            <span>›</span>
            <span className="font-semibold text-masaar-black">Rate Card</span>
          </div>
          <h1 className="mt-1 font-serif text-3xl font-bold text-masaar-black">Transfer Rate Card</h1>
          <p className="mt-1 text-sm text-masaar-black/60">
            Set and manage prices for each vehicle type per route. Enable or disable vehicles for specific routes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-black/15 bg-white px-3 py-2 text-sm font-semibold text-masaar-black">
            <span>AED</span>
          </div>
          <button
            onClick={handleSaveAll}
            disabled={isPending}
            className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold text-masaar-black shadow-sm transition ${
              hasUnsavedChanges
                ? "bg-pure-gold hover:bg-pure-gold/90 ring-2 ring-pure-gold/40"
                : "bg-pure-gold/80 hover:bg-pure-gold"
            } disabled:opacity-50`}
          >
            {isPending ? (
              <span>Saving...</span>
            ) : (
              <>
                <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                <span>Save All Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filter / Search Row (Matches inspiration filter bar) */}
      <div className="flex flex-col gap-3 rounded-xl border border-black/10 bg-white p-4 shadow-xs lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm font-medium text-masaar-black outline-hidden focus:border-pure-gold"
          >
            <option value="all">All Categories</option>
            <option value="airport">Airport Transfers</option>
            <option value="intercity">Intercity</option>
            <option value="ziyarat">Ziyarat</option>
            <option value="train">Train Station</option>
            <option value="day-trip">Day Trips</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm font-medium text-masaar-black outline-hidden focus:border-pure-gold"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          <div className="relative min-w-[240px] flex-1">
            <svg className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-masaar-black/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search routes..."
              className="w-full rounded-lg border border-black/15 bg-white py-2 pl-10 pr-4 text-sm text-masaar-black outline-hidden focus:border-pure-gold"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-xs text-masaar-black/60">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500" />
              <span>Active (Visible on website)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-gray-400" />
              <span>Inactive (Hidden on website)</span>
            </span>
          </div>

          {(search || categoryFilter !== "all" || statusFilter !== "all") && (
            <button
              onClick={() => {
                setSearch("");
                setCategoryFilter("all");
                setStatusFilter("all");
              }}
              className="flex items-center gap-1 rounded-lg border border-black/10 px-3 py-1.5 text-xs font-medium text-masaar-black/60 hover:bg-black/5"
            >
              <svg className="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Clear Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid Matrix + Preview Sidebar */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Matrix Table */}
        <div className="xl:col-span-8 overflow-hidden rounded-xl border border-black/10 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-black/10 bg-black/2 text-xs font-semibold text-masaar-black/70">
                <tr>
                  <th className="px-3 py-3 text-center w-8">#</th>
                  <th className="px-3 py-3 min-w-[200px]">Route</th>
                  <th className="px-3 py-3 text-center">Category</th>
                  {vehicles.map((v) => (
                    <th key={v.id} className="px-2 py-3 text-center min-w-[120px]">
                      <div className="flex flex-col items-center gap-1">
                        <div className="relative size-12 overflow-hidden rounded-md border border-black/10 bg-white p-0.5">
                          <Image
                            src={v.image_url}
                            alt={v.name}
                            fill
                            className="object-contain"
                            sizes="48px"
                          />
                        </div>
                        <span className="font-semibold text-masaar-black">{v.name}</span>
                        <span className="text-[10px] text-masaar-black/50">
                          ({v.passengers} Passengers)
                        </span>
                      </div>
                    </th>
                  ))}
                  <th className="px-3 py-3 text-center">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-black/5">
                {filteredRoutes.length === 0 ? (
                  <tr>
                    <td colSpan={vehicles.length + 4} className="py-12 text-center text-sm text-masaar-black/50">
                      No routes match your search or filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredRoutes.map((route, idx) => {
                    const isSelected = selectedRouteId === route.id;
                    return (
                      <tr
                        key={route.id}
                        className={`transition-colors ${
                          isSelected ? "bg-amber-50/60" : "hover:bg-black/[0.015]"
                        }`}
                      >
                        {/* Index */}
                        <td className="px-3 py-3.5 text-center text-xs font-medium text-masaar-black/40">
                          {idx + 1}
                        </td>

                        {/* Route Name & Thumbnail */}
                        <td className="px-3 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="relative size-10 shrink-0 overflow-hidden rounded-md border border-black/10">
                              <Image
                                src={route.image_url || "/trips/jeddah-airport-to-makkah.webp"}
                                alt={route.route_name}
                                fill
                                className="object-cover"
                                sizes="40px"
                              />
                            </div>
                            <span className="font-semibold text-masaar-black">
                              {route.route_name}
                            </span>
                          </div>
                        </td>

                        {/* Category badge */}
                        <td className="px-3 py-3.5 text-center">
                          <span
                            className={`inline-block rounded-md border px-2 py-0.5 text-xs font-medium ${getCategoryBadgeColor(
                              route.transfer_type
                            )}`}
                          >
                            {getCategoryLabel(route.transfer_type)}
                          </span>
                        </td>

                        {/* Vehicle Price Cells */}
                        {vehicles.map((v) => {
                          const key = `${route.id}__${v.id}`;
                          const cell = rates[key] ?? { price_aed: 0, is_active: false };

                          return (
                            <td key={v.id} className="px-2 py-3.5 text-center">
                              <div className="flex flex-col items-center gap-1.5">
                                {/* Active toggle switch */}
                                <button
                                  type="button"
                                  onClick={() => handleCellToggleActive(route.id, v.id)}
                                  title={cell.is_active ? "Vehicle Active on this Route" : "Vehicle Disabled on this Route"}
                                  className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                                    cell.is_active ? "bg-emerald-500" : "bg-gray-300"
                                  }`}
                                >
                                  <span
                                    className={`pointer-events-none inline-block size-3 rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                      cell.is_active ? "translate-x-3" : "translate-x-0"
                                    }`}
                                  />
                                </button>

                                {/* Price input or disabled dash */}
                                {cell.is_active ? (
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] font-medium text-masaar-black/50">
                                      AED
                                    </span>
                                    <input
                                      type="number"
                                      min={0}
                                      step={1}
                                      value={cell.price_aed || ""}
                                      onChange={(e) =>
                                        handleCellPriceChange(route.id, v.id, e.target.value)
                                      }
                                      placeholder="—"
                                      className={`w-16 rounded-md border px-1.5 py-1 text-center text-xs font-semibold text-masaar-black outline-hidden focus:border-pure-gold focus:ring-1 focus:ring-pure-gold ${
                                        cell.price_aed === 0
                                          ? "border-amber-400 bg-amber-50/50"
                                          : "border-black/15 bg-white"
                                      }`}
                                    />
                                  </div>
                                ) : (
                                  <div className="flex h-6 w-16 items-center justify-center text-xs text-masaar-black/30">
                                    —
                                  </div>
                                )}
                              </div>
                            </td>
                          );
                        })}

                        {/* Actions */}
                        <td className="px-3 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => setSelectedRouteId(route.id)}
                              title="Preview route rate card"
                              className={`rounded-md p-1.5 transition ${
                                isSelected
                                  ? "bg-pure-gold text-masaar-black"
                                  : "text-masaar-black/60 hover:bg-black/5 hover:text-masaar-black"
                              }`}
                            >
                              <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>

                            <Link
                              href={`/transfers/${route.slug}`}
                              target="_blank"
                              title="View on Public Website"
                              className="rounded-md p-1.5 text-masaar-black/60 hover:bg-black/5 hover:text-masaar-black"
                            >
                              <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </Link>
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

        {/* Right Sidebar — Route Preview (Matches inspiration screen exactly) */}
        <div className="xl:col-span-4">
          <div className="sticky top-6 rounded-xl border border-black/10 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-black/10 pb-3">
              <h3 className="font-serif text-lg font-bold text-masaar-black">Route Preview</h3>
              {selectedRoute && (
                <Link
                  href={`/transfers/${selectedRoute.slug}`}
                  target="_blank"
                  className="flex items-center gap-1 text-xs font-medium text-pure-gold hover:underline"
                >
                  <span>View on Website</span>
                  <svg className="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </Link>
              )}
            </div>

            {selectedRoute ? (
              <div className="space-y-4">
                {/* Route Hero Thumbnail */}
                <div className="relative aspect-16/9 w-full overflow-hidden rounded-lg border border-black/10">
                  <Image
                    src={selectedRoute.image_url || "/trips/jeddah-airport-to-makkah.webp"}
                    alt={selectedRoute.route_name}
                    fill
                    className="object-cover"
                    sizes="400px"
                  />
                </div>

                <div>
                  <h4 className="font-serif text-base font-bold text-masaar-black">
                    {selectedRoute.route_name}
                  </h4>
                  <span
                    className={`mt-1 inline-block rounded-md border px-2 py-0.5 text-xs font-medium ${getCategoryBadgeColor(
                      selectedRoute.transfer_type
                    )}`}
                  >
                    {getCategoryLabel(selectedRoute.transfer_type)} Transfer
                  </span>
                  <p className="mt-2 text-xs text-masaar-black/70 line-clamp-3">
                    {selectedRoute.description ||
                      "Private transfer arranged with care by Masaar Holidays."}
                  </p>
                </div>

                {/* Rates List for Selected Route */}
                <div className="space-y-2 border-t border-black/10 pt-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-masaar-black/50">
                    Configured Vehicle Rates
                  </p>

                  <div className="space-y-2">
                    {vehicles.map((v) => {
                      const key = `${selectedRoute.id}__${v.id}`;
                      const cell = rates[key] ?? { price_aed: 0, is_active: false };

                      return (
                        <div
                          key={v.id}
                          className={`flex items-center justify-between rounded-lg border p-2 text-xs transition ${
                            cell.is_active
                              ? "border-black/10 bg-white"
                              : "border-black/5 bg-gray-50/70 opacity-60"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="relative size-10 shrink-0 overflow-hidden rounded-md border border-black/10 bg-white p-0.5">
                              <Image
                                src={v.image_url}
                                alt={v.name}
                                fill
                                className="object-contain"
                                sizes="40px"
                              />
                            </div>
                            <div>
                              <p className="font-semibold text-masaar-black">{v.name}</p>
                              <div className="flex items-center gap-2 text-[11px] text-masaar-black/50">
                                <span>{v.passengers} Passengers</span>
                                <span>•</span>
                                <span>{v.luggage} Suitcases</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            {cell.is_active && cell.price_aed > 0 ? (
                              <span className="font-serif font-bold text-deep-gold">
                                AED {cell.price_aed}
                              </span>
                            ) : (
                              <span className="font-medium text-masaar-black/40">
                                Not Available
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer disclaimer note */}
                <div className="rounded-lg bg-amber-50 p-3 text-[11px] text-amber-800 border border-amber-200">
                  <p>
                    Prices shown are for reference. Update the rate card to change prices and vehicle availability.
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-masaar-black/50">Select a route to preview its active rates.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
