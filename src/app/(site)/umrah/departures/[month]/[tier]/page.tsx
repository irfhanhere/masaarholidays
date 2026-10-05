import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getActiveUmrahDepartureMonthBySlug,
  getPackageBySlugAndType,
  getPublishedUmrahInventoryConfigurations,
  getZiyaratPricingForPublic,
} from "@/lib/data/public";
import { buildPageMetadata } from "@/lib/i18n";
import { UmrahInventoryDetailClient } from "@/components/site/UmrahInventoryDetailClient";
import { UMRAH_TIER_LABEL, UMRAH_TIER_SLUGS, isUmrahTierKey, type UmrahTierKey } from "@/lib/umrah-journey";
import { formatDepartureMonthName } from "@/lib/date-utils";
import { PackageSchema } from "@/components/site/PackageSchema";
import type { PublicUmrahInventoryConfig } from "@/lib/data/public";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ month: string; tier: string }>;
}): Promise<Metadata> {
  const { month: monthSlug, tier } = await params;
  if (!isUmrahTierKey(tier)) notFound();
  const month = await getActiveUmrahDepartureMonthBySlug(monthSlug);
  if (!month) notFound();

  const formattedMonth = formatDepartureMonthName(month.display_label);
  const tierLabel = UMRAH_TIER_LABEL[tier];

  // Pattern: "{Month} {Tier} Umrah | Masaar Holidays" (max 60 chars)
  const title = `${formattedMonth} ${tierLabel} Umrah | Masaar Holidays`;

  const descriptions: Record<UmrahTierKey, string> = {
    essential: `Affordable ${formattedMonth} Essential Umrah from UAE. 5-star VOCO Makkah with dedicated 24/7 Haram shuttle, guidance & care. Book with Masaar.`,
    signature: `Comfortable ${formattedMonth} Signature Umrah from UAE. Makkah Clock Tower stay within steps of the Haram and curated Madinah hotels. Book with Masaar.`,
    exclusive: `Luxury ${formattedMonth} Exclusive Umrah from UAE. Front-row Haram views at Dar Al Tawhid, VIP transfers & dedicated support. Reserve with Masaar.`,
  };

  return buildPageMetadata({
    path: `/umrah/departures/${monthSlug}/${tier}`,
    title: title.length > 60 ? title.slice(0, 57) + "..." : title,
    description: descriptions[tier],
  });
}

/**
 * Departure month tier detail page — renders the full, comprehensive
 * package layout (UmrahInventoryDetailClient) matching the main /umrah/[tier] pages,
 * with day-by-day itineraries, hotels, amenities, and add-on tours.
 */
export default async function UmrahJourneyPage({
  params,
}: {
  params: Promise<{ month: string; tier: string }>;
}) {
  const { month: monthSlug, tier } = await params;
  if (!isUmrahTierKey(tier)) notFound();

  const month = await getActiveUmrahDepartureMonthBySlug(monthSlug);
  if (!month) notFound();

  const targetSlug = UMRAH_TIER_SLUGS[tier];
  const [detail, allConfigs, ziyaratData] = await Promise.all([
    getPackageBySlugAndType(targetSlug, "umrah"),
    getPublishedUmrahInventoryConfigurations(),
    getZiyaratPricingForPublic(),
  ]);

  if (!detail) notFound();

  // Deduplicate and filter configs for this package & month:
  // Month-specific configs take precedence over generic (month_id === null) configs for the same duration & journey type.
  const packageConfigs = allConfigs.filter((c) => c.package_id === detail.pkg.id);
  const relevantConfigs = packageConfigs.filter((c) => c.month_id === month.id || c.month_id === null);

  const byKey = new Map<string, PublicUmrahInventoryConfig>();
  for (const config of relevantConfigs) {
    const key = `${config.journey_type}-${config.duration_nights}`;
    const existing = byKey.get(key);
    if (!existing || (existing.month_id === null && config.month_id === month.id)) {
      byKey.set(key, config);
    }
  }
  const tierConfigs = [...byKey.values()].sort((a, b) => a.duration_nights - b.duration_nights);

  const minPrice =
    tierConfigs.length > 0
      ? Math.min(
          ...tierConfigs
            .map((c) => c.min_price_aed || detail.pkg.starting_price_aed || 0)
            .filter((p) => p > 0)
        )
      : detail.pkg.starting_price_aed;

  return (
    <>
      <PackageSchema
        name={`${formatDepartureMonthName(month.display_label)} ${UMRAH_TIER_LABEL[tier]} Umrah`}
        description={`${UMRAH_TIER_LABEL[tier]} Umrah package for ${formatDepartureMonthName(month.display_label)} departures from the UAE across Makkah and Madinah.`}
        path={`/umrah/departures/${monthSlug}/${tier}`}
        priceAed={minPrice && isFinite(minPrice) ? minPrice : detail.pkg.starting_price_aed}
        imageUrl={detail.pkg.hero_image_url}
        durationDays={detail.pkg.duration_days}
      />
      <UmrahInventoryDetailClient
        pkg={detail.pkg}
        tierConfigs={tierConfigs}
        ziyaratData={ziyaratData}
        departureMonth={month}
      />
    </>
  );
}
