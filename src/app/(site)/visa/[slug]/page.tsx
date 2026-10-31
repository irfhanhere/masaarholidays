import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { VisaDetailTemplate } from "@/components/site/VisaDetailTemplate";
import { getVisaTypeBySlug } from "@/lib/data/public";
import { buildPageMetadata } from "@/lib/i18n";
import { getPublicVisaProducts } from "@/lib/data/visa";

const RETAINED_SLUGS = ["uae", "saudi-tourist", "golden-visa-assistance"];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  if (slug === "umrah" || slug === "saudi") {
    return buildPageMetadata({
      path: `/visa/${slug}`,
      title: "Saudi Visa | Masaar Holidays",
      description: "Official tourist e-visa assistance for exploring Saudi Arabia.",
    });
  }

  if (slug === "golden-visa" || slug === "uae-golden-visa") {
    return buildPageMetadata({
      path: `/visa/${slug}`,
      title: "UAE Golden Visa | Masaar Holidays",
      description: "Guidance and support for the UAE 10-year Golden Visa.",
    });
  }

  if (!RETAINED_SLUGS.includes(slug)) {
    return buildPageMetadata({
      path: `/visa/${slug}`,
      title: "Visa Services | Masaar Holidays",
      description: "Visa and document assistance from Masaar Holidays.",
    });
  }

  const result = await getVisaTypeBySlug(slug);
  if (!result) notFound();
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

export default async function VisaTypeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Gracefully redirect retired or alias slugs
  if (slug === "umrah" || slug === "saudi") {
    redirect("/visa/saudi-tourist");
  }

  if (slug === "golden-visa" || slug === "uae-golden-visa") {
    redirect("/visa/golden-visa-assistance");
  }

  // Any other retired slug (e.g. us, global, india) redirects to the main /visa page
  if (!RETAINED_SLUGS.includes(slug)) {
    redirect("/visa");
  }

  const result = await getVisaTypeBySlug(slug);
  if (!result) notFound();

  const products = await getPublicVisaProducts(slug);

  return (
    <VisaDetailTemplate
      visaType={result.visaType}
      documents={result.documents}
      products={products}
    />
  );
}
