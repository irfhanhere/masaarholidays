"use client";

import { useState } from "react";
import Image from "next/image";
import { TrainIcon, BusIcon, PlaneIcon } from "@/components/site/icons";
import type { PremiumPackageItineraryDay } from "@/lib/types/premium-package";

interface Props {
  itinerary: PremiumPackageItineraryDay[];
}

export function PremiumItineraryAccordion({ itinerary }: Props) {
  // Day 1 (index 0) open by default as requested
  const [openDays, setOpenDays] = useState<Record<number, boolean>>({ 0: true });

  const toggleDay = (index: number) => {
    setOpenDays((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const expandAll = () => {
    const all: Record<number, boolean> = {};
    itinerary.forEach((_, i) => (all[i] = true));
    setOpenDays(all);
  };

  const collapseAll = () => {
    setOpenDays({});
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-end gap-3 text-xs">
        <button
          type="button"
          onClick={expandAll}
          className="text-deep-gold hover:underline font-semibold"
        >
          Expand All Days
        </button>
        <span className="text-black/30">|</span>
        <button
          type="button"
          onClick={collapseAll}
          className="text-masaar-black/60 hover:text-masaar-black"
        >
          Collapse All
        </button>
      </div>

      <div className="space-y-4">
        {itinerary.map((day, idx) => {
          const isOpen = Boolean(openDays[idx]);
          const isTrain = day.transport_mode === "Haramain Speed Train" || day.activities.some((a) => a.toLowerCase().includes("haramain"));
          const isFlight = day.transport_mode === "Flight" || day.activities.some((a) => a.toLowerCase().includes("flight"));
          const isBus = day.transport_mode === "Bus" || (!isTrain && !isFlight && day.activities.some((a) => a.toLowerCase().includes("bus")));

          return (
            <div
              key={day.day_number}
              className={`overflow-hidden rounded-xl border transition-all ${
                isOpen
                  ? "border-pure-gold/50 bg-white shadow-sm ring-1 ring-pure-gold/20"
                  : "border-black/10 bg-white/90 hover:border-black/20"
              }`}
            >
              {/* Accordion Header */}
              <button
                type="button"
                onClick={() => toggleDay(idx)}
                aria-expanded={isOpen}
                className="flex w-full items-start justify-between gap-4 p-5 sm:items-center text-left"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-masaar-black px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                      Day {day.day_number}
                    </span>
                    <span className="text-xs font-semibold text-deep-gold">
                      {day.weekday}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-[family-name:var(--font-display)] text-base font-bold text-masaar-black sm:text-lg">
                      {day.title}
                    </h3>
                    {day.subtitle && (
                      <p className="text-xs text-masaar-black/60">{day.subtitle}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {/* Distinct Transport Badges */}
                  {isTrain ? (
                    <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800 border border-emerald-300">
                      <TrainIcon className="size-3.5 text-emerald-700" />
                      <span>Haramain Speed Train</span>
                    </span>
                  ) : isFlight ? (
                    <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-bold text-sky-800 border border-sky-200">
                      <PlaneIcon className="size-3.5 text-sky-700" />
                      <span>Saudi Airlines Flight</span>
                    </span>
                  ) : isBus ? (
                    <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-neutral-800 border border-neutral-200">
                      <BusIcon className="size-3.5 text-neutral-700" />
                      <span>Bus Transfer</span>
                    </span>
                  ) : null}

                  <span className="flex size-7 items-center justify-center rounded-full bg-warm-ivory text-masaar-black/70">
                    <svg
                      className={`size-4 transform transition-transform ${isOpen ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </div>
              </button>

              {/* Accordion Content */}
              {isOpen && (
                <div className="border-t border-black/5 bg-warm-ivory/20 p-5 sm:p-6">
                  {/* Mobile-only transport badge */}
                  <div className="mb-4 sm:hidden">
                    {isTrain ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800 border border-emerald-300">
                        <TrainIcon className="size-3.5 text-emerald-700" />
                        <span>Haramain Speed Train Journey</span>
                      </span>
                    ) : isFlight ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-bold text-sky-800 border border-sky-200">
                        <PlaneIcon className="size-3.5 text-sky-700" />
                        <span>Saudi Airlines Flight</span>
                      </span>
                    ) : isBus ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-neutral-800 border border-neutral-200">
                        <BusIcon className="size-3.5 text-neutral-700" />
                        <span>Air-Conditioned Bus</span>
                      </span>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:items-center">
                    {/* Activity Bullets */}
                    <div className={day.image_url ? "md:col-span-7" : "md:col-span-12"}>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-masaar-black/50 mb-3">
                        Day Schedule & Highlights:
                      </p>
                      <ul className="space-y-2.5 text-xs text-masaar-black/80">
                        {day.activities.map((act, i) => (
                          <li key={i} className="flex items-start gap-2.5 leading-relaxed">
                            <span className="mt-1 size-1.5 rounded-full bg-deep-gold shrink-0" />
                            <span>{act}</span>
                          </li>
                        ))}
                      </ul>

                      {day.transport_note && (
                        <div className="mt-4 rounded-lg border border-black/5 bg-white/80 p-3 text-xs text-masaar-black/70 flex items-center gap-2">
                          <span className="text-deep-gold font-bold">ℹ️ Transport Note:</span>
                          <span>{day.transport_note}</span>
                        </div>
                      )}
                    </div>

                    {/* Image if available */}
                    {day.image_url && (
                      <div className="md:col-span-5">
                        <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-black/10 shadow-xs">
                          <Image
                            src={day.image_url}
                            alt={day.image_alt || day.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 320px"
                          />
                        </div>
                        {isTrain && (
                          <p className="mt-1 text-[10px] text-center text-emerald-800 font-semibold">
                            🚆 High-Speed Haramain Train Included
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

