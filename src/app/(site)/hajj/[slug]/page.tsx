import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PackageDetail } from "@/components/site/PackageDetail";
import { getPackageBySlugAndType } from "@/lib/data/public";
import { buildPageMetadata } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const detail = await getPackageBySlugAndType(slug, "hajj");
  if (!detail) notFound();

  const tier = slug.includes("essential")
    ? "Essential"
    : slug.includes("signature")
    ? "Signature"
    : slug.includes("exclusive")
    ? "Exclusive"
    : "Verified";

  const days = detail.pkg.duration_days;
  const title = `${days}-Day ${tier} Hajj from UAE | Masaar Holidays`;

  let description = detail.pkg.meta_description;
  if (!description || description.length > 155 || description.length < 120) {
    if (slug === "hajj-exclusive-10-days") {
      description =
        "Book our 10-Day Exclusive non-shifting Hajj package from UAE. Clock Tower stay, Category A Mina camps, direct flights & full support. Plan with Masaar.";
    } else {
      description = `Book our ${days}-Day ${tier} Hajj package from UAE. Category A Mina tents, curated hotels, direct flights, and full support. Plan with Masaar today.`;
    }
  }

  return buildPageMetadata({
    path: `/hajj/${slug}`,
    title: title.length > 60 ? title.slice(0, 57) + "..." : title,
    description,
    ogImageUrl: detail.pkg.hero_image_url,
  });
}

import { PackageSchema } from "@/components/site/PackageSchema";

export default async function HajjPackageDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const detail = await getPackageBySlugAndType(slug, "hajj");
  if (!detail) notFound();

  return (
    <>
      <PackageSchema
        name={detail.pkg.title}
        description={detail.pkg.short_description || detail.pkg.meta_description || `${detail.pkg.title} package`}
        path={`/hajj/${slug}`}
        priceAed={detail.pkg.starting_price_aed}
        imageUrl={detail.pkg.hero_image_url}
        durationDays={detail.pkg.duration_days}
      />
      <PackageDetail type="hajj" slug={slug} />
    </>
  );
}
