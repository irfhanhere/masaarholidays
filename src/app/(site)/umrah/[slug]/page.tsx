import type { Metadata } from "next";
import { notFound } from "next/navigation";
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const targetSlug = SLUG_ALIASES[slug] || slug;
  const detail = await getPackageBySlugAndType(targetSlug, "umrah");
  if (!detail) return buildPageMetadata({ path: `/umrah/${slug}`, title: "Umrah Package | Masaar Holidays" });
  return buildPageMetadata({
    path: `/umrah/${slug}`,
    title: detail.pkg.meta_title || `${detail.pkg.title} | Masaar Holidays`,
    description:
      detail.pkg.meta_description ||
      `${detail.pkg.title} — ${detail.pkg.duration_label ?? `${detail.pkg.duration_days} days`}, arranged through Masaar Holidays.`,
    ogImageUrl: detail.pkg.hero_image_url,
  });
}

export default async function UmrahPackageDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const targetSlug = SLUG_ALIASES[slug] || slug;
  const detail = await getPackageBySlugAndType(targetSlug, "umrah");
  if (!detail) notFound();

  const [allConfigs, ziyaratData] = await Promise.all([
    getPublishedUmrahInventoryConfigurations(),
    getZiyaratPricingForPublic(),
  ]);

  const tierConfigs = allConfigs.filter((c) => c.package_id === detail.pkg.id);

  return (
    <UmrahInventoryDetailClient
      pkg={detail.pkg}
      tierConfigs={tierConfigs}
      ziyaratData={ziyaratData}
    />
  );
}
