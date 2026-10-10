"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { EnrichedTransferRoute, TransferType } from "@/lib/data/transfers-catalog";
import { TRANSFER_CATEGORIES } from "@/lib/data/transfers-catalog";

interface Props {
  routes: EnrichedTransferRoute[];
}

export function TransfersCatalogueClient({ routes }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const searchInputId = useId();

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: routes.length };
    for (const r of routes) {
      counts[r.transfer_type] = (counts[r.transfer_type] || 0) + 1;
    }
    return counts;
  }, [routes]);

  // Filtered routes
  const filteredRoutes = useMemo(() => {
    return routes.filter((r) => {
      const matchesCategory =
        selectedCategory === "all" || r.transfer_type === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.route_name.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q)) ||
        (r.pickupLocation && r.pickupLocation.toLowerCase().includes(q)) ||
        (r.dropoffLocation && r.dropoffLocation.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [routes, selectedCategory, searchQuery]);

  const categories = [
    { id: "all", label: "All Transfers", count: categoryCounts.all || 0 },
    {
      id: "airport",
      label: "Airport Transfers",
      count: categoryCounts.airport || 0,
      icon: (
        <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      ),
    },
    {
      id: "intercity",
      label: "Intercity Transfers",
      count: categoryCounts.intercity || 0,
      icon: (
        <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
    },
    {
      id: "ziyarat",
      label: "Ziyarat",
      count: categoryCounts.ziyarat || 0,
      icon: (
        <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      id: "train",
      label: "Train Station Transfers",
      count: categoryCounts.train || 0,
      icon: (
        <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      id: "day-trip",
      label: "Day Trips",
      count: categoryCounts["day-trip"] || 0,
      icon: (
        <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
        </svg>
      ),
    },
  ];

  return (
    <div id="transfer-routes" className="scroll-mt-16">
      {/* Search & Category Filter Bar */}
      <div className="space-y-6">
        {/* Search Input */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <svg
              className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-masaar-black/40"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <label htmlFor={searchInputId} className="sr-only">
              Search transfer routes
            </label>
            <input
              id={searchInputId}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search transfer routes (e.g. Jeddah, Madinah, Taif)..."
              className="w-full rounded-full border border-black/10 bg-white py-2.5 pl-10 pr-4 text-sm text-masaar-black placeholder:text-masaar-black/40 focus:border-deep-gold focus:outline-none focus:ring-1 focus:ring-deep-gold"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-masaar-black/40 hover:text-masaar-black"
                aria-label="Clear search"
              >
                Clear
              </button>
            )}
          </div>

          <div className="text-xs text-masaar-black/60">
            Showing <strong className="text-masaar-black">{filteredRoutes.length}</strong> of {routes.length} transfer routes
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 border-b border-black/10 pb-4">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                  isSelected
                    ? "bg-masaar-black text-white shadow-sm"
                    : "border border-black/10 bg-white text-masaar-black/70 hover:border-black/25 hover:text-masaar-black"
                }`}
              >
                {cat.icon && <span className={isSelected ? "text-deep-gold" : "text-masaar-black/50"}>{cat.icon}</span>}
                <span>{cat.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                    isSelected ? "bg-white/20 text-white" : "bg-black/5 text-masaar-black/60"
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Routes Grid */}
      <div className="mt-8">
        {filteredRoutes.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredRoutes.map((route) => {
              const catMeta = (TRANSFER_CATEGORIES as Record<string, any>)[route.transfer_type] || TRANSFER_CATEGORIES.other;
              return (
                <div
                  key={route.id}
                  className="group flex flex-col overflow-hidden rounded-xl border border-black/10 bg-white shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-deep-gold/40 hover:shadow-md"
                >
                  {/* Image Container */}
                  <Link
                    href={`/transfers/${route.slug}`}
                    className="relative aspect-16/10 w-full overflow-hidden bg-warm-ivory block"
                    aria-label={`View transfer vehicles and details for ${route.route_name}`}
                  >
                    <Image
                      src={route.image_url || "/brand/banners/default.webp"}
                      alt={`Private transfer service for ${route.route_name}`}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

                    {/* Category Badge */}
                    <div className="absolute left-3 top-3">
                      <span className="rounded-full bg-masaar-black/85 px-3 py-1 text-[11px] font-semibold tracking-wide text-white backdrop-blur-xs">
                        {catMeta.badge}
                      </span>
                    </div>

                    {/* Duration Badge */}
                    {route.durationText && (
                      <div className="absolute bottom-3 left-3">
                        <span className="inline-flex items-center gap-1 rounded-md bg-white/90 px-2 py-0.5 text-[11px] font-medium text-masaar-black backdrop-blur-xs">
                          <svg className="size-3 text-deep-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {route.durationText}
                        </span>
                      </div>
                    )}
                  </Link>

                  {/* Content Container */}
                  <div className="flex flex-1 flex-col justify-between p-5">
                    <div>
                      <h3 className="text-base font-bold text-masaar-black transition-colors group-hover:text-deep-gold">
                        {route.route_name}
                      </h3>

                      {route.description && (
                        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-masaar-black/65">
                          {route.description}
                        </p>
                      )}

                      {/* Pickup & Destination Details */}
                      <div className="mt-4 space-y-1 border-t border-black/5 pt-3 text-[11px] text-masaar-black/60">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-deep-gold">●</span>
                          <span className="font-medium text-masaar-black/80">From:</span>
                          <span className="truncate">{route.pickupLocation}</span>
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-masaar-black/40">●</span>
                          <span className="font-medium text-masaar-black/80">To:</span>
                          <span className="truncate">{route.dropoffLocation}</span>
                        </div>
                      </div>

                      {/* Available Vehicles Pill List */}
                      {route.availableVehicles.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {route.availableVehicles.slice(0, 3).map((v) => (
                            <span
                              key={v.vehicleId}
                              className="rounded bg-warm-ivory/80 px-2 py-0.5 text-[10px] font-medium text-masaar-black/75"
                            >
                              {v.vehicleName}
                            </span>
                          ))}
                          {route.availableVehicles.length > 3 && (
                            <span className="rounded bg-warm-ivory/80 px-1.5 py-0.5 text-[10px] font-medium text-masaar-black/50">
                              +{route.availableVehicles.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Price and CTA */}
                    <div className="mt-5 flex items-center justify-between border-t border-black/5 pt-4">
                      <div>
                        {route.startingPriceAed ? (
                          <>
                            <span className="text-[10px] uppercase tracking-wider text-masaar-black/50">From</span>
                            <div className="flex items-baseline gap-1">
                              <span className="text-xs font-semibold text-deep-gold">AED</span>
                              <span className="text-lg font-bold text-masaar-black">
                                {route.startingPriceAed}
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="text-xs font-semibold text-masaar-black/60">Enquiry Only</div>
                        )}
                      </div>

                      <Link
                        href={`/transfers/${route.slug}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-masaar-black px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-deep-gold"
                      >
                        <span>View Vehicles</span>
                        <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-black/10 bg-warm-ivory/40 p-12 text-center">
            <svg
              className="mx-auto size-12 text-masaar-black/30"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h3 className="mt-3 text-base font-semibold text-masaar-black">No transfer routes found</h3>
            <p className="mt-1 text-xs text-masaar-black/60">
              No routes matched your search criteria. Try clearing filters or searching for another city.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("all");
                setSearchQuery("");
              }}
              className="mt-4 inline-flex items-center rounded-lg bg-masaar-black px-4 py-2 text-xs font-semibold text-white hover:bg-deep-gold"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
