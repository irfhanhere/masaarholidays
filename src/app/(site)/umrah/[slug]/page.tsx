import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { UmrahInventoryDetailClient } from "@/components/site/UmrahInventoryDetailClient";
import {
  getPackageBySlugAndType,
  getPublishedUmrahInventoryConfigurations,
  getZiyaratPricingForPublic,
} from "@/lib/data/public";
import { buildPageMetadata } from "@/lib/i18n";

const SLUG_ALIASES: Record<string, string> = {
  "essential": "umrah-essential-placeholder",
  "essential-umrah": "umrah-essential-placeholder",
  "signature": "umrah-signature-placeholder",
  "signature-umrah": "umrah-signature-placeholder",
  "exclusive": "umrah-exclusive-placeholder",
  "exclusive-umrah": "umrah-exclusive-placeholder",
};

const PLACEHOLDER_CLEAN_MAP: Record<string, string> = {
  "umrah-essential-placeholder": "/umrah/essential",
  "umrah-signature-placeholder": "/umrah/signature",
  "umrah-exclusive-placeholder": "/umrah/exclusive",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const targetSlug = SLUG_ALIASES[slug] || slug;
  const detail = await getPackageBySlugAndType(targetSlug, "umrah");
  if (!detail) notFound();

  // If accessed directly via placeholder slug, force noindex and exclude from indexation
  const isPlaceholder = slug.includes("placeholder");

  return buildPageMetadata({
    path: `/umrah/${slug}`,
    title: detail.pkg.meta_title || `${detail.pkg.title} | Masaar Holidays`,
    description:
      detail.pkg.meta_description ||
      `${detail.pkg.title} — ${detail.pkg.duration_label ?? `${detail.pkg.duration_days} days`}, arranged through Masaar Holidays.`,
    ogImageUrl: detail.pkg.hero_image_url,
    noindex: isPlaceholder ? true : undefined,
  });
}

import { PackageSchema } from "@/components/site/PackageSchema";

export default async function UmrahPackageDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (PLACEHOLDER_CLEAN_MAP[slug]) {
    redirect(PLACEHOLDER_CLEAN_MAP[slug]);
  }

  const targetSlug = SLUG_ALIASES[slug] || slug;
  const detail = await getPackageBySlugAndType(targetSlug, "umrah");
  if (!detail) notFound();

  const [allConfigs, ziyaratData] = await Promise.all([
    getPublishedUmrahInventoryConfigurations(),
    getZiyaratPricingForPublic(),
  ]);

  const tierConfigs = allConfigs.filter((c) => c.package_id === detail.pkg.id);
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
        name={detail.pkg.title}
        description={detail.pkg.short_description || detail.pkg.meta_description || `${detail.pkg.title} package`}
        path={`/umrah/${slug}`}
        priceAed={minPrice && isFinite(minPrice) ? minPrice : detail.pkg.starting_price_aed}
        imageUrl={detail.pkg.hero_image_url}
        durationDays={detail.pkg.duration_days}
      />
      <UmrahInventoryDetailClient
        pkg={detail.pkg}
        tierConfigs={tierConfigs}
        ziyaratData={ziyaratData}
      />
    </>
  );
}
