"use client";

import { useMemo, useState } from "react";
import type { HotelRow } from "@/lib/types/database";
import { EmptyState, SectionHeading } from "./SectionHeading";
import { HotelCard } from "./HotelCard";

type FacetKey = "board_basis" | "cancellation_policy" | "view_type";

const FACETS: { key: FacetKey; label: string }[] = [
  { key: "board_basis", label: "Board Basis" },
  { key: "cancellation_policy", label: "Cancellation Policy" },
  { key: "view_type", label: "View" },
];

/**
 * Faceted filters (masaar-client-data-round2.md, Section 2) — checkbox
 * options per facet are derived from whatever distinct values already
 * exist on active hotels (not a hardcoded list), so this stays correct as
 * real data is entered rather than needing a code change per value.
 * Counts recompute live against the hotels that already match every
 * OTHER selected facet, same "faceted count" behaviour as the reference.
 */
export function HotelsBrowser({ hotels }: { hotels: HotelRow[] }) {
  const [selected, setSelected] = useState<Record<FacetKey, Set<string>>>({
    board_basis: new Set(),
    cancellation_policy: new Set(),
    view_type: new Set(),
  });

  const facetOptions = useMemo(() => {
    const options: Record<FacetKey, string[]> = {
      board_basis: [],
      cancellation_policy: [],
      view_type: [],
    };
    for (const key of FACETS.map((f) => f.key)) {
      const values = new Set<string>();
      for (const hotel of hotels) {
        const value = hotel[key];
        if (value) values.add(value);
      }
      options[key] = [...values].sort();
    }
    return options;
  }, [hotels]);

  function matchesFacetsExcept(hotel: HotelRow, except: FacetKey | null) {
    for (const { key } of FACETS) {
      if (key === except) continue;
      const chosen = selected[key];
      if (chosen.size > 0 && !(hotel[key] && chosen.has(hotel[key]))) return false;
    }
    return true;
  }

  const filteredHotels = useMemo(
    () => hotels.filter((h) => matchesFacetsExcept(h, null)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hotels, selected]
  );

  function toggle(key: FacetKey, value: string) {
    setSelected((prev) => {
      const next = new Set(prev[key]);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return { ...prev, [key]: next };
    });
  }

  const hasAnyFacetOptions = FACETS.some((f) => facetOptions[f.key].length > 0);

  const makkahHotels = filteredHotels.filter((h) => h.city === "Makkah");
  const madinahHotels = filteredHotels.filter((h) => h.city === "Madinah");

  return (
    <div>
      {hasAnyFacetOptions && (
        <div className="mb-10 rounded-lg border border-black/10 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            {FACETS.map(({ key, label }) =>
              facetOptions[key].length > 0 ? (
                <fieldset key={key}>
                  <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-masaar-black/60">
                    {label}
                  </legend>
                  <div className="flex flex-col gap-1.5">
                    {facetOptions[key].map((value) => {
                      const count = hotels.filter(
                        (h) => h[key] === value && matchesFacetsExcept(h, key)
                      ).length;
                      const checked = selected[key].has(value);
                      return (
                        <label key={value} className="flex items-center gap-2 text-sm text-masaar-black/80">
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={count === 0 && !checked}
                            onChange={() => toggle(key, value)}
                            className="accent-[var(--color-pure-gold)]"
                          />
                          {value}
                          <span className="text-xs text-masaar-black/40">({count})</span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              ) : null
            )}
          </div>
          <p className="mt-4 text-xs text-masaar-black/50">
            Showing {filteredHotels.length} of {hotels.length} hotels.
          </p>
        </div>
      )}

      <section id="makkah" className="scroll-mt-24">
        <SectionHeading eyebrow="Makkah" title="Makkah Hotels Near Haram" align="left" />
        <div className="mt-8">
          {makkahHotels.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {makkahHotels.map((hotel) => (
                <HotelCard key={hotel.id} hotel={hotel} />
              ))}
            </div>
          ) : (
            <EmptyState
              title={hotels.some((h) => h.city === "Makkah") ? "No Makkah hotels match these filters" : "No Makkah hotels published yet"}
            />
          )}
        </div>
      </section>

      <section id="madinah" className="mt-16 scroll-mt-24">
        <SectionHeading eyebrow="Madinah" title="Madinah Accommodation" align="left" />
        <div className="mt-8">
          {madinahHotels.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {madinahHotels.map((hotel) => (
                <HotelCard key={hotel.id} hotel={hotel} />
              ))}
            </div>
          ) : (
            <EmptyState
              title={hotels.some((h) => h.city === "Madinah") ? "No Madinah hotels match these filters" : "No Madinah hotels published yet"}
              note={
                hotels.some((h) => h.city === "Madinah")
                  ? undefined
                  : "Real hotel names, categories and prices are pending the client's pricing/package document."
              }
            />
          )}
        </div>
      </section>
    </div>
  );
}
