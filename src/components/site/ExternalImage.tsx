import Image, { type ImageProps } from "next/image";

const LEGACY_IMAGE_MAP: Record<string, string> = {
  "/brand/banners/umrah.png": "/brand/banners/umrah.webp",
  "/brand/banners/hajj.png": "/brand/banners/hajj.webp",
  "/brand/banners/destination.png": "/brand/banners/destination.webp",
  "/trips/DESTINATION IMAGE.png": "/trips/destination-image.webp",
  "/trips/DESTINATION IMAGE.webp": "/trips/destination-image.webp",
  "/trips/PRIVATE-TRIP-MAKKAH-CARD.png": "/trips/private-trip-makkah-card.webp",
  "/trips/PRIVATE-TRIP-MADINAH-CARD.png": "/trips/private-trip-madinah-card.webp",
  "/trips/PRIVATE-TRIP-MAKKAH-HERO.png": "/trips/private-trip-makkah-hero.webp",
  "/trips/PRIVATE-TRIP-MADINAH-HERO.jpg": "/trips/private-trip-madinah-hero.webp",
};

/**
 * For image_url fields the admin types in by hand (hotels, transfers,
 * packages) — arbitrary external hosts, not a fixed set we can allow-list
 * in next.config.ts. `unoptimized` skips Next's image optimizer (which
 * requires the source host to be configured) so these never 400/crash
 * with "hostname not configured", at the cost of no resize/format
 * optimization for that particular image.
 *
 * Images we actually control (files in /public, Supabase Storage once
 * that's wired up) should keep using next/image normally — don't reach
 * for this for those.
 */
export function ExternalImage({ unoptimized, ...props }: ImageProps) {
  let src = props.src;
  if (typeof src === "string") {
    if (LEGACY_IMAGE_MAP[src]) {
      src = LEGACY_IMAGE_MAP[src];
    } else if (src.startsWith("/brand/umrah-packages/") && src.endsWith(".jpg")) {
      src = src.replace(/\.jpg$/, ".webp");
    } else if (src.startsWith("/brand/hajj-packages/") && src.endsWith(".jpg")) {
      src = src.replace(/\.jpg$/, ".webp");
    }
  }

  // Optimize local images and https URLs through Next's optimizer by default
  const shouldSkipOptimization =
    unoptimized ?? (typeof src === "string" && !src.startsWith("/") && !src.startsWith("https://"));

  // alt is required by ImageProps (enforced at the call site by
  // TypeScript) — the lint rule just can't see through the spread.
  // eslint-disable-next-line jsx-a11y/alt-text
  return <Image {...props} src={src} unoptimized={shouldSkipOptimization} />;
}

