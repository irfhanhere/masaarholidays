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
  const detail = await getPackageBySlugAndType(slug, "hajj");
  if (!detail) return buildPageMetadata({ path: `/hajj/${slug}`, title: "Hajj Package | Masaar Holidays" });
  return buildPageMetadata({
    path: `/hajj/${slug}`,
    title: `${detail.pkg.title} | Masaar Holidays`,
    description: `${detail.pkg.title} — ${detail.pkg.duration_label ?? `${detail.pkg.duration_days} days`}, arranged through Masaar Holidays.`,
  });
}

export default async function HajjPackageDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PackageDetail type="hajj" slug={slug} />;
}
