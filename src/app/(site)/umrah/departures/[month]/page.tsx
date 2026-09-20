import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getActiveUmrahDepartureMonthBySlug,
  getActiveUmrahDepartureMonths,
  getPublishedPackages,
  getPublishedUmrahInventoryConfigurations,
} from "@/lib/data/public";
import { buildPageMetadata } from "@/lib/i18n";
import { UmrahMonthPageClient } from "@/components/site/UmrahMonthPageClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ month: string }>;
}): Promise<Metadata> {
  const { month: monthSlug } = await params;
  const month = await getActiveUmrahDepartureMonthBySlug(monthSlug);
  if (!month) {
    return buildPageMetadata({ path: `/umrah/departures/${monthSlug}`, title: "Umrah Departures | Masaar Holidays" });
  }
  return buildPageMetadata({
    path: `/umrah/departures/${monthSlug}`,
    title: month.meta_title || `Umrah Packages — ${month.display_label} | Masaar Holidays`,
    description:
      month.meta_description ||
      month.hero_subtext ||
      `Umrah packages for ${month.display_label} departures, arranged through Masaar Holidays.`,
    ogImageUrl: month.hero_image_url,
  });
}

/**
 * Umrah "Departure Month" landing page — same template for every month
 * (hero content is the only thing that varies, entirely from the
 * umrah_departure_months admin fields), showing the same Essential/
 * Signature/Exclusive package cards used on the main /umrah page. 404s
 * when the month isn't published — same is_active-gated query the sitemap
 * and the header nav dropdown both use, so an inactive month can't be
 * reached or discovered anywhere.
 */
export default async function UmrahDepartureMonthPage({
  params,
}: {
  params: Promise<{ month: string }>;
}) {
  const { month: monthSlug } = await params;
  const month = await getActiveUmrahDepartureMonthBySlug(monthSlug);
  if (!month) notFound();

  const [packages, inventoryConfigs, activeMonths] = await Promise.all([
    getPublishedPackages("umrah"),
    getPublishedUmrahInventoryConfigurations(),
    getActiveUmrahDepartureMonths(),
  ]);

  const currentIndex = activeMonths.findIndex((m) => m.slug === month.slug);
  const nextMonth = currentIndex >= 0 ? (activeMonths[currentIndex + 1] ?? null) : null;

  return (
    <UmrahMonthPageClient
      month={month}
      nextMonth={nextMonth}
      packages={packages}
      inventoryConfigs={inventoryConfigs}
    />
  );
}
