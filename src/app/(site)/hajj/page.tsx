import type { Metadata } from "next";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { Container } from "@/components/site/Container";
import { HajjHero } from "@/components/site/HajjHero";
import { HajjPackageGrid } from "@/components/site/HajjPackageGrid";
import { HajjLeadCaptureForm } from "@/components/site/HajjLeadCaptureForm";
import { ImportantNotice } from "@/components/site/ImportantNotice";
import { getPublishedPackages } from "@/lib/data/public";
import { buildStaticPageMetadata } from "@/lib/i18n";
import { CrossLinkServices } from "@/components/site/CrossLinkServices";
import { FaqSection } from "@/components/site/FaqSection";

// Admin-editable via Admin → Page SEO (page_seo table) — see buildStaticPageMetadata.
export async function generateMetadata(): Promise<Metadata> {
  return buildStaticPageMetadata({
    path: "/hajj",
    fallbackTitle: "Hajj Packages UAE | Masaar Holidays",
    fallbackDescription:
      "Hajj packages from the UAE with clear accommodation, transfers and guidance — planned around your family, not manufactured urgency.",
  });
}

export default async function HajjPage() {
  const packages = await getPublishedPackages("hajj");

  return (
    <>
      <Breadcrumbs items={[{ label: "Hajj" }]} />
      <HajjHero />

      <section className="py-16">
        <Container>
          <SectionHeading eyebrow="Thoughtfully Planned Hajj Journeys" title="Hajj Accommodation & Travel Support" />
          <p className="mx-auto mt-4 max-w-2xl text-center text-sm text-masaar-black/70 sm:text-base">
            Hajj asks for patience and preparation. Our Essential, Signature and Exclusive packages are built around comfort near the holy sites, without losing sight of what the journey means.
          </p>

          <div className="mt-10">
            <HajjPackageGrid
              packages={packages}
              emptyTitle="No Hajj packages published yet"
              emptyNote="Please check back soon, or contact us for the latest Hajj availability."
            />
          </div>

          <div className="mt-16">
            <HajjLeadCaptureForm />
          </div>
        </Container>
      </section>

      <section className="bg-warm-ivory py-16">
        <Container>
          <ImportantNotice
            title="What to Know Before Your Hajj Journey"
            points={[
              "Masaar does not claim guaranteed Hajj slots, guaranteed visas, or official quota allocations unless explicitly confirmed for your booking.",
              "Availability is limited and confirmed on a case-by-case basis — please enquire directly for current-season status.",
              "Final pricing, accommodation and transport are confirmed on WhatsApp before booking.",
            ]}
          />
        </Container>
      </section>

      <CrossLinkServices exclude="hajj" />

      <FaqSection category="hajj" />
    </>
  );
}
