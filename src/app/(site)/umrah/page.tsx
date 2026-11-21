import type { Metadata } from "next";
import {
  getPublishedPackages,
  getPublishedUmrahInventoryConfigurations,
  getPublishedFaqs,
  getAddonsCatalogForPublic,
  getActiveUmrahDepartureMonths,
} from "@/lib/data/public";
import { getMasaarPremiumPackage } from "@/lib/data/premium-package";
import { getMasaarBestSellingPackage } from "@/lib/data/best-selling-package";
import { buildStaticPageMetadata } from "@/lib/i18n";
import { UmrahLandingClient } from "@/components/site/UmrahLandingClient";
import { ServiceSchema } from "@/components/site/ServiceSchema";

// Admin-editable via Admin → Page SEO (page_seo table) — see buildStaticPageMetadata.
export async function generateMetadata(): Promise<Metadata> {
  return buildStaticPageMetadata({
    path: "/umrah",
    fallbackTitle: "Umrah Packages from UAE | Makkah & Madinah Packages | Masaar Holidays",
    fallbackDescription:
      "Explore thoughtfully planned Umrah packages from the UAE with Makkah and Madinah accommodation, flights, transfers and travel assistance. Find the right journey with Masaar Holidays.",
  });
}

export default async function UmrahPage() {
  const [
    packages,
    inventoryConfigs,
    faqs,
    addons,
    activeMonths,
    premiumPackage,
    bestSellingPackage,
  ] = await Promise.all([
    getPublishedPackages("umrah"),
    getPublishedUmrahInventoryConfigurations(),
    getPublishedFaqs("umrah"),
    getAddonsCatalogForPublic(),
    getActiveUmrahDepartureMonths(),
    getMasaarPremiumPackage(),
    getMasaarBestSellingPackage(),
  ]);

  // "View Journey Details" on the Makkah+Madinah section needs some month
  // to link into (the journey page is always scoped to a departure month) —
  // the soonest active one is the sensible default from a page that isn't
  // itself month-scoped.
  const defaultMonthSlug = activeMonths[0]?.slug ?? null;

  return (
    <>
      <ServiceSchema
        name="Umrah Travel Packages from UAE"
        serviceType="Umrah Pilgrimage Arrangements"
        description="Thoughtfully planned Umrah journeys and packages from the UAE with handpicked hotels in Makkah and Madinah, transport, and personal support."
        path="/umrah"
      />
      <UmrahLandingClient
        packages={packages}
        inventoryConfigs={inventoryConfigs}
        faqs={faqs}
        addons={addons}
        defaultMonthSlug={defaultMonthSlug}
        departureMonths={activeMonths}
        premiumPackage={premiumPackage}
        bestSellingPackage={bestSellingPackage}
      />
    </>
  );
}
