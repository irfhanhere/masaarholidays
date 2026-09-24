"use client";

import { useState } from "react";
import type { HotelReview } from "@/lib/data/hotel-reviews";
import { createHotelReviewAction, deleteHotelReviewAction } from "./review-actions";

interface Props {
  hotelId: string;
  hotelSlug: string;
  hotelName: string;
  initialReviews: HotelReview[];
}

export function HotelReviewsManager({ hotelId, hotelSlug, hotelName, initialReviews }: Props) {
  const [reviews, setReviews] = useState<HotelReview[]>(initialReviews);
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;
    setReviews(reviews.filter((r) => r.id !== id));
    await deleteHotelReviewAction(id, hotelId);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.append("hotel_id", hotelId);
    formData.append("hotel_slug", hotelSlug);
    formData.append("hotel_name", hotelName);

    const res = await createHotelReviewAction(formData);
    setIsSubmitting(false);

    if (res.error) {
      setError(res.error);
    } else {
      setIsAdding(false);
      // Reload page to re-fetch
      window.location.reload();
    }
  };

  return (
    <div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-masaar-black">
              Guest Experiences &amp; Reviews
            </h2>
            <span className="rounded-full bg-deep-gold/15 px-2.5 py-0.5 text-xs font-bold text-deep-gold">
              {reviews.length} Experiences
            </span>
          </div>
          <p className="mt-1 text-xs text-masaar-black/60">
            Real pilgrim experiences shown in the &ldquo;View Reviews (1 min read)&rdquo; modal on package and hotel cards.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAdding(!isAdding)}
          className="rounded-lg bg-deep-gold px-4 py-2 text-xs font-bold text-white hover:bg-deep-gold/90 transition-colors shadow-2xs"
        >
          {isAdding ? "Cancel" : "+ Add Guest Review"}
        </button>
      </div>

      {/* Add Review Form */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-deep-gold/30 bg-warm-ivory/30 p-5 space-y-4">
          <h3 className="text-sm font-bold text-masaar-black">Add Verified Pilgrim Experience</h3>

          {error && <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded border border-red-200">{error}</p>}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-masaar-black">Pilgrim / Author Name *</label>
              <input
                type="text"
                name="author_name"
                required
                placeholder="e.g. Dr. Farooq & Parents (Sharjah)"
                className="mt-1 w-full rounded-md border border-black/15 bg-white px-3 py-2 text-xs text-masaar-black focus:border-deep-gold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-masaar-black">Travelling Party Type *</label>
              <select
                name="travel_party"
                className="mt-1 w-full rounded-md border border-black/15 bg-white px-3 py-2 text-xs text-masaar-black focus:border-deep-gold focus:outline-none"
              >
                <option value="Elderly parents">🧓 Elderly parents</option>
                <option value="Children">👶 Children / Young family</option>
                <option value="Wheelchair user">♿ Wheelchair user</option>
                <option value="Couple">👫 Couple</option>
                <option value="Large family">👨‍👩‍👧‍👦 Large family</option>
                <option value="General">General</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-masaar-black">Rating (Stars)</label>
              <select
                name="rating"
                defaultValue="5"
                className="mt-1 w-full rounded-md border border-black/15 bg-white px-3 py-2 text-xs text-masaar-black focus:border-deep-gold focus:outline-none"
              >
                <option value="5">★★★★★ (5 Stars)</option>
                <option value="4">★★★★☆ (4 Stars)</option>
                <option value="3">★★★☆☆ (3 Stars)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-masaar-black">Stay Date</label>
              <input
                type="text"
                name="stay_month_year"
                defaultValue="January 2026"
                placeholder="e.g. January 2026"
                className="mt-1 w-full rounded-md border border-black/15 bg-white px-3 py-2 text-xs text-masaar-black focus:border-deep-gold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-masaar-black">Key Takeaway Tag</label>
              <input
                type="text"
                name="helpful_tag"
                placeholder="e.g. 🟢 Flat Route & Step-Free or 🚌 24/7 Shuttle"
                className="mt-1 w-full rounded-md border border-black/15 bg-white px-3 py-2 text-xs text-masaar-black focus:border-deep-gold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-masaar-black">Review Title *</label>
              <input
                type="text"
                name="title"
                required
                placeholder="e.g. Air-conditioned private bridge directly to King Fahd Gate"
                className="mt-1 w-full rounded-md border border-black/15 bg-white px-3 py-2 text-xs text-masaar-black focus:border-deep-gold focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-masaar-black">Highlight Quote (Shown in Gold Callout)</label>
            <input
              type="text"
              name="highlight_quote"
              placeholder="e.g. Private pedestrian bridge directly to the courtyard — no vehicle crossings."
              className="mt-1 w-full rounded-md border border-black/15 bg-white px-3 py-2 text-xs text-masaar-black focus:border-deep-gold focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-masaar-black">Full Experience Details *</label>
            <textarea
              name="content"
              required
              rows={4}
              placeholder="Detailed pilgrim feedback covering walking time, crowd access, shuttle frequency, elevator comfort, etc."
              className="mt-1 w-full rounded-md border border-black/15 bg-white px-3 py-2 text-xs text-masaar-black focus:border-deep-gold focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="rounded-md border border-black/20 bg-white px-4 py-2 text-xs font-medium text-masaar-black hover:bg-black/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-masaar-black px-5 py-2 text-xs font-bold text-white hover:bg-black/80 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Review"}
            </button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      <div className="space-y-3">
        {reviews.length === 0 ? (
          <p className="text-xs text-masaar-black/50 italic py-4 text-center">
            No guest experiences recorded yet for this hotel. Click &ldquo;+ Add Guest Review&rdquo; to add one.
          </p>
        ) : (
          reviews.map((rev) => (
            <div
              key={rev.id}
              className="rounded-xl border border-black/10 bg-warm-ivory/20 p-4 space-y-2.5 transition-all hover:border-black/20"
            >
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-black/5 pb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-masaar-black">{rev.author_name}</span>
                    <span className="rounded bg-black/10 px-2 py-0.5 text-[10px] font-semibold text-masaar-black">
                      {rev.travel_party}
                    </span>
                    {rev.is_verified && (
                      <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                        ✓ Verified
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-masaar-black/50">{rev.stay_month_year}</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-pure-gold">{"★".repeat(rev.rating)}</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(rev.id)}
                    className="text-xs text-red-600 hover:text-red-800 font-semibold"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <h4 className="font-bold text-xs text-masaar-black">{rev.title}</h4>

              {rev.highlight_quote && (
                <div className="border-l-2 border-deep-gold bg-warm-ivory/60 px-3 py-1 text-xs italic text-masaar-black/80 font-medium">
                  &ldquo;{rev.highlight_quote}&rdquo;
                </div>
              )}

              <p className="text-xs leading-relaxed text-masaar-black/75 whitespace-pre-line">{rev.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
