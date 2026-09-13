import type { Metadata } from "next";
import { ContentPending, EmptyState, SectionHeading } from "@/components/site/SectionHeading";
import { Container } from "@/components/site/Container";
import { Hero } from "@/components/site/Hero";
import { ImportantNotice } from "@/components/site/ImportantNotice";
import { PackageCard } from "@/components/site/PackageCard";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { getPublishedPackages } from "@/lib/data/public";
import { WHATSAPP_TEMPLATES } from "@/lib/whatsapp-templates";

export const metadata: Metadata = {
  title: "Hajj Packages UAE | Masaar Holidays",
  description:
    "Hajj packages from the UAE with clear accommodation, transfers and guidance — planned around your family, not manufactured urgency.",
};

export default async function HajjPage() {
  const packages = await getPublishedPackages("hajj");

  return (
    <>
      <Hero
        eyebrow="Hajj Packages"
        h1="Hajj Packages from the UAE"
        image="/brand/banners/hajj.png"
      >
        <div className="mt-6 flex flex-wrap gap-3">
          <WhatsAppButton message={WHATSAPP_TEMPLATES.hajj}>
            Register Interest on WhatsApp
          </WhatsAppButton>
        </div>
      </Hero>

      <section className="py-16">
        <Container>
          <SectionHeading eyebrow="Thoughtfully Planned Hajj Journeys" title="Hajj Accommodation & Travel Support" />
          <div className="mx-auto mt-4 max-w-2xl text-center">
            <ContentPending />
          </div>

          <div className="mt-10">
            {packages.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {packages.map((pkg) => (
                  <PackageCard key={pkg.id} pkg={pkg} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No Hajj packages published yet"
                note="Waiting on the client's pricing/package document (brief Part 5)."
              />
            )}
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
    </>
  );
}
