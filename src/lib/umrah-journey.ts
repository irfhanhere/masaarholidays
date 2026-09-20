/** Shared between the Umrah Journey page (server) and its client component. */

// Same tier -> tier-master-package-slug mapping as /umrah/[slug]/page.tsx —
// one canonical `packages` row per tier that umrah_inventory_configurations
// rows attach to (see 0042_umrah_inventory_architecture.sql).
export const UMRAH_TIER_SLUGS = {
  essential: "umrah-essential-placeholder",
  signature: "umrah-signature-placeholder",
  exclusive: "umrah-exclusive-placeholder",
} as const;

export type UmrahTierKey = keyof typeof UMRAH_TIER_SLUGS;

export const UMRAH_TIER_ORDER: UmrahTierKey[] = ["essential", "signature", "exclusive"];

export function isUmrahTierKey(value: string): value is UmrahTierKey {
  return value in UMRAH_TIER_SLUGS;
}

export const UMRAH_TIER_LABEL: Record<UmrahTierKey, string> = {
  essential: "Essential",
  signature: "Signature",
  exclusive: "Exclusive",
};

export const UMRAH_TIER_DESCRIPTION: Record<UmrahTierKey, string> = {
  essential: "A seamless, budget-smart spiritual experience.",
  signature: "An elevated pilgrimage with prime locations and added comforts.",
  exclusive: "Uncompromised luxury with the best of both holy cities.",
};

export const UMRAH_TIER_HEADING: Record<UmrahTierKey, string> = {
  essential: "A Seamless, Budget-Smart Umrah Journey",
  signature: "An Elevated Pilgrimage, Prime Locations",
  exclusive: "Uncompromised Luxury, Two Holy Cities",
};

export const UMRAH_TIER_HERO_DESCRIPTION: Record<UmrahTierKey, string> = {
  essential:
    "A comfortable spiritual experience with private transfers, practical hotel stays and dedicated support throughout your journey.",
  signature:
    "A refined pilgrimage with prime walking proximity to both Holy Mosques, private transfers and dedicated concierge support.",
  exclusive:
    "The ultimate luxury experience, with Haram Plaza access in Makkah and VIP private transfers throughout your journey.",
};

export const UMRAH_JOURNEY_IMPORTANT_INFO = [
  "Prices are per person.",
  "Hotel availability is subject to confirmation.",
  "Similar hotel may be offered where applicable.",
  "Final arrangements are confirmed through WhatsApp.",
  "Visa processing is subject to applicable requirements.",
];
