"use client";

import { useRef } from "react";
import Image from "next/image";

interface GalleryImage {
  src: string;
  alt: string;
}

export function PrivateTripGallery({ images }: { images: GalleryImage[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scroll(direction: "left" | "right") {
    if (!scrollRef.current) return;
    const offset = direction === "left" ? -320 : 320;
    scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
  }

  if (!images || images.length === 0) return null;

  return (
    <div className="relative">
      {/* Header with Navigation Controls */}
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold text-masaar-black sm:text-4xl">
            Photo Gallery
          </h2>
          <p className="mt-1 text-sm text-masaar-black/60">
            A glimpse of the places you&apos;ll visit.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scroll("left")}
            aria-label="Previous photos"
            className="flex size-10 items-center justify-center rounded-full border border-black/15 bg-white text-masaar-black transition-colors hover:border-deep-gold hover:text-deep-gold"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            aria-label="Next photos"
            className="flex size-10 items-center justify-center rounded-full border border-black/15 bg-white text-masaar-black transition-colors hover:border-deep-gold hover:text-deep-gold"
          >
            →
          </button>
        </div>
      </div>

      {/* Scrolling Photos Track */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {images.map((img, idx) => (
          <div
            key={idx}
            className="relative h-60 w-80 shrink-0 snap-start overflow-hidden rounded-xl bg-warm-ivory shadow-xs transition-transform duration-300 hover:scale-[1.02]"
          >
            <Image
              src={img.src}
              alt={img.alt || `Trip photo ${idx + 1}`}
              fill
              className="object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
