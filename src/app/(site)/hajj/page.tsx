import type { Metadata } from "next";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Container } from "@/components/site/Container";
import { HajjPackageGrid } from "@/components/site/HajjPackageGrid";
import { Hero } from "@/components/site/Hero";
import { ImportantNotice } from "@/components/site/ImportantNotice";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { getPublishedPackages } from "@/lib/data/public";
import { buildStaticPageMetadata } from "@/lib/i18n";
import { CrossLinkServices } from "@/components/site/CrossLinkServices";

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
      <Hero
        eyebrow="Hajj Packages"
        h1="Hajj Packages from the UAE"
        image="/brand/banners/hajj.png"
      >
        {/* Draft copy pending Haseeb's approval */}
        <p className="mt-4 max-w-xl text-sm text-white/80 sm:text-base">
          A journey many wait a lifetime for. We handle the arrangements with care and clarity, so you can focus on what Hajj is truly for.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <WhatsAppButton templateKey="hajj">
            Register Interest on WhatsApp
          </WhatsAppButton>
        </div>
      </Hero>

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
              emptyNote="Waiting on the client's pricing/package document (brief Part 5)."
            />
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
    </>
  );
}
