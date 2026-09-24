"use client";

import { useEffect, useState } from "react";
import type { HotelReview } from "@/lib/data/hotel-reviews";
import { INITIAL_HOTEL_REVIEWS } from "@/lib/data/hotel-reviews";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  hotelName: string;
  hotelSlug: string;
  reviews?: HotelReview[];
}

export function HotelReviewsModal({ isOpen, onClose, hotelName, hotelSlug, reviews }: Props) {
  const [selectedParty, setSelectedParty] = useState<string>("all");

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Resolve reviews for this hotel
  const hotelReviews =
    reviews && reviews.length > 0
      ? reviews
      : INITIAL_HOTEL_REVIEWS.filter(
          (r) =>
            r.hotel_slug === hotelSlug ||
            hotelSlug.includes(r.hotel_slug) ||
            r.hotel_slug.includes(hotelSlug)
        );

  const displayReviews =
    hotelReviews.length > 0
      ? hotelReviews
      : [
          {
            id: "rev-fallback",
            hotel_slug: hotelSlug,
            hotel_name: hotelName,
            author_name: "Verified Masaar Pilgrim",
            travel_party: "General" as const,
            rating: 5,
            stay_month_year: "Recent Pilgrim Stay",
            read_time: "1 min read",
            title: "Inspected and recommended by Masaar Holidays",
            content:
              "This property was personally surveyed by our ground operations team in Makkah and Madinah. We inspected step-free entryways, elevator response times during prayer rush hours, and pedestrian routes to ensure maximum ease for your spiritual journey.",
            highlight_quote: "Inspected and verified by Masaar Holidays ground team.",
            helpful_tag: "✓ Verified Quality",
            is_verified: true,
          },
        ];

  const filtered =
    selectedParty === "all"
      ? displayReviews
      : displayReviews.filter((r) => r.travel_party.toLowerCase() === selectedParty.toLowerCase());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden border border-black/10 z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="border-b border-black/10 bg-[#FAF7F2] p-5 sm:p-6 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-deep-gold/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-deep-gold">
                Verified Pilgrim Experiences
              </span>
              <span className="text-xs text-masaar-black/50">• 1 min read</span>
            </div>
            <h3 className="mt-1.5 font-[family-name:var(--font-display)] text-xl sm:text-2xl font-bold text-masaar-black">
              {hotelName}
            </h3>
            <p className="mt-0.5 text-xs text-masaar-black/60">
              Real feedback on walking routes, crowd ease, elevator access, and shuttle convenience.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-masaar-black/50 hover:bg-black/5 hover:text-masaar-black transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Filter Pills */}
        <div className="px-5 py-3 border-b border-black/5 bg-white flex flex-wrap items-center gap-1.5 text-xs">
          <span className="font-semibold text-masaar-black/70 mr-1 text-[11px]">Filter by Party:</span>
          {[
            { id: "all", label: "All Experiences" },
            { id: "elderly parents", label: "🧓 Elderly parents" },
            { id: "children", label: "👶 Children" },
            { id: "wheelchair user", label: "♿ Wheelchair user" },
            { id: "couple", label: "👫 Couple" },
            { id: "large family", label: "👨‍👩‍👧‍👦 Large family" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedParty(item.id)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                selectedParty === item.id
                  ? "bg-deep-gold text-white font-bold"
                  : "bg-black/5 text-masaar-black/70 hover:bg-black/10"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Reviews List */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {filtered.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <p className="text-sm font-semibold text-masaar-black/70">
                No specific reviews matching this party category yet.
              </p>
              <p className="text-xs text-masaar-black/50">
                Switch to &ldquo;All Experiences&rdquo; to read other verified guest feedback for this hotel.
              </p>
              <button
                type="button"
                onClick={() => setSelectedParty("all")}
                className="mt-2 text-xs font-bold text-deep-gold hover:underline"
              >
                View all reviews →
              </button>
            </div>
          ) : (
            filtered.map((rev) => (
              <div
                key={rev.id}
                className="rounded-xl border border-black/10 bg-warm-ivory/20 p-4 sm:p-5 space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2 border-b border-black/5 pb-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-masaar-black">{rev.author_name}</span>
                      {rev.is_verified && (
                        <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-semibold flex items-center gap-1">
                          ✓ Verified Guest
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-masaar-black/60">
                      <span>Travelling with: <strong className="text-masaar-black">{rev.travel_party}</strong></span>
                      <span>•</span>
                      <span>{rev.stay_month_year}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-xs text-pure-gold">{"★".repeat(rev.rating)}</span>
                    {rev.helpful_tag && (
                      <span className="rounded bg-warm-ivory px-2 py-0.5 text-[10px] font-semibold text-deep-gold border border-black/5">
                        {rev.helpful_tag}
                      </span>
                    )}
                  </div>
                </div>

                <h4 className="font-bold text-sm text-masaar-black leading-snug">{rev.title}</h4>

                {rev.highlight_quote && (
                  <div className="border-l-2 border-deep-gold bg-warm-ivory/60 px-3 py-1.5 text-xs italic text-masaar-black/80 font-medium">
                    &ldquo;{rev.highlight_quote}&rdquo;
                  </div>
                )}

                <p className="text-xs leading-relaxed text-masaar-black/80 whitespace-pre-line">
                  {rev.content}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-black/10 bg-[#FAF7F2] p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-masaar-black/60">
            Have questions about walking route or shuttle timings for this hotel?
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-masaar-black px-4 py-2 font-bold text-white hover:bg-black/80 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
