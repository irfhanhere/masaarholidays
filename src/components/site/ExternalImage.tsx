import Image, { type ImageProps } from "next/image";

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
export function ExternalImage(props: ImageProps) {
  // alt is required by ImageProps (enforced at the call site by
  // TypeScript) — the lint rule just can't see through the spread.
  // eslint-disable-next-line jsx-a11y/alt-text
  return <Image {...props} unoptimized />;
}
