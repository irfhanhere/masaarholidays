import type { Metadata } from "next";
import {
  getPublishedPackages,
  getPublishedUmrahInventoryConfigurations,
  getPublishedFaqs,
  getAddonsCatalogForPublic,
  getActiveUmrahDepartureMonths,
} from "@/lib/data/public";
import { buildStaticPageMetadata } from "@/lib/i18n";
import { UmrahLandingClient } from "@/components/site/UmrahLandingClient";

// Admin-editable via Admin → Page SEO (page_seo table) — see buildStaticPageMetadata.
export async function generateMetadata(): Promise<Metadata> {
  return buildStaticPageMetadata({
    path: "/umrah",
    fallbackTitle: "Umrah Packages UAE | Masaar Holidays",
    fallbackDescription:
      "Umrah packages from the UAE, thoughtfully planned around your family — accommodation, transfers and personal support at every level of comfort.",
  });
}

export default async function UmrahPage() {
  const [packages, inventoryConfigs, faqs, addons, activeMonths] = await Promise.all([
    getPublishedPackages("umrah"),
    getPublishedUmrahInventoryConfigurations(),
    getPublishedFaqs("umrah"),
    getAddonsCatalogForPublic(),
    getActiveUmrahDepartureMonths(),
  ]);

  // "View Journey Details" on the Makkah+Madinah section needs some month
  // to link into (the journey page is always scoped to a departure month) —
  // the soonest active one is the sensible default from a page that isn't
  // itself month-scoped.
  const defaultMonthSlug = activeMonths[0]?.slug ?? null;

  return (
    <UmrahLandingClient
      packages={packages}
      inventoryConfigs={inventoryConfigs}
      faqs={faqs}
      addons={addons}
      defaultMonthSlug={defaultMonthSlug}
    />
  );
}
