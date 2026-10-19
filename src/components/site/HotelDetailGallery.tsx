"use client";

import { useState } from "react";
import { ExternalImage } from "./ExternalImage";

interface Props {
  images: string[];
  hotelName: string;
  category?: string | null;
  walkTime?: string | null;
}

export function HotelDetailGallery({ images, hotelName, category = "Premium", walkTime = "2 min walk" }: Props) {
  // Ensure we have at least a few images to display
  const allImages = images.length > 0 ? images : ["/brand/banners/hotel.webp", "/images/hotels/voco-makkah.jpg"];
  const [activeIndex, setActiveIndex] = useState(0);

  const prevImage = () => {
    setActiveIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const nextImage = () => {
    setActiveIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-3">
      {/* Main Image Showcase */}
      <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-warm-ivory shadow-xs border border-black/10">
        <ExternalImage
          src={allImages[activeIndex] || allImages[0]}
          alt={`${hotelName} photo ${activeIndex + 1}`}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 55vw"
          className="object-cover transition-all duration-300"
        />

        {/* Top Badges matching H03 */}
        <div className="absolute left-4 top-4 flex items-center gap-2">
          {walkTime && (
            <span className="rounded-md bg-[#C9A227] px-3 py-1 text-xs font-bold text-white shadow-xs">
              {walkTime}
            </span>
          )}
          {category && (
            <span className="rounded-md bg-masaar-black/80 backdrop-blur-xs px-3 py-1 text-xs font-semibold text-white shadow-xs">
              {category}
            </span>
          )}
        </div>

        {/* Photo Counter */}
        <div className="absolute right-4 bottom-4 rounded-md bg-masaar-black/75 backdrop-blur-xs px-2.5 py-1 text-[11px] font-mono font-medium text-white shadow-xs">
          {activeIndex + 1} / {allImages.length}
        </div>

        {/* Prev / Next Arrows matching H03 */}
        {allImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={prevImage}
              className="absolute left-3 top-1/2 -translate-y-1/2 flex size-9 items-center justify-center rounded-full bg-white/90 backdrop-blur-xs text-masaar-black shadow-md hover:bg-white transition"
              aria-label="Previous photo"
            >
              &#8249;
            </button>
            <button
              type="button"
              onClick={nextImage}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex size-9 items-center justify-center rounded-full bg-white/90 backdrop-blur-xs text-masaar-black shadow-md hover:bg-white transition"
              aria-label="Next photo"
            >
              &#8250;
            </button>
          </>
        )}
      </div>

      {/* Thumbnails Row matching H03 */}
      {allImages.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {allImages.slice(0, 5).map((img, idx) => {
            const isLast = idx === 4 && allImages.length > 5;
            const remainingCount = allImages.length - 5;

            return (
              <button
                key={img + idx}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={`relative aspect-[4/3] rounded-xl overflow-hidden border transition-all ${
                  activeIndex === idx
                    ? "border-[#C9A227] ring-2 ring-[#C9A227]/40"
                    : "border-black/10 opacity-70 hover:opacity-100"
                }`}
              >
                <ExternalImage src={img} alt={`${hotelName} thumbnail ${idx + 1}`} fill className="object-cover" />
                {isLast && remainingCount > 0 && (
                  <div className="absolute inset-0 bg-masaar-black/70 flex items-center justify-center text-white font-bold text-xs">
                    +{remainingCount} Photos
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
