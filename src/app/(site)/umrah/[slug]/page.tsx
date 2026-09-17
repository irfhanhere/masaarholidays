import type { Metadata } from "next";
import { PackageDetail } from "@/components/site/PackageDetail";
import { getPackageBySlugAndType } from "@/lib/data/public";
import { buildPageMetadata } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const detail = await getPackageBySlugAndType(slug, "umrah");
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
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const { slug } = await params;
  const { month } = await searchParams;
  return <PackageDetail type="umrah" slug={slug} departureMonthSlug={month} />;
}
