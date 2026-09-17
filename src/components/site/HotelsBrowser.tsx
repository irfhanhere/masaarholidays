"use client";

import { useMemo, useState } from "react";
import { getWalkBucket, type HotelWithSummary, type WalkBucket } from "@/lib/hotel-format";
import { EmptyState, SectionHeading } from "./SectionHeading";
import { HotelCard } from "./HotelCard";
import { BedIcon, DocumentIcon } from "./icons";

type City = "Makkah" | "Madinah";
type WalkFilter = "all" | WalkBucket;
type RefundableFilter = "all" | "refundable" | "non-refundable";
type SortOrder = "default" | "price-asc" | "price-desc";

const CITY_TABS: { city: City; icon: (props: { className?: string }) => React.ReactElement }[] = [
  { city: "Makkah", icon: DocumentIcon },
  { city: "Madinah", icon: BedIcon },
];

const WALK_OPTIONS: { value: WalkFilter; label: string }[] = [
  { value: "all", label: "Any Walking Distance" },
  { value: "under5", label: "Under 5 min" },
  { value: "5to10", label: "5-10 min" },
  { value: "10plus", label: "10+ min" },
];

const selectClass =
  "flex-1 rounded-md border border-black/15 px-4 py-2.5 text-sm text-masaar-black focus:border-admin-primary focus:outline-none";

/**
 * Makkah/Madinah toggle plus REAL client-side filters (walking distance,
 * refundable, price sort) against the hotels already loaded for this
 * page — a browsing aid, not a live availability search, so everything
 * here runs against `hotels` in memory rather than issuing new queries.
 */
export function HotelsBrowser({ hotels }: { hotels: HotelWithSummary[] }) {
  const [activeCity, setActiveCity] = useState<City>("Makkah");
  const [walkFilter, setWalkFilter] = useState<WalkFilter>("all");
  const [refundableFilter, setRefundableFilter] = useState<RefundableFilter>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("default");

  const cityLabel = activeCity === "Makkah" ? "Makkah" : "Madinah";

  const visibleHotels = useMemo(() => {
    let result = hotels.filter((h) => h.city === activeCity);

    if (walkFilter !== "all") {
      result = result.filter((h) => getWalkBucket(h) === walkFilter);
    }
    if (refundableFilter !== "all") {
      result = result.filter((h) => h.isRefundable === (refundableFilter === "refundable"));
    }

    if (sortOrder !== "default") {
      result = [...result].sort((a, b) => {
        // Hotels with no known price sort to the end regardless of direction.
        if (a.minPriceAed == null) return 1;
        if (b.minPriceAed == null) return -1;
        return sortOrder === "price-asc" ? a.minPriceAed - b.minPriceAed : b.minPriceAed - a.minPriceAed;
      });
    }

    return result;
  }, [hotels, activeCity, walkFilter, refundableFilter, sortOrder]);

  return (
    <div>
      <div className="mb-10 flex flex-col gap-4 rounded-lg border border-black/10 bg-white p-5 lg:flex-row lg:items-center">
        <div className="flex gap-2">
          {CITY_TABS.map(({ city, icon: Icon }) => (
            <button
              key={city}
              type="button"
              onClick={() => setActiveCity(city)}
              className={`inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition-colors ${
                activeCity === city
                  ? "bg-pure-gold text-masaar-black"
                  : "border border-black/15 text-masaar-black hover:bg-warm-ivory"
              }`}
            >
              <Icon className="size-4" />
              {city}
            </button>
          ))}
        </div>

        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <select
            value={walkFilter}
            onChange={(e) => setWalkFilter(e.target.value as WalkFilter)}
            className={selectClass}
          >
            {WALK_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={refundableFilter}
            onChange={(e) => setRefundableFilter(e.target.value as RefundableFilter)}
            className={selectClass}
          >
            <option value="all">Any Cancellation Policy</option>
            <option value="refundable">Refundable</option>
            <option value="non-refundable">Non-refundable</option>
          </select>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as SortOrder)}
            className={selectClass}
          >
            <option value="default">Sort: Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      <section className="scroll-mt-24">
        <div>
          <div className="flex flex-wrap items-end justify-between gap-2">
            <SectionHeading eyebrow={cityLabel} title={`Hotels in ${cityLabel}`} align="left" />
            <p className="text-sm text-masaar-black/50">{visibleHotels.length} hotels available</p>
          </div>
          <p className="mt-2 text-sm text-masaar-black/70">
            From value stays to five-star comfort, each hotel is chosen for its proximity to the Haram and the quality of the stay — not simply the lowest rate.
          </p>
        </div>
        <div className="mt-8">
          {visibleHotels.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {visibleHotels.map((hotel) => (
                <HotelCard key={hotel.id} hotel={hotel} />
              ))}
            </div>
          ) : hotels.some((h) => h.city === activeCity) ? (
            <EmptyState
              title={`No ${cityLabel} hotels match these filters`}
              note="Try a different walking distance or cancellation policy."
            />
          ) : (
            <EmptyState title={`No ${cityLabel} hotels published yet`} />
          )}
        </div>
      </section>
    </div>
  );
}
