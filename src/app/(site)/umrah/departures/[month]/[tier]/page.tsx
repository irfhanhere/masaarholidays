import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getActiveUmrahDepartureMonthBySlug,
  getPackageBySlugAndType,
  getPublishedUmrahInventoryConfigurations,
} from "@/lib/data/public";
import { buildPageMetadata } from "@/lib/i18n";
import { UmrahJourneyPageClient } from "@/components/site/UmrahJourneyPageClient";
import { UMRAH_TIER_LABEL, UMRAH_TIER_SLUGS, isUmrahTierKey } from "@/lib/umrah-journey";
import type { PublicUmrahInventoryConfig } from "@/lib/data/public";

/**
 * A tier can have both a generic (month_id null) config and a
 * month-specific one for the same duration_nights (e.g. a one-off
 * "November 26" promo alongside the standard combined-package grid) — this
 * page is scoped to one month, so it must show exactly one option per
 * duration, preferring the month-specific config over the generic one
 * rather than listing both as if they were different durations.
 */
function selectConfigsForMonth(
  configs: PublicUmrahInventoryConfig[],
  monthId: string
): PublicUmrahInventoryConfig[] {
  const relevant = configs.filter((c) => c.month_id === monthId || c.month_id === null);
  const byDuration = new Map<number, PublicUmrahInventoryConfig>();
  for (const config of relevant) {
    const existing = byDuration.get(config.duration_nights);
    if (!existing || (existing.month_id === null && config.month_id === monthId)) {
      byDuration.set(config.duration_nights, config);
    }
  }
  return [...byDuration.values()].sort((a, b) => a.duration_nights - b.duration_nights);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ month: string; tier: string }>;
}): Promise<Metadata> {
  const { month: monthSlug, tier } = await params;
  if (!isUmrahTierKey(tier)) {
    return buildPageMetadata({ path: `/umrah/departures/${monthSlug}/${tier}`, title: "Umrah Journey | Masaar Holidays" });
  }
  const month = await getActiveUmrahDepartureMonthBySlug(monthSlug);
  const title = `${UMRAH_TIER_LABEL[tier]} Umrah — Makkah + Madinah${month ? ` | ${month.display_label}` : ""} | Masaar Holidays`;
  return buildPageMetadata({
    path: `/umrah/departures/${monthSlug}/${tier}`,
    title,
    description: `${UMRAH_TIER_LABEL[tier]} Umrah journey across Makkah and Madinah${month ? ` for ${month.display_label}` : ""}, arranged through Masaar Holidays.`,
  });
}

/**
 * The reusable Makkah+Madinah "journey" detail page for one tier in one
 * departure month — a single component drives all three tiers (Essential/
 * Signature/Exclusive) and every future month; nothing here is duplicated
 * per tier. Switching tiers is a Link to a sibling route (soft navigation,
 * no full reload); switching duration/occupancy is local client state.
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

  const [essentialDetail, signatureDetail, exclusiveDetail, allConfigs] = await Promise.all([
    getPackageBySlugAndType(UMRAH_TIER_SLUGS.essential, "umrah"),
    getPackageBySlugAndType(UMRAH_TIER_SLUGS.signature, "umrah"),
    getPackageBySlugAndType(UMRAH_TIER_SLUGS.exclusive, "umrah"),
    getPublishedUmrahInventoryConfigurations(),
  ]);

  const tierPackages = {
    essential: essentialDetail?.pkg ?? null,
    signature: signatureDetail?.pkg ?? null,
    exclusive: exclusiveDetail?.pkg ?? null,
  };

  const activePkg = tierPackages[tier];
  if (!activePkg) notFound();

  const combinedConfigs = allConfigs.filter((c) => c.journey_type === "makkah_madinah");

  const journeyConfigsByTier = {
    essential: selectConfigsForMonth(
      combinedConfigs.filter((c) => c.package_id === tierPackages.essential?.id),
      month.id
    ),
    signature: selectConfigsForMonth(
      combinedConfigs.filter((c) => c.package_id === tierPackages.signature?.id),
      month.id
    ),
    exclusive: selectConfigsForMonth(
      combinedConfigs.filter((c) => c.package_id === tierPackages.exclusive?.id),
      month.id
    ),
  };

  return (
    <UmrahJourneyPageClient
      month={month}
      activeTier={tier}
      tierPackages={tierPackages}
      journeyConfigsByTier={journeyConfigsByTier}
    />
  );
}
