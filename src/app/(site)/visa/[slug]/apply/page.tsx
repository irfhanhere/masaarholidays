import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getVisaTypeBySlug } from "@/lib/data/public";
import { getPublicVisaProducts } from "@/lib/data/visa";
import { VisaApplicationFlow } from "@/components/site/VisaApplicationFlow";
import { buildPageMetadata } from "@/lib/i18n";
import { isTabbyCheckoutEnabled, getTabbyConfig } from "@/lib/tabby";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  if (slug === "umrah" || slug === "saudi") {
    return buildPageMetadata({
      path: `/visa/saudi-tourist/apply`,
      title: `Apply for Saudi Visa Online | Masaar Holidays`,
      description: `Complete your online application and secure payment for Saudi Visa. Fast, simple, and reliable processing from Masaar Holidays.`,
    });
  }

  if (slug === "golden-visa-assistance" || slug === "golden-visa" || slug === "uae-golden-visa") {
    return buildPageMetadata({
      path: `/visa/golden-visa-assistance`,
      title: `Enquire About UAE Golden Visa | Masaar Holidays`,
      description: `Dedicated guidance for UAE Golden Visa residency through Masaar Holidays.`,
    });
  }

  if (!["uae", "saudi-tourist"].includes(slug)) {
    return buildPageMetadata({
      path: `/visa`,
      title: `Visa Services | Masaar Holidays`,
      description: `Apply for your visa online with Masaar Holidays.`,
    });
  }

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

  // Handle aliases and redirects
  if (slug === "umrah" || slug === "saudi") {
    redirect("/visa/saudi-tourist/apply");
  }

  if (slug === "golden-visa-assistance" || slug === "golden-visa" || slug === "uae-golden-visa") {
    redirect("/visa/golden-visa-assistance#enquiry-form");
  }

  // Any other slug redirects to the public visa landing page
  if (!["uae", "saudi-tourist"].includes(slug)) {
    redirect("/visa");
  }

  const result = await getVisaTypeBySlug(slug);
  if (!result) notFound();

  const { visaType } = result;

  const products = await getPublicVisaProducts(slug);
  const tabbyEnabled = isTabbyCheckoutEnabled();
  const tabbySarAvailable = getTabbyConfig().isSarAvailable;

  return (
    <VisaApplicationFlow
      visaType={visaType}
      products={products}
      tabbyEnabled={tabbyEnabled}
      tabbySarAvailable={tabbySarAvailable}
    />
  );
}
