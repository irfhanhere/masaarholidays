import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VisaDetailTemplate } from "@/components/site/VisaDetailTemplate";
import { getVisaTypeBySlug } from "@/lib/data/public";
import { buildPageMetadata } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await getVisaTypeBySlug(slug);
  if (!result) {
    return buildPageMetadata({ path: `/visa/${slug}`, title: "Visa Assistance | Masaar Holidays" });
  }
  const { visaType } = result;
  return buildPageMetadata({
    path: `/visa/${slug}`,
    title: visaType.meta_title || `${visaType.name} | Masaar Holidays`,
    description:
      visaType.meta_description ||
      visaType.hero_intro ||
      visaType.description ||
      `${visaType.name} guidance and support from Masaar Holidays.`,
    ogImageUrl: visaType.hero_image_url,
  });
}

/**
 * Shared template (components/site/VisaDetailTemplate.tsx) rendering
 * whichever visa type's data matches the slug — same layout for all 6
 * types, only the content differs. 404s when the slug doesn't match an
 * active visa_types row, same is_active-gated pattern as
 * /umrah/departures/[slug].
 */
export default async function VisaTypeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await getVisaTypeBySlug(slug);
  if (!result) notFound();

  return <VisaDetailTemplate visaType={result.visaType} documents={result.documents} />;
}
