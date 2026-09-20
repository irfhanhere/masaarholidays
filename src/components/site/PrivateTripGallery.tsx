import Image from "next/image";

interface GalleryImage {
  src: string;
  alt: string;
}

export function PrivateTripGallery({
  images,
  destination,
}: {
  images: GalleryImage[];
  destination?: string;
}) {
  if (!images || images.length === 0) return null;

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold text-masaar-black sm:text-4xl">
          Photo Gallery
        </h2>
        <p className="mt-1 text-sm text-masaar-black/60">
          {destination
            ? `Moments from the ${destination} private sightseeing experience.`
            : "A glimpse of the places you'll visit."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {images.map((img, idx) => (
          <div
            key={idx}
            className="relative aspect-4/3 overflow-hidden rounded-xl bg-warm-ivory shadow-xs transition-transform duration-300 hover:scale-[1.02]"
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
