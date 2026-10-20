import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getVisaTypeBySlug } from "@/lib/data/public";
import { getPublicVisaProducts } from "@/lib/data/visa";
import { VisaApplicationFlow } from "@/components/site/VisaApplicationFlow";
import { buildPageMetadata } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await getVisaTypeBySlug(slug);
  if (!result) notFound();

  return buildPageMetadata({
    path: `/visa/${slug}/apply`,
    title: `Apply for ${result.visaType.name} Online | Masaar Holidays`,
    description: `Complete your online application and secure payment for ${result.visaType.name}. Fast, simple, and reliable processing from Masaar Holidays.`,
  });
}

export default async function VisaApplyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await getVisaTypeBySlug(slug);
  if (!result) notFound();

  const { visaType } = result;

  // If service mode is enquiry only, redirect to the detail page enquiry form
  if (visaType.service_mode === "enquiry" && !["uae", "saudi-tourist", "us"].includes(slug)) {
    redirect(`/visa/${slug}#enquiry-form`);
  }

  const products = await getPublicVisaProducts(slug);

  return <VisaApplicationFlow visaType={visaType} products={products} />;
}
